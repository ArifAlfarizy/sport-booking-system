import express from "express";
import { getAllFields } from "../controllers/fieldController.js";

const fieldRoute = express.Router();

fieldRoute.get("/", getAllFields);

export default fieldRoute;
