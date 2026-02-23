'use client';

import { useState, useEffect, useCallback } from 'react';

interface ReaderProps {
  pages: string[];
  chapterId: number;
  apiUrl: string;
}

type ReadingMode = 'webtoon' | 'manga';

export default function Reader({ pages, chapterId, apiUrl }: ReaderProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [readingMode, setReadingMode] = useState<ReadingMode>('webtoon');
  const [loading, setLoading] = useState(true);

  const getPageUrl = (filename: string) => {
    return `${apiUrl}/api/chapters/${chapterId}/pages/${filename}`;
  };

  const getFilename = (url: string) => {
    return url.split('/').pop() || '';
  };

  const nextPage = useCallback(() => {
    if (currentPage < pages.length - 1) {
      setCurrentPage(currentPage + 1);
    }
  }, [currentPage, pages.length]);

  const prevPage = useCallback(() => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  }, [currentPage]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (readingMode === 'manga') {
        if (e.key === 'ArrowRight' || e.key === ' ') {
          nextPage();
        } else if (e.key === 'ArrowLeft') {
          prevPage();
        }
      } else {
        if (e.key === 'ArrowDown' || e.key === ' ') {
          window.scrollBy(0, window.innerHeight);
        } else if (e.key === 'ArrowUp') {
          window.scrollBy(0, -window.innerHeight);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [readingMode, nextPage, prevPage]);

  useEffect(() => {
    setLoading(false);
  }, [pages]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (pages.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-500">No pages found</div>
      </div>
    );
  }

  // Webtoon mode (vertical scroll)
  if (readingMode === 'webtoon') {
    return (
      <div className="min-h-screen bg-gray-900">
        {/* Controls */}
        <div className="fixed top-4 right-4 z-50 flex gap-2">
          <button
            onClick={() => setReadingMode('manga')}
            className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
          >
            Switch to Manga (RTL)
          </button>
        </div>

        {/* Pages */}
        <div className="max-w-3xl mx-auto">
          {pages.map((page, index) => (
            <div key={index} className="relative w-full">
              <img
                src={getPageUrl(getFilename(page))}
                alt={`Page ${index + 1}`}
                className="w-full h-auto"
              />
            </div>
          ))}
        </div>

        {/* Navigation hint */}
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded">
          Use arrow keys or scroll to navigate
        </div>
      </div>
    );
  }

  // Manga mode (RTL single page)
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Controls */}
      <div className="fixed top-4 right-4 z-50 flex gap-2">
        <button
          onClick={() => setReadingMode('webtoon')}
          className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
        >
          Switch to Webtoon
        </button>
      </div>

      {/* Page display */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="relative max-h-screen">
          <img
            src={getPageUrl(getFilename(pages[currentPage]))}
            alt={`Page ${currentPage + 1}`}
            className="max-h-[90vh] w-auto"
            onClick={(e) => {
              const img = e.currentTarget;
              const rect = img.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const isRightHalf = clickX > rect.width / 2;
              if (isRightHalf) {
                prevPage();
              } else {
                nextPage();
              }
            }}
            style={{ cursor: 'pointer' }}
          />
        </div>
      </div>

      {/* Page navigation */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-4 bg-gray-800 text-white px-6 py-3 rounded-lg">
        <button
          onClick={prevPage}
          disabled={currentPage === pages.length - 1}
          className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-50"
        >
          Next →
        </button>
        <span>
          {currentPage + 1} / {pages.length}
        </span>
        <button
          onClick={nextPage}
          disabled={currentPage === 0}
          className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-50"
        >
          ← Prev
        </button>
      </div>
    </div>
  );
}
