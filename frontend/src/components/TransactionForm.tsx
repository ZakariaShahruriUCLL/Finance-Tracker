import { useState, useEffect, type FormEvent, type CSSProperties, useRef } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Tag, Calendar, FileText, Paperclip } from 'lucide-react';
import type { Category, Transaction, TransactionFormData, TransactionType } from '../types';
import { transactionsApi } from '../api/transactions';
import { glassInput, glassButton, primaryButton } from '../styles/glass';

interface Props {
  initial?: Transaction | null;
  categories: Category[];
  onSubmit: (data: TransactionFormData) => Promise<void>;
  onCancel: () => void;
}

const labelStyle: CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 6,
  marginBottom: 7, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)',
};

function FieldLabel({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return <label style={labelStyle}>{icon}{children}</label>;
}

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
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setType(initial?.type ?? 'EXPENSE');
    setAmount(initial?.amount ? String(initial.amount) : '');
    setCategoryId(initial?.categoryId ?? '');
    setDate(toDateValue(initial?.date));
    setDescription(initial?.description ?? '');
    setReceiptFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setError('');
  }, [initial?.id]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (!amount || parseFloat(amount) <= 0) { setError('Amount must be greater than 0'); return; }
    setSaving(true);
    try {
      let receiptBlobName: string | undefined;
      if (receiptFile) {
        const res = await transactionsApi.uploadReceipt(receiptFile);
        receiptBlobName = res.data.blobName;
      }
      await onSubmit({
        type, amount: parseFloat(amount),
        categoryId: categoryId || null, date,
        description: description.trim() || null, receiptBlobName,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setError((err as any)?.response?.data?.error ?? msg);
    } finally {
      setSaving(false);
    }
  }

  const inputStyle: CSSProperties = {
    ...glassInput, display: 'block', width: '100%', padding: '9px 12px', fontSize: 14,
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Type toggle */}
      <div style={{ marginBottom: 18 }}>
        <span style={{ ...labelStyle, marginBottom: 8 }}>Transaction Type</span>
        <div style={{
          display: 'flex',
          border: '1px solid var(--glass-border-strong)',
          borderRadius: 10, overflow: 'hidden',
          background: 'var(--glass-input-bg)',
          backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
        }}>
          {(['EXPENSE', 'INCOME'] as const).map((t) => {
            const active = type === t;
            return (
              <button key={t} type="button" onClick={() => setType(t)} style={{
                flex: 1, padding: '10px 0', border: 'none', cursor: 'pointer', fontSize: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                fontWeight: active ? 700 : 500,
                background: active
                  ? (t === 'INCOME' ? 'var(--bg-income-toggle)' : 'var(--bg-expense-toggle)')
                  : 'transparent',
                color: active
                  ? (t === 'INCOME' ? 'var(--color-income)' : 'var(--color-expense)')
                  : 'var(--text-muted)',
                transition: 'all 0.2s',
              }}>
                {t === 'INCOME'
                  ? <TrendingUp size={15} strokeWidth={active ? 2.5 : 1.75} />
                  : <TrendingDown size={15} strokeWidth={active ? 2.5 : 1.75} />}
                {t === 'INCOME' ? 'Income' : 'Expense'}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <FieldLabel icon={<DollarSign size={13} strokeWidth={2} color="var(--text-faint)" />}>Amount</FieldLabel>
        <input style={inputStyle} type="number" min="0.01" step="0.01" placeholder="0.00"
          value={amount} onChange={(e) => setAmount(e.target.value)} required />
      </div>

      <div style={{ marginBottom: 14 }}>
        <FieldLabel icon={<Tag size={13} strokeWidth={2} color="var(--text-faint)" />}>Category</FieldLabel>
        <select style={inputStyle} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="">— Uncategorised —</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.icon ? `${c.icon} ` : ''}{c.name}</option>)}
        </select>
      </div>

      <div style={{ marginBottom: 14 }}>
        <FieldLabel icon={<Calendar size={13} strokeWidth={2} color="var(--text-faint)" />}>Date</FieldLabel>
        <input style={inputStyle} type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
      </div>

      <div style={{ marginBottom: 14 }}>
        <FieldLabel icon={<FileText size={13} strokeWidth={2} color="var(--text-faint)" />}>
          Description
          <span style={{ color: 'var(--text-faint)', fontWeight: 400, fontSize: 12, marginLeft: 2 }}>(optional)</span>
        </FieldLabel>
        <input style={inputStyle} type="text" placeholder="e.g. Grocery run"
          value={description} onChange={(e) => setDescription(e.target.value)} maxLength={200} />
      </div>

      <div style={{ marginBottom: 18 }}>
        <FieldLabel icon={<Paperclip size={13} strokeWidth={2} color="var(--text-faint)" />}>
          Receipt
          <span style={{ color: 'var(--text-faint)', fontWeight: 400, fontSize: 12, marginLeft: 2 }}>(optional — image or PDF, max 10 MB)</span>
        </FieldLabel>
        {initial?.receiptBlobName && !receiptFile && (
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
            A receipt is already attached. Select a new file to replace it.
          </p>
        )}
        <input ref={fileInputRef} style={{ ...inputStyle, padding: '7px 12px' }}
          type="file" accept="image/*,application/pdf"
          onChange={(e) => setReceiptFile(e.target.files?.[0] ?? null)} />
      </div>

      {error && <p style={{ color: 'var(--color-expense)', fontSize: 13, marginBottom: 14 }}>{error}</p>}

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button type="button" onClick={onCancel} style={{ ...glassButton, padding: '9px 18px', fontSize: 14 }}>
          Cancel
        </button>
        <button type="submit" disabled={saving} style={{
          ...primaryButton, padding: '9px 20px', fontSize: 14,
          cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
        }}>
          {saving ? 'Saving…' : initial?.id ? 'Save Changes' : 'Add Transaction'}
        </button>
      </div>
    </form>
  );
}
