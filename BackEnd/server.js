const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const reviewCode = require("./groqReviewer");

const app = express();

app.use(cors());
app.use(express.json());

/* Serve Frontend */
app.use(express.static(path.join(__dirname, "../FrontEnd")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../FrontEnd/index.html"));
});

/* API route */
app.post("/review", async (req, res) => {
  try {

    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: "No code provided" });
    }

    const result = await reviewCode(code);

    res.json({
      analysis: result
    });

  } catch (error) {

    console.error("Server Error:", error);

    res.status(500).json({
      error: "AI analysis failed."
    });

  }
});

/* Render requires dynamic port */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});