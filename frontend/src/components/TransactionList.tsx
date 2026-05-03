import { useState } from 'react';
import type { Transaction } from '../types';
import { transactionsApi } from '../api/transactions';
import { glassButton, dangerButton } from '../styles/glass';

interface Props {
  transactions: Transaction[];
  onEdit: (t: Transaction) => void;
  onDelete: (id: string) => void;
}

const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function TransactionList({ transactions, onEdit, onDelete }: Props) {
  const [loadingReceipt, setLoadingReceipt] = useState<string | null>(null);

  async function openReceipt(id: string) {
    setLoadingReceipt(id);
    try {
      const res = await transactionsApi.getReceiptUrl(id);
      window.open(res.data.url, '_blank', 'noopener,noreferrer');
    } finally {
      setLoadingReceipt(null);
    }
  }

  if (transactions.length === 0) {
    return <p style={{ textAlign: 'center', color: 'var(--text-faint)', padding: '40px 0' }}>No transactions yet.</p>;
  }

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
      <thead>
        <tr style={{ borderBottom: '1px solid var(--border-divider)', textAlign: 'left' }}>
          {['Date', 'Description', 'Category', 'Amount', ''].map((h) => (
            <th key={h} style={{
              padding: '10px 12px', color: 'var(--text-faint)', fontWeight: 600, fontSize: 11,
              textTransform: 'uppercase', letterSpacing: '0.06em',
              textAlign: h === 'Amount' ? 'right' : 'left',
            }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {transactions.map((t) => (
          <tr key={t.id} style={{ borderBottom: '1px solid var(--border-row)' }}>
            <td style={{ padding: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
              {formatDate(t.date)}
            </td>
            <td style={{ padding: '12px', color: 'var(--text-primary)' }}>
              {t.description ?? <span style={{ color: 'var(--text-faint)' }}>—</span>}
            </td>
            <td style={{ padding: '12px' }}>
              {t.category
                ? <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '3px 10px', borderRadius: 99,
                    background: t.category.color + '22', color: t.category.color,
                    fontSize: 12, fontWeight: 500, border: `1px solid ${t.category.color}33`,
                  }}>
                    {t.category.icon} {t.category.name}
                  </span>
                : <span style={{ color: 'var(--text-faint)' }}>—</span>}
            </td>
            <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600, whiteSpace: 'nowrap',
              color: t.type === 'INCOME' ? 'var(--color-income)' : 'var(--color-expense)' }}>
              {t.type === 'INCOME' ? '+' : '-'}{fmt.format(Math.abs(t.amount))}
            </td>
            <td style={{ padding: '12px', whiteSpace: 'nowrap', textAlign: 'right' }}>
              {t.receiptBlobName && (
                <button onClick={() => openReceipt(t.id)} disabled={loadingReceipt === t.id}
                  style={{
                    ...glassButton, marginRight: 6, padding: '5px 12px', fontSize: 13,
                    color: '#818cf8', border: '1px solid rgba(129, 140, 248, 0.4)',
                    cursor: loadingReceipt === t.id ? 'wait' : 'pointer',
                  }}>
                  {loadingReceipt === t.id ? '…' : 'Receipt'}
                </button>
              )}
              <button onClick={() => onEdit(t)} style={{ ...glassButton, marginRight: 6, padding: '5px 12px', fontSize: 13 }}>
                Edit
              </button>
              <button onClick={() => onDelete(t.id)} style={{ ...dangerButton, padding: '5px 12px', fontSize: 13 }}>
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
