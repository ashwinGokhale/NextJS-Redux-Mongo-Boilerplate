import { Component } from 'react';
import { connect } from 'react-redux';
import { signOut } from '../redux/actions';
import Redirect from '../components/Redirect';

type Props = { logout: () => Promise<void> };

class Logout extends Component<Props> {
	componentWillMount = () => {
		this.props.logout();
	};

	render() {
		return <Redirect to="/" green="Successfully logged out" />;
	}
}

const mapStateToProps = state => ({
	token: !!state.sessionState.token
});

export default connect(
	mapStateToProps,
	{ logout: signOut }
)(Logout);
