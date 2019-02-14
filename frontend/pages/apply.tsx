import React, { Component } from 'react';
import { connect } from 'react-redux';
import { signIn, sendFlashMessage } from '../redux/actions';
import { ISessionState } from '../redux/reducers/session';
import { ILoginUser, ILoginResponse, IContext } from '../@types';
import { redirectIfNotAuthenticated } from '../utils/session';

type Props = {
	signin: (body: ILoginUser) => Promise<ILoginResponse>;
	flash: (msg: any, type?: string) => void;
} & ISessionState;

class PrivatePage extends Component<Props> {
	static getInitialProps = (ctx: IContext) => {
		redirectIfNotAuthenticated('/', ctx, { msg: 'You must login to see this page' });
		return {};
	};

	render() {
		return (
			<div>
				Private Page
				<br />
			</div>
		);
	}
}

const mapStateToProps = state => ({
	...state.sessionState
});

const ConnectedApply = connect(
	mapStateToProps,
	{ signin: signIn, flash: sendFlashMessage }
)(PrivatePage);

export default ConnectedApply;
