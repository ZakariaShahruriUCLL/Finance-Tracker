import Skeleton from './Skeleton';
import { glassCard } from '../styles/glass';

export default function DashboardSkeleton() {
  return (
    <>
      <Skeleton height={140} borderRadius={18} style={{ marginBottom: 24 }} />

      <Skeleton width={120} height={16} style={{ marginBottom: 14 }} />
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 32 }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ ...glassCard, flex: 1, minWidth: 160, padding: '22px 26px', borderRadius: 14 }}>
            <Skeleton width={70} height={12} style={{ marginBottom: 12 }} />
            <Skeleton width={120} height={26} style={{ marginBottom: 8 }} />
            <Skeleton width={90} height={11} />
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 32 }}>
        <div style={{ ...glassCard, flex: 2, minWidth: 280, padding: '22px 18px' }}>
          <Skeleton width={220} height={14} style={{ marginBottom: 20 }} />
          <Skeleton height={220} borderRadius={6} />
        </div>
        <div style={{ ...glassCard, flex: 1, minWidth: 240, padding: '22px 18px' }}>
          <Skeleton width={200} height={14} style={{ marginBottom: 20 }} />
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
            <Skeleton width={160} height={160} borderRadius="50%" />
          </div>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <Skeleton width={100} height={12} />
              <Skeleton width={60} height={12} />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
