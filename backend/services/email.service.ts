import * as jwt from 'jsonwebtoken';
import * as sendGrid from '@sendgrid/mail';
import CONFIG from '../config';
import { IUserModel, UserDto } from '../models/user';
import { Service } from 'typedi';

sendGrid.setApiKey(CONFIG.SENDGRID_KEY);

@Service('emailService')
export class EmailService {
	async sendResetEmail(member: IUserModel) {
		const token = jwt.sign({ id: member._id }, CONFIG.SECRET, {
			expiresIn: '2 days'
		});
		member.resetPasswordToken = token;
		await member.save();

		const url =
			CONFIG.NODE_ENV !== 'production'
				? `http://localhost:${CONFIG.PORT}`
				: 'https://purduehackers.com';

		return sendGrid.send({
			templateId: 'd-850d406dbbf240bc9f53f455ed975321',
			from: `"${CONFIG.ORG_NAME}" <${CONFIG.EMAIL}>`,
			to: member.email,
			dynamicTemplateData: {
				name: member.name,
				url,
				token
			}
		} as any);
	}

	async sendAccountCreatedEmail(member: IUserModel) {
		const token = jwt.sign({ id: member._id }, CONFIG.SECRET, {
			expiresIn: '2 days'
		});
		member.resetPasswordToken = token;
		await member.save();

		const url =
			CONFIG.NODE_ENV !== 'production'
				? `http://localhost:${CONFIG.PORT}`
				: 'https://purduehackers.com';

		return await sendGrid.send({
			templateId: 'd-0bba1a0346c24bd69a46d81d2e950e55',
			from: `"${CONFIG.ORG_NAME}" <${CONFIG.EMAIL}>`,
			to: member.email,
			dynamicTemplateData: {
				name: member.name,
				url,
				token
			}
		} as any);
	}

	async sendErrorEmail(error: Error, user?: UserDto) {
		return sendGrid.send({
			templateId: 'd-9fbbdf1f9c90423a80d69b83885eefa8',
			from: `"${CONFIG.ORG_NAME}" <${CONFIG.EMAIL}>`,
			to: CONFIG.EMAIL,
			dynamicTemplateData: {
				timestamp: new Date(Date.now()).toLocaleString(),
				message: error.message.replace(/\n/g, '<br>'),
				stack: error.stack.replace(/\n/g, '<br>&emsp;'),
				user
			}
		} as any);
	}
}
