'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
	DndContext,
	closestCenter,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
	DragEndEvent,
} from '@dnd-kit/core';
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import { getErrorMessage, type ApiResponse } from '@/lib/auth';
import { SortableMenuItem } from './sortable-menu-item';
import { Copy, Trash2, Plus } from 'lucide-react';

interface Recipe {
	id: string;
	name: string;
	sellingPrice: number;
	totalCost?: number;
}

interface MenuRecipe {
	recipeId: string;
	order: number;
	recipe: Recipe;
}

interface Menu {
	id: string;
	name: string;
	description?: string;
	validFrom: string;
	validTo?: string;
	recipes: MenuRecipe[];
	totalCost?: number;
	totalSellingPrice?: number;
	averageProfitMargin?: number;
}

interface CreateMenuPayload {
	name: string;
	validFrom: string;
	recipes: { recipeId: string; order: number }[];
}

interface UpdateMenuPayload {
	recipes: { recipeId: string; order: number }[];
}

export function MenuBuilder({ restaurantId }: { restaurantId: string }) {
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [newMenuName, setNewMenuName] = useState('');
	const [selectedRecipes, setSelectedRecipes] = useState<string[]>([]);

	const queryClient = useQueryClient();

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 5,
			},
		}),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		})
	);

	// Obtener todos los menús
	const {
		data: menus,
		isLoading: menusLoading,
		isError: menusError,
		error: menusQueryError,
	} = useQuery<Menu[]>({
		queryKey: ['menus', restaurantId],
		queryFn: async () => {
			const response = await apiClient.get<ApiResponse<Menu[]>>(
				`/restaurants/${restaurantId}/menus`
			);
			return response.data.data;
		},
	});

	// Obtener todas las recetas (para el selector)
	const {
		data: recipes,
		isLoading: recipesLoading,
		isError: recipesError,
		error: recipesQueryError,
	} = useQuery<Recipe[]>({
		queryKey: ['recipes', restaurantId],
		queryFn: async () => {
			const response = await apiClient.get<ApiResponse<Recipe[]>>(
				`/restaurants/${restaurantId}/recipes`
			);
			return response.data.data;
		},
	});

	// Crear menú
	const createMenuMutation = useMutation({
		mutationFn: async (data: CreateMenuPayload) => {
			const response = await apiClient.post(
				`/restaurants/${restaurantId}/menus`,
				data
			);
			return response.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['menus', restaurantId] });
			toast.success('Menú creado exitosamente');
			setIsDialogOpen(false);
			setNewMenuName('');
			setSelectedRecipes([]);
		},
		onError: (error: unknown) => {
			toast.error(getErrorMessage(error, 'Error al crear el menú'));
		},
	});

	// Actualizar menú (reordenar)
	const updateMenuMutation = useMutation({
		mutationFn: async ({
			id,
			data,
		}: {
			id: string;
			data: UpdateMenuPayload;
		}) => {
			const response = await apiClient.patch(
				`/restaurants/${restaurantId}/menus/${id}`,
				data
			);
			return response.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['menus', restaurantId] });
			toast.success('Menú actualizado');
		},
		onError: (error: unknown) => {
			toast.error(getErrorMessage(error, 'Error al actualizar el menú'));
		},
	});

	// Clonar menú
	const cloneMenuMutation = useMutation({
		mutationFn: async (id: string) => {
			const response = await apiClient.post(
				`/restaurants/${restaurantId}/menus/${id}/clone`
			);
			return response.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['menus', restaurantId] });
			toast.success('Menú clonado con éxito');
		},
		onError: (error: unknown) => {
			toast.error(getErrorMessage(error, 'Error al clonar el menú'));
		},
	});

	// Eliminar menú
	const deleteMenuMutation = useMutation({
		mutationFn: async (id: string) => {
			await apiClient.delete(`/restaurants/${restaurantId}/menus/${id}`);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['menus', restaurantId] });
			toast.success('Menú eliminado');
		},
		onError: (error: unknown) => {
			toast.error(getErrorMessage(error, 'Error al eliminar el menú'));
		},
	});

	const handleDragEnd = (event: DragEndEvent, menuId: string) => {
		const { active, over } = event;

		if (!over || active.id === over.id) return;

		const menu = menus?.find((m) => m.id === menuId);
		if (!menu) return;

		const oldIndex = menu.recipes.findIndex(
			(item) => item.recipeId === active.id
		);
		const newIndex = menu.recipes.findIndex(
			(item) => item.recipeId === over.id
		);

		if (oldIndex === -1 || newIndex === -1) return;

		const newOrder = arrayMove(menu.recipes, oldIndex, newIndex);

		updateMenuMutation.mutate({
			id: menuId,
			data: {
				recipes: newOrder.map((item, index) => ({
					recipeId: item.recipeId,
					order: index,
				})),
			},
		});
	};

	const handleCreateMenu = () => {
		if (!newMenuName.trim()) {
			toast.error('Por favor ingresa un nombre para el menú');
			return;
		}

		if (selectedRecipes.length === 0) {
			toast.error('Selecciona al menos una receta');
			return;
		}

		createMenuMutation.mutate({
			name: newMenuName,
			validFrom: new Date().toISOString(),
			recipes: selectedRecipes.map((recipeId, index) => ({
				recipeId,
				order: index,
			})),
		});
	};

	if (menusLoading || recipesLoading) {
		return <div className="text-center py-8">Cargando menús...</div>;
	}

	if (menusError || recipesError) {
		return (
			<div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center text-destructive">
				{getErrorMessage(
					menusQueryError || recipesQueryError,
					'No se pudieron cargar los datos del menú'
				)}
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<h2 className="text-2xl font-bold">Mis Menús</h2>
				<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
					<DialogTrigger asChild>
						<Button className="bg-orange-400 transition-all hover:bg-amber-400 cursor-pointer">
							<Plus className="mr-2 h-4 w-4" /> Nuevo Menú
						</Button>
					</DialogTrigger>
					<DialogContent className="max-w-2xl">
						<DialogHeader>
							<DialogTitle>Crear Nuevo Menú</DialogTitle>
							<DialogDescription>
								Define las recetas que formarán parte de este menú
							</DialogDescription>
						</DialogHeader>
						<div className="space-y-4 py-4">
							<div>
								<Label htmlFor="menuName">Nombre del Menú</Label>
								<Input
									id="menuName"
									value={newMenuName}
									onChange={(e) => setNewMenuName(e.target.value)}
									placeholder="Ej: Menú de Verano 2026"
								/>
							</div>
							<div>
								<Label>Seleccionar Recetas</Label>
								<div className="mt-2 space-y-2 max-h-60 overflow-y-auto border rounded-md p-2">
									{recipes?.map((recipe) => (
										<label
											key={recipe.id}
											className="flex items-center space-x-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md cursor-pointer"
										>
											<input
												type="checkbox"
												checked={selectedRecipes.includes(
													recipe.id
												)}
												onChange={(e) => {
													if (e.target.checked) {
														setSelectedRecipes([
															...selectedRecipes,
															recipe.id,
														]);
													} else {
														setSelectedRecipes(
															selectedRecipes.filter(
																(id) => id !== recipe.id
															)
														);
													}
												}}
												className="h-4 w-4 text-orange-600 rounded border-gray-300"
											/>
											<div className="flex-1">
												<p className="font-medium text-sm">
													{recipe.name}
												</p>
												<p className="text-xs text-muted-foreground">
													${(recipe.sellingPrice ?? 0).toFixed(2)}
												</p>
											</div>
										</label>
									))}
								</div>
								{selectedRecipes.length > 0 && (
									<p className="text-sm text-muted-foreground mt-2">
										{selectedRecipes.length} receta(s) seleccionada(s)
									</p>
								)}
							</div>
						</div>
						<div className="flex justify-end space-x-2">
							<Button
								variant="outline"
								onClick={() => setIsDialogOpen(false)}
							>
								Cancelar
							</Button>
							<Button
								className="bg-orange-600 hover:bg-orange-700"
								onClick={handleCreateMenu}
								disabled={createMenuMutation.isPending}
							>
								{createMenuMutation.isPending
									? 'Creando...'
									: 'Crear Menú'}
							</Button>
						</div>
					</DialogContent>
				</Dialog>
			</div>

			{!menus || menus.length === 0 ? (
				<Card>
					<CardContent className="py-8 text-center text-muted-foreground">
						<p>No tienes menús creados</p>
						<p className="text-sm">
							Crea tu primer menú combinando tus recetas favoritas
						</p>
					</CardContent>
				</Card>
			) : (
				<div className="grid gap-6 md:grid-cols-2">
					{menus.map((menu) => (
						<Card
							key={menu.id}
							className="overflow-hidden flex flex-col justify-between"
						>
							<div>
								<CardHeader>
									<div className="flex justify-between items-start">
										<div>
											<CardTitle>{menu.name}</CardTitle>
											<CardDescription>
												{menu.description || 'Sin descripción'}
											</CardDescription>
										</div>
										<div className="flex space-x-1">
											<Button
												variant="ghost"
												size="icon"
												title="Clonar menú"
												onClick={() =>
													cloneMenuMutation.mutate(menu.id)
												}
												disabled={cloneMenuMutation.isPending}
											>
												<Copy className="h-4 w-4" />
											</Button>
											<Button
												variant="ghost"
												size="icon"
												className="text-red-500 hover:text-red-700"
												title="Eliminar menú"
												onClick={() => {
													if (
														confirm(
															`¿Eliminar el menú "${menu.name}"?`
														)
													) {
														deleteMenuMutation.mutate(menu.id);
													}
												}}
											>
												<Trash2 className="h-4 w-4" />
											</Button>
										</div>
									</div>

									{/* Resumen de costos */}
									<div className="grid grid-cols-3 gap-2 mt-4 text-sm">
										<div className="bg-green-50 dark:bg-green-950 p-2 rounded text-center">
											<p className="font-semibold text-green-700 dark:text-green-400">
												${(menu.totalCost ?? 0).toFixed(2)}
											</p>
											<p className="text-xs text-muted-foreground">
												Costo
											</p>
										</div>
										<div className="bg-blue-50 dark:bg-blue-950 p-2 rounded text-center">
											<p className="font-semibold text-blue-700 dark:text-blue-400">
												${(menu.totalSellingPrice ?? 0).toFixed(2)}
											</p>
											<p className="text-xs text-muted-foreground">
												Venta
											</p>
										</div>
										<div className="bg-orange-50 dark:bg-orange-950 p-2 rounded text-center">
											<p className="font-semibold text-orange-700 dark:text-orange-400">
												{(menu.averageProfitMargin ?? 0).toFixed(1)}
												%
											</p>
											<p className="text-xs text-muted-foreground">
												Margen
											</p>
										</div>
									</div>
								</CardHeader>

								<CardContent>
									<DndContext
										sensors={sensors}
										collisionDetection={closestCenter}
										onDragEnd={(event) =>
											handleDragEnd(event, menu.id)
										}
									>
										<SortableContext
											items={menu.recipes.map(
												(item) => item.recipeId
											)}
											strategy={verticalListSortingStrategy}
										>
											<div className="space-y-2">
												{menu.recipes.map((item, index) => (
													<SortableMenuItem
														key={item.recipeId}
														id={item.recipeId}
														recipe={item.recipe}
														index={index}
													/>
												))}
											</div>
										</SortableContext>
									</DndContext>
								</CardContent>
							</div>
						</Card>
					))}
				</div>
			)}
		</div>
	);
}
