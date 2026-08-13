'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import {
  Waves, Dumbbell, Trees, Building2, Mountain, Castle, Sailboat,
  Flame, Snowflake, Star, Coffee, Sun, Wind, Tent, Hotel
} from 'lucide-react';

const CATEGORIES = [
  { id: 'beach_house', label: 'Beach', icon: Waves },
  { id: 'villa', label: 'Villas', icon: Star },
  { id: 'cabin', label: 'Cabins', icon: Trees },
  { id: 'apartment', label: 'City', icon: Building2 },
  { id: 'house', label: 'Houses', icon: Hotel },
  { id: 'loft', label: 'Lofts', icon: Coffee },
  { id: 'cottage', label: 'Farms', icon: Sun },
  { id: 'treehouse', label: 'Treehouses', icon: Wind },
  { id: 'studio', label: 'Studios', icon: Dumbbell },
  { id: 'mansion', label: 'Mansions', icon: Castle },
];

export default function Categories() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get('category');

  const handleCategory = (categoryId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (activeCategory === categoryId) {
      params.delete('category');
    } else {
      params.set('category', categoryId);
    }
    router.push(`/?${params.toString()}`);
  };

  return (
    <div className="bg-white dark:bg-[#121212] border-b border-gray-200 dark:border-zinc-800 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8 overflow-x-auto no-scrollbar py-4">
          {CATEGORIES.map(({ id, label, icon: Icon }) => {
            const isActive = activeCategory === id;
            return (
              <button
                key={id}
                onClick={() => handleCategory(id)}
                className={`flex flex-col items-center gap-1.5 min-w-fit pb-2 border-b-2 transition-all duration-200 hover:border-gray-400 dark:hover:border-zinc-500 hover:text-gray-800 dark:hover:text-zinc-200 cursor-pointer ${
                  isActive
                    ? 'border-[#222222] dark:border-white text-[#222222] dark:text-white font-semibold'
                    : 'border-transparent text-gray-500 dark:text-zinc-400'
                }`}
              >
                <Icon
                  className={`w-6 h-6 transition-colors ${
                    isActive ? 'text-[#222222] dark:text-white' : 'text-gray-400 dark:text-zinc-550'
                  }`}
                  strokeWidth={1.5}
                />
                <span className="text-xs font-medium whitespace-nowrap">{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
