'use client';

import * as React from 'react';
import { BadgeCheck, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

type LeadStatus = 'New' | 'Contacted' | 'NoResponse' | 'Interested' | 'NotInterested';

export interface Lead {
  id: number;
  customerName: string;
  projectName?: string;
  developerName?: string;
  status: LeadStatus;
  createdAt: string;
}

const STATUS_LABEL: Record<LeadStatus, string> = {
  New: 'جديد',
  Contacted: 'تم التواصل',
  NoResponse: 'لا يوجد رد',
  Interested: 'مهتم',
  NotInterested: 'غير مهتم',
};
const STATUS_TONE = {
  New: 'info',
  Contacted: 'brand',
  NoResponse: 'neutral',
  Interested: 'success',
  NotInterested: 'danger',
} as const;

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('ar', { year: 'numeric', month: 'long', day: 'numeric' });
}

/**
 * The broker's leads list. Every referred lead is shown — the list is never filtered. Attribution
 * (did the lead arrive inside an approved period?) is a FACT CHECK behind a deliberately quiet button:
 * it fetches the approval windows on demand and annotates each row, so nothing is fetched on load.
 */
export function LeadsList({ leads }: { leads: Lead[] }) {
  const [attribution, setAttribution] = React.useState<Record<number, boolean> | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function check() {
    setLoading(true);
    try {
      const rows = (await (
        await fetch('/api/identity/broker/leads/attribution')
      ).json()) as { id: number; withinApprovedWindow: boolean }[];
      const map: Record<number, boolean> = {};
      for (const r of rows) map[r.id] = r.withinApprovedWindow;
      setAttribution(map);
    } catch {
      /* silent: the fact check is optional and non-blocking */
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Quiet, occasional control — not a primary action. */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={check}
          disabled={loading}
          title="يتحقق مما إذا كان كل مهتمّ قد وصل خلال فترة اعتمادك لدى المطوّر. للاطّلاع فقط، ولا يؤثّر على القائمة أو على حالة المهتمّين."
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted transition-colors hover:text-foreground disabled:opacity-50"
        >
          {loading ? <Loader2 size={13} className="animate-spin" /> : <BadgeCheck size={14} />}
          التحقق من الإسناد
        </button>
      </div>

      <Card className="divide-y divide-border">
        {leads.map((l) => {
          const within = attribution?.[l.id];
          return (
            <div key={l.id} className="flex items-center justify-between gap-4 p-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{l.customerName}</p>
                <p className="truncate text-xs text-muted">
                  {[l.projectName, l.developerName].filter(Boolean).join(' · ')}
                  {l.projectName || l.developerName ? ' · ' : ''}
                  <span className="num">{fmtDate(l.createdAt)}</span>
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {within !== undefined ? (
                  <Badge tone={within ? 'success' : 'neutral'}>
                    {within ? 'ضمن فترة الاعتماد' : 'خارج فترة الاعتماد'}
                  </Badge>
                ) : null}
                <Badge tone={STATUS_TONE[l.status]}>{STATUS_LABEL[l.status]}</Badge>
              </div>
            </div>
          );
        })}
      </Card>
    </div>
  );
}
