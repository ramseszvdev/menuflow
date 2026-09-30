import type { AxiosError, AxiosInstance } from 'axios';
import { apiClient } from './api-client';

const api = apiClient as AxiosInstance;

export interface LoginCredentials {
	email: string;
	password: string;
}

export interface RegisterData {
	name: string;
	email: string;
	password: string;
	restaurantName: string;
	phone?: string;
}

export interface AuthResponse {
	token: string;
	accessToken: string;
	user: AuthUser;
}

export interface AuthUser {
	id: string;
	email: string;
	name: string | null;
	role: string;
}

export interface ApiResponse<T> {
	data: T;
}

export function getErrorMessage(error: unknown, fallback: string): string {
	if (error instanceof Error) {
		return error.message;
	}

	if (isAxiosError(error)) {
		const message = error.response?.data;
		if (typeof message === 'object' && message !== null && 'message' in message) {
			return typeof message.message === 'string' ? message.message : fallback;
		}
	}

	return fallback;
}

function isAxiosError(error: unknown): error is AxiosError<unknown> {
	return (
		typeof error === 'object' &&
		error !== null &&
		'isAxiosError' in error &&
		error.isAxiosError === true
	);
}

export const auth = {
	async login(credentials: LoginCredentials): Promise<AuthResponse> {
		const response = await api.post<ApiResponse<AuthResponse>>(
			'/auth/login',
			credentials,
		);

		const payload = response.data.data;
		const { token, user } = payload;

		localStorage.setItem('token', token);
		localStorage.setItem('user', JSON.stringify(user));

		return { ...payload, accessToken: token };
	},

	async register(data: RegisterData): Promise<AuthResponse> {
		const response = await api.post<ApiResponse<AuthResponse>>(
			'/auth/register',
			data,
		);

		const payload = response.data.data;
		const { token, user } = payload;

		localStorage.setItem('token', token);
		localStorage.setItem('user', JSON.stringify(user));

		return { ...payload, accessToken: token };
	},

	logout() {
		localStorage.removeItem('token');
		localStorage.removeItem('user');
		window.location.href = '/login';
	},

	getToken(): string | null {
		return localStorage.getItem('token');
	},

	getUser(): AuthUser | null {
		const user = localStorage.getItem('user');
		if (!user) {
			return null;
		}

		try {
			const parsed: unknown = JSON.parse(user);
			if (
				typeof parsed === 'object' &&
				parsed !== null &&
				'id' in parsed &&
				'email' in parsed &&
				'name' in parsed &&
				'role' in parsed &&
				typeof parsed.id === 'string' &&
				typeof parsed.email === 'string' &&
				(typeof parsed.name === 'string' || parsed.name === null) &&
				typeof parsed.role === 'string'
			) {
				return parsed as AuthUser;
			}
		} catch {
			localStorage.removeItem('user');
		}

		return null;
	},

	isAuthenticated(this: { getToken(): string | null }): boolean {
		return !!this.getToken();
	},
};
