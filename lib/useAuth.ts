import { useEffect, useState } from 'react';

export interface User {
  id: string;
  email: string;
  username: string;
  name: string;
  image?: string;
}

interface UseAuthReturn {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  refetch: () => Promise<void>;
}

/**
 * Hook to manage JWT authentication
 * Fetches current user from /api/auth/me endpoint
 */
export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      window.location.href = '/auth';
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout,
    refetch: fetchUser,
  };
}
