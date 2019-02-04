import React, { Component, FormEvent, ChangeEvent } from 'react';
import { connect } from 'react-redux';
import Router from 'next/router';
import { signIn, sendFlashMessage } from '../redux/actions';
import { ISessionState } from '../redux/reducers/session';
import { ILoginUser, ILoginResponse } from '../@types';
import { redirectIfAuthenticated } from '../utils/session';

type Props = {
	signin: (body: ILoginUser) => Promise<ILoginResponse>;
	flash: (msg: any, type?: string) => void;
} & ISessionState;

class LoginPage extends Component<Props> {
	static getInitialProps = ctx => {
		redirectIfAuthenticated('/', ctx);
		return {};
	};

	state = {
		email: '',
		password: ''
	};

	onChange = (e: ChangeEvent<HTMLInputElement>) =>
		this.setState({ [e.target.name]: e.target.value });

	onSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const { email, password } = this.state;
		if (!email || !password) return;
		try {
			console.log('Login props:', this.props);
			const user = await this.props.signin(this.state);
			console.log('Logged in as:', user);
			Router.push('/');
		} catch (error) {
			console.error('Error creating user', error);
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

const mapStateToProps = state => ({
	...state.sessionState
});

export default connect(
	mapStateToProps,
	{ signin: signIn, flash: sendFlashMessage }
)(LoginPage);
