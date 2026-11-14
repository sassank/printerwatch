'use client';

import { useEffect, useState } from 'react';
import type { Snapshot } from '@/lib/db/schema';

interface LiveStatusCardProps {
  initialSnapshot: Snapshot | null;
}

export function LiveStatusCard({ initialSnapshot }: LiveStatusCardProps) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(initialSnapshot);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  useEffect(() => {
    let eventSource: EventSource | null = null;

    try {
      eventSource = new EventSource('/api/stream');

      eventSource.onopen = () => {
        setIsConnected(true);
      };

      eventSource.onmessage = (event) => {
        try {
          const data: Snapshot = JSON.parse(event.data);
          setSnapshot(data);
          setIsConnected(true);
        } catch (err) {
          console.error('[LiveStatusCard] Parse error:', err);
        }
      };

      eventSource.onerror = () => {
        setIsConnected(false);
      };
    } catch (err) {
      console.error('[LiveStatusCard] SSE Connection error:', err);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, []);

  if (!snapshot) {
    return (
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
        <p className="text-zinc-500">Aucun snapshot disponible pour le moment.</p>
      </div>
    );
  }

  // Configuration du badge de statut
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'online':
        return {
          label: 'En ligne',
          className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
          dot: 'bg-emerald-500',
        };
      case 'warning':
        return {
          label: 'Avertissement',
          className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
          dot: 'bg-amber-500',
        };
      case 'error':
        return {
          label: 'Erreur',
          className: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
          dot: 'bg-rose-500',
        };
      default:
        return {
          label: status,
          className: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/30',
          dot: 'bg-zinc-400',
        };
    }
  };

  const statusBadge = getStatusBadge(snapshot.status);

  // Couleurs de la jauge de toner
  const getTonerColor = (level: number) => {
    if (level <= 15) return 'bg-rose-500';
    if (level <= 30) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const formattedDate = new Date(snapshot.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800/80">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xl">
            🖨️
          </div>
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {snapshot.printerId}
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Dernière mise à jour : {formattedDate}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Indicateur SSE Live */}
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
              isConnected
                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30'
                : 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20'
            }`}
            title={isConnected ? 'Connecté au flux SSE direct' : 'Reconnexion SSE...'}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isConnected ? 'bg-blue-500 animate-pulse' : 'bg-zinc-400'
              }`}
            />
            {isConnected ? 'LIVE SSE' : 'DÉCONNECTÉ'}
          </span>

          {/* Badge de statut */}
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusBadge.className}`}
          >
            <span className={`h-2 w-2 rounded-full ${statusBadge.dot}`} />
            {statusBadge.label}
          </span>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Jauge de toner */}
        <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800/50 p-4 border border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Niveau de Toner
            </span>
            <span className="text-base font-bold text-zinc-900 dark:text-zinc-100 font-mono">
              {snapshot.tonerLevel}%
            </span>
          </div>

          <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
            <div
              className={`h-full rounded-full transition-all duration-500 ease-out ${getTonerColor(
                snapshot.tonerLevel
              )}`}
              style={{ width: `${Math.min(100, Math.max(0, snapshot.tonerLevel))}%` }}
            />
          </div>

          <div className="mt-2 flex justify-between text-[11px] text-zinc-400">
            <span>0% (Vide)</span>
            <span>Alerte &lt;15%</span>
            <span>100% (Plein)</span>
          </div>
        </div>

        {/* Compteur de pages */}
        <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800/50 p-4 border border-zinc-100 dark:border-zinc-800 flex flex-col justify-between">
          <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            Compteur Total de Pages
          </span>
          <div className="my-1">
            <div className="text-2xl font-bold font-mono tracking-tight text-zinc-900 dark:text-zinc-100">
              {snapshot.pagesTotal.toLocaleString('fr-FR')}
            </div>
          </div>
          <span className="text-xs text-zinc-500">
            Cumul des impressions enregistrées
          </span>
        </div>
      </div>
    </div>
  );
}
