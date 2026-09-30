'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
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
import { auth, getErrorMessage } from '@/lib/auth';

export default function RegisterPage() {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);
	const [formData, setFormData] = useState({
		name: '',
		email: '',
		password: '',
		confirmPassword: '',
		restaurantName: '',
		phone: '',
	});

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (formData.password !== formData.confirmPassword) {
			toast.error('Las contraseñas no coinciden');
			return;
		}

		setIsLoading(true);

		try {
			const { confirmPassword, ...registerData } = formData;
			const result = await auth.register(registerData);
			const session = await signIn('credentials', {
				email: registerData.email,
				password: registerData.password,
				redirect: false,
			});

			if (!session || session.error) {
				throw new Error('La cuenta se creó, pero no se pudo iniciar la sesión');
			}

			toast.success(`¡Bienvenido ${result.user.name ?? ''}!`);
			router.push('/dashboard');
			router.refresh();
		} catch (error: unknown) {
			toast.error(getErrorMessage(error, 'Error al registrarse'));
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="relative min-h-screen flex items-center justify-center bg-background bg-dot-grid p-4 md:p-8 overflow-hidden selection:bg-orange-500 selection:text-white">
			{/* 🌟 Resplandor ambiental de fondo (Glow radial) */}
			<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-112.5 w-150 bg-linear-to-tr from-orange-500/20 via-amber-500/15 to-indigo-500/10 blur-[130px] rounded-full pointer-events-none" />

			<Card className="relative w-full max-w-xl glass-card border-white/10 dark:border-white/10 shadow-2xl backdrop-blur-xl rounded-2xl overflow-hidden transition-all duration-300 hover:border-orange-500/30 my-8">
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
						Comienza tu prueba gratis
					</CardTitle>
					<CardDescription className="text-muted-foreground text-sm">
						Registra tu restaurante en menos de 1 minuto
					</CardDescription>
				</CardHeader>

				<form onSubmit={handleSubmit}>
					<CardContent className="space-y-4 px-6 md:px-8">
						{/* Fila 1: Nombre y Email */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label
									htmlFor="name"
									className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
								>
									Nombre completo
								</Label>
								<Input
									id="name"
									type="text"
									placeholder="Juan Pérez"
									value={formData.name}
									onChange={(e) =>
										setFormData({ ...formData, name: e.target.value })
									}
									required
									className="h-11 px-4 bg-background/50 border-white/10 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all rounded-xl placeholder:text-zinc-400 dark:placeholder:text-zinc-500 text-foreground"
								/>
							</div>

							<div className="space-y-2">
								<Label
									htmlFor="email"
									className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
								>
									Correo Electrónico
								</Label>
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
									className="h-11 px-4 bg-background/50 border-white/10 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all rounded-xl placeholder:text-zinc-400 dark:placeholder:text-zinc-500 text-foreground"
								/>
							</div>
						</div>

						{/* Fila 2: Restaurante y Teléfono */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label
									htmlFor="restaurantName"
									className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
								>
									Nombre del Restaurante
								</Label>
								<Input
									id="restaurantName"
									type="text"
									placeholder="Mi Restaurante"
									value={formData.restaurantName}
									onChange={(e) =>
										setFormData({
											...formData,
											restaurantName: e.target.value,
										})
									}
									required
									className="h-11 px-4 bg-background/50 border-white/10 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all rounded-xl placeholder:text-zinc-400 dark:placeholder:text-zinc-500 text-foreground"
								/>
							</div>

							<div className="space-y-2">
								<Label
									htmlFor="phone"
									className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
								>
									Teléfono{' '}
									<span className="text-muted-foreground/60 font-normal">
										(Opcional)
									</span>
								</Label>
								<Input
									id="phone"
									type="tel"
									placeholder="+1 234 567 890"
									value={formData.phone}
									onChange={(e) =>
										setFormData({
											...formData,
											phone: e.target.value,
										})
									}
									className="h-11 px-4 bg-background/50 border-white/10 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all rounded-xl placeholder:text-zinc-400 dark:placeholder:text-zinc-500 text-foreground"
								/>
							</div>
						</div>

						{/* Fila 3: Contraseña y Confirmar Contraseña */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label
									htmlFor="password"
									className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
								>
									Contraseña
								</Label>
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
									minLength={6}
									className="h-11 px-4 bg-background/50 border-white/10 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all rounded-xl placeholder:text-zinc-400 dark:placeholder:text-zinc-500 text-foreground"
								/>
							</div>

							<div className="space-y-2">
								<Label
									htmlFor="confirmPassword"
									className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
								>
									Confirmar Contraseña
								</Label>
								<Input
									id="confirmPassword"
									type="password"
									placeholder="••••••••"
									value={formData.confirmPassword}
									onChange={(e) =>
										setFormData({
											...formData,
											confirmPassword: e.target.value,
										})
									}
									required
									className="h-11 px-4 bg-background/50 border-white/10 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all rounded-xl placeholder:text-zinc-400 dark:placeholder:text-zinc-500 text-foreground"
								/>
							</div>
						</div>
					</CardContent>

					<CardFooter className="flex flex-col space-y-4 px-6 md:px-8 pb-8 pt-4">
						<Button
							type="submit"
							disabled={isLoading}
							className="w-full h-11 bg-linear-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-semibold rounded-xl shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 cursor-pointer disabled:opacity-50"
						>
							{isLoading ? (
								<span className="flex items-center gap-2">
									<span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
									Creando tu cuenta...
								</span>
							) : (
								'Crear Mi Cuenta Gratis →'
							)}
						</Button>

						<p className="text-sm text-muted-foreground text-center pt-1">
							¿Ya tienes una cuenta?{' '}
							<Link
								href="/login"
								className="font-semibold text-orange-500 hover:text-orange-400 hover:underline transition-colors"
							>
								Inicia sesión aquí
							</Link>
						</p>
					</CardFooter>
				</form>
			</Card>
		</div>
	);
}
