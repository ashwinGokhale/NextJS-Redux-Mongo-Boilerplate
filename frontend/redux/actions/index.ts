import ReactGA from 'react-ga';
import { ActionCreator, AnyAction, Dispatch } from 'redux';
import { ICreateUser, ILoginUser, ILoginResponse, IContext, flashColor } from '../../@types';
import { api, err } from '../../utils';
import { AUTH_USER_SET, AUTH_TOKEN_SET, FLASH_GREEN_SET, FLASH_RED_SET } from '../constants';
import { setCookie, removeCookie, getToken } from '../../utils/session';
import * as flash from '../../utils/flash';

const makeCreator = (type: string, ...argNames: string[]): ActionCreator<AnyAction> => (
	...args: any[]
) => {
	const action = { type };
	argNames.forEach((_, index) => {
		action[argNames[index]] = args[index];
	});
	return action;
};

// Action Creators
export const setUser = makeCreator(AUTH_USER_SET, 'user');
export const setToken = makeCreator(AUTH_TOKEN_SET, 'token');

const setGreenFlash = makeCreator(FLASH_GREEN_SET, 'green');
const setRedFlash = makeCreator(FLASH_RED_SET, 'red');

// Actions
export const signUp = (body: ICreateUser) => async (
	dispatch: Dispatch
): Promise<ILoginResponse> => {
	try {
		const {
			data: { response }
		} = await api.post('/auth/signup', body);
		dispatch(setToken(response.token));
		dispatch(setUser(response.user));
		setCookie('token', response.token);
		return response;
	} catch (error) {
		throw error.response.data;
	}
};

export const signIn = (body: ILoginUser) => async (dispatch: Dispatch): Promise<ILoginResponse> => {
	try {
		const {
			data: { response }
		} = await api.post('/auth/login', body);
		dispatch(setToken(response.token));
		dispatch(setUser(response.user));
		setCookie('token', response.token);
		ReactGA.set({ userId: response.user._id });
		return response;
	} catch (error) {
		if (error.response) throw error.response.data;
		else throw error;
	}
};

export const signOut = (ctx?: IContext) => async (dispatch: Dispatch) => {
	try {
		dispatch(setToken(''));
		dispatch(setUser(null));
		removeCookie('token', ctx);
		ReactGA.set({ userId: null });
	} catch (error) {
		throw error;
	}
};

export const forgotPassword = async (email: string) => {
	try {
		const {
			data: { response }
		} = await api.post('/api/auth/forgot', { email });
		return response;
	} catch (error) {
		throw error.response.data;
	}
};

export const resetPassword = async (password, passwordConfirm, token) => {
	try {
		const {
			data: { response }
		} = await api.post('/api/auth/reset', {
			password,
			passwordConfirm,
			token
		});
		return response;
	} catch (error) {
		throw error.response.data;
	}
};

// Should only be called in the "server-side" context in _app
export const refreshToken = (ctx?: IContext, params?: any) => async (dispatch: Dispatch) => {
	try {
		if (ctx && ctx.res && ctx.res.headersSent) return;
		const token = getToken(ctx);
		if (!token) {
			dispatch(setUser(null));
			dispatch(setToken(''));
			removeCookie('token', ctx);
			ReactGA.set({ userId: null });
			return null;
		}
		const {
			data: { response }
		} = await api.get('/auth/refresh', {
			params,
			headers: { Authorization: `Bearer ${token}` }
		});

		dispatch(setUser(response.user));
		dispatch(setToken(response.token));
		setCookie('token', response.token, ctx);
		ReactGA.set({ userId: response.user._id });
		return response;
	} catch (error) {
		if (error.response) throw error.response.data;
		throw error;
	}
};

export const sendFlashMessage = (msg: string, ctx?: IContext, type: flashColor = 'red') => (
	dispatch: Dispatch
) => {
	if (type === 'red') {
		dispatch(setRedFlash(msg));
		flash.set({ red: msg }, ctx);
	} else {
		dispatch(setGreenFlash(msg));
		flash.set({ green: msg }, ctx);
	}
};

export const clearFlashMessages = (ctx?: IContext) => (dispatch: Dispatch) => {
	dispatch(setGreenFlash(''));
	dispatch(setRedFlash(''));
	removeCookie('flash', ctx);
	// flash.get(ctx);
};

export const storageChanged = e => (dispatch, getState) => {
	const token = getToken(getState());
	if (!token) signOut()(dispatch);
	else dispatch(setToken(token));
};
