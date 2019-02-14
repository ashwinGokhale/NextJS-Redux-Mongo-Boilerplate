import createStoreFromServer from './server';
import createStoreFromClient from './client';
import { initialState as storeState } from '../reducers';

export default (initialState = storeState, options) => {
	if (process.browser) {
		return createStoreFromClient(initialState, options);
	} else {
		return createStoreFromServer(initialState, options);
	}
};
