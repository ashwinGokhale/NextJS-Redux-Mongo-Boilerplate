import 'jest';
import * as supertest from 'supertest';
import { generateUsers, generateUser } from '../helper';
import Server from '../../server';
import { User } from '../../models/user';
import { Role } from '../../../shared/user.enums';

let server: Server;
let request: supertest.SuperTest<supertest.Test>;
let users: { user: User; token: string }[];
let user: { user: User; token: string };

describe('Suite: /api/users -- Integration', () => {
	beforeAll(() =>
		Server.createInstance().then(s => {
			server = s;
			request = supertest(s.app);
		})
	);

	beforeEach(async () => {
		jest.mock('../../services/email.service.ts');

		users = await Promise.all<{ user: User; token: string }>(
			generateUsers(6).map(u =>
				request
					.post('/api/auth/signup')
					.send(u)
					.then(response => response.body.response)
			)
		);
		user = users[0];
	});

	afterEach(async () => {
		jest.unmock('../../services/email.service.ts');
		await server.connection.synchronize(true);
	});

	afterAll(() => server.stop());

	describe('Get all Users', () => {
		it('Fails to get all users because not logged in', async () => {
			const {
				body: { error },
				status
			} = await request.get('/api/users');
			expect(status).toEqual(401);
			expect(error).toEqual('You must be logged in!');
		});

		it('Fails to get all users because insufficient permissions', async () => {
			const {
				body: { error },
				status
			} = await request.get('/api/users').auth(user.token, { type: 'bearer' });
			expect(status).toEqual(401);
			expect(error).toEqual('Insufficient permissions');
		});

		it('Successfully gets all users', async () => {
			user.user = await User.findOne(user.user.id).then(u => {
				u.role = Role.EXEC;
				return u.save();
			});
			const {
				body: { response },
				status
			} = await request.get('/api/users').auth(user.token, { type: 'bearer' });
			expect(status).toEqual(200);
			expect(response.users).toHaveLength(users.length);
			response.users.forEach(u => {
				expect(u).not.toHaveProperty('password');
				expect(u).toHaveProperty('id');
				const foundUser = users.find(val => val.user.id === u.id);
				expect(foundUser).toBeTruthy();
				expect(u.name).toEqual(foundUser.user.name);
				expect(u.email).toEqual(foundUser.user.email);
			});
		});
	});

	describe('Get a single user', () => {
		it('Fails to get a single user because not logged in', async () => {
			const {
				body: { error },
				status
			} = await request.get(`/api/users/${user.user.id}`);
			expect(status).toEqual(401);
			expect(error).toEqual('You must be logged in!');
		});

		it('Fails to get a single user because insufficient permissions', async () => {
			const {
				body: { error },
				status
			} = await request
				.get(`/api/users/${user.user.id}`)
				.auth(user.token, { type: 'bearer' });
			expect(status).toEqual(401);
			expect(error).toEqual('Insufficient permissions');
		});

		it('Fails to get a single user because invalid id', async () => {
			user.user = await User.findOne(user.user.id).then(u => {
				u.role = Role.EXEC;
				return u.save();
			});
			const {
				body: { error },
				status
			} = await request.get('/api/users/invalidID').auth(user.token, { type: 'bearer' });
			expect(status).toEqual(400);
			expect(error).toEqual('User not found');
		});

		it('Fails to get a single user because user does not exist', async () => {
			user.user = await User.findOne(user.user.id).then(u => {
				u.role = Role.EXEC;
				return u.save();
			});
			const {
				body: { error },
				status
			} = await request.get(`/api/users/${1000}`).auth(user.token, { type: 'bearer' });
			expect(status).toEqual(400);
			expect(error).toEqual('User not found');
		});

		it('Successfully gets a single user', async () => {
			user.user = await User.findOne(user.user.id).then(u => {
				u.role = Role.EXEC;
				return u.save();
			});
			const {
				body: { response },
				status
			} = await request
				.get(`/api/users/${user.user.id}`)
				.auth(user.token, { type: 'bearer' });
			expect(status).toEqual(200);
			expect(response).toMatchObject({
				id: user.user.id,
				name: user.user.name,
				email: user.user.email,
				role: user.user.role
			});
		});
	});

	describe('Updates user profile', () => {
		it('Fails to update profile because invalid user ID', async () => {
			const body = generateUser();
			const {
				body: { error },
				status
			} = await request
				.put(`/api/users/InvalidID`)
				.auth(user.token, { type: 'bearer' })
				.send(body);

			expect(status).toEqual(400);
			expect(error).toEqual('User not found');
		});

		it('Fails to update profile because user does not exist', async () => {
			const body = generateUser();
			const {
				body: { error },
				status
			} = await request
				.put(`/api/users/${10000}`)
				.auth(user.token, { type: 'bearer' })
				.send(body);

			expect(error).toEqual('User not found');
			expect(status).toEqual(400);
		});

		it('Fails to update profile because user not logged in', async () => {
			const {
				body: { error },
				status
			} = await request.put(`/api/users/${user.user.id}`);

			expect(status).toEqual(401);
			expect(error).toEqual('You must be logged in!');
		});

		it('Fails to updates another users profile', async () => {
			const body = generateUser();

			const {
				body: { error },
				status
			} = await request
				.put(`/api/users/${users[0].user.id}`)
				.send(body)
				.auth(users[1].token, { type: 'bearer' });

			expect(error).toEqual('You are unauthorized to edit this profile');
			expect(status).toEqual(401);
		});

		it('Fails to update profile because no body', async () => {
			const {
				body: { error },
				status
			} = await request
				.put(`/api/users/${user.user.id}`)
				.auth(user.token, { type: 'bearer' });

			expect(status).toEqual(400);
			expect(error).toEqual('Please provide a valid email address');
		});

		it('Fails to update profile because body but no name', async () => {
			const body = {
				email: user.user.email
			};

			const {
				body: { error },
				status
			} = await request
				.put(`/api/users/${user.user.id}`)
				.send(body)
				.auth(user.token, { type: 'bearer' });

			expect(status).toEqual(400);
			expect(error).toEqual('Please provide your first and last name');
		});

		it('Fails to update profile because no last name', async () => {
			const body = {
				...user.user,
				name: 'FirstName'
			};

			const {
				body: { error },
				status
			} = await request
				.put(`/api/users/${user.user.id}`)
				.send(body)
				.auth(user.token, { type: 'bearer' });

			expect(status).toEqual(400);
			expect(error).toEqual('Please provide your first and last name');
		});

		it('Succesfully updates a users profile', async () => {
			const body = {
				...user.user,
				name: 'ChangedFirstName LastName'
			};

			const {
				body: { response },
				status
			} = await request
				.put(`/api/users/${user.user.id}`)
				.send(body)
				.auth(user.token, { type: 'bearer' });

			expect(status).toEqual(200);
			expect(response).not.toHaveProperty('password');
			expect(response).toEqual(
				expect.objectContaining({
					id: body.id,
					name: body.name,
					email: user.user.email
					// role: user.user.role
				})
			);
		});
	});
});
