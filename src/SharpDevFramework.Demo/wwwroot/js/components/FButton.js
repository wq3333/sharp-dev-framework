const { ref, computed } = Vue;

export const FButton = {
    name: 'FButton',
    props: {
        type: { type: String, default: 'primary' },
        size: { type: String, default: 'md' },
        disabled: { type: Boolean, default: false },
        loading: { type: Boolean, default: false },
        icon: { type: String, default: '' },
        block: { type: Boolean, default: false }
    },
    emits: ['click'],
    template: `
        <button 
            :class="buttonClasses"
            :disabled="disabled || loading"
            @click="$emit('click', $event)"
        >
            <span v-if="loading" class="btn-spinner"></span>
            <span v-else-if="icon" class="btn-icon">{{ icon }}</span>
            <slot />
        </button>
    `,
    setup(props) {
        const buttonClasses = computed(() => [
            'f-btn',
            `f-btn--${props.type}`,
            `f-btn--${props.size}`,
            { 'f-btn--disabled': props.disabled || props.loading },
            { 'f-btn--loading': props.loading },
            { 'f-btn--block': props.block }
        ]);

        return { buttonClasses };
    }
};
