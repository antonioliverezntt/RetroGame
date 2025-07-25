'use client';

import { useEffect, useRef } from 'react';
import * as Phaser from 'phaser';

// Game configuration constants
const GAME_CONFIG = {
  GRID_SIZE: 32, // Size of each grid cell in pixels
  GRID_WIDTH: 25, // Number of grid cells horizontally
  GRID_HEIGHT: 20, // Number of grid cells vertically
  MUTATION_THRESHOLD: 30, // Score needed to trigger first mutation
  MUTATION_INTERVAL: 50, // Score interval for subsequent mutations
  LEVEL_PROGRESSION_SCORE: 100, // Score needed to advance to next level
} as const;

// Calculate canvas dimensions based on grid
const CANVAS_WIDTH = GAME_CONFIG.GRID_SIZE * GAME_CONFIG.GRID_WIDTH;
const CANVAS_HEIGHT = GAME_CONFIG.GRID_SIZE * GAME_CONFIG.GRID_HEIGHT;

// Level definitions
const LEVELS = {
  circulatory: {
    id: 1,
    name: "Circulatory System",
    subtitle: "Red Is the New Black",
    description: "So many tunnels, so little oxygen. Welcome to the bloodstream — a glorified spaghetti system.",
    theme: "circulatory",
    backgroundColor: '#220000',
    requiredScore: 0
  },
  nervous: {
    id: 2,
    name: "Nervous System", 
    subtitle: "Shock Therapy, But Worse",
    description: "Synapses. Sparks. Sudden death. The electrical system that powers existential dread.",
    theme: "nervous",
    backgroundColor: '#001122',
    requiredScore: 100
  },
  brain: {
    id: 3,
    name: "Brain System",
    subtitle: "The Final Infestation", 
    description: "All roads lead to gray matter. It's damp, wrinkled, and somehow thinks it's the protagonist.",
    theme: "brain",
    backgroundColor: '#110011',
    requiredScore: 250
  }
} as const;

// Parasight color palette
const COLORS = {
  // Virus colors
  VIRUS_HEAD: 0x66ff00,      // Bright green virus head
  VIRUS_BODY: 0x44cc00,      // Darker green virus body
  VIRUS_TAIL: 0x228800,      // Even darker green for tail
  WHITE_BLOOD_CELL: 0xffffff, // White blood cells
  UI_TEXT: 0x00ff44,          // Green UI text
  WARNING_TEXT: 0xff0044,     // Red warning text
  MUTATION_UI: 0x004400,      // Dark green mutation UI
  
  // Level 1: Circulatory colors
  CIRCULATORY_BG: 0x440000,   // Dark red background
  CAPILLARY: 0x660000,        // Blood vessel walls
  BLOOD_FLOW: 0x880000,       // Blood flow effect
  CHOLESTEROL: 0xffaa44,      // Yellow-orange cholesterol
  
  // Level 2: Nervous system colors
  NERVOUS_BG: 0x001144,       // Dark blue background
  NEURON: 0x4466ff,           // Blue neurons
  SYNAPSE: 0x6688ff,          // Lighter blue synapses
  ELECTRICAL_PULSE: 0xffff00, // Yellow electrical pulses
  ANTIBODY_DRONE: 0xff6600,   // Orange antibody drones
  
  // Level 3: Brain colors
  BRAIN_BG: 0x220022,         // Dark purple background
  GRAY_MATTER: 0x444444,      // Gray matter
  THOUGHT_BUBBLE: 0xff44ff,   // Pink thought bubbles
  MICRODRONE: 0xaa44aa,       // Purple microdrones
  NEURAL_PATHWAY: 0x664466,   // Dark purple pathways
} as const;

// Enhanced mutation definitions with level-specific mutations
const MUTATIONS = {
  // Level 1: Circulatory mutations
  spineFangs: {
    id: 'spineFangs',
    name: 'Spine Fangs',
    description: 'Perfect for breaking antibodies — and hearts.\nConsume cells from behind your head.',
    icon: '🦷',
    effect: 'rear_consumption',
    duration: -1,
    color: 0x88ff00,
    level: 1
  },
  leechLoop: {
    id: 'leechLoop', 
    name: 'Leech Loop',
    description: 'Self-harm becomes self-care.\nRegain infection points from tail collisions (once per collision).',
    icon: '🩸',
    effect: 'collision_heal',
    duration: -1,
    color: 0xff4488,
    level: 1
  },
  capillaryPhase: {
    id: 'capillaryPhase',
    name: 'Capillary Phase',
    description: 'Reality is optional. Arterial walls are suggestions.\nPass through walls briefly. Just don\'t stop there.',
    icon: '👻',
    effect: 'wall_phase',
    duration: 8000,
    color: 0x44aaff,
    level: 1
  },
  
  // Level 2: Nervous system mutations
  synapticSkip: {
    id: 'synapticSkip',
    name: 'Synaptic Skip',
    description: 'Quantum tunneling for viruses.\nBlink 2 spaces forward every 8 seconds.',
    icon: '⚡',
    effect: 'teleport_burst',
    duration: -1,
    color: 0xffff44,
    level: 2
  },
  neuroleechTendril: {
    id: 'neuroleechTendril',
    name: 'Neuroleech Tendril', 
    description: 'Emotional vampirism made manifest.\nAbsorb stunned enemies for bonus growth.',
    icon: '🧠',
    effect: 'absorb_enemies',
    duration: -1,
    color: 0x44ffff,
    level: 2
  },
  caffeineGland: {
    id: 'caffeineGland',
    name: 'Caffeine Gland',
    description: 'Speed over control. Just like the host.\nPermanent speed boost, slightly less control.',
    icon: '☕',
    effect: 'permanent_speed',
    duration: -1,
    color: 0xaa6644,
    level: 2
  },
  
  // Level 3: Brain mutations  
  dreamParasite: {
    id: 'dreamParasite',
    name: 'Dream Parasite',
    description: 'Hijack their nightmares.\nBriefly take control of enemy movement.',
    icon: '😴',
    effect: 'mind_control',
    duration: 5000,
    color: 0xff44aa,
    level: 3
  },
  neuronLace: {
    id: 'neuronLace',
    name: 'Neuron Lace',
    description: 'Fractal infection patterns.\nGrow in unpredictable patterns for extra length.',
    icon: '🕸️',
    effect: 'fractal_growth',
    duration: -1,
    color: 0xaa44ff,
    level: 3
  },
  cortexMirage: {
    id: 'cortexMirage',
    name: 'Cortex Mirage',
    description: 'Deception is the sincerest form of flattery.\nA phantom clone distracts enemies.',
    icon: '👤',
    effect: 'phantom_clone',
    duration: 15000,
    color: 0x4444ff,
    level: 3
  }
} as const;

// Host profiles from PRD
const HOSTS = {
  brayden: {
    name: "Brayden R.",
    title: "Lifestyle Influencer", 
    bio: "Brayden owns five ring lights, two poodles, and exactly zero books. Once marketed a juice cleanse that caused temporary blindness. Is currently working on a podcast about \"grinding through wellness.\"",
    intro: "Brayden believes detoxing cures trauma. Let's prove infection does too.",
    thoughts: [
      "Should I do a collab with toothpaste brands?",
      "Do lymph nodes have carbs?", 
      "I wonder if sweat can be monetized.",
      "I should start another startup. This one's only mildly toxic."
    ],
    environment: "protein_powder"
  },
  greg: {
    name: "Greg C.",
    title: "Middle Manager, Crypto Evangelist",
    bio: "Greg wears a lanyard to bed and believes \"blockchain is a lifestyle.\" Once laid off his entire team via emoji. Has five cold-brew machines in one apartment.",
    intro: "Greg's body is mostly caffeine and market denial. Time to short his bloodstream.",
    thoughts: [
      "Buy the dip... of cholesterol.",
      "Am I the mitochondria of innovation?",
      "Let's disrupt the spleen!",
      "Pain is just inefficient UX."
    ],
    environment: "caffeine_overload"
  },
  tiffany: {
    name: "Tiffany L.",
    title: "Heiress, Corporate Cannibal",
    bio: "Tiffany once bought a hospital to demolish it for a new parking garage. She thinks empathy is a \"soft skill.\" Her body contains trace amounts of real gold and zero empathy.",
    intro: "Her heart beats in lawsuits. Let's make it stop.",
    thoughts: [
      "Why is there no valet for this liver?",
      "I own 7 kidneys. Two are from tigers.",
      "Being evil is exhausting. Thank goodness I'm rich.",
      "Do viruses do PR?"
    ],
    environment: "gold_plated"
  },
  ratKings: {
    name: "The Council of Rat Kings",
    title: "Mutated Politician Hive-Mind",
    bio: "A psychic network of six sentient rats operating a trench coat. They were elected mayor in 3 cities simultaneously. Their policies include \"no bathrooms\" and \"mandatory cheese voting.\"",
    intro: "Multiple minds. One coat. Countless violations.",
    thoughts: [
      "Democracy is just organized mold.",
      "I veto this antibody.",
      "Our tail is tangled with destiny.",
      "Tax the liver. Fund the claws."
    ],
    environment: "political_chaos"
  }
} as const;

// Virus text bubbles for atmosphere
const VIRUS_TEXTS = {
  idle: [
    "This meatbag has no idea.",
    "So many cells, so little time.",
    "I'm not killing. I'm liberating tissue.",
    "Each globule brings me closer to peace.",
    "This host tastes like soda and regret.",
    "They gave up on the gym. I won't."
  ],
  consume: [
    "Delicious. Nutritious. Defenseless.",
    "One less antibody to worry about.",
    "The immune system weakens...",
    "Their resistance is futile.",
    "Mmm, white blood cells."
  ],
  mutation: [
    "Evolution feels... tingly.",
    "Adapt. Infect. Repeat.",
    "New shape. Same goal.",
    "I now have spikes. Emotionally and physically.",
    "Mutation complete. Humanity doomed."
  ],
  gameOver: [
    "The host survives. Earth weeps.",
    "They'll post about this in a 5-paragraph tweet.",
    "Human: 1. Virus: Merciful.",
    "I failed. Capitalism wins."
  ]
} as const;

interface GameProps {
  className?: string;
}

interface ActiveMutation {
  mutation: typeof MUTATIONS[keyof typeof MUTATIONS];
  activatedAt: number;
  isActive: boolean;
}

interface Enemy {
  x: number;
  y: number;
  type: 'antibody_drone' | 'microdrone';
  direction?: { x: number; y: number };
  stunned?: boolean;
  stunnedUntil?: number;
  lastMoveTime?: number; // For tracking movement timing
}

interface ElectricalPulse {
  direction: 'horizontal' | 'vertical';
  position: number; // row or column
  activatedAt: number;
  duration: number;
  warningPhase: number; // Warning phase duration (1 second)
  isDeadly: boolean; // Whether the pulse is currently deadly
}

// Enhanced audio effect generator with ambient sounds
class AudioEffects {
  private audioContext: AudioContext | null = null;
  private ambientGain: GainNode | null = null;
  private currentAmbientOscillators: OscillatorNode[] = [];

