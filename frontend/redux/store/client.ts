import { createStore, applyMiddleware, compose } from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension';
import { createLogger } from 'redux-logger';
import thunk from 'redux-thunk';
import getConfig from 'next/config';
// import { persistReducer } from 'redux-persist';
// import storage from 'redux-persist/lib/storage';
import rootReducer from '../reducers';
const { publicRuntimeConfig } = getConfig();

const middleware: any[] = [thunk];

if (publicRuntimeConfig.NODE_ENV !== 'production') {
	const logger = createLogger({
		predicate: (getState, action) => !/persist/.test(action.type)
	});
	middleware.push(logger);
}
// const persistConfig = {
// 	key: 'data',
// 	storage,
// 	blacklist: ['flashState, sessionState']
// };
// const persistedReducer = persistReducer(persistConfig, rootReducer);

const enhancer =
	publicRuntimeConfig.NODE_ENV !== 'production'
		? composeWithDevTools(applyMiddleware(...middleware))
		: compose(applyMiddleware(...middleware));

export default (initialState, options) => {
	return createStore(rootReducer, initialState, enhancer);
};
