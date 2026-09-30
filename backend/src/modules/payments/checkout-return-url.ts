import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';

function isLoopbackHostname(hostname: string): boolean {
  return (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname === '127.0.0.1' ||
    hostname === '[::1]'
  );
}

export function buildCheckoutReturnUrls(
  frontendUrl: string,
  successUrl?: string,
  cancelUrl?: string,
): { success: string; cancel: string } {
  let frontend: URL;
  try {
    frontend = new URL(frontendUrl);
  } catch {
    throw new InternalServerErrorException(
      'La URL del frontend no está configurada correctamente',
    );
  }

  const isHttp = frontend.protocol === 'http:';
  if (
    (frontend.protocol !== 'https:' &&
      !(isHttp && isLoopbackHostname(frontend.hostname))) ||
    frontend.username ||
    frontend.password
  ) {
    throw new InternalServerErrorException(
      'La URL del frontend no está configurada correctamente',
    );
  }

  const trustedOrigin = frontend.origin;
  const resolveUrl = (value: string | undefined, fallback: string): string => {
    if (!value?.trim()) {
      return new URL(fallback, trustedOrigin).toString();
    }

    let candidate: URL;
    try {
      candidate = new URL(value, trustedOrigin);
    } catch {
      throw new BadRequestException('La URL de retorno no es válida');
    }

    if (
      candidate.origin !== trustedOrigin ||
      (candidate.protocol !== 'https:' && candidate.protocol !== 'http:') ||
      candidate.username ||
      candidate.password
    ) {
      throw new BadRequestException(
        'La URL de retorno debe pertenecer al frontend configurado',
      );
    }

    return candidate.toString();
  };

  return {
    success: resolveUrl(successUrl, '/dashboard?success=true'),
    cancel: resolveUrl(cancelUrl, '/pricing?canceled=true'),
  };
}
