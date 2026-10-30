import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';
import { AdminUser, AdminRole } from '../lib/database.types';

interface AdminAuthContextType {
  adminUser: AdminUser | null;
  isAdmin: boolean; // Has active status in admin_users
  role: AdminRole | null;
  isSuperAdmin: boolean; // role === 'admin'
  isSupport: boolean;    // role === 'support'
  isContentEditor: boolean; // role === 'content_editor'
  isRevoked: boolean;
  isPending: boolean;
  loading: boolean;
  error: string | null;
  refetchAdmin: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAdminUser = useCallback(async () => {
    if (!user) {
      setAdminUser(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 1. Try finding row by user_id first
      let { data, error: fetchError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      // 2. If no record by user_id, check if an invite by email exists and sync
      if (!data && user.email) {
        try {
          const { data: syncedRecord } = await supabase.rpc('sync_current_admin_user');
          if (syncedRecord && typeof syncedRecord === 'object') {
            data = syncedRecord as AdminUser;
          }
        } catch (syncErr) {
          console.warn('Could not sync admin invite by RPC, attempting direct check:', syncErr);
        }

        // Fallback email query if RPC wasn't available
        if (!data) {
          const { data: emailMatch } = await supabase
            .from('admin_users')
            .select('*')
            .ilike('email', user.email)
            .maybeSingle();

          if (emailMatch) {
            data = emailMatch as AdminUser;
          }
        }
      }

      if (fetchError) {
        console.error('Error fetching admin user status:', fetchError);
        setError(fetchError.message);
        setAdminUser(null);
      } else {
        setAdminUser(data as AdminUser | null);
      }
    } catch (err: any) {
      console.error('Unexpected error checking admin privileges:', err);
      setError(err?.message || 'Failed to verify admin status');
      setAdminUser(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      fetchAdminUser();
    }
  }, [user, authLoading, fetchAdminUser]);

  const isActive = !!adminUser && adminUser.status === 'active';
  const role = adminUser?.role || null;

  return (
    <AdminAuthContext.Provider
      value={{
        adminUser,
        isAdmin: isActive,
        role,
        isSuperAdmin: isActive && role === 'admin',
        isSupport: isActive && role === 'support',
        isContentEditor: isActive && role === 'content_editor',
        isRevoked: !!adminUser && adminUser.status === 'revoked',
        isPending: !!adminUser && adminUser.status === 'pending',
        loading: authLoading || loading,
        error,
        refetchAdmin: fetchAdminUser,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
