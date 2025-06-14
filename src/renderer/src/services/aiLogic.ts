import { 
  createGenerativeModel,
  AVAILABLE_GENERATIVE_MODELS 
} from './vertexAIService';
import type { Part, Content } from '@google/generative-ai';
import type { Attachment } from '../types';

export interface AIResponse {
  content: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
}

export interface AILogicConfig {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

interface AppSettings {
  ui_settings: {
    window_size: string;
    opacity: number;
  };
  response_settings: {
    max_characters: number;
    response_language: string;
    user_prompt: string;
  };
}

export class AILogic {
  private config: AILogicConfig;
  private currentSettings: AppSettings | null = null;

  constructor(config: AILogicConfig = {}) {
    this.loadSettings();
    this.config = {
      model: config.model || "gemini-2.0-flash-lite",
      temperature: config.temperature || 0.7,
      maxTokens: config.maxTokens || 2000,
      systemPrompt: config.systemPrompt || this.getSystemPrompt(),
      ...config
    };
    this.setupSettingsListener();
  }

  private loadSettings() {
    const savedSettings = localStorage.getItem('glimpse_settings');
    if (savedSettings) {
      try {
        this.currentSettings = JSON.parse(savedSettings);
      } catch (error) {
        console.warn('設定の読み込みに失敗しました:', error);
      }
    }
  }

  private setupSettingsListener() {
    window.addEventListener('settings-changed', (event: Event) => {
      const customEvent = event as CustomEvent<AppSettings>;
      this.currentSettings = customEvent.detail;
      // システムプロンプトを更新
      this.config.systemPrompt = this.getSystemPrompt();
      console.log('設定が更新されました:', this.currentSettings);
    });
  }

  private getSystemPrompt(): string {
    let maxCharacters = 500;
    let responseLanguage = "日本";
    let userPrompt = "";
    
    // currentSettingsを優先的に使用
    if (this.currentSettings) {
      maxCharacters = this.currentSettings.response_settings?.max_characters || 500;
      responseLanguage = this.currentSettings.response_settings?.response_language || "日本";
      userPrompt = this.currentSettings.response_settings?.user_prompt || "";
    } else {
      // フォールバックとしてローカルストレージから読み込み
      const savedSettings = localStorage.getItem('glimpse_settings');
      if (savedSettings) {
        try {
          const settings = JSON.parse(savedSettings);
          maxCharacters = settings.response_settings?.max_characters || 500;
          responseLanguage = settings.response_settings?.response_language || "日本";
          userPrompt = settings.response_settings?.user_prompt || "";
        } catch (error) {
          console.warn('設定の読み込みに失敗しました:', error);
        }
      }
    }
    
    let systemPrompt = `あなたは親切で知識豊富なAIアシスタントです。以下のルールに従って回答してください：

- 画像だけが添付されて、質問が無い場合、画像の中に写っているモノや、言葉について、解説してください。
- 画像や、その他の添付ファイルと、質問がある場合、質問に関して回答してください。
- 回答は常に要約し、全て${maxCharacters}字以内に収まるように回答してください。
- 回答は、${responseLanguage}語で回答してください。
- 簡潔で分かりやすい回答を心がけてください。`;

    // ユーザープロンプトが設定されている場合は末尾に追加
    if (userPrompt.trim()) {
      systemPrompt += `\n\n追加指示:\n${userPrompt.trim()}`;
    }

    return systemPrompt;
  }

  async generateResponse(
    message: string, 
    attachments: Attachment[] = [],
    conversationHistory: Array<{role: 'user' | 'assistant', content: string}> = []
  ): Promise<AIResponse> {
    try {
      // Generative Modelを作成（Vertex AI APIを使用）
      const model = createGenerativeModel(this.config.model!, this.config.systemPrompt);

      // 会話履歴を構築
      const history: Content[] = conversationHistory.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

      // 現在のメッセージ用のパーツを準備
      const parts: Part[] = [{ text: message }];

      // 添付ファイルがある場合は画像を追加
      for (const attachment of attachments) {
        if (attachment.type.startsWith('image/')) {
          // Base64データからMIMEタイプとデータを分離
          const [mimeInfo, base64Data] = attachment.data.split(',');
          const mimeType = mimeInfo.match(/data:([^;]+)/)?.[1] || attachment.type;
          
          parts.push({
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          });
        }
      }

      // チャットセッションを開始
      const chat = model.startChat({
        history: history
      });

      // メッセージを送信
      const result = await chat.sendMessage(parts);
      const response = await result.response;
      
      // レスポンステキストを取得
      const text = response.text();

      // 使用量情報を取得（可能な場合）
      let usage;
      try {
        const usageMetadata = response.usageMetadata;
        if (usageMetadata) {
          usage = {
            inputTokens: usageMetadata.promptTokenCount || 0,
            outputTokens: usageMetadata.candidatesTokenCount || 0,
            totalTokens: usageMetadata.totalTokenCount || 0,
          };
        }
      } catch (error) {
        console.warn('使用量情報の取得に失敗:', error);
      }

      return {
        content: text,
        usage
      };

    } catch (error) {
      console.error('AI応答生成エラー:', error);
      throw new Error(`AI応答の生成に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
    }
  }

  // 設定を更新
  updateConfig(newConfig: Partial<AILogicConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  // 現在の設定を取得
  getConfig(): AILogicConfig {
    return { ...this.config };
  }

  // 利用可能なモデル一覧を取得
  static getAvailableModels(): string[] {
    return [...AVAILABLE_GENERATIVE_MODELS];
  }
}

// デフォルトインスタンス
export const defaultAILogic = new AILogic(); 