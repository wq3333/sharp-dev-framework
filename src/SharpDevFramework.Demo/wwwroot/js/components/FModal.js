const { ref, watch, onMounted, onUnmounted } = Vue;

export const FModal = {
    name: 'FModal',
    props: {
        modelValue: { type: Boolean, default: false },
        title: { type: String, default: '' },
        width: { type: String, default: '400px' },
        closeOnOverlay: { type: Boolean, default: true },
        showClose: { type: Boolean, default: true }
    },
    emits: ['update:modelValue', 'close'],
    template: `
        <Teleport to="body">
            <Transition name="modal">
                <div v-if="modelValue" class="f-modal-overlay" @click.self="handleOverlayClick">
                    <div class="f-modal" :style="{ width: width }">
                        <div class="f-modal__header">
                            <h3 class="f-modal__title">{{ title }}</h3>
                            <button v-if="showClose" @click="handleClose" class="f-modal__close">&times;</button>
                        </div>
                        <div class="f-modal__body">
                            <slot />
                        </div>
                        <div class="f-modal__footer" v-if="$slots.footer">
                            <slot name="footer" />
                        </div>
                    </div>
                </div>
            </Transition>
        </Teleport>
    `,
    setup(props, { emit }) {
        const handleOverlayClick = () => {
            if (props.closeOnOverlay) {
                handleClose();
            }
        };

        const handleClose = () => {
            emit('update:modelValue', false);
            emit('close');
        };

        const handleEscKey = (e) => {
            if (e.key === 'Escape' && props.modelValue) {
                handleClose();
            }
        };

        onMounted(() => {
            document.addEventListener('keydown', handleEscKey);
        });

        onUnmounted(() => {
            document.removeEventListener('keydown', handleEscKey);
        });

        return { handleOverlayClick, handleClose };
    }
};
