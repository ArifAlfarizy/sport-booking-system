import express from "express";
import "dotenv/config";
const PORT = process.env.PORT || 3002;

const app = express();

app.get("/", (req, res) => {
  res.send("Tes");
});

app.listen(PORT, () => {
  console.log(`Server running on PORT ${PORT}`);
});
