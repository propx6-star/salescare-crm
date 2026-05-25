import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Role = 'SUPER_ADMIN' | 'SHOP_OWNER' | 'MANAGER' | 'SALES' | 'STAFF' | 'ACCOUNTANT';

export interface UserProfile {
  id: number;
  shop_id?: number; // SUPER_ADMIN might not have a fixed shop_id, or can switch
  email: string;
  full_name: string;
  role: Role;
  permissions: string[];
}

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  login: (user: UserProfile) => void;
  logout: () => void;
  hasPermission: (permissionKey: string) => boolean;
  switchShop: (shopId: number) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      login: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
      hasPermission: (permissionKey: string) => {
        const user = get().user;
        if (!user) return false;
        if (user.role === 'SUPER_ADMIN') return true;
        return user.permissions.includes(permissionKey);
      },
      switchShop: (shopId: number) => {
        const user = get().user;
        if (user && user.role === 'SUPER_ADMIN') {
          set({ user: { ...user, shop_id: shopId } });
        }
      }
    }),
    {
      name: 'salescare-auth-v5',
    }
  )
);
