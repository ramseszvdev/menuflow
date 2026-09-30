'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api-client';
import { getErrorMessage, type ApiResponse } from '@/lib/auth';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';

interface SubscriptionData {
	id: string;
	plan: string;
	status: string;
	currentPeriodStart: string;
	currentPeriodEnd: string;
	cancelAtPeriodEnd: boolean;
	invoices: Array<{
		id: string;
		amount: number;
		currency: string;
		status: string;
		invoiceUrl?: string;
		paidAt: string;
		createdAt: string;
	}>;
}

const statusMap = {
	active: {
		label: 'Activo',
		color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
		icon: CheckCircle,
	},
	past_due: {
		label: 'Pago pendiente',
		color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
		icon: Clock,
	},
	cancelled: {
		label: 'Cancelado',
		color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
		icon: XCircle,
	},
	trialing: {
		label: 'Prueba',
		color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
		icon: Clock,
	},
	inactive: {
		label: 'Inactivo',
		color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
		icon: XCircle,
	},
};

const planLabels = {
	basic: 'Básico',
	pro: 'Profesional',
	enterprise: 'Empresarial',
	free: 'Gratuito',
};

export function SubscriptionStatus({ restaurantId }: { restaurantId: string }) {
	const [billingAction, setBillingAction] = useState<
		'cancel' | 'portal' | null
	>(null);
	const {
		data: subscription,
		isLoading,
		isError,
		error,
		refetch,
	} = useQuery<SubscriptionData | null>({
		queryKey: ['subscription', restaurantId],
		queryFn: async () => {
			const response = await apiClient.get<
				ApiResponse<SubscriptionData | null>
			>('/payments/subscription');
			return response.data.data;
		},
		enabled: !!restaurantId,
	});

	const handleCancelSubscription = async () => {
		if (
			!confirm(
				'¿Estás seguro de cancelar tu suscripción? Se mantendrá activa hasta el final del período actual.'
			)
		) {
			return;
		}

		try {
			setBillingAction('cancel');
			await apiClient.delete('/payments/subscription');
			toast.success('Suscripción cancelada al final del período actual');
			await refetch();
		} catch (error: unknown) {
			toast.error(
				getErrorMessage(error, 'Error al cancelar la suscripción')
			);
		} finally {
			setBillingAction(null);
		}
	};

	const handleManageBilling = async () => {
		try {
			setBillingAction('portal');
			const response =
				await apiClient.post<ApiResponse<{ url: string }>>(
					'/payments/portal'
				);
			const { url } = response.data.data;
			window.location.href = url;
		} catch (error: unknown) {
			toast.error(
				getErrorMessage(error, 'Error al abrir el portal de facturación')
			);
		} finally {
			setBillingAction(null);
		}
	};

	if (isLoading) {
		return (
			<Card>
				<CardContent className="py-8 flex justify-center">
					<Loader2 className="h-8 w-8 animate-spin text-orange-600" />
				</CardContent>
			</Card>
		);
	}

	if (isError) {
		return (
			<Card>
				<CardContent className="py-8 text-center text-destructive">
					{getErrorMessage(error, 'No se pudo cargar la suscripción')}
				</CardContent>
			</Card>
		);
	}

	if (!subscription) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Sin suscripción activa</CardTitle>
					<CardDescription>
						No tienes un plan activo. Elige un plan para comenzar.
					</CardDescription>
				</CardHeader>
				<CardFooter>
					<Button
						className="bg-orange-400 transition-all hover:bg-amber-400 cursor-pointer"
						asChild
					>
						<a href="/pricing">Ver planes</a>
					</Button>
				</CardFooter>
			</Card>
		);
	}

	const statusInfo =
		statusMap[subscription.status as keyof typeof statusMap] ||
		statusMap.inactive;
	const StatusIcon = statusInfo.icon;

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>
							<CardTitle>
								Plan{' '}
								{planLabels[
									subscription.plan as keyof typeof planLabels
								] || subscription.plan}
							</CardTitle>
							<CardDescription>
								Suscripción activa desde el{' '}
								{format(
									new Date(subscription.currentPeriodStart),
									'dd MMM yyyy',
									{ locale: es }
								)}
							</CardDescription>
						</div>
						<Badge
							className={`${statusInfo.color} flex items-center gap-1 px-3 py-1 text-sm`}
						>
							<StatusIcon className="h-4 w-4" />
							{statusInfo.label}
						</Badge>
					</div>
				</CardHeader>
				<CardContent className="space-y-2">
					<div className="grid grid-cols-2 gap-4 text-sm">
						<div>
							<span className="text-muted-foreground">
								Próximo pago:
							</span>
							<span className="ml-2 font-medium">
								{format(
									new Date(subscription.currentPeriodEnd),
									'dd MMM yyyy',
									{ locale: es }
								)}
							</span>
						</div>
						{subscription.cancelAtPeriodEnd && (
							<div>
								<span className="text-muted-foreground">Estado:</span>
								<span className="ml-2 font-medium text-yellow-600">
									Cancelará al final del período
								</span>
							</div>
						)}
					</div>
				</CardContent>
				<CardFooter className="flex gap-2 flex-wrap">
					<Button
						variant="outline"
						onClick={handleManageBilling}
						disabled={billingAction !== null}
					>
						{billingAction === 'portal'
							? 'Abriendo...'
							: 'Gestionar facturación'}
					</Button>
					{!subscription.cancelAtPeriodEnd &&
						subscription.status === 'active' && (
							<Button
								variant="destructive"
								onClick={handleCancelSubscription}
								disabled={billingAction !== null}
							>
								{billingAction === 'cancel'
									? 'Cancelando...'
									: 'Cancelar suscripción'}
							</Button>
						)}
				</CardFooter>
			</Card>

			{/* Historial de facturas */}
			{subscription.invoices && subscription.invoices.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">
							Historial de Facturación
						</CardTitle>
						<CardDescription>Últimas 10 facturas</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							{subscription.invoices.map((invoice) => (
								<div
									key={invoice.id}
									className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
								>
									<div>
										<p className="font-medium">
											${invoice.amount.toFixed(2)}{' '}
											{invoice.currency.toUpperCase()}
										</p>
										<p className="text-xs text-muted-foreground">
											{invoice.paidAt
												? format(
														new Date(invoice.paidAt),
														'dd MMM yyyy',
														{ locale: es }
													)
												: 'Pendiente'}
										</p>
									</div>
									<Badge
										variant={
											invoice.status === 'paid'
												? 'success'
												: 'destructive'
										}
										className="text-xs"
									>
										{invoice.status === 'paid' ? 'Pagada' : 'Fallida'}
									</Badge>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
