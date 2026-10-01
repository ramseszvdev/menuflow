import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { ClipboardList, Store, ArrowRight } from 'lucide-react';
import { authOptions } from '@/lib/auth-options';
import { MenuBuilder } from '@/components/menu/menu-builder';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function MenuPage() {
	const session = await getServerSession(authOptions);

	if (!session?.user) {
		redirect('/login');
	}

	// Obtener el restaurantId del usuario
	const restaurantId = session.user.restaurantId;

	if (!restaurantId) {
		return (
			<div className="flex min-h-[70vh] items-center justify-center p-4">
				<Card className="max-w-md w-full border-dashed shadow-sm">
					<CardContent className="flex flex-col items-center justify-center pt-8 pb-8 text-center space-y-4">
						<div className="rounded-full bg-primary/10 p-4 text-primary">
							<Store className="h-10 w-10" />
						</div>
						<div className="space-y-2">
							<h2 className="text-2xl font-bold tracking-tight text-foreground">
								Configura tu Restaurante
							</h2>
							<p className="text-sm text-muted-foreground max-w-xs mx-auto">
								Necesitas vincular o crear un restaurante en tu cuenta
								antes de empezar a construir tus menús.
							</p>
						</div>
						<Button asChild className="mt-2 shadow-sm">
							<Link href="/dashboard/settings">
								Ir a configuración
								<ArrowRight className="ml-2 h-4 w-4" />
							</Link>
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="space-y-8 p-1">
			{/* Encabezado del módulo */}
			<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b pb-5 border-border">
				<div className="space-y-1">
					<div className="flex items-center gap-2">
						<div className="rounded-lg bg-primary/10 p-2 text-primary">
							<ClipboardList className="h-6 w-6" />
						</div>
						<h1 className="text-3xl font-bold tracking-tight text-foreground">
							Gestión de Menús
						</h1>
					</div>
					<p className="text-sm text-muted-foreground pl-11">
						Crea, organiza y calcula la rentabilidad de tus menús en
						tiempo real.
					</p>
				</div>
			</div>

			{/* Constructor principal de menús */}
			<div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
				<MenuBuilder restaurantId={restaurantId} />
			</div>
		</div>
	);
}
