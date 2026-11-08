import {
  defineComponent,
  h,
  type Component,
  type PropType,
} from 'vue';
import {
  VueUiDonut,
  VueUiFlow,
  VueUiFunnel,
  VueUiGraph,
  VueUiHorizontalBar,
  VueUiScatter,
  VueUiStackbar,
  VueUiTable,
  VueUiTreemap,
  VueUiWordCloud,
  VueUiXy,
} from 'vue-data-ui';
import type { BuiltView, CustomComponent, DataUiComponent } from './build.js';
import { AreaChart } from './components/Area.js';
import { BoxplotChart } from './components/Boxplot.js';
import { FishboneChart } from './components/Fishbone.js';
import { GroupedBarChart } from './components/GroupedBar.js';
import { IndentedTreeChart } from './components/IndentedTree.js';
import { LayeredGraphChart } from './components/LayeredGraph.js';
import { LiquidChart } from './components/Liquid.js';
import { MindmapChart } from './components/Mindmap.js';
import { RadarChart } from './components/Radar.js';
import { SummaryChart } from './components/Summary.js';
import { VennChart } from './components/Venn.js';
import { ViolinChart } from './components/Violin.js';
import { themeVars } from './utils.js';

const DATA_UI_COMPONENTS: Record<DataUiComponent, Component> = {
  donut: VueUiDonut,
  flow: VueUiFlow,
  funnel: VueUiFunnel,
  graph: VueUiGraph,
  'horizontal-bar': VueUiHorizontalBar,
  scatter: VueUiScatter,
  stackbar: VueUiStackbar,
  table: VueUiTable,
  treemap: VueUiTreemap,
  'word-cloud': VueUiWordCloud,
  xy: VueUiXy,
};

const CUSTOM_COMPONENTS: Record<CustomComponent, Component> = {
  area: AreaChart,
  boxplot: BoxplotChart,
  fishbone: FishboneChart,
  flow: LayeredGraphChart,
  'grouped-bar': GroupedBarChart,
  'indented-tree': IndentedTreeChart,
  liquid: LiquidChart,
  mindmap: MindmapChart,
  organization: LayeredGraphChart,
  radar: RadarChart,
  summary: SummaryChart,
  venn: VennChart,
  violin: ViolinChart,
};

export const RuntimeView = defineComponent({
  name: 'GptVisRuntimeView',

  props: {
    view: { type: Object as PropType<BuiltView>, required: true },
    themeStyle: {
      type: Object as PropType<Record<string, string>>,
      default: () => ({}),
    },
  },

  setup(props) {
    return () => {
      const view = props.view;
      const background =
        view.background ||
        (props.themeStyle['--gv-background'] as string | undefined) ||
        'transparent';

      if (view.kind === 'data-ui') {
        const component = DATA_UI_COMPONENTS[view.component];
        return h(
          'div',
          {
            class: 'gvui-view gvui-data-ui',
            style: { ...props.themeStyle, background },
            'data-view': 'data-ui',
            'data-component': view.component,
            'data-chart-type': view.chartType,
          },
          [
            h(component, {
              dataset: view.dataset,
              config: view.config,
            }),
          ],
        );
      }

      if (view.kind === 'custom') {
        const component = CUSTOM_COMPONENTS[view.component];
        return h(
          'div',
          {
            class: 'gvui-view gvui-custom-view',
            style: { ...props.themeStyle, background },
            'data-view': 'custom',
            'data-component': view.component,
          },
          [h(component, view.props)],
        );
      }

      const theme = props.themeStyle;
      const vars = theme['--gv-background']
        ? theme
        : themeVars({
            name: 'default',
            background,
            text: '#181713',
            muted: '#6E6A61',
            grid: '#E8E2D7',
            tooltipBg: '#181713',
            tooltipText: '#FCFAF5',
            palette: ['#3559E0'],
            positive: '#247B4A',
            negative: '#B64A42',
            total: '#3559E0',
            fontFamily: '"IBM Plex Sans", "Noto Sans SC", sans-serif',
            lineWidth: 2,
            radius: 8,
          });
      return h(
        'div',
        {
          class: 'gvui-view',
          style: { ...vars, background },
          'data-view': view.kind,
        },
        [
          h(
            'div',
            {
              class: 'gvui-status',
              'data-status': view.kind,
              role: 'status',
              'aria-live': 'polite',
            },
            [
              h(
                'span',
                { class: 'gvui-status-mark', 'aria-hidden': 'true' },
                view.kind === 'error' ? '!' : '···',
              ),
              h('p', view.message),
              h(
                'small',
                view.kind === 'pending' ? '流式输出会持续更新' : '请检查 vis 语法与图表类型',
              ),
            ],
          ),
        ],
      );
    };
  },
});
