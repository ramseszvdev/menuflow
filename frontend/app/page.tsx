'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
	LogOut,
	User as UserIcon,
	LayoutDashboard,
	Settings,
	Loader2,
	ArrowRight,
	CheckCircle,
	Utensils,
	Package,
	ShoppingCart,
	DollarSign,
	TrendingUp,
	Star,
	Shield,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';

export default function Home() {
	const [isVisible, setIsVisible] = useState(false);
	const router = useRouter();
	const { data: session, status } = useSession();

	useEffect(() => {
		setIsVisible(true);
	}, []);

	const getInitials = (name?: string | null) => {
		if (!name) return 'U';
		return name
			.split(' ')
			.map((n) => n[0])
			.join('')
			.toUpperCase()
			.slice(0, 3);
	};

	return (
		<div className="flex flex-col min-h-screen bg-background text-foreground selection:bg-orange-500 selection:text-white overflow-hidden">
			{/* Header/Navbar */}
			<header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-backdrop-filter:bg-background/60">
				<div className="container mx-auto px-4 flex h-16 items-center justify-between">
					<div className="flex items-center gap-2.5">
						<span className="p-1.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-xl">
							🍽️
						</span>
						<span className="text-xl font-black tracking-tight bg-linear-to-r from-orange-500 via-amber-500 to-orange-400 bg-clip-text text-transparent">
							MenuFlow
						</span>
					</div>

					<nav className="hidden md:flex items-center gap-8 text-sm font-medium">
						<Link
							href="#features"
							className="text-muted-foreground hover:text-orange-500 transition-colors"
						>
							Características
						</Link>
						<Link
							href="#pricing"
							className="text-muted-foreground hover:text-orange-500 transition-colors"
						>
							Precios
						</Link>
						<Link
							href="#testimonials"
							className="text-muted-foreground hover:text-orange-500 transition-colors"
						>
							Testimonios
						</Link>
					</nav>

					<div className="flex items-center gap-3">
						{status === 'loading' ? (
							<div className="flex items-center justify-center h-10 w-10">
								<Loader2 className="h-5 w-5 animate-spin text-orange-500" />
							</div>
						) : session?.user ? (
							/* 🟢 USUARIO LOGUEADO: Mostrar Avatar y Menú Desplegable con datos reales */
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										variant="ghost"
										className="relative h-12 w-12 rounded-full border border-orange-500/20 hover:bg-orange-500/10 focus-visible:ring-orange-500 cursor-pointer p-0"
									>
										<Avatar className="h-11 w-11">
											<AvatarImage
												src={session.user.image || ''}
												alt={session.user.name || 'Usuario'}
											/>
											<AvatarFallback className="bg-linear-to-br from-orange-500 to-amber-600 text-white font-bold">
												{getInitials(session.user.name)}
											</AvatarFallback>
										</Avatar>
									</Button>
								</DropdownMenuTrigger>

								<DropdownMenuContent
									className="w-56 glass-card border-white/10 dark:border-white/10 rounded-2xl p-2 shadow-2xl backdrop-blur-xl"
									align="end"
									forceMount
								>
									<DropdownMenuLabel className="font-normal p-2">
										<div className="flex flex-col space-y-1">
											<p className="text-sm font-bold text-foreground leading-none">
												{session.user.name || 'Usuario'}
											</p>
											<p className="text-xs text-muted-foreground leading-none truncate mt-1">
												{session.user.email}
											</p>
										</div>
									</DropdownMenuLabel>

									<DropdownMenuSeparator className="bg-border/50 my-1" />

									<DropdownMenuItem
										asChild
										className="cursor-pointer rounded-xl focus:bg-orange-500/10 focus:text-orange-500"
									>
										<Link
											href="/dashboard"
											className="flex items-center gap-2"
										>
											<LayoutDashboard className="h-4 w-4" />
											<span>Dashboard</span>
										</Link>
									</DropdownMenuItem>

									<DropdownMenuItem
										asChild
										className="cursor-pointer rounded-xl focus:bg-orange-500/10 focus:text-orange-500"
									>
										<Link
											href="/profile"
											className="flex items-center gap-2"
										>
											<UserIcon className="h-4 w-4" />
											<span>Mi Perfil</span>
										</Link>
									</DropdownMenuItem>

									<DropdownMenuSeparator className="bg-border/50 my-1" />

									<DropdownMenuItem
										onClick={() => signOut()}
										className="cursor-pointer rounded-xl text-rose-500 focus:bg-rose-500/10 focus:text-rose-500 font-medium"
									>
										<LogOut className="h-4 w-4 mr-2" />
										<span>Cerrar Sesión</span>
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						) : (
							/* 🔴 USUARIO NO LOGUEADO: Mostrar Botones de Login / Register */
							<>
								<Button
									onClick={() => router.push('/login')}
									variant="ghost"
									size="sm"
									className="font-medium hover:bg-orange-500/10 hover:text-orange-500 transition-colors rounded-xl cursor-pointer"
								>
									Iniciar Sesión
								</Button>
								<Button
									onClick={() => router.push('/register')}
									size="sm"
									className="bg-linear-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-semibold rounded-xl shadow-lg shadow-orange-500/20 hover:shadow-orange-500/35 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer"
								>
									Comenzar Gratis
								</Button>
							</>
						)}
					</div>
				</div>
			</header>

			{/* Hero Section */}
			<section className="relative overflow-hidden py-24 md:py-36 bg-background bg-dot-grid">
				<div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-125 w-175 bg-linear-to-tr from-orange-500/15 via-amber-500/10 to-indigo-500/5 blur-[140px] rounded-full pointer-events-none" />

				<div className="container relative mx-auto px-4">
					<div className="grid gap-12 lg:grid-cols-2 lg:gap-12 items-center">
						<div
							className={`space-y-6 transition-all duration-700 ${
								isVisible
									? 'opacity-100 translate-y-0'
									: 'opacity-0 translate-y-10'
							}`}
						>
							<Badge className="bg-orange-500/10 text-orange-500 border border-orange-500/20 px-4 py-1.5 text-xs font-semibold rounded-full tracking-wide">
								🔥 Lanzamiento 2026
							</Badge>

							<h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1]">
								Gestiona tu restaurante con{' '}
								<span className="bg-linear-to-r from-orange-500 via-amber-500 to-orange-400 bg-clip-text text-transparent block">
									inteligencia y control
								</span>
							</h1>

							<p className="text-lg text-muted-foreground leading-relaxed max-w-lg">
								Controla costos, optimiza menús y aumenta tus ganancias
								con la plataforma todo-en-uno diseñada para la
								gastronomía moderna.
							</p>

							<div className="flex flex-col sm:flex-row gap-4 pt-2">
								<Button
									onClick={() =>
										session
											? router.push('/dashboard')
											: router.push('/register')
									}
									size="lg"
									className="w-full sm:w-auto bg-linear-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold text-base px-8 h-12 rounded-xl shadow-xl shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer"
								>
									{session ? 'Ir al Dashboard' : 'Comenzar Gratis'}
									<ArrowRight className="ml-2 h-5 w-5" />
								</Button>
								<Link href="#features">
									<Button
										size="lg"
										variant="outline"
										className="w-full sm:w-auto border-white/10 hover:border-orange-500/40 hover:bg-orange-500/5 text-base px-8 h-12 rounded-xl backdrop-blur-sm transition-all duration-200 cursor-pointer"
									>
										Ver Demostración
									</Button>
								</Link>
							</div>

							<div className="flex flex-wrap items-center gap-6 text-xs sm:text-sm text-muted-foreground pt-4">
								<div className="flex items-center gap-2">
									<CheckCircle className="h-4 w-4 text-emerald-500" />
									<span>Sin tarjeta de crédito</span>
								</div>
								<div className="flex items-center gap-2">
									<CheckCircle className="h-4 w-4 text-emerald-500" />
									<span>14 días de prueba</span>
								</div>
								<div className="flex items-center gap-2">
									<CheckCircle className="h-4 w-4 text-emerald-500" />
									<span>Cancelación flexible</span>
								</div>
							</div>
						</div>

						{/* Mockup Dashboard Interactivo */}
						<div
							className={`relative transition-all duration-700 delay-200 ${
								isVisible
									? 'opacity-100 translate-y-0'
									: 'opacity-0 translate-y-10'
							}`}
						>
							<div className="relative rounded-2xl p-1 bg-linear-to-b from-orange-500/30 via-white/10 to-transparent shadow-2xl backdrop-blur-2xl">
								<div className="rounded-xl bg-card/90 border border-white/10 p-5 md:p-6 shadow-inner">
									<div className="space-y-5">
										<div className="flex items-center justify-between border-b border-border/50 pb-3">
											<div className="flex items-center gap-2">
												<div className="h-3 w-3 rounded-full bg-rose-500/80" />
												<div className="h-3 w-3 rounded-full bg-amber-500/80" />
												<div className="h-3 w-3 rounded-full bg-emerald-500/80" />
											</div>
											<span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
												MenuFlow Dashboard
											</span>
										</div>

										<div className="grid grid-cols-3 gap-3">
											<div className="bg-emerald-500/10 border border-emerald-500/20 p-3.5 rounded-xl text-center">
												<p className="text-2xl font-black text-emerald-500">
													42
												</p>
												<p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mt-0.5">
													Recetas
												</p>
											</div>
											<div className="bg-sky-500/10 border border-sky-500/20 p-3.5 rounded-xl text-center">
												<p className="text-2xl font-black text-sky-500">
													156
												</p>
												<p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mt-0.5">
													Ingredientes
												</p>
											</div>
											<div className="bg-orange-500/10 border border-orange-500/20 p-3.5 rounded-xl text-center">
												<p className="text-2xl font-black text-orange-500">
													68%
												</p>
												<p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mt-0.5">
													Margen
												</p>
											</div>
										</div>

										<div className="space-y-3 pt-2">
											<div className="space-y-1.5">
												<div className="flex justify-between text-xs font-medium">
													<span className="text-muted-foreground">
														Paella Valenciana
													</span>
													<span className="font-bold text-emerald-500">
														+45% rentabilidad
													</span>
												</div>
												<div className="w-full bg-muted/50 rounded-full h-2 overflow-hidden">
													<div
														className="bg-linear-to-r from-orange-500 to-amber-500 h-2 rounded-full"
														style={{ width: '75%' }}
													/>
												</div>
											</div>

											<div className="space-y-1.5">
												<div className="flex justify-between text-xs font-medium">
													<span className="text-muted-foreground">
														Gazpacho Andaluz
													</span>
													<span className="font-bold text-emerald-500">
														+32% rentabilidad
													</span>
												</div>
												<div className="w-full bg-muted/50 rounded-full h-2 overflow-hidden">
													<div
														className="bg-linear-to-r from-orange-500 to-amber-500 h-2 rounded-full"
														style={{ width: '62%' }}
													/>
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>

							<div className="absolute -top-4 -right-2 sm:-right-4 animate-bounce">
								<Badge className="bg-emerald-500 text-white font-bold border-0 px-3 py-1.5 shadow-lg shadow-emerald-500/30 rounded-xl hover:bg-emerald-400">
									🚀 +25% Ganancias
								</Badge>
							</div>
							<div className="absolute -bottom-4 -left-2 sm:-left-4 animate-bounce [animation-delay:1000ms]">
								<Badge className="bg-sky-500 text-white font-bold border-0 px-3 py-1.5 shadow-lg shadow-sky-500/30 rounded-xl hover:bg-sky-400">
									⚡ Ahorra 10h/semana
								</Badge>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Features Section */}
			<section
				id="features"
				className="py-24 relative border-t border-border/40 bg-muted/20"
			>
				<div className="container mx-auto px-4">
					<div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
						<Badge className="bg-orange-500/10 text-orange-500 border border-orange-500/20 px-4 py-1 text-xs font-semibold rounded-full uppercase tracking-wider">
							Características
						</Badge>
						<h2 className="text-3xl sm:text-4xl font-black tracking-tight">
							Todo lo que necesitas en un solo lugar
						</h2>
						<p className="text-muted-foreground text-base">
							Optimiza cada aspecto de tu restaurante con herramientas
							diseñadas para maximizar tu rentabilidad.
						</p>
					</div>

					<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
						{features.map((feature, index) => (
							<Card
								key={index}
								className="glass-card border-white/10 hover:border-orange-500/40 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-orange-500/5 rounded-2xl overflow-hidden group"
							>
								<CardHeader className="space-y-4">
									<div className="h-12 w-12 rounded-xl bg-linear-to-br from-orange-500/20 to-amber-500/10 border border-orange-500/30 flex items-center justify-center text-orange-500 group-hover:scale-110 group-hover:border-orange-500 transition-all duration-300">
										{feature.icon}
									</div>
									<CardTitle className="text-xl font-bold">
										{feature.title}
									</CardTitle>
									<CardDescription className="text-muted-foreground leading-relaxed">
										{feature.description}
									</CardDescription>
								</CardHeader>
							</Card>
						))}
					</div>
				</div>
			</section>

			{/* Stats Section */}
			<section className="py-16 border-y border-border/40 bg-background/50 backdrop-blur-sm">
				<div className="container mx-auto px-4">
					<div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
						<div className="space-y-1">
							<p className="text-4xl font-black bg-linear-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
								750K+
							</p>
							<p className="text-xs sm:text-sm font-medium text-muted-foreground">
								Restaurantes activos
							</p>
						</div>
						<div className="space-y-1">
							<p className="text-4xl font-black bg-linear-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
								$49
							</p>
							<p className="text-xs sm:text-sm font-medium text-muted-foreground">
								Planes desde / mes
							</p>
						</div>
						<div className="space-y-1">
							<p className="text-4xl font-black bg-linear-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
								68%
							</p>
							<p className="text-xs sm:text-sm font-medium text-muted-foreground">
								Ahorro de tiempo
							</p>
						</div>
						<div className="space-y-1">
							<p className="text-4xl font-black bg-linear-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
								4.9 ★
							</p>
							<p className="text-xs sm:text-sm font-medium text-muted-foreground">
								Calificación promedio
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* Testimonials Section */}
			<section id="testimonials" className="py-24 relative bg-muted/20">
				<div className="container mx-auto px-4">
					<div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
						<Badge className="bg-orange-500/10 text-orange-500 border border-orange-500/20 px-4 py-1 text-xs font-semibold rounded-full uppercase tracking-wider">
							Testimonios
						</Badge>
						<h2 className="text-3xl sm:text-4xl font-black tracking-tight">
							Lo que dicen nuestros clientes
						</h2>
						<p className="text-muted-foreground text-base">
							Dueños de restaurantes que ya están transformando su
							negocio con MenuFlow.
						</p>
					</div>

					<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
						{testimonials.map((testimonial, index) => (
							<Card
								key={index}
								className="glass-card border-white/10 hover:border-orange-500/30 transition-all duration-300 rounded-2xl flex flex-col"
							>
								<CardContent className="pt-6 flex-1 flex flex-col justify-between space-y-4">
									<div className="space-y-3">
										<div className="flex gap-1 text-amber-400">
											{[...Array(5)].map((_, i) => (
												<Star
													key={i}
													className="h-4 w-4 fill-amber-400"
												/>
											))}
										</div>
										<p className="text-muted-foreground text-sm leading-relaxed italic">
											"{testimonial.quote}"
										</p>
									</div>

									<div className="flex items-center gap-3 pt-4 border-t border-border/40">
										<div className="h-10 w-10 rounded-full bg-linear-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
											{testimonial.name.charAt(0)}
										</div>
										<div>
											<p className="font-bold text-sm leading-none">
												{testimonial.name}
											</p>
											<p className="text-xs text-muted-foreground mt-1">
												{testimonial.role}
											</p>
										</div>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</div>
			</section>

			{/* Banner CTA Final */}
			<section className="py-20 relative overflow-hidden">
				<div className="container mx-auto px-4">
					<div className="relative rounded-3xl bg-linear-to-r from-orange-600 via-amber-600 to-orange-500 p-8 sm:p-12 text-center text-white shadow-2xl overflow-hidden">
						<div className="absolute top-0 right-0 w-80 h-80 bg-white/10 blur-3xl rounded-full pointer-events-none" />

						<div className="relative z-10 max-w-2xl mx-auto space-y-6">
							<h2 className="text-3xl sm:text-4xl font-black tracking-tight">
								¿Listo para transformar tu restaurante?
							</h2>
							<p className="text-orange-100 text-base sm:text-lg">
								Únete a miles de restaurantes que ya están maximizando
								sus ganancias con MenuFlow.
							</p>

							<div>
								<Button
									onClick={() =>
										session
											? router.push('/dashboard')
											: router.push('/register')
									}
									size="lg"
									className="bg-white hover:bg-orange-50 text-orange-600 font-extrabold text-base px-8 h-12 rounded-xl shadow-xl hover:scale-[1.03] active:scale-[0.97] transition-all duration-200 cursor-pointer"
								>
									{session ? 'Ir al Dashboard' : 'Comenzar Gratis'}
									<ArrowRight className="ml-2 h-5 w-5" />
								</Button>
							</div>

							<p className="text-xs text-orange-200/90 font-medium">
								✅ Sin compromiso • 14 días de prueba • Cancelación
								flexible
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer className="border-t border-border/40 bg-background/80 py-12 text-sm text-muted-foreground">
				<div className="container mx-auto px-4">
					<div className="grid gap-8 md:grid-cols-4 pb-8 border-b border-border/40">
						<div className="space-y-3">
							<div className="flex items-center gap-2">
								<span className="p-1 rounded-lg bg-orange-500/10 border border-orange-500/20 text-lg">
									🍽️
								</span>
								<span className="text-lg font-bold text-foreground">
									MenuFlow
								</span>
							</div>
							<p className="text-xs leading-relaxed">
								Gestión inteligente y control total para restaurantes
								que quieren crecer.
							</p>
						</div>

						<div className="space-y-2">
							<h4 className="font-semibold text-foreground text-xs uppercase tracking-wider">
								Producto
							</h4>
							<ul className="space-y-2">
								<li>
									<Link
										href="#features"
										className="hover:text-orange-500 transition-colors"
									>
										Características
									</Link>
								</li>
								<li>
									<Link
										href="/pricing"
										className="hover:text-orange-500 transition-colors"
									>
										Precios
									</Link>
								</li>
								<li>
									<Link
										href="#"
										className="hover:text-orange-500 transition-colors"
									>
										Integraciones
									</Link>
								</li>
							</ul>
						</div>

						<div className="space-y-2">
							<h4 className="font-semibold text-foreground text-xs uppercase tracking-wider">
								Compañía
							</h4>
							<ul className="space-y-2">
								<li>
									<Link
										href="#"
										className="hover:text-orange-500 transition-colors"
									>
										Sobre nosotros
									</Link>
								</li>
								<li>
									<Link
										href="#"
										className="hover:text-orange-500 transition-colors"
									>
										Blog
									</Link>
								</li>
								<li>
									<Link
										href="#"
										className="hover:text-orange-500 transition-colors"
									>
										Contacto
									</Link>
								</li>
							</ul>
						</div>

						<div className="space-y-2">
							<h4 className="font-semibold text-foreground text-xs uppercase tracking-wider">
								Legal
							</h4>
							<ul className="space-y-2">
								<li>
									<Link
										href="#"
										className="hover:text-orange-500 transition-colors"
									>
										Términos
									</Link>
								</li>
								<li>
									<Link
										href="#"
										className="hover:text-orange-500 transition-colors"
									>
										Privacidad
									</Link>
								</li>
								<li>
									<Link
										href="#"
										className="hover:text-orange-500 transition-colors"
									>
										Cookies
									</Link>
								</li>
							</ul>
						</div>
					</div>

					<div className="pt-8 text-center text-xs">
						© {new Date().getFullYear()} MenuFlow. Todos los derechos
						reservados.
					</div>
				</div>
			</footer>
		</div>
	);
}

const features = [
	{
		icon: <Utensils className="h-6 w-6" />,
		title: 'Gestión de Recetas',
		description:
			'Crea y organiza tus recetas con costeo automático y control de porciones.',
	},
	{
		icon: <Package className="h-6 w-6" />,
		title: 'Control de Inventario',
		description:
			'Monitorea tu stock en tiempo real y recibe alertas de productos críticos.',
	},
	{
		icon: <ShoppingCart className="h-6 w-6" />,
		title: 'Menús Inteligentes',
		description:
			'Arma menús arrastrando recetas y visualiza costos y márgenes al instante.',
	},
	{
		icon: <DollarSign className="h-6 w-6" />,
		title: 'Análisis de Rentabilidad',
		description:
			'Descubre qué platos generan más ganancia y optimiza tu carta.',
	},
	{
		icon: <TrendingUp className="h-6 w-6" />,
		title: 'Integración con Delivery',
		description:
			'Sincroniza tus menús con Uber Eats y Glovo en un solo clic.',
	},
	{
		icon: <Shield className="h-6 w-6" />,
		title: 'Suscripciones y Pagos',
		description:
			'Sistema de facturación automática con Stripe y gestión de clientes.',
	},
];

const testimonials = [
	{
		quote: 'MenuFlow nos ayudó a reducir el tiempo de gestión de inventario en un 70%. Ahora podemos enfocarnos en lo que importa: cocinar.',
		name: 'María González',
		role: 'Chef Propietaria, La Cocina de María',
	},
	{
		quote: 'El costeo automático nos permitió descubrir que estábamos perdiendo dinero en 3 platos. Los ajustamos y aumentamos nuestras ganancias un 30%.',
		name: 'Carlos Rodríguez',
		role: 'Dueño, El Rincón Gastronómico',
	},
	{
		quote: 'La integración con Uber Eats es increíble. Actualizar el menú en todas las plataformas toma 2 minutos en lugar de 2 horas.',
		name: 'Ana Martínez',
		role: 'Gerente, Cafetería Central',
	},
];
