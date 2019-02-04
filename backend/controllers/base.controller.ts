import { createLogger } from '../utils/logger';
import { Logger } from 'winston';

export class BaseController {
	readonly logger: Logger;
	constructor() {
		this.logger = createLogger(this);
	}
}
