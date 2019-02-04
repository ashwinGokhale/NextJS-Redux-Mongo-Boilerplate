import cookie from 'js-cookie';
import Router from 'next/router';
import { Request } from 'express';

export const setCookie = (key: string, value: string | object) => {
	if (process.browser) cookie.set(key, value);
};

export const removeCookie = (key: string) => {
	if (process.browser) cookie.remove(key);
};

export const getCookie = (key: string, req?: Request) => {
	return process.browser ? getCookieFromBrowser(key) : getCookieFromServer(key, req);
};

const getCookieFromBrowser = (key: string) => {
	return cookie.get(key);
};

const getCookieFromServer = (key: string, req: Request) => {
	if (!req || !req.cookies) return '';
	return req.cookies[key];
};

export const getToken = (ctx: { [x: string]: any } = {}) => {
	return getCookie('token', ctx.req);
};

export const redirect = (target: string, ctx: { [x: string]: any } = {}, replace?: boolean) => {
	if (ctx.res) {
		// Server redirect
		ctx.res.writeHead(replace ? 303 : 301, { Location: target });
		ctx.res.end();
	} else {
		// Browser redirect
		replace ? Router.replace(target) : Router.push(target);
	}
};

export const isAuthenticated = ctx => !!getToken(ctx);

export const redirectIfAuthenticated = (path: string, ctx) => {
	if (isAuthenticated(ctx)) redirect(path, ctx, true);
};

export const redirectIfNotAuthenticated = (path: string, ctx) => {
	if (!isAuthenticated(ctx)) redirect(path, ctx, true);
};
