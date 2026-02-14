import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { login as apiLogin, registerStudent, registerTeacher } from '../api/auth';

interface User {
    username: string;
    role: 'student' | 'teacher' | 'admin';
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (username: string, password: string) => Promise<void>;
    register: (type: 'student' | 'teacher', data: any) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check for persisted auth on mount
        const token = localStorage.getItem('authToken');
        const storedUsername = localStorage.getItem('authUsername');

        // Attempt to recover role from stored roles or default
        let role: 'student' | 'teacher' | 'admin' = 'student';
        try {
            const roles = JSON.parse(localStorage.getItem('authRoles') || '[]');
            if (roles.includes('ROLE_ADMIN')) role = 'admin';
            else if (roles.includes('ROLE_TEACHER')) role = 'teacher';
        } catch {
            // ignore
        }

        if (token && storedUsername) {
            setUser({ username: storedUsername, role });
        }
        setIsLoading(false);
    }, []);

    const login = async (username: string, password: string) => {
        const response = await apiLogin({ username, password });

        // Save to local storage
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('authUsername', response.username);
        localStorage.setItem('authRoles', JSON.stringify(response.roles));

        // Determine role
        let role: 'student' | 'teacher' | 'admin' = 'student';
        if (response.roles.includes('ROLE_ADMIN')) role = 'admin';
        else if (response.roles.includes('ROLE_TEACHER')) role = 'teacher';

        setUser({ username: response.username, role });
    };

    const register = async (type: 'student' | 'teacher', data: any) => {
        if (type === 'student') {
            await registerStudent(data);
        } else {
            await registerTeacher(data);
        }
        // Registration successful, usually we redirect to login, so we don't automatically login here
        // unless the API returns a token. The current API returns void.
    };

    const logout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUsername');
        localStorage.removeItem('authRoles');
        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                isLoading,
                login,
                register,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
