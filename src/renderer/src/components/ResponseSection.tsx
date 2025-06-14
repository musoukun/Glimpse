import React from "react";

interface ResponseSectionProps {
	response: string;
	loading: boolean;
	error: string;
}

export const ResponseSection: React.FC<ResponseSectionProps> = ({
	response,
	loading,
	error,
}) => {
	return (
		<div className="response-section">
			<div className="response-wrapper">
				<div className="response-content-area">
					{error && (
						<div className="error">
							<strong>Error:</strong> {error}
						</div>
					)}

					{loading && (
						<div className="loading">
							<div className="spinner"></div>
							<span>Thinking...</span>
						</div>
					)}

					{response && !loading && (
						<div className="response-content">{response}</div>
					)}

					{!response && !loading && !error && (
						<div className="placeholder">
							質問を入力してください
						</div>
					)}
				</div>
			</div>
		</div>
	);
};
