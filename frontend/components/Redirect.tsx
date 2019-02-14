import { Component } from 'react';
import { connect } from 'react-redux';
import { sendFlashMessage } from '../redux/actions';
import { redirect } from '../utils/session';
import { IContext, flashColor } from '../@types';

type DispatchToProps = {
	flash: (msg: string, ctx?: IContext, type?: flashColor) => void;
};

type Props = {
	to: string;
	green?: string;
	red?: string;
} & DispatchToProps;

class Redirect extends Component<Props> {
	componentDidMount() {
		const { to, flash, green, red } = this.props;
		redirect(to);
		if (red) flash(red);
		else if (green) flash(green, null, 'green');
	}

	render() {
		return null;
	}
}

export default connect<{}, DispatchToProps>(
	() => ({}),
	{ flash: sendFlashMessage }
)(Redirect);
