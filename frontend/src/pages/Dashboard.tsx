import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp, TrendingDown, Scale, Target, Coffee,
  BarChart2, PieChart as PieChartIcon, Activity, CalendarDays, Tags, Wallet,
} from 'lucide-react';
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

interface StatCardProps {
  label: string;
  value: string;
  color: string;
  sub?: string;
  icon: React.ReactNode;
  badge?: { text: string; positive: boolean } | null;
}

function StatCard({ label, value, color, sub, icon, badge }: StatCardProps) {
  return (
    <div style={{ ...glassCard, flex: 1, minWidth: 148, padding: '18px 20px', borderRadius: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <p style={{ margin: 0, fontSize: 11, color: 'var(--text-faint)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          {label}
        </p>
        <span style={{ color, opacity: 0.7 }}>{icon}</span>
      </div>
      <p style={{ margin: 0, fontSize: 24, fontWeight: 800, color, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </p>
      {sub && <p style={{ margin: '5px 0 0', fontSize: 11, color: 'var(--text-faint)' }}>{sub}</p>}
      {badge && (
        <span style={{
          display: 'inline-flex', alignItems: 'center', marginTop: 8, fontSize: 11, fontWeight: 600,
          padding: '2px 8px', borderRadius: 99,
          background: badge.positive ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
          color: badge.positive ? 'var(--color-income)' : 'var(--color-expense)',
        }}>
          {badge.text}
        </span>
      )}
    </div>
  );
}

function SectionHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
      <span style={{ color: 'var(--text-faint)' }}>{icon}</span>
      <div>
        <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {title}
        </p>
        {subtitle && <p style={{ margin: 0, fontSize: 11, color: 'var(--text-faint)', opacity: 0.7 }}>{subtitle}</p>}
      </div>
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
  const avgDailySpend = currentSummary && today > 0 ? currentSummary.expenses / today : 0;
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
  const axisStyle = { fontSize: 11, fill: 'var(--text-faint)' as string };

  return (
    <Layout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 13,
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #be185d 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(79,70,229,0.4)',
          }}>
            <Wallet size={20} strokeWidth={1.75} color="#fff" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
              Dashboard
            </h1>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-faint)', marginTop: 1 }}>{monthName}</p>
          </div>
        </div>
        <Link to="/transactions" style={{ fontSize: 13, color: '#818cf8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
          All transactions →
        </Link>
      </div>

      {loading ? <DashboardSkeleton /> : (
        <>
          {/* Hero balance */}
          <div style={{
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #be185d 100%)',
            borderRadius: 18, padding: '28px 32px', marginBottom: 28, color: '#fff',
            boxShadow: '0 16px 48px rgba(79,70,229,0.45)',
            border: '1px solid rgba(255,255,255,0.2)',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <p style={{ margin: '0 0 8px', fontSize: 12, opacity: 0.75, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Total Balance — All Time
                </p>
                <p style={{ margin: 0, fontSize: 42, fontWeight: 800, letterSpacing: '-2px', fontVariantNumeric: 'tabular-nums' }}>
                  {fmt.format(balance?.totalBalance ?? 0)}
                </p>
              </div>
              <div style={{ opacity: 0.3 }}>
                <Wallet size={40} strokeWidth={1.25} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 28, marginTop: 18, fontSize: 13 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, opacity: 0.9 }}>
                <TrendingUp size={14} strokeWidth={2} />
                {fmt.format(balance?.totalIncome ?? 0)} income
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, opacity: 0.9 }}>
                <TrendingDown size={14} strokeWidth={2} />
                {fmt.format(balance?.totalExpenses ?? 0)} expenses
              </span>
            </div>
          </div>

          {/* Stat cards */}
          <SectionHeader icon={<Activity size={14} strokeWidth={2} />} title={monthName} subtitle="Current month overview" />
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 32 }}>
            <StatCard label="Income" value={fmt.format(currentSummary?.income ?? 0)}
              color="var(--color-income)" icon={<TrendingUp size={18} strokeWidth={1.75} />}
              sub={`${currentSummary?.incomeCount ?? 0} transactions`} />
            <StatCard label="Expenses" value={fmt.format(currentSummary?.expenses ?? 0)}
              color="var(--color-expense)" icon={<TrendingDown size={18} strokeWidth={1.75} />}
              sub={`${currentSummary?.expenseCount ?? 0} transactions`} />
            <StatCard label="Net Balance" value={fmt.format(currentSummary?.balance ?? 0)}
              color={(currentSummary?.balance ?? 0) >= 0 ? 'var(--color-balance-positive)' : 'var(--color-expense)'}
              icon={<Scale size={18} strokeWidth={1.75} />} />
            <StatCard label="Savings Rate" value={`${savingsRate}%`}
              color={savingsRate >= 20 ? 'var(--color-income)' : savingsRate >= 0 ? 'var(--color-balance-positive)' : 'var(--color-expense)'}
              icon={<Target size={18} strokeWidth={1.75} />}
              badge={savingsRate >= 0
                ? { text: savingsRate >= 20 ? '✓ On track' : 'Below target', positive: savingsRate >= 20 }
                : { text: '↓ In deficit', positive: false }} />
            <StatCard label="Avg Daily Spend" value={fmt.format(avgDailySpend)}
              color="var(--text-secondary)" icon={<Coffee size={18} strokeWidth={1.75} />}
              sub={`Based on ${today} days`} />
          </div>

          {/* Row 1: Income vs Expenses + Category donut */}
          <SectionHeader icon={<BarChart2 size={14} strokeWidth={2} />} title="6-Month Overview" />
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 28 }}>
            <div style={{ ...glassCard, flex: 2, minWidth: 300, padding: '20px 16px' }}>
              <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
                Income vs Expenses
              </p>
              <p style={{ margin: '0 0 14px', fontSize: 12, color: 'var(--text-faint)' }}>Last 6 months</p>
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={monthlySummaries} barGap={4} barCategoryGap="28%">
                  <XAxis dataKey="label" tick={axisStyle} axisLine={false} tickLine={false} />
                  <YAxis tick={{ ...axisStyle }} axisLine={false} tickLine={false}
                    tickFormatter={(v: number) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                  <Tooltip formatter={(v) => typeof v === 'number' ? fmt.format(v) : v} contentStyle={tooltipStyle} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: 'var(--text-muted)' }} />
                  <Bar dataKey="income" name="Income" fill="#22c55e" radius={[5, 5, 0, 0]} fillOpacity={0.9} />
                  <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[5, 5, 0, 0]} fillOpacity={0.9} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ ...glassCard, flex: 1, minWidth: 220, padding: '20px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <PieChartIcon size={14} strokeWidth={1.75} color="var(--text-faint)" />
                <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>Spending by Category</p>
              </div>
              <p style={{ margin: '0 0 12px', fontSize: 12, color: 'var(--text-faint)' }}>{monthName}</p>
              {breakdown.length === 0 ? (
                <p style={{ color: 'var(--text-faint)', fontSize: 13, textAlign: 'center', marginTop: 60 }}>No expense data</p>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={150}>
                    <PieChart>
                      <Pie data={breakdown} dataKey="amount" nameKey="name"
                           cx="50%" cy="50%" innerRadius={40} outerRadius={68} paddingAngle={3}>
                        {breakdown.map((item) => <Cell key={item.categoryId} fill={item.color} />)}
                      </Pie>
                      <Tooltip formatter={(v) => typeof v === 'number' ? fmt.format(v) : v} contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 6 }}>
                    {breakdown.map((item) => (
                      <div key={item.categoryId}
                           style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-secondary)' }}>
                          <span style={{ width: 7, height: 7, borderRadius: '50%', background: item.color, display: 'inline-block', flexShrink: 0 }} />
                          {item.icon ? `${item.icon} ` : ''}{item.name}
                        </span>
                        <span style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap', marginLeft: 8, fontVariantNumeric: 'tabular-nums' }}>
                          {fmtCompact.format(item.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Row 2: Monthly P&L + Daily Spending */}
          <SectionHeader icon={<Activity size={14} strokeWidth={2} />} title="Monthly Insight" />
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 28 }}>
            <div style={{ ...glassCard, flex: 1, minWidth: 280, padding: '20px 16px' }}>
              <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>Monthly P&L</p>
              <p style={{ margin: '0 0 14px', fontSize: 12, color: 'var(--text-faint)' }}>
                Net per month · purple line = savings rate %
              </p>
              <ResponsiveContainer width="100%" height={200}>
                <ComposedChart data={monthlyPnl} barCategoryGap="35%">
                  <XAxis dataKey="label" tick={axisStyle} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" tick={axisStyle} axisLine={false} tickLine={false}
                    tickFormatter={(v: number) => `$${Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                  <YAxis yAxisId="right" orientation="right" tick={axisStyle} axisLine={false} tickLine={false}
                    tickFormatter={(v: number) => `${v}%`} domain={[-100, 100]} />
                  <Tooltip
                    formatter={(v, name) => name === 'Savings Rate' ? `${v}%` : typeof v === 'number' ? fmt.format(v) : v}
                    contentStyle={tooltipStyle}
                  />
                  <ReferenceLine yAxisId="left" y={0} stroke="rgba(156,163,175,0.4)" strokeDasharray="4 3" />
                  <Bar yAxisId="left" dataKey="net" name="Net Balance" radius={[5, 5, 0, 0]}>
                    {monthlyPnl.map((entry, i) => (
                      <Cell key={i} fill={entry.net >= 0 ? '#22c55e' : '#ef4444'} fillOpacity={0.85} />
                    ))}
                  </Bar>
                  <Line yAxisId="right" type="monotone" dataKey="savingsRate" name="Savings Rate"
                    stroke="#818cf8" strokeWidth={2} dot={{ fill: '#818cf8', r: 3 }} activeDot={{ r: 5 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div style={{ ...glassCard, flex: 1, minWidth: 280, padding: '20px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <CalendarDays size={14} strokeWidth={1.75} color="var(--text-faint)" />
                <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>Daily Spending</p>
              </div>
              <p style={{ margin: '0 0 14px', fontSize: 12, color: 'var(--text-faint)' }}>Expenses by day — {monthName}</p>
              {dailySpending.every((d) => d.amount === 0) ? (
                <p style={{ color: 'var(--text-faint)', fontSize: 13, textAlign: 'center', marginTop: 60 }}>No expenses this month</p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={dailySpending} barCategoryGap="15%">
                    <XAxis dataKey="day" tick={{ ...axisStyle, fontSize: 10 }} axisLine={false} tickLine={false} interval={4} />
                    <YAxis tick={{ ...axisStyle, fontSize: 10 }} axisLine={false} tickLine={false}
                      tickFormatter={(v: number) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} width={42} />
                    <Tooltip formatter={(v) => typeof v === 'number' ? fmt.format(v) : v}
                      labelFormatter={(l) => `Day ${l}`} contentStyle={tooltipStyle} />
                    <Bar dataKey="amount" name="Spent" radius={[3, 3, 0, 0]}>
                      {dailySpending.map((entry, i) => (
                        <Cell key={i} fill={entry.amount === 0 ? 'rgba(156,163,175,0.18)' : '#a78bfa'} fillOpacity={0.85} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Row 3: Category progress bars */}
          {breakdown.length > 0 && (
            <>
              <SectionHeader icon={<Tags size={14} strokeWidth={2} />} title="Category Breakdown" subtitle={monthName} />
              <div style={{ ...glassCard, padding: '20px 24px', marginBottom: 28 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {breakdown.map((item) => {
                    const pct = totalExpenseBreakdown > 0 ? (item.amount / totalExpenseBreakdown) * 100 : 0;
                    return (
                      <div key={item.categoryId}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 7, color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600 }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              width: 22, height: 22, borderRadius: 6,
                              background: item.color + '20', border: `1px solid ${item.color}30`,
                              fontSize: 11 }}>
                              {item.icon ?? '•'}
                            </span>
                            {item.name}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontVariantNumeric: 'tabular-nums' }}>
                            <span style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 700 }}>{fmt.format(item.amount)}</span>
                            <span style={{ color: 'var(--text-faint)', fontSize: 11, minWidth: 32, textAlign: 'right' }}>{Math.round(pct)}%</span>
                          </span>
                        </div>
                        <div style={{ height: 7, borderRadius: 4, background: 'var(--glass-bg-subtle)', border: '1px solid var(--glass-border)', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', width: `${pct}%`, borderRadius: 4,
                            background: item.color, transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
                            boxShadow: `0 0 8px ${item.color}55`,
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
