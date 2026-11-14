import { NewEvent, NewSnapshot } from '@/lib/db/schema';

export interface SimulatorOptions {
  printerId?: string;
  initialToner?: number;
  initialPages?: number;
  intervalMs?: number;
}

export interface SimulationResult {
  snapshot: NewSnapshot;
  events: NewEvent[];
}

export class PrinterSimulator {
  private printerId: string;
  private tonerLevel: number;
  private pagesTotal: number;
  private intervalMs: number;
  private hasEmittedTonerLow: boolean = false;
  private isPaperJammed: boolean = false;
  private timer: NodeJS.Timeout | null = null;

  constructor(options: SimulatorOptions = {}) {
    this.printerId = options.printerId ?? 'printer-01';
    // Starting around 17% allows testing both toner_low (<15%) and toner_replaced (<=3%) quickly
    this.tonerLevel = options.initialToner ?? 17;
    this.pagesTotal = options.initialPages ?? 12450;
    this.intervalMs = options.intervalMs ?? 5000;
  }

  /**
   * Generates a single cycle of simulated printer state and events.
   */
  public tick(): SimulationResult {
    const now = new Date();
    const events: NewEvent[] = [];

    // 1. Handle paper jam state
    if (this.isPaperJammed) {
      // 50% chance paper jam is resolved this tick
      if (Math.random() < 0.5) {
        this.isPaperJammed = false;
        events.push({
          printerId: this.printerId,
          type: 'paper_jam_cleared',
          message: 'Bourrage papier résolu dans le bac principal',
          severity: 'info',
          createdAt: now,
        });
      }
    } else {
      // 2. Random events when operational
      const roll = Math.random();

      if (roll < 0.15) {
        // Bourrage papier (15% de chance)
        this.isPaperJammed = true;
        events.push({
          printerId: this.printerId,
          type: 'paper_jam',
          message: 'Bourrage papier détecté dans le bac principal',
          severity: 'error',
          createdAt: now,
        });
      } else if (roll < 0.25) {
        // Job échoué (10% de chance)
        events.push({
          printerId: this.printerId,
          type: 'job_failed',
          message: "Échec du travail d'impression : erreur de format ou mémoire insuffisante",
          severity: 'error',
          createdAt: now,
        });
      } else {
        // Job terminé avec succès (75% de chance)
        const pagesPrinted = Math.floor(Math.random() * 8) + 2; // 2 à 9 pages
        this.pagesTotal += pagesPrinted;

        // Consommation progressive du toner (2 à 3% par job pour la simulation)
        const tonerDrop = Math.floor(Math.random() * 2) + 2;
        this.tonerLevel = Math.max(0, this.tonerLevel - tonerDrop);

        events.push({
          printerId: this.printerId,
          type: 'job_completed',
          message: `Travail d'impression terminé avec succès (${pagesPrinted} pages)`,
          severity: 'info',
          createdAt: now,
        });
      }
    }

    // 3. Toner low check: émis une seule fois au passage sous 15%
    if (this.tonerLevel < 15 && !this.hasEmittedTonerLow) {
      this.hasEmittedTonerLow = true;
      events.push({
        printerId: this.printerId,
        type: 'toner_low',
        message: `Niveau de toner bas (${this.tonerLevel}%)`,
        severity: 'warning',
        createdAt: now,
      });
    }

    // 4. Toner replaced check: réinitialise à 100% quand il tombe sous 3%
    if (this.tonerLevel <= 3) {
      this.tonerLevel = 100;
      this.hasEmittedTonerLow = false; // Réarmement pour le prochain cycle
      events.push({
        printerId: this.printerId,
        type: 'toner_replaced',
        message: 'Cartouche de toner remplacée (niveau restauré à 100%)',
        severity: 'info',
        createdAt: now,
      });
    }

    // 5. Determine overall status
    let status: 'online' | 'warning' | 'error' = 'online';
    if (this.isPaperJammed) {
      status = 'error';
    } else if (this.tonerLevel < 15) {
      status = 'warning';
    }

    const snapshot: NewSnapshot = {
      printerId: this.printerId,
      status,
      tonerLevel: this.tonerLevel,
      pagesTotal: this.pagesTotal,
      createdAt: now,
    };

    return { snapshot, events };
  }

  /**
   * Starts periodic simulation every intervalMs (default 5s).
   */
  public start(onTick: (data: SimulationResult) => Promise<void> | void): () => void {
    // Premier tick immédiat
    void onTick(this.tick());

    this.timer = setInterval(async () => {
      try {
        await onTick(this.tick());
      } catch (err) {
        console.error('[Simulator] Erreur lors du traitement du tick :', err);
      }
    }, this.intervalMs);

    return () => this.stop();
  }

  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
