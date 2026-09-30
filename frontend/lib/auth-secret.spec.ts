import assert from 'node:assert/strict';
import test from 'node:test';
// Node's built-in TypeScript test runner imports this source file directly.
// @ts-expect-error TypeScript's frontend config disallows .ts import suffixes.
import { getRequiredNextAuthSecret } from './auth-secret.ts';

test('uses NEXTAUTH_SECRET when configured', () => {
	assert.equal(
		getRequiredNextAuthSecret({
			NEXTAUTH_SECRET: '  deployment-secret  ',
			AUTH_SECRET: 'other-secret',
		}),
		'deployment-secret',
	);
});

test('supports AUTH_SECRET when NEXTAUTH_SECRET is absent', () => {
	assert.equal(
		getRequiredNextAuthSecret({ AUTH_SECRET: 'auth-secret' }),
		'auth-secret',
	);
});

test('fails explicitly when both secrets are absent or blank', () => {
	assert.throws(
		() => getRequiredNextAuthSecret({}),
		/NEXTAUTH_SECRET or AUTH_SECRET must be configured/,
	);
	assert.throws(
		() => getRequiredNextAuthSecret({ NEXTAUTH_SECRET: '  ', AUTH_SECRET: '' }),
		/NEXTAUTH_SECRET or AUTH_SECRET must be configured/,
	);
});
