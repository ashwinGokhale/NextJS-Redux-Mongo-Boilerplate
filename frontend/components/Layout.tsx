import React from 'react';
import { connect } from 'react-redux';
import Header from './Header';
import FlashMessage from './FlashMessage';

type StateToProps = {
	token: string;
	green: string;
	red: string;
};

const Layout = ({ token, green, red, children }) => {
	return (
		<div>
			<Header token={token} />
			<FlashMessage green={green} red={red} />
			{children}
		</div>
	);
};

const mapStateToProps = state => ({
	token: state.sessionState.token,
	...state.flashState
});

export default connect<StateToProps>(mapStateToProps)(Layout);
