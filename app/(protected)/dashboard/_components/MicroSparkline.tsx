// app/(protected)/dashboard/_components/MicroSparkline.tsx
// Tiny dependency-free SVG sparkline, accessible and theme-aware.

type Props = {
    data: number[];
    width?: number;
    height?: number;
    ariaLabel?: string;
  };
  
  export default function MicroSparkline({
    data,
    width = 120,
    height = 32,
    ariaLabel = "7 day trend",
  }: Props) {
    if (!data || data.length < 2) {
      return (
        <div
          role="img"
          aria-label={`${ariaLabel}: not enough data`}
          style={{ width, height, opacity: 0.4 }}
        />
      );
    }
  
    const w = width;
    const h = height;
    const n = data.length;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = Math.max(1, max - min);
  
    const pts = data.map((v, i) => {
      const x = (i / (n - 1)) * (w - 2) + 1;
      const y = h - ((v - min) / range) * (h - 2) - 1;
      return `${x},${y}`;
    });
  
    return (
      <svg
        role="img"
        aria-label={ariaLabel}
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        className="db-sparkline"
        focusable="false"
      >
        <polyline
          points={pts.join(" ")}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    );
  }  