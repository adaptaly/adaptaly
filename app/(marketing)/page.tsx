// app/page.tsx
import { redirect } from 'next/navigation';

type SPRecord = Record<string, string | string[] | undefined>;

function hasAuthParams(sp: SPRecord) {
  const keys = [
    'code',
    'error',
    'error_code',
    'error_description',
    'access_token',
    'refresh_token',
    'email',
    'from',
    'next',
  ];
  return keys.some((k) => sp[k] !== undefined);
}

function toQueryString(sp: SPRecord) {
  const qs = new URLSearchParams();
  for (const k of Object.keys(sp)) {
    const v = sp[k];
    if (typeof v === 'string') qs.set(k, v);
    else if (Array.isArray(v)) v.forEach((x) => qs.append(k, x as string));
  }
  const s = qs.toString();
  return s ? `?${s}` : '';
}

// NOTE: In Next 15, `searchParams` is a Promise on server components.
export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<SPRecord>;
}) {
  const sp = await searchParams;

  // If an auth email link dumped you on "/", bounce to /auth/callback on the server (no flicker).
  if (hasAuthParams(sp)) {
    redirect(`/auth/callback${toQueryString(sp)}`);
  }

  // Rare: some clients put params in the hash (#...). Tiny client-side shim forwards them.
  const hashForwarder = `
    (function () {
      if (location.hash && location.hash.length > 1) {
        var raw = location.hash.slice(1);
        var h = new URLSearchParams(raw);
        var keys = ['code','error','error_code','error_description','access_token','refresh_token','email','from','next'];
        for (var i=0;i<keys.length;i++){
          if (h.has(keys[i])) {
            var qs = h.toString();
            location.replace('/auth/callback' + (qs ? '?' + qs : ''));
            return;
          }
        }
      }
    })();
  `;

  return (
    <main style={{ padding: 24 }}>
      {/* inline, tiny; runs before any visible UI renders */}
      <script dangerouslySetInnerHTML={{ __html: hashForwarder }} />
      <h1>Adaptaly</h1>
      <p>Welcome to Adaptaly.</p>
    </main>
  );
}