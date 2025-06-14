import { FirebaseApp } from "firebase/app";
import {
  HarmCategory,
  HarmBlockThreshold,
  Schema,
  FunctionDeclaration,
  Part,
  Content,
  CountTokensResponse,
  GenerativeModel,
  ModelParams,
  ImagenModelParams,
  FunctionCall,
  getGenerativeModel,
  getImagenModel,
  AI,
  getAI,
  GoogleAIBackend,
} from "firebase/ai";

import firebaseApp from "../config/firebase";

export const AVAILABLE_GENERATIVE_MODELS = [
  "gemini-2.0-flash-lite",
];
export const AVAILABLE_IMAGEN_MODELS = ["imagen-3.0-generate-002"];

let app: FirebaseApp;
let aiInstance: AI;

try {
  app = firebaseApp;
  
  // AI インスタンスを初期化
  const backend = new GoogleAIBackend();
  aiInstance = getAI(app, { backend });
  
  console.log("Firebase AI App Initialized.");
} catch (error) {
  console.error("Error initializing Firebase AI App:", error);
  throw new Error("Firebase AI initialization failed.");
}

export const defaultFunctionCallingTool = {
  functionDeclarations: [
    {
      name: "getCurrentWeather",
      description: "Get the current weather in a given location",
      parameters: Schema.object({
        properties: {
          location: Schema.string({
            description: "The city and state, e.g. San Francisco, CA",
          }),
          unit: Schema.enumString({
            enum: ["celsius", "fahrenheit"],
            description: "Temperature unit",
          }),
        },
        required: ["location"],
      }),
    } as FunctionDeclaration,
  ],
};

export const defaultGenerativeParams: Omit<ModelParams, "model"> = {
  // Model name itself is selected in the UI
  generationConfig: {
    temperature: 0.9,
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
  ]
  // toolConfig, systemInstruction default to undefined
};

export const defaultImagenParams: Omit<ImagenModelParams, "model"> = {
  // Model name selected in UI
  generationConfig: {
    numberOfImages: 1,
  },
  // Default all safety settings to undefined
};

/**
 * Mock function call
 */
export const handleFunctionExecution = async (
  functionCall: FunctionCall,
): Promise<object> => {
  console.log(
    `[Service] Executing function: ${functionCall.name}, Args:`,
    functionCall.args,
  );
  if (functionCall.name === "getCurrentWeather") {
    await new Promise((resolve) => setTimeout(resolve, 800)); // Simulate delay
    const location: string =
      "location" in functionCall.args &&
        typeof functionCall.args.location === "string"
        ? functionCall.args.location
        : "Default City, ST";
    const unit: string =
      "unit" in functionCall.args && typeof functionCall.args.unit === "string"
        ? functionCall.args.unit
        : "celsius";
    const temp =
      unit === "celsius"
        ? Math.floor(Math.random() * 30 + 5)
        : Math.floor(Math.random() * 50 + 40);
    const conditions = ["Sunny", "Partly Cloudy", "Cloudy", "Rainy"];
    const condition = conditions[Math.floor(Math.random() * conditions.length)];
    return {
      weather: { location, temperature: temp, unit, condition },
    };
  }
  console.warn(`[Service] Unknown function called: ${functionCall.name}`);
  return { error: `Function ${functionCall.name} not implemented.` };
};

export const countTokensInPrompt = async (
  modelInstance: GenerativeModel,
  parts: Part[],
  history: Content[] = [],
  params?: {
    systemInstruction?: ModelParams["systemInstruction"];
    tools?: ModelParams["tools"];
  },
): Promise<CountTokensResponse> => {
  const contents: Content[] = [...history];
  if (parts.length > 0) {
    contents.push({ role: "user", parts });
  }

  const request = {
    contents,
    systemInstruction: params?.systemInstruction,
    tools: params?.tools,
  };

  console.log("[Service] Counting tokens for request:", request);
  try {
    const result = await modelInstance.countTokens(request);
    console.log("[Service] Token count result:", result);
    return result;
  } catch (error) {
    console.error("[Service] Error counting tokens:", error);
    throw error;
  }
};

// AI インスタンスを取得する関数
export const getAIInstance = (): AI => {
  if (!aiInstance) {
    throw new Error("AI instance not initialized");
  }
  return aiInstance;
};

// Generative Model を取得する関数
export const createGenerativeModel = (params: ModelParams): GenerativeModel => {
  return getGenerativeModel(aiInstance, params);
};

// Imagen Model を取得する関数
export const createImagenModel = (params: ImagenModelParams) => {
  return getImagenModel(aiInstance, params);
};

export { app, aiInstance }; 