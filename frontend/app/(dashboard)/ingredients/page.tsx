'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
	Plus,
	Trash2,
	AlertTriangle,
	PackageOpen,
	Loader2,
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

interface Ingredient {
	id: string;
	name: string;
	unit: string;
	costPerUnit: number;
	stock: number;
	minStock: number;
}

interface IngredientForm {
	name: string;
	unit: string;
	costPerUnit: string;
	stock: string;
	minStock: string;
}

const emptyForm: IngredientForm = {
	name: '',
	unit: 'unidad',
	costPerUnit: '',
	stock: '0',
	minStock: '0',
};

export default function IngredientsPage() {
	const { data: session, status } = useSession();
	const restaurantId = session?.user.restaurantId;
	const [form, setForm] = useState<IngredientForm>(emptyForm);
	const [open, setOpen] = useState(false);
	const queryClient = useQueryClient();

	const {
		data: ingredients = [],
		isLoading,
		isError,
		error,
	} = useQuery<Ingredient[]>({
		queryKey: ['ingredients', restaurantId],
		queryFn: async () => {
			const response = await apiClient.get<ApiResponse<Ingredient[]>>(
				`/restaurants/${restaurantId}/ingredients`
			);
			return response.data.data ?? response.data;
		},
		enabled: status === 'authenticated' && Boolean(restaurantId),
	});

	const createIngredient = useMutation({
		mutationFn: async (data: IngredientForm) =>
			apiClient.post(`/restaurants/${restaurantId}/ingredients`, {
				name: data.name,
				unit: data.unit,
				costPerUnit: Number(data.costPerUnit),
				stock: Number(data.stock),
				minStock: Number(data.minStock),
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['ingredients', restaurantId],
			});
			setForm(emptyForm);
			setOpen(false);
			toast.success('Ingrediente creado con éxito');
		},
		onError: (error: unknown) =>
			toast.error(getErrorMessage(error, 'No se pudo crear el ingrediente')),
	});

	const removeIngredient = useMutation({
		mutationFn: (id: string) =>
			apiClient.delete(`/restaurants/${restaurantId}/ingredients/${id}`),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['ingredients', restaurantId],
			});
			toast.success('Ingrediente eliminado');
		},
		onError: (error: unknown) =>
			toast.error(
				getErrorMessage(error, 'No se pudo eliminar el ingrediente')
			),
	});

	if (status === 'loading') {
		return (
			<div className="flex h-64 items-center justify-center space-x-2 text-muted-foreground">
				<Loader2 className="h-6 w-6 animate-spin text-primary" />
				<p>Cargando sesión y datos de MenuFlow...</p>
			</div>
		);
	}

	if (!restaurantId) {
		return (
			<div className="flex h-64 flex-col items-center justify-center space-y-3 rounded-xl border border-dashed p-8 text-center bg-card">
				<AlertTriangle className="h-10 w-10 text-amber-500" />
				<h2 className="text-xl font-semibold">Restaurante no detectado</h2>
				<p className="text-sm text-muted-foreground max-w-sm">
					No se encontró un restaurante asociado a tu cuenta. Asegúrate de
					haber completado la configuración inicial.
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-8 p-1">
			{/* Encabezado y Acción principal */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="space-y-1">
					<h1 className="text-3xl font-bold tracking-tight text-foreground">
						Ingredientes
					</h1>
					<p className="text-sm text-muted-foreground">
						Controla costes, existencias y alertas de stock en tiempo
						real.
					</p>
				</div>

				<Dialog open={open} onOpenChange={setOpen}>
					<DialogTrigger asChild>
						<Button
							size="lg"
							className="bg-amber-400 transition-all hover:bg-orange-400 hover:text-white cursor-pointer"
						>
							<Plus className="mr-2 h-5 w-5" />
							Nuevo ingrediente
						</Button>
					</DialogTrigger>
					<DialogContent className="sm:max-w-106.25">
						<DialogHeader>
							<DialogTitle>Añadir Ingrediente</DialogTitle>
							<DialogDescription>
								Registra un nuevo insumo para calcular los costes de tu
								menú.
							</DialogDescription>
						</DialogHeader>
						<form
							className="space-y-4 pt-2"
							onSubmit={(event) => {
								event.preventDefault();
								createIngredient.mutate(form);
							}}
						>
							<div className="space-y-2">
								<Label htmlFor="ingredient-name">
									Nombre del ingrediente
								</Label>
								<Input
									id="ingredient-name"
									className="px-2 py-1 w-full selection:bg-orange-500 selection:text-white"
									placeholder="Ej. Queso Mozzarella"
									required
									value={form.name}
									onChange={(event) =>
										setForm({ ...form, name: event.target.value })
									}
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="ingredient-unit">
									Unidad de medida
								</Label>
								<Input
									id="ingredient-unit"
									className="px-2 py-1 w-full selection:bg-orange-500 selection:text-white"
									placeholder="Ej. kg, g, litros, unidad"
									required
									value={form.unit}
									onChange={(event) =>
										setForm({ ...form, unit: event.target.value })
									}
								/>
							</div>

							<div className="grid grid-cols-3 gap-3">
								<div className="space-y-2">
									<Label htmlFor="ingredient-cost">Coste ($)</Label>
									<Input
										id="ingredient-cost"
										type="number"
										className="px-2 py-1 w-20 selection:bg-orange-500 selection:text-white"
										min="0"
										step="0.01"
										placeholder="0.00"
										required
										value={form.costPerUnit}
										onChange={(event) =>
											setForm({
												...form,
												costPerUnit: event.target.value,
											})
										}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="ingredient-stock">Stock</Label>
									<Input
										id="ingredient-stock"
										type="number"
										className="px-2 py-1 w-20 selection:bg-orange-500 selection:text-white"
										min="0"
										step="0.01"
										placeholder="0"
										value={form.stock}
										onChange={(event) =>
											setForm({ ...form, stock: event.target.value })
										}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="ingredient-min-stock">Mínimo</Label>
									<Input
										id="ingredient-min-stock"
										type="number"
										className="px-2 py-1 w-20 selection:bg-orange-500 selection:text-white"
										min="0"
										step="0.01"
										placeholder="0"
										value={form.minStock}
										onChange={(event) =>
											setForm({
												...form,
												minStock: event.target.value,
											})
										}
									/>
								</div>
							</div>

							<DialogFooter className="pt-4">
								<Button
									type="submit"
									className="w-full h-11 bg-linear-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:amber-700 text-white font-semibold rounded-xl shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 cursor-pointer disabled:opacity-50"
									disabled={createIngredient.isPending}
								>
									{createIngredient.isPending ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />{' '}
											Guardando...
										</>
									) : (
										'Guardar ingrediente'
									)}
								</Button>
							</DialogFooter>
						</form>
					</DialogContent>
				</Dialog>
			</div>

			{/* Tabla / Tarjeta de Inventario */}
			<Card className="shadow-sm border-border">
				<CardHeader className="pb-3">
					<CardTitle className="text-xl font-semibold">
						Inventario de Insumos
					</CardTitle>
					<CardDescription>
						Lista completa de ingredientes registrados en tu cocina.
					</CardDescription>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="flex h-32 items-center justify-center space-x-2 text-muted-foreground">
							<Loader2 className="h-5 w-5 animate-spin text-primary" />
							<span>Cargando inventario...</span>
						</div>
					) : isError ? (
						<div className="rounded-lg bg-destructive/10 p-4 text-center text-destructive">
							<p className="font-medium">
								{getErrorMessage(
									error,
									'No se pudieron cargar los ingredientes'
								)}
							</p>
						</div>
					) : ingredients.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-12 text-center">
							<PackageOpen className="h-12 w-12 text-muted-foreground/50 mb-3" />
							<p className="text-lg font-medium text-foreground">
								Todavía no hay ingredientes
							</p>
							<p className="text-sm text-muted-foreground max-w-sm mt-1">
								Agrega tus primeros insumos para llevar el control del
								coste de tus platillos.
							</p>
						</div>
					) : (
						<div className="divide-y divide-border rounded-md border">
							{ingredients.map((ingredient) => {
								const isLowStock =
									ingredient.stock <= ingredient.minStock;
								return (
									<div
										key={ingredient.id}
										className="flex items-center justify-between p-4 transition-colors hover:bg-muted/50"
									>
										<div className="space-y-1">
											<div className="flex items-center gap-2">
												<p className="font-semibold text-foreground">
													{ingredient.name}
												</p>
												{isLowStock && (
													<Badge
														variant="destructive"
														className="text-[10px] px-2 py-0"
													>
														<AlertTriangle className="mr-1 h-3 w-3" />{' '}
														Stock bajo
													</Badge>
												)}
											</div>
											<p className="text-sm text-muted-foreground">
												Stock:{' '}
												<span className="font-medium text-foreground">
													{ingredient.stock} {ingredient.unit}
												</span>{' '}
												· Coste por {ingredient.unit}:{' '}
												<span className="font-medium text-foreground">
													${ingredient.costPerUnit.toFixed(2)}
												</span>
											</p>
										</div>

										<Button
											variant="ghost"
											size="icon"
											title="Eliminar ingrediente"
											className="text-red-500 hover:text-red-700"
											aria-label={`Eliminar ${ingredient.name}`}
											onClick={() =>
												removeIngredient.mutate(ingredient.id)
											}
											disabled={removeIngredient.isPending}
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</div>
								);
							})}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
