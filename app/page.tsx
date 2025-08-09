// app/page.tsx
import { redirect } from 'next/navigation';

type SearchParams = { [key: string]: string | string[] | undefined };

function hasAuthParams(sp: SearchParams) {
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

function toQueryString(sp: SearchParams) {
  const qs = new URLSearchParams();
  Object.keys(sp).forEach((k) => {
    const v = sp[k];
    if (typeof v === 'string') qs.set(k, v);
    else if (Array.isArray(v)) v.forEach((x) => qs.append(k, x as string));
  });
  const s = qs.toString();
  return s ? `?${s}` : '';
}

export default function HomePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  // If the email link landed on "/" with query params → redirect on the server
  if (hasAuthParams(searchParams)) {
    redirect(`/auth/callback${toQueryString(searchParams)}`);
  }

  // Handle rare case where an email client puts params in the hash (#...)
  // This runs instantly on the client and doesn't render your homepage UI first.
  const hashForwarder = `
    (function () {
      if (location.hash && location.hash.length > 1) {
        var raw = location.hash.slice(1);
        var h = new URLSearchParams(raw);
        var keys = ['code','error','error_code','error_description','access_token','refresh_token','email','from','next'];
        var has = false;
        for (var i=0;i<keys.length;i++){ if (h.has(keys[i])) { has = true; break; } }
        if (has) {
          var qs = h.toString();
          location.replace('/auth/callback' + (qs ? '?' + qs : ''));
        }
      }
    })();
  `;

  return (
    <html>
      <head>
        <title>Adaptaly</title>
      </head>
      <body>
        <script dangerouslySetInnerHTML={{ __html: hashForwarder }} />
        <main style={{ padding: 24 }}>
          <h1>Adaptaly</h1>
          <p>Welcome to Adaptaly.</p>
        </main>
      </body>
    </html>
  );
}