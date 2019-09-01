import React from 'react';
import Link from 'next/link';
import { Role } from '../../../shared/user.enums';
import { roleMatches } from '../../utils/session';

interface Props {
	token?: string;
	role?: Role;
}

const Header = ({ token, role }: Props) => {
	return (
		<div>
			<Link href="/">
				<a>Home</a>
			</Link>{' '}
			|{' '}
			{role && roleMatches(role, Role.EXEC) && (
				<>
					<Link href="/private">
						<a>Private</a>
					</Link>{' '}
					|{' '}
				</>
			)}
			{token && (
				<Link href="/logout">
					<a>Logout</a>
				</Link>
			)}
			{!token && (
				<>
					<Link href="/login">
						<a>Login</a>
					</Link>{' '}
					|{' '}
					<Link href="/signup">
						<a>Signup</a>
					</Link>
				</>
			)}
		</div>
	);
};

export default Header;
