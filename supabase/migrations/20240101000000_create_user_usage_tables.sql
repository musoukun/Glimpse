-- user_usage テーブル
CREATE TABLE user_usage (
	id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
	user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
	free_calls_used INTEGER DEFAULT 0,
	subscription_status TEXT DEFAULT 'free' CHECK (subscription_status IN ('free', 'paid')),
	stripe_customer_id TEXT,
	current_period_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
	current_period_end TIMESTAMP WITH TIME ZONE,
	last_call_at TIMESTAMP WITH TIME ZONE,
	created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
	UNIQUE(user_id)
);
-- RLS ポリシー
ALTER TABLE user_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own usage" ON user_usage FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own usage" ON user_usage FOR
UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own usage" ON user_usage FOR
INSERT WITH CHECK (auth.uid() = user_id);
-- call_history テーブル（詳細なログが必要な場合）
CREATE TABLE call_history (
	id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
	user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
	prompt_length INTEGER,
	response_length INTEGER,
	tokens_used INTEGER,
	call_type TEXT DEFAULT 'gemini',
	created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE call_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own history" ON call_history FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own history" ON call_history FOR
INSERT WITH CHECK (auth.uid() = user_id);
-- インデックス作成
CREATE INDEX idx_user_usage_user_id ON user_usage(user_id);
CREATE INDEX idx_call_history_user_id ON call_history(user_id);
CREATE INDEX idx_call_history_created_at ON call_history(created_at);
-- updated_at自動更新のトリガー
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW();
RETURN NEW;
END;
$$ language 'plpgsql';
CREATE TRIGGER update_user_usage_updated_at BEFORE
UPDATE ON user_usage FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();