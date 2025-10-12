import styles from "../../styles/layout/BottomCTA.module.css";
import WaitlistForm from "../ui/WaitlistForm";

export default function BottomCTA() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <h2 className={styles.title}>Ready to stop feeling lost?</h2>
        <p className={styles.subtitle}>
          Join the private beta and be among the first to study smarter.
        </p>

        <WaitlistForm />

        <p className={styles.disclaimer}>
          Free early access. <strong>Your feedback shapes Adaptaly.</strong>
        </p>
      </div>
    </section>
  );
}
