import React from "react";

interface SetupMessageProps {
	onSettingsClick: () => void;
}

export const SetupMessage: React.FC<SetupMessageProps> = ({
	onSettingsClick,
}) => {
	return (
		<div className="setup-message">
			<h3>Welcome to Glimpse</h3>
			<p>Please configure your API keys to get started.</p>
			<p>Click the settings icon (⚙️) to add your API keys for:</p>
			<ul>
				<li>Anthropic Claude</li>
				<li>OpenAI GPT</li>
				<li>Google Gemini</li>
			</ul>
			<button className="setup-button" onClick={onSettingsClick}>
				Open Settings
			</button>
		</div>
	);
};
