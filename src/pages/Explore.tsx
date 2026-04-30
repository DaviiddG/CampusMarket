import { useState, useMemo } from 'react';
import MobileContainer from '@/components/layout/MobileContainer';
import BottomNav from '@/components/layout/BottomNav';
import { useFeedContext, type Post } from '@/contexts/FeedContext';
import { Search, X, SearchX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from '@/components/home/ProductCard';

const CATEGORIES = ['Todos', 'Tecnología', 'Comida', 'Ropa', 'Servicios', 'Otros'];

export default function Explore() {
  const { posts } = useFeedContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        post.description?.toLowerCase().includes(searchLower) ||
        post.businessName?.toLowerCase().includes(searchLower);

      const categoryMapping: Record<string, string> = {
        'Tecnología': 'tecnologia',
        'Comida': 'comida',
        'Ropa': 'ropa',
        'Servicios': 'servicios',
        'Otros': 'otros'
      };

      const dbCategory = categoryMapping[activeCategory];
      const matchesCategory =
        activeCategory === 'Todos' ||
        post.category === dbCategory;

      return matchesSearch && matchesCategory;
    });
  }, [posts, searchTerm, activeCategory]);

  return (
    <MobileContainer className="bg-[#F8F9FA] min-h-screen" justifyCenter={false}>
      {/* 
        The sticky header MUST be w-full and self-contained.
        We use a negative margin trick to escape the parent's max-width constraint on mobile.
      */}
      <div className="sticky top-0 z-20 w-full bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="w-full px-4 pt-10 pb-3">
          <h1 className="font-roboto font-bold text-[20px] text-black mb-3 ml-0.5">Explorar</h1>

          {/* Search bar */}
          <div className="relative mb-3">
            <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              className="w-full h-10 pl-10 pr-9 bg-gray-100 border border-transparent rounded-xl text-[14px] placeholder-gray-400 focus:bg-white focus:border-primary/30 focus:outline-none transition-all font-roboto"
              placeholder="Buscar productos, negocios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 bg-gray-200 rounded-full text-gray-500 hover:bg-gray-300 transition-colors"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Category chips */}
          <div className="flex overflow-x-auto no-scrollbar gap-2 -mx-4 px-4">
            {CATEGORIES.map(category => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`whitespace-nowrap px-3.5 py-1.5 rounded-full font-roboto font-medium text-[12px] transition-all flex-shrink-0 border ${
                  activeCategory === category
                    ? 'bg-[#102042] text-white border-[#102042]'
                    : 'bg-white text-gray-600 border-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="w-full px-3 pt-3 pb-[90px]">
        {filteredPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center px-6">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
              <SearchX className="w-8 h-8 text-blue-300" />
            </div>
            <h3 className="font-roboto font-bold text-lg text-gray-700 mb-1">No hay resultados</h3>
            <p className="font-roboto text-sm text-gray-500">Prueba buscando con otras palabras o cambia la categoría.</p>
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <AnimatePresence>
              {filteredPosts.map((post) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  key={post.id}
                  className="relative aspect-[4/5] overflow-hidden bg-gray-200 rounded-2xl cursor-pointer group shadow-sm"
                  onClick={() => setSelectedPost(post)}
                >
                  <img
                    src={post.imageUrl}
                    alt={post.description}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full overflow-hidden border border-white/60 flex-shrink-0">
                        <img src={post.avatarUrl} alt={post.businessName} className="w-full h-full object-cover" />
                      </div>
                      <span className="text-white font-roboto font-medium text-[12px] truncate">{post.businessName}</span>
                    </div>
                  </div>
                  {post.price && (
                    <div className="absolute top-2 right-2 bg-black/55 backdrop-blur-sm px-2 py-0.5 rounded-full">
                      <span className="text-white font-roboto font-bold text-[11px]">${post.price}</span>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Product Modal */}
      <AnimatePresence>
        {selectedPost && (
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPost(null)}
              className="absolute inset-0"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-h-[92vh] md:max-w-[450px] md:max-h-[90vh] bg-white rounded-t-3xl md:rounded-[2rem] overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
                <span className="font-roboto font-bold text-[16px]">Producto</span>
                <button
                  onClick={() => setSelectedPost(null)}
                  className="p-2 bg-gray-100 rounded-full text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto no-scrollbar bg-gray-50 pb-[env(safe-area-inset-bottom)]">
                <div className="bg-white">
                  <ProductCard {...selectedPost} />
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <BottomNav activeTab="explore" />
    </MobileContainer>
  );
}
