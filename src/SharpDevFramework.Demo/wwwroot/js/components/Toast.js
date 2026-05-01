const { ref, reactive } = Vue;

const state = reactive({
    toasts: []
});

let toastId = 0;

export const toast = {
    success(message, duration = 3000) {
        return addToast('success', message, duration);
    },
    error(message, duration = 3000) {
        return addToast('error', message, duration);
    },
    warning(message, duration = 3000) {
        return addToast('warning', message, duration);
    },
    info(message, duration = 3000) {
        return addToast('info', message, duration);
    }
};

function addToast(type, message, duration) {
    const id = ++toastId;
    state.toasts.push({ id, type, message });
    
    if (duration > 0) {
        setTimeout(() => {
            removeToast(id);
        }, duration);
    }
    
    return id;
}

function removeToast(id) {
    const index = state.toasts.findIndex(t => t.id === id);
    if (index !== -1) {
        state.toasts.splice(index, 1);
    }
}

export const ToastContainer = {
    name: 'ToastContainer',
    template: `
        <Teleport to="body">
            <TransitionGroup name="toast" tag="div" class="f-toast-container">
                <div 
                    v-for="t in toasts" 
                    :key="t.id" 
                    :class="['f-toast', \`f-toast--\${t.type}\`]"
                >
                    <span class="f-toast__icon">{{ icons[t.type] }}</span>
                    <span class="f-toast__message">{{ t.message }}</span>
                    <button @click="remove(t.id)" class="f-toast__close">&times;</button>
                </div>
            </TransitionGroup>
        </Teleport>
    `,
    setup() {
        const icons = {
            success: '●',
            error: '●',
            warning: '●',
            info: '●'
        };

        const remove = (id) => removeToast(id);

        return { toasts: state.toasts, icons, remove };
    }
};

export const ToastPlugin = {
    install(app) {
        app.config.globalProperties.$toast = toast;
        app.component('ToastContainer', ToastContainer);
    }
};
