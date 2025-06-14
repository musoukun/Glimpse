import { User, Crown, AlertCircle, RefreshCw } from "lucide-react";

interface UsageDisplayProps {
	compact?: boolean;
}

export function UsageDisplay({ compact = false }: UsageDisplayProps) {
	// モックデータ（後でuseCloudFunctionsフックに置き換え予定）
	const isAuthenticated = true;
	const loading = false;
	const error = null;
	const usageData = {
		subscription_status: "free",
		current_month_usage: 15,
		monthly_quota: 50,
		remaining_quota: 35,
	};

	const canUseAPI = () => usageData.remaining_quota > 0;
	const getUsageLimitMessage = () => {
		if (usageData.subscription_status === "active") {
			return "Premium プランをご利用中です";
		}
		if (usageData.remaining_quota <= 0) {
			return "今月の利用制限に達しました";
		}
		return `今月あと ${usageData.remaining_quota} 回利用できます`;
	};

	const fetchUsageData = () => {
		console.log("Usage data refresh requested");
	};

	if (!isAuthenticated) {
		return (
			<div className="usage-display">
				<div className="usage-status not-authenticated">
					<User size={16} />
					<span>ログインが必要です</span>
				</div>
			</div>
		);
	}

	if (loading && !usageData) {
		return (
			<div className="usage-display">
				<div className="usage-status loading">
					<RefreshCw size={16} className="animate-spin" />
					<span>読み込み中...</span>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="usage-display">
				<div className="usage-status error">
					<AlertCircle size={16} />
					<span>エラー: {error}</span>
					<button onClick={fetchUsageData} className="retry-button">
						再試行
					</button>
				</div>
			</div>
		);
	}

	if (!usageData) {
		return null;
	}

	const isPremium = usageData.subscription_status === "active";
	const usagePercentage = isPremium
		? 0
		: Math.min(
				(usageData.current_month_usage / usageData.monthly_quota) * 100,
				100
			);

	if (compact) {
		return (
			<div className="usage-display compact">
				<div
					className={`usage-status ${!canUseAPI() ? "warning" : ""}`}
				>
					{isPremium ? (
						<>
							<Crown size={14} />
							<span>Premium</span>
						</>
					) : (
						<span>
							{usageData.remaining_quota}/
							{usageData.monthly_quota}
						</span>
					)}
				</div>
			</div>
		);
	}

	return (
		<div className="usage-display">
			<div className="usage-header">
				<div className="usage-title">
					{isPremium ? (
						<>
							<Crown size={16} />
							<span>Premium プラン</span>
						</>
					) : (
						<>
							<User size={16} />
							<span>無料プラン</span>
						</>
					)}
				</div>
				<button
					onClick={fetchUsageData}
					className="refresh-button"
					disabled={loading}
				>
					<RefreshCw
						size={14}
						className={loading ? "animate-spin" : ""}
					/>
				</button>
			</div>

			{!isPremium && (
				<div className="usage-progress">
					<div className="progress-bar">
						<div
							className="progress-fill"
							style={{ width: `${usagePercentage}%` }}
						/>
					</div>
					<div className="usage-text">
						{usageData.current_month_usage} /{" "}
						{usageData.monthly_quota} 回使用
					</div>
				</div>
			)}

			<div className={`usage-message ${!canUseAPI() ? "warning" : ""}`}>
				{getUsageLimitMessage()}
			</div>

			{!isPremium && usageData.remaining_quota <= 5 && (
				<div className="upgrade-prompt">
					<AlertCircle size={14} />
					<span>残り使用回数が少なくなっています</span>
					<button className="upgrade-button">
						Premium にアップグレード
					</button>
				</div>
			)}
		</div>
	);
}
