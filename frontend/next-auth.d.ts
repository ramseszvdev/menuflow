import { DefaultSession } from 'next-auth';
import { JWT } from 'next-auth/jwt';

// 1. Extendemos los tipos de la Sesión
declare module 'next-auth' {
	interface Session {
		user: {
			id: string;
			role: string;
			restaurantId?: string;
		} & DefaultSession['user'];
		accessToken?: string;
	}

	interface User {
		role?: string;
		restaurantId?: string;
		accessToken?: string;
	}
}

// 2. Extendemos el tipo del Token JWT
declare module 'next-auth/jwt' {
	interface JWT {
		id?: string;
		role?: string;
		restaurantId?: string;
		accessToken?: string;
	}
}
