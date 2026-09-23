import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { isManagerRole, StaffAuthClient, StaffPermission, StaffSession } from './staffAuth';

export interface StaffAuthState {
  client: StaffAuthClient;
  session: StaffSession | null;
  loading: boolean;
  login: (stylistId: string, pin: string) => Promise<void>;
  logout: () => Promise<void>;
  // 自分の役割・権限が変わったときに読み直す
  refresh: () => Promise<void>;
  // 画面の表示切り替え用。実際の権限チェックは API 側で行う
  can: (permission: StaffPermission) => boolean;
  isManager: boolean;
}

const AuthContext = createContext<StaffAuthState | null>(null);

// Salon App / Stylist App 共通のログイン状態。client にはアプリごとの createStaffAuthClient の結果を渡す
export const StaffAuthProvider: React.FC<{ client: StaffAuthClient; children: React.ReactNode }> = ({ client, children }) => {
  const [session, setSession] = useState<StaffSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.me()
      .then(setSession)
      .catch(() => setSession(null))
      .finally(() => setLoading(false));
    return client.onUnauthorized(() => setSession(null));
  }, [client]);

  const login = useCallback(async (stylistId: string, pin: string) => {
    setSession(await client.login(stylistId, pin));
  }, [client]);

  const logout = useCallback(async () => {
    await client.logout();
    setSession(null);
  }, [client]);

  const refresh = useCallback(async () => {
    setSession(await client.me());
  }, [client]);

  const can = useCallback(
    (permission: StaffPermission) => Boolean(session?.permissions.includes(permission)),
    [session]
  );

  return (
    <AuthContext.Provider value={{
      client,
      session,
      loading,
      login,
      logout,
      refresh,
      can,
      isManager: session ? isManagerRole(session.staff.role) : false,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useStaffAuth(): StaffAuthState {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useStaffAuth must be used inside StaffAuthProvider');
  return value;
}
