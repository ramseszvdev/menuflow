import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getRequiredNextAuthSecret } from './auth-secret';

const backendUrl =
	process.env.BACKEND_URL ||
	process.env.NEXT_PUBLIC_BACKEND_URL ||
	process.env.NEXT_PUBLIC_API_URL ||
	'http://localhost:3001';

const nextAuthSecret = getRequiredNextAuthSecret();

export const authOptions: NextAuthOptions = {
	secret: nextAuthSecret,
	session: { strategy: 'jwt' },
	providers: [
		CredentialsProvider({
			name: 'Credentials',
			credentials: {
				email: { label: 'Email', type: 'email' },
				password: { label: 'Password', type: 'password' },
			},
			async authorize(credentials) {
				if (!credentials?.email || !credentials.password) {
					return null;
				}

				try {
					const response = await fetch(`${backendUrl}/auth/login`, {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							email: credentials.email,
							password: credentials.password,
						}),
					});

					const body: unknown = await response.json();
					if (!response.ok) {
						return null;
					}

					const payload =
						typeof body === 'object' &&
						body !== null &&
						'data' in body &&
						typeof body.data === 'object' &&
						body.data !== null
							? body.data
							: body;

					if (
						typeof payload !== 'object' ||
						payload === null ||
						!('user' in payload) ||
						!('token' in payload) ||
						typeof payload.user !== 'object' ||
						payload.user === null ||
						!('id' in payload.user) ||
						typeof payload.user.id !== 'string' ||
						typeof payload.token !== 'string'
					) {
						return null;
					}

					const restaurantId =
						'restaurant' in payload &&
						typeof payload.restaurant === 'object' &&
						payload.restaurant !== null &&
						'id' in payload.restaurant &&
						typeof payload.restaurant.id === 'string'
							? payload.restaurant.id
							: undefined;

					return {
						id: payload.user.id,
						email:
							'email' in payload.user &&
							typeof payload.user.email === 'string'
								? payload.user.email
								: credentials.email,
						name:
							'name' in payload.user &&
							(typeof payload.user.name === 'string' ||
								payload.user.name === null)
								? payload.user.name
								: null,
						role:
							'role' in payload.user &&
							typeof payload.user.role === 'string'
								? payload.user.role
								: undefined,
						restaurantId,
						accessToken: payload.token,
					};
				} catch {
					return null;
				}
			},
		}),
	],
	callbacks: {
		async jwt({ token, user }) {
			if (user) {
				token.id = user.id;
				token.role = user.role;
				token.restaurantId = user.restaurantId;
				token.accessToken = user.accessToken;
			}

			return token;
		},
		async session({ session, token }) {
			if (session.user) {
				session.user.id = token.id ?? '';
				session.user.role = token.role ?? '';
				session.user.restaurantId = token.restaurantId;
			}

			session.accessToken = token.accessToken;
			return session;
		},
	},
};
