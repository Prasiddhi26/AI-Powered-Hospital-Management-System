/**
 * gemini.js
 * Google Gemini AI configuration (NEW SDK - @google/genai)
 */

const { GoogleGenAI } = require("@google/genai");

// ─── API KEY ─────────────────────────────────────────────
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is missing in environment variables.");
}

// ─── CLIENT INIT ──────────────────────────────────────────
const genAI = new GoogleGenAI({
  apiKey: GEMINI_API_KEY,
});

// ───────────────────────────────────────────────────────────
// 1. GENERATE TEXT (replacement for getTextModel + generateText)
// ───────────────────────────────────────────────────────────
const generateText = async (prompt) => {
  const result = await genAI.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
  });

  return result.text;
};

// ───────────────────────────────────────────────────────────
// 2. IMAGE ANALYSIS (replacement for getVisionModel + analyzeImage)
// ───────────────────────────────────────────────────────────
const analyzeImage = async (base64Image, mimeType, prompt) => {
  const result = await genAI.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        inlineData: {
          data: base64Image,
          mimeType,
        },
      },
      prompt || "Analyze this image in simple medical terms.",
    ],
  });

  return result.text;
};

// ───────────────────────────────────────────────────────────
// 3. CHAT SESSION (replacement for startChatSession)
// ───────────────────────────────────────────────────────────
const startChatSession = (history = []) => {
  return {
    sendMessage: async (message) => {
      const result = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          ...history,
          { role: "user", parts: [{ text: message }] },
        ],
      });

      return result.text;
    },
  };
};

// ───────────────────────────────────────────────────────────
// 4. MEDICAL PROMPTS (same as before)
// ───────────────────────────────────────────────────────────
const MedicalPrompts = {
  symptomChecker: (symptoms, age, gender) => `
You are a medical AI assistant.

Patient:
- Age: ${age || "N/A"}
- Gender: ${gender || "N/A"}
- Symptoms: ${symptoms}

Return ONLY JSON:
{
  "possibleConditions": [],
  "urgencyLevel": "low|medium|high|emergency",
  "urgencyExplanation": "",
  "recommendedSpecialization": "",
  "immediateActions": [],
  "lifestyle": [],
  "disclaimer": "This is not medical advice."
}
`.trim(),

  appointmentSummary: (data) => `
Summarize this appointment in simple bullet points:
${JSON.stringify(data, null, 2)}
`.trim(),

  reportAnalysis: (text) => `
Analyze this medical report:
${text}

Give:
- key findings
- abnormal values
- recommendations
- simple summary
`.trim(),

  doctorRecommendation: (symptoms, doctors) => `
Symptoms: ${symptoms}

Doctors:
${JSON.stringify(doctors, null, 2)}

Return top 2 best matches with reason.
`.trim(),
};

// ───────────────────────────────────────────────────────────
// EXPORTS
// ───────────────────────────────────────────────────────────
module.exports = {
  genAI,
  generateText,
  analyzeImage,
  startChatSession,
  MedicalPrompts,
};






















