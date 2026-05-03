import Skeleton from './Skeleton';

export default function TransactionListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
      <thead>
        <tr style={{ borderBottom: '2px solid #e5e7eb', textAlign: 'left' }}>
          {['Date', 'Description', 'Category', 'Amount', ''].map((h) => (
            <th key={h} style={{
              padding: '8px 12px', color: '#6b7280', fontWeight: 500,
              textAlign: h === 'Amount' ? 'right' : 'left',
            }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }).map((_, i) => (
          <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
            <td style={{ padding: '10px 12px' }}><Skeleton width={80} /></td>
            <td style={{ padding: '10px 12px' }}><Skeleton width="70%" /></td>
            <td style={{ padding: '10px 12px' }}>
              <Skeleton width={110} height={20} borderRadius={99} />
            </td>
            <td style={{ padding: '10px 12px' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Skeleton width={70} />
              </div>
            </td>
            <td style={{ padding: '10px 12px' }}>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <Skeleton width={50} height={26} borderRadius={5} />
                <Skeleton width={56} height={26} borderRadius={5} />
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
