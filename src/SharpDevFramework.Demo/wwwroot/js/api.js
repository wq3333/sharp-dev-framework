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
    localStorage.removeItem('name');
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
    login: async (name, password) => {
        const result = await request('/Auth/login', {
            method: 'POST',
            body: JSON.stringify({ name, password })
        });
        return result.data;
    },

    getFolders: async () => {
        const result = await request('/Folders');
        return result.data;
    },
    createFolder: async (name, parentId) => {
        const result = await request('/Folders', {
            method: 'POST',
            body: JSON.stringify({ name, parentId })
        });
        return result.data;
    },
    renameFolder: async (id, name) => {
        const result = await request(`/Folders/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ name })
        });
        return result.data;
    },
    deleteFolder: async (id) => {
        await request(`/Folders/${id}`, { method: 'DELETE' });
    },

    getFiles: async (folderId) => {
        const result = await request(`/Folders/${folderId}/files`);
        return result.data;
    },
    uploadFile: (folderId, file, onProgress, override = false) => {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            const formData = new FormData();
            formData.append('file', file);
            formData.append('folderId', folderId);
            formData.append('override', override);

            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable && onProgress) {
                    onProgress((e.loaded / e.total) * 100);
                }
            });

            xhr.addEventListener('load', () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const json = JSON.parse(xhr.responseText);
                        if (json.success === false) {
                            reject(new Error(json.message || '上传失败'));
                        } else {
                            resolve(json.data);
                        }
                    } catch {
                        reject(new Error('解析响应失败'));
                    }
                } else if (xhr.status === 401) {
                    clearAuth();
                    reject(new Error('Unauthorized'));
                } else {
                    let errorMsg = `HTTP ${xhr.status}`;
                    try {
                        const json = JSON.parse(xhr.responseText);
                        if (json.message) errorMsg = json.message;
                    } catch {}
                    reject(new Error(errorMsg));
                }
            });

            xhr.addEventListener('error', () => reject(new Error('Upload failed')));
            xhr.open('POST', `${API_BASE}/Files/upload`);
            const token = localStorage.getItem('token');
            if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            xhr.send(formData);
        });
    },
    uploadMultipleFiles: (folderId, files, onProgress, override = false, createDirectories = false) => {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            const formData = new FormData();
            files.forEach(file => formData.append('files', file));
            formData.append('folderId', folderId);
            formData.append('override', override);
            formData.append('createDirectories', createDirectories);

            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable && onProgress) onProgress((e.loaded / e.total) * 100);
            });

            xhr.addEventListener('load', () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const json = JSON.parse(xhr.responseText);
                        if (json.success === false) reject(new Error(json.message || '上传失败'));
                        else resolve(json.data);
                    } catch { reject(new Error('解析响应失败')); }
                } else if (xhr.status === 401) {
                    clearAuth();
                    reject(new Error('Unauthorized'));
                } else {
                    let errorMsg = `HTTP ${xhr.status}`;
                    try {
                        const json = JSON.parse(xhr.responseText);
                        if (json.message) errorMsg = json.message;
                    } catch {}
                    reject(new Error(errorMsg));
                }
            });

            xhr.addEventListener('error', () => reject(new Error('Upload failed')));
            xhr.open('POST', `${API_BASE}/Files/upload-multiple`);
            const token = localStorage.getItem('token');
            if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            xhr.send(formData);
        });
    },
    downloadFile: (id) => `${API_BASE}/Files/${id}/download`,
    getThumbnail: (id) => `${API_BASE}/Files/${id}/thumbnail`,
    getGifPreview: (id) => `${API_BASE}/Files/${id}/gif-preview`,
    deleteFile: async (id) => {
        await request(`/Files/${id}`, { method: 'DELETE' });
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

    getDownloads: async (status, page = 1, size = 20) => {
        let url = `/RemoteDownloads?index=${page}&size=${size}`;
        if (status !== null && status !== '') url += `&status=${status}`;
        const result = await request(url);
        return result;
    },
    createDownload: async (url, folderId, extensionFilters, sizeFilter) => {
        const result = await request('/RemoteDownloads', {
            method: 'POST',
            body: JSON.stringify({ url, folderId, fileExtensionFilters: extensionFilters, sizeFilter })
        });
        return result.data;
    },
    pauseDownload: async (id) => {
        await request(`/RemoteDownloads/${id}/pause`, { method: 'POST' });
    },
    resumeDownload: async (id) => {
        await request(`/RemoteDownloads/${id}/resume`, { method: 'POST' });
    },
    retryDownload: async (id) => {
        await request(`/RemoteDownloads/${id}/retry`, { method: 'POST' });
    },
    deleteDownload: async (id) => {
        await request(`/RemoteDownloads/${id}`, { method: 'DELETE' });
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

    getFavorites: async () => {
        const result = await request('/Favorites');
        return result.data;
    },
    favoriteFile: async (fileId) => {
        const result = await request(`/Favorites/file/${fileId}`, { method: 'POST' });
        return result.data;
    },
    unfavoriteFile: async (fileId) => {
        await request(`/Favorites/file/${fileId}`, { method: 'DELETE' });
    },
    favoriteFolder: async (folderId) => {
        const result = await request(`/Favorites/folder/${folderId}`, { method: 'POST' });
        return result.data;
    },
    unfavoriteFolder: async (folderId) => {
        await request(`/Favorites/folder/${folderId}`, { method: 'DELETE' });
    },
    checkFavorite: async (fileId, folderId) => {
        const result = await request(`/Favorites/check?fileId=${fileId || ''}&folderId=${folderId || ''}`);
        return result.data;
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
    },
    getFileIcon(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        const icons = {
            jpg: '🖼️', jpeg: '🖼️', png: '🖼️', gif: '🖼️', webp: '🖼️', svg: '🖼️',
            mp4: '🎬', mkv: '🎬', avi: '🎬', mov: '🎬', webm: '🎬', flv: '🎬',
            mp3: '🎵', wav: '🎵', flac: '🎵', aac: '🎵', m4a: '🎵', ogg: '🎵',
            pdf: '📄', doc: '📄', docx: '📄', xls: '📄', xlsx: '📄', ppt: '📄', pptx: '📄',
            zip: '📦', rar: '📦', '7z': '📦', tar: '📦', gz: '📦',
            txt: '📝', md: '📝', json: '📝', js: '📝', css: '📝', html: '📝'
        };
        return icons[ext] || '📄';
    },
    isImageFile(filename) { return /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(filename); },
    isVideoFile(filename) { return /\.(mp4|webm|ogg|mkv|avi|mov|flv)$/i.test(filename); },
    canPreview(filename) { return this.isImageFile(filename) || this.isVideoFile(filename); }
};
