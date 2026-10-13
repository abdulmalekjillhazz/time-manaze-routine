// Vercel serverless entry when the project's Root Directory is the REPO ROOT.
// (If Root Directory is `server/`, use `server/api/index.js` instead.)
// Classic `node server/src/index.js` still works for Render/Railway.
import mongoose from 'mongoose';
import { loadEnv } from './server/src/config/env.js';
import { createApp } from './server/src/app.js';
import { dbOptions } from './server/src/lib/db.js';

const cached = globalThis.__srVercel ?? (globalThis.__srVercel = { app: null, config: null });

async function ensureDb(uri, env) {
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(uri, dbOptions(env));
}

function boot() {
  if (cached.app) return cached;
  const config = loadEnv();
  cached.app = createApp({ config });
  cached.config = config;
  return cached;
}

export default async function handler(req, res) {
  let app;
  let config;
  try {
    ({ app, config } = boot());
  } catch (err) {
    console.error(`API boot failed: ${err?.message ?? err}`);
    res.statusCode = 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ success: false, message: err?.message ?? 'Server misconfigured' }));
    return;
  }
  try {
    await ensureDb(config.MONGODB_URI, process.env);
  } catch {
    res.statusCode = 503;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ success: false, message: 'Database unavailable' }));
    return;
  }
  return app(req, res);
}
