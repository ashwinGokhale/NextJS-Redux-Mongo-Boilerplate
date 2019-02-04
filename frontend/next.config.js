const withTypescript = require('@zeit/next-typescript');
const { publicRuntimeConfig, serverRuntimeConfig } = require('../backend/config/env-config');

module.exports = {
	publicRuntimeConfig,
	serverRuntimeConfig,
	...withTypescript()
};
