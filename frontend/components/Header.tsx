import React from 'react';
import Link from 'next/link';

const Header = ({ token }) => {
	console.log('Rendering Header:', token);
	return (
		<div>
			<Link href="/">
				<a>Home</a>
			</Link>{' '}
			|{' '}
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
