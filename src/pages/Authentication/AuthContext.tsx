import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { API_Logout, API_Login } from '../../api/api';
import { toast, ToastContainer } from 'react-toastify';
import axios from 'axios';

type Role = '1' | '2' | '3' | null;

interface AuthContextProps {
  isAuthenticated: boolean;
  userRole: Role;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<Role>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const storedRole = localStorage.getItem('role') as Role | null;

    const loginError = sessionStorage.getItem('login_error');

    if (loginError) {
      setTimeout(() => {
        toast.error(loginError);
        sessionStorage.removeItem('login_error');
      }, 100);
    }

    if (token && storedRole && ['1', '2', '3'].includes(storedRole)) {
      setUserRole(storedRole);
      setIsAuthenticated(true);
    } else {
      if (storedRole && !['1', '2', '3'].includes(storedRole)) {
        toast.error('Invalid session data. Please log in again.');
      }
      localStorage.removeItem('access_token');
      localStorage.removeItem('role');
      localStorage.removeItem('name');
      localStorage.removeItem('token_expiration');
      setUserRole(null);
      setIsAuthenticated(false);
    }
    setIsLoading(false);

    const checkTokenExpiration = () => {
      const expirationTime = localStorage.getItem('token_expiration');
      if (!expirationTime) {
        if (localStorage.getItem('access_token')) {
          setUserRole(null);
          setIsAuthenticated(false);
          localStorage.removeItem('access_token');
          localStorage.removeItem('role');
          localStorage.removeItem('name');
          localStorage.removeItem('token_expiration');
          toast.info('Session data incomplete. Please log in again.');
        }
        return;
      }

      if (new Date().getTime() > parseInt(expirationTime)) {
        setUserRole(null);
        setIsAuthenticated(false);
        localStorage.removeItem('access_token');
        localStorage.removeItem('token_expiration');
        localStorage.removeItem('role');
        localStorage.removeItem('name');
        toast.error('Session expired, please login again');
      }
    };

    const interval = setInterval(checkTokenExpiration, 1000);
    return () => clearInterval(interval);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await axios.post(API_Login(), { username, password });
      const { access_token, role: apiRole, name } = response.data;

      let validatedUserRole: Role = null;
      const serverRoleString = String(apiRole).trim();

      if (serverRoleString === '1' || serverRoleString === '2' || serverRoleString === '3') {
        validatedUserRole = serverRoleString as Role;
      }

      if (!validatedUserRole) {
        sessionStorage.setItem('login_error', `Login failed: Invalid user role ('${apiRole || 'unknown'}') received from server.`);
        setTimeout(() => window.location.reload(), 100);
        return false;
      }

      localStorage.setItem('access_token', access_token);
      localStorage.setItem('role', validatedUserRole);
      localStorage.setItem('name', name);
      localStorage.setItem('token_expiration', (new Date().getTime() + 3599 * 1000).toString());

      setIsAuthenticated(true);
      setUserRole(validatedUserRole);

      toast.success('Welcome back! ' + name);
      return true;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        sessionStorage.setItem('login_error', error.response.data.message || 'Login failed.');
      } else {
        sessionStorage.setItem('login_error', 'An unexpected error occurred during login.');
      }
      setTimeout(() => window.location.reload(), 100);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    const token = localStorage.getItem('access_token');

    if (token) {
      try {
        await fetch(API_Logout(), {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ access_token: token }),
        });
      } catch (error: any) {
        console.error('API Logout failed:', error.response ? error.response.data : error.message);
      }
    }

    setUserRole(null);
    setIsAuthenticated(false);

    localStorage.removeItem('access_token');
    localStorage.removeItem('role');
    localStorage.removeItem('name');
    localStorage.removeItem('token_expiration');

    toast.success('Logout success');

    window.location.href = '/';
  };

  return (
    <>
      <ToastContainer position="top-right" />
      <AuthContext.Provider value={{ isAuthenticated, userRole, login, logout, isLoading }}>
        {children}
      </AuthContext.Provider>
    </>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};