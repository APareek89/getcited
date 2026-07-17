"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RTooltip,
} from "recharts";

export function SovTrendChart({ data }: { data: { date: string; sov: number }[] }) {
  const chart = data.map((d) => ({ date: d.date.slice(5), sov: Math.round(d.sov * 100) }));
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chart} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id="sovAurora" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#7C3AED" />
              <stop offset="100%" stopColor="#22D3EE" />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.10)" vertical={false} />
          <XAxis dataKey="date" tick={{ fill: "#93A0B4", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: "#93A0B4", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}%`}
          />
          <RTooltip
            contentStyle={{
              background: "#0C1120",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 8,
              color: "#EDF0F7",
              fontSize: 12,
            }}
            formatter={(value) => [`${Number(value)}%`, "Your SoV"]}
          />
          <Line type="monotone" dataKey="sov" stroke="url(#sovAurora)" strokeWidth={2.5} dot={{ r: 3, fill: "#22D3EE" }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
