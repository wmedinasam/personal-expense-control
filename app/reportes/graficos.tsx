"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatMoney, formatMoneyWithSymbol } from "@/lib/reports";

const TOOLTIP_STYLE = { backgroundColor: "#18181b", border: "1px solid #3f3f46", color: "#f4f4f5" };

const AXIS_TICK = { fontSize: 12, fill: "#a1a1aa" };

export function TendenciaChart({
  data,
  symbol,
}: {
  data: { label: string; total: number }[];
  symbol: string;
}) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#27272a" />
          <XAxis
            dataKey="label"
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
            minTickGap={8}
          />
          <YAxis
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            width={72}
            tickFormatter={(value) => formatMoney(Number(value))}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            itemStyle={{ color: "#f4f4f5" }}
            cursor={{ fill: "#27272a" }}
            formatter={(value) => formatMoneyWithSymbol(Number(value), symbol)}
          />
          <Bar dataKey="total" name="Gasto" fill="#94a3b8" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CategoriasChart({
  data,
  symbol,
}: {
  data: { name: string; total: number; color: string }[];
  symbol: string;
}) {
  return (
    <div
      className="w-full"
      style={{ height: Math.max(160, data.length * 44 + 24) }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
        >
          <CartesianGrid horizontal={false} stroke="#27272a" />
          <XAxis
            type="number"
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => formatMoney(Number(value))}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            width={96}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            itemStyle={{ color: "#f4f4f5" }}
            cursor={{ fill: "#27272a" }}
            formatter={(value) => formatMoneyWithSymbol(Number(value), symbol)}
          />
          <Bar dataKey="total" name="Gasto" radius={[0, 3, 3, 0]}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
