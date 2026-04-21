import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Session, User } from '@supabase/supabase-js';

type AuthContextType = {
    session: Session | null;
    user: User | null;
    loading: boolean;
};

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    loading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch current session
        const fetchSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        };

        fetchSession();

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                setSession(session);
                setUser(session?.user ?? null);
                setLoading(false);
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    // Effect to ensure user metadata is synced with the public profiles table
    useEffect(() => {
        const syncProfile = async () => {
            if (!user) return;
            
            try {
                // Get the most accurate name from metadata
                const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario';
                const avatar = user.user_metadata?.avatar_url;

                // Sync profile if it's missing or if the current user just logged in
                // This ensures all users (common and entrepreneurs) are in the public profiles table
                await supabase.from('profiles').upsert({
                    id: user.id,
                    business_name: name,
                    avatar_url: avatar || null,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'id', ignoreDuplicates: false });
            } catch (e) {
                console.error('Error syncing profile:', e);
            }
        };

        if (user) {
            syncProfile();
        }
    }, [user]);

    return (
        <AuthContext.Provider value={{ session, user, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuthContext = () => {
    return useContext(AuthContext);
};
