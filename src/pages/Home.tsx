import React from 'react';
import MobileContainer from '@/components/layout/MobileContainer';
import ProductCard from '@/components/home/ProductCard';
import BottomNav from '@/components/layout/BottomNav';
import { Search } from 'lucide-react';
import logoUrl from '@/assets/logo.png';
import productosUrl from '@/assets/productos.jpg';

import { useFeedContext } from '@/contexts/FeedContext';

export default function Home() {
  const { posts } = useFeedContext();

  return (
    <MobileContainer className="bg-white" justifyCenter={false}>
      {/* Top Header Section */}
      <div className="w-full flex flex-col items-center pt-4 px-4">
        {/* Logo */}
        <div className="w-[120px] h-[120px] mb-4">
          <img 
            src={logoUrl} 
            alt="CampusMarket Logo" 
            className="w-full h-full object-contain"
          />
        </div>

        {/* Search Bar */}
        <div className="w-full bg-[#E8E8E8] h-[40px] rounded-xl flex items-center px-4 gap-3 mb-6">
          <Search size={18} className="text-grayDark" />
          <input 
            type="text" 
            placeholder="Buscar..." 
            className="bg-transparent border-none outline-none text-[17px] font-roboto text-grayText w-full"
          />
        </div>
      </div>

      {/* Feed Area - Scrollable */}
      <div className="flex-1 w-full overflow-y-auto no-scrollbar pb-[70px]">
        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center text-gray-500 h-[60%]">
            <Search size={40} className="mb-4 opacity-50" />
            <p className="font-roboto mb-2">No hay publicaciones aún.</p>
            <p className="font-poppins font-bold text-sm">¡Sé el primero en publicar el tuyo!</p>
          </div>
        ) : (
          posts.map(post => (
            <ProductCard 
              key={post.id}
              {...post}
            />
          ))
        )}
      </div>

      {/* Persistent Bottom Nav */}
      <div className="absolute bottom-0 left-0 w-full z-20">
        <BottomNav activeTab="home" />
      </div>
    </MobileContainer>
  );
}
