/** @type {import('next').NextConfig} */
const nextConfig = {
    // Don’t fail the Vercel build on lint errors
    eslint: { ignoreDuringBuilds: true },
  
    // keep TS type checking on (set true temporarily if you also want to bypass TS)
    typescript: { ignoreBuildErrors: false },
  };
  
  export default nextConfig;  