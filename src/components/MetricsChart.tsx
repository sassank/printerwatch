'use client';

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

export interface MetricsPoint {
  time: string;
  fullDate: string;
  toner: number;
  pages: number;
}

interface MetricsChartProps {
  data: MetricsPoint[];
}

export function MetricsChart({ data }: MetricsChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm flex items-center justify-center min-h-[320px]">
        <p className="text-sm text-zinc-500">
          Aucune donnée d&apos;historique sur les dernières 24 heures.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 gap-2 border-b border-zinc-100 dark:border-zinc-800/80 mb-6">
        <div>
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Évolution du Toner &amp; Pages imprimées
          </h3>
          <p className="text-xs text-zinc-500">
            Historique des dernières 24 heures ({data.length} points de mesure)
          </p>
        </div>
      </div>

      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 11, fill: '#888888' }}
              tickLine={false}
              axisLine={{ stroke: '#444444', opacity: 0.2 }}
            />
            {/* Axe Y gauche : Niveau de Toner (0 à 100%) */}
            <YAxis
              yAxisId="toner"
              domain={[0, 100]}
              tick={{ fontSize: 11, fill: '#10b981' }}
              tickLine={false}
              axisLine={{ stroke: '#10b981', opacity: 0.4 }}
              unit="%"
            />
            {/* Axe Y droite : Compteur de pages */}
            <YAxis
              yAxisId="pages"
              orientation="right"
              domain={['auto', 'auto']}
              tick={{ fontSize: 11, fill: '#6366f1' }}
              tickLine={false}
              axisLine={{ stroke: '#6366f1', opacity: 0.4 }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload as MetricsPoint;
                  return (
                    <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-3 shadow-lg text-xs">
                      <p className="font-semibold text-zinc-700 dark:text-zinc-200 mb-1">
                        {item.fullDate}
                      </p>
                      <p className="text-emerald-600 dark:text-emerald-400 font-medium">
                        Toner : {item.toner}%
                      </p>
                      <p className="text-indigo-600 dark:text-indigo-400 font-medium">
                        Pages totales : {item.pages.toLocaleString('fr-FR')}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend
              verticalAlign="top"
              height={36}
              formatter={(value) => (
                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                  {value === 'toner' ? 'Niveau de Toner (%)' : 'Pages Totales'}
                </span>
              )}
            />
            <Line
              yAxisId="toner"
              type="monotone"
              dataKey="toner"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Line
              yAxisId="pages"
              type="monotone"
              dataKey="pages"
              stroke="#6366f1"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
