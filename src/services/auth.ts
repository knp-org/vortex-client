import { api } from '@/shared/api';

export interface AuthUser {
    id: number;
    username: string;
    role: string;
    created_at?: string;
    token?: string;
}

export interface SetupStatus {
    needs_setup: boolean;
}

export interface CreateUserBody {
    username: string;
    password: string;
    role?: 'user' | 'admin';
}

export const authService = {
    /** Whether the server still needs its first (admin) user. */
    setupStatus: () => api.get<SetupStatus>('/auth/setup-status'),

    /** First-run bootstrap: creates the initial admin and logs them in. */
    setup: (username: string, password: string) =>
        api.post<AuthUser>('/auth/setup', { username, password }),

    login: (username: string, password: string) =>
        api.post<AuthUser>('/auth/login', { username, password }),

    logout: () => api.post('/auth/logout'),

    me: () => api.get<AuthUser>('/auth/me'),

    changePassword: (current_password: string, new_password: string) =>
        api.post('/auth/change_password', { current_password, new_password }),

    /** Admin-only: list all users. */
    listUsers: () => api.get<AuthUser[]>('/users'),

    /** Admin-only: create another user. */
    createUser: (body: CreateUserBody) => api.post('/users', body),

    /** Admin-only: delete a user by id. */
    deleteUser: (id: number) => api.del(`/users/${id}`),
};
