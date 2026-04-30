const API_BASE = '/api';

function getHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
}

function clearAuth() {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    window.location.hash = '#/login';
}

async function request(url, options = {}) {
    const response = await fetch(`${API_BASE}${url}`, {
        ...options,
        headers: {
            ...getHeaders(),
            ...options.headers
        }
    });

    if (response.status === 401) {
        clearAuth();
        throw new Error('Unauthorized');
    }

    const json = await response.json().catch(() => ({}));

    if (response.ok) {
        if (json.success === false) {
            throw new Error(json.message || '请求失败');
        }
        return json;
    }

    throw new Error(json.message || `HTTP ${response.status}: ${response.statusText}`);
}

export const api = {
    login: async (username, password) => {
        const result = await request('/Auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
        return result.data;
    },
    getTasks: async (status, page = 1, size = 20) => {
        let url = `/Tasks?index=${page}&size=${size}`;
        if (status !== null && status !== '') url += `&status=${status}`;
        const result = await request(url);
        return result;
    },
    retryTask: async (id) => {
        await request(`/Tasks/${id}/retry`, { method: 'POST' });
    },
    cancelTask: async (id) => {
        await request(`/Tasks/${id}/cancel`, { method: 'POST' });
    },
    deleteTask: async (id) => {
        await request(`/Tasks/${id}`, { method: 'DELETE' });
    },
    getUsers: async (page = 1, size = 20) => {
        const result = await request(`/Users?index=${page}&size=${size}`);
        return result;
    },
    createUser: async (name, password, role) => {
        const result = await request('/Users', {
            method: 'POST',
            body: JSON.stringify({ name, password, role })
        });
        return result.data;
    },
    updateUser: async (id, name, password, role, isActive) => {
        const result = await request(`/Users/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ name, password, role, isActive })
        });
        return result.data;
    },
    deleteUser: async (id) => {
        await request(`/Users/${id}`, { method: 'DELETE' });
    },
    getEnums: async () => {
        const result = await request('/Common/enums');
        return result.data;
    },
    formatSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },
    formatDate(dateStr) {
        return new Date(dateStr).toLocaleString('zh-CN');
    }
};
