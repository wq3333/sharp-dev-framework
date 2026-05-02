export const FInput = {
    name: 'FInput',
    props: {
        modelValue: { type: [String, Number], default: '' },
        type: { type: String, default: 'text' },
        placeholder: { type: String, default: '' },
        disabled: { type: Boolean, default: false },
        readonly: { type: Boolean, default: false },
        error: { type: String, default: '' },
        icon: { type: String, default: '' }
    },
    emits: ['update:modelValue', 'enter', 'blur', 'focus'],
    template: `
        <div class="relative w-full">
            <span v-if="icon" class="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] text-sm leading-none pointer-events-none">{{ icon }}</span>
            <input
                :type="type"
                :value="modelValue"
                :placeholder="placeholder"
                :disabled="disabled"
                :readonly="readonly"
                class="w-full px-3 py-2 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded text-sm text-[var(--text-primary)] leading-relaxed outline-none transition-all duration-150 ease-out placeholder:text-[var(--text-tertiary)] hover:border-[var(--border-strong)] focus:border-[var(--border-focus)] focus:shadow-[0_0_0_3px_var(--accent-subtle)]"
                :class="{ 'border-[var(--danger)] focus:shadow-[0_0_0_3px_rgba(220,38,38,0.15)]': error, 'pl-9': icon }"
                @input="$emit('update:modelValue', $event.target.value)"
                @keyup.enter="$emit('enter', $event)"
                @blur="$emit('blur', $event)"
                @focus="$emit('focus', $event)"
            />
            <span v-if="error" class="block text-xs text-[var(--danger)] mt-1">{{ error }}</span>
        </div>
    `
};
