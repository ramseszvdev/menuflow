import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth-options';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';

export default async function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const session = await getServerSession(authOptions);

	if (!session) {
		redirect('/login');
	}

	return (
		<div className="flex min-h-screen">
			<Sidebar />
			<div className="flex-1 flex flex-col">
				<Header />
				<main className="flex-1 p-6 bg-gray-50 dark:bg-gray-900">
					{children}
				</main>
			</div>
		</div>
	);
}
