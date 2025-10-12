import Image from "next/image";
import styles from "../../styles/layout/Hero.module.css";
import WaitlistForm from "../ui/WaitlistForm";

export default function Hero() {
  return (
    <header className={styles.hero}>
      <div className={styles.container}>
        <div className={styles.content}>
          <p className={styles.logo}>Adaptaly</p>

          <h1 className={styles.title}>
            Stop feeling lost.
            <br />
            Start studying smarter.
          </h1>

          <p className={styles.description}>
            Adaptive AI coach that plans your day and shows exactly what to review next. Backed by learning science.
          </p>

          <WaitlistForm />

          <p className={styles.disclaimer}>
            Free access. No spam. Unsubscribe anytime.
          </p>
        </div>

        <div className={styles.illustration}>
          <Image
            src="/images/hero/adapting-illustration.png"
            alt="Adaptive learning flow diagram showing how Adaptaly analyzes your progress, determines what you need to review, and creates personalized study paths leading to mastery"
            width={420}
            height={480}
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 420px"
          />
        </div>
      </div>
    </header>
  );
}
