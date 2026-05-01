import express from "express";
import {
  deleteUserController,
  getUserDetail,
  updateUserController,
} from "../controllers/userController.js";

const userRouter = express.Router();

userRouter.get("/:id", getUserDetail);
userRouter.patch("/:id", updateUserController);
userRouter.delete("/:id", deleteUserController);

userRouter.use((req, res, next) => {
  console.log("USER HIT:", req.originalUrl);
  next();
});

export default userRouter;
