import { Request, Response, NextFunction } from 'express';
import { ExpressErrorMiddlewareInterface, BadRequestError } from 'routing-controllers';
import { ValidationError } from 'class-validator';

export class ValidationMiddleware implements ExpressErrorMiddlewareInterface {
	error(err, req: Request, res: Response, next: NextFunction): void {
		if (err.errors && err.errors.length && err.errors[0] instanceof ValidationError) {
			const vErr: ValidationError = err.errors.pop();
			const cons = Object.values(vErr.constraints);
			if (cons.length) throw new BadRequestError(cons.pop());
			else next(err);
		}
		next(err);
	}
}
