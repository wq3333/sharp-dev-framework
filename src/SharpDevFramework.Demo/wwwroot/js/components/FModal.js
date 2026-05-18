const { ref, computed, onMounted, onUnmounted } = Vue;

export const FModal = {
    name: 'FModal',
    props: {
        modelValue: { type: Boolean, default: false },
        title: { type: String, default: '' },
        size: { type: String, default: 'medium', validator: v => ['small', 'medium', 'large'].includes(v) },
        closeOnOverlay: { type: Boolean, default: false },
        showClose: { type: Boolean, default: true }
    },
    emits: ['update:modelValue', 'close'],
    template: `
        <Transition name="modal">
            <div v-if="modelValue" class="absolute w-full h-full top-0 left-0 bg-black/50 flex items-center justify-center z-[2000] p-4" @click.self="handleOverlayClick">
                <div class="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded max-h-[90dvh] gap-5 flex flex-col w-full shadow-[0_4px_24px_rgba(0,0,0,0.08)]" :class="sizeClass">
                    <div class="flex items-center justify-between px-5 pt-5">
                        <h3 class="text-base font-semibold text-[var(--text-primary)] leading-snug">{{ title }}</h3>
                        <button v-if="showClose" @click="handleClose" class="bg-none border-none text-[var(--text-tertiary)] text-xl cursor-pointer p-1 leading-none transition-colors duration-150 ease-out hover:text-[var(--text-primary)]">&times;</button>
                    </div>
                    <div class="px-5 py-5 text-[var(--text-secondary)] flex-1 overflow-y-auto border-y border-[var(--border-subtle)]">
                        <slot />
                    </div>
                    <div class="flex justify-end gap-2 px-5 pb-5" v-if="$slots.footer">
                        <slot name="footer" />
                    </div>
                </div>
            </div>
        </Transition>
    `,
    setup(props, { emit }) {
        const sizeClass = computed(() => ({
            small: 'sm:max-w-sm md:max-w-sm',
            medium: 'sm:max-w-md md:max-w-lg',
            large: 'sm:max-w-lg md:max-w-3xl'
        }[props.size] || 'sm:max-w-md md:max-w-lg'));

        const handleOverlayClick = () => {
            if (props.closeOnOverlay)
                handleClose();
        };
        const handleClose = () => {
            emit('update:modelValue', false);
            emit('close');
        };
        const handleEscKey = (e) => {
            if (e.key === 'Escape' && props.modelValue)
                handleClose();
        };

        onMounted(() => document.addEventListener('keydown', handleEscKey));
        onUnmounted(() => document.removeEventListener('keydown', handleEscKey));

        return { handleOverlayClick, handleClose, sizeClass };
    }
};
