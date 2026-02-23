'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { mangaApi } from '@/lib/api';

export default function UploadPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [chapters, setChapters] = useState<{ number: number; title: string; file: File | null }[]>([
    { number: 1, title: '', file: null }
  ]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  const addChapter = () => {
    setChapters([
      ...chapters,
      { number: chapters.length + 1, title: '', file: null }
    ]);
  };

  const removeChapter = (index: number) => {
    if (chapters.length > 1) {
      setChapters(chapters.filter((_, i) => i !== index));
    }
  };

  const updateChapter = (index: number, field: string, value: any) => {
    const updated = [...chapters];
    (updated[index] as any)[field] = value;
    setChapters(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Check if all chapters have files
    const chaptersWithFiles = chapters.filter(c => c.file);
    if (chaptersWithFiles.length === 0) {
      setError('Please upload at least one chapter');
      return;
    }

    setUploading(true);

    try {
      // Create manga first
      const manga = await mangaApi.create(title, description);

      // Upload chapters
      for (const chapter of chapters) {
        if (chapter.file) {
          await mangaApi.uploadChapter(
            manga.id,
            chapter.number,
            chapter.title || null,
            chapter.file
          );
        }
      }

      // Publish manga
      await mangaApi.update(manga.id, { is_published: true });

      setSuccess('Manga uploaded successfully!');
      setTitle('');
      setDescription('');
      setChapters([{ number: 1, title: '', file: null }]);

      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  if (authLoading) {
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
      <Link href="/admin" className="text-blue-600 hover:underline mb-4 inline-block">
        ← Back to Admin
      </Link>

      <h1 className="text-3xl font-bold mb-8">Upload Manga</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Manga Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            required
          />
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            rows={4}
          />
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Chapters</h2>
          {chapters.map((chapter, index) => (
            <div key={index} className="flex gap-4 mb-4 items-start">
              <div className="w-20">
                <label className="block text-gray-700 text-sm font-bold mb-1">
                  #
                </label>
                <input
                  type="number"
                  min="1"
                  value={chapter.number}
                  onChange={(e) => updateChapter(index, 'number', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div className="flex-1">
                <label className="block text-gray-700 text-sm font-bold mb-1">
                  Title (optional)
                </label>
                <input
                  type="text"
                  value={chapter.title}
                  onChange={(e) => updateChapter(index, 'title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex-1">
                <label className="block text-gray-700 text-sm font-bold mb-1">
                  ZIP File
                </label>
                <input
                  type="file"
                  accept=".zip"
                  onChange={(e) => updateChapter(index, 'file', e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              <button
                type="button"
                onClick={() => removeChapter(index)}
                className="mt-6 px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                disabled={chapters.length === 1}
              >
                Remove
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={addChapter}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            + Add Chapter
          </button>
        </div>

        <button
          type="submit"
          disabled={uploading}
          className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {uploading ? 'Uploading...' : 'Upload Manga'}
        </button>
      </form>
    </div>
  );
}
