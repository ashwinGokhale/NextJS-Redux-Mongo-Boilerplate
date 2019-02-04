import { getFromContainer } from 'routing-controllers';
import { errorRes } from '../utils';
import { createLogger } from '../utils/logger';
import { EmailService } from '../services/email.service';

const logger = createLogger('GlobalError');
const emailService = getFromContainer(EmailService);

export const globalError = (err, req, res, next) => {
	let { message, httpCode } = err;
	message = message || 'Whoops! Something went wrong!';
	httpCode = httpCode || 500;
	// Send an email if error is from server
	if (httpCode === 500) {
		logger.emerg('Unhandled exception:', err);
		emailService
			.sendErrorEmail(err, req.user)
			.then(() => logger.info('Email sent'))
			.catch(error => logger.error('Error sending email:', error));
		errorRes(res, httpCode, 'Whoops! Something went wrong!');
	} else {
		logger.error('Caught error:', message);
		errorRes(res, httpCode, message);
	}
};
