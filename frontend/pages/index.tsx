import React from 'react';
import Link from 'next/link';

const Index = () => {
	return (
		<div>
			Home Page
			<br />
			<Link href="/private">
				<button>Private</button>
			</Link>
		</div>
	);
};

export default Index;
