import Skeleton from './Skeleton';

export default function CategoriesSkeleton() {
  return (
    <>
      <Skeleton width={160} height={18} style={{ marginBottom: 12 }} />
      <div style={{ marginBottom: 32 }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
            borderRadius: 8, marginBottom: 6, background: '#fff', border: '1px solid #e5e7eb',
          }}>
            <Skeleton width={130} height={24} borderRadius={99} />
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
              <Skeleton width={52} height={26} borderRadius={5} />
              <Skeleton width={62} height={26} borderRadius={5} />
            </div>
          </div>
        ))}
      </div>

      <Skeleton width={180} height={18} style={{ marginBottom: 12 }} />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {[100, 130, 110, 95, 145, 120, 105, 135].map((w, i) => (
          <Skeleton key={i} width={w} height={28} borderRadius={99} />
        ))}
      </div>
    </>
  );
}
