import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './config/db.js';
import { seedInitialDatabase } from './utils/seedData.js';
import apiRoutes from './routes/api.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api', apiRoutes);

// In production, serve the compiled Vite frontend static assets
const clientDistPath = path.join(__dirname, '../../dist');
app.use(express.static(clientDistPath));

// Client-side SPA routing fallback (compatible with Express 5)
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    return res.sendFile(path.join(clientDistPath, 'index.html'), (err) => {
      if (err) {
        res.status(200).send('Smruthi Organics Electrical Department API is running.');
      }
    });
  }
  next();
});

async function startServer() {
  const isConnected = await connectDB();
  if (isConnected) {
    try {
      await seedInitialDatabase();
    } catch (err) {
      console.error('Error during initial MongoDB seed:', err);
    }
  }

  app.listen(PORT, () => {
    console.log(`\n⚡ [Smruthi Organics Energy Portal]: Server running on port ${PORT}`);
    console.log(`📡 [API Endpoint]: http://localhost:${PORT}/api/health`);
    console.log(`🌐 [Mode]: ${process.env.NODE_ENV || 'development'}\n`);
  });
}

startServer();
