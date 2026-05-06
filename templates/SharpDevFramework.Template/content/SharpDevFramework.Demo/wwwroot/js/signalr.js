const { HubConnectionBuilder, LogLevel } = signalR;

let taskConnection = null;
const eventHandlers = {};

function createConnection(hubUrl, token) {
    return new HubConnectionBuilder()
        .withUrl(hubUrl, { accessTokenFactory: () => token })
        .configureLogging(LogLevel.Warning)
        .withAutomaticReconnect([1000, 2000, 5000, 10000, 30000, 120000])
        .build();
}

export function initSignalR() {
    const token = localStorage.getItem('token');
    if (!token) return;

    if (!taskConnection || taskConnection.state !== signalR.HubConnectionState.Connected) {
        taskConnection = createConnection('/hubs/notifications', token);
        taskConnection.on('TaskUpdated', (notification) => {
            fireEvent('TaskUpdated', notification);
        });
        taskConnection.onclose(() => {
            console.log('Task SignalR disconnected');
        });
        taskConnection.start().catch(err => console.error('Task SignalR connection error:', err));
    }
}

export function stopSignalR() {
    if (taskConnection) {
        taskConnection.stop().catch(err => console.error('Task SignalR stop error:', err));
        taskConnection = null;
    }
}

export function onTaskUpdated(handler) {
    on('TaskUpdated', handler);
}

function on(event, handler) {
    if (!eventHandlers[event]) {
        eventHandlers[event] = [];
    }
    eventHandlers[event].push(handler);
}

function fireEvent(event, data) {
    if (eventHandlers[event]) {
        eventHandlers[event].forEach(handler => handler(data));
    }
}
