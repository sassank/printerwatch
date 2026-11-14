import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { snapshots } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();
  let intervalId: NodeJS.Timeout | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const sendLatest = async () => {
        try {
          if (request.signal.aborted) {
            if (intervalId) clearInterval(intervalId);
            return;
          }

          const [latest] = await db
            .select()
            .from(snapshots)
            .orderBy(desc(snapshots.id))
            .limit(1);

          if (latest) {
            const payload = `data: ${JSON.stringify(latest)}\n\n`;
            controller.enqueue(encoder.encode(payload));
          }
        } catch (err) {
          if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
          }
          try {
            controller.close();
          } catch {}
        }
      };

      // Premier envoi immédiat
      void sendLatest();

      // Envoi toutes les 5 secondes
      intervalId = setInterval(sendLatest, 5000);

      // Détection de la déconnexion client
      request.signal.addEventListener('abort', () => {
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
        try {
          controller.close();
        } catch {}
      });
    },
    cancel() {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
