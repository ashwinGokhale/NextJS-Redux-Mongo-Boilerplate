require('dotenv').config();

const env = process.env;

const sharedConfig = {
	PORT: env.PORT || 5000,
	TRACKING_ID: env.TRACKING_ID || 'tracking id'
};

const serverRuntimeConfig = {
	DB: env.DB || 'mongodb://localhost:27017/mydb',
	EMAIL: env.EMAIL || 'my@email.com',
	EXPIRES_IN: env.EXPIRES_IN || '7 days',
	GC_BUCKET: env.GC_BUCKET || 'mybucket',
	GC_CLIENT_EMAIL: env.GC_CLIENT_EMAIL || 'my@clientemail.com',
	GC_PRIVATE_KEY: env.GC_PRIVATE_KEY || 'myprivatekey',
	GC_PROJECT_ID: env.GC_PROJECT_ID || 'myprojectid',
	NODE_ENV: env.NODE_ENV || 'development',
	ORG_NAME: env.ORG_NAME || 'myorgname',
	REDIS_URL: env.REDIS_URL || 'redis://localhost:6379',
	SECRET: env.SECRET || 'my-secret',
	SENDGRID_KEY: env.SENDGRID_KEY || 'mysendgridkey',
	...sharedConfig
};

const publicRuntimeConfig = {
	API_URL: env.API_URL ? env.API_URL : `http://localhost:${sharedConfig.PORT}/api`,
	NODE_ENV: env.NODE_ENV || 'development',
	...sharedConfig
};

module.exports = {
	publicRuntimeConfig,
	serverRuntimeConfig
};
