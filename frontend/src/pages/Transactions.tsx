import { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import TransactionForm from '../components/TransactionForm';
import TransactionList from '../components/TransactionList';
import TransactionListSkeleton from '../components/TransactionListSkeleton';
import { transactionsApi } from '../api/transactions';
import { categoriesApi } from '../api/categories';
import type { Category, Transaction, TransactionFormData } from '../types';
import { glassCard, glassCardSubtle, glassInput, glassButton, primaryButton } from '../styles/glass';

const now = new Date();

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [typeFilter, setTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [page, setPage] = useState(1);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string | number | undefined> = { page, limit: 20 };
      if (typeFilter) params.type = typeFilter;
      if (categoryFilter) params.categoryId = categoryFilter;
      if (month) params.month = Number(month);
      if (year) params.year = Number(year);
      const { data } = await transactionsApi.list(params);
      setTransactions(data.transactions);
      setPagination(data.pagination);
    } catch {
      setError('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter, categoryFilter, month, year]);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);
  useEffect(() => { categoriesApi.list().then(({ data }) => setCategories(data.categories)).catch(() => {}); }, []);
  useEffect(() => { setPage(1); }, [typeFilter, categoryFilter, month, year]);

  async function handleSubmit(formData: TransactionFormData) {
    if (editing) await transactionsApi.update(editing.id, formData);
    else await transactionsApi.create(formData);
    setShowForm(false);
    setEditing(null);
    fetchTransactions();
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this transaction?')) return;
    await transactionsApi.remove(id);
    fetchTransactions();
  }

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);
  const months = [
    ['1','Jan'],['2','Feb'],['3','Mar'],['4','Apr'],['5','May'],['6','Jun'],
    ['7','Jul'],['8','Aug'],['9','Sep'],['10','Oct'],['11','Nov'],['12','Dec'],
  ];

  const selectStyle = { ...glassInput, padding: '8px 12px', fontSize: 14 };

  return (
    <Layout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>Transactions</h1>
        <button onClick={() => { setEditing(null); setShowForm(true); }}
          style={{ ...primaryButton, padding: '10px 20px' }}>
          + Add Transaction
        </button>
      </div>

      <div style={{ ...glassCardSubtle, display: 'flex', gap: 10, flexWrap: 'wrap', padding: 14, marginBottom: 20 }}>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={selectStyle}>
          <option value="">All types</option>
          <option value="INCOME">Income</option>
          <option value="EXPENSE">Expense</option>
        </select>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} style={selectStyle}>
          <option value="">All categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
        </select>
        <select value={month} onChange={(e) => setMonth(e.target.value)} style={selectStyle}>
          <option value="">All months</option>
          {months.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select value={year} onChange={(e) => setYear(e.target.value)} style={selectStyle}>
          <option value="">All years</option>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <button
          onClick={() => { setTypeFilter(''); setCategoryFilter(''); setMonth(String(now.getMonth() + 1)); setYear(String(now.getFullYear())); }}
          style={{ ...glassButton, padding: '8px 14px', fontSize: 14 }}>
          Reset
        </button>
      </div>

      {error && <p style={{ color: 'var(--color-expense)', marginBottom: 12 }}>{error}</p>}

      <div style={{ ...glassCard, padding: 18 }}>
        {loading ? <TransactionListSkeleton /> : (
          <>
            <TransactionList
              transactions={transactions}
              onEdit={(t) => { setEditing(t); setShowForm(true); }}
              onDelete={handleDelete}
            />
            {pagination.pages > 1 && (
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 20 }}>
                <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}
                  style={{ ...glassButton, padding: '6px 16px', fontSize: 14, opacity: page === 1 ? 0.5 : 1 }}>
                  ← Prev
                </button>
                <span style={{ padding: '6px 14px', fontSize: 14, color: 'var(--text-muted)' }}>
                  Page {page} of {pagination.pages}
                </span>
                <button disabled={page === pagination.pages} onClick={() => setPage((p) => p + 1)}
                  style={{ ...glassButton, padding: '6px 16px', fontSize: 14, opacity: page === pagination.pages ? 0.5 : 1 }}>
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {showForm && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16,
        }}>
          <div style={{ ...glassCard, padding: 32, width: '100%', maxWidth: 460, boxShadow: '0 24px 64px rgba(0,0,0,0.4)' }}>
            <h2 style={{ margin: '0 0 22px', fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>
              {editing ? 'Edit Transaction' : 'Add Transaction'}
            </h2>
            <TransactionForm
              initial={editing}
              categories={categories}
              onSubmit={handleSubmit}
              onCancel={() => { setShowForm(false); setEditing(null); }}
            />
          </div>
        </div>
      )}
    </Layout>
  );
}
