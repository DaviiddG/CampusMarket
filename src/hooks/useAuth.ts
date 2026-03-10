import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export function useAuth() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const signUp = async (email: string, password: string, options?: unknown) => {
        setLoading(true);
        setError(null);
        try {
            const { data, error: sbError } = await supabase.auth.signUp({
                email,
                password,
                options: options as never,
            });
            if (sbError) throw sbError;
            return data;
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Error occurred during sign up';
            setError(message);
            return null;
        } finally {
            setLoading(false);
        }
    };

    const signIn = async (email: string, password: string) => {
        setLoading(true);
        setError(null);
        try {
            const { data, error: sbError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (sbError) throw sbError;
            return data;
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Error occurred during sign in';
            setError(message);
            return null;
        } finally {
            setLoading(false);
        }
    };

    const signInWithFacebook = async () => {
        try {
            const { error: sbError } = await supabase.auth.signInWithOAuth({
                provider: 'facebook',
            });
            if (sbError) throw sbError;
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Error occurred during FB sign in';
            setError(message);
        }
    };

    const signOut = async () => {
        setLoading(true);
        try {
            await supabase.auth.signOut();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Error occurred during sign out';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return { signUp, signIn, signInWithFacebook, signOut, loading, error };
}
