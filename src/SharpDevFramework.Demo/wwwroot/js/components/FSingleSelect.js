const { ref, computed, onMounted, onUnmounted } = Vue;

export const FSingleSelect = {
    name: 'FSingleSelect',
    props: {
        modelValue: { type: [String, Number, Boolean], default: null },
        options: { type: Array, default: () => [] },
        valueKey: { type: String, default: 'value' },
        labelKey: { type: String, default: 'label' },
        placeholder: { type: String, default: '请选择' },
        disabled: { type: Boolean, default: false }
    },
    emits: ['update:modelValue', 'change'],
    template: `
        <div class="f-single-select" ref="selectRef" :class="{ 'f-single-select--disabled': disabled }">
            <div class="f-single-select__trigger" @click="toggle">
                <span v-if="selectedLabel === null" class="f-single-select__placeholder">{{ placeholder }}</span>
                <span v-else class="f-single-select__selected">{{ selectedLabel }}</span>
                <span class="f-single-select__arrow">{{ visible ? '▲' : '▼' }}</span>
            </div>
            <Transition name="dropdown">
                <div v-if="visible" class="f-single-select__dropdown">
                    <div 
                        v-for="option in options" 
                        :key="option[valueKey]"
                        class="f-single-select__option"
                        :class="{ 'f-single-select__option--selected': isSelected(option) }"
                        @click="selectOption(option)"
                    >
                        {{ option[labelKey] }}
                    </div>
                </div>
            </Transition>
        </div>
    `,
    setup(props, { emit }) {
        const visible = ref(false);
        const selectRef = ref(null);

        const selectedLabel = computed(() => {
            if (props.modelValue === null || props.modelValue === '') return null;
            const opt = props.options.find(o => o[props.valueKey] === props.modelValue);
            return opt ? opt[props.labelKey] : null;
        });

        const isSelected = (option) => {
            return props.modelValue === option[props.valueKey];
        };

        const selectOption = (option) => {
            emit('update:modelValue', option[props.valueKey]);
            emit('change', option[props.valueKey]);
            visible.value = false;
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

        return { visible, selectRef, selectedLabel, isSelected, selectOption, toggle };
    }
};