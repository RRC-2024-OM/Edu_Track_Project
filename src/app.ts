import express from "express";
import cors from "cors";
import { PORT } from "./config/env";
import authRoutes from "./controllers/auth.controller";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});