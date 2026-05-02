const { ref, computed, onMounted, onUnmounted } = Vue;

export const FSingleSelect = {
    name: 'FSingleSelect',
    props: {
        modelValue: { type: [String, Number, Boolean], default: null },
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
                <span v-if="selectedLabel === null" class="text-[var(--text-tertiary)]">{{ placeholder }}</span>
                <span v-else class="text-[var(--text-primary)] whitespace-nowrap overflow-hidden text-ellipsis flex-1 min-w-0">{{ selectedLabel }}</span>
                <span class="text-[var(--text-tertiary)] text-[10px] ml-2">{{ visible ? '▲' : '▼' }}</span>
            </div>
            <Transition name="dropdown">
                <div v-if="visible" class="absolute left-0 right-0 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg flex flex-col gap-2 p-2 z-[1000] shadow-[0_4px_24px_rgba(0,0,0,0.08)] max-h-[300px] overflow-y-auto"
                    :class="placement === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'">
                    <div
                        v-for="option in options"
                        :key="option[valueKey]"
                        class="flex items-center gap-2 px-2.5 py-2 rounded-md text-sm text-[var(--text-primary)] cursor-pointer transition-colors duration-150 ease-out hover:bg-[var(--bg-hover)] text-nowrap"
                        :class="{ 'bg-[var(--bg-active)] text-[var(--accent)]': isSelected(option) }"
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

        const isSelected = (option) => props.modelValue === option[props.valueKey];

        const selectOption = (option) => {
            emit('update:modelValue', option[props.valueKey]);
            emit('change', option[props.valueKey]);
            visible.value = false;
        };

        const toggle = () => { if (!props.disabled) visible.value = !visible.value; };

        const handleClickOutside = (e) => {
            if (selectRef.value && !selectRef.value.contains(e.target)) visible.value = false;
        };

        onMounted(() => document.addEventListener('click', handleClickOutside));
        onUnmounted(() => document.removeEventListener('click', handleClickOutside));

        return { visible, selectRef, selectedLabel, isSelected, selectOption, toggle };
    }
};
