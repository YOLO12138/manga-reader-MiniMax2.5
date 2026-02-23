'use client';

import Link from 'next/link';
import { MangaListItem } from '@/types';

interface MangaCardProps {
  manga: MangaListItem;
}

export default function MangaCard({ manga }: MangaCardProps) {
  return (
    <Link href={`/manga/${manga.id}`}>
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
        <div className="aspect-[3/4] bg-gray-200 relative">
          {manga.cover_image ? (
            <img
              src={manga.cover_image}
              alt={manga.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <svg
                className="w-16 h-16"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-lg truncate">{manga.title}</h3>
          {manga.description && (
            <p className="text-gray-600 text-sm mt-1 line-clamp-2">
              {manga.description}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
