import React, { Component, FormEvent, ChangeEvent } from 'react';
import { connect } from 'react-redux';
import Router from 'next/router';
import { ICreateUser, ILoginResponse, IContext } from '../@types';
import { signUp, sendErrorMessage, sendSuccessMessage, clearFlashMessages } from '../redux/actions';
import { err } from '../utils';

type Props = {
	signup: (body: ICreateUser) => Promise<ILoginResponse>;
	flashError: (msg: string, ctx?: IContext) => void;
	flashSuccess: (msg: string, ctx?: IContext) => void;
	clear: (ctx?: IContext) => void;
};

@((connect as any)(null, {
	signup: signUp,
	flashError: sendErrorMessage,
	flashSuccess: sendSuccessMessage,
	clear: clearFlashMessages
}))
export default class SignupPage extends Component<Props> {
	state = {
		name: '',
		email: '',
		password: '',
		passwordConfirm: ''
	};

	onChange = (e: ChangeEvent<HTMLInputElement>) =>
		this.setState({ [e.target.name]: e.target.value });

	onSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		try {
			this.props.clear();
			const { user } = await this.props.signup(this.state);
			Router.push('/');
			this.props.flashSuccess(`Welcome ${user.name}!`);
		} catch (error) {
			this.props.flashError(err(error));
		}
	};

	render() {
		const { name, email, password, passwordConfirm } = this.state;
		return (
			<div>
				Signup Page
				<br />
				<form onSubmit={this.onSubmit}>
					<label>
						Name:
						<input name="name" value={name} onChange={this.onChange} />
					</label>
					<br />
					<label>
						Email:
						<input name="email" value={email} onChange={this.onChange} />
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
					<label>
						Password Comfirm:
						<input
							type="password"
							name="passwordConfirm"
							value={passwordConfirm}
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
