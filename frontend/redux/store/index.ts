import createStoreFromServer from './server';
import createStoreFromClient from './client';

export default (initialState, options) => {
	if (options.isServer) {
		return createStoreFromServer(initialState, options);
	} else {
		return createStoreFromClient(initialState, options);
	}
};
