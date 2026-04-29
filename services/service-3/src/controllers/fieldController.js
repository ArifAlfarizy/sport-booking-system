import { findAllFields } from "../models/fieldModel.js";

export const getAllFields = async (req, res) => {
  try {
    const fields = await findAllFields();

    res.status(200).json(fields);
  } catch (error) {
    console.error("Error", error);
  }
};

