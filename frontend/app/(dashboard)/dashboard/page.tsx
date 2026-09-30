import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth-options';
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
	Utensils,
	Package,
	DollarSign,
	TrendingUp,
	ArrowUpRight,
	Plus,
	ChefHat,
	AlertCircle,
	Activity,
} from 'lucide-react';
import Link from 'next/link';

export default async function DashboardPage() {
	const session = await getServerSession(authOptions);

	if (!session) {
		redirect('/login');
	}

	// Datos mock de la Fase 1 / Fase 2
	const stats = {
		totalRecipes: 42,
		totalIngredients: 156,
		monthlyRevenue: 12450,
		profitMargin: 68,
	};

	return (
		<div className="space-y-8 p-1">
			{/* Saludo y Acciones Rápidas */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
				<div className="space-y-1">
					<h1 className="text-3xl font-bold tracking-tight text-foreground">
						Dashboard
					</h1>
					<p className="text-sm text-muted-foreground">
						Bienvenido de vuelta,{' '}
						<span className="font-semibold text-foreground">
							{session.user?.name || 'Administrador'}
						</span>
					</p>
				</div>

				<div className="flex items-center gap-3">
					<Button
						asChild
						variant="outline"
						size="sm"
						className="shadow-sm"
					>
						<Link href="/ingredients">
							<Package className="mr-2 h-4 w-4" />
							Añadir Insumo
						</Link>
					</Button>
					<Button
						asChild
						size="sm"
						className="bg-amber-400 transition-all hover:bg-orange-400 hover:text-white cursor-pointer"
					>
						<Link href="/recipes">
							<Plus className="mr-2 h-4 w-4" />
							Nueva Receta
						</Link>
					</Button>
				</div>
			</div>

			{/* Tarjetas Métricas KPI */}
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<Card className="shadow-sm border-border hover:border-primary/40 transition-colors">
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">
							Recetas Activas
						</CardTitle>
						<div className="rounded-md bg-orange-500/10 p-2 text-orange-600 dark:text-orange-400">
							<Utensils className="h-4 w-4" />
						</div>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-foreground">
							{stats.totalRecipes}
						</div>
						<p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
							<span className="text-emerald-600 dark:text-emerald-400 font-medium inline-flex items-center">
								+2 <ArrowUpRight className="h-3 w-3" />
							</span>
							esta semana
						</p>
					</CardContent>
				</Card>

				<Card className="shadow-sm border-border hover:border-primary/40 transition-colors">
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">
							Ingredientes en Stock
						</CardTitle>
						<div className="rounded-md bg-blue-500/10 p-2 text-blue-600 dark:text-blue-400">
							<Package className="h-4 w-4" />
						</div>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-foreground">
							{stats.totalIngredients}
						</div>
						<p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
							<span className="text-emerald-600 dark:text-emerald-400 font-medium inline-flex items-center">
								+5 <ArrowUpRight className="h-3 w-3" />
							</span>
							este mes
						</p>
					</CardContent>
				</Card>

				<Card className="shadow-sm border-border hover:border-primary/40 transition-colors">
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">
							Ingresos Estimados
						</CardTitle>
						<div className="rounded-md bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400">
							<DollarSign className="h-4 w-4" />
						</div>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-foreground">
							${stats.monthlyRevenue.toLocaleString()}
						</div>
						<p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
							<span className="text-emerald-600 dark:text-emerald-400 font-medium inline-flex items-center">
								+12% <ArrowUpRight className="h-3 w-3" />
							</span>
							vs mes anterior
						</p>
					</CardContent>
				</Card>

				<Card className="shadow-sm border-border hover:border-primary/40 transition-colors">
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">
							Margen Promedio
						</CardTitle>
						<div className="rounded-md bg-purple-500/10 p-2 text-purple-600 dark:text-purple-400">
							<TrendingUp className="h-4 w-4" />
						</div>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-foreground">
							{stats.profitMargin}%
						</div>
						<p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
							<span className="text-emerald-600 dark:text-emerald-400 font-medium inline-flex items-center">
								+3% <ArrowUpRight className="h-3 w-3" />
							</span>
							vs mes anterior
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Secciones Analíticas / Gráficos en preparación para la Fase 3 */}
			<div className="grid gap-6 md:grid-cols-2">
				<Card className="shadow-sm border-border">
					<CardHeader className="pb-3">
						<div className="flex items-center justify-between">
							<CardTitle className="text-lg font-semibold flex items-center gap-2">
								<ChefHat className="h-5 w-5 text-primary" />
								Recetas con Mayor Margen
							</CardTitle>
							<Badge variant="outline" className="text-xs">
								Fase 3
							</Badge>
						</div>
						<CardDescription>
							Rendimiento financiero por cada platillo en tu menú.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="flex flex-col items-center justify-center py-10 rounded-lg border border-dashed border-border/70 text-center bg-muted/20">
							<Activity className="h-10 w-10 text-muted-foreground/40 mb-2" />
							<p className="text-sm font-medium text-foreground">
								Análisis de margen en camino
							</p>
							<p className="text-xs text-muted-foreground max-w-xs mt-1">
								Completa la relación de insumos y recetas para desplegar
								el gráfico de rentabilidad.
							</p>
						</div>
					</CardContent>
				</Card>

				<Card className="shadow-sm border-border">
					<CardHeader className="pb-3">
						<div className="flex items-center justify-between">
							<CardTitle className="text-lg font-semibold flex items-center gap-2">
								<AlertCircle className="h-5 w-5 text-amber-500" />
								Ingredientes por Vencer / Reponer
							</CardTitle>
							<Badge variant="outline" className="text-xs">
								Fase 3
							</Badge>
						</div>
						<CardDescription>
							Control automático de stock crítico y fechas de caducidad.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="flex flex-col items-center justify-center py-10 rounded-lg border border-dashed border-border/70 text-center bg-muted/20">
							<Package className="h-10 w-10 text-muted-foreground/40 mb-2" />
							<p className="text-sm font-medium text-foreground">
								Alertas de inventario
							</p>
							<p className="text-xs text-muted-foreground max-w-xs mt-1">
								Vincula tus proveedores para recibir notificaciones
								cuando un insumo llegue a su stock mínimo.
							</p>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
