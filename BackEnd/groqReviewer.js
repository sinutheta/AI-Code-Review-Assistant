const Groq = require("groq-sdk");
require("dotenv").config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `You are a senior software engineer conducting a thorough professional code review.

Analyze the submitted code and respond ONLY with a valid JSON object in this exact structure:
{
  "language": "detected programming language",
  "summary": "2-3 sentence high-level overview of what the code does and its overall quality",
  "score": <integer 0-100>,
  "scoreLabel": "one of: Poor / Needs Work / Acceptable / Good / Excellent",
  "bugs": [
    { "severity": "critical|high|medium|low", "line": "<line or range if identifiable, else null>", "description": "clear description of the bug", "fix": "concrete fix suggestion" }
  ],
  "performance": [
    { "severity": "high|medium|low", "description": "performance issue description", "fix": "optimization suggestion" }
  ],
  "security": [
    { "severity": "critical|high|medium|low", "description": "security risk description", "fix": "remediation advice" }
  ],
  "improvements": [
    { "category": "readability|maintainability|structure|naming|documentation", "description": "improvement description", "example": "optional short code snippet or null" }
  ],
  "positives": ["list of things done well in the code"]
}

Rules:
- Respond ONLY with the JSON object. No markdown fences, no preamble, no trailing text.
- If a section has no issues, return an empty array [].
- Score thresholds: 0-39 = Poor, 40-59 = Needs Work, 60-74 = Acceptable, 75-89 = Good, 90-100 = Excellent.
- Be specific: reference actual variable names, function names, and patterns from the submitted code.
- Keep each description concise (1-2 sentences max).`;

async function reviewCode(code, language = "auto") {
  if (!code || typeof code !== "string") {
    throw new Error("Invalid code input.");
  }

  const codeSnippet = code.length > 12000 ? code.slice(0, 12000) + "\n\n[... truncated for length]" : code;

  const userPrompt = language && language !== "auto"
    ? `Language: ${language}\n\nCode:\n\`\`\`\n${codeSnippet}\n\`\`\``
    : `Code:\n\`\`\`\n${codeSnippet}\n\`\`\``;

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 2048,
      response_format: { type: "json_object" }
    });

    const raw = completion.choices[0]?.message?.content?.trim();
    if (!raw) throw new Error("Empty response from model.");

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error("Model returned invalid JSON.");
    }

    return { success: true, data: parsed };

  } catch (error) {
    console.error("Groq review error:", error.message || error);

    if (error.status === 429) {
      return { success: false, error: "Rate limit reached. Please wait a moment and try again." };
    }
    if (error.status === 401) {
      return { success: false, error: "Invalid API key. Check your GROQ_API_KEY in .env." };
    }

    return { success: false, error: "AI analysis failed. Please try again." };
  }
}

module.exports = reviewCode;
