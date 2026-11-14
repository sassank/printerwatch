import { db, sqlite } from '@/lib/db';
import { events as eventsTable, snapshots as snapshotsTable } from '@/lib/db/schema';
import { PrinterSimulator } from './adapters/simulator';

async function main() {
  console.log('='.repeat(60));
  console.log('🖨️  Démarrage du Collecteur PrinterWatch');
  console.log('Base de données SQLite connectée avec WAL.');
  console.log('Simulateur configuré pour émettre toutes les 5 secondes.');
  console.log('='.repeat(60));

  const simulator = new PrinterSimulator({
    printerId: 'printer-01',
    initialToner: 17,
    intervalMs: 5000,
  });

  const stop = simulator.start(async ({ snapshot, events }) => {
    try {
      // 1. Insertion du snapshot
      const [insertedSnapshot] = await db
        .insert(snapshotsTable)
        .values(snapshot)
        .returning();

      const timeStr = new Date(insertedSnapshot.createdAt).toLocaleTimeString();
      console.log(
        `[${timeStr}] 📸 Snapshot #${insertedSnapshot.id} | Imprimante: ${insertedSnapshot.printerId} | Statut: ${insertedSnapshot.status.toUpperCase()} | Toner: ${insertedSnapshot.tonerLevel}% | Pages: ${insertedSnapshot.pagesTotal}`
      );

      // 2. Insertion des événements générés
      if (events.length > 0) {
        const insertedEvents = await db
          .insert(eventsTable)
          .values(events)
          .returning();

        for (const ev of insertedEvents) {
          const icon =
            ev.severity === 'error'
              ? '❌'
              : ev.severity === 'warning'
                ? '⚠️'
                : 'ℹ️';
          console.log(
            `    ${icon} [Événement #${ev.id}] [${ev.severity.toUpperCase()}] ${ev.type} : ${ev.message}`
          );
        }
      }
    } catch (err) {
      console.error('[Collector] Erreur lors de l\'enregistrement en base :', err);
    }
  });

  const handleShutdown = (signal: string) => {
    console.log(`\n[Collector] Signal ${signal} reçu. Arrêt propre du collecteur...`);
    stop();
    try {
      sqlite.close();
      console.log('[Collector] Connexion SQLite fermée.');
    } catch (err) {
      console.error('[Collector] Erreur lors de la fermeture SQLite :', err);
    }
    process.exit(0);
  };

  process.on('SIGINT', () => handleShutdown('SIGINT'));
  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
}

main().catch((err) => {
  console.error('[Collector] Erreur fatale au démarrage :', err);
  process.exit(1);
});
