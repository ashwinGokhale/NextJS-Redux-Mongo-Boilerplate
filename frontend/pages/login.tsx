import React, { Component, FormEvent, ChangeEvent } from 'react';
import { connect } from 'react-redux';
import Router from 'next/router';
import { ILoginUser, ILoginResponse, IContext } from '../@types';
import { signIn, sendErrorMessage, sendSuccessMessage, clearFlashMessages } from '../redux/actions';
import { err } from '../utils';

type Props = {
	signin: (body: ILoginUser) => Promise<ILoginResponse>;
	flashError: (msg: string, ctx?: IContext) => void;
	flashSuccess: (msg: string, ctx?: IContext) => void;
	clear: (ctx?: IContext) => void;
};

@((connect as any)(null, {
	signin: signIn,
	flashError: sendErrorMessage,
	flashSuccess: sendSuccessMessage,
	clear: clearFlashMessages
}))
export default class LoginPage extends Component<Props> {
	state = {
		email: '',
		password: ''
	};

	onChange = (e: ChangeEvent<HTMLInputElement>) =>
		this.setState({ [e.target.name]: e.target.value });

	onSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		try {
			this.props.clear();
			const { user } = await this.props.signin(this.state);
			Router.push('/');
			this.props.flashSuccess(`Welcome ${user.name}!`);
		} catch (error) {
			this.props.flashError(err(error));
		}
	};

	render() {
		const { email, password } = this.state;
		return (
			<div>
				Login Page
				<br />
				<form onSubmit={this.onSubmit}>
					<label>
						Email:
						<input type="email" name="email" value={email} onChange={this.onChange} />
					</label>
					<br />
					<label>
						Password:
						<input
							type="password"
							name="password"
							value={password}
							onChange={this.onChange}
						/>
					</label>
					<br />
					<input type="submit" value="Submit" />
				</form>
			</div>
		);
	}
}
