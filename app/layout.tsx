// app/layout.tsx
import '../styles/global.css'

export const metadata = {
  title: 'Adaptaly Beta',
  description: 'Adaptive learning built around you.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}