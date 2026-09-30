import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth-options';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SubscriptionStatus } from '@/components/dashboard/subscription-status';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';

export default async function SettingsPage() {
	const session = await getServerSession(authOptions);

	if (!session?.user) {
		redirect('/login');
	}

	const restaurantId = session.user.restaurantId;

	return (
		<div className="container mx-auto py-6 space-y-6">
			<div>
				<h1 className="text-3xl font-bold tracking-tight">
					⚙️ Configuración
				</h1>
				<p className="text-muted-foreground">
					Administra tu cuenta, suscripción y preferencias
				</p>
			</div>

			<Tabs defaultValue="billing" className="space-y-4">
				<TabsList>
					<TabsTrigger value="profile">Perfil</TabsTrigger>
					<TabsTrigger value="billing">Facturación</TabsTrigger>
					<TabsTrigger value="team">Equipo</TabsTrigger>
				</TabsList>

				<TabsContent value="profile">
					<Card>
						<CardHeader>
							<CardTitle>Perfil de usuario</CardTitle>
							<CardDescription>
								Gestiona tu información personal
							</CardDescription>
						</CardHeader>
						<CardContent>
							<p className="text-muted-foreground">
								Configuración de perfil en desarrollo...
							</p>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="billing">
					{restaurantId ? (
						<SubscriptionStatus restaurantId={restaurantId} />
					) : (
						<Card>
							<CardContent className="py-8 text-center">
								<p className="text-muted-foreground">
									No se encontró información del restaurante
								</p>
							</CardContent>
						</Card>
					)}
				</TabsContent>

				<TabsContent value="team">
					<Card>
						<CardHeader>
							<CardTitle>Gestión de equipo</CardTitle>
							<CardDescription>
								Invita y administra miembros de tu equipo
							</CardDescription>
						</CardHeader>
						<CardContent>
							<p className="text-muted-foreground">
								Gestión de equipo en desarrollo...
							</p>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
