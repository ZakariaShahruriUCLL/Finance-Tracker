import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
} from 'recharts';
import Layout from '../components/Layout';
import { transactionsApi } from '../api/transactions';
import type { Balance, CategoryBreakdownItem, Summary } from '../types';

const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

function StatCard({ label, value, color, sub }: { label: string; value: string; color: string; sub?: string }) {
  return (
    <div style={{ flex: 1, minWidth: 160, background: '#fff', border: '1px solid #e5e7eb',
                  borderRadius: 10, padding: '20px 24px' }}>
      <p style={{ margin: '0 0 6px', fontSize: 13, color: '#6b7280' }}>{label}</p>
      <p style={{ margin: 0, fontSize: 26, fontWeight: 700, color }}>{value}</p>
      {sub && <p style={{ margin: '4px 0 0', fontSize: 12, color: '#9ca3af' }}>{sub}</p>}
    </div>
  );
}

function buildMonthLabel(year: number, month: number) {
  return new Date(year, month - 1).toLocaleString('en-US', { month: 'short' });
}

function last6Months() {
  const result: { month: number; year: number }[] = [];
  const d = new Date();
  for (let i = 5; i >= 0; i--) {
    const t = new Date(d.getFullYear(), d.getMonth() - i, 1);
    result.push({ month: t.getMonth() + 1, year: t.getFullYear() });
  }
  return result;
}

export default function Dashboard() {
  const [balance, setBalance] = useState<Balance | null>(null);
  const [monthlySummaries, setMonthlySummaries] = useState<(Summary & { label: string })[]>([]);
  const [breakdown, setBreakdown] = useState<CategoryBreakdownItem[]>([]);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const monthName = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  useEffect(() => {
    const months = last6Months();
    Promise.all([
      transactionsApi.balance(),
      transactionsApi.categoryBreakdown({ month: currentMonth, year: currentYear }),
      ...months.map(({ month, year }) => transactionsApi.summary({ month, year })),
    ])
      .then(([balanceRes, breakdownRes, ...summaryResponses]) => {
        setBalance(balanceRes.data);
        setBreakdown(breakdownRes.data);
        setMonthlySummaries(
          summaryResponses.map((r, i) => ({
            ...r.data,
            label: buildMonthLabel(months[i].year, months[i].month),
          }))
        );
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const currentSummary = monthlySummaries.find(
    (s) => s.month === currentMonth && s.year === currentYear
  );

  const totalExpenseBreakdown = breakdown.reduce((acc, item) => acc + item.amount, 0);

  return (
    <Layout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Dashboard</h1>
        <Link to="/transactions" style={{ fontSize: 14, color: '#4f46e5', textDecoration: 'none' }}>
          All transactions →
        </Link>
      </div>

      {loading ? <p style={{ color: '#9ca3af' }}>Loading…</p> : (
        <>
          {/* ── All-time balance ── */}
          <div style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', borderRadius: 12,
                        padding: '28px 32px', marginBottom: 24, color: '#fff' }}>
            <p style={{ margin: '0 0 8px', fontSize: 14, opacity: 0.8 }}>Total Balance (all time)</p>
            <p style={{ margin: 0, fontSize: 40, fontWeight: 800, letterSpacing: '-1px' }}>
              {fmt.format(balance?.totalBalance ?? 0)}
            </p>
            <div style={{ display: 'flex', gap: 32, marginTop: 16, fontSize: 14, opacity: 0.9 }}>
              <span>↑ {fmt.format(balance?.totalIncome ?? 0)} income</span>
              <span>↓ {fmt.format(balance?.totalExpenses ?? 0)} expenses</span>
            </div>
          </div>

          {/* ── This month stat cards ── */}
          <h2 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600, color: '#374151' }}>
            {monthName}
          </h2>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 32 }}>
            <StatCard label="Income" value={fmt.format(currentSummary?.income ?? 0)} color="#15803d"
              sub={`${currentSummary?.incomeCount ?? 0} transactions`} />
            <StatCard label="Expenses" value={fmt.format(currentSummary?.expenses ?? 0)} color="#b91c1c"
              sub={`${currentSummary?.expenseCount ?? 0} transactions`} />
            <StatCard
              label="Monthly Balance"
              value={fmt.format(currentSummary?.balance ?? 0)}
              color={(currentSummary?.balance ?? 0) >= 0 ? '#1d4ed8' : '#b91c1c'}
            />
          </div>

          {/* ── Charts row ── */}
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 32 }}>

            {/* Bar chart – 6-month income vs expenses */}
            <div style={{ flex: 2, minWidth: 280, background: '#fff', border: '1px solid #e5e7eb',
                          borderRadius: 10, padding: '20px 16px' }}>
              <p style={{ margin: '0 0 16px', fontWeight: 600, fontSize: 14, color: '#374151' }}>
                Income vs Expenses — last 6 months
              </p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={monthlySummaries} barGap={4} barCategoryGap="30%">
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false}
                    tickFormatter={(v: number) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                  <Tooltip formatter={(v) => typeof v === 'number' ? fmt.format(v) : v} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="income" name="Income" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Pie chart – category breakdown */}
            <div style={{ flex: 1, minWidth: 240, background: '#fff', border: '1px solid #e5e7eb',
                          borderRadius: 10, padding: '20px 16px' }}>
              <p style={{ margin: '0 0 16px', fontWeight: 600, fontSize: 14, color: '#374151' }}>
                Spending by Category — {monthName}
              </p>
              {breakdown.length === 0 ? (
                <p style={{ color: '#9ca3af', fontSize: 13, textAlign: 'center', marginTop: 60 }}>
                  No expense data this month
                </p>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={breakdown} dataKey="amount" nameKey="name"
                           cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                        {breakdown.map((item) => (
                          <Cell key={item.categoryId} fill={item.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => typeof v === 'number' ? fmt.format(v) : v} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {breakdown.map((item) => (
                      <div key={item.categoryId}
                           style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ width: 10, height: 10, borderRadius: '50%',
                                        background: item.color, display: 'inline-block' }} />
                          {item.icon ? `${item.icon} ` : ''}{item.name}
                        </span>
                        <span style={{ color: '#6b7280' }}>
                          {fmt.format(item.amount)}
                          <span style={{ color: '#d1d5db', marginLeft: 4 }}>
                            ({totalExpenseBreakdown > 0
                              ? Math.round((item.amount / totalExpenseBreakdown) * 100)
                              : 0}%)
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

          </div>
        </>
      )}
    </Layout>
  );
}