  constructor() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.ambientGain = this.audioContext.createGain();
      this.ambientGain.connect(this.audioContext.destination);
      this.ambientGain.gain.setValueAtTime(0.08, this.audioContext.currentTime); // Increased ambient volume
    } catch (e) {
      console.log('Audio not supported');
    }
  }

  // Core game sounds with host variations
  playConsume(hostEnvironment: string = 'default') {
    if (!this.audioContext) return;
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    // Host-specific consume sounds
    switch (hostEnvironment) {
      case 'protein_powder':
        // Brayden - more "processed" sound
        oscillator.frequency.setValueAtTime(450, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(650, this.audioContext.currentTime + 0.12);
        break;
      case 'caffeine_overload':
        // Greg - jittery, higher pitch
        oscillator.frequency.setValueAtTime(500, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(750, this.audioContext.currentTime + 0.08);
        break;
      case 'gold_plated':
        // Tiffany - richer, deeper tone
        oscillator.frequency.setValueAtTime(350, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(550, this.audioContext.currentTime + 0.15);
        break;
      case 'political_chaos':
        // Rat Kings - chaotic, unstable pitch
        oscillator.frequency.setValueAtTime(400 + Math.random() * 100, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(600 + Math.random() * 100, this.audioContext.currentTime + 0.1);
        break;
      default:
        oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(600, this.audioContext.currentTime + 0.1);
    }
    
    gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
    
    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + 0.15);
  }

  playMutation(mutationType: string = 'default') {
    if (!this.audioContext) return;
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    // Different sounds for different mutation types
    switch (mutationType) {
      case 'spineFangs':
        // Sharp, aggressive sound
        oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1000, this.audioContext.currentTime + 0.2);
        break;
      case 'leechLoop':
        // Healing, regenerative sound
        oscillator.frequency.setValueAtTime(250, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(450, this.audioContext.currentTime + 0.4);
        break;
      case 'capillaryPhase':
        // Phasing, ethereal sound
        oscillator.frequency.setValueAtTime(350, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(700, this.audioContext.currentTime + 0.3);
        oscillator.frequency.exponentialRampToValueAtTime(350, this.audioContext.currentTime + 0.6);
        break;
      case 'synapticSkip':
        // Quick, electric sound
        oscillator.frequency.setValueAtTime(600, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(900, this.audioContext.currentTime + 0.1);
        break;
      case 'caffeineGland':
        // Energetic, speed boost sound
        oscillator.frequency.setValueAtTime(500, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1200, this.audioContext.currentTime + 0.15);
        break;
      default:
        oscillator.frequency.setValueAtTime(300, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(800, this.audioContext.currentTime + 0.3);
    }
    
    gainNode.gain.setValueAtTime(0.08, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
    
    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + 0.4);
  }

  playLevelUp() {
    if (!this.audioContext) return;
    
    // Multi-layered level up sound
    for (let i = 0; i < 3; i++) {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      const baseFreq = 200 + (i * 100);
      oscillator.frequency.setValueAtTime(baseFreq, this.audioContext.currentTime + i * 0.1);
      oscillator.frequency.exponentialRampToValueAtTime(baseFreq * 2, this.audioContext.currentTime + 0.2 + i * 0.1);
      oscillator.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, this.audioContext.currentTime + 0.4 + i * 0.1);
      
      gainNode.gain.setValueAtTime(0.06, this.audioContext.currentTime + i * 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5 + i * 0.1);
      
      oscillator.start(this.audioContext.currentTime + i * 0.1);
      oscillator.stop(this.audioContext.currentTime + 0.6 + i * 0.1);
    }
  }

  playGameOver() {
    if (!this.audioContext) return;
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.frequency.setValueAtTime(300, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(150, this.audioContext.currentTime + 0.5);
    oscillator.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 1.0);
    
    gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 1.0);
    
    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + 1.0);
  }

  // Environmental sounds
  playElectricalPulse() {
    if (!this.audioContext) return;
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.3);
    
    gainNode.gain.setValueAtTime(0.05, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
    
    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + 0.3);
  }

  playNeuroplasticity() {
    if (!this.audioContext) return;
    
    // Shifting, morphing sound for brain maze changes
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.frequency.setValueAtTime(300, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(500, this.audioContext.currentTime + 0.2);
    oscillator.frequency.exponentialRampToValueAtTime(250, this.audioContext.currentTime + 0.4);
    oscillator.frequency.exponentialRampToValueAtTime(400, this.audioContext.currentTime + 0.6);
    
    gainNode.gain.setValueAtTime(0.04, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.6);
    
    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + 0.6);
  }

  playEnemyHit() {
    if (!this.audioContext) return;
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.frequency.setValueAtTime(150, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(300, this.audioContext.currentTime + 0.1);
    oscillator.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.2);
    
    gainNode.gain.setValueAtTime(0.08, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
    
    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + 0.2);
  }

  // Ambient level sounds
  startLevelAmbient(level: string) {
    this.stopAmbient();
    if (!this.audioContext || !this.ambientGain) return;
    
    switch (level) {
      case 'circulatory':
        // Heartbeat-like pulse
        this.createPulsingAmbient(40, 80, 1.5); // Slower, more dramatic heartbeat
        break;
      case 'nervous':
        // Electric crackling
        this.createElectricAmbient();
        break;
      case 'brain':
        // Deep, resonant brain waves
        this.createBrainWaveAmbient();
        break;
    }
  }

  private createPulsingAmbient(minFreq: number, maxFreq: number, interval: number) {
    if (!this.audioContext || !this.ambientGain) return;
    
    const oscillator = this.audioContext.createOscillator();
    const lfo = this.audioContext.createOscillator(); // Low frequency oscillator
    const lfoGain = this.audioContext.createGain();
    
    lfo.frequency.setValueAtTime(1 / interval, this.audioContext.currentTime);
    lfoGain.gain.setValueAtTime((maxFreq - minFreq) * 1.5, this.audioContext.currentTime); // Dramatically increase pulse
    
    lfo.connect(lfoGain);
    lfoGain.connect(oscillator.frequency);
    
    oscillator.frequency.setValueAtTime(minFreq, this.audioContext.currentTime);
    oscillator.connect(this.ambientGain);
    
    oscillator.start();
    lfo.start();
    
    this.currentAmbientOscillators.push(oscillator, lfo);
  }

  private createElectricAmbient() {
    if (!this.audioContext || !this.ambientGain) return;
    
    // Create multiple oscillators for electric crackling
    for (let i = 0; i < 3; i++) {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.ambientGain);
      
      oscillator.frequency.setValueAtTime(200 + i * 150, this.audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
      
      // Random modulation for crackling effect
      setInterval(() => {
        if (oscillator.frequency) {
          oscillator.frequency.setValueAtTime(
            200 + i * 150 + Math.random() * 100 - 50, 
            this.audioContext!.currentTime
          );
        }
      }, 100 + Math.random() * 200);
      
      oscillator.start();
      this.currentAmbientOscillators.push(oscillator);
    }
  }

  private createBrainWaveAmbient() {
    if (!this.audioContext || !this.ambientGain) return;
    
    // Deep alpha/theta brain wave frequencies
    const frequencies = [8, 10, 12]; // Alpha waves
    
    frequencies.forEach((freq, i) => {
      const oscillator = this.audioContext!.createOscillator();
      const gainNode = this.audioContext!.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.ambientGain!);
      
      oscillator.frequency.setValueAtTime(freq, this.audioContext!.currentTime);
      gainNode.gain.setValueAtTime(0.2, this.audioContext!.currentTime);
      
      oscillator.start();
      this.currentAmbientOscillators.push(oscillator);
    });
  }

  stopAmbient() {
    this.currentAmbientOscillators.forEach(osc => {
      try {
        osc.stop();
      } catch (e) {
        // Oscillator may already be stopped
      }
    });
    this.currentAmbientOscillators = [];
  }
}

// Main game scene class
class SnakeScene extends Phaser.Scene {
  private snake: { x: number; y: number }[] = [];
  private food: { x: number; y: number } = { x: 0, y: 0 };
  private direction: { x: number; y: number } = { x: 1, y: 0 };
  private nextDirection: { x: number; y: number } = { x: 1, y: 0 };
  private score: number = 0;
  private currentLevel: keyof typeof LEVELS = 'circulatory';
  private gameStarted: boolean = false;
  private gameOver: boolean = false;
  private showingHostIntro: boolean = true;
  private showingMutationSelection: boolean = false;
  private showingLevelTransition: boolean = false;
  private currentHost: typeof HOSTS[keyof typeof HOSTS] = HOSTS.brayden; // Will be set in create()
  private activeMutations: ActiveMutation[] = [];
  private mutationOptions: (typeof MUTATIONS[keyof typeof MUTATIONS])[] = [];
  private audio!: AudioEffects;
  private cholesterolObstacles: { x: number; y: number }[] = [];
  private enemies: Enemy[] = [];
  private electricalPulses: ElectricalPulse[] = [];
  private lastImpulseTime: number = 0;
  private lastSynapticSkipTime: number = 0;
  private scoreText?: Phaser.GameObjects.Text;
  private gameOverText?: Phaser.GameObjects.Text;
  private instructionText?: Phaser.GameObjects.Text;
  private hostIntroText?: Phaser.GameObjects.Text;
  private levelTransitionText?: Phaser.GameObjects.Text;
  private mutationSelectionUI?: Phaser.GameObjects.Container;
  private virusText?: Phaser.GameObjects.Text;
  private hostThoughtText?: Phaser.GameObjects.Text;
  private mutationStatusText?: Phaser.GameObjects.Text;
  private levelInfoText?: Phaser.GameObjects.Text;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys?: { [key: string]: Phaser.Input.Keyboard.Key };
  private numberKeys?: { [key: string]: Phaser.Input.Keyboard.Key };
  private background: Phaser.GameObjects.Image | null = null;
  private lastVirusTextTime: number = 0;
  private lastHostThoughtTime: number = 0;
  private nextMutationScore: number = GAME_CONFIG.MUTATION_THRESHOLD;
  private canPhaseWalls: boolean = false;
  private phaseEndTime: number = 0;
  private hasSpeedBoost: boolean = false;
  private movementDelay: number = 0;
  private lastNeuralInterference: number = 0;

  // Layer system for proper depth management
  private gameLayer!: Phaser.GameObjects.Layer;
  private uiLayer!: Phaser.GameObjects.Layer;
  private overlayLayer!: Phaser.GameObjects.Layer;

  private topRightUI?: {
    container: Phaser.GameObjects.Container;
    hostInfo: Phaser.GameObjects.Text;
    portrait: Phaser.GameObjects.Image;
  };

  constructor() {
    super({ key: 'SnakeScene' });
  }

  private getDirection(from: { x: number; y: number }, to: { x: number; y: number }): string | null {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    if (dx === 1) return "right";
    if (dx === -1) return "left";
    if (dy === 1) return "down";
    if (dy === -1) return "up";
    return null;
  }

