'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      <div className="grid md:grid-cols-2 gap-6">
        <Link
          href="/admin/upload"
          className="block p-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <h2 className="text-xl font-semibold mb-2">Upload Manga</h2>
          <p>Upload new manga and chapters</p>
        </Link>

        <Link
          href="/admin/users"
          className="block p-6 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          <h2 className="text-xl font-semibold mb-2">Manage Users</h2>
          <p>View and manage user accounts</p>
        </Link>

        <Link
          href="/admin/settings"
          className="block p-6 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          <h2 className="text-xl font-semibold mb-2">Site Settings</h2>
          <p>Configure site options and registration</p>
        </Link>
      </div>
    </div>
  );
}
