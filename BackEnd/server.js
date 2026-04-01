const express = require("express");
const path = require("path");
const reviewCode = require("../groqReviewer");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "200kb" }));
app.use(express.static(path.join(__dirname, "../FrontEnd")));

app.post("/review", async (req, res) => {
  const { code, language } = req.body;

  if (!code || typeof code !== "string" || !code.trim()) {
    return res.status(400).json({ success: false, error: "No code provided." });
  }

  const result = await reviewCode(code, language);
  return res.json(result);
});

app.use((req, res) => {
  res.sendFile(path.join(__dirname, "../FrontEnd/index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});