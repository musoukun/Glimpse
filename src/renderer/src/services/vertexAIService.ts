import { 
  GoogleGenerativeAI, 
  HarmCategory, 
  HarmBlockThreshold,
  DynamicRetrievalMode 
} from '@google/generative-ai';

// Vertex AI APIキー（本来は環境変数から取得）
// 注意: デスクトップアプリでは環境変数による隠蔽は意味がないため、
// 実際のプロダクションではサーバーサイドでAPIを呼び出すことを推奨
const API_KEY = process.env.VITE_GOOGLE_AI_API_KEY || 'YOUR_VERTEX_AI_API_KEY';

export const AVAILABLE_GENERATIVE_MODELS = [
  "gemini-2.0-flash-lite",
  "gemini-1.5-pro",
  "gemini-1.5-flash"
];

// Google Generative AI インスタンス
let genAI: GoogleGenerativeAI;

try {
  genAI = new GoogleGenerativeAI(API_KEY);
  console.log("Vertex AI Initialized.");
} catch (error) {
  console.error("Error initializing Vertex AI:", error);
  throw new Error("Vertex AI initialization failed.");
}

export const defaultGenerativeParams = {
  generationConfig: {
    temperature: 0.9,
    topK: 1,
    topP: 1,
    maxOutputTokens: 2048,
  },
  safetySettings: [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
  ],
  // Grounding機能を有効化
  tools: [
    {
      googleSearchRetrieval: {
        dynamicRetrievalConfig: {
          mode: DynamicRetrievalMode.MODE_DYNAMIC,
          dynamicThreshold: 0.7,
        },
      },
    },
  ],
};

// Generative Model を取得する関数
export const createGenerativeModel = (modelName: string, systemInstruction?: string) => {
  const model = genAI.getGenerativeModel({
    model: modelName,
    ...defaultGenerativeParams,
    systemInstruction: systemInstruction,
  });
  
  return model;
};

export { genAI }; 