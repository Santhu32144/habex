import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const ADMIN_EMAILS = ['ssssanthu32144@gmail.com'];

export const useAdmin = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      // Check if user email is in admin list
      if (ADMIN_EMAILS.includes(user.email || '')) {
        setIsAdmin(true);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin',
      });

      if (!error) {
        setIsAdmin(data === true);
      }
      setIsLoading(false);
    };

    checkAdmin();
  }, [user]);

  return { isAdmin, isLoading };
};
