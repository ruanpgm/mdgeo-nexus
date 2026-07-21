"use client";

import { Cell, Pie, PieChart, Tooltip } from "recharts";

type DonutDatum = { label: string; value: number; fill: string };

export function StatusDonut({ data, totalLabel = "Total" }: { data: DonutDatum[]; totalLabel?: string }) {
  const total = data.reduce((acc, d) => acc + d.value, 0);

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <PieChart width={190} height={190}>
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const p = payload[0];
              return (
                <div className="rounded-lg border bg-popover px-2.5 py-1.5 text-xs shadow-xl">
                  <span className="font-medium">{p.name}</span>:{" "}
                  <span className="font-mono tabular-nums">{p.value as number}</span>
                </div>
              );
            }}
          />
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            cx="50%"
            cy="50%"
            innerRadius={54}
            outerRadius={78}
            strokeWidth={2}
            stroke="var(--card)"
            paddingAngle={2}
            isAnimationActive={false}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.fill} />
            ))}
          </Pie>
        </PieChart>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-xl font-semibold tabular-nums">{total}</span>
          <span className="text-[10px] text-muted-foreground">{totalLabel}</span>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-xs">
        {data.map((d, i) => (
          <span key={i} className="flex items-center gap-1.5 text-muted-foreground">
            <span className="size-2 shrink-0 rounded-full" style={{ background: d.fill }} />
            {d.label} <span className="font-mono font-medium text-foreground tabular-nums">{d.value}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
