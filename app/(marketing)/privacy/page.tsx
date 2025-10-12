import type { Metadata } from "next";
import styles from "../../../styles/pages/Privacy.module.css";

export const metadata: Metadata = {
  title: "Privacy Policy — Adaptaly",
  description: "How Adaptaly handles your data: purpose, legal basis, processors, rights, and contact."
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
        <p className={styles.lastUpdated}>Last updated: <LastUpdated /></p>
      </header>

      <section className={styles.section}>
        <h2>Who we are</h2>
        <p>
          Adaptaly ("we", "us") is an AI-powered adaptive learning platform. Controller: Adaptaly B.V., Netherlands.
        </p>
        <p>Contact: <a href="mailto:privacy@adaptaly.com">privacy@adaptaly.com</a></p>
      </section>

      <section className={styles.section}>
        <h2>What we collect and why</h2>
        <ul>
          <li>
            <strong>Email address</strong> — for waitlist updates and early access notifications.
            <br />
            <em>Legal basis:</em> Consent (GDPR Art. 6(1)(a)). You can withdraw at any time via unsubscribe.
          </li>
          <li>
            <strong>Age confirmation</strong> — to determine if parental consent is required (users under 16).
            <br />
            <em>Legal basis:</em> Legal obligation (GDPR Art. 6(1)(c) &amp; Art. 8).
          </li>
          <li>
            <strong>Parent/guardian email</strong> — for users under 16, to obtain verifiable consent.
            <br />
            <em>Legal basis:</em> Legal obligation (GDPR Art. 8).
          </li>
        </ul>
        <p>We do not collect passwords, payment information, or unnecessary personal data at this stage.</p>
      </section>

      <section className={styles.section}>
        <h2>Processors and service providers</h2>
        <p>We use the following third-party services to process your data:</p>
        <ul>
          <li><strong>Hosting &amp; CDN:</strong> Vercel (US/EU) — application hosting and delivery</li>
          <li><strong>Database:</strong> Supabase (EU) — secure data storage</li>
        </ul>
        <p>
          All processors are bound by data processing agreements and implement appropriate security measures.
        </p>
      </section>

      <section className={styles.section}>
        <h2>International transfers</h2>
        <p>
          Some of our processors may transfer data outside the EEA. When this occurs, we ensure appropriate safeguards
          are in place (e.g., Standard Contractual Clauses). Details available upon request.
        </p>
      </section>

      <section className={styles.section}>
        <h2>Data retention</h2>
        <p>
          Waitlist emails are retained until product launch or until you unsubscribe, whichever comes first.
          We may retain data longer if required by law (e.g., tax obligations, legal disputes).
        </p>
        <p>
          Pending parental consent records are deleted once consent is granted or after 30 days if no action is taken.
        </p>
      </section>

      <section className={styles.section}>
        <h2>Your rights</h2>
        <p>Under GDPR, you have the right to:</p>
        <ul>
          <li><strong>Access</strong> your personal data</li>
          <li><strong>Rectification</strong> of inaccurate data</li>
          <li><strong>Erasure</strong> ("right to be forgotten")</li>
          <li><strong>Restriction</strong> of processing</li>
          <li><strong>Data portability</strong></li>
          <li><strong>Object</strong> to processing</li>
          <li><strong>Withdraw consent</strong> at any time (via unsubscribe)</li>
        </ul>
        <p>
          To exercise your rights, contact us at <a href="mailto:privacy@adaptaly.com">privacy@adaptaly.com</a>.
        </p>
        <p>
          You also have the right to lodge a complaint with your local data protection authority
          (in NL: <a href="https://autoriteitpersoonsgegevens.nl" target="_blank" rel="noopener noreferrer">Autoriteit Persoonsgegevens</a>).
        </p>
      </section>

      <section className={styles.section}>
        <h2>Children and parental consent</h2>
        <p>
          In accordance with GDPR Article 8, processing of personal data of children under 16 requires parental consent.
          Our waitlist form includes an age confirmation step:
        </p>
        <ul>
          <li><strong>16 or older:</strong> You can join directly</li>
          <li><strong>Under 16:</strong> We require a parent/guardian email to obtain verifiable consent</li>
        </ul>
        <p>
          Parents will receive a consent link via email. The child's data is only added to our waitlist after parental approval.
        </p>
      </section>

      <section className={styles.section}>
        <h2>Cookies and analytics</h2>
        <p>
          We currently use only <strong>essential cookies</strong> required for the website to function (e.g., session management).
        </p>
        <p>
          Non-essential cookies (analytics, marketing) are not used at this time. If we add them in the future,
          we will request your consent and provide cookie management options.
        </p>
      </section>

      <section className={styles.section}>
        <h2>Security</h2>
        <p>
          We implement appropriate technical and organizational measures to protect your data, including:
        </p>
        <ul>
          <li>Encryption in transit (TLS/HTTPS)</li>
          <li>Encryption at rest (database-level)</li>
          <li>Access controls and authentication</li>
          <li>Regular security audits</li>
        </ul>
        <p>
          While we strive to protect your data, no method of transmission or storage is 100% secure.
          Please contact us immediately if you suspect unauthorized access.
        </p>
      </section>

      <section className={styles.section}>
        <h2>Changes to this policy</h2>
        <p>
          We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated
          "Last updated" date. Significant changes will be communicated via email to waitlist subscribers.
        </p>
      </section>

      <section className={styles.section}>
        <h2>Contact us</h2>
        <p>
          For questions about this Privacy Policy or to exercise your data rights, contact:
        </p>
        <p>
          <strong>Email:</strong> <a href="mailto:privacy@adaptaly.com">privacy@adaptaly.com</a>
          <br />
          <strong>Address:</strong> Adaptaly B.V., Netherlands
        </p>
      </section>
    </main>
  );
}
