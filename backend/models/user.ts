import { genSalt, compareSync, hash } from 'bcrypt';
import { IsEmail, Matches, IsNotEmpty } from 'class-validator';
import { Exclude, Expose } from 'class-transformer';
import { Role } from '../../shared/user.enums';
import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	AfterLoad,
	BeforeUpdate,
	CreateDateColumn,
	UpdateDateColumn,
	BaseEntity,
	BeforeInsert
} from 'typeorm';

@Exclude()
export class UserDto {
	@IsNotEmpty({ message: 'Please provide your first and last name' })
	@Matches(/([a-zA-Z']+ )+[a-zA-Z']+$/, { message: 'Please provide your first and last name' })
	@Expose()
	name: string;
	@IsNotEmpty({ message: 'Please provide a valid email address' })
	@IsEmail({}, { message: 'Please provide a valid email address' })
	@Expose()
	email: string;
	@Exclude()
	password: string;
}

@Entity()
export class User extends BaseEntity {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ nullable: false })
	name: string;

	@Column({ nullable: false, unique: true })
	email: string;

	@Column({ select: false, default: '', type: 'varchar' })
	password: string;

	@Column({ select: false, nullable: false, default: '' })
	resetPasswordToken?: string;

	@Column({ nullable: false, default: Role.USER, type: 'varchar' })
	role: Role;

	@CreateDateColumn()
	createdAt: Date;

	@UpdateDateColumn({ nullable: true })
	updatedAt?: Date;

	private tempPassword: string;

	@AfterLoad()
	private loadTempPassword() {
		this.tempPassword = this.password;
	}

	@BeforeInsert()
	@BeforeUpdate()
	private async encryptPassword() {
		if (this.tempPassword !== this.password) {
			const hashed = await hash(this.password, 10);
			this.password = hashed;
		}
	}

	comparePassword(password: string) {
		return password && compareSync(password, this.password);
	}
}
