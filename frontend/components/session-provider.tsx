'use client';

import { useEffect } from 'react';
import { SessionProvider, useSession } from 'next-auth/react';

function SessionTokenSync() {
	const { data: session, status } = useSession();

	useEffect(() => {
		if (status === 'authenticated' && session.accessToken) {
			localStorage.setItem('token', session.accessToken);
			return;
		}

		if (status === 'unauthenticated') {
			localStorage.removeItem('token');
			localStorage.removeItem('user');
		}
	}, [session, status]);

	return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
	return (
		<SessionProvider>
			<SessionTokenSync />
			{children}
		</SessionProvider>
	);
}
