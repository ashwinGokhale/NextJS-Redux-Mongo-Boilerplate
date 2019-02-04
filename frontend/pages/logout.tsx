import { Component } from 'react';
import { connect } from 'react-redux';
import Router from 'next/router';
import { sendFlashMessage, signOut } from '../redux/actions';

type Props = { logout: () => Promise<void>; flash: (msg: any, type?: string) => void };

class Logout extends Component<Props> {
	componentDidMount() {
		this.props.logout();
		Router.push('/');
		this.props.flash('Successfully logged out');
	}

	render() {
		return null;
	}
}

const mapStateToProps = state => ({
	token: !!state.sessionState.token
});

export default connect(
	mapStateToProps,
	{ logout: signOut, flash: sendFlashMessage }
)(Logout);
