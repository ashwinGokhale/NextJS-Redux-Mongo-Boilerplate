import React, { Component } from 'react';
import { connect } from 'react-redux';
import { redirectIfNotAuthenticated } from '../utils/session';
import { IContext } from '../@types';
import { sendErrorMessage, sendSuccessMessage, clearFlashMessages } from '../redux/actions';

type Props = {
	flashError: (msg: string, ctx?: IContext) => void;
	flashSuccess: (msg: string, ctx?: IContext) => void;
	clear: (ctx?: IContext) => void;
};

@((connect as any)(null, {
	flashError: sendErrorMessage,
	flashSuccess: sendSuccessMessage,
	clear: clearFlashMessages
}))
export default class PrivatePage extends Component<Props> {
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
