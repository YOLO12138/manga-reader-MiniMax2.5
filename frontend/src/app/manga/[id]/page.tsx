'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Manga, Chapter } from '@/types';
import { mangaApi } from '@/lib/api';
import ChapterList from '@/components/ChapterList';

export default function MangaPage() {
  const params = useParams();
  const id = Number(params.id);
  const [manga, setManga] = useState<Manga | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchManga = async () => {
      try {
        const data = await mangaApi.get(id);
        setManga(data);
      } catch (err) {
        setError('Failed to load manga');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchManga();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (error || !manga) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-500">{error || 'Manga not found'}</div>
        <Link href="/" className="block text-center mt-4 text-blue-600">
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block">
        ← Back to Library
      </Link>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Cover Image */}
        <div className="w-full md:w-1/3 lg:w-1/4">
          <div className="aspect-[3/4] bg-gray-200 rounded-lg overflow-hidden shadow-lg">
            {manga.cover_image ? (
              <img
                src={manga.cover_image}
                alt={manga.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Manga Details */}
        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-4">{manga.title}</h1>
          {manga.description && (
            <p className="text-gray-600 mb-6">{manga.description}</p>
          )}

          {/* Chapters */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Chapters</h2>
            <ChapterList chapters={manga.chapters || []} />
          </div>
        </div>
      </div>
    </div>
  );
}
