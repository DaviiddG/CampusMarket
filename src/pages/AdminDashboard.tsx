import { useState, useEffect } from 'react';
import MobileContainer from '@/components/layout/MobileContainer';
import { supabase } from '@/lib/supabase';
import { Trash2, UserX, Key, ShieldAlert, BarChart3, Users, Package, LogOut, ChevronRight, Search, Star, MessageSquare, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState<'stats' | 'posts' | 'users'>('stats');
    const [stats, setStats] = useState({ totalPosts: 0, totalUsers: 0, totalSales: 0 });
    const [posts, setPosts] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'stats') {
                const { count: postCount } = await supabase.from('posts').select('*', { count: 'exact', head: true });
                const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
                setStats({ 
                    totalPosts: postCount || 0, 
                    totalUsers: userCount || 0, 
                    totalSales: 0 
                });
            } else if (activeTab === 'posts') {
                // Fetch posts with profiles info. 
                // We use a safe join. If it fails, we fetch posts alone.
                const { data, error } = await supabase
                    .from('posts')
                    .select('*, profiles(business_name, full_name)')
                    .order('created_at', { ascending: false });
                
                if (error) {
                    console.warn('Join with profiles failed, fetching posts alone:', error);
                    const { data: simpleData, error: simpleError } = await supabase
                        .from('posts')
                        .select('*')
                        .order('created_at', { ascending: false });
                    if (simpleError) throw simpleError;
                    setPosts(simpleData || []);
                } else {
                    setPosts(data || []);
                }
            } else if (activeTab === 'users') {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('id, full_name, business_name, avatar_url, email, role, created_at')
                    .order('created_at', { ascending: false });
                
                if (error) {
                    console.error('Error fetching users:', error);
                    throw error;
                }
                setUsers(data || []);
            }
        } catch (error) {
            console.error('Error fetching admin data:', error);
        } finally {
            setLoading(false);
        }
    };

    const deletePost = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar esta publicación?')) return;
        try {
            const { error } = await supabase.from('posts').delete().eq('id', id);
            if (error) throw error;
            setPosts(prev => prev.filter(p => p.id !== id));
            setStats(prev => ({ ...prev, totalPosts: prev.totalPosts - 1 }));
        } catch (err) {
            alert('Error al eliminar la publicación.');
        }
    };

    const deleteUser = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este usuario? Esto no se puede deshacer.')) return;
        try {
            const { error } = await supabase.from('profiles').delete().eq('id', id);
            if (error) throw error;
            setUsers(prev => prev.filter(u => u.id !== id));
            setStats(prev => ({ ...prev, totalUsers: prev.totalUsers - 1 }));
        } catch (err) {
            alert('Error al eliminar el usuario.');
        }
    };

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
            // Using window.location to force a clean state after logout
            window.location.replace('/auth-portal');
        } catch (error) {
            console.error('Logout error:', error);
            window.location.replace('/auth-portal');
        }
    };

    return (
        <MobileContainer className="bg-white flex flex-col" showSidebars={false}>
            {/* Admin Header */}
            <header className="bg-white border-b border-gray-100 p-6 pt-12">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="p-1 bg-red-50 text-red-500 rounded-lg">
                                <ShieldAlert size={14} />
                            </div>
                            <span className="text-[11px] font-bold uppercase tracking-[2px] text-gray-400">Panel de Control</span>
                        </div>
                        <h1 className="text-2xl font-bold font-roboto text-black">Administración</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => navigate('/')}
                            className="p-2 text-gray-400 hover:text-primary hover:bg-blue-50 rounded-xl transition-all"
                            title="Ir a la App"
                        >
                            <Home size={22} />
                        </button>
                        <button 
                            onClick={handleLogout}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                            title="Cerrar Sesión"
                        >
                            <LogOut size={22} />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex p-1 bg-gray-100 rounded-2xl">
                    {(['stats', 'posts', 'users'] as const).map((tab) => (
                        <button 
                            key={tab}
                            onClick={() => {
                                setActiveTab(tab);
                                setSearchQuery('');
                            }}
                            className={cn(
                                "flex-1 py-2.5 rounded-xl text-xs font-bold transition-all capitalize font-roboto",
                                activeTab === tab ? "bg-white text-primary shadow-sm" : "text-gray-500"
                            )}
                        >
                            {tab === 'stats' ? 'Global' : tab === 'posts' ? 'Publicaciones' : 'Usuarios'}
                        </button>
                    ))}
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
                <AnimatePresence mode="wait">
                    {activeTab === 'stats' && (
                        <motion.div 
                            key="stats-view"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                        >
                            <div className="grid grid-cols-2 gap-4">
                                <StatCard 
                                    icon={<Package className="text-blue-500" />} 
                                    label="Posts Activos" 
                                    value={stats.totalPosts} 
                                    bg="bg-blue-50" 
                                />
                                <StatCard 
                                    icon={<Users className="text-purple-500" />} 
                                    label="Usuarios" 
                                    value={stats.totalUsers} 
                                    bg="bg-purple-50" 
                                />
                            </div>
                            
                            <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100">
                                <h3 className="font-bold text-black mb-6 flex items-center gap-2 font-roboto">
                                    <BarChart3 size={18} className="text-primary" />
                                    Actividad Reciente
                                </h3>
                                <div className="space-y-5">
                                    {posts.slice(0, 3).map((post, i) => (
                                        <div key={post.id} className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-gray-100 overflow-hidden">
                                                <img src={post.image_url} className="w-full h-full object-cover" alt="" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-black truncate">
                                                    {post.business_name || post.profiles?.business_name || post.profiles?.full_name || 'Publicación'}
                                                </p>
                                                <p className="text-[11px] text-gray-400">Nueva publicación hace poco</p>
                                            </div>
                                            <div className="w-2 h-2 rounded-full bg-primary" />
                                        </div>
                                    ))}
                                    {posts.length === 0 && (
                                        <div className="py-10 text-center">
                                            <p className="text-sm text-gray-400">No hay actividad reciente para mostrar.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {(activeTab === 'posts' || activeTab === 'users') && (
                        <motion.div 
                            key="list-view"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-4"
                        >
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
                                <input 
                                    type="text"
                                    placeholder={`Buscar por nombre o descripción...`}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full h-14 bg-white border border-gray-100 rounded-2xl pl-12 pr-4 text-sm focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all shadow-sm font-roboto"
                                />
                            </div>

                            {loading ? (
                                <div className="py-20 flex flex-col items-center justify-center gap-4">
                                    <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                                    <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest font-roboto">Sincronizando Datos</p>
                                </div>
                            ) : (
                                <div className="space-y-3 pb-20">
                                    {activeTab === 'posts' && (
                                        posts.filter(p => 
                                            p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                            (p.business_name || p.profiles?.business_name || p.profiles?.full_name || '').toLowerCase().includes(searchQuery.toLowerCase())
                                        ).length > 0 ? (
                                            posts
                                            .filter(p => 
                                                p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                (p.business_name || p.profiles?.business_name || p.profiles?.full_name || '').toLowerCase().includes(searchQuery.toLowerCase())
                                            )
                                            .map(post => (
                                                <div key={post.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-50 flex items-center gap-4 hover:border-primary/20 transition-colors">
                                                    <img src={post.image_url} className="w-14 h-14 rounded-xl object-cover" alt="" />
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-bold text-[13px] text-black truncate font-roboto">
                                                            {post.business_name || post.profiles?.business_name || post.profiles?.full_name || 'Sin Nombre'}
                                                        </h4>
                                                        <p className="text-[11px] text-gray-400 truncate mt-0.5">{post.description}</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-[9px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter">
                                                                {post.category || 'Varios'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <button 
                                                        onClick={() => deletePost(post.id)}
                                                        className="p-2.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                    >
                                                        <Trash2 size={20} />
                                                    </button>
                                                </div>
                                            ))
                                        ) : (
                                            <EmptyState message="No se encontraron publicaciones" />
                                        )
                                    )}

                                     {activeTab === 'users' && (
                                        users.filter(u => {
                                            const search = searchQuery.toLowerCase();
                                            return (u.business_name?.toLowerCase().includes(search) || 
                                                    u.full_name?.toLowerCase().includes(search) || 
                                                    u.email?.toLowerCase().includes(search));
                                        }).length > 0 ? (
                                            users
                                            .filter(u => {
                                                const search = searchQuery.toLowerCase();
                                                return (u.business_name?.toLowerCase().includes(search) || 
                                                        u.full_name?.toLowerCase().includes(search) || 
                                                        u.email?.toLowerCase().includes(search));
                                            })
                                            .map(user => (
                                                <div key={user.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-50 flex items-center gap-4 hover:border-primary/20 transition-colors">
                                                    <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center overflow-hidden border border-gray-100">
                                                        {user.avatar_url ? (
                                                            <img src={user.avatar_url} className="w-full h-full object-cover" alt="" />
                                                        ) : (
                                                            <Users size={24} className="text-gray-300" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-bold text-[13px] text-black truncate font-roboto">
                                                            {user.business_name || user.full_name || user.email?.split('@')[0]}
                                                        </h4>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className={cn(
                                                                "text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter",
                                                                user.role === 'admin' ? "bg-red-50 text-red-500" :
                                                                user.role === 'emprendedor' ? "bg-primary/10 text-primary" : "bg-gray-100 text-gray-500"
                                                            )}>
                                                                {user.role || 'Usuario'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <button 
                                                            onClick={() => navigate(`/user/${user.id}`)}
                                                            className="p-2.5 text-gray-300 hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
                                                            title="Ver Perfil"
                                                        >
                                                            <ChevronRight size={20} />
                                                        </button>
                                                        <button 
                                                            onClick={() => deleteUser(user.id)}
                                                            className="p-2.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                            title="Eliminar"
                                                        >
                                                            <UserX size={20} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <EmptyState message="No se encontraron usuarios" />
                                        )
                                    )}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </MobileContainer>
    );
}

function StatCard({ icon, label, value, bg }: any) {
    return (
        <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center hover:border-primary/10 transition-colors">
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-4 shadow-sm", bg)}>
                {icon}
            </div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[1px] mb-1 font-roboto">{label}</span>
            <span className="text-2xl font-bold text-black font-roboto">{value}</span>
        </div>
    );
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="py-20 flex flex-col items-center justify-center text-center px-10">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <Search size={24} className="text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-400 font-roboto">{message}</p>
        </div>
    );
}
