import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
} from 'recharts';
import Layout from '../components/Layout';
import DashboardSkeleton from '../components/DashboardSkeleton';
import { transactionsApi } from '../api/transactions';
import type { Balance, CategoryBreakdownItem, Summary } from '../types';
import { glassCard } from '../styles/glass';

const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

function StatCard({ label, value, color, sub }: { label: string; value: string; color: string; sub?: string }) {
  return (
    <div style={{ ...glassCard, flex: 1, minWidth: 160, padding: '22px 26px', borderRadius: 14 }}>
      <p style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>{label}</p>
      <p style={{ margin: 0, fontSize: 26, fontWeight: 700, color }}>{value}</p>
      {sub && <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--text-faint)' }}>{sub}</p>}
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

  const tooltipStyle = {
    background: 'var(--glass-bg)',
    backdropFilter: 'blur(16px)',
    border: '1px solid var(--glass-border)',
    borderRadius: 10,
    boxShadow: 'var(--glass-shadow)',
    color: 'var(--text-primary)',
  };

  return (
    <Layout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>Dashboard</h1>
        <Link to="/transactions" style={{ fontSize: 14, color: '#818cf8', textDecoration: 'none', fontWeight: 500 }}>
          All transactions →
        </Link>
      </div>

      {loading ? <DashboardSkeleton /> : (
        <>
          <div style={{
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #be185d 100%)',
            borderRadius: 18, padding: '32px 36px', marginBottom: 24, color: '#fff',
            boxShadow: '0 16px 48px rgba(79, 70, 229, 0.45)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          }}>
            <p style={{ margin: '0 0 10px', fontSize: 14, opacity: 0.85, fontWeight: 500 }}>Total Balance (all time)</p>
            <p style={{ margin: 0, fontSize: 42, fontWeight: 800, letterSpacing: '-1px' }}>
              {fmt.format(balance?.totalBalance ?? 0)}
            </p>
            <div style={{ display: 'flex', gap: 32, marginTop: 18, fontSize: 14, opacity: 0.95 }}>
              <span>↑ {fmt.format(balance?.totalIncome ?? 0)} income</span>
              <span>↓ {fmt.format(balance?.totalExpenses ?? 0)} expenses</span>
            </div>
          </div>

          <h2 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)' }}>
            {monthName}
          </h2>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 32 }}>
            <StatCard label="Income" value={fmt.format(currentSummary?.income ?? 0)}
              color="var(--color-income)" sub={`${currentSummary?.incomeCount ?? 0} transactions`} />
            <StatCard label="Expenses" value={fmt.format(currentSummary?.expenses ?? 0)}
              color="var(--color-expense)" sub={`${currentSummary?.expenseCount ?? 0} transactions`} />
            <StatCard
              label="Monthly Balance"
              value={fmt.format(currentSummary?.balance ?? 0)}
              color={(currentSummary?.balance ?? 0) >= 0 ? 'var(--color-balance-positive)' : 'var(--color-expense)'}
            />
          </div>

          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 32 }}>
            <div style={{ ...glassCard, flex: 2, minWidth: 280, padding: '22px 18px' }}>
              <p style={{ margin: '0 0 16px', fontWeight: 600, fontSize: 14, color: 'var(--text-secondary)' }}>
                Income vs Expenses — last 6 months
              </p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={monthlySummaries} barGap={4} barCategoryGap="30%">
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'var(--text-muted)' as string }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-faint)' as string }} axisLine={false} tickLine={false}
                    tickFormatter={(v: number) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                  <Tooltip formatter={(v) => typeof v === 'number' ? fmt.format(v) : v} contentStyle={tooltipStyle} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: 'var(--text-muted)' }} />
                  <Bar dataKey="income" name="Income" fill="#22c55e" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ ...glassCard, flex: 1, minWidth: 240, padding: '22px 18px' }}>
              <p style={{ margin: '0 0 16px', fontWeight: 600, fontSize: 14, color: 'var(--text-secondary)' }}>
                Spending by Category — {monthName}
              </p>
              {breakdown.length === 0 ? (
                <p style={{ color: 'var(--text-faint)', fontSize: 13, textAlign: 'center', marginTop: 60 }}>
                  No expense data this month
                </p>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={breakdown} dataKey="amount" nameKey="name"
                           cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                        {breakdown.map((item) => <Cell key={item.categoryId} fill={item.color} />)}
                      </Pie>
                      <Tooltip formatter={(v) => typeof v === 'number' ? fmt.format(v) : v} contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {breakdown.map((item) => (
                      <div key={item.categoryId}
                           style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)' }}>
                          <span style={{ width: 10, height: 10, borderRadius: '50%', background: item.color, display: 'inline-block' }} />
                          {item.icon ? `${item.icon} ` : ''}{item.name}
                        </span>
                        <span style={{ color: 'var(--text-muted)' }}>
                          {fmt.format(item.amount)}
                          <span style={{ color: 'var(--text-faint)', marginLeft: 4 }}>
                            ({totalExpenseBreakdown > 0 ? Math.round((item.amount / totalExpenseBreakdown) * 100) : 0}%)
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
