import { Provider } from 'react-redux';
import App, { Container } from 'next/app';
import Router from 'next/router';
import withRedux from 'next-redux-wrapper';
// import { PersistGate } from 'redux-persist/integration/react';
// import { persistStore } from 'redux-persist';
import { Store } from 'redux';
import makeStore from '../redux/store';
import {
	clearFlashMessages,
	sendFlashMessage,
	refreshToken,
	setUser,
	setToken
} from '../redux/actions';
import Layout from '../components/Layout';
import { initGA, logPageView } from '../utils/analytics';
import * as flash from '../utils/flash';
import { getToken } from '../utils/session';

type Props = { store: Store };

class MyApp extends App<Props> {
	static async getInitialProps({ Component, ctx }) {
		// TODO: Find better way to refresh token w/o network request
		if (ctx.req) {
			// const { user } = ctx.req;
			// const token = getToken(ctx);
			// ctx.store.dispatch(setUser(user));
			// ctx.store.dispatch(setToken(token));
			// try {
			// await refreshToken(ctx)(ctx.store.dispatch);
			await ctx.store.dispatch(refreshToken(ctx));
			if (ctx.req.headers.cookie) {
				const messages = flash.get(ctx);
				if (messages.red) sendFlashMessage(messages.red, ctx)(ctx.store.dispatch);
				if (messages.green)
					sendFlashMessage(messages.green, ctx, 'green')(ctx.store.dispatch);
			}
		}
		return {
			pageProps: Component.getInitialProps ? await Component.getInitialProps(ctx) : {}
		};
	}

	componentWillMount() {
		Router.onRouteChangeStart = () => {
			const state = this.props.store.getState().flashState;
			if (state.green || state.red) clearFlashMessages()(this.props.store.dispatch);
		};
	}

	componentDidMount() {
		const state = this.props.store.getState().sessionState;
		const uid = state.user && state.user._id;
		initGA(uid);
		logPageView();
		Router.router.events.on('routeChangeComplete', logPageView);
		window.onbeforeunload = () => {
			const { flashState } = this.props.store.getState();
			if (flashState.green || flashState.red) clearFlashMessages()(this.props.store.dispatch);
		};
	}

	render() {
		const { Component, pageProps, store } = this.props as any;
		// const persistor = persistStore(store);

		return (
			<Container>
				<Provider store={store}>
					{/* <PersistGate persistor={persistor}> */}
					<Layout>
						<Component {...pageProps} />
					</Layout>
					{/* </PersistGate> */}
				</Provider>
			</Container>
		);
	}
}

export default withRedux(makeStore)(MyApp);
