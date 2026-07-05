import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Funnel, FunnelStep, LandingPage, type LandingPageSection } from '@veyrasend/db';
import { randomBytes } from 'crypto';
import { InjectDataSource } from '../../common/db.module';
import { assertTenant } from '../../common/scoped';
import { slugifyBooking } from '../calendar/slot-utils';

@Injectable()
export class FunnelsService {
  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  async listPages(tenantId: string) {
    const tid = assertTenant(tenantId);
    const rows = await this.ds.getRepository(LandingPage).find({ where: { tenantId: tid }, order: { createdAt: 'DESC' } });
    return rows.map((p) => this.pageRow(p));
  }

  async createPage(tenantId: string, name: string, content: LandingPageSection[] = []): Promise<unknown> {
    const tid = assertTenant(tenantId);
    const trimmed = name.trim();
    if (!trimmed) throw new BadRequestException('name is required');
    const slug = `${slugifyBooking(trimmed) || 'page'}-${randomBytes(4).toString('hex')}`;
    const row = this.ds.getRepository(LandingPage).create({ tenantId: tid, name: trimmed, slug, content, published: false });
    await this.ds.getRepository(LandingPage).save(row);
    return this.pageRow(row);
  }

  async updatePage(tenantId: string, id: string, patch: { name?: string; content?: LandingPageSection[]; published?: boolean }) {
    const tid = assertTenant(tenantId);
    const row = await this.ds.getRepository(LandingPage).findOne({ where: { id, tenantId: tid } });
    if (!row) throw new NotFoundException('Landing page not found.');
    if (patch.name !== undefined) row.name = patch.name.trim();
    if (patch.content !== undefined) row.content = patch.content;
    if (patch.published !== undefined) row.published = patch.published;
    await this.ds.getRepository(LandingPage).save(row);
    return this.pageRow(row);
  }

  async publicPage(slug: string) {
    const page = await this.ds.getRepository(LandingPage).findOne({ where: { slug } });
    if (!page) throw new NotFoundException('Page not found.');
    if (!page.published) {
      return { available: false, reason: 'not_published' };
    }
    return { available: true, page: this.pageRow(page) };
  }

  async listFunnels(tenantId: string) {
    const tid = assertTenant(tenantId);
    const funnels = await this.ds.getRepository(Funnel).find({ where: { tenantId: tid }, order: { createdAt: 'DESC' } });
    const out = [];
    for (const f of funnels) {
      const steps = await this.ds.getRepository(FunnelStep).find({ where: { tenantId: tid, funnelId: f.id }, order: { position: 'ASC' } });
      out.push({ id: f.id, name: f.name, steps, createdAt: f.createdAt.toISOString() });
    }
    return out;
  }

  async createFunnel(tenantId: string, name: string, steps: Array<{ landingPageId: string; position: number }>) {
    const tid = assertTenant(tenantId);
    const funnel = this.ds.getRepository(Funnel).create({ tenantId: tid, name: name.trim() });
    await this.ds.getRepository(Funnel).save(funnel);
    for (const s of steps) {
      await this.ds.getRepository(FunnelStep).save(
        this.ds.getRepository(FunnelStep).create({ tenantId: tid, funnelId: funnel.id, landingPageId: s.landingPageId, position: s.position }),
      );
    }
    return { id: funnel.id, name: funnel.name };
  }

  private pageRow(p: LandingPage) {
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      content: p.content,
      published: p.published,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    };
  }
}
