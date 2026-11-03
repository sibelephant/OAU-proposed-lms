import { serve } from '@hono/node-server';
import { app } from './app';

const PORT = parseInt(process.env['PORT'] ?? '3000', 10);
const HOST = process.env['HOST'] ?? '0.0.0.0';

serve(
  {
    fetch: app.fetch,
    port: PORT,
    hostname: HOST,
  },
  (info) => {
    console.log(`🎓 AtlasLMS API running at http://${info.address}:${info.port}`);
    console.log(`   Environment : ${process.env['NODE_ENV'] ?? 'development'}`);
    console.log(`   Health check: http://${info.address}:${info.port}/health`);
  }
);
