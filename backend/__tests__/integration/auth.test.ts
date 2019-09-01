import 'jest';
import * as supertest from 'supertest';
import * as jwt from 'jsonwebtoken';
import { generateUser, sleep } from '../helper';
import Server from '../../server';
import CONFIG from '../../config';
import { User } from '../../models/user';

let server: Server;
let request: supertest.SuperTest<supertest.Test>;

jest.mock('../../services/email.service.ts');

describe('Suite: /api/auth -- Integration', () => {
	beforeAll(() =>
		Server.createInstance().then(s => {
			server = s;
			request = supertest(s.app);
		})
	);

	afterEach(() => server.connection.synchronize(true));

	afterAll(() => server.stop());

	describe('Signup Tests', () => {
		it('Fails because no name', async () => {
			const newUser = generateUser();
			delete newUser.name;
			const {
				body: { error },
				status
			} = await request.post('/api/auth/signup').send(newUser);
			expect(status).toEqual(400);
			expect(error).toEqual('Please provide your first and last name');
		});

		it('Fails because no email', async () => {
			const newUser = generateUser();
			delete newUser.email;
			const {
				body: { error },
				status
			} = await request.post('/api/auth/signup').send(newUser);
			expect(status).toEqual(400);
			expect(error).toEqual('Please provide a valid email address');
		});

		it('Fails because invalid email', async () => {
			const newUser = generateUser();
			newUser.email = 'Invalid email';
			const {
				body: { error },
				status
			} = await request.post('/api/auth/signup').send(newUser);
			expect(status).toEqual(400);
			expect(error).toEqual('Please provide a valid email address');
		});

		it('Fails because password is too short', async () => {
			const newUser = generateUser();
			newUser.password = '123';
			const {
				body: { error },
				status
			} = await request.post('/api/auth/signup').send(newUser);
			expect(status).toEqual(400);
			expect(error).toEqual('A password longer than 5 characters is required');
		});

		it('Fails because password not confirmed', async () => {
			const newUser = generateUser();
			delete newUser.passwordConfirm;
			const {
				body: { error },
				status
			} = await request.post('/api/auth/signup').send(newUser);
			expect(status).toEqual(400);
			expect(error).toEqual('Please confirm your password');
		});

		it('Fails because passwords do not match', async () => {
			const newUser = generateUser();
			newUser.passwordConfirm = newUser.password + newUser.password;
			const {
				body: { error },
				status
			} = await request.post('/api/auth/signup').send(newUser);
			expect(status).toEqual(400);
			expect(error).toEqual('Passwords did not match');
		});

		it('Fails because user is already created', async () => {
			const generatedUser = generateUser();
			const {
				body: { response },
				status
			} = await request.post('/api/auth/signup').send(generatedUser);
			expect(status).toStrictEqual(200);
			expect(response).toHaveProperty('token');
			expect(response).toHaveProperty('user');
			expect(response.user.name).toStrictEqual(generatedUser.name);
			expect(response.user.email).toStrictEqual(generatedUser.email);
			expect(response.user).not.toHaveProperty('password');
			expect(response.user).toHaveProperty('id');

			const {
				body: { error },
				status: statusCode
			} = await request.post('/api/auth/signup').send(generatedUser);
			expect(statusCode).toEqual(400);
			expect(error).toEqual('An account already exists with that email');
		});

		it('Successfully creates a user', async () => {
			const generatedUser = generateUser();
			const {
				body: { response },
				status
			} = await request.post('/api/auth/signup').send(generatedUser);
			expect(status).toEqual(200);
			expect(response).toHaveProperty('token');
			expect(response).toHaveProperty('user');
			expect(response.user.name).toStrictEqual(generatedUser.name);
			expect(response.user.email).toStrictEqual(generatedUser.email);
			expect(response.user).not.toHaveProperty('password');
			expect(response.user).toHaveProperty('id');
		});
	});

	describe('Login Tests', () => {
		it('Fails because user does not exist', async () => {
			const generatedUser = generateUser();
			const {
				body: { error },
				status
			} = await request.post('/api/auth/login').send({
				email: generatedUser.email,
				password: generatedUser.password
			});
			expect(status).toStrictEqual(401);
			expect(error).toEqual('User not found');
		});

		it('Fails because user the password is wrong', async () => {
			const generatedUser = generateUser();
			const {
				body: { response },
				status
			} = await request.post('/api/auth/signup').send(generatedUser);
			expect(status).toStrictEqual(200);
			expect(response).toHaveProperty('token');
			expect(response).toHaveProperty('user');
			expect(response.user.name).toStrictEqual(generatedUser.name);
			expect(response.user.email).toStrictEqual(generatedUser.email);
			expect(response.user).not.toHaveProperty('password');
			expect(response.user).toHaveProperty('id');
			let error;
			let statusCode;
			({
				body: { error },
				status: statusCode
			} = await request.post('/api/auth/login').send({
				email: generatedUser.email,
				password: 'Wrongpassword'
			}));

			expect(statusCode).toStrictEqual(401);
			expect(error).toEqual('Wrong password');
		});

		it('Successfully logs in', async () => {
			const generatedUser = generateUser();
			let {
				body: { response },
				status
			} = await request.post('/api/auth/signup').send(generatedUser);
			expect(status).toEqual(200);
			expect(response).toHaveProperty('token');
			expect(response).toHaveProperty('user');
			expect(response.user.name).toStrictEqual(generatedUser.name);
			expect(response.user.email).toStrictEqual(generatedUser.email);
			expect(response.user).not.toHaveProperty('password');
			expect(response.user).toHaveProperty('id');
			({
				body: { response },
				status
			} = await request.post('/api/auth/login').send({
				email: generatedUser.email,
				password: generatedUser.password
			}));

			expect(status).toStrictEqual(200);
			expect(response).toHaveProperty('token');
			expect(response).toHaveProperty('user');
			expect(response.user.name).toStrictEqual(generatedUser.name);
			expect(response.user.email).toStrictEqual(generatedUser.email);
			expect(response.user).not.toHaveProperty('password');
			expect(response.user).toHaveProperty('id');
		});
	});

	describe('Refresh Token Tests', () => {
		it('Fails to refresh with no token provided', async () => {
			const {
				body: { error },
				status
			} = await request.get('/api/auth/refresh');

			expect(status).toEqual(401);
			expect(error).toEqual('No token provided');
		});

		it('Fails to refresh with empty token provided', async () => {
			const {
				body: { error },
				status
			} = await request.get('/api/auth/refresh').auth('token', { type: 'bearer' });

			expect(status).toEqual(401);
			expect(error).toEqual('Invalid token');
		});

		it('Fails to refresh token with invalid data payload', async () => {
			const token = jwt.sign({ blah: 'blah' }, CONFIG.SECRET, {
				expiresIn: '7 days'
			});
			const {
				body: { error },
				status
			} = await request.get('/api/auth/refresh').auth(token, { type: 'bearer' });

			expect(status).toEqual(401);
			expect(error).toEqual('Invalid token');
		});

		it('Fails to refresh token with invalid', async () => {
			const token = jwt.sign({ id: 'invalid' }, CONFIG.SECRET, {
				expiresIn: '7 days'
			});
			const {
				body: { error },
				status
			} = await request.get('/api/auth/refresh').auth(token, { type: 'bearer' });

			expect(status).toEqual(401);
			expect(error).toEqual('User not found');
		});

		it('Fails to refresh token with non existant user', async () => {
			const token = jwt.sign({ id: 1000 }, CONFIG.SECRET, {
				expiresIn: '7 days'
			});
			const {
				body: { error },
				status
			} = await request.get('/api/auth/refresh').auth(token, { type: 'bearer' });

			expect(status).toEqual(401);
			expect(error).toEqual('User not found');
		});

		it('Successfully with non-expired token', async () => {
			const generatedUser = generateUser();
			const {
				body: { response: user }
			} = await request.post('/api/auth/signup').send(generatedUser);

			const {
				body: { response },
				status
			} = await request.get('/api/auth/refresh').auth(user.token, { type: 'bearer' });

			expect(status).toEqual(200);
			expect(response.user).toEqual(user.user);
			expect(response.token).toBeTruthy();
			const payload: any = jwt.decode(response.token);
			expect(payload.id).toEqual(user.user.id);
			const isExpired = Date.now() / 1000 > payload.exp;
			expect(isExpired).toEqual(false);
		});

		it('Successfully refreshes an expired token', async () => {
			const generatedUser = generateUser();
			const {
				body: { response: user }
			} = await request.post('/api/auth/signup').send(generatedUser);

			const newToken = jwt.sign({ id: user.user.id }, CONFIG.SECRET, {
				expiresIn: '1ms'
			});
			await sleep(2000);
			const {
				body: { response },
				status
			} = await request.get('/api/auth/refresh').auth(newToken, { type: 'bearer' });

			expect(status).toEqual(200);
			expect(response.user).toEqual(user.user);
			expect(response.token).toBeTruthy();
			const payload: any = jwt.decode(response.token);
			expect(payload.id).toEqual(user.user.id);
			const isExpired = Date.now() / 1000 > payload.exp;
			expect(isExpired).toEqual(false);
		});
	});

	describe('Forgot Password Tests', () => {
		it('Fails because no email', async () => {
			const generatedUser = generateUser();

			let {
				body: { error },
				status
			} = await request.post('/api/auth/signup').send(generatedUser);

			({
				body: { error },
				status
			} = await request.post('/api/auth/forgot'));
			expect(status).toEqual(400);
			expect(error).toEqual('Please provide a valid email');
		});

		it('Fails because invalid email', async () => {
			const generatedUser = generateUser();

			let {
				body: { error },
				status
			} = await request.post('/api/auth/signup').send(generatedUser);

			({
				body: { error },
				status
			} = await request.post('/api/auth/forgot').send({
				email: 'invalidemail'
			}));
			expect(status).toEqual(400);
			expect(error).toEqual('Please provide a valid email');
		});

		it('Fails because no user exists', async () => {
			const generatedUser = generateUser();

			let {
				body: { error },
				status
			} = await request.post('/api/auth/signup').send(generatedUser);

			const fakeEmail = 'nouser@exists.com';
			({
				body: { error },
				status
			} = await request.post('/api/auth/forgot').send({
				email: fakeEmail
			}));
			expect(status).toEqual(400);
			expect(error).toEqual(`There is no user with the email: ${fakeEmail}`);
		});

		it('Successfully creates a reset password token', async () => {
			const generatedUser = generateUser();

			let {
				body: { response },
				status
			} = await request.post('/api/auth/signup').send(generatedUser);

			const user = response;

			({
				body: { response },
				status
			} = await request.post('/api/auth/forgot').send({
				email: generatedUser.email
			}));
			expect(status).toEqual(200);
			expect(response).toEqual(
				`A link to reset your password has been sent to: ${generatedUser.email}`
			);

			const dbUser = await User.createQueryBuilder('user')
				.addSelect('user.resetPasswordToken')
				.where('user.id = :id', { id: user.user.id })
				.getOne();

			expect(dbUser.resetPasswordToken).toBeTruthy();
			expect(dbUser.resetPasswordToken).toHaveProperty('length');
			expect(dbUser.resetPasswordToken.length).toBeGreaterThan(1);
		});
	});

	describe('Reset Password Tests', () => {
		it('Fails because no password', async () => {
			const generatedUser = generateUser();

			await request.post('/api/auth/signup').send(generatedUser);

			await request.post('/api/auth/forgot').send({ email: generatedUser.email });

			const {
				body: { error },
				status
			} = await request.post('/api/auth/reset');

			expect(status).toEqual(400);
			expect(error).toEqual('A password longer than 5 characters is required');
		});

		it('Fails because password is too short', async () => {
			const generatedUser = generateUser();

			await request.post('/api/auth/signup').send(generatedUser);

			await request.post('/api/auth/forgot').send({ email: generatedUser.email });
			const newPassword = 'a';
			const {
				body: { error },
				status
			} = await request.post('/api/auth/reset').send({ password: newPassword });

			expect(status).toEqual(400);
			expect(error).toEqual('A password longer than 5 characters is required');
		});

		it('Fails because no password confirm', async () => {
			const generatedUser = generateUser();

			await request.post('/api/auth/signup').send(generatedUser);

			await request.post('/api/auth/forgot').send({ email: generatedUser.email });
			const newPassword = 'test123';
			const {
				body: { error },
				status
			} = await request.post('/api/auth/reset').send({ password: newPassword });

			expect(status).toEqual(400);
			expect(error).toEqual('Please confirm your password');
		});

		it('Fails because passwords do not match', async () => {
			const generatedUser = generateUser();

			await request.post('/api/auth/signup').send(generatedUser);

			await request.post('/api/auth/forgot').send({ email: generatedUser.email });
			const newPassword = 'test123';
			const {
				body: { error },
				status
			} = await request
				.post('/api/auth/reset')
				.send({ password: newPassword, passwordConfirm: 'nomatch' });

			expect(status).toEqual(400);
			expect(error).toEqual('Passwords did not match');
		});

		it('Fails because no token', async () => {
			const generatedUser = generateUser();

			await request.post('/api/auth/signup').send(generatedUser);

			await request.post('/api/auth/forgot').send({ email: generatedUser.email });
			const newPassword = 'test123';
			const {
				body: { error },
				status
			} = await request
				.post('/api/auth/reset')
				.send({ password: newPassword, passwordConfirm: newPassword });

			expect(status).toEqual(401);
			expect(error).toEqual('Invalid reset password token');
		});

		it('Fails because expired token', async () => {
			const generatedUser = generateUser();

			const {
				body: { response: user }
			} = await request.post('/api/auth/signup').send(generatedUser);

			await request.post('/api/auth/forgot').send({ email: generatedUser.email });

			const newPassword = 'test123';
			const token = jwt.sign({ id: user.user.id }, CONFIG.SECRET, {
				expiresIn: '1ms'
			});

			await sleep(2000);
			const {
				body: { error },
				status
			} = await request.post('/api/auth/reset').send({
				password: newPassword,
				passwordConfirm: newPassword,
				token
			});

			expect(status).toEqual(401);
			expect(error).toEqual('Invalid reset password token');
		});

		it('Fails because invalid token payload', async () => {
			const generatedUser = generateUser();

			await request.post('/api/auth/signup').send(generatedUser);

			await request.post('/api/auth/forgot').send({ email: generatedUser.email });

			const newPassword = 'test123';
			const token = 'token';

			const {
				body: { error },
				status
			} = await request.post('/api/auth/reset').send({
				password: newPassword,
				passwordConfirm: newPassword,
				token
			});

			expect(status).toEqual(401);
			expect(error).toEqual('Invalid reset password token');
		});

		it('Fails because empty token payload', async () => {
			const generatedUser = generateUser();

			await request.post('/api/auth/signup').send(generatedUser);

			await request.post('/api/auth/forgot').send({ email: generatedUser.email });

			const newPassword = 'test123';
			const token = jwt.sign({}, CONFIG.SECRET, {
				expiresIn: '2 days'
			});

			const {
				body: { error },
				status
			} = await request.post('/api/auth/reset').send({
				password: newPassword,
				passwordConfirm: newPassword,
				token
			});

			expect(error).toEqual('Reset password token corresponds to a non existing user');
			expect(status).toEqual(400);
		});

		it('Fails because token corresponds to an invalid user', async () => {
			const generatedUser = generateUser();

			await request.post('/api/auth/signup').send(generatedUser);

			await request.post('/api/auth/forgot').send({ email: generatedUser.email });

			const newPassword = 'test123';
			const token = jwt.sign({ id: 'invalid' }, CONFIG.SECRET, {
				expiresIn: '2 days'
			});

			const {
				body: { error },
				status
			} = await request.post('/api/auth/reset').send({
				password: newPassword,
				passwordConfirm: newPassword,
				token
			});

			expect(status).toEqual(400);
			expect(error).toEqual('Reset password token corresponds to a non existing user');
		});

		it('Fails because using token for non existant user', async () => {
			const generatedUser = generateUser();

			await request.post('/api/auth/signup').send(generatedUser);

			await request.post('/api/auth/forgot').send({ email: generatedUser.email });

			const newPassword = 'test123';
			const token = jwt.sign({ id: 1000 }, CONFIG.SECRET, {
				expiresIn: '2 days'
			});

			const {
				body: { error },
				status
			} = await request.post('/api/auth/reset').send({
				password: newPassword,
				passwordConfirm: newPassword,
				token
			});

			expect(status).toEqual(400);
			expect(error).toEqual('Reset password token corresponds to a non existing user');
		});

		it('Fails because reset tokens do not match', async () => {
			const generatedUser = generateUser();

			await request.post('/api/auth/signup').send(generatedUser);

			await request.post('/api/auth/forgot').send({ email: generatedUser.email });

			const newPassword = 'test123';
			const fakeUser = await User.create(generateUser());
			await fakeUser.save();
			const token = jwt.sign({ id: fakeUser.id }, CONFIG.SECRET, {
				expiresIn: '2 days'
			});

			const {
				body: { error },
				status
			} = await request.post('/api/auth/reset').send({
				password: newPassword,
				passwordConfirm: newPassword,
				token
			});

			expect(error).toEqual('Wrong reset password token for this user');
			expect(status).toEqual(401);
		});

		it('Successfully resets a users password', async () => {
			const generatedUser = generateUser();

			const {
				body: { response: user }
			} = await request.post('/api/auth/signup').send(generatedUser);

			await request.post('/api/auth/forgot').send({ email: generatedUser.email });

			const newPassword = 'test123';
			let { resetPasswordToken } = await User.createQueryBuilder('user')
				.addSelect('user.resetPasswordToken')
				.where('user.id = :id', { id: user.user.id })
				.getOne();

			const {
				body: { response },
				status
			} = await request.post('/api/auth/reset').send({
				password: newPassword,
				passwordConfirm: newPassword,
				token: resetPasswordToken
			});

			expect(status).toEqual(200);
			expect(response).toEqual(`Successfully changed password for: ${user.user.name}`);

			({ resetPasswordToken } = await User.createQueryBuilder('user')
				.addSelect('user.resetPasswordToken')
				.where('user.id = :id', { id: user.user.id })
				.getOne());
			expect(resetPasswordToken).toBeDefined();
			expect(resetPasswordToken).toEqual('');
		});
	});
});
