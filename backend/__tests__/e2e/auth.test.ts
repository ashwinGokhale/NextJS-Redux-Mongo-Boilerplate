import 'jest';
import * as supertest from 'supertest';
import * as jwt from 'jsonwebtoken';
import { ObjectId } from 'bson';
import { generateUser, sleep } from '../helper';
import Server from '../../../backend/server';
import CONFIG from '../../config';

let server: Server;
let request: supertest.SuperTest<supertest.Test>;

describe('Auth route tests', () => {
	beforeAll(() =>
		Server.createInstance().then(s => {
			server = s;
			request = supertest(s.app);
		})
	);

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
			expect(response.user).toHaveProperty('_id');

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
			expect(response.user).toHaveProperty('_id');
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
			expect(error).toEqual('Member not found');
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
			expect(response.user).toHaveProperty('_id');
			let error;
			let statusCode;
			({
				body: { error },
				status: statusCode
			} = await request.post('/api/auth/login').send({
				email: generatedUser.email,
				password: generatedUser.password + generatedUser.password
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
			expect(response.user).toHaveProperty('_id');
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
			expect(response.user).toHaveProperty('_id');
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

		it('Fails to refresh token with non existant member', async () => {
			const token = jwt.sign({ _id: 'invalid' }, CONFIG.SECRET, {
				expiresIn: '7 days'
			});
			const {
				body: { error },
				status
			} = await request.get('/api/auth/refresh').auth(token, { type: 'bearer' });

			expect(status).toEqual(401);
			expect(error).toEqual('Invalid token');
		});

		it('Fails to refresh token with non existant member', async () => {
			const token = jwt.sign({ _id: new ObjectId() }, CONFIG.SECRET, {
				expiresIn: '7 days'
			});
			const {
				body: { error },
				status
			} = await request.get('/api/auth/refresh').auth(token, { type: 'bearer' });

			expect(status).toEqual(401);
			expect(error).toEqual('Member not found');
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
			expect(payload._id).toEqual(user.user._id);
			const isExpired = Date.now() / 1000 > payload.exp;
			expect(isExpired).toEqual(false);
		});

		it('Successfully refreshes an expired token', async () => {
			const generatedUser = generateUser();
			const {
				body: { response: user }
			} = await request.post('/api/auth/signup').send(generatedUser);

			const newToken = jwt.sign({ _id: user.user._id }, CONFIG.SECRET, {
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
			expect(payload._id).toEqual(user.user._id);
			const isExpired = Date.now() / 1000 > payload.exp;
			expect(isExpired).toEqual(false);
		});
	});

	afterEach(() => server.mongoose.connection.dropDatabase());

	afterAll(() => server.mongoose.disconnect());
});
