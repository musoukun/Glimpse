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

  private systemPrompt: string = '';
  constructor() {
    this.updateSystemPrompt();
    
    // 設定変更イベントを監視
    window.addEventListener('settings-changed', () => {
      this.updateSystemPrompt();
    });
  }

  private updateSystemPrompt(answerMode: boolean = false) {
    const settings = this.getSettings();
    const maxChars = settings.response_settings?.max_characters || 200;
    const userPrompt = settings.response_settings?.user_prompt || '';
    const language = settings.response_settings?.response_language || '日本語';

    if (answerMode) {
      this.systemPrompt = `あなたはなんでも、質問に対して解答を行うAIアシスタントです。
      以下のルールに従って回答してください：
      1. 数式や問題が含まれている場合：解答手順を段階的に示し、解答を表示してください。
          - 数式を見て、計算の解答を行うべきか、証明の解答を行うべきかを判断してください。
          - この処理に流れたときは、Transrationは行わないでください。${language}で回答してください。
      2. 文章が含まれている場合：${language}に翻訳してください
      3. ${language}の文章が含まれている場合：英語に翻訳してください
      4. 画像に文字が含まれている場合:OCRとして文字を認識し、上記のルールを適用してください
      5. 必ず${language}で回答してください（翻訳結果を除く）
      6. Markdown記法は使用せず、改行コードを含む、プレーンテキストで回答してください（ただし追加の指示で、Markdown記法を指示された場合は従ってください）
      7. 解答の後に、解説を記載してください。解答は単純かつ結論のみを記載し、解説は解答の理由を要約して記載してください。
      # 悪い回答例
      ### 以下は意味をあまり持たない言葉のため不要です
      - 画像内の数式をOCRで読み取り～
      - 解説:画像内のテキストをOCRで読み取り、それを日本語に翻訳しました。
      ${userPrompt ? `追加の指示：${userPrompt}` : ''}`;
    } else {
      this.systemPrompt = `あなたは回答を単純化して要約するAIアシスタントです。
      画像に関する質問に対しては、画像の内容を詳しく解説してください。
      以下のルールに従って回答してください：
      1. 画像のみが提供された場合：画像の中に出てくるものが、何かを出来るだけ単純化し、要約して、解説してください
      2. 画像と質問が提供された場合：質問に対して画像を参考に回答してください
      3. 回答は${maxChars}文字以内で要約してください
      4. 必ず${language}で回答してください
      5. Google検索の結果も参考にして、最新の情報を含めて回答してください
      6. Markdown記法は使用せず、改行コードを含む、プレーンテキストで回答してください
      # 注意事項
      - 質問の意図が不明な時
      例:a という文字だけが質問に含まれていたとしても a という文字について調べて回答してください。
      ${userPrompt ? `追加の指示：${userPrompt}` : ''}`;
    }
  }

  private getSettings() {
    try {
      const settings = localStorage.getItem('glimpse_settings');
      return settings ? JSON.parse(settings) : {};
    } catch (error) {
      console.error('Failed to load settings:', error);
      return {};
    }
  }

  async generateResponse(
    message: string,
    images: string[] = [],
    answerMode: boolean = false
  ): Promise<AIResponse> {
    try {
      const settings = this.getSettings();
      const groundingMaxTokens = settings.response_settings?.grounding_max_tokens || 512;
      
      // Answer Modeに応じてシステムプロンプトを更新
      this.updateSystemPrompt(answerMode);
      
      // システムプロンプトと設定値を渡してsupabaseEdgeServiceを呼び出し
      // グラウンディングは常に有効にする
      return await supabaseEdgeService.generateResponse(
        message, 
        images, 
        this.systemPrompt, 
        true, 
        groundingMaxTokens
      );
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