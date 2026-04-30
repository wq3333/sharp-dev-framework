const { ref, computed, onMounted, onUnmounted } = Vue;

export const FMultiSelect = {
    name: 'FMultiSelect',
    props: {
        modelValue: { type: Array, default: () => [] },
        options: { type: Array, default: () => [] },
        valueKey: { type: String, default: 'value' },
        labelKey: { type: String, default: 'label' },
        placeholder: { type: String, default: '请选择' },
        disabled: { type: Boolean, default: false }
    },
    emits: ['update:modelValue', 'change'],
    template: `
        <div class="f-multi-select" ref="selectRef" :class="{ 'f-multi-select--disabled': disabled }">
            <div class="f-multi-select__trigger" @click="toggle">
                <span v-if="selectedLabels.length === 0" class="f-multi-select__placeholder">{{ placeholder }}</span>
                <span v-else class="f-multi-select__selected">{{ selectedLabels.join(', ') }}</span>
                <span class="f-multi-select__arrow">{{ visible ? '▲' : '▼' }}</span>
            </div>
            <Transition name="dropdown">
                <div v-if="visible" class="f-multi-select__dropdown">
                    <div 
                        v-for="option in options" 
                        :key="option[valueKey]"
                        class="f-multi-select__option"
                        :class="{ 'f-multi-select__option--selected': isSelected(option) }"
                        @click="toggleOption(option)"
                    >
                        <span class="f-multi-select__checkbox">{{ isSelected(option) ? '✓' : '' }}</span>
                        <span>{{ option[labelKey] }}</span>
                    </div>
                </div>
            </Transition>
        </div>
    `,
    setup(props, { emit }) {
        const visible = ref(false);
        const selectRef = ref(null);

        const selectedLabels = computed(() => {
            return props.modelValue
                .map(v => props.options.find(o => o[props.valueKey] === v))
                .filter(Boolean)
                .map(o => o[props.labelKey]);
        });

        const isSelected = (option) => {
            return props.modelValue.includes(option[props.valueKey]);
        };

        const toggleOption = (option) => {
            const value = option[props.valueKey];
            const newValue = [...props.modelValue];
            const index = newValue.indexOf(value);
            if (index > -1) {
                newValue.splice(index, 1);
            } else {
                newValue.push(value);
            }
            emit('update:modelValue', newValue);
            emit('change', newValue);
        };

        const toggle = () => {
            if (!props.disabled) {
                visible.value = !visible.value;
            }
        };

        const handleClickOutside = (e) => {
            if (selectRef.value && !selectRef.value.contains(e.target)) {
                visible.value = false;
            }
        };

        onMounted(() => {
            document.addEventListener('click', handleClickOutside);
        });

        onUnmounted(() => {
            document.removeEventListener('click', handleClickOutside);
        });

        return { visible, selectRef, selectedLabels, isSelected, toggleOption, toggle };
    }
};