import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { buildCheckoutReturnUrls } from './checkout-return-url';

describe('buildCheckoutReturnUrls', () => {
  const frontendUrl = 'https://app.menuflow.example';

  it('uses frontend.url for the default return destinations', () => {
    expect(buildCheckoutReturnUrls(frontendUrl)).toEqual({
      success: 'https://app.menuflow.example/dashboard?success=true',
      cancel: 'https://app.menuflow.example/pricing?canceled=true',
    });
  });

  it('accepts configured-origin URLs and relative paths', () => {
    expect(
      buildCheckoutReturnUrls(
        frontendUrl,
        'https://app.menuflow.example/billing/success',
        '/billing/cancel',
      ),
    ).toEqual({
      success: 'https://app.menuflow.example/billing/success',
      cancel: 'https://app.menuflow.example/billing/cancel',
    });
  });

  it.each([
    'https://attacker.example/return',
    '//attacker.example/return',
    'http://app.menuflow.example/return',
    'javascript:alert(1)',
    'https://user@app.menuflow.example/return',
    'https://[invalid',
  ])('rejects an unsafe success URL: %s', (successUrl) => {
    expect(() => buildCheckoutReturnUrls(frontendUrl, successUrl)).toThrow(
      BadRequestException,
    );
  });

  it('rejects external cancel URLs', () => {
    expect(() =>
      buildCheckoutReturnUrls(
        frontendUrl,
        undefined,
        'https://attacker.example/return',
      ),
    ).toThrow(BadRequestException);
  });

  it('allows HTTP only for a loopback frontend configured for local development', () => {
    expect(
      buildCheckoutReturnUrls('http://localhost:3000', '/success'),
    ).toEqual({
      success: 'http://localhost:3000/success',
      cancel: 'http://localhost:3000/pricing?canceled=true',
    });
  });

  it('rejects an insecure non-loopback frontend configuration', () => {
    expect(() =>
      buildCheckoutReturnUrls('http://app.menuflow.example'),
    ).toThrow(InternalServerErrorException);
  });
});
