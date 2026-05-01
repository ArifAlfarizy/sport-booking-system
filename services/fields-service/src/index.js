import express from "express";
import "dotenv/config";
import fieldRoute from "./routes/fieldRoute.js";
import slotRouter from "./routes/slotRoute.js";
const PORT = process.env.PORT || 3002;

const app = express();
app.use(express.json());

app.use("/", fieldRoute);
app.use("/", slotRouter)

app.get("/", (req, res) => {
  res.send("Tes");
});

app.listen(PORT, () => {
  console.log(`Server running on PORT ${PORT}`);
});
