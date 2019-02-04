import * as faker from 'faker';
import { ValidationError } from 'class-validator';

export const generateUser = () => {
	const first = faker.name.firstName();
	const last = faker.name.lastName();
	const domain = faker.internet.domainName();
	const email = faker.internet.email(first, last, domain);

	const password = faker.internet.password(8);
	return {
		name: `${first} ${last}`,
		email,
		graduationYear: faker.random.number({
			min: 1900,
			max: 2025
		}),
		password,
		passwordConfirm: password
	};
};

export const generateUsers = (num: number) => Array.from({ length: num }, generateUser);

export const getError = (errors: ValidationError[]) => Object.values(errors[0].constraints).pop();

export const sleep = (time: number) => new Promise(resolve => setTimeout(resolve, time));
