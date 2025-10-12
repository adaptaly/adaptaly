import styles from "../../styles/layout/ProblemSolution.module.css";
import QuestionIcon from "../icons/QuestionIcon";
import CheckmarkIcon from "../icons/CheckmarkIcon";
import ArrowRightIcon from "../icons/ArrowRightIcon";

export default function ProblemSolution() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <h2 className={styles.sectionTitle}>
          You&apos;re not alone. Here&apos;s what changes.
        </h2>
        <p className={styles.sectionSubtitle}>
          Students using Adaptaly go from stressed to confident in days, not weeks.
        </p>

        <div className={styles.grid}>
          {/* Problem Card 1 */}
          <div className={styles.problemCard}>
            <QuestionIcon className={styles.icon} />
            <p className={styles.problemText}>
              I feel lost and don&apos;t know what to study next
            </p>
          </div>

          {/* Arrow */}
          <div className={styles.arrow}>
            <ArrowRightIcon />
          </div>

          {/* Benefit Card 1 */}
          <div className={styles.benefitCard}>
            <CheckmarkIcon className={styles.icon} />
            <h3 className={styles.benefitTitle}>Always know what to review today</h3>
            <p className={styles.benefitDescription}>
              Adaptive AI plans your day based on what you need most. No guessing, no wasted time.
            </p>
          </div>

          {/* Problem Card 2 */}
          <div className={styles.problemCard}>
            <QuestionIcon className={styles.icon} />
            <p className={styles.problemText}>
              Studying feels overwhelming and stressful
            </p>
          </div>

          {/* Arrow */}
          <div className={styles.arrow}>
            <ArrowRightIcon />
          </div>

          {/* Benefit Card 2 */}
          <div className={styles.benefitCard}>
            <CheckmarkIcon className={styles.icon} />
            <h3 className={styles.benefitTitle}>Study in calm, focused sessions</h3>
            <p className={styles.benefitDescription}>
              15 to 60-minute sessions that fit your schedule. Pause, skip, or adjust anytime. You&apos;re always in control.
            </p>
          </div>

          {/* Problem Card 3 */}
          <div className={styles.problemCard}>
            <QuestionIcon className={styles.icon} />
            <p className={styles.problemText}>
              Will this actually help me improve?
            </p>
          </div>

          {/* Arrow */}
          <div className={styles.arrow}>
            <ArrowRightIcon />
          </div>

          {/* Benefit Card 3 */}
          <div className={styles.benefitCard}>
            <CheckmarkIcon className={styles.icon} />
            <h3 className={styles.benefitTitle}>See real progress, backed by science</h3>
            <p className={styles.benefitDescription}>
              Track your accuracy, confidence trends, and mastery. Powered by spaced repetition and active recall.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
