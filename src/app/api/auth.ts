import axiosInstance from './axios';

export interface User {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'owner' | 'tenant';
    phone?: string;
}

export interface AuthResponse {
    user: User;
    token: {
        access: string;
        refresh: string;
    };
}

export interface LoginResponse {
    access: string;
    refresh: string;
    user: User;
}

// Register new user
export const register = async (
    name: string,
    email: string,
    password: string,
    role: string = 'owner',
    phone?: string
): Promise<AuthResponse> => {
    const response = await axiosInstance.post('/api/auth/register/', {
        name,
        email,
        password,
        role,
        phone,
    });
    return response.data;
};

// Login user
export const login = async (email: string, password: string): Promise<LoginResponse> => {
    const response = await axiosInstance.post('/api/auth/login/', {
        email,
        password,
    });
    return response.data;
};

// Logout user
export const logout = async (): Promise<void> => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
        try {
            await axiosInstance.post('/api/auth/logout/', {
                refresh: refreshToken,
            });
        } catch (error) {
            console.error('Logout error:', error);
        }
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
};

// Get current user profile
export const getProfile = async (): Promise<User> => {
    const response = await axiosInstance.get('/api/auth/profile/');
    return response.data;
};

// Update user profile
export const updateProfile = async (data: Partial<User>): Promise<User> => {
    const response = await axiosInstance.put('/api/auth/profile/', data);
    return response.data;
};

// Change password
export const changePassword = async (
    oldPassword: string,
    newPassword: string
): Promise<{ message: string }> => {
    const response = await axiosInstance.post('/api/auth/change-password/', {
        old_password: oldPassword,
        new_password: newPassword,
    });
    return response.data;
};

// Refresh access token
export const refreshToken = async (): Promise<string> => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
        throw new Error('No refresh token available');
    }

    const response = await axiosInstance.post('/api/auth/token/refresh/', {
        refresh: refreshToken,
    });

    return response.data.access;
};

// Google Firebase login — send Firebase ID token to Django backend
export const googleLogin = async (firebaseIdToken: string): Promise<LoginResponse> => {
    const response = await axiosInstance.post('/api/auth/google/', {
        firebase_token: firebaseIdToken,
    });
    return response.data;
};
