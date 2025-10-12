import Image from "next/image";
import styles from "../../styles/layout/HowItWorks.module.css";

export default function HowItWorks() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <h2 className={styles.title}>How Adaptaly works</h2>
        <p className={styles.subtitle}>
          Three simple steps from chaos to clarity
        </p>

        <div className={styles.illustration}>
          <Image
            src="/images/sections/how-it-works.png"
            alt="Diagram showing three steps: messy materials being processed by AI, then organized into structured output"
            width={1000}
            height={358}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1000px"
          />
        </div>
      </div>
    </section>
  );
}
