const express = require("express");
const cors = require("cors");
const router = require("./routes/payments.routes");

const app = express();
const PORT = 4000;

app.use(express.json());
app.use(cors());

app.use("/api",router)

app.get("/", (req, res) => {
  res.send("Hello backend!");
});

app.listen(PORT, () => {
  console.log(`app listening at http://localhost:${PORT}`);
});
