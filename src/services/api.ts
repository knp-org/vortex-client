// Base API wrapper with error handling and auth
export const getApiBase = () => {
    // Check if running in Tauri
    const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
    if (isTauri) {
        const savedUrl = localStorage.getItem('server_url') || 'http://localhost:3000';
        // Ensure no trailing slash
        return `${savedUrl.replace(/\/$/, '')}/api/v1`;
    }
    return '/api/v1';
};

export class ApiError extends Error {
    constructor(
        public status: number,
        public statusText: string,
        message?: string
    ) {
        super(message || `API Error: ${status} ${statusText}`);
        this.name = 'ApiError';
    }
}

async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new ApiError(response.status, response.statusText, text);
    }

    // Handle empty responses (204 No Content, etc.)
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
        return {} as T;
    }

    return response.json();
}

const getHeaders = (body?: unknown) => {
    const headers: HeadersInit = {};
    if (body) headers['Content-Type'] = 'application/json';

    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (token) headers['Authorization'] = `Bearer ${token}`;

    return headers;
};

export async function get<T>(endpoint: string): Promise<T> {
    const headers = getHeaders();
    const response = await fetch(`${getApiBase()}${endpoint}`, {
        headers,
        credentials: 'include',
    });
    return handleResponse<T>(response);
}

export async function post<T, B = unknown>(endpoint: string, body?: B): Promise<T> {
    const headers = getHeaders(body);
    const response = await fetch(`${getApiBase()}${endpoint}`, {
        method: 'POST',
        headers,
        body: body ? JSON.stringify(body) : undefined,
        credentials: 'include',
    });
    return handleResponse<T>(response);
}

export async function put<T, B = unknown>(endpoint: string, body: B): Promise<T> {
    const headers = getHeaders(body);
    const response = await fetch(`${getApiBase()}${endpoint}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(body),
        credentials: 'include',
    });
    return handleResponse<T>(response);
}

export async function del<T>(endpoint: string): Promise<T> {
    const headers = getHeaders();
    const response = await fetch(`${getApiBase()}${endpoint}`, {
        method: 'DELETE',
        headers,
        credentials: 'include',
    });
    return handleResponse<T>(response);
}

// Re-export for convenience
export const api = { get, post, put, del };
