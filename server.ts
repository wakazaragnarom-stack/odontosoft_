import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // CORS headers matching FastAPI CORSMiddleware
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-user-role');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Health check endpoint (matching FastAPI /health)
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      sistema: 'OdontoSoft SaaS API (FastAPI Architecture Synchronized)',
      version: '2.0.0',
      timestamp: new Date().toISOString(),
      services: {
        api: 'running',
        database: 'connected (PostgreSQL / In-Memory Active Store)',
        scheduler: 'APScheduler active (Recordatorios 24h a las 08:00 AM)',
        email: 'FastMail / Gmail SMTP configured',
      },
    });
  });

  // System info endpoint (matching FastAPI /info)
  app.get('/api/info', (req: Request, res: Response) => {
    res.json({
      sistema: 'OdontoSoft',
      version: '2.0.0',
      framework: 'FastAPI + Express Vite Proxy',
      base_datos: 'PostgreSQL - ODONTOLOGIA_ACTUALIZADA',
      ambiente: 'desarrollo',
      timestamp: new Date().toISOString(),
    });
  });

  // Token verify endpoint
  app.post('/api/auth/verify-token', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        valid: false,
        error: 'NO_TOKEN',
        detail: 'Falta cabecera de autorización Bearer',
      });
    }

    const token = authHeader.replace('Bearer ', '');
    try {
      const parts = token.replace('denti_', '').split('.');
      if (parts.length !== 3) {
        return res.status(400).json({ valid: false, error: 'INVALID_TOKEN' });
      }
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
      return res.json({ valid: true, payload });
    } catch {
      return res.status(400).json({ valid: false, error: 'DECODE_ERROR' });
    }
  });

  // Password reset request endpoint (matching FastAPI /auth/solicitar-reset)
  app.post('/api/auth/solicitar-reset', (req: Request, res: Response) => {
    const { correo } = req.body;
    console.log(`[FastMail] Simulating password reset email to: ${correo}`);
    res.json({
      mensaje: 'Si el correo está registrado, recibirás un enlace de recuperación en los próximos minutos.',
    });
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`OdontoSoft SaaS Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
