import type { Event } from '@/lib/db/schema';

interface EventsLogProps {
  events: Event[];
}

export function EventsLog({ events }: EventsLogProps) {
  const getSeverityStyle = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'error':
        return {
          icon: '❌',
          badge: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
          border: 'border-l-rose-500',
        };
      case 'warning':
        return {
          icon: '⚠️',
          badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
          border: 'border-l-amber-500',
        };
      case 'info':
      default:
        return {
          icon: 'ℹ️',
          badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
          border: 'border-l-blue-500',
        };
    }
  };

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800/80 mb-4">
        <div>
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Journal des Événements
          </h3>
          <p className="text-xs text-zinc-500">
            Les 50 derniers événements enregistrés par le collecteur
          </p>
        </div>
        <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
          {events.length} entrées
        </span>
      </div>

      {events.length === 0 ? (
        <p className="text-sm text-zinc-500 py-8 text-center">
          Aucun événement répertorié.
        </p>
      ) : (
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60 max-h-[460px] overflow-y-auto pr-1">
          {events.map((ev) => {
            const style = getSeverityStyle(ev.severity);
            const timeStr = new Date(ev.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            });

            return (
              <div
                key={ev.id}
                className={`py-3 px-3 my-1 rounded-lg border-l-4 ${style.border} bg-zinc-50/50 dark:bg-zinc-800/30 flex items-start justify-between gap-3 transition-colors hover:bg-zinc-100/60 dark:hover:bg-zinc-800/60`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <span className="text-base select-none mt-0.5">{style.icon}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs font-semibold font-mono text-zinc-800 dark:text-zinc-200">
                        {ev.type}
                      </span>
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${style.badge}`}
                      >
                        {ev.severity}
                      </span>
                      <span className="text-[11px] text-zinc-400 font-mono">
                        {ev.printerId}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-700 dark:text-zinc-300 break-words">
                      {ev.message}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <time className="text-[11px] font-mono text-zinc-400">
                    {timeStr}
                  </time>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
