import ReactGA from 'react-ga';
import { ActionCreator, AnyAction, Dispatch } from 'redux';
import { ICreateUser, ILoginUser, ILoginResponse, IContext, IUser } from '../../@types';
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

// Auth Actions
// TODO: Signing up should not log user in
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
		throw error.response ? error.response.data : error;
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
		throw error.response ? error.response.data : error;
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
		} = await api.post('/auth/forgot', { email });
		return response;
	} catch (error) {
		throw error.response ? error.response.data : error;
	}
};

export const resetPassword = async (password: string, passwordConfirm: string, token: string) => {
	try {
		const {
			data: { response }
		} = await api.post('/auth/reset', {
			password,
			passwordConfirm,
			token
		});
		return response;
	} catch (error) {
		throw error.response ? error.response.data : error;
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
		if (!error.response) throw error;
		dispatch(setUser(null));
		dispatch(setToken(''));
		removeCookie('token', ctx);
		ReactGA.set({ userId: null });
		return null;
		// throw error.response ? error.response.data : error;
	}
};

// Flash Actions
export const sendErrorMessage = (msg: string, ctx?: IContext) => (dispatch: Dispatch) => {
	dispatch(setRedFlash(msg));
	flash.set({ red: msg }, ctx);
};

export const sendSuccessMessage = (msg: string, ctx?: IContext) => (dispatch: Dispatch) => {
	dispatch(setGreenFlash(msg));
	flash.set({ green: msg }, ctx);
};

export const clearFlashMessages = (ctx?: IContext) => (dispatch: Dispatch) => {
	dispatch(setGreenFlash(''));
	dispatch(setRedFlash(''));
	removeCookie('flash', ctx);
};

export const storageChanged = e => (dispatch, getState) => {
	const token = getToken(getState());
	if (!token) signOut()(dispatch);
	else dispatch(setToken(token));
};
