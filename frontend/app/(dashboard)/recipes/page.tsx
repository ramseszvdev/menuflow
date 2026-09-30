'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
	Plus,
	Clock,
	ChefHat,
	AlertTriangle,
	Loader2,
	DollarSign,
	Utensils,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { getErrorMessage, type ApiResponse } from '@/lib/auth';

interface Recipe {
	id: string;
	name: string;
	description: string | null;
	sellingPrice: number;
	preparationTime: number | null;
}

interface RecipeForm {
	name: string;
	description: string;
	sellingPrice: string;
	preparationTime: string;
}

const initialForm: RecipeForm = {
	name: '',
	description: '',
	sellingPrice: '',
	preparationTime: '',
};

export default function RecipesPage() {
	const [form, setForm] = useState<RecipeForm>(initialForm);
	const [open, setOpen] = useState(false);
	const queryClient = useQueryClient();
	const { data: session, status } = useSession();
	const restaurantId = session?.user.restaurantId;

	const {
		data: recipes = [],
		isLoading,
		isError,
		error,
	} = useQuery<Recipe[]>({
		queryKey: ['recipes', restaurantId],
		queryFn: async () => {
			const response =
				await apiClient.get<ApiResponse<Recipe[]>>('/recipes');
			return response.data.data ?? response.data;
		},
		enabled: status === 'authenticated' && Boolean(restaurantId),
	});

	const createRecipe = useMutation({
		mutationFn: (data: RecipeForm) =>
			apiClient.post('/recipes', {
				name: data.name,
				description: data.description || undefined,
				sellingPrice: Number(data.sellingPrice),
				preparationTime: data.preparationTime
					? Number(data.preparationTime)
					: undefined,
				ingredients: [],
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['recipes', restaurantId] });
			setForm(initialForm);
			setOpen(false);
			toast.success('Receta creada con éxito');
		},
		onError: (error: unknown) =>
			toast.error(getErrorMessage(error, 'No se pudo crear la receta')),
	});

	if (status === 'loading') {
		return (
			<div className="flex h-64 items-center justify-center space-x-2 text-muted-foreground">
				<Loader2 className="h-6 w-6 animate-spin text-primary" />
				<p>Cargando recetas de MenuFlow...</p>
			</div>
		);
	}

	if (!restaurantId) {
		return (
			<div className="flex h-64 flex-col items-center justify-center space-y-3 rounded-xl border border-dashed p-8 text-center bg-card">
				<AlertTriangle className="h-10 w-10 text-amber-500" />
				<h2 className="text-xl font-semibold">Restaurante no detectado</h2>
				<p className="text-sm text-muted-foreground max-w-sm">
					No se encontró un restaurante asociado a tu cuenta. Configura tu
					perfil antes de añadir recetas.
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-8 p-1">
			{/* Encabezado */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="space-y-1">
					<div className="flex items-center gap-2">
						<div className="rounded-lg bg-primary/10 p-2 text-primary">
							<Utensils className="h-6 w-6" />
						</div>
						<h1 className="text-3xl font-bold tracking-tight text-foreground">
							Recetas
						</h1>
					</div>
					<p className="text-sm text-muted-foreground pl-11">
						Define tus platos, fija los precios de venta y controla
						tiempos de preparación.
					</p>
				</div>

				<Dialog open={open} onOpenChange={setOpen}>
					<DialogTrigger asChild>
						<Button
							size="lg"
							className="bg-amber-400 transition-all hover:bg-orange-400 hover:text-white cursor-pointer"
						>
							<Plus className="mr-2 h-5 w-5" />
							Nueva receta
						</Button>
					</DialogTrigger>
					<DialogContent className="sm:max-w-125">
						<DialogHeader>
							<DialogTitle>Añadir Receta</DialogTitle>
							<DialogDescription>
								Crea un nuevo platillo para tu menú con su costo e
								información de preparación.
							</DialogDescription>
						</DialogHeader>
						<form
							className="space-y-4 pt-2"
							onSubmit={(event) => {
								event.preventDefault();
								createRecipe.mutate(form);
							}}
						>
							<div className="space-y-2">
								<Label htmlFor="recipe-name">Nombre de la receta</Label>
								<Input
									id="recipe-name"
									placeholder="Ej. Hamburguesa Gourmet Trufada"
									required
									value={form.name}
									onChange={(event) =>
										setForm({ ...form, name: event.target.value })
									}
								/>
							</div>

							<div className="grid grid-cols-2 gap-3">
								<div className="space-y-2">
									<Label htmlFor="recipe-price">
										Precio de venta ($)
									</Label>
									<Input
										id="recipe-price"
										type="number"
										min="0"
										step="0.01"
										placeholder="0.00"
										required
										value={form.sellingPrice}
										onChange={(event) =>
											setForm({
												...form,
												sellingPrice: event.target.value,
											})
										}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="recipe-time">Tiempo (min)</Label>
									<Input
										id="recipe-time"
										type="number"
										min="0"
										placeholder="Ej. 20"
										value={form.preparationTime}
										onChange={(event) =>
											setForm({
												...form,
												preparationTime: event.target.value,
											})
										}
									/>
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor="recipe-description">
									Descripción (opcional)
								</Label>
								<Input
									id="recipe-description"
									placeholder="Breve descripción o notas del platillo..."
									value={form.description}
									onChange={(event) =>
										setForm({
											...form,
											description: event.target.value,
										})
									}
								/>
							</div>

							<DialogFooter className="pt-4">
								<Button
									type="submit"
									className="w-full"
									disabled={createRecipe.isPending}
								>
									{createRecipe.isPending ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />{' '}
											Creando...
										</>
									) : (
										'Guardar receta'
									)}
								</Button>
							</DialogFooter>
						</form>
					</DialogContent>
				</Dialog>
			</div>

			{/* Listado de Recetas */}
			<Card className="shadow-sm border-border">
				<CardHeader className="pb-3">
					<CardTitle className="text-xl font-semibold">
						Platos Registrados
					</CardTitle>
					<CardDescription>
						Catálogo de recetas configuradas para el menú de tu
						restaurante.
					</CardDescription>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="flex h-32 items-center justify-center space-x-2 text-muted-foreground">
							<Loader2 className="h-5 w-5 animate-spin text-primary" />
							<span>Cargando recetas...</span>
						</div>
					) : isError ? (
						<div className="rounded-lg bg-destructive/10 p-4 text-center text-destructive">
							<p className="font-medium">
								{getErrorMessage(
									error,
									'No se pudieron cargar las recetas'
								)}
							</p>
						</div>
					) : recipes.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-12 text-center">
							<ChefHat className="h-12 w-12 text-muted-foreground/50 mb-3" />
							<p className="text-lg font-medium text-foreground">
								Todavía no hay recetas
							</p>
							<p className="text-sm text-muted-foreground max-w-sm mt-1">
								Crea tu primer platillo para empezar a vincular
								ingredientes y estructurar tus menús.
							</p>
						</div>
					) : (
						<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
							{recipes.map((recipe) => (
								<div
									key={recipe.id}
									className="group flex flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:border-primary/50 hover:shadow-md"
								>
									<div className="space-y-2">
										<div className="flex items-start justify-between gap-2">
											<h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
												{recipe.name}
											</h3>
											{recipe.preparationTime && (
												<Badge
													variant="outline"
													className="flex items-center gap-1 text-xs shrink-0"
												>
													<Clock className="h-3 w-3 text-muted-foreground" />
													{recipe.preparationTime} min
												</Badge>
											)}
										</div>
										<p className="text-sm text-muted-foreground line-clamp-2">
											{recipe.description ||
												'Sin descripción detallada.'}
										</p>
									</div>

									<div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between">
										<span className="text-xs text-muted-foreground font-medium">
											Precio Venta
										</span>
										<div className="flex items-center text-lg font-bold text-foreground">
											<DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400 -mr-1" />
											{recipe.sellingPrice.toFixed(2)}
										</div>
									</div>
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
