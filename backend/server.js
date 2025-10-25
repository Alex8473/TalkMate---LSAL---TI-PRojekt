import express from "express";
import { authRoutes } from "./routes/authRoutes.js";

const app = express();
app.use(express.json());

authRoutes(app);

app.listen(3000, () => console.log("Server läuft auf http://localhost:3000"));
