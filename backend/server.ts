import 'reflect-metadata';
import * as express from 'express';
import 'express-async-errors';
import * as cookieParser from 'cookie-parser';
import * as logger from 'morgan';
import * as mongoose from 'mongoose';
import * as passport from 'passport';
import * as cors from 'cors';
import * as helmet from 'helmet';
import * as yes from 'yes-https';
import * as next from 'next';
import { join } from 'path';
import { useExpressServer, useContainer } from 'routing-controllers';
import { Container } from 'typedi';
import { Logger } from 'winston';
import CONFIG from './config';
import passportMiddleWare, { extractUser } from './middleware/passport';
import { globalError } from './middleware/globalError';
import { SuccessInterceptor } from './interceptors/success.interceptor';
import { currentUserChecker, authorizationChecker } from './middleware/authentication';
import { createLogger } from './utils/logger';

const { NODE_ENV, DB } = CONFIG;

export default class Server {
	public static async createInstance() {
		const server = new Server();
		await server.setupMongo();
		return server;
	}
	public app: express.Application;
	public nextApp: next.Server;
	public mongoose: typeof mongoose;
	public logger: Logger;

	private constructor() {
		this.app = express();
		this.logger = createLogger(this);
		this.setup();
		this.nextApp = next({
			dev: NODE_ENV !== 'production',
			dir: join(__dirname + '/../frontend')
		});
	}

	public async initFrontend() {
		try {
			await this.nextApp.prepare();
			const handle = this.nextApp.getRequestHandler();
			this.app.get('*', (req, res) => {
				return handle(req, res);
			});
		} catch (error) {
			this.logger.error('Error setting up frontend:', error);
			throw error;
		}
	}

	private setup(): void {
		this.setupMiddleware();
		// Enable controllers in this.app
		useContainer(Container);
		this.app = useExpressServer(this.app, {
			cors: true,
			defaultErrorHandler: false,
			validation: true,
			controllers: [__dirname + '/controllers/*'],
			interceptors: [SuccessInterceptor],
			currentUserChecker,
			authorizationChecker
		});
		// Any unhandled errors will be caught in this middleware
		this.app.use(globalError);
	}

	private setupMiddleware() {
		const devLogger = logger('dev', { skip: r => r.url.startsWith('/_next') });
		const prodLogger = logger('tiny', { skip: r => r.url.startsWith('/_next') });
		this.app.use(helmet());
		// if (NODE_ENV === 'production') this.app.use(yes());
		if (NODE_ENV !== 'test')
			NODE_ENV !== 'production' ? this.app.use(devLogger) : this.app.use(prodLogger);
		this.app.use(express.json());
		this.app.use(express.urlencoded({ extended: true }));
		this.app.use(cookieParser());
		this.app.use(passportMiddleWare(passport).initialize());
		this.app.use(cors());
		this.app.use(extractUser());
	}

	private async setupMongo() {
		try {
			this.mongoose = await mongoose.connect(DB, {
				useNewUrlParser: true,
				useCreateIndex: true,
				useFindAndModify: false
			});
			this.mongoose.Promise = Promise;
			return this.mongoose;
		} catch (error) {
			this.logger.error('Error connecting to mongo:', error);
			throw error;
		}
	}
}
