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
            window.location.reload();
            const authError = new Error('Unauthorized');
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
    tasks: {
        page: async (status, type, page = 1, size = 20, onerror = null) => {
            const params = { index: page, size };
            if (status && status.length > 0) {
                params.status = Array.isArray(status) ? status.join(',') : status;
            }
            if (type && type.length > 0) {
                params.type = Array.isArray(type) ? type.join(',') : type;
            }
            return await request('GET', '/tasks', null, params, onerror);
        },
        get: async (id, onerror = null) => {
            const result = await request('GET', `/tasks/${id}`, null, null, onerror);
            return result.data;
        },
        retry: async (id, onerror = null) => {
            await request('POST', `/tasks/${id}/retry`, null, null, onerror);
        },
        cancel: async (id, onerror = null) => {
            await request('POST', `/tasks/${id}/cancel`, null, null, onerror);
        },
        delete: async (id, onerror = null) => {
            await request('DELETE', `/tasks/${id}`, null, null, onerror);
        },
        cleandb: async (onerror = null) => {
            await request('POST', '/tasks/cleandb', null, null, onerror);
        }
    },
    
    users: {
        login: async (username, password, onerror = null) => {
            const result = await request('POST', '/users/login', { username, password }, null, onerror);
            return result.data;
        },
        page: async (name, role, page = 1, size = 20, onerror = null) => {
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
        },
        token: async (onerror = null) => {
            const result = await request('POST', '/users/token', null, null, onerror);
            return "Bearer "+result.data;
        },
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
    },

    logs: {
        page: async (username, operationType, isSuccess, startTime, endTime, page = 1, size = 20, onerror = null) => {
            const params = { index: page, size };
            if (username) params.username = username;
            if (operationType && operationType.length > 0) {
                params.operationType = Array.isArray(operationType) ? operationType.join(',') : operationType;
            }
            if (isSuccess !== null && isSuccess !== undefined && isSuccess !== '') params.isSuccess = isSuccess;
            if (startTime) params.startTime = startTime;
            if (endTime) params.endTime = endTime;
            return await request('GET', '/useroperationlogs', null, params, onerror);
        },
        get: async (id, onerror = null) => {
            const result = await request('GET', `/useroperationlogs/${id}`, null, null, onerror);
            return result.data;
        }
    }
};