import { supabaseEdgeService } from './supabaseEdgeService';

interface AIResponse {
  text: string;
  error?: string;
  usage?: {
    tokensUsed: number;
    requestCount: number;
  };
}

class AILogicService {

  constructor() {
    this.updateSystemPrompt();
    
    // 設定変更イベントを監視
    window.addEventListener('settings-changed', () => {
      this.updateSystemPrompt();
    });
  }

  private updateSystemPrompt() {
    const settings = this.getSettings();
    const maxChars = settings.maxChars || 500;
    const userPrompt = settings.userPrompt || '';

    this.systemPrompt = `あなたは画像解析と質問回答のAIアシスタントです。

以下のルールに従って回答してください：
1. 画像のみが提供された場合：画像の内容を詳しく解説してください
2. 画像と質問が提供された場合：質問に対して画像を参考に回答してください
3. 回答は${maxChars}文字以内で要約してください
4. 必ず日本語で回答してください
5. Google検索の結果も参考にして、最新の情報を含めて回答してください

${userPrompt ? `追加の指示：${userPrompt}` : ''}`;
  }

  private getSettings() {
    try {
      const settings = localStorage.getItem('glimpse-settings');
      return settings ? JSON.parse(settings) : {};
    } catch (error) {
      console.error('Failed to load settings:', error);
      return {};
    }
  }

  async generateResponse(
    message: string,
    images: string[] = []
  ): Promise<AIResponse> {
    try {
      return await supabaseEdgeService.generateResponse(message, images);
    } catch (error) {
      console.error('AI Logic error:', error);
      return {
        text: 'エラーが発生しました。しばらく時間をおいて再試行してください。',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getUsage() {
    return await supabaseEdgeService.getUsage();
  }
}

export const aiLogicService = new AILogicService(); 