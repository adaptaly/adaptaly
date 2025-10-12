import styles from "../../styles/layout/Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.left}>
          <p className={styles.logo}>Adaptaly</p>
          <p className={styles.copyright}>© 2025 Adaptaly</p>
        </div>

        <div className={styles.right}>
          <a href="/privacy" className={styles.link}>
            Privacy Policy
          </a>
        </div>
      </div>
    </footer>
  );
}
