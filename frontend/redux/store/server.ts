import { createStore } from 'redux';
import reducers from '../reducers';

export default (initialState, options) => {
	return createStore(reducers, initialState);
};
