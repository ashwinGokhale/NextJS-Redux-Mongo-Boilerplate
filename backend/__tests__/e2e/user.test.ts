import 'jest';
import * as supertest from 'supertest';
import { generateUsers } from '../helper';
import { IUserModel } from '../../models/user';
import Server from '../../server';

let server: Server;
let request: supertest.SuperTest<supertest.Test>;
let users: { user: IUserModel; token: string }[];
let user: { user: IUserModel; token: string };

describe('Suite: /api/users', () => {
	beforeAll(() =>
		Server.createInstance().then(s => {
			server = s;
			request = supertest(s.app);
		})
	);

	beforeEach(async () => {
		users = await Promise.all<{ user: IUserModel; token: string }>(
			generateUsers(6).map(u =>
				request
					.post('/api/auth/signup')
					.send(u)
					.then(response => response.body.response)
			)
		);
		user = users[0];
	});

	describe('Get all Users', () => {
		it('Successfully gets all users', async () => {
			const {
				body: { response },
				status
			} = await request.get('/api/users');
			expect(status).toEqual(200);
			expect(response.users).toHaveLength(users.length);
			response.users.forEach(u => {
				expect(u).not.toHaveProperty('password');
				expect(u).toHaveProperty('_id');
				const foundUser = users.find(val => val.user._id === u._id);
				expect(foundUser).toBeTruthy();
				expect(u.name).toEqual(foundUser.user.name);
				expect(u.email).toEqual(foundUser.user.email);
			});
		});
	});

	describe('Get a single Users', () => {
		it('Fails to get a single user because invalid id', async () => {
			const {
				body: { error },
				status
			} = await request.get('/api/users/invalidID');
			expect(status).toEqual(400);
			expect(error).toEqual('Invalid user ID');
		});

		it('Fails to get a single user because user does not exist', async () => {
			const {
				body: { error },
				status
			} = await request.get(`/api/users/${server.mongoose.Types.ObjectId()}`);
			expect(status).toEqual(400);
			expect(error).toEqual('User does not exist');
		});

		it('Successfully gets a single user', async () => {
			const {
				body: { response },
				status
			} = await request.get(`/api/users/${user.user._id}`);
			expect(status).toEqual(200);
			expect(response).toEqual(user.user);
		});
	});

	afterEach(() => server.mongoose.connection.dropDatabase());

	afterAll(() => server.mongoose.disconnect());
});
