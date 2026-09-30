'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import { getErrorMessage, type ApiResponse } from '@/lib/auth';

interface Plan {
	id: string;
	name: string;
	description: string;
	price: number;
	currency: string;
	interval: string;
	features: string[];
	recommended?: boolean;
	priceId: string;
}

const plans: Plan[] = [
	{
		id: 'basic',
		name: 'Básico',
		description: 'Ideal para food trucks y cafeterías',
		price: 49,
		currency: 'USD',
		interval: 'mes',
		features: [
			'Gestión de hasta 50 recetas',
			'Hasta 200 ingredientes',
			'Costeo automático',
			'Menús ilimitados',
			'1 usuario',
			'Soporte por email',
		],
		priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_BASIC || 'price_basic',
	},
	{
		id: 'pro',
		name: 'Profesional',
		description: 'Para restaurantes en crecimiento',
		price: 149,
		currency: 'USD',
		interval: 'mes',
		recommended: true,
		features: [
			'Recetas ilimitadas',
			'Ingredientes ilimitados',
			'Costeo avanzado con IA',
			'Menús ilimitados con arrastre',
			'Hasta 5 usuarios',
			'Integración con delivery apps',
			'Soporte prioritario',
			'Reportes avanzados',
		],
		priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO || 'price_pro',
	},
	{
		id: 'enterprise',
		name: 'Empresarial',
		description: 'Para cadenas y grupos',
		price: 299,
		currency: 'USD',
		interval: 'mes',
		features: [
			'Todo lo del plan Pro',
			'Usuarios ilimitados',
			'API personalizada',
			'Múltiples ubicaciones',
			'Dashboard de grupo',
			'Soporte 24/7',
			'Consultoría incluida',
			'Marketplace de proveedores',
		],
		priceId:
			process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE || 'price_enterprise',
	},
];

export function PricingCards() {
	const router = useRouter();
	const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

	const handleSubscribe = async (plan: Plan) => {
		try {
			setLoadingPlan(plan.id);

			const response = await apiClient.post<
				ApiResponse<{ sessionId: string; url: string | null }>
			>('/payments/checkout', {
				plan: plan.id,
			});

			const { url } = response.data.data;

			if (url) {
				// Redirigir a Stripe Checkout
				window.location.href = url;
			} else {
				toast.error('Error al crear la sesión de pago');
			}
		} catch (error: unknown) {
			toast.error(getErrorMessage(error, 'Error al procesar el pago'));
		} finally {
			setLoadingPlan(null);
		}
	};

	return (
		<div className="grid gap-6 md:grid-cols-3">
			{plans.map((plan) => (
				<Card
					key={plan.id}
					className={`relative flex flex-col ${
						plan.recommended
							? 'border-orange-500 shadow-lg shadow-orange-100 dark:shadow-orange-950'
							: ''
					}`}
				>
					{plan.recommended && (
						<div className="absolute -top-3 left-1/2 -translate-x-1/2">
							<Badge className="bg-orange-500 text-white px-3 py-1">
								Recomendado
							</Badge>
						</div>
					)}
					<CardHeader>
						<CardTitle className="text-2xl">{plan.name}</CardTitle>
						<CardDescription>{plan.description}</CardDescription>
						<div className="mt-4">
							<span className="text-4xl font-bold">${plan.price}</span>
							<span className="text-muted-foreground">
								/{plan.interval}
							</span>
						</div>
					</CardHeader>
					<CardContent className="flex-1">
						<ul className="space-y-2">
							{plan.features.map((feature, index) => (
								<li
									key={index}
									className="flex items-start gap-2 text-sm"
								>
									<Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
									<span>{feature}</span>
								</li>
							))}
						</ul>
					</CardContent>
					<CardFooter>
						<Button
							className={`w-full ${
								plan.recommended
									? 'bg-orange-600 hover:bg-orange-700 text-white'
									: 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700'
							} cursor-pointer`}
							onClick={() => handleSubscribe(plan)}
							disabled={loadingPlan === plan.id}
						>
							{loadingPlan === plan.id
								? 'Procesando...'
								: 'Comenzar ahora'}
						</Button>
					</CardFooter>
				</Card>
			))}
		</div>
	);
}
