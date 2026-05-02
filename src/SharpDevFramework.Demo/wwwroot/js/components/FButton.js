const { computed } = Vue;

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
            @click="$emit('click', $event)">
            <span v-if="loading" class="absolute top-0 left-0 w-full h-full bg-gray-800/80 flex items-center justify-center">
                <span class="size-3.5 border-2 border-white/30 border-t-white rounded animate-[spin_0.8s_linear_infinite]"></span>
            </span>
            <span v-if="$slots.icon" class="shrink-0"><slot name="icon" /></span>
            <span v-else-if="icon" class="text-sm leading-none">{{ icon }}</span>
            <slot />
        </button>
    `,
    setup(props) {
        const baseClasses = 'inline-flex items-center justify-center gap-1.5 font-medium whitespace-nowrap cursor-pointer transition-all duration-150 ease-out disabled:opacity-40';

        const sizeClasses = computed(() => {
            switch (props.size) {
                case 'sm': return 'px-2.5 py-1 text-xs rounded';
                case 'lg': return 'px-5 py-2 text-base rounded';
                default: return 'px-4 py-1.5 text-sm rounded';
            }
        });

        const typeClasses = computed(() => {
            switch (props.type) {
                case 'primary': return 'bg-[var(--accent)] text-[var(--text-inverse)] border border-[var(--accent)] hover:bg-[var(--accent-hover)] hover:border-[var(--accent-hover)]';
                case 'success': return 'bg-[var(--success)] text-[var(--text-inverse)] border border-[var(--success)] hover:bg-[#15803d] hover:border-[#15803d]';
                case 'danger': return 'bg-[var(--danger)] text-[var(--text-inverse)] border border-[var(--danger)] hover:bg-[#991b1b] hover:border-[#991b1b]';
                case 'warning': return 'bg-[var(--warning)] text-[var(--text-inverse)] border border-[var(--warning)] hover:bg-[#a16207] hover:border-[#a16207]';
                default: return 'bg-transparent text-[var(--text-primary)] border border-transparent hover:bg-[var(--bg-hover)]';
            }
        });

        const buttonClasses = computed(() => [
            baseClasses,
            sizeClasses.value,
            typeClasses.value,
            props.block ? 'flex w-full' : '',
            props.loading ? 'relative' : ''
        ].filter(Boolean).join(' '));

        return { buttonClasses };
    }
};
