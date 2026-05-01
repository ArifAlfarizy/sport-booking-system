import express from "express";
import "dotenv/config";
import passport from "./config/passport.js";       
import authRouter from "./routes/authRoute.js";
import oauthRouter from "./routes/oauthRoute.js";  
import verifyToken from "./middleware/authMiddleware.js";
import cookieParser from "cookie-parser";
import userRouter from "./routes/userRoute.js";

const PORT = process.env.PORT || 3001;

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());                     

app.use("/", authRouter);
app.use("/", oauthRouter);                    
app.use("/", userRouter);                    

app.get("/tes", verifyToken, (req, res) => {
  res.send("tes");
});

app.get("/", (req, res) => {
  res.send("Tes");
});

app.listen(PORT, () => {
  console.log(`Server running on PORT ${PORT}`);
});