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
          <CartesianGrid strokeDasharray="3 3" stroke="#22272F" vertical={false} />
          <XAxis dataKey="date" tick={{ fill: "#8A9099", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: "#8A9099", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}%`}
          />
          <RTooltip
            contentStyle={{
              background: "#14171C",
              border: "1px solid #22272F",
              borderRadius: 8,
              color: "#E6E8EB",
              fontSize: 12,
            }}
            formatter={(value) => [`${Number(value)}%`, "Your SoV"]}
          />
          <Line type="monotone" dataKey="sov" stroke="#635BFF" strokeWidth={2} dot={{ r: 3, fill: "#635BFF" }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
