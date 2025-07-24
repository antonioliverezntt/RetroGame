'use client';

import styles from './styles/home.module.css';
import { instrumentSans } from './fonts';
import dynamic from 'next/dynamic';

// Dynamic import to avoid SSR issues with Phaser
const Game = dynamic(() => import('./components/Game'), {
  ssr: false,
  loading: () => (
    <div className={styles.loadingContainer} style={{ 
      width: '1000px', 
      height: '800px'
    }}>
      <div className={styles.loadingText}>
        <div>🧬 INITIALIZING VIRAL INTERFACE...</div>
        <div className={styles.loadingSubtext}>
          Loading Phaser game engine...
        </div>
      </div>
    </div>
  )
});

export default function Home() {
  return (
    <div className={`${styles.container} ${instrumentSans.className}`}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div>
            <img 
              src="/SPRITES/parasight.png" 
              alt="PARASIGHT - A bio-horror snake game where you are the cure"
              className={styles.headerLogo}
            />
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <Game className={styles.gameContainer} />
      </main>
      
      <footer className={styles.footer}>
        <p>PARASIGHT v2.0 // Enhanced Audio Experience</p>
        <p>🔊 SYSTEMS ONLINE: Ambient Soundscapes • Host-Specific Audio • Environmental FX • Full Immersion</p>
      </footer>
    </div>
  );
}
