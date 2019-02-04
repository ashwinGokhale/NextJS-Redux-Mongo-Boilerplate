import React from 'react';
import { connect } from 'react-redux';
import Header from './Header';

const Layout = ({ token, children }) => {
	return (
		<div>
			<Header token={token} />
			{children}
		</div>
	);
};

const mapStateToProps = state => ({
	token: state.sessionState.token
});

export default connect(mapStateToProps)(Layout);
