const Groq = require("groq-sdk");
require("dotenv").config();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

async function reviewCode(code) {
  try {

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: "You are a senior software engineer performing a professional code review."
        },
        {
          role: "user",
          content: `Analyze this code and provide:
- Bugs
- Performance issues
- Security risks
- Clean code improvements
- Code quality score out of 100

Code:
${code}`
        }
      ]
    });

    return completion.choices[0].message.content;

  } catch (error) {

    console.error("Groq Error:", error);
    return "AI analysis failed.";

  }
}

module.exports = reviewCode;