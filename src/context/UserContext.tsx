import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserStorage } from '../utils/UserStorage';

interface UserData {
  username: string;
  name: string;
  age: string;
  email: string;
  password: string;
  nativeLanguage: string;
  learningLanguage: string;
  isAdmin: boolean;
  isGuest: boolean;
  profileImageUrl?: string;
}

interface UserContextType {
  currentUser: UserData | null;
  isLoading: boolean;
  login: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: any) => Promise<void>;
  updateUser: (userData: Partial<UserData>) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const user = await UserStorage.getCurrentUser();
      setCurrentUser(user);
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (userData: any) => {
    try {
      if (userData.isGuest) {
        const guestUser: UserData = {
          username: 'Guest',
          name: 'Guest User',
          age: '',
          email: '',
          password: '',
          nativeLanguage: 'English',
          learningLanguage: 'Tamil',
          isAdmin: false,
          isGuest: true,
        };
        await UserStorage.saveCurrentUser(guestUser);
        setCurrentUser(guestUser);
      } else if (userData.isAdmin) {
        // Admin login - create admin user directly
        const adminUser: UserData = {
          username: 'Admin',
          name: 'Administrator',
          age: '',
          email: 'admin@trilingo.com',
          password: 'Admin@123',
          nativeLanguage: 'English',
          learningLanguage: 'All',
          isAdmin: true,
          isGuest: false,
        };
        await UserStorage.saveCurrentUser(adminUser);
        setCurrentUser(adminUser);
      } else {
        // Regular user login with backend
        const validatedUser = await UserStorage.loginUser(userData.username, userData.password);
        if (validatedUser) {
          setCurrentUser(validatedUser);
        } else {
          throw new Error('Invalid credentials');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await UserStorage.logout();
      setCurrentUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const register = async (userData: any) => {
    try {
      const newUser = await UserStorage.registerUser(userData);
      setCurrentUser(newUser);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const updateUser = async (userData: Partial<UserData>) => {
    try {
      if (currentUser) {
        const updatedUser = { ...currentUser, ...userData };
        await UserStorage.saveCurrentUser(updatedUser);
        setCurrentUser(updatedUser);
      }
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  };

  return (
    <UserContext.Provider
      value={{
        currentUser,
        isLoading,
        login,
        logout,
        register,
        updateUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
