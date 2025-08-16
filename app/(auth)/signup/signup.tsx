// app/signup/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/src/lib/supabaseClient';
import './signup.css';

// Canonical base URL: prefer env, fallback to window.origin
const baseUrl =
  (
    typeof window === 'undefined'
      ? process.env.NEXT_PUBLIC_SITE_URL
      : process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
  )?.replace(/\/$/, '') || 'https://www.adaptaly.com';

export default function SignupChoice() {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const router = useRouter();

  const handleGoogleClick = async () => {
    if (isGoogleLoading || isEmailLoading) return;
    setIsGoogleLoading(true);
    const supabase = supabaseBrowser();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // Always go through our callback and land on /dashboard
        redirectTo: `${baseUrl}/auth/callback?next=/dashboard`,
      },
    });
    // Supabase redirects away
  };

  const handleEmailClick = () => {
    if (isGoogleLoading || isEmailLoading) return;
    setIsEmailLoading(true);
    router.push('/emailsignup');
  };

  const handleBackClick = () => router.back();

  return (
    <main className="background" role="main">
      <section className="signup-frame" role="region" aria-labelledby="signup-title">
        <button
          type="button"
          className="back-btn"
          onClick={handleBackClick}
          aria-label="Go back to previous page"
        >
          <svg className="back-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
               fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          <span>Back</span>
        </button>

        <header className="signup-header">
          <h1 id="signup-title" className="signup-title">Create Your Account</h1>
          <p className="signup-subtitle">Start learning smarter and faster with Adaptaly’s AI powered tools.</p>
        </header>

        <div className="signup-actions">
          <button
            type="button"
            className="btn btn-google"
            aria-label="Sign up with Google"
            aria-busy={isGoogleLoading}
            onClick={handleGoogleClick}
            disabled={isGoogleLoading || isEmailLoading}
          >
            <span className="btn-content" aria-live="polite">
              <svg className="btn-icon google" viewBox="-3 0 262 262" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid">
                <path d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027" fill="#4285F4"/>
                <path d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1" fill="#34A853"/>
                <path d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602l42.356-32.782" fill="#FBBC05"/>
                <path d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251" fill="#EB4335"/>
              </svg>
              <span className="btn-label">{isGoogleLoading ? 'Please wait…' : 'Sign up with Google'}</span>
            </span>
            {isGoogleLoading && <span className="spinner spinner-dark" aria-hidden="true" />}
          </button>

          <button
            type="button"
            className="btn btn-email"
            aria-label="Continue with Email"
            aria-busy={isEmailLoading}
            onClick={handleEmailClick}
            disabled={isGoogleLoading || isEmailLoading}
          >
            <span className="btn-content" aria-live="polite">
              <svg className="btn-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M3.75 6.75C3.75 5.783 4.533 5 5.5 5h13c.966 0 1.75.783 1.75 1.75v10.5A1.75 1.75 0 0 1 18.5 19h-13A1.75 1.75 0 0 1 3.75 17.25V6.75Z" stroke="white" strokeWidth="1.6" strokeLinejoin="round"/>
                <path d="M4.5 7.5 12 12.25 19.5 7.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="btn-label">{isEmailLoading ? 'Please wait…' : 'Continue with Email'}</span>
            </span>
            {isEmailLoading && <span className="spinner" aria-hidden="true" />}
          </button>
        </div>

        <nav className="already-have-an-container" aria-label="Existing account">
          <span className="already-have-an">Already have an account?</span>
          <span className="span"> </span>
          <a className="sign-in" href="/signin">Sign in</a>
        </nav>
      </section>
    </main>
  );
}