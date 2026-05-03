let stopSignalRFn = null;

export function setStopSignalR(fn) {
    stopSignalRFn = fn;
}

export function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
}

export function isTokenValid() {
    const token = localStorage.getItem('token');
    if (!token) return false;
    
    const decoded = parseJwt(token);
    if (!decoded || !decoded.Exp) return false;
    
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.Exp > currentTime;
}

export function clearAuth() {
    if (stopSignalRFn) stopSignalRFn();
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
}

export function setAuth(data) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('userId', data.userId);
    localStorage.setItem('username', data.username);
    localStorage.setItem('role', data.role);
}

export function getAuth() {
    return {
        token: localStorage.getItem('token'),
        userId: localStorage.getItem('userId'),
        username: localStorage.getItem('username'),
        role: localStorage.getItem('role')
    };
}
