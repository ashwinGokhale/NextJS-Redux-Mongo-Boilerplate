import { Action, UnauthorizedError } from 'routing-controllers';
import { decode, verify } from 'jsonwebtoken';
import { User } from '../models/user';
import { ObjectId } from 'bson';
import CONFIG from '../config';
import { hasPermission, extractToken } from '../utils';

export const currentUserChecker = async (action: Action) => {
	const token = extractToken(action.request);
	if (!token || token === 'null' || token === 'undefined') return null;

	try {
		verify(token, CONFIG.SECRET);
	} catch (error) {
		return null;
	}

	const payload: any = decode(token);
	if (!payload || !payload._id || !ObjectId.isValid(payload._id)) return null;

	const user = await User.findById(payload._id)
		// .lean()
		.exec();
	return user;
};

export const authorizationChecker = async (action: Action, roles: string[]) => {
	const user = await currentUserChecker(action);
	if (!user) throw new UnauthorizedError('Permission Denied');
	if (!roles.length) return true;
	if (!roles.some(role => hasPermission(user, role)))
		throw new UnauthorizedError('Permission Denied');
	return true;
};
