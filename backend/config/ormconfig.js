const { join } = require('path');
const { serverRuntimeConfig } = require('./env-config');

const rootDir = join(__dirname, '..');

/** @type {import('typeorm').ConnectionOptions} */
const commmonConfig = {
	synchronize: true,
	logging: false,
	entities: [`${rootDir}/models/*{.ts,.js}`],
	migrations: [`${rootDir}/migrations/*{.ts,.js}`],
	subscribers: [`${rootDir}/subscribers/*{.ts,.js}`],
	cli: {
		entitiesDir: `backend/models`,
		migrationsDir: `backend/migrations`,
		subscribersDir: `backend/subscribers`
	}
};

/** @type {import('typeorm').ConnectionOptions} */
const defaultConfig = {
	...commmonConfig,
	name: 'default',
	url: serverRuntimeConfig.DATABASE_URL,
	type: serverRuntimeConfig.TYPEORM_CONNECTION
};

/** @type {import('typeorm').ConnectionOptions} */
const test = {
	...commmonConfig,
	dropSchema: true,
	synchronize: true,
	name: 'default',
	type: 'sqlite',
	database: ':memory:'
};

const config = serverRuntimeConfig.NODE_ENV === 'test' ? test : defaultConfig;

module.exports = config;
