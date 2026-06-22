'use client';

import { useState, useEffect } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Loader2 } from 'lucide-react';
import BudgetReport from '@/components/budget/budget-report';

const COLORS = ['#7f1d1d', '#991b1b', '#1d4ed8', '#15803d', '#7c3aed'];

const tooltipStyle = {
  contentStyle: {
    background: 'white',
    border: '1px solid #f1f5f9',
    borderRadius: '8px',
    fontSize: '11px',
    fontWeight: 600,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
};

function ChartCard({ title, subtitle, children }) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{title}</h3>
        {subtitle && <p className="text-xs text-zinc-400 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function EmptyChart({ label }) {
  return (
    <div className="flex items-center justify-center h-48 text-zinc-300 text-sm">
      No {label} data yet
    </div>
  );
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    clubActivity: [],
    budgetTrends: [],
    budgetBySemester: [],
    budgetEntities: [],
    allSemesters: [],
    eventsByType: [],
    clanPerformance: [],
    stats: { totalEvents: 0, totalBudget: 0, totalExpenses: 0, totalAchievements: 0 },
  });

  useEffect(() => {
    fetch('/api/analytics')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setData(d); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-5 w-5 text-zinc-300 animate-spin" />
      </div>
    );
  }

  const statItems = [
    { label: 'Total events', value: data.stats.totalEvents },
    { label: 'Budget allocated', value: `₹${data.stats.totalBudget.toLocaleString()}` },
    { label: 'Expenses', value: `₹${data.stats.totalExpenses.toLocaleString()}` },
    { label: 'Achievements', value: data.stats.totalAchievements },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl italic text-zinc-900 dark:text-zinc-100">Analytics</h1>
        <p className="text-sm text-zinc-400 mt-1">Platform performance overview</p>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statItems.map(({ label, value }) => (
          <div key={label} className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl p-4">
            <div className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">{value}</div>
            <div className="text-xs text-zinc-400 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-5 md:grid-cols-2">
        <ChartCard title="Club Activity" subtitle="Events organised per club">
          {data.clubActivity.length === 0 ? <EmptyChart label="club activity" /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.clubActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="events" fill="#1d4ed8" name="Events" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Events by Type" subtitle="Club / Clan / LX distribution">
          {data.eventsByType.length === 0 ? <EmptyChart label="event type" /> : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={data.eventsByType} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                  paddingAngle={3} dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {data.eventsByType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip {...tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Budget vs Spending" subtitle="Allocated vs actual by entity">
          {data.budgetTrends.length === 0 ? <EmptyChart label="budget" /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.budgetTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip {...tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="allocated" fill="#15803d" name="Allocated" radius={[3, 3, 0, 0]} />
                <Bar dataKey="spent" fill="#dc2626" name="Spent" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Budget by Semester" subtitle="Allocated vs spent across all clubs & clans, by term">
          {(!data.budgetBySemester || data.budgetBySemester.length === 0) ? <EmptyChart label="semester budget" /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.budgetBySemester}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                <XAxis dataKey="semester" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip {...tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="allocated" fill="#15803d" name="Allocated" radius={[3, 3, 0, 0]} />
                <Bar dataKey="spent" fill="#dc2626" name="Spent" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Clan Performance" subtitle="Total points earned">
          {data.clanPerformance.length === 0 ? <EmptyChart label="clan" /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.clanPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="points" name="Points" radius={[4, 4, 0, 0]}>
                  {data.clanPerformance.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Downloadable per-semester budget report */}
      <BudgetReport entities={data.budgetEntities} semesters={data.allSemesters} />
    </div>
  );
}
