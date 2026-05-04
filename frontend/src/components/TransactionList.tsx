import { useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Pencil, Trash2, Receipt, CalendarDays, Tag, DollarSign, Inbox } from 'lucide-react';
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

const colHead: React.CSSProperties = {
  padding: '10px 12px',
  color: 'var(--text-faint)',
  fontWeight: 600,
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: '0.07em',
};

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
    return (
      <div style={{ textAlign: 'center', padding: '52px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background: 'var(--glass-bg-subtle)',
          border: '1px solid var(--glass-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Inbox size={24} strokeWidth={1.5} color="var(--text-faint)" />
        </div>
        <p style={{ margin: 0, color: 'var(--text-faint)', fontSize: 14, fontWeight: 500 }}>No transactions yet</p>
        <p style={{ margin: 0, color: 'var(--text-faint)', fontSize: 12 }}>Add your first transaction to get started</p>
      </div>
    );
  }

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
      <thead>
        <tr style={{ borderBottom: '1px solid var(--border-divider)' }}>
          <th style={{ ...colHead, width: 32 }} />
          <th style={{ ...colHead, textAlign: 'left' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <CalendarDays size={11} strokeWidth={2} />Date
            </span>
          </th>
          <th style={{ ...colHead, textAlign: 'left' }}>Description</th>
          <th style={{ ...colHead, textAlign: 'left' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Tag size={11} strokeWidth={2} />Category
            </span>
          </th>
          <th style={{ ...colHead, textAlign: 'right' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'flex-end' }}>
              <DollarSign size={11} strokeWidth={2} />Amount
            </span>
          </th>
          <th style={{ ...colHead, width: 120 }} />
        </tr>
      </thead>
      <tbody>
        {transactions.map((t) => {
          const isIncome = t.type === 'INCOME';
          return (
            <tr key={t.id} style={{ borderBottom: '1px solid var(--border-row)' }}>
              {/* Type indicator */}
              <td style={{ padding: '10px 6px 10px 12px' }}>
                <div style={{
                  width: 26, height: 26, borderRadius: 8, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isIncome ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.10)',
                  border: `1px solid ${isIncome ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.18)'}`,
                }}>
                  {isIncome
                    ? <ArrowDownLeft size={13} strokeWidth={2.5} color="var(--color-income)" />
                    : <ArrowUpRight size={13} strokeWidth={2.5} color="var(--color-expense)" />}
                </div>
              </td>
              <td style={{ padding: '10px 12px', color: 'var(--text-muted)', whiteSpace: 'nowrap', fontSize: 13 }}>
                {formatDate(t.date)}
              </td>
              <td style={{ padding: '10px 12px', color: 'var(--text-primary)', fontWeight: 500 }}>
                {t.description ?? <span style={{ color: 'var(--text-faint)', fontWeight: 400 }}>—</span>}
              </td>
              <td style={{ padding: '10px 12px' }}>
                {t.category
                  ? <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '3px 10px', borderRadius: 99,
                      background: t.category.color + '18', color: t.category.color,
                      fontSize: 12, fontWeight: 600, border: `1px solid ${t.category.color}30`,
                    }}>
                      {t.category.icon
                        ? <span style={{ fontSize: 11 }}>{t.category.icon}</span>
                        : <Tag size={10} strokeWidth={2.5} />}
                      {t.category.name}
                    </span>
                  : <span style={{ color: 'var(--text-faint)', fontSize: 12 }}>—</span>}
              </td>
              <td style={{
                padding: '10px 12px', textAlign: 'right', fontWeight: 700,
                fontSize: 14, whiteSpace: 'nowrap',
                color: isIncome ? 'var(--color-income)' : 'var(--color-expense)',
                fontVariantNumeric: 'tabular-nums',
              }}>
                {isIncome ? '+' : '−'}{fmt.format(Math.abs(t.amount))}
              </td>
              <td style={{ padding: '10px 12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                <div style={{ display: 'flex', gap: 5, justifyContent: 'flex-end' }}>
                  {t.receiptBlobName && (
                    <button
                      onClick={() => openReceipt(t.id)}
                      disabled={loadingReceipt === t.id}
                      title="View receipt"
                      style={{
                        ...glassButton, padding: '5px 8px',
                        color: '#818cf8', border: '1px solid rgba(129,140,248,0.3)',
                        cursor: loadingReceipt === t.id ? 'wait' : 'pointer',
                        display: 'flex', alignItems: 'center', gap: 4, fontSize: 12,
                      }}
                    >
                      <Receipt size={13} strokeWidth={1.75} />
                      {loadingReceipt === t.id ? '…' : ''}
                    </button>
                  )}
                  <button onClick={() => onEdit(t)} title="Edit" style={{ ...glassButton, padding: '5px 8px', display: 'flex', alignItems: 'center' }}>
                    <Pencil size={13} strokeWidth={1.75} />
                  </button>
                  <button onClick={() => onDelete(t.id)} title="Delete" style={{ ...dangerButton, padding: '5px 8px', display: 'flex', alignItems: 'center' }}>
                    <Trash2 size={13} strokeWidth={1.75} />
                  </button>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
