import * as passport from 'passport';
import { Strategy } from 'passport-jwt';
import { Request, Response, NextFunction } from 'express';
import CONFIG from '../config';
import { User } from '../models/user';
import { errorRes, hasPermission, extractToken } from '../utils';
import { ObjectId } from 'bson';

export default (pass: any) =>
	pass.use(
		new Strategy(
			{
				jwtFromRequest: extractToken,
				secretOrKey: CONFIG.SECRET
			},
			async (payload, done) => {
				try {
					if (!payload || !payload._id || !ObjectId.isValid(payload._id))
						return done(null, false);
					const user = await User.findById(payload._id)
						.lean()
						.exec();
					return user ? done(null, user) : done(null, false);
				} catch (error) {
					console.error('Strategy error:', error);
					return done(error, false);
				}
			}
		)
	);

export const auth = () => (req: Request, res: Response, next: NextFunction) =>
	req.user ? next() : errorRes(res, 401, 'Unauthorized');

export const extractUser = () => (req: Request, res: Response, next: NextFunction) =>
	passport.authenticate('jwt', { session: true }, (err, data, info) => {
		req.user = data || null;
		next();
	})(req, res, next);

export const hasPermissions = (roles: string[]) => (
	req: Request,
	res: Response,
	next: NextFunction
) =>
	!req.user || !roles.some(role => hasPermission(req.user, role))
		? errorRes(res, 401, 'Permission Denied')
		: next();
