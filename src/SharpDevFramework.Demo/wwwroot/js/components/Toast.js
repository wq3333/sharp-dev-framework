const { ref, reactive } = Vue;

const state = reactive({ toasts: [] });
let toastId = 0;

export const toast = {
    success(message, duration = 3000) { return addToast('success', message, duration); },
    error(message, duration = 3000) { return addToast('error', message, duration); },
    warning(message, duration = 3000) { return addToast('warning', message, duration); },
    info(message, duration = 3000) { return addToast('info', message, duration); }
};

function addToast(type, message, duration) {
    const id = ++toastId;
    state.toasts.push({ id, type, message });
    if (duration > 0) setTimeout(() => removeToast(id), duration);
    return id;
}

function removeToast(id) {
    const index = state.toasts.findIndex(t => t.id === id);
    if (index !== -1) state.toasts.splice(index, 1);
}

export const ToastContainer = {
    name: 'ToastContainer',
    template: `
        <Teleport to="body">
            <TransitionGroup name="toast" tag="div" class="fixed top-5 right-5 z-[9999] flex flex-col gap-2">
                <div v-for="t in toasts" :key="t.id"
                    :class="'f-toast flex items-center gap-3 px-4 py-3 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg min-w-[280px] max-w-[400px] shadow-[0_4px_24px_rgba(0,0,0,0.08)] border-l-[3px] f-toast--' + t.type">
                    <span class="f-toast__icon text-sm w-5 h-5 flex items-center justify-center shrink-0 text-[var(--text-tertiary)]">{{ icons[t.type] }}</span>
                    <span class="flex-1 text-sm text-[var(--text-primary)] leading-relaxed">{{ t.message }}</span>
                    <button @click="remove(t.id)" class="bg-transparent border-none text-[var(--text-tertiary)] text-lg cursor-pointer p-0 leading-none transition-colors duration-150 ease-out hover:text-[var(--text-primary)]">&times;</button>
                </div>
            </TransitionGroup>
        </Teleport>
    `,
    setup() {
        const icons = { success: '&#x25CF;', error: '&#x25CF;', warning: '&#x25CF;', info: '&#x25CF;' };
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
