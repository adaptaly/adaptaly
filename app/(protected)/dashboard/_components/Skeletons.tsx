// app/(protected)/dashboard/_components/Skeletons.tsx

export function SkeletonRing() {
    return <div className="db-skel db-skel-ring" aria-hidden />;
  }
  
  export function SkeletonTileRow() {
    return (
      <div className="db-tiles">
        <div className="db-skel db-skel-tile" />
        <div className="db-skel db-skel-tile" />
      </div>
    );
  }
  
  export function SkeletonCardLines({ lines = 3 }: { lines?: number }) {
    return (
      <div className="db-card">
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="db-skel db-skel-line" />
        ))}
      </div>
    );
  }  