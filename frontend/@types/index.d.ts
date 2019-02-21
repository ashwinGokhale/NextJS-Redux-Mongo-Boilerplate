import { NextContext } from 'next';
import { Store } from 'redux';
import { IFlashState } from '../redux/reducers/flash';
import { ISessionState } from '../redux/reducers/session';
import { Request, Response } from 'express';
import { Role } from '../utils/session';

export interface IStoreState {
	flashState: IFlashState;
	sessionState: ISessionState;
}

export interface IContext extends NextContext {
	store: Store<IStoreState>;
	req: Request;
	res: Response;
}

export interface IUser {
	_id: string;
	name: string;
	email: string;
	role: Role;
	verified: boolean;
	checkedin: boolean;
	createdAt: string;
	updatedAt: string;
}

export type flashColor = 'red' | 'green';
export type flashType = { [key in flashColor]?: string };

// Request types
export interface ICreateUser {
	name: string;
	email: string;
	password: string;
	passwordConfirm: string;
}

export interface ILoginUser {
	email: string;
	password: string;
}

// Response types
export interface ILoginResponse {
	token: string;
	user: IUser;
}