  preload() {
    // Load all the sprites
    const sprites = [
      'head_up', 'head_down', 'head_left', 'head_right',
      'tail_up', 'tail_down', 'tail_left', 'tail_right',
      'body_straight_horiz', 'body_straight_vert',
      'body_curve_tl', 'body_curve_tr', 'body_curve_bl', 'body_curve_br',
      'white_cell', 'cholesterol',
      'level_1_bg', 'level_2_bg', 'level_3_bg',
      'cutscene_icon_virus',
      'host_portrait_Brayden',
      'host_portrait_Greg',
      'host_portrait_Tiffany',
      'host_portrait_Rat_King',
      'target_acquired',
      'splash_screen'
    ];

    // Load base sprites
    sprites.forEach(name => {
      this.load.image(name, `/SPRITES/${name}.png`);
    });

    // Load effect sprites separately with explicit error handling
    console.log('Loading Spark sprite...');
    this.load.image('spark', '/SPRITES/Spark.png')
      .on('filecomplete', () => {
        console.log('✓ Spark sprite loaded successfully');
      })
      .on('loaderror', () => {
        console.error('✗ Failed to load Spark sprite');
      });

    console.log('Loading Neuron sprite...');
    this.load.image('neuron', '/SPRITES/Neuron.png')
      .on('filecomplete', () => {
        console.log('✓ Neuron sprite loaded successfully');
      })
      .on('loaderror', () => {
        console.error('✗ Failed to load Neuron sprite');
      });

    // Add load complete handler
    this.load.on('complete', () => {
      console.log('=== All sprites loaded ===');
      console.log('Available textures:', Object.keys(this.textures.list));
    });
  }

  create() {
    // Initialize layer system first
    this.createLayerSystem();
    
    // Initialize audio effects
    this.audio = new AudioEffects();
    
    // Select random host for this session
    this.currentHost = this.selectRandomHost();
    
    // DEBUG: Test if sprites are loading correctly
    this.load.once('complete', () => {
      console.log('=== SPRITE LOADING DEBUG ===');
      console.log('All sprites loaded. Testing availability...');
      
      // List all loaded textures
      console.log('Available textures:', Object.keys(this.textures.list));
      
      // Test Spark sprite
      const sparkExists = this.textures.exists('Spark');
      console.log('Spark texture exists:', sparkExists);
      if (sparkExists) {
        console.log('✓ Spark texture found');
      } else {
        console.log('✗ Spark texture NOT found');
        // Check for case variations
        console.log('Checking case variations...');
        console.log('spark exists:', this.textures.exists('spark'));
        console.log('SPARK exists:', this.textures.exists('SPARK'));
      }
      
      // Test Neuron sprite
      const neuronExists = this.textures.exists('Neuron');
      console.log('Neuron texture exists:', neuronExists);
      if (neuronExists) {
        console.log('✓ Neuron texture found');
      } else {
        console.log('✗ Neuron texture NOT found');
        // Check for case variations
        console.log('neuron exists:', this.textures.exists('neuron'));
        console.log('NEURON exists:', this.textures.exists('NEURON'));
      }
      
      console.log('=== END SPRITE DEBUG ===');
    });
    
    // Show splash screen first
    this.showSplashScreen();
  }

  private createLayerSystem() {
    // Create layers in order from bottom to top
    this.gameLayer = this.add.layer();
    this.uiLayer = this.add.layer();
    this.overlayLayer = this.add.layer();

    // Set depths to ensure proper rendering order
    this.gameLayer.setDepth(0);     // Game world (background, sprites, enemies)
    this.uiLayer.setDepth(1000);    // UI elements (health, score, etc.)
    this.overlayLayer.setDepth(2000); // Overlays (mutation selection, game over, etc.)

    // Note: For camera protection, we'll set scrollFactor on individual UI elements instead
  }

  private selectRandomHost() {
    const hostKeys = Object.keys(HOSTS) as (keyof typeof HOSTS)[];
    const randomKey = hostKeys[Math.floor(Math.random() * hostKeys.length)];
    return HOSTS[randomKey];
  }

