import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req) {
  const timestamp = new Date().toISOString();

  try {
    const base44 = createClientFromRequest(req);
    await base44.asServiceRole.entities.GameScore.list('-created_date', 1);
    return Response.json({
      status: 'healthy',
      timestamp,
      checks: { database: 'ok' },
    }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Health check database failure: ${message}`);
    return Response.json({
      status: 'degraded',
      timestamp,
      checks: { database: 'error' },
    }, { status: 503 });
  }
}