import express from "express";
import "dotenv/config";
import passport from "./config/passport.js";        // ← tambah
import authRouter from "./routes/authRoute.js";
import oauthRouter from "./routes/oauthRoute.js";  // ← tambah
import verifyToken from "./middleware/authMiddleware.js";
import cookieParser from "cookie-parser";

const PORT = process.env.PORT || 3001;

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());                     // ← tambah

app.use("/auth", authRouter);
app.use("/auth", oauthRouter);                     // ← tambah

app.get("/tes", verifyToken, (req, res) => {
  res.send("tes");
});

app.get("/", (req, res) => {
  res.send("Tes");
});

app.listen(PORT, () => {
  console.log(`Server running on PORT ${PORT}`);
});