import { AnyAction } from 'redux';

export interface IUser {
	_id: string;
	roles: string[];
	verified: boolean;
	checkedin: boolean;
	name: string;
	email: string;
	createdAt: string;
	updatedAt: string;
}

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
