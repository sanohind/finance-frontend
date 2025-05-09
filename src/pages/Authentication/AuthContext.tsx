import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { API_Logout, API_Login } from '../../api/api';
import { toast, ToastContainer } from 'react-toastify';
import axios from 'axios';
import { getRolePath } from './Role';

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
    const role = localStorage.getItem('role');
    const loginError = sessionStorage.getItem('login_error');

    if (loginError) {
      setTimeout(() => {
        toast.error(loginError);
        sessionStorage.removeItem('login_error');
      }, 100);
    }

    if (token && role) {
      const roleValue = getRolePath(role) as Role;
      setUserRole(roleValue);
      setIsAuthenticated(true);
    } else {
      setUserRole(null);
      setIsAuthenticated(false);
    }
    setIsLoading(false);

    const checkTokenExpiration = () => {
      const expirationTime = localStorage.getItem('token_expiration');
      if (!expirationTime) {
        setUserRole(null);
        setIsAuthenticated(false);
        localStorage.clear();
        return;
      }

      if (expirationTime && new Date().getTime() > parseInt(expirationTime)) {
        setUserRole(null);
        localStorage.removeItem('access_token');
        localStorage.removeItem('token_expiration');
        toast.error('Session expired, please login again');
        setIsAuthenticated(false);
      }
    };

    const interval = setInterval(checkTokenExpiration, 1000); // Check every second
    return () => clearInterval(interval);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await axios.post(API_Login(), { username, password });
      const { access_token, role, name } = response.data;

      // Save data to localStorage
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('role', getRolePath(role));
      localStorage.setItem('name', name);
      localStorage.setItem('token_expiration', (new Date().getTime() + 3599 * 1000).toString()); // 59 minutes 59 seconds

      setIsAuthenticated(true);
      setUserRole(role);

      const expirationTime = new Date().getTime() + 3599 * 1000; // 59 minutes 59 seconds
      localStorage.setItem('token_expiration', expirationTime.toString());

      toast.success('Welcome back! ' + name);
      return true;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        sessionStorage.setItem('login_error', error.response.data.message);
        setTimeout(() => window.location.reload(), 100);
      } else {
        sessionStorage.setItem('login_error', 'An unexpected error occurred');
        setTimeout(() => window.location.reload(), 100);
      }
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

        setUserRole(null);
        localStorage.clear();
        setIsAuthenticated(false);
        toast.success('Logout success');
        
        // Add redirect after successful logout
        window.location.href = '/';
      } catch (error: any) {
        setUserRole(null);
        localStorage.clear();
        setIsAuthenticated(false);
        toast.error('Logout failed: ' + (error.response ? error.response.data : error.message));
        console.error('Error:', error.response ? error.response.data : error.message);
        
        // Still redirect even if logout API fails
        window.location.href = '/';
      }
    } else {
      setUserRole(null);
      localStorage.clear();
      setIsAuthenticated(false);
      toast.error('Error: Token not found');
      console.error('Error: Token not found');
      
      // Redirect if no token found
      window.location.href = '/';
    }
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