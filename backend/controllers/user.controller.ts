import { InjectRepository } from 'typeorm-typedi-extensions';
import {
	Controller,
	UseAfter,
	Get,
	Put,
	UseBefore,
	QueryParam,
	BadRequestError,
	Param,
	Body,
	CurrentUser,
	UnauthorizedError,
	Authorized
} from 'routing-controllers';
import { userMatches, multer } from '../utils';
import { ValidationMiddleware } from '../middleware/validation';
import { UserDto, User } from '../models/user';
import { Repository } from 'typeorm';
import { Role } from '../../shared/user.enums';

@Controller('/api/users')
@UseAfter(ValidationMiddleware)
export class UserController {
	@InjectRepository(User) userService: Repository<User>;
	// constructor(private userService: UserService) {
	// 	this.userService = getCustomRepository(UserService);
	// }

	@Get('/')
	@Authorized(Role.EXEC)
	async getAll(@QueryParam('sortBy') sortBy?: string, @QueryParam('order') order?: number) {
		order = order === 1 ? 1 : -1;
		sortBy = sortBy || 'createdAt';

		const contains = this.userService.metadata.columns.some(
			col => col.propertyName.toLowerCase() === sortBy.toLowerCase()
		);

		if (!contains) sortBy = 'createdAt';

		const results = await this.userService.find({
			order: { [sortBy]: order }
		});

		// const users = await this.userService.find();
		// console.log('Users:', users);

		return { users: results };
	}

	@Get('/:id')
	@Authorized(Role.EXEC)
	async getById(@Param('id') id: string) {
		const user = await this.userService.findOne(id);
		if (!user) throw new BadRequestError('User not found');
		return user;
	}

	@Put('/:id')
	@Authorized()
	@UseBefore(multer.any())
	async updateById(
		@Param('id') id: number,
		@Body() userDto: UserDto,
		@CurrentUser({ required: true }) currentUser: User
	) {
		let user = await this.userService.findOne(id);
		if (!user) throw new BadRequestError('User not found');
		if (!userMatches(currentUser, id))
			throw new UnauthorizedError('You are unauthorized to edit this profile');

		user = await this.userService.save({ id, ...userDto });
		return user;
	}
}
