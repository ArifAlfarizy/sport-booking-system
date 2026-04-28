import express from "express";
import {
  login,
  refresh,
  register,
  logout,
} from "../controllers/authController.js";

const authRouter = express.Router();
authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/logout", logout);
authRouter.post("/refresh", refresh);

export default authRouter;
