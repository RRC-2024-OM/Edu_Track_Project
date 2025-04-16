import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import courseRoutes from './routes/course.routes';
import enrollmentRoutes from './routes/enrollment.routes'
import { setupSwagger } from './config/swagger'; 


dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Swagger setup
setupSwagger(app);

// Routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/courses', courseRoutes);
app.use('/enrollments', enrollmentRoutes);


app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

export default app;