  private showSplashScreen() {
    // Create splash screen background
    const splashBg = this.add.rectangle(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH, CANVAS_HEIGHT, 0x220000);
    this.overlayLayer.add(splashBg);

    // Add splash screen image - full viewport
    const splashImage = this.add.image(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 'splash_screen');
    splashImage.setDisplaySize(CANVAS_WIDTH, CANVAS_HEIGHT);
    this.overlayLayer.add(splashImage);

    // Add the current copy text - positioned in lower area
    const copyText = this.add.text(CANVAS_WIDTH / 2, CANVAS_HEIGHT * 0.75,
      '🧬 INITIALIZING VIRAL INTERFACE...\nLOADING PHASER GAME ENGINE...', {
      fontSize: '16px',
      color: '#6ee86e',
      fontFamily: 'monospace',
      align: 'center',
      lineSpacing: 8,
      stroke: '#000000',
      strokeThickness: 2
    });
    copyText.setOrigin(0.5);
    this.overlayLayer.add(copyText);

    // Add credit text below
    const creditText = this.add.text(CANVAS_WIDTH / 2, CANVAS_HEIGHT * 0.85,
      'By Antonio Oliverez', {
      fontSize: '14px',
      color: '#cccccc',
      fontFamily: 'monospace',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 2
    });
    creditText.setOrigin(0.5);
    this.overlayLayer.add(creditText);

    // Add pulsing effect to splash image
    this.tweens.add({
      targets: splashImage,
      alpha: 0.7,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Also add subtle pulsing to copy text
    this.tweens.add({
      targets: copyText,
      alpha: 0.8,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Auto-transition to host introduction after 3 seconds
    this.time.delayedCall(3000, () => {
      // Clean up splash screen
      splashBg.destroy();
      splashImage.destroy();
      copyText.destroy();
      creditText.destroy();
      
      // Show host introduction
      this.showHostIntroduction();
    });
  }

  private showHostIntroduction() {
    // Use target_acquired.png as the full background
    const background = this.add.image(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 'target_acquired')
      .setDisplaySize(CANVAS_WIDTH, CANVAS_HEIGHT);
    this.overlayLayer.add(background);

    // Create main container for all host intro elements
    const hostIntroPanel = this.add.container(0, 0);
    
    // Get the correct portrait key based on the current host
    let portraitKey = '';
    switch (this.currentHost) {
      case HOSTS.brayden:
        portraitKey = 'host_portrait_Brayden';
        break;
      case HOSTS.greg:
        portraitKey = 'host_portrait_Greg';
        break;
      case HOSTS.tiffany:
        portraitKey = 'host_portrait_Tiffany';
        break;
      case HOSTS.ratKings:
        portraitKey = 'host_portrait_Rat_King';
        break;
    }

    // Host portrait positioned in the upper area of the left portrait frame
    const portraitFrameX = CANVAS_WIDTH * 0.15; // Move further left in the frame
    const portraitFrameY = CANVAS_HEIGHT * 0.25; // Move higher up in the frame
    const portraitSize = CANVAS_WIDTH * 0.28; // Smaller to fit in upper portion
    
    const portrait = this.add.image(portraitFrameX, portraitFrameY, portraitKey);
    portrait.setDisplaySize(portraitSize, portraitSize);
    portrait.setOrigin(0.5, 0.5);
    hostIntroPanel.add(portrait);

    // Right panel text area - positioned to match the right information sections
    const textAreaX = CANVAS_WIDTH * 0.42; // Move text much further left
    const textAreaY = CANVAS_HEIGHT * 0.16; // Top of text area
    const textAreaWidth = CANVAS_WIDTH * 0.55; // Much wider text area to use more space
    
    // Host information text block - HOST, TYPE, BIO only
    this.hostIntroText = this.add.text(textAreaX, textAreaY,
      `HOST:    ${this.currentHost.name}\n\n` +
      `TYPE:    ${this.currentHost.title}\n\n\n` +
      `BIO:     ${this.currentHost.bio}`, {
      fontSize: '14px',
      color: '#00ff44',
      align: 'left',
      fontFamily: 'monospace',
      lineSpacing: 5,
      wordWrap: { width: textAreaWidth }
    });
    this.hostIntroText.setOrigin(0, 0);
    hostIntroPanel.add(this.hostIntroText);

    // Mission info positioned in middle right area
    const missionY = CANVAS_HEIGHT * 0.52; 
    const missionText = this.add.text(textAreaX, missionY,
      `MISSION: ${this.currentHost.intro}`, {
      fontSize: '14px',
      color: '#00ff44',
      align: 'left',
      fontFamily: 'monospace',
      lineSpacing: 4,
      wordWrap: { width: textAreaWidth }
    });
    missionText.setOrigin(0, 0);
    hostIntroPanel.add(missionText);

    // Location info positioned in lower right area
    const locationY = CANVAS_HEIGHT * 0.68;
    const locationText = this.add.text(textAreaX, locationY,
      `LOCATION: ${LEVELS[this.currentLevel].name}\n` +
      `          ${LEVELS[this.currentLevel].description}`, {
      fontSize: '13px',
      color: '#00ff44',
      align: 'left',
      fontFamily: 'monospace',
      lineSpacing: 4,
      wordWrap: { width: textAreaWidth }
    });
    locationText.setOrigin(0, 0);
    hostIntroPanel.add(locationText);

    // Remove the redundant action button since it's already in the background image
    // Add subtle glow effect to portrait
    this.tweens.add({
      targets: portrait,
      alpha: 0.85,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Add the entire panel to overlay layer
    this.overlayLayer.add(hostIntroPanel);

    // Set up input to proceed
    this.input.keyboard?.on('keydown', () => {
      // Clean up the entire host intro panel
      hostIntroPanel.destroy();
      background.destroy();
      this.startInfection();
    }, this);
  }

  private startInfection = () => {
    if (!this.showingHostIntro) return;
    
    this.showingHostIntro = false;
    
    // Remove intro screen
    this.hostIntroText?.destroy();
    this.input.keyboard?.off('keydown', this.startInfection, this);
    
    // Initialize the actual game
    this.initializeGame();
  }

  private initializeGame() {
    // Create level-specific background
    this.createLevelBackground();

    // Initialize snake in the center
    const startX = Math.floor(GAME_CONFIG.GRID_WIDTH / 2);
    const startY = Math.floor(GAME_CONFIG.GRID_HEIGHT / 2);
    
    this.snake = [
      { x: startX, y: startY },
      { x: startX - 1, y: startY },
      { x: startX - 2, y: startY }
    ];

    // Spawn initial white blood cell
    this.spawnFood();
    
    // Create level-specific obstacles and enemies
    this.spawnLevelSpecificElements();

    // Set up keyboard input
    this.cursors = this.input.keyboard?.createCursorKeys();
    this.wasdKeys = this.input.keyboard?.addKeys('W,S,A,D') as { [key: string]: Phaser.Input.Keyboard.Key };
    this.numberKeys = this.input.keyboard?.addKeys('ONE,TWO,THREE') as { [key: string]: Phaser.Input.Keyboard.Key };

    // Create UI text with bio-horror styling - ALL ADDED TO UI LAYER
    this.scoreText = this.add.text(10, 10, '🧬 Infection Level: 0', {
      fontSize: '14px',
      color: '#6ee86e',
      fontFamily: 'IBM Plex Mono, monospace',
      stroke: '#000000',
      strokeThickness: 1
    });
    this.scoreText.setScrollFactor(0); // Camera protection
    this.uiLayer.add(this.scoreText);

    // Level info display
    this.levelInfoText = this.add.text(10, 30, 
      `🩸 System: ${LEVELS[this.currentLevel].name}`, {
      fontSize: '12px',
      color: '#6ee86e',
      fontFamily: 'IBM Plex Mono, monospace'
    });
    this.levelInfoText.setScrollFactor(0); // Camera protection
    this.uiLayer.add(this.levelInfoText);

    // Mutation status display
    this.mutationStatusText = this.add.text(10, 50, '', {
      fontSize: '11px',
      color: '#cccccc',
      fontFamily: 'IBM Plex Mono, monospace'
    });
    this.mutationStatusText.setScrollFactor(0); // Camera protection
    this.uiLayer.add(this.mutationStatusText);

    // Removed duplicate top-right UI elements - now handled by createTopRightUI()

    // Terminal-style instruction overlay - ADDED TO OVERLAY LAYER
    this.instructionText = this.add.text(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60, 
      '>>> VIRAL INFILTRATION PROTOCOL ACTIVATED <<<\n\n' +
      '🔧 CONTROLS:\n' +
      '  • WASD / Arrow Keys → Navigate viral pathways\n' +
      '  • SPACE → Activate Capillary Phase (when available)\n\n' +
      '🎯 MISSION OBJECTIVES:\n' +
      '  • Consume white blood cells to expand infection\n' +
      '  • Avoid obstacles and immune system defenses\n' +
      '  • Evolve mutations every 30-50 infection points\n' +
      '  • Progress through 3 body systems to total victory\n\n' +
      '⚠️  WARNING: Host immune system actively resisting\n\n' +
      '📡 Press ANY KEY to begin infiltration...', {
      fontSize: '11px',
      color: '#cccccc',
      align: 'left',
      fontFamily: 'IBM Plex Mono, monospace',
      lineSpacing: 2,
      backgroundColor: 'rgba(10, 10, 10, 0.95)',
      padding: { x: 20, y: 16 },
      wordWrap: { width: CANVAS_WIDTH - 80 }
    }).setOrigin(0.5).setVisible(true);
    this.instructionText.setScrollFactor(0); // Camera protection
    this.overlayLayer.add(this.instructionText);

    // Add terminal border effect to instructions
    const instructionBorder = this.add.rectangle(
      CANVAS_WIDTH / 2, 
      CANVAS_HEIGHT / 2 - 60, 
      CANVAS_WIDTH - 60, 
      this.instructionText.height + 40, 
      0x000000, 
      0
    );
    instructionBorder.setStrokeStyle(1, 0x6ee86e, 1);
    instructionBorder.setScrollFactor(0); // Camera protection
    this.overlayLayer.add(instructionBorder);

    // Create virus text bubble area - ADDED TO UI LAYER
    this.virusText = this.add.text(10, CANVAS_HEIGHT - 50, '', {
      fontSize: '12px',
      color: '#6ee86e',
      fontFamily: 'IBM Plex Mono, monospace',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      padding: { x: 8, y: 4 }
    });
    this.virusText.setScrollFactor(0); // Camera protection
    this.uiLayer.add(this.virusText);

    // Create host thought bubble area - ADDED TO UI LAYER
    this.hostThoughtText = this.add.text(CANVAS_WIDTH - 10, CANVAS_HEIGHT - 30, '', {
      fontSize: '11px',
      color: '#f3e448',
      fontFamily: 'IBM Plex Mono, monospace',
      backgroundColor: 'rgba(34, 0, 0, 0.8)',
      padding: { x: 6, y: 3 }
    }).setOrigin(1, 1);
    this.hostThoughtText.setScrollFactor(0); // Camera protection
    this.uiLayer.add(this.hostThoughtText);

    // Set up game timer for movement
    this.time.addEvent({
      delay: this.getMovementSpeed(),
      callback: this.moveSnake,
      callbackScope: this,
      loop: true
    });

    // Add random virus text timer
    this.time.addEvent({
      delay: 6000, // Every 6 seconds
      callback: this.showRandomVirusText,
      callbackScope: this,
      loop: true
    });

    // Add random host thought timer
    this.time.addEvent({
      delay: 8000, // Every 8 seconds
      callback: this.showRandomHostThought,
      callbackScope: this,
      loop: true
    });

    // Level-specific timers
    this.setupLevelSpecificTimers();
    
    // Start level ambient sounds
    this.audio.startLevelAmbient(this.currentLevel);

    // Create organized top-right UI container
    this.createTopRightUI();
  }

  private createLevelBackground() {
    let bgKey: string;
    switch (this.currentLevel) {
      case 'circulatory': bgKey = 'level_1_bg'; break;
      case 'nervous': bgKey = 'level_2_bg'; break;
      case 'brain': bgKey = 'level_3_bg'; break;
      default: bgKey = 'level_1_bg';
    }
    this.background = this.add.image(0, 0, bgKey).setOrigin(0, 0);
    this.background.setDisplaySize(CANVAS_WIDTH, CANVAS_HEIGHT);
    this.background.setDepth(-1);
    this.gameLayer.add(this.background);
  }

  private spawnLevelSpecificElements() {
    switch (this.currentLevel) {
      case 'circulatory':
        this.spawnCholesterolObstacles();
        break;
      case 'nervous':
        this.spawnAntibodyDrones();
        break;
      case 'brain':
        this.spawnMicrodrones();
        break;
    }
  }

  private spawnCholesterolObstacles() {
    // Clear existing obstacles
    this.cholesterolObstacles = [];
    
    // Spawn 3-5 cholesterol clumps randomly
    const numObstacles = 3 + Math.floor(Math.random() * 3);
    
    for (let i = 0; i < numObstacles; i++) {
      let obstacle: { x: number; y: number };
      let attempts = 0;
      
      do {
        obstacle = {
          x: Math.floor(Math.random() * GAME_CONFIG.GRID_WIDTH),
          y: Math.floor(Math.random() * GAME_CONFIG.GRID_HEIGHT)
        };
        attempts++;
      } while ((
        this.snake.some(segment => segment.x === obstacle.x && segment.y === obstacle.y) ||
        (obstacle.x === this.food.x && obstacle.y === this.food.y) ||
        this.cholesterolObstacles.some(obs => obs.x === obstacle.x && obs.y === obstacle.y)
      ) && attempts < 50);
      
      if (attempts < 50) {
        this.cholesterolObstacles.push(obstacle);
      }
    }
  }

  private spawnAntibodyDrones() {
    this.enemies = [];
    
    // Spawn 2-3 antibody drones for nervous system
    const numDrones = 2 + Math.floor(Math.random() * 2);
    
    for (let i = 0; i < numDrones; i++) {
      let drone: Enemy;
      let attempts = 0;
      
      do {
        drone = {
          x: Math.floor(Math.random() * GAME_CONFIG.GRID_WIDTH),
          y: Math.floor(Math.random() * GAME_CONFIG.GRID_HEIGHT),
          type: 'antibody_drone',
          direction: { 
            x: Math.random() > 0.5 ? 1 : -1, 
            y: Math.random() > 0.5 ? 1 : -1 
          },
          stunned: false
        };
        attempts++;
      } while ((
        this.snake.some(segment => segment.x === drone.x && segment.y === drone.y) ||
        (drone.x === this.food.x && drone.y === this.food.y) ||
        this.enemies.some(enemy => enemy.x === drone.x && enemy.y === drone.y)
      ) && attempts < 50);
      
      if (attempts < 50) {
        this.enemies.push(drone);
      }
    }
  }

  private spawnMicrodrones() {
    this.enemies = [];
    
    // Spawn only 2 tracking microdrones for brain system (reduced for playability)
    const numDrones = 2;
    
    for (let i = 0; i < numDrones; i++) {
      let drone: Enemy;
      let attempts = 0;
      
      do {
        drone = {
          x: Math.floor(Math.random() * GAME_CONFIG.GRID_WIDTH),
          y: Math.floor(Math.random() * GAME_CONFIG.GRID_HEIGHT),
          type: 'microdrone',
          stunned: false
        };
        attempts++;
      } while ((
        this.snake.some(segment => segment.x === drone.x && segment.y === drone.y) ||
        (drone.x === this.food.x && drone.y === this.food.y) ||
        this.enemies.some(enemy => enemy.x === drone.x && enemy.y === drone.y)
      ) && attempts < 50);
      
      if (attempts < 50) {
        this.enemies.push(drone);
      }
    }
  }

  private setupLevelSpecificTimers() {
    switch (this.currentLevel) {
      case 'nervous':
        // Trigger immediate electrical pulse to test Spark sprites
        this.triggerImpulsePulse();
        
        // Impulse pulse timer (every 8 seconds for more frequent testing)
        this.time.addEvent({
          delay: 8000,
          callback: this.triggerImpulsePulse,
          callbackScope: this,
          loop: true
        });
        break;
      case 'brain':
        // Neuroplasticity timer (maze shifts every 45 seconds - reduced frequency)
        this.time.addEvent({
          delay: 45000,
          callback: this.triggerNeuroplasticity,
          callbackScope: this,
          loop: true
        });
        
        // Thought spawn timer (reduced frequency for better playability)
        this.time.addEvent({
          delay: 12000,
          callback: this.spawnThoughtBubble,
          callbackScope: this,
          loop: true
        });
        break;
    }
  }

  private getMovementSpeed(): number {
    const baseSpeed = 200;
    const levelMultiplier = LEVELS[this.currentLevel].id * 0.9; // Faster in later levels
    const speedBoostMultiplier = this.hasSpeedBoost ? 0.7 : 1; // 30% faster with caffeine
    return Math.max(100, baseSpeed * levelMultiplier * speedBoostMultiplier);
  }

  private getNextLevelScore(): number {
    const currentLevelId = LEVELS[this.currentLevel].id;
    const nextLevel = Object.values(LEVELS).find(level => level.id === currentLevelId + 1);
    return nextLevel ? nextLevel.requiredScore : 0;
  }

  private showMutationSelectionUI() {
    // Cleanup any existing UI first
    if (this.mutationSelectionUI) {
      this.mutationSelectionUI.destroy();
      this.mutationSelectionUI = undefined;
    }
    
    // Create dark overlay
    const overlay = this.add.rectangle(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH, CANVAS_HEIGHT, 0x000000, 0.8);
    
    // Create container for mutation UI
    const container = this.add.container(0, 0);
    
    // Add overlay to container
    container.add(overlay);
    
    // Title
    const title = this.add.text(CANVAS_WIDTH / 2, 80, 
      '>>> VIRAL EVOLUTION PROTOCOL <<<', {
      fontSize: '18px',
      color: '#6ee86e',
      fontFamily: 'IBM Plex Mono, monospace',
      stroke: '#000000',
      strokeThickness: 1
    }).setOrigin(0.5);
    container.add(title);
    
    const subtitle = this.add.text(CANVAS_WIDTH / 2, 110,
      '🔬 Select adaptive mutation [ 1 / 2 / 3 ]:', {
      fontSize: '12px',
      color: '#cccccc',
      fontFamily: 'IBM Plex Mono, monospace',
      align: 'center'
    }).setOrigin(0.5);
    container.add(subtitle);
    
    // Display mutation options
    this.mutationOptions.forEach((mutation, index) => {
      const yPos = 160 + (index * 80);
      const keyNum = index + 1;
      
      // Option background
      const optionBg = this.add.rectangle(CANVAS_WIDTH / 2, yPos, CANVAS_WIDTH - 80, 70, COLORS.MUTATION_UI, 0.3);
      optionBg.setStrokeStyle(2, mutation.color || 0x00ff00, 0.8);
      container.add(optionBg);
      
      // Option text
      const optionText = this.add.text(CANVAS_WIDTH / 2, yPos,
        `[${keyNum}] ${mutation.icon || '🧬'} ${mutation.name || 'Unknown'}\n    ${mutation.description || 'Mysterious effect'}`, {
        fontSize: '11px',
        color: '#ffffff',
        fontFamily: 'IBM Plex Mono, monospace',
        align: 'center',
        lineSpacing: 3,
        wordWrap: { width: CANVAS_WIDTH - 120 }
      }).setOrigin(0.5);
      container.add(optionText);
    });

    // Add the container to the overlay layer and store reference
    if (this.overlayLayer) {
      this.overlayLayer.add(container);
      this.mutationSelectionUI = container;
    }
    
    // Set up input handling for mutation selection
    this.input.keyboard?.on('keydown', this.handleMutationSelection, this);
  }

  private handleMutationSelection = (event: KeyboardEvent) => {
    if (!this.showingMutationSelection) return;
    
    let selectedIndex = -1;
    
    switch (event.code) {
      case 'Digit1':
      case 'Numpad1':
        selectedIndex = 0;
        break;
      case 'Digit2':
      case 'Numpad2':
        selectedIndex = 1;
        break;
      case 'Digit3':
      case 'Numpad3':
        selectedIndex = 2;
        break;
    }
    
    if (selectedIndex >= 0 && selectedIndex < this.mutationOptions.length) {
      this.selectMutation(selectedIndex);
    }
  }

  private selectMutation(index: number) {
    const selectedMutation = this.mutationOptions[index];
    
    // Add to active mutations
    this.activeMutations.push({
      mutation: selectedMutation,
      activatedAt: this.time.now,
      isActive: true
    });
    
    // Clean up mutation UI
    this.input.keyboard?.off('keydown', this.handleMutationSelection, this);
    this.mutationSelectionUI?.destroy();
    this.mutationSelectionUI = undefined;
    this.showingMutationSelection = false;
    
    // Update next mutation threshold
    this.nextMutationScore += GAME_CONFIG.MUTATION_INTERVAL;
    
    // Play mutation sound effect with type variation
    this.audio.playMutation(selectedMutation.id);
    
    // Show mutation text
    const mutationTexts = VIRUS_TEXTS.mutation;
    const randomText = mutationTexts[Math.floor(Math.random() * mutationTexts.length)];
    if (this.virusText) {
      this.virusText.setText(`🧬 Virus: "${randomText}"`);
    }
    
    // Update mutation status display
    this.updateMutationStatusDisplay();
    
    // Clear virus text after 6 seconds (increased from 3)
    this.time.delayedCall(6000, () => {
      this.virusText?.setText('');
    });
  }

  private updateMutationStatusDisplay() {
    const activeNames = this.activeMutations
      .filter(am => am.isActive)
      .map(am => am.mutation.icon + am.mutation.name)
      .join(' | ');
    
    if (this.mutationStatusText) {
      this.mutationStatusText.setText(activeNames ? `⚙️ Active: ${activeNames}` : '');
    }
  }

  update() {
    // Handle input (only if game is initialized)
    if (!this.showingHostIntro && !this.showingMutationSelection && !this.showingLevelTransition) {
      this.handleInput();
      
      // Update mutation timers
      this.updateMutationTimers();
      
      // Update enemies
      this.updateEnemies();
      
      // Update electrical pulses
      this.updateElectricalPulses();
    }
  }

  private updateEnemies() {
    this.enemies.forEach(enemy => {
      if (enemy.stunned && enemy.stunnedUntil && this.time.now > enemy.stunnedUntil) {
        enemy.stunned = false;
        enemy.stunnedUntil = undefined;
      }
      
      if (!enemy.stunned) {
        if (enemy.type === 'antibody_drone') {
          this.updateAntibodyDrone(enemy);
        } else if (enemy.type === 'microdrone') {
          this.updateMicrodrone(enemy);
        }
      }
    });
  }

  private updateAntibodyDrone(drone: Enemy) {
    // Simple movement pattern for antibody drones
    if (!drone.direction) return;
    
    const newX = drone.x + drone.direction.x;
    const newY = drone.y + drone.direction.y;
    
    // Bounce off walls
    if (newX < 0 || newX >= GAME_CONFIG.GRID_WIDTH) {
      drone.direction.x *= -1;
    } else if (newY < 0 || newY >= GAME_CONFIG.GRID_HEIGHT) {
      drone.direction.y *= -1;
    } else {
      drone.x = newX;
      drone.y = newY;
    }
  }

  private updateMicrodrone(drone: Enemy) {
    // Less aggressive tracking behavior towards virus head
    const head = this.snake[0];
    if (!head) return;
    
    const dx = head.x - drone.x;
    const dy = head.y - drone.y;
    const distance = Math.abs(dx) + Math.abs(dy);
    
    // Only move every other update cycle for less aggressive behavior
    if (!drone.lastMoveTime) drone.lastMoveTime = 0;
    if (this.time.now - drone.lastMoveTime < 400) return; // Move every 400ms
    drone.lastMoveTime = this.time.now;
    
    // Don't get too close to virus (maintain 2-space buffer)
    if (distance <= 2) return;
    
    // Move towards virus more slowly and predictably
    if (Math.abs(dx) > Math.abs(dy)) {
      drone.x += dx > 0 ? 1 : -1;
    } else if (Math.abs(dy) > 0) {
      drone.y += dy > 0 ? 1 : -1;
    }
    
    // Keep within bounds
    drone.x = Math.max(0, Math.min(GAME_CONFIG.GRID_WIDTH - 1, drone.x));
    drone.y = Math.max(0, Math.min(GAME_CONFIG.GRID_HEIGHT - 1, drone.y));
  }

  private updateElectricalPulses() {
    // Update pulse states and remove expired pulses
    this.electricalPulses = this.electricalPulses.filter(pulse => {
      const elapsed = this.time.now - pulse.activatedAt;
      
      // Check if pulse should become deadly (after warning phase)
      if (!pulse.isDeadly && elapsed >= pulse.warningPhase) {
        pulse.isDeadly = true;
      }
      
      // Remove pulse if duration exceeded
      return elapsed < pulse.duration;
    });
  }

  private updateMutationTimers() {
    // Check for capillary phase expiration
    if (this.canPhaseWalls && this.time.now > this.phaseEndTime) {
      this.canPhaseWalls = false;
      this.updateMutationStatusDisplay();
    }
  }

  private handleInput() {
    if (!this.cursors || !this.wasdKeys) return;

    // Start game on first input
    if (!this.gameStarted && !this.gameOver) {
      if (this.cursors.up.isDown || this.wasdKeys['W'].isDown) {
        this.startGame();
        this.nextDirection = { x: 0, y: -1 };
      } else if (this.cursors.down.isDown || this.wasdKeys['S'].isDown) {
        this.startGame();
        this.nextDirection = { x: 0, y: 1 };
      } else if (this.cursors.left.isDown || this.wasdKeys['A'].isDown) {
        this.startGame();
        this.nextDirection = { x: -1, y: 0 };
      } else if (this.cursors.right.isDown || this.wasdKeys['D'].isDown) {
        this.startGame();
        this.nextDirection = { x: 1, y: 0 };
      }
      return;
    }

    // Game controls during play
    if (this.gameStarted && !this.gameOver) {
      if ((this.cursors.up.isDown || this.wasdKeys['W'].isDown) && this.direction.y === 0) {
        this.nextDirection = { x: 0, y: -1 };
      } else if ((this.cursors.down.isDown || this.wasdKeys['S'].isDown) && this.direction.y === 0) {
        this.nextDirection = { x: 0, y: 1 };
      } else if ((this.cursors.left.isDown || this.wasdKeys['A'].isDown) && this.direction.x === 0) {
        this.nextDirection = { x: -1, y: 0 };
      } else if ((this.cursors.right.isDown || this.wasdKeys['D'].isDown) && this.direction.x === 0) {
        this.nextDirection = { x: 1, y: 0 };
      }
      
      // Special mutation activation (Capillary Phase with Space)
      if (this.cursors.space.isDown) {
        this.activateCapillaryPhase();
      }
    }

    // Restart game
    if (this.gameOver && (this.cursors.space.isDown || this.wasdKeys['W'].isDown)) {
      this.restartGame();
    }
  }

  private activateCapillaryPhase() {
    const capillaryMutation = this.activeMutations.find(am => 
      am.mutation.id === 'capillaryPhase' && am.isActive
    );
    
    if (capillaryMutation && !this.canPhaseWalls) {
      this.canPhaseWalls = true;
      this.phaseEndTime = this.time.now + capillaryMutation.mutation.duration;
      this.updateMutationStatusDisplay();
      
      if (this.virusText) {
        this.virusText.setText('Virus: "Phasing through matter. Reality is overrated."');
      }
      
              this.time.delayedCall(5000, () => {
          if (this.virusText) {
            this.virusText.setText('');
          }
        });
    }
  }

  private startGame() {
    this.gameStarted = true;
    if (this.instructionText) {
      this.instructionText.setVisible(false);
    }
    
    // Also hide the instruction border (this was the green rectangle!)
    this.overlayLayer.list.forEach((child: any) => {
      if (child instanceof Phaser.GameObjects.Rectangle && 
          child.strokeColor === 0x6ee86e) {
        child.setVisible(false);
      }
    });
    
    if (this.virusText) {
      this.virusText.setText('🧬 Virus: "Beginning cellular infiltration of host..."');
    }
    
    // Show first host thought shortly after game starts
    this.time.delayedCall(2000, () => {
      this.showRandomHostThought();
    });
  }

  private moveSnake() {
    if (!this.gameStarted || this.gameOver || this.showingMutationSelection || this.showingLevelTransition) return;

    // Apply neural interference delay if active
    if (this.movementDelay > 0) {
      this.time.delayedCall(this.movementDelay * 1000, () => this.moveSnake());
      this.movementDelay = 0;
      return;
    }

    // Update direction
    this.direction = { ...this.nextDirection };

    // Calculate new head position
    const head = this.snake[0];
    const newHead = {
      x: head.x + this.direction.x,
      y: head.y + this.direction.y
    };

    // Check wall collision (unless phasing)
    if (!this.canPhaseWalls && (newHead.x < 0 || newHead.x >= GAME_CONFIG.GRID_WIDTH || 
        newHead.y < 0 || newHead.y >= GAME_CONFIG.GRID_HEIGHT)) {
      this.endGame();
      return;
    }

    // Wrap around if phasing through walls
    if (this.canPhaseWalls) {
      if (newHead.x < 0) newHead.x = GAME_CONFIG.GRID_WIDTH - 1;
      if (newHead.x >= GAME_CONFIG.GRID_WIDTH) newHead.x = 0;
      if (newHead.y < 0) newHead.y = GAME_CONFIG.GRID_HEIGHT - 1;
      if (newHead.y >= GAME_CONFIG.GRID_HEIGHT) newHead.y = 0;
    }

    // Check electrical pulse collision (Nervous System) - only deadly pulses
    if (this.currentLevel === 'nervous' && !this.canPhaseWalls) {
      const hitByPulse = this.electricalPulses.some(pulse => {
        // Only check collision with deadly pulses
        if (!pulse.isDeadly) return false;
        
        if (pulse.direction === 'horizontal' && newHead.y === pulse.position) return true;
        if (pulse.direction === 'vertical' && newHead.x === pulse.position) return true;
        return false;
      });
      
      if (hitByPulse) {
        this.endGame();
        return;
      }
    }

    // Check cholesterol collision (Circulatory System)
    if (this.currentLevel === 'circulatory' && !this.canPhaseWalls && 
        this.cholesterolObstacles.some(obs => obs.x === newHead.x && obs.y === newHead.y)) {
      this.endGame();
      return;
    }

    // Check enemy collision
    const enemyCollision = this.enemies.find(enemy => enemy.x === newHead.x && enemy.y === newHead.y);
    if (enemyCollision && !this.canPhaseWalls) {
      // Check for Neuroleech Tendril mutation
      const neuroleechMutation = this.activeMutations.find(am => 
        am.mutation.id === 'neuroleechTendril' && am.isActive
      );
      
      if (neuroleechMutation && enemyCollision.stunned) {
        // Play enemy absorption sound
        this.audio.playEnemyHit();
        
        // Absorb stunned enemy for bonus growth
        this.score += 30; // Extra points for absorption
        this.snake.push({ ...this.snake[this.snake.length - 1] }); // Extra growth
        this.enemies = this.enemies.filter(e => e !== enemyCollision);
        
        if (this.virusText) {
          this.virusText.setText('Virus: "Emotional vampirism complete. Delicious neural energy."');
        }
        
        this.time.delayedCall(5000, () => {
          if (this.virusText) {
            this.virusText.setText('');
          }
        });
      } else {
        this.endGame();
        return;
      }
    }

    // Check self collision
    const selfCollision = this.snake.some(segment => segment.x === newHead.x && segment.y === newHead.y);
    if (selfCollision) {
      // Check for Leech Loop mutation
      const leechMutation = this.activeMutations.find(am => 
        am.mutation.id === 'leechLoop' && am.isActive
      );
      
      if (leechMutation) {
        // Heal instead of dying (once)
        this.score += 20; // Bonus healing points
        if (this.scoreText) {
          this.scoreText.setText(`🧬 Infection Level: ${this.score}`);
        }
        if (this.virusText) {
          this.virusText.setText('Virus: "Self-harm becomes self-care. Delicious."');
        }
        
        // Deactivate leech loop after use
        leechMutation.isActive = false;
        this.updateMutationStatusDisplay();
        
        this.time.delayedCall(5000, () => {
          if (this.virusText) {
            this.virusText.setText('');
          }
        });
        
        // Don't add the head, just continue
        this.draw();
        return;
      } else {
        this.endGame();
        return;
      }
    }

    // Add new head
    this.snake.unshift(newHead);

    // Check food collision (including Spine Fangs)
    let foodConsumed = false;
    
    // Normal head consumption
    if (newHead.x === this.food.x && newHead.y === this.food.y) {
      foodConsumed = true;
    }
    
    // Spine Fangs: consume from behind
    const spineFangsMutation = this.activeMutations.find(am => 
      am.mutation.id === 'spineFangs' && am.isActive
    );
    
    if (spineFangsMutation && this.snake.length > 1) {
      const secondSegment = this.snake[1];
      if (secondSegment.x === this.food.x && secondSegment.y === this.food.y) {
        foodConsumed = true;
      }
    }

    if (foodConsumed) {
      this.score += 10;
      if (this.scoreText) {
        this.scoreText.setText(`🧬 Infection Level: ${this.score}`);
      }
      // Update top-right UI when score changes
      this.updateTopRightUI();
      
      this.spawnFood();
      
      // Play consume sound effect with host variation
      this.audio.playConsume(this.currentHost.environment);
      
      // Show consumption text
      const consumeTexts = VIRUS_TEXTS.consume;
      const randomText = consumeTexts[Math.floor(Math.random() * consumeTexts.length)];
      if (this.virusText) {
        this.virusText.setText(`🧬 Virus: "${randomText}"`);
      }
      
      // Clear after 5 seconds (increased from 2)
      this.time.delayedCall(5000, () => {
        if (this.virusText) {
          this.virusText.setText('');
        }
      });
      
      // Check for mutation and level progression triggers
      this.checkMutationTrigger();
      this.checkLevelProgression();
    } else {
      // Remove tail if no food eaten
      this.snake.pop();
    }

    // Redraw everything
    this.draw();
  }

  private spawnFood() {
    let newFood: { x: number; y: number };
    do {
      newFood = {
        x: Math.floor(Math.random() * GAME_CONFIG.GRID_WIDTH),
        y: Math.floor(Math.random() * GAME_CONFIG.GRID_HEIGHT)
      };
    } while (
      this.snake.some(segment => segment.x === newFood.x && segment.y === newFood.y) ||
      this.cholesterolObstacles.some(obs => obs.x === newFood.x && obs.y === newFood.y)
    );
    
    this.food = newFood;
  }

  private draw() {
    // Clear previous dynamic graphics from game layer only
    this.gameLayer.list.forEach((child: any) => {
      // Destroy all images except the background, and all rectangles used for dynamic elements
      if ((child instanceof Phaser.GameObjects.Image && child !== this.background) || child instanceof Phaser.GameObjects.Rectangle) {
        child.destroy();
      }
    });

    // Draw level-specific obstacles
    this.drawLevelSpecificElements();

    // Draw enemies - ADD TO GAME LAYER
    this.enemies.forEach(enemy => {
      switch (enemy.type) {
        case 'antibody_drone':
          // Keep antibody drones as rectangles (level 2)
          const color = enemy.stunned ? 0x888888 : COLORS.ANTIBODY_DRONE;
          const size = GAME_CONFIG.GRID_SIZE - 4;
          
          const droneSprite = this.add.rectangle(
            enemy.x * GAME_CONFIG.GRID_SIZE + GAME_CONFIG.GRID_SIZE / 2,
            enemy.y * GAME_CONFIG.GRID_SIZE + GAME_CONFIG.GRID_SIZE / 2,
            size,
            size,
            color
          );
          droneSprite.setStrokeStyle(2, 0xffffff, enemy.stunned ? 0.3 : 0.8);
          this.gameLayer.add(droneSprite);
          break;
          
        case 'microdrone':
          // Use Neuron sprite for microdrones (level 3)
          const neuronSprite = this.add.image(
            enemy.x * GAME_CONFIG.GRID_SIZE + GAME_CONFIG.GRID_SIZE / 2,
            enemy.y * GAME_CONFIG.GRID_SIZE + GAME_CONFIG.GRID_SIZE / 2,
            'neuron'
          );
          neuronSprite.setDisplaySize(GAME_CONFIG.GRID_SIZE - 2, GAME_CONFIG.GRID_SIZE - 2);
          
          if (enemy.stunned) {
            neuronSprite.setTint(0x888888);
            neuronSprite.setAlpha(0.6);
          } else {
            neuronSprite.setTint(COLORS.MICRODRONE);
            neuronSprite.setAlpha(1.0);
          }
          this.gameLayer.add(neuronSprite);
          break;
      }
    });

    // Draw electrical pulses (Nervous System) - ADD TO GAME LAYER
    this.electricalPulses.forEach(pulse => {
      const pulseColor = pulse.isDeadly ? COLORS.ELECTRICAL_PULSE : 0xffaa00; // Orange for warning, yellow for deadly
      const pulseAlpha = pulse.isDeadly ? 0.9 : 0.6; // More transparent during warning phase
      
      if (pulse.direction === 'horizontal') {
        for (let x = 0; x < GAME_CONFIG.GRID_WIDTH; x++) {
          const sparkSprite = this.add.image(
            x * GAME_CONFIG.GRID_SIZE + GAME_CONFIG.GRID_SIZE / 2,
            pulse.position * GAME_CONFIG.GRID_SIZE + GAME_CONFIG.GRID_SIZE / 2,
            'spark'
          );
          sparkSprite.setDisplaySize(GAME_CONFIG.GRID_SIZE, GAME_CONFIG.GRID_SIZE);
          sparkSprite.setAlpha(pulseAlpha);
          sparkSprite.setTint(pulseColor);
          this.gameLayer.add(sparkSprite);
        }
      } else {
        for (let y = 0; y < GAME_CONFIG.GRID_HEIGHT; y++) {
          const sparkSprite = this.add.image(
            pulse.position * GAME_CONFIG.GRID_SIZE + GAME_CONFIG.GRID_SIZE / 2,
            y * GAME_CONFIG.GRID_SIZE + GAME_CONFIG.GRID_SIZE / 2,
            'spark'
          );
          sparkSprite.setDisplaySize(GAME_CONFIG.GRID_SIZE, GAME_CONFIG.GRID_SIZE);
          sparkSprite.setAlpha(pulseAlpha);
          sparkSprite.setTint(pulseColor);
          this.gameLayer.add(sparkSprite);
        }
      }
    });

    // Draw virus (evolved snake) - ADD TO GAME LAYER
    this.snake.forEach((segment, index) => {
      const x = segment.x * GAME_CONFIG.GRID_SIZE + GAME_CONFIG.GRID_SIZE / 2;
      const y = segment.y * GAME_CONFIG.GRID_SIZE + GAME_CONFIG.GRID_SIZE / 2;
      let spriteName: string;

      const prev = this.snake[index - 1] || null;
      const next = this.snake[index + 1] || null;

      const isHead = index === 0;
      const isTail = index === this.snake.length - 1;

      const prevDir = prev ? this.getDirection(prev, segment) : null;
      const nextDir = next ? this.getDirection(segment, next) : null;

      if (isHead) {
        if (this.direction.x === 1) spriteName = 'head_right';
        else if (this.direction.x === -1) spriteName = 'head_left';
        else if (this.direction.y === 1) spriteName = 'head_down';
        else if (this.direction.y === -1) spriteName = 'head_up';
        else spriteName = 'head_right';
      } else if (isTail) {
        switch (prevDir) {
          case "up": spriteName = "tail_up"; break;
          case "down": spriteName = "tail_down"; break;
          case "left": spriteName = "tail_left"; break;
          case "right": spriteName = "tail_right"; break;
          default: spriteName = "tail_down"; // fallback
        }
      } else {
        // A body segment's sprite is determined by the segments before and after it.
        if (prevDir === nextDir) {
          // This is a straight segment.
          spriteName = (prevDir === 'left' || prevDir === 'right') ? 'body_straight_horiz' : 'body_straight_vert';
        } else {
          // This is a curved segment.
          const map: { [key: string]: string } = {
            "up-right": "body_curve_bl", "right-up": "body_curve_bl",
            "up-left": "body_curve_br", "left-up": "body_curve_br",
            "down-right": "body_curve_tl", "right-down": "body_curve_tl",
            "down-left": "body_curve_tr", "left-down": "body_curve_tr"
          };
          const key = `${prevDir}-${nextDir}`;
          spriteName = map[key] || "body_straight_vert"; // fallback
        }
      }
      
      const virusSegment = this.add.image(x, y, spriteName).setDisplaySize(GAME_CONFIG.GRID_SIZE, GAME_CONFIG.GRID_SIZE);
      this.gameLayer.add(virusSegment);
    });

    // Draw white blood cell (evolved food) - ADD TO GAME LAYER
    const foodSprite = this.add.image(
      this.food.x * GAME_CONFIG.GRID_SIZE + GAME_CONFIG.GRID_SIZE / 2,
      this.food.y * GAME_CONFIG.GRID_SIZE + GAME_CONFIG.GRID_SIZE / 2,
      'white_cell'
    ).setDisplaySize(GAME_CONFIG.GRID_SIZE, GAME_CONFIG.GRID_SIZE);
    this.gameLayer.add(foodSprite);
  }

  private drawLevelSpecificElements() {
    switch (this.currentLevel) {
      case 'circulatory':
        // Draw cholesterol obstacles - ADD TO GAME LAYER
        this.cholesterolObstacles.forEach(obstacle => {
          const obstacleSprite = this.add.image(
            obstacle.x * GAME_CONFIG.GRID_SIZE + GAME_CONFIG.GRID_SIZE / 2,
            obstacle.y * GAME_CONFIG.GRID_SIZE + GAME_CONFIG.GRID_SIZE / 2,
            'cholesterol'
          ).setDisplaySize(GAME_CONFIG.GRID_SIZE, GAME_CONFIG.GRID_SIZE);
          this.gameLayer.add(obstacleSprite);
        });
        break;
        
      case 'nervous':
        // Neural pathway highlights are handled in background
        break;
        
      case 'brain':
        // Brain maze elements are handled in background and thought bubbles are created dynamically
        break;
    }
  }

  private endGame() {
    this.gameOver = true;
    
    // Stop ambient sounds and play game over sound effect
    this.audio.stopAmbient();
    this.audio.playGameOver();
    
    // Show game over with virus commentary
    const gameOverTexts = VIRUS_TEXTS.gameOver;
    const randomText = gameOverTexts[Math.floor(Math.random() * gameOverTexts.length)];
    
    this.gameOverText = this.add.text(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 
      `>>> MISSION TERMINATED <<<\n\n` +
      `⚠️  IMMUNE SYSTEM RESPONSE: SUCCESSFUL\n\n` +
      `📊 Final Infection Level: ${this.score}\n\n` +
      `🧬 Virus Status Report:\n   "${randomText}"\n\n` +
      `🔄 Press SPACE or W to Retry Infiltration`, {
      fontSize: '12px',
      color: '#ff0044',
      align: 'left',
      fontFamily: 'IBM Plex Mono, monospace',
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      padding: { x: 20, y: 16 }
    }).setOrigin(0.5);
    this.overlayLayer.add(this.gameOverText);
  }

  private restartGame() {
    // Select new random host for this session
    this.currentHost = this.selectRandomHost();
    
    // Reset game state
    this.gameOver = false;
    this.gameStarted = false;
    this.score = 0;
    this.direction = { x: 1, y: 0 };
    this.nextDirection = { x: 1, y: 0 };

    // Reset snake position
    const startX = Math.floor(GAME_CONFIG.GRID_WIDTH / 2);
    const startY = Math.floor(GAME_CONFIG.GRID_HEIGHT / 2);
    
    this.snake = [
      { x: startX, y: startY },
      { x: startX - 1, y: startY },
      { x: startX - 2, y: startY }
    ];

    // Spawn new white blood cell
    this.spawnFood();

    // Update UI
    this.scoreText?.setText('🧬 Infection Level: 0');
    this.gameOverText?.destroy();
    this.gameOverText = undefined;
    this.virusText?.setText('');
    
    this.instructionText?.setVisible(true);

    // Clear virus graphics for restart
    this.children.list.forEach(child => {
      if (child instanceof Phaser.GameObjects.Image) {
        child.destroy();
      }
    });
    
    // Regenerate background with new host environment
    this.createLevelBackground();
    
    // Restart level ambient sounds
    this.audio.startLevelAmbient(this.currentLevel);
    
    this.add.existing(this.scoreText!);
    this.add.existing(this.instructionText!);
    this.add.existing(this.virusText!);
  }

  private triggerImpulsePulse() {
    console.log('triggerImpulsePulse called', {
      gameStarted: this.gameStarted,
      gameOver: this.gameOver,
      currentLevel: this.currentLevel,
      currentPulses: this.electricalPulses.length
    });
    
    if (!this.gameStarted || this.gameOver || this.currentLevel !== 'nervous') {
      console.log('Pulse trigger conditions not met');
      return;
    }
    
    // Create electrical pulse across row or column
    const isHorizontal = Math.random() > 0.5;
    const position = Math.floor(Math.random() * (isHorizontal ? GAME_CONFIG.GRID_HEIGHT : GAME_CONFIG.GRID_WIDTH));
    
    const pulse: ElectricalPulse = {
      direction: isHorizontal ? 'horizontal' : 'vertical',
      position: position,
      activatedAt: this.time.now,
      duration: 2000, // 2 seconds total
      warningPhase: 1000, // 1 second warning phase
      isDeadly: false // Starts as warning, becomes deadly after 1 second
    };
    
    this.electricalPulses.push(pulse);
    console.log('✓ Electrical pulse created:', pulse);
    
    // Play electrical pulse sound
    this.audio.playElectricalPulse();
    
    if (this.virusText) {
      this.virusText.setText('Virus: "Electrical surge incoming. Orange warning, yellow death."');
    }
    
    this.time.delayedCall(5000, () => {
      if (this.virusText) {
        this.virusText.setText('');
      }
    });
    
    // Remove pulse after duration
    this.time.delayedCall(pulse.duration, () => {
      const index = this.electricalPulses.indexOf(pulse);
      if (index > -1) {
        this.electricalPulses.splice(index, 1);
      }
    });
  }

  private triggerNeuroplasticity() {
    if (!this.gameStarted || this.gameOver || this.currentLevel !== 'brain') return;
    
    // Subtle visual warning - purple flash for brain
    this.cameras.main.flash(100, 50, 50, 100, false);
    
    // Background is now handled by sprite system
    
    // Play neuroplasticity sound
    this.audio.playNeuroplasticity();
    
    // Show virus text about the maze shift
    if (this.virusText && Math.random() < 0.4) {
      const neuroplasticityTexts = [
        "Neural pathways are shifting...",
        "Gray matter reconfiguring. Fascinating.",
        "The maze thinks it can outsmart me.",
        "Neuroplasticity detected. Evolving strategy."
      ];
      const randomText = neuroplasticityTexts[Math.floor(Math.random() * neuroplasticityTexts.length)];
      this.virusText.setText(`🧬 Virus: "${randomText}"`);
      this.time.delayedCall(6000, () => {
        this.virusText?.setText('');
      });
    }
  }

  private triggerNeuralInterference() {
    if (!this.gameStarted || this.gameOver || this.currentLevel !== 'nervous') return;
    
    // Add movement delay for 1 second
    this.movementDelay = 0.1; // 100ms delay
    this.lastNeuralInterference = this.time.now;
    
    if (this.virusText) {
      this.virusText.setText('Virus: "Synaptic confusion... movement... sluggish..."');
    }
    
    this.time.delayedCall(1000, () => {
      this.movementDelay = 0;
    });
    
    this.time.delayedCall(5000, () => {
      if (this.virusText) {
        this.virusText.setText('');
      }
    });
  }

  private spawnThoughtBubble() {
    if (!this.gameStarted || this.gameOver || this.currentLevel !== 'brain') return;
    
    // Spawn thought bubbles as temporary obstacles
    const thoughts = [
      "what if I'm not special?",
      "am I living my best life?",
      "did I leave the stove on?",
      "why do I exist?",
      "is this all there is?",
      "what's the point?"
    ];
    
    const thought = thoughts[Math.floor(Math.random() * thoughts.length)];
    
    // Find empty space for thought bubble
    let position: { x: number; y: number };
    let attempts = 0;
    
    do {
      position = {
        x: Math.floor(Math.random() * GAME_CONFIG.GRID_WIDTH),
        y: Math.floor(Math.random() * GAME_CONFIG.GRID_HEIGHT)
      };
      attempts++;
    } while ((
      this.snake.some(segment => segment.x === position.x && segment.y === position.y) ||
      (position.x === this.food.x && position.y === this.food.y) ||
      this.enemies.some(enemy => enemy.x === position.x && enemy.y === position.y)
    ) && attempts < 20);
    
    if (attempts < 20) {
      // Create thought bubble text that floats and fades
      const thoughtText = this.add.text(
        position.x * GAME_CONFIG.GRID_SIZE + GAME_CONFIG.GRID_SIZE / 2,
        position.y * GAME_CONFIG.GRID_SIZE + GAME_CONFIG.GRID_SIZE / 2,
        thought,
        {
          fontSize: '10px',
          color: '#ff44ff',
          fontFamily: 'monospace',
          backgroundColor: 'rgba(255, 68, 255, 0.1)',
          padding: { x: 4, y: 2 }
        }
      ).setOrigin(0.5);
      
      // Fade out after 6 seconds
      this.time.delayedCall(6000, () => {
        thoughtText.destroy();
      });
    }
  }



  private showRandomVirusText() {
    if (!this.gameStarted || this.gameOver || this.showingHostIntro || this.showingMutationSelection) return;
    
    const texts = VIRUS_TEXTS.idle;
    const randomText = texts[Math.floor(Math.random() * texts.length)];
    if (this.virusText) {
      this.virusText.setText(`🧬 Virus: "${randomText}"`);
    }
    
    // Clear text after 6 seconds (increased from 3)
    this.time.delayedCall(6000, () => {
      if (this.virusText) {
        this.virusText.setText('');
      }
    });
  }

  private showRandomHostThought() {
    if (!this.gameStarted || this.gameOver || this.showingHostIntro || this.showingMutationSelection) return;
    
    const thoughts = this.currentHost.thoughts;
    const randomThought = thoughts[Math.floor(Math.random() * thoughts.length)];
    if (this.hostThoughtText) {
      this.hostThoughtText.setText(`🧠 ${this.currentHost.name}: "${randomThought}"`);
    }
    
    // Clear text after 7 seconds (increased from 4)
    this.time.delayedCall(7000, () => {
      if (this.hostThoughtText) {
        this.hostThoughtText.setText('');
      }
    });
  }

  private checkMutationTrigger() {
    if (this.score >= this.nextMutationScore && !this.showingMutationSelection) {
      this.triggerMutationSelection();
    }
  }

  private checkLevelProgression() {
    const nextLevelScore = this.getNextLevelScore();
    if (nextLevelScore > 0 && this.score >= nextLevelScore && !this.showingLevelTransition) {
      this.triggerLevelTransition();
    }
  }

  private triggerLevelTransition() {
    this.showingLevelTransition = true;
    
    // Determine next level
    const currentLevelId = LEVELS[this.currentLevel].id;
    const nextLevel = Object.values(LEVELS).find(level => level.id === currentLevelId + 1);
    
    if (nextLevel) {
      // Play level up sound effect
      this.audio.playLevelUp();
      
      // Show level transition screen
      const overlay = this.add.rectangle(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH, CANVAS_HEIGHT, 0x000000, 0.9);
      this.overlayLayer.add(overlay);
      
      // Add virus icon at the top
      const virusIcon = this.add.image(CANVAS_WIDTH / 2, 60, 'cutscene_icon_virus')
        .setDisplaySize(48, 48);
      this.overlayLayer.add(virusIcon);
      
      this.levelTransitionText = this.add.text(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20,
        `>>> SYSTEM INFILTRATION SUCCESSFUL <<<\n\n` +
        `🎯 ADVANCING TO: ${nextLevel.name}\n` +
        `   "${nextLevel.subtitle}"\n\n` +
        `📊 MISSION STATUS:\n` +
        `   ${nextLevel.description}\n\n` +
        `🧬 Current Infection Level: ${this.score}\n` +
        `⚙️  Active Mutations: ${this.activeMutations.filter(am => am.isActive).length}\n\n` +
        `📡 Press ANY KEY to Continue Infiltration`, {
        fontSize: '12px',
        color: '#6ee86e',
        align: 'left',
        fontFamily: 'IBM Plex Mono, monospace',
        lineSpacing: 4,
        backgroundColor: 'rgba(10, 10, 10, 0.95)',
        padding: { x: 20, y: 16 },
        wordWrap: { width: CANVAS_WIDTH - 80 }
      }).setOrigin(0.5);
      this.overlayLayer.add(this.levelTransitionText);
      
      // Set up input to proceed
      this.input.keyboard?.once('keydown', () => {
        const levelKey = Object.keys(LEVELS).find(key => LEVELS[key as keyof typeof LEVELS].id === nextLevel.id) as keyof typeof LEVELS;
        this.advanceToNextLevel(levelKey);
        overlay.destroy();
        virusIcon.destroy();
        if (this.levelTransitionText) {
          this.levelTransitionText.destroy();
          this.levelTransitionText = undefined;
        }
        this.showingLevelTransition = false;
      });
    }
  }

  private advanceToNextLevel(levelKey: keyof typeof LEVELS) {
    this.currentLevel = levelKey;
    
    // Clear existing level-specific elements
    this.enemies = [];
    this.electricalPulses = [];
    this.cholesterolObstacles = [];
    
    // Regenerate level-specific background and elements
    this.createLevelBackground();
    this.spawnLevelSpecificElements();
    
    // Update UI
    if (this.levelInfoText) {
      this.levelInfoText.setText(`🩸 System: ${LEVELS[this.currentLevel].name}`);
    }
    
    // Apply caffeine gland speed boost if active
    const caffeineGland = this.activeMutations.find(am => am.mutation.id === 'caffeineGland' && am.isActive);
    if (caffeineGland) {
      this.hasSpeedBoost = true;
    }
    
    // Start new level ambient sounds
    this.audio.startLevelAmbient(this.currentLevel);
    
    // Show level advancement message
    if (this.virusText) {
      this.virusText.setText(`🧬 Virus: "New tissue detected. Adapting infiltration protocols..."`);
    }
    
    this.time.delayedCall(6000, () => {
      if (this.virusText) {
        this.virusText.setText('');
      }
    });
  }

  private triggerMutationSelection() {
    this.showingMutationSelection = true;
    
    // Filter mutations by current level
    const currentLevelId = LEVELS[this.currentLevel].id;
    const availableMutations = Object.values(MUTATIONS).filter(mutation => mutation.level <= currentLevelId);
    this.mutationOptions = [];
    
    for (let i = 0; i < 3; i++) {
      let mutation;
      do {
        mutation = availableMutations[Math.floor(Math.random() * availableMutations.length)];
      } while (this.mutationOptions.includes(mutation));
      this.mutationOptions.push(mutation);
    }
    
    this.showMutationSelectionUI();
  }

  private addHostSpecificElements() {
    // Add environment elements based on current host
    switch (this.currentHost.environment) {
      case 'protein_powder':
        // Brayden's protein powder environment
        for (let i = 0; i < 12; i++) {
          const startX = Math.random() * CANVAS_WIDTH;
          const startY = Math.random() * CANVAS_HEIGHT;
          const endX = startX + (Math.random() - 0.5) * 200;
          const endY = startY + (Math.random() - 0.5) * 200;
          
          const line = this.add.line(0, 0, startX, startY, endX, endY, COLORS.CAPILLARY);
          line.setLineWidth(2 + Math.random() * 3);
          line.setAlpha(0.4);
        }

        // Protein powder particles
        for (let i = 0; i < 6; i++) {
          const particle = this.add.circle(
            Math.random() * CANVAS_WIDTH,
            Math.random() * CANVAS_HEIGHT,
            3 + Math.random() * 4,
            0xffffaa,
            0.2
          );
        }
        break;

      case 'caffeine_overload':
        // Greg's caffeine environment - jittery lines and coffee stains
        for (let i = 0; i < 8; i++) {
          const line = this.add.line(0, 0,
            Math.random() * CANVAS_WIDTH, Math.random() * CANVAS_HEIGHT,
            Math.random() * CANVAS_WIDTH, Math.random() * CANVAS_HEIGHT,
            0x8B4513, 0.3); // Brown coffee color
          line.setLineWidth(1 + Math.random() * 2);
        }

        // Coffee stain circles
        for (let i = 0; i < 4; i++) {
          const stain = this.add.circle(
            Math.random() * CANVAS_WIDTH,
            Math.random() * CANVAS_HEIGHT,
            5 + Math.random() * 8,
            0x654321,
            0.15
          );
        }
        break;

      case 'gold_plated':
        // Tiffany's gold environment - shimmering particles
        for (let i = 0; i < 10; i++) {
          const particle = this.add.circle(
            Math.random() * CANVAS_WIDTH,
            Math.random() * CANVAS_HEIGHT,
            2 + Math.random() * 3,
            0xFFD700, // Gold color
            0.3
          );
        }

        // Gold veins
        for (let i = 0; i < 6; i++) {
          const line = this.add.line(0, 0,
            Math.random() * CANVAS_WIDTH, Math.random() * CANVAS_HEIGHT,
            Math.random() * CANVAS_WIDTH, Math.random() * CANVAS_HEIGHT,
            0xDAA520, 0.25); // Dark gold
          line.setLineWidth(1);
        }
        break;

      case 'political_chaos':
        // Rat Kings' chaotic environment - tangled lines
        for (let i = 0; i < 15; i++) {
          const line = this.add.line(0, 0,
            Math.random() * CANVAS_WIDTH, Math.random() * CANVAS_HEIGHT,
            Math.random() * CANVAS_WIDTH, Math.random() * CANVAS_HEIGHT,
            0x666666, 0.2); // Gray chaos
          line.setLineWidth(1 + Math.random());
        }

        // Cheese crumb particles
        for (let i = 0; i < 8; i++) {
          const crumb = this.add.circle(
            Math.random() * CANVAS_WIDTH,
            Math.random() * CANVAS_HEIGHT,
            1 + Math.random() * 2,
            0xFFF8DC, // Cheese color
            0.3
          );
        }
        break;

      default:
        // Default protein powder environment
        for (let i = 0; i < 8; i++) {
          const line = this.add.line(0, 0,
            Math.random() * CANVAS_WIDTH, Math.random() * CANVAS_HEIGHT,
            Math.random() * CANVAS_WIDTH, Math.random() * CANVAS_HEIGHT,
            COLORS.CAPILLARY, 0.3);
          line.setLineWidth(2);
        }
        break;
    }
  }

  private createTopRightUI() {
    // Create a container for the top-right UI block
    const topRightContainer = this.add.container(CANVAS_WIDTH - 15, 15);
    topRightContainer.setScrollFactor(0); // Camera protection
    
    // Container background for visual coherence - much smaller size
    const containerBg = this.add.rectangle(0, 0, 180, 50, 0x000000, 0.7);
    containerBg.setStrokeStyle(1, 0xf3e448, 0.3);
    containerBg.setOrigin(1, 0);
    topRightContainer.add(containerBg);

    // Host portrait (small icon in corner)
    let portraitKey = '';
    switch (this.currentHost) {
      case HOSTS.brayden:
        portraitKey = 'host_portrait_Brayden';
        break;
      case HOSTS.greg:
        portraitKey = 'host_portrait_Greg';
        break;
      case HOSTS.tiffany:
        portraitKey = 'host_portrait_Tiffany';
        break;
      case HOSTS.ratKings:
        portraitKey = 'host_portrait_Rat_King';
        break;
    }
    
    const hostPortrait = this.add.image(-10, 10, portraitKey);
    hostPortrait.setDisplaySize(28, 28); // Slightly smaller portrait
    hostPortrait.setOrigin(1, 0);
    topRightContainer.add(hostPortrait);

    // Host information text block - more compact
    const hostInfo = this.add.text(-45, 8, 
      `HOST: ${this.currentHost.name}\n` +
      `MUTATION: ${this.nextMutationScore}\n` +
      `LEVEL: ${this.getNextLevelScore() || 'MAX'}`, {
      fontSize: '9px', // Smaller font
      color: '#f3e448',
      fontFamily: 'IBM Plex Mono, monospace',
      lineSpacing: 1,
      align: 'right'
    });
    hostInfo.setOrigin(1, 0);
    topRightContainer.add(hostInfo);

    // Status indicator - smaller and repositioned
    const statusIndicator = this.add.circle(-15, 20, 2, 0x00ff44);
    statusIndicator.setOrigin(0.5);
    topRightContainer.add(statusIndicator);

    // Add pulsing effect to status indicator
    this.tweens.add({
      targets: statusIndicator,
      alpha: 0.3,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Add the entire container to UI layer
    this.uiLayer.add(topRightContainer);

    // Store reference for updates
    this.topRightUI = {
      container: topRightContainer,
      hostInfo: hostInfo,
      portrait: hostPortrait
    };
  }

  private updateTopRightUI() {
    if (this.topRightUI && this.topRightUI.hostInfo) {
      this.topRightUI.hostInfo.setText(
        `HOST: ${this.currentHost.name}\n` +
        `MUTATION: ${this.nextMutationScore}\n` +
        `LEVEL: ${this.getNextLevelScore() || 'MAX'}`
      );
    }
  }
}

export default function Game({ className }: GameProps) {
  const gameRef = useRef<HTMLDivElement>(null);
  const phaserGameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    // Add logging for debugging
    console.log('Game component mounting...');
    
    if (!gameRef.current) {
      console.log('Game ref not ready yet');
      return;
    }
    
    if (phaserGameRef.current) {
      console.log('Phaser game already exists');
      return;
    }

    try {
      console.log('Creating Phaser game...');
      
      // Phaser game configuration
      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        parent: gameRef.current,
        pixelArt: true,
        backgroundColor: '#220000', // Dark blood red
        scene: SnakeScene,
        physics: {
          default: 'arcade',
          arcade: {
            debug: false
          }
        },
        scale: {
          mode: Phaser.Scale.FIT,
          autoCenter: Phaser.Scale.CENTER_BOTH,
          parent: gameRef.current,
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT
        }
      };

      // Create Phaser game instance
      phaserGameRef.current = new Phaser.Game(config);
      console.log('Phaser game created successfully');
      
    } catch (error) {
      console.error('Error creating Phaser game:', error);
    }

    // Cleanup function
    return () => {
      console.log('Cleaning up Phaser game...');
      if (phaserGameRef.current) {
        phaserGameRef.current.destroy(true);
        phaserGameRef.current = null;
      }
    };
  }, []);

  return (
    <div className={className}>
      <div
        ref={gameRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {/* The Phaser game canvas will be attached here */}
      </div>
    </div>
  );
} 