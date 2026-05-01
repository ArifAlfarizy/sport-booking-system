import express from "express";
import {
  createFieldController,
  deleteFieldController,
  getAllFields,
  getFieldById,
  updateFieldController,
} from "../controllers/fieldController.js";
import { createSlotController, getSlotsByField } from "../controllers/slotController.js";

const fieldRoute = express.Router();

fieldRoute.get("/", getAllFields);
fieldRoute.get("/:id", getFieldById);
fieldRoute.post("/", createFieldController);
fieldRoute.patch("/:id", updateFieldController);
fieldRoute.delete("/:id", deleteFieldController);

fieldRoute.get("/:id/slots", getSlotsByField);
fieldRoute.post("/:id/slots", createSlotController);
export default fieldRoute;
