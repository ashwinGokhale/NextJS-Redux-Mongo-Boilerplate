import { createStore, applyMiddleware } from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension';
import { createLogger } from 'redux-logger';
import thunk from 'redux-thunk';
import getConfig from 'next/config';
// import { persistReducer } from 'redux-persist';
// import storage from 'redux-persist/lib/storage';
import rootReducer from '../reducers';
const { publicRuntimeConfig } = getConfig();

const enhancers = [];
const middlewares: any[] = [thunk];

if (publicRuntimeConfig.NODE_ENV !== 'production') {
	const logger = createLogger({
		predicate: (getState, action) => !/persist/.test(action.type)
	});
	middlewares.push(logger);
}
// const persistConfig = {
// 	key: 'data',
// 	storage,
// 	blacklist: ['flashState, sessionState']
// };
// const persistedReducer = persistReducer(persistConfig, rootReducer);

export default (initialState = {}, options) => {
	// return createStore(persistedReducer, initialState, composeWithDevTools(applyMiddleware(...middlewares)));
	return createStore(
		rootReducer,
		initialState,
		composeWithDevTools(applyMiddleware(...middlewares))
	);
};
