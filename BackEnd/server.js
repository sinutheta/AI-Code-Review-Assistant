const express = require("express");
const cors = require("cors");
const path = require("path");
const reviewCode = require("./geminiReviewer");

const app = express();

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, "../FrontEnd")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../FrontEnd/index.html"));
});

app.post("/review", async (req, res) => {
  try {
    const { code } = req.body;
    const result = await reviewCode(code);
    res.json({ analysis: result });
  } catch (err) {
    res.status(500).json({ error: "AI analysis failed." });
  }
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});