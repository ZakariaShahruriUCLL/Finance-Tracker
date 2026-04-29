import { useState } from 'react';
import type { Transaction } from '../types';
import { transactionsApi } from '../api/transactions';

interface Props {
  transactions: Transaction[];
  onEdit: (t: Transaction) => void;
  onDelete: (id: string) => void;
}

const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
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
    return <p style={{ textAlign: 'center', color: '#9ca3af', padding: '40px 0' }}>No transactions yet.</p>;
  }

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
      <thead>
        <tr style={{ borderBottom: '2px solid #e5e7eb', textAlign: 'left' }}>
          {['Date', 'Description', 'Category', 'Amount', ''].map((h) => (
            <th key={h} style={{ padding: '8px 12px', color: '#6b7280', fontWeight: 500,
              textAlign: h === 'Amount' ? 'right' : 'left' }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {transactions.map((t) => (
          <tr key={t.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
            <td style={{ padding: '10px 12px', color: '#6b7280', whiteSpace: 'nowrap' }}>
              {formatDate(t.date)}
            </td>
            <td style={{ padding: '10px 12px', color: '#111827' }}>
              {t.description ?? <span style={{ color: '#9ca3af' }}>—</span>}
            </td>
            <td style={{ padding: '10px 12px' }}>
              {t.category
                ? <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '2px 8px', borderRadius: 99,
                    background: t.category.color + '22', color: t.category.color,
                    fontSize: 12, fontWeight: 500,
                  }}>
                    {t.category.icon} {t.category.name}
                  </span>
                : <span style={{ color: '#9ca3af' }}>—</span>}
            </td>
            <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600,
              color: t.type === 'INCOME' ? '#15803d' : '#b91c1c', whiteSpace: 'nowrap' }}>
              {t.type === 'INCOME' ? '+' : '-'}{fmt.format(Math.abs(t.amount))}
            </td>
            <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
              {t.receiptBlobName && (
                <button
                  onClick={() => openReceipt(t.id)}
                  disabled={loadingReceipt === t.id}
                  style={{
                    marginRight: 8, padding: '4px 10px', border: '1px solid #a5b4fc',
                    borderRadius: 5, background: 'transparent', color: '#4f46e5',
                    cursor: loadingReceipt === t.id ? 'wait' : 'pointer', fontSize: 13,
                  }}
                >
                  {loadingReceipt === t.id ? '…' : 'Receipt'}
                </button>
              )}
              <button onClick={() => onEdit(t)} style={{
                marginRight: 8, padding: '4px 10px', border: '1px solid #d1d5db',
                borderRadius: 5, background: 'transparent', cursor: 'pointer', fontSize: 13,
              }}>Edit</button>
              <button onClick={() => onDelete(t.id)} style={{
                padding: '4px 10px', border: '1px solid #fca5a5',
                borderRadius: 5, background: 'transparent', color: '#dc2626', cursor: 'pointer', fontSize: 13,
              }}>Delete</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
