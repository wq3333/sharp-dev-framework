const { HubConnectionBuilder, LogLevel } = signalR;

let connection = null;
const eventHandlers = {};

export function initSignalR() {
    const token = localStorage.getItem('token');
    if (!token) return;

    if (connection && connection.state === signalR.HubConnectionState.Connected) {
        return;
    }

    connection = new HubConnectionBuilder()
        .withUrl('/hubs/notifications', { accessTokenFactory: () => token })
        .configureLogging(LogLevel.Warning)
        .withAutomaticReconnect([1000, 2000, 5000, 10000, 30000, 120000])
        .build();

    connection.on('TaskUpdated', (notification) => {
        fireEvent('TaskUpdated', notification);
    });

    connection.onclose(() => {
        console.log('SignalR disconnected');
    });

    connection.onreconnected(() => {
        console.log('SignalR reconnected');
    });

    connection.start().catch(err => console.error('SignalR connection error:', err));
}

export function stopSignalR() {
    if (connection) {
        connection.stop().catch(err => console.error('SignalR stop error:', err));
        connection = null;
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
