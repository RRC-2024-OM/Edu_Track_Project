import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes'; 
import { PORT } from './config/env';

// Create Express application
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/auth', authRoutes);

// Health check endpoint
app.get('/', (req, res) => {
  res.status(200).json({ 
    status: 'running',
    message: 'EduTrack Pro API',
    endpoints: {
      auth: {
        register: 'POST /auth/register',
        login: 'POST /auth/login'
      }
    }
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Export the Express application
export default app;

// Server initialization (only when not imported)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}