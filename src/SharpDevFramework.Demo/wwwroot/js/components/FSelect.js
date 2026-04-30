const { computed } = Vue;

export const FSelect = {
    name: 'FSelect',
    props: {
        modelValue: { type: [String, Number, Object], default: '' },
        options: { type: Array, default: () => [] },
        placeholder: { type: String, default: '请选择' },
        disabled: { type: Boolean, default: false },
        valueKey: { type: String, default: 'value' },
        labelKey: { type: String, default: 'label' }
    },
    emits: ['update:modelValue', 'change'],
    template: `
        <div class="f-select-wrapper">
            <select 
                :value="modelValue"
                :disabled="disabled"
                class="f-select"
                @change="$emit('update:modelValue', $event.target.value); $emit('change', $event.target.value)"
            >
                <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
                <option 
                    v-for="opt in options" 
                    :key="typeof opt === 'object' ? opt[valueKey] : opt" 
                    :value="typeof opt === 'object' ? opt[valueKey] : opt"
                >
                    {{ typeof opt === 'object' ? opt[labelKey] : opt }}
                </option>
            </select>
            <span class="f-select-arrow">▼</span>
        </div>
    `
};
