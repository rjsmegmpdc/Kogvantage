'use client';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: number;
  className?: string;
}

export function Skeleton({ width = '100%', height = 16, borderRadius = 4, className = '' }: SkeletonProps) {
  return (
    <div
      className={className}
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: 'var(--color-surface-overlay)',
        animation: 'pulse 1.5s ease-in-out infinite',
      }}
    />
  );
}

export function CardSkeleton() {
  return (
    <div
      style={{
        padding: 20,
        borderRadius: 8,
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
      }}
    >
      <Skeleton width={120} height={12} />
      <div style={{ height: 8 }} />
      <Skeleton width={80} height={24} />
      <div style={{ height: 12 }} />
      <Skeleton width="60%" height={10} />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 12 }}>
        <Skeleton width={200} height={14} />
        <Skeleton width={100} height={14} />
        <Skeleton width={150} height={14} />
        <Skeleton width={80} height={14} />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ display: 'flex', gap: 12, opacity: 1 - i * 0.15 }}>
          <Skeleton width={200} height={12} />
          <Skeleton width={100} height={12} />
          <Skeleton width={150} height={12} />
          <Skeleton width={80} height={12} />
        </div>
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
      <div
        style={{
          padding: 20,
          borderRadius: 8,
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
        }}
      >
        <Skeleton width={160} height={16} />
        <div style={{ height: 16 }} />
        <TableSkeleton rows={6} />
      </div>
    </div>
  );
}
