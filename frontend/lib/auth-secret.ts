type AuthSecretEnvironment = {
	NEXTAUTH_SECRET?: string;
	AUTH_SECRET?: string;
};

export function getRequiredNextAuthSecret(
	environment: AuthSecretEnvironment = process.env,
): string {
	const secret =
		environment.NEXTAUTH_SECRET?.trim() || environment.AUTH_SECRET?.trim();

	if (!secret) {
		throw new Error(
			'NEXTAUTH_SECRET or AUTH_SECRET must be configured before starting the frontend',
		);
	}

	return secret;
}
