import { useState, useEffect, type FormEvent, type CSSProperties } from 'react';
import type { Category, Transaction, TransactionFormData, TransactionType } from '../types';

interface Props {
  initial?: Transaction | null;
  categories: Category[];
  onSubmit: (data: TransactionFormData) => Promise<void>;
  onCancel: () => void;
}

const inputStyle: CSSProperties = {
  display: 'block', width: '100%', padding: '8px 10px',
  border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, boxSizing: 'border-box',
};

const labelStyle: CSSProperties = {
  display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 500, color: '#374151',
};

function toDateValue(value?: string | null): string {
  if (!value) return new Date().toISOString().slice(0, 10);
  return new Date(value).toISOString().slice(0, 10);
}

export default function TransactionForm({ initial, categories, onSubmit, onCancel }: Props) {
  const [type, setType] = useState<TransactionType>(initial?.type ?? 'EXPENSE');
  const [amount, setAmount] = useState(initial?.amount ? String(initial.amount) : '');
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? '');
  const [date, setDate] = useState(toDateValue(initial?.date));
  const [description, setDescription] = useState(initial?.description ?? '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setType(initial?.type ?? 'EXPENSE');
    setAmount(initial?.amount ? String(initial.amount) : '');
    setCategoryId(initial?.categoryId ?? '');
    setDate(toDateValue(initial?.date));
    setDescription(initial?.description ?? '');
    setError('');
  }, [initial?.id]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (!amount || parseFloat(amount) <= 0) { setError('Amount must be greater than 0'); return; }
    setSaving(true);
    try {
      await onSubmit({
        type,
        amount: parseFloat(amount),
        categoryId: categoryId || null,
        date,
        description: description.trim() || null,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setError((err as any)?.response?.data?.error ?? msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Type toggle */}
      <div style={{ marginBottom: 16 }}>
        <span style={labelStyle}>Type</span>
        <div style={{ display: 'flex', border: '1px solid #d1d5db', borderRadius: 6, overflow: 'hidden' }}>
          {(['EXPENSE', 'INCOME'] as const).map((t) => (
            <button key={t} type="button" onClick={() => setType(t)} style={{
              flex: 1, padding: '8px 0', border: 'none', cursor: 'pointer', fontSize: 14,
              fontWeight: type === t ? 600 : 400,
              background: type === t ? (t === 'INCOME' ? '#dcfce7' : '#fee2e2') : '#f9fafb',
              color: type === t ? (t === 'INCOME' ? '#15803d' : '#b91c1c') : '#6b7280',
            }}>
              {t === 'INCOME' ? '↑ Income' : '↓ Expense'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Amount</label>
        <input style={inputStyle} type="number" min="0.01" step="0.01" placeholder="0.00"
          value={amount} onChange={(e) => setAmount(e.target.value)} required />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Category</label>
        <select style={inputStyle} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="">— Uncategorised —</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.icon ? `${c.icon} ` : ''}{c.name}</option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Date</label>
        <input style={inputStyle} type="date" value={date}
          onChange={(e) => setDate(e.target.value)} required />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>
          Description <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span>
        </label>
        <input style={inputStyle} type="text" placeholder="e.g. Grocery run"
          value={description} onChange={(e) => setDescription(e.target.value)} maxLength={200} />
      </div>

      {error && <p style={{ color: '#dc2626', fontSize: 13, marginBottom: 12 }}>{error}</p>}

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button type="button" onClick={onCancel} style={{
          padding: '8px 16px', border: '1px solid #d1d5db', borderRadius: 6,
          background: 'transparent', cursor: 'pointer',
        }}>Cancel</button>
        <button type="submit" disabled={saving} style={{
          padding: '8px 16px', border: 'none', borderRadius: 6,
          background: '#4f46e5', color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 500,
        }}>
          {saving ? 'Saving…' : initial?.id ? 'Update' : 'Add'}
        </button>
      </div>
    </form>
  );
}
