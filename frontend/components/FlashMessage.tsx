import React from 'react';

type Props = { green: string; red: string };

const defaultProps: Props = {
	green: '',
	red: ''
};

const FlashMessage = ({ green, red } = defaultProps) => {
	return (
		<React.Fragment>
			{green && (
				<div className="section alert-section" style={{ paddingTop: 0 }}>
					<div className="section-container">
						<div className="alert alert-success" role="alert">
							{green}
						</div>
					</div>
				</div>
			)}
			{red && (
				<div className="section alert-section" style={{ paddingTop: 0 }}>
					<div className="section-container">
						<div className="alert alert-danger" role="alert">
							{red}
						</div>
					</div>
				</div>
			)}
		</React.Fragment>
	);
};

export default FlashMessage;
