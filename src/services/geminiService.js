// AidPulse AI - Gemini API Service Integration

const GEMINI_MODEL = "gemini-1.5-flash";

/**
 * Sends emergency prompt to Google Gemini API with disaster triage system instructions.
 * 
 * @param {string} prompt - User emergency query
 * @param {string} apiKey - Google Gemini API Key
 * @param {string} language - Current language code (en, es, hi, fr, bn, ar)
 * @param {object} contextData - Context regarding nearby shelters & user location
 * @returns {Promise<{ text: string, actions?: Array }>}
 */
export async function callGeminiDisasterAI(prompt, apiKey, language = 'en', contextData = {}) {
  if (!apiKey || !apiKey.trim()) {
    throw new Error("No Gemini API key provided. Falling back to offline triage agent.");
  }

  const cleanKey = apiKey.trim();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${cleanKey}`;

  const systemInstructionText = `
You are AidPulse AI, an expert emergency response and disaster triage AI assistant.
Your sole mission is to provide life-saving, accurate, precise, actionable, and calm guidance during crisis situations (floods, earthquakes, fires, cyclones, severe injuries).

RULES:
1. Provide extremely clear, prioritized step-by-step instructions (numbered 1, 2, 3).
2. Use markdown formatting (**bold**, bullet points) for instant scannability under stress.
3. Keep answers direct, concise, and accurate. Avoid fluff or generic pleasantries.
4. If there is immediate danger to life, explicitly advise calling emergency hotline 112/911 or tapping the Red SOS button.
5. Answer strictly in language code: ${language}.
6. Location Context: User is currently near Sector 4 Evacuation Zone.
   Nearby Shelters: St. Mary Relief Center (1.2 km, 140 beds free), Central Sports Stadium Refuge (2.4 km, 48 beds free), Apex Tech Institute (3.1 km, 260 beds free).
   Nearby Hospitals: City Trauma Hospital (0.9 km, 18 ER beds), Red Cross Field Hospital (2.1 km, 42 ER beds).
  `;

  const payload = {
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }]
      }
    ],
    systemInstruction: {
      parts: [{ text: systemInstructionText }]
    },
    generationConfig: {
      temperature: 0.2, // Low temperature for factual, high-precision safety guidelines
      maxOutputTokens: 1000
    }
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("Gemini API Error:", response.status, errorBody);
    throw new Error(`Gemini API Error ${response.status}: Please check your API key.`);
  }

  const data = await response.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText) {
    throw new Error("Invalid response format received from Gemini API.");
  }

  // Smart action extractors based on LLM response text
  const actions = [];
  const lowerResp = rawText.toLowerCase();

  if (lowerResp.includes("sos") || lowerResp.includes("rescue") || lowerResp.includes("emergency 112") || lowerResp.includes("911")) {
    actions.push({ label: "🚨 Broadcast SOS Rescue Now", action: "sos" });
  }
  if (lowerResp.includes("shelter") || lowerResp.includes("refuge") || lowerResp.includes("evacuation zone")) {
    actions.push({ label: "🗺️ Navigate to Shelter Map", tab: "map" });
  }
  if (lowerResp.includes("hospital") || lowerResp.includes("medical") || lowerResp.includes("bed") || lowerResp.includes("doctor")) {
    actions.push({ label: "🏥 Find Free Hospital Beds", tab: "medical" });
  }

  return {
    text: rawText,
    actions
  };
}
