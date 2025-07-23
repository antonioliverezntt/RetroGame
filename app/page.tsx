import styles from './styles/home.module.css';
import { instrumentSans } from './fonts';

export default function Home() {
  return (
    <div className={`${styles.container} ${instrumentSans.className}`}>
      <header className={styles.header}>
        <h1>Next.js starter template</h1>
      </header>

      <main>
        <p>Your new Next.js project starts here.</p>
      </main>
    </div>
  );
}
