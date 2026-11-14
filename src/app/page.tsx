import { Suspense } from 'react';
import { desc, gte, asc } from 'drizzle-orm';
import { connection } from 'next/server';
import { db } from '@/lib/db';
import { snapshots, events } from '@/lib/db/schema';
import { LiveStatusCard } from '@/components/LiveStatusCard';
import { MetricsChart, MetricsPoint } from '@/components/MetricsChart';
import { EventsLog } from '@/components/EventsLog';

export const instant = false;

async function DashboardContent() {
  await connection();

  // 1. Récupération du snapshot le plus récent
  const [latestSnapshot] = await db
    .select()
    .from(snapshots)
    .orderBy(desc(snapshots.id))
    .limit(1);

  // 2. Récupération des snapshots sur les dernières 24h pour le graphique
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  let metricsRows = await db
    .select()
    .from(snapshots)
    .where(gte(snapshots.createdAt, twentyFourHoursAgo))
    .orderBy(asc(snapshots.createdAt));

  // Fallback si pas de données sur 24h : prend les 100 derniers snapshots
  if (metricsRows.length === 0) {
    const fallback = await db
      .select()
      .from(snapshots)
      .orderBy(desc(snapshots.id))
      .limit(100);
    metricsRows = fallback.reverse();
  }

  const chartData: MetricsPoint[] = metricsRows.map((s) => ({
    time: new Date(s.createdAt).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
    fullDate: new Date(s.createdAt).toLocaleString([], {
      dateStyle: 'short',
      timeStyle: 'medium',
    }),
    toner: s.tonerLevel,
    pages: s.pagesTotal,
  }));

  // 3. Récupération des 50 derniers événements
  const recentEvents = await db
    .select()
    .from(events)
    .orderBy(desc(events.createdAt))
    .limit(50);

  return (
    <div className="space-y-8">
      {/* 1. Carte d'état actuel en direct */}
      <section>
        <LiveStatusCard initialSnapshot={latestSnapshot ?? null} />
      </section>

      {/* 2. Graphique d'évolution Recharts */}
      <section>
        <MetricsChart data={chartData} />
      </section>

      {/* 3. Journal des 50 derniers événements */}
      <section>
        <EventsLog events={recentEvents} />
      </section>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-44 rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
      <div className="h-80 rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
      <div className="h-96 rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 p-4 sm:p-8 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* En-tête */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-3xl">🖨️</span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                PrinterWatch
              </h1>
            </div>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Surveillance et télémétrie des imprimantes en temps réel
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Collecteur actif
            </span>
          </div>
        </header>

        {/* Contenu dynamique dans un Suspense Boundary */}
        <Suspense fallback={<DashboardSkeleton />}>
          <DashboardContent />
        </Suspense>
      </div>
    </div>
  );
}
