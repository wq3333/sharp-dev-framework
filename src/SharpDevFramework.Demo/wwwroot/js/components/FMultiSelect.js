const { ref, computed, onMounted, onUnmounted } = Vue;

export const FMultiSelect = {
    name: 'FMultiSelect',
    props: {
        modelValue: { type: Array, default: () => [] },
        options: { type: Array, default: () => [] },
        valueKey: { type: String, default: 'value' },
        labelKey: { type: String, default: 'label' },
        placeholder: { type: String, default: '请选择' },
        disabled: { type: Boolean, default: false },
        placement: { type: String, default: 'bottom' }
    },
    emits: ['update:modelValue', 'change'],
    template: `
        <div class="relative inline-block w-full" ref="selectRef" :class="{ 'opacity-40 cursor-not-allowed': disabled }">
            <div class="flex items-center justify-between h-full px-3 py-2 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-md text-sm text-[var(--text-primary)] cursor-pointer transition-colors duration-150 ease-out hover:border-[var(--border-strong)]" @click="toggle">
                <span v-if="selectedLabels.length === 0" class="text-[var(--text-tertiary)]">{{ placeholder }}</span>
                <span v-else class="text-[var(--text-primary)] whitespace-nowrap overflow-hidden text-ellipsis flex-1 min-w-0">{{ selectedLabels.join(', ') }}</span>
                <span class="text-[var(--text-tertiary)] text-[10px] ml-2">{{ visible ? '▲' : '▼' }}</span>
            </div>
            <Transition name="dropdown">
                <div v-if="visible" class="absolute left-0 right-0 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg flex flex-col gap-2 p-2 z-[1000] shadow-[0_4px_24px_rgba(0,0,0,0.08)] max-h-[300px] overflow-y-auto"
                    :class="placement === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'">
                    <div v-for="option in options" :key="option[valueKey]"
                        class="flex text-nowrap items-center gap-2 px-2.5 py-2 rounded-md text-sm text-[var(--text-primary)] cursor-pointer transition-colors duration-150 ease-out hover:bg-[var(--bg-hover)]"
                        :class="{ 'bg-[var(--bg-active)] text-[var(--accent)]': isSelected(option) }"
                        @click="toggleOption(option)">
                        <span class="w-4 h-4 border-[1.5px] border-[var(--border-strong)] rounded-[3px] flex items-center justify-center shrink-0 text-[10px] transition-all duration-150 ease-out"
                            :class="{ 'f-multi-select__option--selected': isSelected(option) }">
                            {{ isSelected(option) ? '✓' : '' }}
                        </span>
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

        const isSelected = (option) => props.modelValue.includes(option[props.valueKey]);

        const toggleOption = (option) => {
            const value = option[props.valueKey];
            const newValue = [...props.modelValue];
            const index = newValue.indexOf(value);
            if (index > -1) newValue.splice(index, 1);
            else newValue.push(value);
            emit('update:modelValue', newValue);
            emit('change', newValue);
        };

        const toggle = () => { if (!props.disabled) visible.value = !visible.value; };

        const handleClickOutside = (e) => {
            if (selectRef.value && !selectRef.value.contains(e.target)) visible.value = false;
        };

        onMounted(() => document.addEventListener('click', handleClickOutside));
        onUnmounted(() => document.removeEventListener('click', handleClickOutside));

        return { visible, selectRef, selectedLabels, isSelected, toggleOption, toggle };
    }
};
