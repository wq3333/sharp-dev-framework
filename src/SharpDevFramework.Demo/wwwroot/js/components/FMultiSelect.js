const { ref, computed, onMounted, onUnmounted, watch, nextTick } = Vue;

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
            <div class="flex items-center justify-between h-full px-3 py-2 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded text-sm text-[var(--text-primary)] cursor-pointer transition-colors duration-150 ease-out hover:border-[var(--border-strong)]" @click="toggle">
                <span v-if="selectedLabels.length === 0" class="text-[var(--text-tertiary)]">{{ placeholder }}</span>
                <span v-else class="text-[var(--text-primary)] whitespace-nowrap overflow-hidden text-ellipsis flex-1 min-w-0">{{ selectedLabels.join(', ') }}</span>
                <span class="text-[var(--text-tertiary)] text-[10px] ml-2">{{ visible ? '▲' : '▼' }}</span>
            </div>
            <Teleport to="body">
                <div v-if="visible" ref="panelRef" class="fixed bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded flex flex-col gap-2 p-2 z-[9999] shadow-[0_4px_24px_rgba(0,0,0,0.08)] max-h-[300px] overflow-y-auto"
                    :style="panelStyle"
                    :class="{ 'f-dropdown--enter': !ready, 'f-dropdown--visible': ready }">
                    <div v-for="option in options" :key="option[valueKey]"
                        class="flex text-nowrap items-center gap-2 px-2.5 py-2 rounded text-sm text-[var(--text-primary)] cursor-pointer transition-colors duration-150 ease-out hover:bg-[var(--bg-hover)]"
                        :class="{ 'bg-[var(--bg-active)] text-[var(--accent)]': isSelected(option) }"
                        @click="toggleOption(option)">
                        <span class="w-4 h-4 border-[1.5px] border-[var(--border-strong)] rounded flex items-center justify-center shrink-0 text-[10px] transition-all duration-150 ease-out"
                            :class="{ 'f-multi-select__option--selected': isSelected(option) }">
                            {{ isSelected(option) ? '✓' : '' }}
                        </span>
                        <span>{{ option[labelKey] }}</span>
                    </div>
                </div>
            </Teleport>
        </div>
    `,
    setup(props, { emit }) {
        const visible = ref(false);
        const ready = ref(false);
        const selectRef = ref(null);
        const panelRef = ref(null);
        const panelStyle = ref({});

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

        const updatePosition = () => {
            if (!selectRef.value) return;
            const rect = selectRef.value.getBoundingClientRect();
            const viewH = window.innerHeight;
            const isTop = props.placement === 'top';
            const spaceBelow = viewH - rect.bottom;
            const spaceAbove = rect.top;
            const useTop = isTop || (!isTop && spaceBelow < 200 && spaceAbove > spaceBelow);

            if (useTop) {
                panelStyle.value = {
                    top: 'auto',
                    bottom: (viewH - rect.top + 4) + 'px',
                    left: rect.left + 'px',
                    width: rect.width + 'px'
                };
            } else {
                panelStyle.value = {
                    top: (rect.bottom + 4) + 'px',
                    bottom: 'auto',
                    left: rect.left + 'px',
                    width: rect.width + 'px'
                };
            }
        };

        const toggle = () => {
            if (props.disabled) return;
            if (!visible.value) {
                updatePosition();
                visible.value = true;
                ready.value = false;
                nextTick(() => { ready.value = true; });
            } else {
                ready.value = false;
                visible.value = false;
            }
        };

        const handleClickOutside = (e) => {
            if (!visible.value) return;
            const target = e.target;
            if (selectRef.value && selectRef.value.contains(target)) return;
            if (panelRef.value && panelRef.value.contains(target)) return;
            ready.value = false;
            visible.value = false;
        };

        const handleScroll = () => {
            if (visible.value)
                updatePosition();
        };
        const handleResize = () => {
            if (visible.value)
                updatePosition();
        };

        watch(visible, (val) => {
            if (val) {
                document.addEventListener('scroll', handleScroll, true);
                window.addEventListener('resize', handleResize);
            } else {
                document.removeEventListener('scroll', handleScroll, true);
                window.removeEventListener('resize', handleResize);
            }
        });

        onMounted(() => document.addEventListener('click', handleClickOutside));
        onUnmounted(() => {
            document.removeEventListener('click', handleClickOutside);
            document.removeEventListener('scroll', handleScroll, true);
            window.removeEventListener('resize', handleResize);
        });

        return { visible, ready, selectRef, panelRef, panelStyle, selectedLabels, isSelected, toggleOption, toggle };
    }
};
