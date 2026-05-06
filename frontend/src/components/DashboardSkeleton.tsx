import Skeleton from './Skeleton';
import { glassCard } from '../styles/glass';

function ChartCard({ height, children }: { height: number; children?: React.ReactNode }) {
  return (
    <div style={{ ...glassCard, flex: 1, minWidth: 280, padding: '20px 16px' }}>
      <Skeleton width={180} height={14} style={{ marginBottom: 8 }} />
      <Skeleton width={120} height={11} style={{ marginBottom: 16 }} />
      {children ?? <Skeleton height={height} borderRadius={6} />}
    </div>
  );
}

export default function DashboardSkeleton() {
  return (
    <>
      <Skeleton height={136} borderRadius={18} style={{ marginBottom: 28 }} />

      <Skeleton width={100} height={12} style={{ marginBottom: 14 }} />
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 32 }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} style={{ ...glassCard, flex: 1, minWidth: 150, padding: '20px 22px', borderRadius: 14 }}>
            <Skeleton width={60} height={10} style={{ marginBottom: 10 }} />
            <Skeleton width={100} height={24} style={{ marginBottom: 8 }} />
            <Skeleton width={80} height={10} />
          </div>
        ))}
      </div>

      <Skeleton width={120} height={12} style={{ marginBottom: 14 }} />
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 28 }}>
        <ChartCard height={210} />
        <div style={{ ...glassCard, flex: 1, minWidth: 220, padding: '20px 16px' }}>
          <Skeleton width={160} height={14} style={{ marginBottom: 16 }} />
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
            <Skeleton width={144} height={144} borderRadius="50%" />
          </div>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
              <Skeleton width={90} height={11} />
              <Skeleton width={55} height={11} />
            </div>
          ))}
        </div>
      </div>

      <Skeleton width={120} height={12} style={{ marginBottom: 14 }} />
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 28 }}>
        <ChartCard height={200} />
        <ChartCard height={200} />
      </div>

      <Skeleton width={160} height={12} style={{ marginBottom: 14 }} />
      <div style={{ ...glassCard, padding: '20px 24px', marginBottom: 28 }}>
        {[140, 90, 110, 70, 120].map((w, i) => (
          <div key={i} style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <Skeleton width={w} height={12} />
              <Skeleton width={60} height={12} />
            </div>
            <Skeleton height={8} borderRadius={4} />
          </div>
        ))}
      </div>
    </>
  );
}
