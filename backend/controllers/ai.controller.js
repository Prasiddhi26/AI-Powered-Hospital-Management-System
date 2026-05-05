const asyncHandler = require("../utils/asyncHandler");
const { GoogleGenAI } = require("@google/genai");

// Init Gemini
const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

/**
 * Helper: call Gemini safely
 */
const callGemini = async (prompt) => {
  const result = await genAI.models.generateContent({
    model: "gemini-2.0-flash", // ✅ correct model
    contents: prompt,
  });

  return result.text;
};

/**
 * @desc AI symptom analysis
 * @route POST /api/ai/symptom-check
 */
const analyzeSymptoms = asyncHandler(async (req, res) => {
  const { symptoms, age, gender, existingConditions } = req.body;

  if (!symptoms || symptoms.length === 0) {
    res.status(400);
    throw new Error("Please provide at least one symptom");
  }

  const symptomsText = Array.isArray(symptoms)
    ? symptoms.join(", ")
    : symptoms;

  const prompt = `
You are a medical AI assistant.

Symptoms: ${symptomsText}
Age: ${age || "Not specified"}
Gender: ${gender || "Not specified"}
Existing conditions: ${existingConditions || "None"}

Return ONLY JSON:
{
  "possibleConditions": [
    {
      "name": "Condition",
      "description": "Short description",
      "probability": "low|medium|high"
    }
  ],
  "urgencyLevel": "low|medium|high|emergency",
  "urgencyExplanation": "",
  "recommendedSpecialization": "",
  "immediateActions": [],
  "lifestyle": [],
  "disclaimer": "This is not medical advice"
}
`;

  try {
    const responseText = await callGemini(prompt);

    let analysis;

    try {
      const cleaned = responseText
        .replace(/```json|```/g, "")
        .trim();

      analysis = JSON.parse(cleaned);
    } catch (err) {
      analysis = {
        possibleConditions: [
          {
            name: "Unable to analyze",
            description: "AI response parsing failed",
            probability: "low",
          },
        ],
        urgencyLevel: "medium",
        urgencyExplanation: "Please consult a doctor",
        recommendedSpecialization: "General Physician",
        immediateActions: ["Visit a doctor"],
        lifestyle: ["Rest well", "Stay hydrated"],
        disclaimer: "Not a medical diagnosis",
      };
    }

    res.json({
      success: true,
      symptoms: symptomsText.split(",").map((s) => s.trim()),
      analysis,
    });
  } catch (error) {
    console.error("Gemini Error:", error.message);
    res.status(503);
    throw new Error("AI service unavailable");
  }
});

/**
 * @desc Suggest specialty
 */
const suggestSpecialty = asyncHandler(async (req, res) => {
  const { concern } = req.body;

  const prompt = `
Health concern: ${concern}

Return ONLY JSON array:
["General Physician", "Cardiologist", "Neurologist"]
`;

  try {
    const responseText = await callGemini(prompt);

    const cleaned = responseText.replace(/```json|```/g, "").trim();

    const specialties = JSON.parse(cleaned);

    res.json({ success: true, specialties });
  } catch (error) {
    res.json({
      success: true,
      specialties: ["General Physician"],
    });
  }
});

module.exports = {
  analyzeSymptoms,
  suggestSpecialty,
};