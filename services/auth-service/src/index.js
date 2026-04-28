import express from "express";
import "dotenv/config";
import authRouter from "./routes/authRoute.js";
import verifyToken from "./middleware/authMiddleware.js";
import cookieParser from "cookie-parser";
const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.json());
app.use(cookieParser());

app.use("/auth", authRouter);
app.get("/tes", verifyToken, (req, res) => {
  res.send("tes");
});

app.get("/", (req, res) => {
  res.send("Tes");
});

app.listen(PORT, () => {
  console.log(`Server running on PORT ${PORT}`);
});
