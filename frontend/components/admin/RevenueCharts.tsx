"use client";

import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from "recharts";

interface MonthlyData {
  month: string;
  revenue: number;
}

interface PlanData {
  name: string;
  count: number;
  revenue: number;
}

interface Props {
  monthlyData: MonthlyData[];
  planData: PlanData[];
}

const formatNaira = (value: number) =>
  value >= 1000 ? `₦${(value / 1000).toFixed(0)}k` : `₦${value}`;

export default function RevenueCharts({ monthlyData, planData }: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 6-Month Revenue Trend — Area Chart */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-base font-bold text-gray-900 mb-1">Revenue Trend</h2>
        <p className="text-xs text-gray-400 mb-6">Last 6 months of subscription revenue</p>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={formatNaira} tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} width={55} />
              <Tooltip
                formatter={(val: number) => [`₦${Number(val).toLocaleString()}`, "Revenue"]}
                contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb", fontSize: "12px" }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#6366F1"
                strokeWidth={2.5}
                fill="url(#revenueGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Revenue by Plan — Bar Chart */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-base font-bold text-gray-900 mb-1">Revenue by Plan</h2>
        <p className="text-xs text-gray-400 mb-6">Total revenue generated per membership plan</p>
        {planData.length === 0 ? (
          <div className="h-52 flex items-center justify-center text-gray-400 text-sm">No data yet.</div>
        ) : (
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={planData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={formatNaira} tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} width={55} />
                <Tooltip
                  formatter={(val: number, name: string) => [
                    name === "revenue" ? `₦${Number(val).toLocaleString()}` : val,
                    name === "revenue" ? "Revenue" : "Subscribers",
                  ]}
                  contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb", fontSize: "12px" }}
                />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Bar dataKey="revenue" name="Revenue" fill="#6366F1" radius={[6, 6, 0, 0]} />
                <Bar dataKey="count" name="Subscribers" fill="#8B5CF6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
