import { toast } from './components/Toast.js';
import { clearAuth } from './auth.js';

const API_BASE = '/api';

const apiClient = axios.create({
    baseURL: API_BASE,
    headers: {
        'Content-Type': 'application/json'
    }
});

apiClient.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

apiClient.interceptors.response.use(
    response => {
        const data = response.data;
        if (data.success === false) {
            const error = new Error(data.message || '请求失败');
            toast.error(error.message);
            throw error;
        }
        return data;
    },
    error => {
        if (error.response?.status === 401) {
            clearAuth();
            window.location.hash = '#/login';
            const authError = new Error('Unauthorized');
            toast.error('登录已过期，请重新登录');
            throw authError;
        }
        const message = error.response?.data?.message || error.message || '请求失败';
        toast.error(message);
        throw new Error(message);
    }
);

async function request(method, url, data = null, params = null, onerror = null) {
    try {
        const config = { method, url };
        if (data) config.data = data;
        if (params) config.params = params;
        return await apiClient(config);
    } catch (e) {
        if (onerror) onerror(e);
        throw e;
    }
}

export const api = {
    auth: {
        login: async (username, password, onerror = null) => {
            const result = await request('POST', '/users/login', { username, password }, null, onerror);
            return result.data;
        }
    },
    
    tasks: {
        list: async (status, type, page = 1, size = 20, onerror = null) => {
            const params = { index: page, size };
            if (status && status.length > 0) {
                params.status = Array.isArray(status) ? status.join(',') : status;
            }
            if (type && type.length > 0) {
                params.type = Array.isArray(type) ? type.join(',') : type;
            }
            return await request('GET', '/tasks', null, params, onerror);
        },
        retry: async (id, onerror = null) => {
            await request('POST', `/tasks/${id}/retry`, null, null, onerror);
        },
        cancel: async (id, onerror = null) => {
            await request('POST', `/tasks/${id}/cancel`, null, null, onerror);
        },
        delete: async (id, onerror = null) => {
            await request('DELETE', `/tasks/${id}`, null, null, onerror);
        }
    },
    
    users: {
        list: async (name, role, page = 1, size = 20, onerror = null) => {
            const params = { index: page, size };
            if (name) params.name = name;
            if (role && role.length > 0) {
                params.role = Array.isArray(role) ? role.join(',') : role;
            }
            return await request('GET', '/users', null, params, onerror);
        },
        create: async (name, password, role, onerror = null) => {
            const result = await request('POST', '/users', { name, password, role }, null, onerror);
            return result.data;
        },
        update: async (id, name, password, role, isActive, onerror = null) => {
            const result = await request('PUT', `/users/${id}`, { name, password, role, isActive }, null, onerror);
            return result.data;
        },
        delete: async (id, onerror = null) => {
            await request('DELETE', `/users/${id}`, null, null, onerror);
        }
    },
    
    demos: {
        page: async (name, type, page = 1, size = 20, onerror = null) => {
            const params = { index: page, size };
            if (name) params.name = name;
            if (type && type.length > 0) {
                params.type = Array.isArray(type) ? type.join(',') : type;
            }
            return await request('GET', '/demos', null, params, onerror);
        },
        get: async (id, onerror = null) => {
            const result = await request('GET', `/demos/${id}`, null, null, onerror);
            return result.data;
        },
        create: async (name, type, onerror = null) => {
            await request('POST', '/demos', { name, type }, null, onerror);
        },
        update: async (id, name,type, onerror = null) => {
            await request('PUT', `/demos/${id}`, { name, type }, null, onerror);
        },
        delete: async (id, onerror = null) => {
            await request('DELETE', `/demos/${id}`, null, null, onerror);
        }
    },
    
    enums: {
        list: async (onerror = null) => {
            const result = await request('GET', '/enums', null, null, onerror);
            return result.data;
        }
    }
};