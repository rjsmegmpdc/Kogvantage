// ============================================================
// KOGVANTAGE — Health Check API Endpoint
// Simple monitoring endpoint for uptime checks & readiness probes
// ============================================================

import { NextResponse } from 'next/server';
import { getDb } from '@/server/db/sqlite';

export async function GET() {
  let dbStatus: 'connected' | 'error' = 'error';

  try {
    const db = getDb();
    // Quick read to verify the connection is alive
    db.prepare('SELECT 1').get();
    dbStatus = 'connected';
  } catch {
    dbStatus = 'error';
  }

  const payload = {
    status: 'ok',
    version: '0.1.0',
    timestamp: new Date().toISOString(),
    database: dbStatus,
    uptime: Math.round(process.uptime()),
  };

  return NextResponse.json(payload, {
    status: dbStatus === 'connected' ? 200 : 503,
  });
}
