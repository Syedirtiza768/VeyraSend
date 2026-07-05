import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Tenant, Role, User, TenantMembership, PERMISSIONS } from '@veyrasend/db';
import { InjectDataSource } from '../../common/db.module';
import * as argon2 from 'argon2';

export interface SystemRoleSpec {
  name: string;
  permissions: string[];
}

export const SYSTEM_ROLE_SPECS: SystemRoleSpec[] = [
  { name: 'owner', permissions: [...PERMISSIONS] },
  {
    name: 'admin',
    permissions: [
      'users:read', 'users:write', 'users:delete', 'tenants:read', 'audit:read',
      'senders:read', 'senders:write', 'domains:read', 'domains:write',
      'messages:read', 'messages:write', 'events:read',
      'contacts:read', 'contacts:write', 'contacts:delete',
      'lists:read', 'lists:write', 'lists:delete',
      'segments:read', 'segments:write', 'segments:delete',
      'suppressions:read', 'suppressions:write',
      'templates:read', 'templates:write', 'templates:delete',
      'campaigns:read', 'campaigns:write', 'campaigns:delete',
      'automations:read', 'automations:write', 'automations:delete',
      'inbound:read', 'analytics:read', 'settings:read', 'settings:write', 'usage:read',
      'companies:read', 'companies:write', 'companies:delete',
      'pipelines:read', 'pipelines:write', 'pipelines:delete',
      'deals:read', 'deals:write', 'deals:delete',
      'tasks:read', 'tasks:write', 'tasks:delete',
      'notes:read', 'notes:write', 'notes:delete',
      'tags:read', 'tags:write', 'tags:delete',
      'custom-fields:read', 'custom-fields:write', 'custom-fields:delete',
      'twilio:provision', 'phone-numbers:read', 'phone-numbers:write', 'phone-numbers:delete',
      'calls:read', 'calls:write',
      'conversations:read', 'conversations:write',
      'workflows:read', 'workflows:write', 'workflows:publish',
      'calendar:read', 'calendar:write', 'appointments:read', 'appointments:write',
      'forms:read', 'forms:write', 'forms:delete',
      'funnels:read', 'funnels:write', 'funnels:delete',
      'reputation:read', 'reputation:write',
      'billing:read', 'billing:write',
      'agency:sub-accounts:read', 'agency:sub-accounts:write', 'agency:act-as',
      'agency:branding:read', 'agency:branding:write',
      'agency:billing-plans:read', 'agency:feature-flags:read', 'agency:feature-flags:write',
    ],
  },
  {
    name: 'member',
    permissions: [
      'tenants:read', 'contacts:read', 'lists:read', 'templates:read', 'campaigns:read',
      'companies:read', 'pipelines:read', 'deals:read', 'tasks:read', 'notes:read', 'tags:read', 'custom-fields:read',
      'phone-numbers:read', 'calls:read', 'conversations:read', 'workflows:read',
      'calendar:read', 'appointments:read', 'forms:read', 'funnels:read', 'reputation:read',
      'billing:read',
      'agency:sub-accounts:read', 'agency:branding:read', 'agency:billing-plans:read', 'agency:feature-flags:read',
    ],
  },
];

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

@Injectable()
export class TenantsService {
  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  async createTenantWithOwner(args: {
    name: string;
    slug: string;
    ownerEmail: string;
    ownerPassword: string;
    ownerName?: string | null;
    type?: 'direct' | 'agency' | 'sub_account';
    parentTenantId?: string | null;
    billingPlanId?: string | null;
  }): Promise<{ tenant: Tenant; owner: User }> {
    const email = args.ownerEmail.toLowerCase();
    const existingTenant = await this.ds.getRepository(Tenant).findOne({ where: { slug: args.slug } });
    if (existingTenant) {
      throw new ConflictException(`Tenant slug '${args.slug}' already exists.`);
    }
    const existingUser = await this.ds.getRepository(User).findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException(`User '${email}' already exists.`);
    }

    if (args.parentTenantId) {
      const parent = await this.ds.getRepository(Tenant).findOne({ where: { id: args.parentTenantId } });
      if (!parent) throw new NotFoundException('Parent tenant not found.');
      if (parent.type === 'sub_account') {
        throw new BadRequestException('nesting_not_allowed');
      }
      if (args.type === 'sub_account' && parent.type !== 'agency') {
        throw new BadRequestException('invalid_parent_for_sub_account');
      }
    }

    return this.ds.transaction(async (em) => {
      const tenant = em.create(Tenant, {
        name: args.name,
        slug: args.slug,
        type: args.type ?? 'direct',
        parentTenantId: args.parentTenantId ?? null,
        billingPlanId: args.billingPlanId ?? null,
      });
      await em.save(Tenant, tenant);

      // Seed system roles for this tenant.
      const roleMap = new Map<string, Role>();
      for (const spec of SYSTEM_ROLE_SPECS) {
        const role = em.create(Role, {
          tenantId: tenant.id,
          name: spec.name,
          isSystem: true,
          permissions: spec.permissions,
        });
        await em.save(Role, role);
        roleMap.set(spec.name, role);
      }

      const owner = em.create(User, {
        email,
        passwordHash: await argon2.hash(args.ownerPassword, { type: argon2.argon2id }),
        name: args.ownerName ?? null,
      });
      await em.save(User, owner);

      const membership = em.create(TenantMembership, {
        tenantId: tenant.id,
        userId: owner.id,
        roleId: roleMap.get('owner')!.id,
      });
      await em.save(TenantMembership, membership);

      return { tenant, owner };
    });
  }

  async getTenant(id: string): Promise<Tenant> {
    const tenant = await this.ds.getRepository(Tenant).findOne({ where: { id } });
    if (!tenant) throw new NotFoundException('Tenant not found.');
    return tenant;
  }

  async countTenants(): Promise<number> {
    return this.ds.getRepository(Tenant).count();
  }
}
