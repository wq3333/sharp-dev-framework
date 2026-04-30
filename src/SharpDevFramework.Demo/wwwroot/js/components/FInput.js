const { ref, computed } = Vue;

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
        <div class="f-input-wrapper">
            <span v-if="icon" class="f-input-icon">{{ icon }}</span>
            <input 
                :type="type"
                :value="modelValue"
                :placeholder="placeholder"
                :disabled="disabled"
                :readonly="readonly"
                :class="['f-input', { 'f-input--error': error, 'f-input--with-icon': icon }]"
                @input="$emit('update:modelValue', $event.target.value)"
                @keyup.enter="$emit('enter', $event)"
                @blur="$emit('blur', $event)"
                @focus="$emit('focus', $event)"
            />
            <span v-if="error" class="f-input-error">{{ error }}</span>
        </div>
    `
};
