'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
	LayoutDashboard,
	Utensils,
	Package,
	ShoppingCart,
	Settings,
	Users,
	Menu as MenuIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const menuItems = [
	{ href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
	{ href: '/recipes', icon: Utensils, label: 'Recetas' },
	{ href: '/ingredients', icon: Package, label: 'Ingredientes' },
	{ href: '/menu', icon: MenuIcon, label: 'Menús' },
	{ href: '/settings', icon: Settings, label: 'Configuración' },
];

export function Sidebar() {
	const pathname = usePathname();

	return (
		<aside className="w-64 border-r bg-white dark:bg-gray-950 min-h-screen p-4 flex flex-col">
			<div className="flex items-center gap-2 mb-8 px-2">
				<span className="text-2xl">🍽️</span>
				<span className="text-xl font-bold text-orange-600">MenuFlow</span>
			</div>

			<nav className="space-y-1 flex-1">
				{menuItems.map((item) => {
					const isActive =
						pathname === item.href ||
						pathname.startsWith(item.href + '/');
					return (
						<Link
							key={item.href}
							href={item.href}
							className={cn(
								'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
								isActive
									? 'bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-400'
									: 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
							)}
						>
							<item.icon className="h-4 w-4" />
							{item.label}
						</Link>
					);
				})}
			</nav>

			<div className="border-t pt-4 mt-4">
				<div className="px-3 py-2">
					<div className="bg-linear-to-r from-orange-500 to-orange-600 rounded-lg p-3 text-white">
						<p className="text-xs font-medium">Plan Básico</p>
						<p className="text-xs opacity-80">49/mes</p>
					</div>
				</div>
			</div>
		</aside>
	);
}
