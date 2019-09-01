import React from 'react';
import Link from 'next/link';

export const HomePage = () => {
	return (
		<div>
			<div>
				<h3>Home Page</h3>
			</div>
			<br />
			<Link href="/private">
				<button>Private</button>
			</Link>
		</div>
	);
};
