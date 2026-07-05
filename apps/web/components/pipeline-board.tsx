'use client';

import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/client-api';

interface StageRow { id: string; name: string; position: number; isWon: boolean; isLost: boolean; }
interface PipelineRow { id: string; name: string; stages: StageRow[]; }
interface DealRow { id: string; name: string; stageId: string; valueCents: string | null; status: string; contactId: string | null; }

export function PipelineBoard({ canWrite }: { canWrite: boolean }) {
  const qc = useQueryClient();
  const { data: pipelines = [], isLoading } = useQuery({
    queryKey: ['pipelines'],
    queryFn: async () => {
      const r = await api<PipelineRow[]>('GET', '/api/pipelines');
      if (!r.data) throw new Error(r.error ?? 'Failed to load pipelines');
      return r.data;
    },
  });

  const [pipelineId, setPipelineId] = React.useState<string | null>(null);
  const activePipeline = pipelines.find((p) => p.id === pipelineId) ?? pipelines[0] ?? null;

  const { data: deals = [] } = useQuery({
    queryKey: ['deals', activePipeline?.id],
    enabled: !!activePipeline,
    queryFn: async () => {
      const r = await api<DealRow[]>('GET', `/api/deals?pipelineId=${activePipeline!.id}`);
      if (!r.data) throw new Error(r.error ?? 'Failed to load deals');
      return r.data;
    },
  });

  const moveDeal = useMutation({
    mutationFn: async ({ dealId, stageId }: { dealId: string; stageId: string }) => {
      const r = await api('POST', `/api/deals/${dealId}/move`, { stageId });
      if (!r.data) throw new Error(r.error ?? 'Move failed');
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['deals', activePipeline?.id] }),
  });

  const createPipeline = useMutation({
    mutationFn: async (name: string) => {
      const r = await api<PipelineRow>('POST', '/api/pipelines', {
        name,
        stages: [
          { name: 'New', position: 0 },
          { name: 'Qualified', position: 1 },
          { name: 'Won', position: 2, isWon: true },
        ],
      });
      if (!r.data) throw new Error(r.error ?? 'Create failed');
      return r.data;
    },
    onSuccess: (p) => {
      qc.invalidateQueries({ queryKey: ['pipelines'] });
      setPipelineId(p.id);
    },
  });

  const createDeal = useMutation({
    mutationFn: async (name: string) => {
      if (!activePipeline?.stages[0]) throw new Error('No pipeline');
      const r = await api('POST', '/api/deals', {
        pipelineId: activePipeline.id,
        stageId: activePipeline.stages[0].id,
        name,
      });
      if (!r.data) throw new Error(r.error ?? 'Create failed');
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['deals', activePipeline?.id] }),
  });

  if (isLoading) return <p className="caption">Loading pipelines…</p>;

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {pipelines.map((p) => (
          <button key={p.id} className={p.id === activePipeline?.id ? 'btn-primary' : 'btn-ghost'} onClick={() => setPipelineId(p.id)}>
            {p.name}
          </button>
        ))}
        {canWrite ? (
          <button className="btn-ghost" onClick={() => {
            const name = prompt('Pipeline name');
            if (name?.trim()) createPipeline.mutate(name.trim());
          }}>+ Pipeline</button>
        ) : null}
      </div>

      {!activePipeline ? (
        <div className="card"><p className="body-sm">No pipelines yet. Create one to start tracking deals.</p></div>
      ) : (
        <>
          {canWrite ? (
            <form className="card form" style={{ marginBottom: 16 }} onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const name = String(fd.get('name') ?? '');
              if (name.trim()) createDeal.mutate(name.trim());
              e.currentTarget.reset();
            }}>
              <div className="field"><label>New deal</label><input name="name" placeholder="Deal name" required /></div>
              <button className="btn-primary" type="submit">Add deal</button>
            </form>
          ) : null}
          <div className="kanban" style={{ display: 'flex', gap: 12, overflowX: 'auto' }}>
            {activePipeline.stages.map((stage) => {
              const stageDeals = deals.filter((d) => d.stageId === stage.id);
              return (
                <div key={stage.id} className="card" style={{ minWidth: 220, flex: '0 0 auto' }}>
                  <h3 style={{ margin: '0 0 12px', fontSize: 14 }}>{stage.name}</h3>
                  {stageDeals.map((deal) => (
                    <div key={deal.id} className="card" style={{ marginBottom: 8, padding: 12 }}>
                      <a href={`/deals/${deal.id}`}><strong>{deal.name}</strong></a>
                      {canWrite && activePipeline.stages.length > 1 ? (
                        <select
                          style={{ marginTop: 8, width: '100%' }}
                          value={deal.stageId}
                          onChange={(e) => moveDeal.mutate({ dealId: deal.id, stageId: e.target.value })}
                        >
                          {activePipeline.stages.map((s) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      ) : null}
                    </div>
                  ))}
                  {stageDeals.length === 0 ? <p className="caption">No deals</p> : null}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
