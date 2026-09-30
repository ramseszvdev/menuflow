import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth-options';
import { PricingCards } from '@/components/pricing/pricing-cards';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default async function PricingPage() {
	const session = await getServerSession(authOptions);

	// Si está autenticado, redirigir al dashboard (o mostrar pricing en el dashboard)
	if (session) {
		redirect('/dashboard');
	}

	return (
		<div className="min-h-screen bg-linear-to-br from-orange-50 to-white dark:from-gray-900 dark:to-gray-800">
			<div className="container max-w-6xl mx-auto px-4 py-16">
				<div className="text-center mb-12">
					<div className="text-6xl mb-4">🍽️</div>
					<h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
						Elige el plan perfecto para tu restaurante
					</h1>
					<p className="text-xl text-muted-foreground max-w-2xl mx-auto">
						Desde food trucks hasta grandes cadenas, tenemos el plan ideal
						para ti
					</p>
				</div>

				<PricingCards />

				<div className="mt-12 text-center">
					<Card className="max-w-2xl mx-auto bg-white/50 dark:bg-gray-900/50 backdrop-blur">
						<CardHeader>
							<CardTitle>¿Necesitas un plan personalizado?</CardTitle>
							<CardDescription>
								Si tienes necesidades especiales o eres una cadena con
								múltiples ubicaciones
							</CardDescription>
						</CardHeader>
						<CardContent>
							<Button
								variant="outline"
								className="border-orange-500 text-orange-600 hover:bg-orange-50 cursor-pointer"
							>
								Contactar con ventas
							</Button>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
