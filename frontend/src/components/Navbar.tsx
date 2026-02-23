'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-gray-900 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-xl font-bold">
            MangaReader
          </Link>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <span className="text-gray-300">
                  {user.username}
                  {user.role === 'admin' && (
                    <span className="ml-2 px-2 py-0.5 text-xs bg-yellow-600 rounded">
                      Admin
                    </span>
                  )}
                </span>
                <Link
                  href="/settings"
                  className="px-3 py-2 rounded bg-gray-800 hover:bg-gray-700"
                >
                  Settings
                </Link>
                {user.role === 'admin' && (
                  <Link
                    href="/admin"
                    className="px-3 py-2 rounded bg-gray-800 hover:bg-gray-700"
                  >
                    Admin
                  </Link>
                )}
                <button
                  onClick={logout}
                  className="px-3 py-2 rounded bg-red-600 hover:bg-red-700"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-3 py-2 rounded bg-blue-600 hover:bg-blue-700"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="px-3 py-2 rounded bg-gray-700 hover:bg-gray-600"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
