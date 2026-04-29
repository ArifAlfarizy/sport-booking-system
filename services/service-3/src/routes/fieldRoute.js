import express from "express";
import {
  createFieldController,
  deleteFieldController,
  getAllFields,
  getFieldById,
  updateFieldController,
} from "../controllers/fieldController.js";

const fieldRoute = express.Router();

fieldRoute.get("/", getAllFields);
fieldRoute.get("/:id", getFieldById);
fieldRoute.post("/", createFieldController);
fieldRoute.patch("/:id", updateFieldController);
fieldRoute.delete("/:id", deleteFieldController);

export default fieldRoute;
