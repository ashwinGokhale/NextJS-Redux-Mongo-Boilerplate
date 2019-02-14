import cookie from 'js-cookie';
import Router from 'next/router';
import { IUser, IContext } from '../@types';
import { sendFlashMessage } from '../redux/actions';

export enum Role {
	USER = 'USER',
	MENTOR = 'MENTOR',
	EXEC = 'EXEC',
	ADMIN = 'ADMIN'
}

export const setCookie = (key: string, value: string | object, ctx?: IContext, options?) => {
	// Server
	if (ctx && ctx.req) ctx.res.cookie(key, value, options);
	// Client
	else cookie.set(key, value, options);
};

export const removeCookie = (key: string, ctx?: IContext) => {
	// Server
	if (ctx && ctx.req) ctx.res.clearCookie(key);
	// Client
	else cookie.remove(key);
};

export const getCookie = (key: string, ctx?: IContext) => {
	// Server
	if (ctx && ctx.req) return ctx.req.cookies[key];
	// Client
	else return cookie.getJSON(key);
};

export const getToken = (ctx?: IContext) => {
	return getCookie('token', ctx);
};

export const redirect = (target: string, ctx?: IContext, replace?: boolean) => {
	if (ctx && ctx.res) {
		// Server redirect
		// ctx.res.redirect(replace ? 303 : 301, target);
		// ctx.res.writeHead(replace ? 303 : 301, { Location: target });
		ctx.res.status(replace ? 303 : 301).header('Location', target);
		// ctx.res.end();
	} else {
		// Browser redirect
		replace ? Router.replace(target) : Router.push(target);
	}
	return true;
};

const extractUser = (ctx: IContext) => {
	// Try to get from redux, and if not, req.user
	let user = ctx && ctx.store && ctx.store.getState().sessionState.user;
	if (user) return user;
	user = ctx && ctx.req && ctx.req.user;
	return user;
};

export const hasPermission = (user: IUser, name: string): boolean => {
	if (!user || !user.role) return false;
	return user.role === Role.ADMIN || user.role === name;
};

export const isAuthenticated = (ctx: IContext, roles?: Role[]) => {
	if (!roles || !roles.length) return !!getToken(ctx);
	const user = extractUser(ctx);
	if (!user) return false;
	if (!roles.length) return true;
	if (!roles.some(role => hasPermission(user, role))) return false;
	return true;
};

export const redirectIfNotAuthenticated = (
	path: string,
	ctx: IContext,
	{ roles, msg }: { roles?: Role[]; msg?: string } = {}
): boolean => {
	if (!isAuthenticated(ctx, roles)) {
		redirect(path, ctx, true);
		if (msg) sendFlashMessage(msg, ctx)(ctx.store.dispatch);
		return true;
	}

	return false;
};
