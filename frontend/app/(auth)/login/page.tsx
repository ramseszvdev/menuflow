'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSession, signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/auth';

export default function LoginPage() {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);
	const [formData, setFormData] = useState({
		email: '',
		password: '',
	});

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);

		try {
			const result = await signIn('credentials', {
				email: formData.email,
				password: formData.password,
				redirect: false,
			});

			if (!result || result.error) {
				throw new Error('Credenciales incorrectas');
			}

			const session = await getSession();
			if (!session?.accessToken) {
				throw new Error('La sesión no devolvió un token de acceso');
			}

			localStorage.setItem('token', session.accessToken);
			localStorage.setItem('user', JSON.stringify(session.user));
			toast.success('¡Bienvenido de nuevo!');
			router.push('/dashboard');
			router.refresh();
		} catch (error: unknown) {
			toast.error(getErrorMessage(error, 'Error al iniciar sesión'));
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="relative min-h-screen flex items-center justify-center bg-background bg-dot-grid p-4 overflow-hidden selection:bg-orange-500 selection:text-white">
			{/* 🌟 Resplandor ambiental de fondo (Glow radial) */}
			<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-87.5 w-125 bg-linear-to-tr from-orange-500/20 via-amber-500/15 to-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />

			<Card className="relative w-full max-w-md glass-card border-white/10 dark:border-white/10 shadow-2xl backdrop-blur-xl rounded-2xl overflow-hidden transition-all duration-300 hover:border-orange-500/30">
				{/* Barra superior con gradiente decorativo */}
				<div className="h-1.5 w-full bg-linear-to-r from-amber-500 via-orange-500 to-rose-500" />

				<CardHeader className="space-y-2 text-center pt-8 pb-4">
					<div className="inline-flex items-center justify-center gap-2 text-3xl font-black tracking-tight text-foreground mb-1">
						<span className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-2xl">
							🍽️
						</span>
						<span className="bg-linear-to-r from-orange-500 via-amber-500 to-orange-400 bg-clip-text text-transparent">
							MenuFlow
						</span>
					</div>
					<CardTitle className="text-2xl font-bold tracking-tight">
						¡Hola de nuevo!
					</CardTitle>
					<CardDescription className="text-muted-foreground text-sm">
						Ingresa tus credenciales para gestionar tu restaurante
					</CardDescription>
				</CardHeader>

				<form onSubmit={handleSubmit}>
					<CardContent className="space-y-5 px-6">
						<div className="space-y-2">
							<Label
								htmlFor="email"
								className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
							>
								Correo Electrónico:
							</Label>
							<div>
								<Input
									id="email"
									type="email"
									placeholder="ejemplo@restaurante.com"
									value={formData.email}
									onChange={(e) =>
										setFormData({
											...formData,
											email: e.target.value,
										})
									}
									required
									className="h-11 px-4 bg-background/50 border-white/10 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all rounded-xl placeholder:text-zinc-600 dark:placeholder:text-zinc-500 text-foreground"
								/>
							</div>
						</div>

						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<Label
									htmlFor="password"
									className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
								>
									Contraseña:
								</Label>
							</div>
							<Input
								id="password"
								type="password"
								placeholder="••••••••"
								value={formData.password}
								onChange={(e) =>
									setFormData({
										...formData,
										password: e.target.value,
									})
								}
								required
								className="h-11 bg-background/50 border-white/10 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all rounded-xl px-4"
							/>
						</div>
					</CardContent>

					<CardFooter className="flex flex-col space-y-4 px-6 pb-8 pt-2">
						<Button
							type="submit"
							disabled={isLoading}
							className="w-full h-11 bg-linear-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-semibold rounded-xl shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 cursor-pointer disabled:opacity-50"
						>
							{isLoading ? (
								<span className="flex items-center gap-2">
									<span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
									Iniciando sesión...
								</span>
							) : (
								'Ingresar al Panel →'
							)}
						</Button>

						<p className="text-sm text-muted-foreground text-center pt-2">
							¿Aún no tienes una cuenta?{' '}
							<Link
								href="/register"
								className="font-semibold text-orange-500 hover:text-orange-400 hover:underline transition-colors"
							>
								Crea una gratis
							</Link>
						</p>
					</CardFooter>
				</form>
			</Card>
		</div>
	);
}
