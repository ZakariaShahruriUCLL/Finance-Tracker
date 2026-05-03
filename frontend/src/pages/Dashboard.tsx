import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell, ComposedChart, ReferenceLine, Line,
} from 'recharts';
import Layout from '../components/Layout';
import DashboardSkeleton from '../components/DashboardSkeleton';
import { transactionsApi } from '../api/transactions';
import type { Balance, CategoryBreakdownItem, Summary, Transaction } from '../types';
import { glassCard } from '../styles/glass';

const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const fmtCompact = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

function StatCard({
  label, value, color, sub, badge,
}: {
  label: string; value: string; color: string; sub?: string; badge?: { text: string; positive: boolean } | null;
}) {
  return (
    <div style={{ ...glassCard, flex: 1, minWidth: 150, padding: '20px 22px', borderRadius: 14 }}>
      <p style={{ margin: '0 0 8px', fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
      <p style={{ margin: 0, fontSize: 24, fontWeight: 700, color }}>{value}</p>
      {sub && <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--text-faint)' }}>{sub}</p>}
      {badge && (
        <span style={{
          display: 'inline-block', marginTop: 6, fontSize: 11, fontWeight: 600,
          padding: '2px 8px', borderRadius: 99,
          background: badge.positive ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
          color: badge.positive ? 'var(--color-income)' : 'var(--color-expense)',
        }}>
          {badge.text}
        </span>
      )}
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

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ margin: '0 0 14px', fontWeight: 600, fontSize: 13, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
      {children}
    </p>
  );
}

export default function Dashboard() {
  const [balance, setBalance] = useState<Balance | null>(null);
  const [monthlySummaries, setMonthlySummaries] = useState<(Summary & { label: string })[]>([]);
  const [breakdown, setBreakdown] = useState<CategoryBreakdownItem[]>([]);
  const [dailySpending, setDailySpending] = useState<{ day: string; amount: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const monthName = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const today = now.getDate();

  useEffect(() => {
    const months = last6Months();
    Promise.all([
      transactionsApi.balance(),
      transactionsApi.categoryBreakdown({ month: currentMonth, year: currentYear }),
      transactionsApi.list({ month: currentMonth, year: currentYear, limit: 100 }),
      ...months.map(({ month, year }) => transactionsApi.summary({ month, year })),
    ])
      .then(([balanceRes, breakdownRes, txRes, ...summaryResponses]) => {
        setBalance(balanceRes.data);
        setBreakdown(breakdownRes.data);

        const byDay: Record<number, number> = {};
        (txRes.data.transactions as Transaction[]).forEach((tx) => {
          if (tx.type !== 'EXPENSE') return;
          const d = new Date(tx.date).getDate();
          byDay[d] = (byDay[d] ?? 0) + tx.amount;
        });
        setDailySpending(
          Array.from({ length: daysInMonth }, (_, i) => ({
            day: String(i + 1),
            amount: +(byDay[i + 1] ?? 0).toFixed(2),
          }))
        );

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

  const savingsRate = currentSummary && currentSummary.income > 0
    ? Math.round(((currentSummary.income - currentSummary.expenses) / currentSummary.income) * 100)
    : 0;

  const avgDailySpend = currentSummary && today > 0
    ? currentSummary.expenses / today
    : 0;

  const monthlyPnl = monthlySummaries.map((s) => ({
    label: s.label,
    net: +(s.income - s.expenses).toFixed(2),
    savingsRate: s.income > 0 ? Math.round(((s.income - s.expenses) / s.income) * 100) : 0,
  }));

  const tooltipStyle = {
    background: 'var(--glass-nav-bg)',
    backdropFilter: 'blur(16px)',
    border: '1px solid var(--glass-border)',
    borderRadius: 10,
    boxShadow: 'var(--glass-shadow)',
    color: 'var(--text-primary)',
    fontSize: 13,
  };

  const axisStyle = { fontSize: 12, fill: 'var(--text-faint)' as string };

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
          {/* ── Hero balance ── */}
          <div style={{
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #be185d 100%)',
            borderRadius: 18, padding: '32px 36px', marginBottom: 28, color: '#fff',
            boxShadow: '0 16px 48px rgba(79, 70, 229, 0.45)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          }}>
            <p style={{ margin: '0 0 10px', fontSize: 13, opacity: 0.8, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Total Balance — All Time
            </p>
            <p style={{ margin: 0, fontSize: 44, fontWeight: 800, letterSpacing: '-1.5px' }}>
              {fmt.format(balance?.totalBalance ?? 0)}
            </p>
            <div style={{ display: 'flex', gap: 32, marginTop: 18, fontSize: 14, opacity: 0.9 }}>
              <span>↑ {fmt.format(balance?.totalIncome ?? 0)} total income</span>
              <span>↓ {fmt.format(balance?.totalExpenses ?? 0)} total expenses</span>
            </div>
          </div>

          {/* ── Stat cards ── */}
          <SectionTitle>{monthName}</SectionTitle>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 32 }}>
            <StatCard
              label="Income"
              value={fmt.format(currentSummary?.income ?? 0)}
              color="var(--color-income)"
              sub={`${currentSummary?.incomeCount ?? 0} transactions`}
            />
            <StatCard
              label="Expenses"
              value={fmt.format(currentSummary?.expenses ?? 0)}
              color="var(--color-expense)"
              sub={`${currentSummary?.expenseCount ?? 0} transactions`}
            />
            <StatCard
              label="Net Balance"
              value={fmt.format(currentSummary?.balance ?? 0)}
              color={(currentSummary?.balance ?? 0) >= 0 ? 'var(--color-balance-positive)' : 'var(--color-expense)'}
            />
            <StatCard
              label="Savings Rate"
              value={`${savingsRate}%`}
              color={savingsRate >= 20 ? 'var(--color-income)' : savingsRate >= 0 ? 'var(--color-balance-positive)' : 'var(--color-expense)'}
              badge={savingsRate >= 0
                ? { text: savingsRate >= 20 ? 'On track' : 'Below target', positive: savingsRate >= 20 }
                : { text: 'In deficit', positive: false }}
            />
            <StatCard
              label="Avg Daily Spend"
              value={fmt.format(avgDailySpend)}
              color="var(--text-secondary)"
              sub={`Based on ${today} days`}
            />
          </div>

          {/* ── Row 1: Income vs Expenses + Category Breakdown ── */}
          <SectionTitle>6-Month Overview</SectionTitle>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 28 }}>
            <div style={{ ...glassCard, flex: 2, minWidth: 300, padding: '20px 16px' }}>
              <p style={{ margin: '0 0 16px', fontWeight: 600, fontSize: 14, color: 'var(--text-secondary)' }}>
                Income vs Expenses
              </p>
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={monthlySummaries} barGap={4} barCategoryGap="28%">
                  <XAxis dataKey="label" tick={axisStyle} axisLine={false} tickLine={false} />
                  <YAxis tick={{ ...axisStyle, fontSize: 11 }} axisLine={false} tickLine={false}
                    tickFormatter={(v: number) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                  <Tooltip formatter={(v) => typeof v === 'number' ? fmt.format(v) : v} contentStyle={tooltipStyle} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: 'var(--text-muted)' }} />
                  <Bar dataKey="income" name="Income" fill="#22c55e" radius={[5, 5, 0, 0]} fillOpacity={0.9} />
                  <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[5, 5, 0, 0]} fillOpacity={0.9} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ ...glassCard, flex: 1, minWidth: 220, padding: '20px 16px' }}>
              <p style={{ margin: '0 0 4px', fontWeight: 600, fontSize: 14, color: 'var(--text-secondary)' }}>
                Spending by Category
              </p>
              <p style={{ margin: '0 0 12px', fontSize: 12, color: 'var(--text-faint)' }}>{monthName}</p>
              {breakdown.length === 0 ? (
                <p style={{ color: 'var(--text-faint)', fontSize: 13, textAlign: 'center', marginTop: 60 }}>
                  No expense data this month
                </p>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={breakdown} dataKey="amount" nameKey="name"
                           cx="50%" cy="50%" innerRadius={44} outerRadius={72} paddingAngle={3}>
                        {breakdown.map((item) => <Cell key={item.categoryId} fill={item.color} />)}
                      </Pie>
                      <Tooltip formatter={(v) => typeof v === 'number' ? fmt.format(v) : v} contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 8 }}>
                    {breakdown.map((item) => (
                      <div key={item.categoryId}
                           style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)' }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, display: 'inline-block', flexShrink: 0 }} />
                          {item.icon ? `${item.icon} ` : ''}{item.name}
                        </span>
                        <span style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap', marginLeft: 8 }}>
                          {fmtCompact.format(item.amount)}
                          <span style={{ color: 'var(--text-faint)', marginLeft: 4, fontSize: 11 }}>
                            {totalExpenseBreakdown > 0 ? Math.round((item.amount / totalExpenseBreakdown) * 100) : 0}%
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ── Row 2: Monthly P&L + Daily Spending ── */}
          <SectionTitle>Monthly Insight</SectionTitle>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 28 }}>

            {/* Monthly P&L bars */}
            <div style={{ ...glassCard, flex: 1, minWidth: 280, padding: '20px 16px' }}>
              <p style={{ margin: '0 0 4px', fontWeight: 600, fontSize: 14, color: 'var(--text-secondary)' }}>
                Monthly Profit / Loss
              </p>
              <p style={{ margin: '0 0 14px', fontSize: 12, color: 'var(--text-faint)' }}>
                Net balance per month. Green = surplus, red = deficit.
              </p>
              <ResponsiveContainer width="100%" height={200}>
                <ComposedChart data={monthlyPnl} barCategoryGap="35%">
                  <XAxis dataKey="label" tick={axisStyle} axisLine={false} tickLine={false} />
                  <YAxis
                    yAxisId="left"
                    tick={{ ...axisStyle, fontSize: 11 }} axisLine={false} tickLine={false}
                    tickFormatter={(v: number) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v < -1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                  />
                  <YAxis
                    yAxisId="right" orientation="right"
                    tick={{ ...axisStyle, fontSize: 11 }} axisLine={false} tickLine={false}
                    tickFormatter={(v: number) => `${v}%`}
                    domain={[-100, 100]}
                  />
                  <Tooltip
                    formatter={(v, name) =>
                      name === 'Savings Rate' ? `${v}%` : typeof v === 'number' ? fmt.format(v) : v
                    }
                    contentStyle={tooltipStyle}
                  />
                  <ReferenceLine yAxisId="left" y={0} stroke="rgba(156,163,175,0.5)" strokeDasharray="4 3" />
                  <Bar yAxisId="left" dataKey="net" name="Net Balance" radius={[5, 5, 0, 0]}>
                    {monthlyPnl.map((entry, i) => (
                      <Cell key={i} fill={entry.net >= 0 ? '#22c55e' : '#ef4444'} fillOpacity={0.85} />
                    ))}
                  </Bar>
                  <Line
                    yAxisId="right" type="monotone" dataKey="savingsRate"
                    name="Savings Rate" stroke="#818cf8" strokeWidth={2}
                    dot={{ fill: '#818cf8', r: 3 }} activeDot={{ r: 5 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
              <p style={{ margin: '8px 0 0', fontSize: 11, color: 'var(--text-faint)', textAlign: 'right' }}>
                — Purple line = savings rate %
              </p>
            </div>

            {/* Daily spending */}
            <div style={{ ...glassCard, flex: 1, minWidth: 280, padding: '20px 16px' }}>
              <p style={{ margin: '0 0 4px', fontWeight: 600, fontSize: 14, color: 'var(--text-secondary)' }}>
                Daily Spending
              </p>
              <p style={{ margin: '0 0 14px', fontSize: 12, color: 'var(--text-faint)' }}>
                Expenses by day — {monthName}
              </p>
              {dailySpending.every((d) => d.amount === 0) ? (
                <p style={{ color: 'var(--text-faint)', fontSize: 13, textAlign: 'center', marginTop: 60 }}>
                  No expenses recorded this month
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={dailySpending} barCategoryGap="15%">
                    <XAxis
                      dataKey="day"
                      tick={{ ...axisStyle, fontSize: 10 }}
                      axisLine={false} tickLine={false}
                      interval={4}
                    />
                    <YAxis
                      tick={{ ...axisStyle, fontSize: 10 }} axisLine={false} tickLine={false}
                      tickFormatter={(v: number) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                      width={42}
                    />
                    <Tooltip
                      formatter={(v) => typeof v === 'number' ? fmt.format(v) : v}
                      labelFormatter={(label) => `Day ${label}`}
                      contentStyle={tooltipStyle}
                    />
                    <Bar dataKey="amount" name="Spent" radius={[3, 3, 0, 0]}>
                      {dailySpending.map((entry, i) => (
                        <Cell
                          key={i}
                          fill={entry.amount === 0 ? 'rgba(156,163,175,0.2)' : '#a78bfa'}
                          fillOpacity={entry.amount === 0 ? 0.4 : 0.85}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* ── Row 3: Category horizontal bars ── */}
          {breakdown.length > 0 && (
            <>
              <SectionTitle>Category Breakdown — {monthName}</SectionTitle>
              <div style={{ ...glassCard, padding: '20px 24px', marginBottom: 28 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {breakdown.map((item) => {
                    const pct = totalExpenseBreakdown > 0
                      ? (item.amount / totalExpenseBreakdown) * 100
                      : 0;
                    return (
                      <div key={item.categoryId}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
                          <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
                            {item.icon ? `${item.icon} ` : ''}{item.name}
                          </span>
                          <span style={{ color: 'var(--text-muted)' }}>
                            {fmt.format(item.amount)}{' '}
                            <span style={{ color: 'var(--text-faint)', fontSize: 11 }}>{Math.round(pct)}%</span>
                          </span>
                        </div>
                        <div style={{
                          height: 8, borderRadius: 4,
                          background: 'var(--glass-bg-subtle)',
                          border: '1px solid var(--glass-border)',
                          overflow: 'hidden',
                        }}>
                          <div style={{
                            height: '100%',
                            width: `${pct}%`,
                            borderRadius: 4,
                            background: item.color,
                            transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                            boxShadow: `0 0 8px ${item.color}66`,
                          }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </Layout>
  );
}
