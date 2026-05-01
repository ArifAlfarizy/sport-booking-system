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

export default userRouter;