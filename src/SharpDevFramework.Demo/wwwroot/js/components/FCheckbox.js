const { computed } = Vue;

export const FCheckbox = {
    name: 'FCheckbox',
    props: {
        modelValue: { type: Boolean, default: false },
        label: { type: String, default: '' },
        disabled: { type: Boolean, default: false }
    },
    emits: ['update:modelValue', 'change'],
    template: `
        <label class="f-checkbox" :class="{ 'f-checkbox--disabled': disabled }">
            <input 
                type="checkbox"
                :checked="modelValue"
                :disabled="disabled"
                class="f-checkbox__input"
                @change="$emit('update:modelValue', $event.target.checked); $emit('change', $event.target.checked)"
            />
            <span class="f-checkbox__box">
                <svg viewBox="0 0 24 24" class="f-checkbox__check">
                    <path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="3" fill="none"/>
                </svg>
            </span>
            <span v-if="label" class="f-checkbox__label">{{ label }}</span>
        </label>
    `
};
