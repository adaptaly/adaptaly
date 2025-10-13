import type { Metadata } from "next";
import styles from "../../../styles/pages/Privacy.module.css";

export const metadata: Metadata = {
  title: "Privacy Policy — Adaptaly",
  description:
    "How Adaptaly handles your data: purpose, legal basis, processors, rights, parental consent, and contact details.",
};

function LastUpdated() {
  const d = new Date();
  const iso = d.toISOString().split("T")[0];
  return <span>{iso}</span>;
}

export default function PrivacyPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1>Privacy Policy</h1>
        <p className={styles.lastUpdated}>
          Last updated: <LastUpdated />
        </p>
      </header>

      <section className={styles.section}>
        <h2>Who we are</h2>
        <p>
          Adaptaly ("we", "us") is a personal project and educational platform
          created and managed by an individual developer based in the
          Netherlands. Adaptaly helps students study more effectively using
          AI-powered tools.
        </p>
        <p>
          Contact:{" "}
          <a href="mailto:adaptaly@gmail.com">adaptaly@gmail.com</a>
        </p>
      </section>

      <section className={styles.section}>
        <h2>What we collect and why</h2>
        <ul>
          <li>
            <strong>Email address</strong> - used to manage the waitlist and
            send early access or product updates.
            <br />
            <em>Legal basis:</em> Consent (GDPR Art. 6 (1)(a)). You can withdraw
            your consent at any time using the unsubscribe option.
          </li>
          <li>
            <strong>Age confirmation</strong> - used to determine if parental
            consent is required for users under 16.
            <br />
            <em>Legal basis:</em> Legal obligation (GDPR Art. 6 (1)(c) and Art. 8).
          </li>
          <li>
            <strong>Parent or guardian email</strong> - for minors, used only to
            obtain verifiable consent.
            <br />
            <em>Legal basis:</em> Legal obligation (GDPR Art. 8).
          </li>
        </ul>
        <p>
          We do not collect passwords, payment information, or any data that is
          not necessary for the waitlist and consent process.
        </p>
      </section>

      <section className={styles.section}>
        <h2>Processors and service providers</h2>
        <p>
          Adaptaly uses trusted third-party services to host and process limited
          data securely:
        </p>
        <ul>
          <li>
            <strong>Hosting and CDN:</strong> Vercel (US/EU) for application
            hosting and content delivery.
          </li>
          <li>
            <strong>Database:</strong> Supabase (EU) for secure data storage.
          </li>
          <li>
            <strong>Email delivery:</strong> Brevo (EU) for sending parental
            consent and waitlist emails.
          </li>
        </ul>
        <p>
          These processors follow strict security and privacy practices and are
          bound by data processing agreements.
        </p>
      </section>

      <section className={styles.section}>
        <h2>International transfers</h2>
        <p>
          Some service providers may process data outside the EEA. When this
          happens, we ensure adequate protections are in place such as Standard
          Contractual Clauses approved by the European Commission.
        </p>
      </section>

      <section className={styles.section}>
        <h2>Data retention</h2>
        <p>
          Waitlist data is stored until Adaptaly launches or until you
          unsubscribe, whichever comes first. Data may be retained longer only
          if required by law.
        </p>
        <p>
          Pending parental consent records are deleted after consent is granted
          or automatically after 30 days if no response is received.
        </p>
      </section>

      <section className={styles.section}>
        <h2>Your rights</h2>
        <p>Under the GDPR, you have the right to:</p>
        <ul>
          <li>Access your personal data</li>
          <li>Rectify inaccurate or incomplete data</li>
          <li>Request erasure (right to be forgotten)</li>
          <li>Restrict or object to processing</li>
          <li>Request data portability</li>
          <li>Withdraw consent at any time</li>
        </ul>
        <p>
          To exercise your rights, contact{" "}
          <a href="mailto:adaptaly@gmail.com">adaptaly@gmail.com</a>.
        </p>
        <p>
          You may also contact the Dutch Data Protection Authority at{" "}
          <a
            href="https://autoriteitpersoonsgegevens.nl"
            target="_blank"
            rel="noopener noreferrer"
          >
            autoriteitpersoonsgegevens.nl
          </a>
          .
        </p>
      </section>

      <section className={styles.section}>
        <h2>Children and parental consent</h2>
        <p>
          In accordance with GDPR Article 8, children under 16 require parental
          consent before their data can be processed. The waitlist includes an
          age confirmation step:
        </p>
        <ul>
          <li>
            <strong>16 or older:</strong> You can join directly.
          </li>
          <li>
            <strong>Under 16:</strong> A parent or guardian email is required to
            obtain consent.
          </li>
        </ul>
        <p>
          Parents receive an email containing a consent link. The child's data
          is only added to the waitlist after approval.
        </p>
      </section>

      <section className={styles.section}>
        <h2>Cookies and analytics</h2>
        <p>
          We currently use only <strong>essential cookies</strong> required for
          the website to function correctly. We do not use analytics,
          advertising, or tracking cookies at this time.
        </p>
        <p>
          If we add analytics or non-essential cookies later, we will update
          this policy and ask for consent.
        </p>
      </section>

      <section className={styles.section}>
        <h2>Security</h2>
        <p>We take reasonable technical and organizational measures to protect your data:</p>
        <ul>
          <li>Encryption in transit (HTTPS and TLS)</li>
          <li>Encryption at rest in the database</li>
          <li>Access control and authentication</li>
          <li>Regular reviews of dependencies and configurations</li>
        </ul>
        <p>
          While we strive to protect your information, no system is completely
          secure. Please contact us immediately if you suspect unauthorized
          access to your data.
        </p>
      </section>

      <section className={styles.section}>
        <h2>Changes to this policy</h2>
        <p>
          This policy may be updated from time to time. Updates will be posted
          on this page with a new Last updated date. Significant changes will be
          announced by email to waitlist subscribers.
        </p>
      </section>

      <section className={styles.section}>
        <h2>Contact</h2>
        <p>
          For any questions about this Privacy Policy or your personal data,
          contact:
        </p>
        <p>
          <strong>Email:</strong>{" "}
          <a href="mailto:adaptaly@gmail.com">adaptaly@gmail.com</a>
          <br />
          <strong>Controller:</strong> Individual developer based in the Netherlands
        </p>
      </section>
    </main>
  );
}