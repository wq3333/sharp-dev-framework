const { ref, computed, onMounted, onUnmounted, watch, nextTick } = Vue;

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
            <Teleport to="body">
                <Transition name="dropdown">
                    <div v-if="visible" ref="panelRef" class="fixed bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg flex flex-col gap-2 p-2 z-[9999] shadow-[0_4px_24px_rgba(0,0,0,0.08)] max-h-[300px] overflow-y-auto"
                        :style="panelStyle">
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
            </Teleport>
        </div>
    `,
    setup(props, { emit }) {
        const visible = ref(false);
        const selectRef = ref(null);
        const panelRef = ref(null);
        const panelStyle = ref({});

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

        const updatePosition = () => {
            if (!selectRef.value || !visible.value) return;
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
            visible.value = !visible.value;
            if (visible.value) nextTick(updatePosition);
        };

        const handleClickOutside = (e) => {
            if (!visible.value) return;
            const target = e.target;
            if (selectRef.value && selectRef.value.contains(target)) return;
            if (panelRef.value && panelRef.value.contains(target)) return;
            visible.value = false;
        };

        const handleScroll = () => { if (visible.value) updatePosition(); };
        const handleResize = () => { if (visible.value) updatePosition(); };

        watch(visible, (val) => {
            if (val) {
                nextTick(updatePosition);
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

        return { visible, selectRef, panelRef, panelStyle, selectedLabel, isSelected, selectOption, toggle };
    }
};
