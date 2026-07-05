import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { User, TenantMembership, Role } from '@veyrasend/db';
import { InjectDataSource } from '../../common/db.module';
import { assertTenant } from '../../common/scoped';
import * as argon2 from 'argon2';

export interface TenantUserRow {
  userId: string;
  email: string;
  name: string | null;
  roleId: string;
  roleName: string;
  permissions: string[];
  createdAt: Date;
}

@Injectable()
export class UsersService {
  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  async listForTenant(tenantId: string): Promise<TenantUserRow[]> {
    const tid = assertTenant(tenantId);
    const memberships = await this.ds.getRepository(TenantMembership).find({
      where: { tenantId: tid },
      relations: { user: true, role: true },
      order: { createdAt: 'ASC' },
    });
    return memberships.map((m) => ({
      userId: m.user.id,
      email: m.user.email,
      name: m.user.name,
      roleId: m.role.id,
      roleName: m.role.name,
      permissions: m.role.permissions ?? [],
      createdAt: m.createdAt,
    }));
  }

  async createUserInTenant(args: {
    tenantId: string;
    email: string;
    password: string;
    name?: string | null;
    roleName: string;
  }): Promise<TenantUserRow> {
    const tid = assertTenant(args.tenantId);
    const email = args.email.toLowerCase();

    const role = await this.ds.getRepository(Role).findOne({
      where: { tenantId: tid, name: args.roleName },
    });
    if (!role) {
      throw new BadRequestException(`Role '${args.roleName}' does not exist in this tenant.`);
    }

    const existing = await this.ds
      .getRepository(TenantMembership)
      .createQueryBuilder('m')
      .innerJoinAndSelect('m.user', 'user')
      .where('m.tenant_id = :tid', { tid })
      .andWhere('user.email = :email', { email })
      .getOne();
    if (existing) {
      throw new ConflictException(`User '${email}' is already a member of this tenant.`);
    }

    return this.ds.transaction(async (em) => {
      // Reuse a global user record if one exists (same person, another tenant).
      let user = await em.getRepository(User).findOne({ where: { email } });
      if (!user) {
        user = em.create(User, {
          email,
          passwordHash: await argon2.hash(args.password, { type: argon2.argon2id }),
          name: args.name ?? null,
        });
        await em.save(User, user);
      } else {
        // Refresh password for the caller's knowledge of this identity.
        user.passwordHash = await argon2.hash(args.password, { type: argon2.argon2id });
        if (args.name) user.name = args.name;
        await em.save(User, user);
      }

      const membership = em.create(TenantMembership, {
        tenantId: tid,
        userId: user.id,
        roleId: role.id,
      });
      await em.save(TenantMembership, membership);

      return {
        userId: user.id,
        email: user.email,
        name: user.name,
        roleId: role.id,
        roleName: role.name,
        permissions: role.permissions ?? [],
        createdAt: membership.createdAt,
      };
    });
  }

  async updateMembershipRole(args: {
    tenantId: string;
    userId: string;
    roleName: string;
  }): Promise<TenantUserRow> {
    const tid = assertTenant(args.tenantId);
    const role = await this.ds.getRepository(Role).findOne({
      where: { tenantId: tid, name: args.roleName },
    });
    if (!role) {
      throw new BadRequestException(`Role '${args.roleName}' does not exist in this tenant.`);
    }

    const membership = await this.ds
      .getRepository(TenantMembership)
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.role', 'role')
      .leftJoinAndSelect('m.user', 'user')
      .where('m.tenant_id = :tid', { tid })
      .andWhere('m.user_id = :uid', { uid: args.userId })
      .getOne();
    if (!membership) {
      throw new NotFoundException('User is not a member of this tenant.');
    }
    if (membership.role.isSystem && membership.role.name === 'owner') {
      throw new BadRequestException('Cannot reassign the owner role.');
    }

    membership.roleId = role.id;
    await this.ds.getRepository(TenantMembership).save(membership);

    return {
      userId: membership.user.id,
      email: membership.user.email,
      name: membership.user.name,
      roleId: role.id,
      roleName: role.name,
      permissions: role.permissions ?? [],
      createdAt: membership.createdAt,
    };
  }

  async listRoles(tenantId: string): Promise<{ id: string; name: string; isSystem: boolean; permissions: string[] }[]> {
    const tid = assertTenant(tenantId);
    const roles = await this.ds.getRepository(Role).find({
      where: { tenantId: tid },
      order: { name: 'ASC' },
    });
    return roles.map((r) => ({ id: r.id, name: r.name, isSystem: r.isSystem, permissions: r.permissions ?? [] }));
  }
}
