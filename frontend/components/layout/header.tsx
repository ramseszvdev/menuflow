 'use client';

import { signOut, useSession } from 'next-auth/react';

const Header = () => {
	const { data: session } = useSession();

	return (
		<header className="bg-white dark:bg-gray-900 shadow-md">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex justify-between h-16 items-center">
					<div className="shrink-0">
						<span className="text-xl font-bold text-orange-600">
							🍽️ MenuFlow
						</span>
					</div>
					<div className="flex items-center space-x-4">
						<span className="text-gray-700 dark:text-gray-300">
							{session?.user?.name || 'Usuario'}
						</span>
						<button
							type="button"
							onClick={() => signOut({ callbackUrl: '/login' })}
							className="text-gray-700 dark:text-gray-300 hover:text-orange-600"
						>
							Cerrar Sesión
						</button>
					</div>
				</div>
			</div>
		</header>
	);
};

export { Header };
