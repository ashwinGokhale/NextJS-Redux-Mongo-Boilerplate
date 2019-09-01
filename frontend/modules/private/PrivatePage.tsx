import React from 'react';
import { connect } from 'react-redux';
import { redirectIfNotAuthenticated } from '../../utils/session';
import { IContext } from '../../@types';
import { sendErrorMessage, sendSuccessMessage, clearFlashMessages } from '../../redux/actions';

interface Props {
	flashError: (msg: string, ctx?: IContext) => void;
	flashSuccess: (msg: string, ctx?: IContext) => void;
	clear: (ctx?: IContext) => void;
}

const Private = (props: Props) => {
	return (
		<div>
			Private Page
			<br />
		</div>
	);
};

Private.getInitialProps = (ctx: IContext) => {
	redirectIfNotAuthenticated('/', ctx, { msg: 'You must login to see this page' });
	return {};
};

export const PrivatePage = connect(
	null,
	{
		flashError: sendErrorMessage,
		flashSuccess: sendSuccessMessage,
		clear: clearFlashMessages
	}
)(Private);
