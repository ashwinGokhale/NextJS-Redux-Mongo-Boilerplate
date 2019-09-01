import { Request } from 'express';
import { isEmail } from 'validator';
import * as jwt from 'jsonwebtoken';
import CONFIG from '../config';
import { User, UserDto } from '../models/user';
import { extractToken } from '../utils';
import { ValidationMiddleware } from '../middleware/validation';
import { EmailService } from '../services/email.service';
import { StorageService } from '../services/storage.service';
import {
	Controller,
	UseAfter,
	Post,
	Body,
	Req,
	Get,
	BodyParam,
	BadRequestError,
	UnauthorizedError
} from 'routing-controllers';
import { Repository } from 'typeorm';
import { InjectRepository } from 'typeorm-typedi-extensions';

@Controller('/api/auth')
@UseAfter(ValidationMiddleware)
export class AuthController {
	@InjectRepository(User) userService: Repository<User>;
	constructor(private emailService?: EmailService, private storageService?: StorageService) {}

	@Post('/signup')
	async signup(
		@BodyParam('password') password: string,
		@BodyParam('passwordConfirm') passwordConfirm: string,
		@Body() member: UserDto
	) {
		if (!password || password.length < 5)
			throw new BadRequestError('A password longer than 5 characters is required');
		if (!passwordConfirm) throw new BadRequestError('Please confirm your password');
		if (passwordConfirm !== password) throw new BadRequestError('Passwords did not match');

		const exists = await this.userService.findOne({ email: member.email });
		if (exists) throw new BadRequestError('An account already exists with that email');

		const user = this.userService.create(member);
		user.password = password;
		await user.save();
		delete user.password;
		delete user.resetPasswordToken;
		const token = jwt.sign({ id: user.id }, CONFIG.SECRET, {
			expiresIn: CONFIG.EXPIRES_IN
		});

		return {
			user,
			token
		};
	}

	@Post('/login')
	async login(@Body() body: { email: string; password: string }) {
		const { email, password } = body;

		const user = await this.userService
			.createQueryBuilder('user')
			.addSelect('user.password')
			.where('user.email = :email', { email })
			.getOne();
		if (!user) throw new UnauthorizedError('User not found');

		// Check if password matches
		const passwordMatches = await user.comparePassword(password);
		if (!passwordMatches) throw new UnauthorizedError('Wrong password');

		delete user.password;
		delete user.resetPasswordToken;

		// If user is found and password is right create a token
		const token = jwt.sign({ id: user.id }, CONFIG.SECRET, {
			expiresIn: CONFIG.EXPIRES_IN
		});
		return {
			user,
			token
		};
	}

	@Get('/refresh')
	async refresh(@Req() req: Request) {
		// Renew user's auth token
		let token = extractToken(req);
		if (!token || token === 'null' || token === 'undefined')
			throw new UnauthorizedError('No token provided');
		const payload: any = jwt.decode(token);
		if (!payload || !payload.id) throw new UnauthorizedError('Invalid token');

		const user = await this.userService.findOne({ id: payload.id });
		if (!user) throw new UnauthorizedError('User not found');
		token = jwt.sign({ id: user.id }, CONFIG.SECRET, {
			expiresIn: CONFIG.EXPIRES_IN
		});

		return { user, token };
	}

	@Post('/forgot')
	async forgot(@Body() body: { email: string }) {
		const { email } = body;
		if (!email || !isEmail(email)) throw new BadRequestError('Please provide a valid email');
		const member = await this.userService.findOne({ email });
		if (!member) throw new BadRequestError(`There is no user with the email: ${email}`);
		const token = jwt.sign({ id: member.id }, CONFIG.SECRET, {
			expiresIn: '2 days'
		});
		member.resetPasswordToken = token;
		await member.save();
		const res = await this.emailService.sendResetEmail(member);
		return `A link to reset your password has been sent to: ${email}`;
	}

	@Post('/reset')
	async reset(@Body() body: { password: string; passwordConfirm: string; token: string }) {
		const { password, passwordConfirm, token } = body;
		if (!password || password.length < 5)
			throw new BadRequestError('A password longer than 5 characters is required');
		if (!passwordConfirm) throw new BadRequestError('Please confirm your password');
		if (passwordConfirm !== password) throw new BadRequestError('Passwords did not match');

		if (!token) throw new UnauthorizedError('Invalid reset password token');
		let payload: { id: number };
		try {
			payload = jwt.verify(token, CONFIG.SECRET) as any;
		} catch (error) {
			throw new UnauthorizedError('Invalid reset password token');
		}
		if (!payload) throw new UnauthorizedError('Invalid reset password token');
		const { id } = payload;
		const user = await this.userService
			.createQueryBuilder('user')
			.addSelect('user.resetPasswordToken')
			.where('user.id = :id', { id })
			.getOne();

		if (!user)
			throw new BadRequestError('Reset password token corresponds to a non existing user');
		if (user.resetPasswordToken !== token)
			throw new UnauthorizedError('Wrong reset password token for this user');
		user.password = password;
		user.resetPasswordToken = '';
		await user.save();
		return `Successfully changed password for: ${user.name}`;
	}
}
