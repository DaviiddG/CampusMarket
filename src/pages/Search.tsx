import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon, X, ArrowRight, User, Store } from 'lucide-react';
import MobileContainer from '@/components/layout/MobileContainer';
import BottomNav from '@/components/layout/BottomNav';
import { supabase } from '@/lib/supabase';
import { useAuthContext } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';

const DEFAULT_AVATAR = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI0UyRThGMCIvPjxjaXJjbGUgY3g9IjUwIiBjeT0iNDAiIHI9IjIwIiBmaWxsPSIjOTRBM0I4Ii8+PHBhdGggZD0iTTIwIDEwMGEzMCAzMCAwIDAgMSA2MCAwIiBmaWxsPSIjOTRBM0I4Ii8+PC9zdmc+';

interface Profile {
  id: string;
  business_name: string;
  avatar_url: string | null;
  role: string;
  bio?: string | null;
}

export default function SearchPage() {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Profile[]>([]);
  const [suggestions, setSuggestions] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(true);

  // Load initial suggestions on mount
  useEffect(() => {
    const fetchSuggestions = async () => {
      setSuggestionsLoading(true);
      try {
        // Get suggestions: latest profiles excluding current user
        const { data } = await supabase
          .from('profiles')
          .select('id, business_name, avatar_url, role, bio')
          .neq('id', user?.id || '')
          .not('business_name', 'is', null)
          .order('updated_at', { ascending: false })
          .limit(12);
        setSuggestions(data || []);
      } catch (e) {
        console.error('Error fetching suggestions:', e);
      } finally {
        setSuggestionsLoading(false);
      }
    };
    fetchSuggestions();
  }, [user?.id]);

  // Search profiles as user types
  const searchProfiles = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, business_name, avatar_url, role, bio')
        .ilike('business_name', `%${q.trim()}%`)
        .neq('id', user?.id || '')
        .limit(20);
      setResults(data || []);
    } catch (e) {
      console.error('Error searching:', e);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    const timer = setTimeout(() => searchProfiles(query), 300);
    return () => clearTimeout(timer);
  }, [query, searchProfiles]);

  const handleProfileClick = (profileId: string) => {
    navigate(`/user/${profileId}`);
  };

  const ProfileRow = ({ profile, index }: { profile: Profile; index: number }) => (
    <motion.button
      key={profile.id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: Math.min(index * 0.04, 0.3) }}
      onClick={() => handleProfileClick(profile.id)}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-gray-50 transition-colors text-left group"
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-100 shadow-sm">
          <img
            src={profile.avatar_url || DEFAULT_AVATAR}
            alt={profile.business_name}
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_AVATAR; }}
          />
        </div>
        {/* Role badge */}
        <div className={`absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white ${profile.role === 'emprendedor' ? 'bg-blue-500' : 'bg-gray-400'}`}>
          {profile.role === 'emprendedor'
            ? <Store size={10} className="text-white" />
            : <User size={10} className="text-white" />
          }
        </div>
      </div>
      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-roboto font-semibold text-[14px] text-black truncate group-hover:text-primary transition-colors">
          {profile.business_name}
        </p>
        <p className="font-roboto text-[12px] text-gray-400 truncate">
          {profile.role === 'emprendedor' ? 'Emprendedor · CampusMarket' : 'Usuario · CampusMarket'}
        </p>
      </div>
      <ArrowRight size={16} className="text-gray-300 group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0" />
    </motion.button>
  );

  const showResults = query.trim().length > 0;

  return (
    <MobileContainer className="bg-white" justifyCenter={false}>
      <div className="w-full pb-[80px] lg:pb-10">
        <div className="max-w-[800px] mx-auto w-full">

          {/* Header */}
          <div className="px-4 pt-10 pb-2 lg:pt-12 lg:px-6">
            <h1 className="font-roboto font-bold text-[26px] text-black mb-1">Buscar</h1>
            <p className="text-gray-400 text-[14px] font-roboto mb-5">Encuentra negocios y personas en CampusMarket</p>

            {/* Search input */}
            <div className="relative">
              <SearchIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar perfiles, negocios..."
                className="w-full h-12 pl-11 pr-11 bg-gray-50 border border-gray-200 rounded-2xl font-roboto text-[15px] text-black placeholder-gray-400 focus:outline-none focus:border-primary/40 focus:bg-white transition-all"
                autoFocus
              />
              <AnimatePresence>
                {query && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={() => setQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 bg-gray-200 rounded-full text-gray-500 hover:bg-gray-300 transition-colors"
                  >
                    <X size={14} />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Results */}
          <div className="px-2 mt-3">
            <AnimatePresence mode="wait">
              {showResults ? (
                <motion.div
                  key="results"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  {loading ? (
                    <div className="flex justify-center py-16">
                      <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    </div>
                  ) : results.length > 0 ? (
                    <>
                      <p className="font-roboto text-[12px] text-gray-400 uppercase tracking-wider px-4 mb-2">
                        {results.length} resultado{results.length !== 1 ? 's' : ''}
                      </p>
                      <div className="space-y-1">
                        {results.map((profile, i) => (
                          <ProfileRow key={profile.id} profile={profile} index={i} />
                        ))}
                      </div>
                    </>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col items-center justify-center py-20 text-center"
                    >
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                        <SearchIcon size={28} className="text-gray-300" />
                      </div>
                      <p className="font-roboto font-bold text-[16px] text-black mb-1">Sin resultados</p>
                      <p className="font-roboto text-[13px] text-gray-400">No encontramos a nadie con ese nombre.</p>
                    </motion.div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="suggestions"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <p className="font-roboto text-[12px] text-gray-400 uppercase tracking-wider px-4 mb-2">
                    Sugerencias para ti
                  </p>
                  {suggestionsLoading ? (
                    <div className="flex justify-center py-12">
                      <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    </div>
                  ) : suggestions.length > 0 ? (
                    <div className="space-y-1">
                      {suggestions.map((profile, i) => (
                        <ProfileRow key={profile.id} profile={profile} index={i} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-sm text-center py-10 font-roboto">
                      No hay sugerencias disponibles.
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>
      <BottomNav activeTab="search" />
    </MobileContainer>
  );
}
