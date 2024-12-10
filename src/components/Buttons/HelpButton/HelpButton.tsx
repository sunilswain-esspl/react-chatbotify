import { useState, MouseEvent } from "react";

import { useSettingsContext } from "../../../context/SettingsContext";
import { useStylesContext } from "../../../context/StylesContext";

import "./HelpButton.css";

/**
 * Displays a helping message when clicked.
 */
const HelpButton = () => {
	// manages visibility of help message
	const [isHelpVisible, setIsHelpVisible] = useState(false);

	// handles settings
	const { settings } = useSettingsContext();

	// handles styles
	const { styles } = useStylesContext();

	// styles for help icon
	const helpIconStyle: React.CSSProperties = {
		backgroundImage: `url(${settings.help?.icon})`,
		fill: "#007bff",
		...styles.helpIconStyle
	};

	// styles for help disabled icon
	const helpIconDisabledStyle: React.CSSProperties = {
		backgroundImage: `url(${settings.help?.iconDisabled})`,
		fill: "#b0bec5",
		...styles.helpIconStyle, // base style
		...styles.helpIconDisabledStyle
	};

	/**
	 * Toggles help message visibility.
	 */
	const toggleHelpMessage = (event: MouseEvent) => {
		event.preventDefault();
		setIsHelpVisible((prev) => !prev);
	};

	/**
	 * Renders button depending on whether an svg component or image URL is provided.
	 */
	const renderButton = () => {
		const IconComponent = settings.help?.icon;
		if (!IconComponent || typeof IconComponent === "string") {
			return (
				<span
					className="rcb-help-icon"
					data-testid="rcb-help-icon"
					style={isHelpVisible ? helpIconStyle : helpIconDisabledStyle}
				/>
			);
		}
		return (
			IconComponent &&
			<span className="rcb-help-icon" data-testid="rcb-help-icon">
				<IconComponent
					style={isHelpVisible ? helpIconStyle : helpIconDisabledStyle}
					data-testid="rcb-help-icon-svg"
				/>
			</span>
		);
	};

	return (
		<div>
			<div
				aria-label={settings.ariaLabel?.helpButton ?? "show help"}
				role="button"
				onMouseDown={toggleHelpMessage}
				style={
					isHelpVisible
						? styles.helpButtonStyle
						: { ...styles.helpButtonStyle, ...styles.helpButtonDisabledStyle }
				}
			>
				{renderButton()}
			</div>
			{/* Help message */}
			{isHelpVisible && (
				<div className="rcb-help-message" data-testid="rcb-help-message">
					{settings.help?.message ?? "Try /help for assistance."}
				</div>
			)}
		</div>
	);
};

export default HelpButton;
