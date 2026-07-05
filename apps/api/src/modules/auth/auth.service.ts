import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '../../common/db.module';
import { User, TenantMembership, Role, Tenant } from '@veyrasend/db';
import * as argon2 from 'argon2';
import type { AuthUser } from '../../common/auth.types';

export interface MembershipInfo {
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  roleId: string;
  roleName: string;
  permissions: string[];
}

@Injectable()
export class AuthService {
  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  async findUserByEmail(email: string): Promise<User | null> {
    return this.ds.getRepository(User).findOne({ where: { email: email.toLowerCase() } });
  }

  async verifyPassword(user: User, password: string): Promise<boolean> {
    try {
      return await argon2.verify(user.passwordHash, password);
    } catch {
      return false;
    }
  }

  async hashPassword(password: string): Promise<string> {
    return argon2.hash(password, { type: argon2.argon2id });
  }

  async loadMemberships(userId: string): Promise<MembershipInfo[]> {
    const memberships = await this.ds.getRepository(TenantMembership).find({
      where: { userId },
      relations: { role: true },
    });
    if (memberships.length === 0) return [];
    const tenantIds = memberships.map((m) => m.tenantId);
    const tenants = await this.ds.getRepository(Tenant).find({
      where: tenantIds.map((id) => ({ id })),
    });
    const tenantMap = new Map(tenants.map((t) => [t.id, t]));
    return memberships
      .map((m) => {
        const t = tenantMap.get(m.tenantId);
        if (!t) return null;
        return {
          tenantId: m.tenantId,
          tenantName: t.name,
          tenantSlug: t.slug,
          roleId: m.roleId,
          roleName: m.role.name,
          permissions: m.role.permissions ?? [],
        } satisfies MembershipInfo;
      })
      .filter((x): x is MembershipInfo => x !== null);
  }

  async loadAuthUser(
    userId: string,
    tenantId: string,
    opts?: { homeTenantId?: string; actAsElevation?: boolean },
  ): Promise<AuthUser | null> {
    const memberships = await this.loadMemberships(userId);
    const homeTenantId = opts?.homeTenantId;
    const membershipTenantId = opts?.actAsElevation && homeTenantId ? homeTenantId : tenantId;
    const m = memberships.find((mm) => mm.tenantId === membershipTenantId);
    if (!m) return null;

    if (opts?.actAsElevation && homeTenantId) {
      const sub = await this.ds.getRepository(Tenant).findOne({ where: { id: tenantId } });
      const home = await this.ds.getRepository(Tenant).findOne({ where: { id: homeTenantId } });
      if (!sub || sub.parentTenantId !== homeTenantId || home?.type !== 'agency') return null;
    }

    const user = await this.ds.getRepository(User).findOne({ where: { id: userId } });
    if (!user) return null;

    const authUser: AuthUser = {
      userId: user.id,
      email: user.email,
      name: user.name,
      tenantId,
      roleId: m.roleId,
      roleName: m.roleName,
      permissions: m.permissions,
    };

    if (opts?.actAsElevation && homeTenantId) {
      const sub = await this.ds.getRepository(Tenant).findOne({ where: { id: tenantId } });
      const home = await this.ds.getRepository(Tenant).findOne({ where: { id: homeTenantId } });
      if (sub && home) {
        authUser.actAs = {
          homeTenantId,
          homeTenantName: home.name,
          subAccountId: sub.id,
          subAccountName: sub.name,
        };
      }
    }

    return authUser;
  }
}
