import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
// Si globals.css está dentro de frontend/app/
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { QueryProvider } from '@/components/query-provider';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/components/session-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
	title: 'MenuFlow - Gestión Inteligente para Restaurantes',
	description: 'Administra menús, costos e inventario en un solo lugar',
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	// suppressHydrationWarning evita avisos de hidratación causados por el script de temas
	return (
		<html lang="es" suppressHydrationWarning>
			<body className={inter.className}>
				<AuthProvider>
					<ThemeProvider
						attribute="class"
						defaultTheme="light"
						enableSystem
						disableTransitionOnChange
					>
						<QueryProvider>
							{children}
							<Toaster richColors position="top-right" />
						</QueryProvider>
					</ThemeProvider>
				</AuthProvider>
			</body>
		</html>
	);
}
