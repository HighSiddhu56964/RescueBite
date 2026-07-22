import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);
const STORAGE_KEY = 'snakesafe_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load session from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
    setLoading(false);
  }, []);

  const saveSession = (userData) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
    setUser(userData);
  };

  // User login: query users table
  const loginUser = useCallback(async (username, password) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .single();

    if (error || !data) {
      return { success: false, message: 'Invalid credentials' };
    }

    const session = { id: data.id, name: data.name, username: data.username, age: data.age, gender: data.gender, phone: data.phone, role: 'user' };
    saveSession(session);
    return { success: true, user: session };
  }, []);

  // User register: insert into users table
  const registerUser = useCallback(async ({ name, age, gender, phone, username, password }) => {
    // Check if username already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .single();

    if (existingUser) {
      return { success: false, message: 'Username already taken' };
    }

    // Check if phone number already exists
    const { data: existingPhone } = await supabase
      .from('users')
      .select('id')
      .eq('phone', phone)
      .single();

    if (existingPhone) {
      return { success: false, message: 'Phone number already registered' };
    }

    const { data, error } = await supabase
      .from('users')
      .insert([{ name, age: parseInt(age, 10), gender, phone, username, password, role: 'user' }])
      .select()
      .single();

    if (error) {
      console.error('Register error:', error);
      return { success: false, message: error.message || 'Registration failed' };
    }

    return { success: true, user: data };
  }, []);

  // Authority login: query authorities table
  const loginAuthority = useCallback(async (grNumber, password) => {
    const { data, error } = await supabase
      .from('authorities')
      .select('*')
      .eq('gr_number', grNumber)
      .eq('password', password)
      .single();

    if (error || !data) {
      return { success: false, message: 'Invalid GR Number or Password' };
    }

    const session = { id: data.id, name: data.name, grNumber: data.gr_number, role: 'authority' };
    saveSession(session);
    return { success: true, user: session };
  }, []);

  // Authority register: insert into authorities table
  const registerAuthority = useCallback(async ({ organization_name, gr_number, password, antivenom_available }) => {
    const { data: existing } = await supabase
      .from('authorities')
      .select('id')
      .eq('gr_number', gr_number)
      .single();

    if (existing) {
      return { success: false, message: 'GR Number already registered' };
    }

    const { error } = await supabase
      .from('authorities')
      .insert([{ name: organization_name, gr_number, password, antivenom_available }]);

    if (error) {
      console.error('Authority register error:', error);
      return { success: false, message: error.message || 'Registration failed' };
    }

    return { success: true };
  }, []);

  const logout = useCallback(() => {
    // Clear ALL user-related cached data to prevent leakage
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('snakesafe_symptom_cache');
    localStorage.removeItem('snakesafe_language');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, loginUser, registerUser, loginAuthority, registerAuthority, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
