'use client';

import Link from 'next/link';
import { Chapter } from '@/types';

interface ChapterListProps {
  chapters: Chapter[];
}

export default function ChapterList({ chapters }: ChapterListProps) {
  if (chapters.length === 0) {
    return (
      <p className="text-gray-500 text-center py-4">No chapters available yet.</p>
    );
  }

  return (
    <div className="grid gap-2">
      {chapters.map((chapter) => (
        <Link
          key={chapter.id}
          href={`/read/${chapter.id}`}
          className="block p-4 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="font-semibold">Chapter {chapter.chapter_number}</span>
              {chapter.title && (
                <span className="ml-2 text-gray-600">- {chapter.title}</span>
              )}
            </div>
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </Link>
      ))}
    </div>
  );
}
