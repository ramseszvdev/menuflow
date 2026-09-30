'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

interface SortableMenuItemProps {
	id: string;
	recipe: {
		id: string;
		name: string;
		sellingPrice: number;
		totalCost?: number;
	};
	index: number;
}

export function SortableMenuItem({ id, recipe, index }: SortableMenuItemProps) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
	};

	const profit = recipe.sellingPrice - (recipe.totalCost || 0);
	const margin =
		recipe.sellingPrice > 0
			? ((recipe.sellingPrice - (recipe.totalCost || 0)) /
					recipe.sellingPrice) *
				100
			: 0;

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={`flex items-center gap-3 p-3 bg-white dark:bg-gray-800 border rounded-lg hover:shadow-md transition-shadow ${
				isDragging ? 'shadow-lg ring-2 ring-orange-400' : ''
			}`}
		>
			<div
				{...attributes}
				{...listeners}
				className="cursor-grab hover:text-orange-500 transition-colors"
			>
				<GripVertical className="h-5 w-5 text-gray-400" />
			</div>

			<div className="flex-1 min-w-0">
				<div className="flex items-center justify-between">
					<span className="font-medium truncate">
						{index + 1}. {recipe.name}
					</span>
					<span className="text-sm font-semibold text-green-600 dark:text-green-400">
						${recipe.sellingPrice.toFixed(2)}
					</span>
				</div>

				<div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
					<span>Costo: ${recipe.totalCost?.toFixed(2) || '0.00'}</span>
					<span>Ganancia: ${profit.toFixed(2)}</span>
					<span
						className={`font-medium ${margin >= 30 ? 'text-green-600' : margin >= 15 ? 'text-yellow-600' : 'text-red-600'}`}
					>
						Margen: {margin.toFixed(1)}%
					</span>
				</div>
			</div>
		</div>
	);
}
