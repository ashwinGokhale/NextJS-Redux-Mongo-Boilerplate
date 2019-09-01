/* eslint-disable */
import { Container } from 'typedi';
import Server from '../server';
import { User } from '../models/user';
import { AuthController } from '../controllers/auth.controller';
import { generateUsers, generateApplication } from '../__tests__/helper';
import { Status } from '../../shared/app.enums';
import { Role } from '../../shared/user.enums';
import { UserController } from '../controllers/user.controller';

let server: Server;

const start = async () => {
	try {
		const NUM_USERS = 50;
		server = await Server.createInstance();
		const authController = Container.get(AuthController);
		const userController = Container.get(UserController);

		let user = await authController.signup('test123', 'test123', {
			name: 'Test Testerson',
			email: 'test@gmail.com'
		} as any);
		await User.update(user.user.id, { role: Role.ADMIN });
		user = await authController.signup('test123', 'test123', {
			name: 'Exec User',
			email: 'exec@gmail.com'
		} as any);
		await User.update(user.user.id, { role: Role.EXEC });

		const users = await Promise.all(
			generateUsers(NUM_USERS).map(u =>
				authController.signup(u.password, u.password, u as any)
			)
		);

		await authController.signup('admin', 'admin', {
			name: 'admin',
			email: 'admin@gmail.com',
			password: 'admin',
			passwordConfirm: 'admin',
			role: Role.ADMIN
		} as any);
	} catch (error) {
		console.error('Error:', error);
	} finally {
		await server.stop();
	}
};

start();
