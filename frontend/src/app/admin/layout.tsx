'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-gray-800 text-white p-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">Admin Panel</h1>
            <Link href="/" className="text-gray-300 hover:text-white">
              ← Back to Site
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="font-semibold mb-4">Menu</h2>
              <nav className="space-y-2">
                <Link
                  href="/admin"
                  className="block px-4 py-2 rounded hover:bg-gray-100"
                >
                  Dashboard
                </Link>
                <Link
                  href="/admin/upload"
                  className="block px-4 py-2 rounded hover:bg-gray-100"
                >
                  Upload Manga
                </Link>
                <Link
                  href="/admin/users"
                  className="block px-4 py-2 rounded hover:bg-gray-100"
                >
                  Manage Users
                </Link>
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="md:col-span-3">{children}</div>
        </div>
      </div>
    </div>
  );
}
