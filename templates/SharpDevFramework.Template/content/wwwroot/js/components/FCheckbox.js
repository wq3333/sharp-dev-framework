export const FCheckbox = {
    name: 'FCheckbox',
    props: {
        modelValue: { type: Boolean, default: false },
        label: { type: String, default: '' },
        disabled: { type: Boolean, default: false }
    },
    emits: ['update:modelValue', 'change'],
    template: `
        <label class="inline-flex items-center gap-2 cursor-pointer select-none text-sm text-[var(--text-secondary)]" :class="{ 'opacity-40 cursor-not-allowed': disabled }">
            <input
                type="checkbox"
                :checked="modelValue"
                :disabled="disabled"
                class="f-checkbox__input absolute opacity-0 w-0 h-0"
                @change="$emit('update:modelValue', $event.target.checked); $emit('change', $event.target.checked)"
            />
            <span class="f-checkbox__box w-4 h-4 border-[1.5px] border-[var(--border-strong)] rounded flex items-center justify-center shrink-0 transition-all duration-150 ease-out">
                <svg viewBox="0 0 24 24" class="f-checkbox__check w-2.5 h-2.5 text-[var(--text-inverse)] opacity-0 scale-50 transition-all duration-150 ease-out">
                    <path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="3" fill="none"/>
                </svg>
            </span>
            <span v-if="label">{{ label }}</span>
        </label>
    `
};
