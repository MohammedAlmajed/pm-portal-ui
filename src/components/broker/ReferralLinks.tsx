'use client';

import * as React from 'react';
import { Copy, Check, Link2, ChevronDown, Building2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/cn';

/**
 * The broker's share hub: for each developer that approved them, a browsable list of that
 * developer's PUBLIC projects. Every link carries the broker's opaque referral code
 * (?broker=<guid>) plus UTM tags, so a lead submitted through it is attributed to the broker
 * and shows up in "العملاء المحتملون". Public-project data comes from the developer's own
 * public endpoint (read with their tenant host) — no per-developer backend needed.
 */
export interface ReferralProject {
  id: number;
  name: string;
}
export interface ReferralDeveloper {
  name: string;
  domain?: string;
  projects: ReferralProject[];
}

const UTM = 'utm_source=broker&utm_medium=referral';

function projectLink(domain: string, projectId: number, code: string) {
  return `https://${domain}/project/${projectId}?broker=${code}&${UTM}&utm_campaign=${code}`;
}
function generalLink(domain: string, code: string) {
  return `https://${domain}/interest-request?broker=${code}&${UTM}&utm_campaign=${code}`;
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = React.useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  }
  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? 'تم النسخ' : 'نسخ الرابط'}
      className={cn(
        'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors',
        copied
          ? 'bg-success-subtle text-success'
          : 'bg-surface text-muted hover:bg-surface-sunken hover:text-foreground',
      )}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
      {copied ? 'تم النسخ' : 'نسخ'}
    </button>
  );
}

function DeveloperRow({ dev, code }: { dev: ReferralDeveloper; code: string }) {
  const [open, setOpen] = React.useState(false);
  if (!dev.domain) return null;

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 bg-surface p-3 text-start transition-colors hover:bg-surface-sunken"
      >
        <Building2 size={18} className="shrink-0 text-brand" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{dev.name}</p>
          <p className="text-xs text-muted">
            {dev.projects.length > 0
              ? `${dev.projects.length} مشروع متاح`
              : 'رابط عام فقط'}
          </p>
        </div>
        <ChevronDown
          size={18}
          className={cn('shrink-0 text-muted transition-transform', open && 'rotate-180')}
        />
      </button>

      {open && (
        <div className="flex flex-col gap-2 border-t border-border bg-surface-sunken p-3">
          {/* General link — the developer's full catalogue */}
          <div className="flex items-center gap-2 rounded-md border border-border bg-surface p-2">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-foreground">كل المشاريع</p>
              <p className="truncate text-[11px] text-muted" dir="ltr">
                {generalLink(dev.domain, code)}
              </p>
            </div>
            <CopyButton value={generalLink(dev.domain, code)} />
          </div>

          {/* Per-project links */}
          {dev.projects.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-2 rounded-md border border-border bg-surface p-2"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-foreground">{p.name}</p>
                <p className="truncate text-[11px] text-muted" dir="ltr">
                  {projectLink(dev.domain!, p.id, code)}
                </p>
              </div>
              <CopyButton value={projectLink(dev.domain!, p.id, code)} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ReferralLinks({
  code,
  developers,
}: {
  code?: string;
  developers: ReferralDeveloper[];
}) {
  if (!code) return null;

  const withDomain = developers.filter((d) => d.domain);

  return (
    <Card className="flex flex-col gap-3 p-5">
      <div className="flex items-center gap-2">
        <Link2 size={18} className="text-brand" />
        <h3 className="text-sm font-semibold text-foreground">روابط الإحالة</h3>
      </div>
      <p className="text-sm text-muted">
        اختر مطوّرًا وانسخ رابط أي مشروع لمشاركته — كل من يسجّل اهتمامه عبره يُنسب إليك ويظهر في
        «العملاء المحتملون».
      </p>

      {withDomain.length === 0 ? (
        <p className="rounded-md bg-warning-subtle px-3 py-2 text-sm text-warning">
          ستظهر روابط الإحالة هنا بعد اعتماد أحد المطوّرين لطلبك.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {withDomain.map((d) => (
            <DeveloperRow key={d.domain} dev={d} code={code} />
          ))}
        </div>
      )}
    </Card>
  );
}
