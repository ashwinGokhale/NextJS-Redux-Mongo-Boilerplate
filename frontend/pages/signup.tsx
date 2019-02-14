import React, { Component, FormEvent, ChangeEvent } from 'react';
import { connect } from 'react-redux';
import Router from 'next/router';
import { signUp, sendFlashMessage } from '../redux/actions';
import { ILoginResponse, ICreateUser } from '../@types';
import { ISessionState } from '../redux/reducers/session';

type Props = {
	signup: (body: ICreateUser) => Promise<ILoginResponse>;
	flash: (msg: any, type?: string) => void;
} & ISessionState;

class SignupPage extends Component<Props> {
	static getInitialProps = ctx => {
		return {};
	};

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
		const { name, email, password, passwordConfirm } = this.state;
		if (!name || !email || !password || !passwordConfirm) return;
		try {
			const { user } = await this.props.signup(this.state);
			Router.push('/');
			this.props.flash(`Welcome ${user.name}!`);
		} catch (error) {
			console.error('Error creating user', error);
		}
	};

	render() {
		console.log('Rendering signup page');
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

const mapStateToProps = state => ({
	...state.sessionState
});

const ConnectedSignupPage = connect(
	mapStateToProps,
	{ signup: signUp, flash: sendFlashMessage }
)(SignupPage);

export default ConnectedSignupPage;
