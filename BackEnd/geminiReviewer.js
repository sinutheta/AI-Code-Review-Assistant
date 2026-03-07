const { GoogleGenAI } = require("@google/genai");
require("dotenv").config();

console.log("API KEY:", process.env.GEMINI_API_KEY);

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

async function reviewCode(code) {

  try {

    console.log("Sending request to Gemini...");

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `Review this code:\n${code}`
    });

    console.log("Gemini response:", response);

    return response.text;

  } catch (error) {

    console.error("Gemini Error FULL:", error);

    return "AI analysis failed.";

  }

}

module.exports = reviewCode;