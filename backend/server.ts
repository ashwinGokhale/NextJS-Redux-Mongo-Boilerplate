import 'reflect-metadata';
import * as express from 'express';
import 'express-async-errors';
import { getFromContainer, MetadataStorage } from 'class-validator';
import { validationMetadatasToSchemas } from 'class-validator-jsonschema';
import * as cookieParser from 'cookie-parser';
import * as cors from 'cors';
import * as helmet from 'helmet';
import { createServer as createHttpServer, Server as HTTPServer } from 'http';
import * as logger from 'morgan';
import { AddressInfo } from 'net';
import * as next from 'next';
import { OpenAPIObject } from 'openapi3-ts';
import { join } from 'path';
import { Logger } from 'pino';
import { getMetadataArgsStorage, useContainer, useExpressServer } from 'routing-controllers';
import { createConnection, Connection, useContainer as useTypeORMContainer } from 'typeorm';
import { routingControllersToSpec } from 'routing-controllers-openapi';
import * as swaggerUI from 'swagger-ui-express';
import { Container } from 'typedi';
import * as yes from 'yes-https';
import CONFIG from './config';
import * as ORMCONFIG from './config/ormconfig.js';
import { SuccessInterceptor } from './interceptors/success.interceptor';
import { authorizationChecker, currentUserChecker } from './middleware/authentication';
import { globalError } from './middleware/globalError';
import { ValidationMiddleware } from './middleware/validation';
import { multer } from './utils';
import { createLogger } from './utils/logger';

const routingControllerOptions = {
	cors: true,
	defaultErrorHandler: false,
	validation: true,
	controllers: [__dirname + '/controllers/*'],
	interceptors: [SuccessInterceptor],
	currentUserChecker,
	authorizationChecker,
	middlewares: [ValidationMiddleware]
};

export default class Server {
	public static async createInstance() {
		const server = new Server();
		await server.setupDatabase();
		return server;
	}

	public app: express.Application;
	public httpServer: HTTPServer;
	public nextApp: next.Server;
	public connection: Connection;
	public logger: Logger;
	public spec: OpenAPIObject;

	private constructor() {
		this.app = express();
		this.logger = createLogger(this);
		this.setup();
		this.nextApp = next({
			dev: CONFIG.NODE_ENV === 'development',
			dir: join(__dirname, '/../frontend')
		});
	}

	public async initFrontend() {
		try {
			await this.nextApp.prepare();
			const handle = this.nextApp.getRequestHandler();
			if (CONFIG.NODE_ENV === 'production') {
				this.app.use(
					'/service-worker.js',
					express.static('frontend/.next/service-worker.js')
				);
			} else {
				this.app.use('/service-worker.js', express.static('frontend/service-worker.js'));
			}
			this.app.use('/manifest.json', express.static('frontend/static/manifest.json'));
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
		useTypeORMContainer(Container);

		this.app = useExpressServer(this.app, routingControllerOptions);

		// Any unhandled errors will be caught in this middleware
		this.app.use(globalError);
		this.setupSwagger();

		this.httpServer = createHttpServer(this.app);
	}

	private setupMiddleware() {
		this.app.use(helmet());
		if (CONFIG.REDIRECT_HTTPS) this.app.use(yes());
		if (CONFIG.NODE_ENV !== 'test') {
			const logFormat = CONFIG.NODE_ENV !== 'production' ? 'dev' : 'tiny';
			this.app.use(logger(logFormat, { skip: r => r.url.startsWith('/_next') }));
		}
		this.app.use(express.json());
		this.app.use(express.urlencoded({ extended: true }));
		this.app.use(cookieParser());
		this.app.use(cors());
		this.app.use(multer.any());
	}

	private async setupDatabase() {
		try {
			this.connection = await createConnection(ORMCONFIG);
		} catch (error) {
			this.logger.error('Error connecting to database:', { err: error });
			throw error;
		}
	}

	private setupSwagger() {
		const storage = getMetadataArgsStorage();
		const metadatas = (getFromContainer(MetadataStorage) as any).validationMetadatas;
		const schemas = validationMetadatasToSchemas(metadatas, {
			refPointerPrefix: '#/components/schemas'
		});

		this.spec = routingControllersToSpec(storage, routingControllerOptions, {
			components: { schemas },
			info: { title: 'Hello World', version: '0.0.1' },
			security: [
				{
					bearerAuth: []
				}
			]
		});
		this.app.use('/api/docs', swaggerUI.serve, swaggerUI.setup(this.spec));
	}

	public async start() {
		await this.initFrontend();

		this.httpServer.listen(CONFIG.PORT, () => {
			CONFIG.PORT = (this.httpServer.address() as AddressInfo).port;
			this.logger.info('CONFIG:', CONFIG);
			this.logger.info(`Listening on port: ${CONFIG.PORT}`);
		});

		// Graceful shutdown
		process.on('SIGTERM', async () => {
			// await this.mongoose.disconnect();
			// await new Promise((resolve, reject) =>
			// 	this.httpServer.close(err => (err ? reject(err) : resolve()))
			// );
			await this.stop();
			process.exit(0);
		});

		return this;
	}

	public async stop() {
		if (this.connection) {
			await this.connection.close();
		}
		if (this.httpServer) {
			await new Promise((resolve, reject) =>
				this.httpServer.close(err => (err ? reject(err) : resolve()))
			);
		}
		return this;
	}
}
