'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Reader from '@/components/Reader';
import { chapterApi } from '@/lib/api';

export default function ReadPage() {
  const params = useParams();
  const chapterId = Number(params.chapterId);
  const router = useRouter();
  const [pages, setPages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';

  useEffect(() => {
    const fetchPages = async () => {
      try {
        const data = await chapterApi.getPages(chapterId);
        setPages(data.pages);
      } catch (err) {
        setError('Failed to load chapter');
      } finally {
        setLoading(false);
      }
    };

    if (chapterId) {
      fetchPages();
    }
  }, [chapterId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="text-xl text-red-500 mb-4">{error}</div>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-gray-800 text-white rounded"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <>
      <Reader pages={pages} chapterId={chapterId} apiUrl={apiUrl} />
      {/* Back button for mobile */}
      <Link
        href="#"
        onClick={(e) => { e.preventDefault(); router.back(); }}
        className="fixed top-4 left-4 z-50 px-4 py-2 bg-gray-800 text-white rounded md:hidden"
      >
        ← Back
      </Link>
    </>
  );
}
