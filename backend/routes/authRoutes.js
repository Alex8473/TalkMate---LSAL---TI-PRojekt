import { registerUser, loginUser } from "../controllers/authController.js";

export const authRoutes = (app) => {
  app.post("/register", registerUser);
  app.post("/login", loginUser);
};
