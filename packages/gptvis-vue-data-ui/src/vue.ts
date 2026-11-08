import {
  defineComponent,
  h,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  type PropType,
} from 'vue';
import { GPTVis, type GPTVisOptions, type RenderStatus } from './runtime.js';
import type { VisualizationTheme } from './theme.js';

export const GPTVisChart = defineComponent({
  name: 'GPTVisChart',

  props: {
    content: {
      type: [String, Object] as PropType<string | Record<string, unknown>>,
      default: '',
    },
    theme: {
      type: [String, Object] as PropType<VisualizationTheme>,
      default: 'default',
    },
    streaming: { type: Boolean, default: false },
    wrapper: { type: Boolean, default: false },
    locale: { type: String, default: 'en' },
    width: { type: Number, default: undefined },
    height: { type: Number, default: undefined },
    onStatus: {
      type: Function as PropType<(status: RenderStatus) => void>,
      default: undefined,
    },
  },

  emits: {
    status: (_status: RenderStatus) => true,
  },

  setup(props, { emit }) {
    const host = ref<HTMLElement | null>(null);
    let instance: GPTVis | null = null;

    const destroy = (): void => {
      instance?.destroy();
      instance = null;
    };

    const mount = (): void => {
      destroy();
      if (!host.value) return;
      const options: GPTVisOptions = {
        container: host.value,
        theme: props.theme,
        streaming: props.streaming,
        wrapper: props.wrapper,
        locale: props.locale,
        width: props.width,
        height: props.height,
        onStatus: (status) => {
          props.onStatus?.(status);
          emit('status', status);
        },
      };
      instance = new GPTVis(options);
      instance.render(props.content);
    };

    onMounted(mount);
    watch(
      () => [
        props.theme,
        props.streaming,
        props.wrapper,
        props.locale,
        props.width,
        props.height,
      ],
      mount,
      { deep: true },
    );
    watch(
      () => props.content,
      (content) => {
        if (instance) instance.render(content);
        else mount();
      },
      { deep: true },
    );
    onBeforeUnmount(destroy);

    return () =>
      h('div', {
        ref: host,
        class: 'gptvis-vue-chart',
        style: {
          width: '100%',
          minHeight: `${props.height ?? 440}px`,
        },
      });
  },
});
