import { createContext, useContext, useEffect, useState, useCallback } from 'react';

const AuthContext = createContext(null);

const TOKEN_KEY = 'janseva_token';
const USER_KEY = 'janseva_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  });

  useEffect(() => {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  }, [user]);

  const login = useCallback((jwtResponse) => {
    // jwtResponse: { token, id, name, role, employeeId, firstLogin }
    localStorage.setItem(TOKEN_KEY, jwtResponse.token);
    setUser({
      id: jwtResponse.id,
      name: jwtResponse.name,
      role: jwtResponse.role,
      employeeId: jwtResponse.employeeId || null,
    });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  /** Called after a successful profile edit so the navbar/role-chip reflects the new name immediately. */
  const updateUserName = useCallback((newName) => {
    setUser((u) => (u ? { ...u, name: newName } : u));
  }, []);

  const isAuthenticated = !!user && !!localStorage.getItem(TOKEN_KEY);

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUserName, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export const ROLE_LABELS = {
  CITIZEN: 'Citizen',
  VAO: 'VAO',
  RI: 'RI',
  TAHSILDAR: 'Tahsildar',
  DEPARTMENT_OFFICER: 'Department Officer',
  FIELD_OFFICER: 'Field Officer',
  GRIEVANCE_OFFICER: 'Grievance Officer',
  ADMINISTRATOR: 'Administrator',
};

export const ROLE_HOME = {
  CITIZEN: '/citizen',
  VAO: '/officer/queue',
  RI: '/officer/queue',
  TAHSILDAR: '/officer/queue',
  DEPARTMENT_OFFICER: '/officer/department',
  FIELD_OFFICER: '/officer/field',
  GRIEVANCE_OFFICER: '/officer/grievance-oversight',
  ADMINISTRATOR: '/admin',
};
