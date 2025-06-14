-- 使用量管理テーブル
CREATE TABLE user_usage (
	id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
	user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
	month VARCHAR(7) NOT NULL,
	-- YYYY-MM format
	monthly_tokens INTEGER DEFAULT 0,
	monthly_requests INTEGER DEFAULT 0,
	created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
	-- 月ごとのユニーク制約
	UNIQUE(user_id, month)
);
-- インデックス作成
CREATE INDEX idx_user_usage_user_id ON user_usage(user_id);
CREATE INDEX idx_user_usage_month ON user_usage(month);
CREATE INDEX idx_user_usage_user_month ON user_usage(user_id, month);
-- RLS (Row Level Security) を有効化
ALTER TABLE user_usage ENABLE ROW LEVEL SECURITY;
-- ユーザーは自分のレコードのみアクセス可能
CREATE POLICY "Users can view own usage" ON user_usage FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own usage" ON user_usage FOR
INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own usage" ON user_usage FOR
UPDATE USING (auth.uid() = user_id);
-- サブスクリプション管理テーブル
CREATE TABLE user_subscriptions (
	id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
	user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
	stripe_customer_id VARCHAR(255),
	stripe_subscription_id VARCHAR(255),
	plan_type VARCHAR(50) DEFAULT 'free',
	-- free, paid
	status VARCHAR(50) DEFAULT 'active',
	-- active, canceled, past_due
	current_period_start TIMESTAMP WITH TIME ZONE,
	current_period_end TIMESTAMP WITH TIME ZONE,
	monthly_limit INTEGER DEFAULT 50,
	created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
	UNIQUE(user_id)
);
-- インデックス作成
CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_stripe_customer ON user_subscriptions(stripe_customer_id);
CREATE INDEX idx_user_subscriptions_stripe_subscription ON user_subscriptions(stripe_subscription_id);
-- RLS を有効化
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
-- ユーザーは自分のサブスクリプション情報のみアクセス可能
CREATE POLICY "Users can view own subscription" ON user_subscriptions FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own subscription" ON user_subscriptions FOR
INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own subscription" ON user_subscriptions FOR
UPDATE USING (auth.uid() = user_id);
-- 呼び出し履歴テーブル
CREATE TABLE call_history (
	id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
	user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
	prompt TEXT NOT NULL,
	response TEXT,
	tokens_used INTEGER DEFAULT 0,
	success BOOLEAN DEFAULT true,
	error_message TEXT,
	created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- インデックス作成
CREATE INDEX idx_call_history_user_id ON call_history(user_id);
CREATE INDEX idx_call_history_created_at ON call_history(created_at);
-- RLS を有効化
ALTER TABLE call_history ENABLE ROW LEVEL SECURITY;
-- ユーザーは自分の履歴のみアクセス可能
CREATE POLICY "Users can view own history" ON call_history FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own history" ON call_history FOR
INSERT WITH CHECK (auth.uid() = user_id);
-- 更新日時を自動更新する関数
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW();
RETURN NEW;
END;
$$ language 'plpgsql';
-- トリガー作成
CREATE TRIGGER update_user_usage_updated_at BEFORE
UPDATE ON user_usage FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_subscriptions_updated_at BEFORE
UPDATE ON user_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();