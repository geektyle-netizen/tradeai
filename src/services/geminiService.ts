import { GoogleGenAI, Type } from "@google/genai";

// Initialize the Google Gen AI SDK
// To use your own free Gemini API key, replace the string below.
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "YOUR_GEMINI_API_KEY" });

export interface AnalysisResult {
  direction: 'BUY' | 'SELL' | 'NEUTRAL';
  entry: string;
  stopLoss: string;
  takeProfit: string;
  pairName: string;
  timeFrame: string;
  otherDetails: string;
  reasoning: string;
}

export async function analyzeTradingChart(
  files: File[],
  strategy: string
): Promise<AnalysisResult> {
  const parts: any[] = [];

  // Convert files to base64 inline data
  for (const file of files) {
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    parts.push({
      inlineData: {
        data: base64Data,
        mimeType: file.type,
      },
    });
  }

  // System instruction to set the role
  const systemInstruction = 
    "You are an expert crypto and stock trading analyst. Your task is to analyze the provided trading chart images " +
    "based strictly on the chosen trading strategy and provide ONE straight, highly accurate trading signal (either purely BUY or purely SELL). " +
    "NEVER provide both BUY and SELL scenarios at the same time. You must pick the single most probable direction or choose NEUTRAL if unclear. " +
    "Extract the exact Entry, Stop Loss (SL), and Take Profit (TP) prices directly from the screenshot or calculate them based strictly on the setup rule. " +
    "Return precise numbers or narrow zones for Entry, SL, and TP, not long explanations in those fields (put explanations in 'reasoning'). " +
    "Extract the pair name, timeframe, and any other relevant chart details from the screenshot itself. " +
    "Output MUST be in the requested JSON scheme.";

  const prompt = `Analyze these trading charts using the following strategy: ${strategy}. Provide ONE clear, straight signal (BUY or SELL). Do not give both. If no clear signal, choose NEUTRAL.`;
  parts.push({ text: prompt });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro", // Best for complex reasoning + multimodal
      contents: { parts },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            direction: {
              type: Type.STRING,
              enum: ["BUY", "SELL", "NEUTRAL"],
              description: "The ONE clear trading direction. NEVER give both.",
            },
            entry: {
              type: Type.STRING,
              description: "The exact entry price (e.g. '1.0920'). Keep it short.",
            },
            stopLoss: {
              type: Type.STRING,
              description: "The exact stop loss price (e.g. '1.0890'). Keep it short.",
            },
            takeProfit: {
              type: Type.STRING,
              description: "The exact take profit price (e.g. '1.0980'). Keep it short.",
            },
            pairName: {
              type: Type.STRING,
              description: "The trading pair or asset name extracted from the chart (e.g. BTC/USDT, EUR/USD). If not found, write 'Unknown'.",
            },
            timeFrame: {
              type: Type.STRING,
              description: "The time frame extracted from the chart (e.g. 1H, 15M, 1D). If not found, write 'Unknown'.",
            },
            otherDetails: {
              type: Type.STRING,
              description: "Any other notable details extracted from the chart (e.g. exchange name, indicators visible).",
            },
            reasoning: {
              type: Type.STRING,
              description: "A detailed explanation of why this specific direction, entry, SL, and TP were chosen based on the strategy and chart context.",
            },
          },
          required: ["direction", "entry", "stopLoss", "takeProfit", "pairName", "timeFrame", "otherDetails", "reasoning"],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No text response from Gemini");
    }

    const result = JSON.parse(text) as AnalysisResult;
    return result;
  } catch (error) {
    console.error("Error analyzing chart:", error);
    throw error;
  }
}
