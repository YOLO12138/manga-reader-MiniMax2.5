'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { adminApi } from '@/lib/api';

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [registrationEnabled, setRegistrationEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchSettings();
    }
  }, [user]);

  const fetchSettings = async () => {
    try {
      const data = await adminApi.getRegistrationStatus();
      setRegistrationEnabled(data.registration_enabled);
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRegistration = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const newValue = !registrationEnabled;
      await adminApi.toggleRegistration(newValue);
      setRegistrationEnabled(newValue);
      setMessage({
        type: 'success',
        text: `User registration ${newValue ? 'enabled' : 'disabled'} successfully!`
      });
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.detail || 'Failed to update settings'
      });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
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
      <div className="mb-6">
        <Link href="/admin" className="text-blue-600 hover:underline">
          ← Back to Admin Dashboard
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-8">Site Settings</h1>

      {message.text && (
        <div className={`p-4 rounded mb-6 ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
        <h2 className="text-xl font-semibold mb-4">User Registration</h2>
        <p className="text-gray-600 mb-4">
          Enable or disable public user registration. When enabled, anyone can register a new account.
        </p>
        
        <div className="flex items-center justify-between py-4 border-t">
          <div>
            <span className="font-medium">Allow New Registrations</span>
            <p className="text-sm text-gray-500">
              Current status: {registrationEnabled ? 'Enabled' : 'Disabled'}
            </p>
          </div>
          <button
            onClick={handleToggleRegistration}
            disabled={saving}
            className={`px-4 py-2 rounded font-medium text-white ${
              registrationEnabled 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-green-600 hover:bg-green-700'
            } disabled:opacity-50`}
          >
            {saving ? 'Saving...' : registrationEnabled ? 'Disable' : 'Enable'}
          </button>
        </div>
      </div>
    </div>
  );
}
