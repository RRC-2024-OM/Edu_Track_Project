import express from 'express';
import authRoutes from '../../src/routes/auth.routes';
// import userRoutes from '../../src/routes/user.routes';

const app = express();

app.use(express.json());

// Attach your routes here
app.use('/auth', authRoutes);
// app.use('/users', userRoutes);

export default app;
