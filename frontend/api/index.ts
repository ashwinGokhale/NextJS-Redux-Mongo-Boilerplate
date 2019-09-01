import { decode } from 'jsonwebtoken';
import { api } from '../utils';
import { getToken } from '../utils/session';
import { IContext, IUser } from '../@types';
import { ApplicationsStatus } from '../../shared/globals.enums';
import { Role } from '../../shared/user.enums';
import { Status } from '../../shared/app.enums';

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

export const updateRole = async (email: string, role: Role, ctx?: IContext) => {
	try {
		const token = getToken(ctx);
		const {
			data: { response }
		} = await api.post(
			`/admin/role/`,
			{ email, role },
			{ headers: { Authorization: `Bearer ${token}` } }
		);
		const user: IUser = response;
		return user;
	} catch (error) {
		throw error.response ? error.response.data : error;
	}
};
