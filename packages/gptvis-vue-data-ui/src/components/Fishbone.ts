import { computed, defineComponent, h, type PropType } from 'vue';
import type { ResolvedThemeTokens } from '../theme.js';
import { rowsOf, text, themeVars, type Row } from '../utils.js';
import { truncate } from './svg.js';

interface FishboneCause {
  name: string;
  children: string[];
}

export const FishboneChart = defineComponent({
  name: 'GptVisFishbone',

  props: {
    root: { type: Object as PropType<Row>, required: true },
    title: { type: String, default: '' },
    palette: { type: Array as PropType<string[]>, default: () => [] },
    theme: { type: Object as PropType<ResolvedThemeTokens>, required: true },
  },

  setup(props) {
    const model = computed(() => {
      const causes: FishboneCause[] = rowsOf(props.root.children).map((node) => ({
        name: text(node.name || node.category || '原因'),
        children: rowsOf(node.children).map((child) =>
          text(child.name || child.category || child.value || '子原因'),
        ),
      }));
      const colors = props.palette.length ? props.palette : props.theme.palette;
      return { causes, colors };
    });

    return () => {
      const { causes, colors } = model.value;
      const theme = props.theme;
      const width = 1060;
      const maxChildren = Math.max(1, ...causes.map((cause) => cause.children.length));
      const height = Math.max(430, 230 + maxChildren * 42);
      const spineY = height / 2;
      const headX = 958;
      const spineStart = 54;
      const mainX = 782;
      const branchWidth = Math.max(96, (mainX - 120) / Math.max(1, causes.length));
      const rootName = text(props.root.name || props.root.category || '结果');

      const bones = causes.map((cause, index) => {
        const above = index % 2 === 0;
        const baseX = 118 + index * branchWidth;
        const tipX = baseX + branchWidth * 0.58;
        const tipY = above ? spineY - 108 : spineY + 108;
        const color = colors[index % colors.length];
        const parts: ReturnType<typeof h>[] = [
          h('line', {
            x1: baseX,
            y1: spineY,
            x2: tipX,
            y2: tipY,
            stroke: color,
            'stroke-width': 3,
            'stroke-linecap': 'round',
          }),
          h(
            'text',
            {
              x: tipX + (above ? 8 : 8),
              y: tipY + (above ? -8 : 18),
              class: 'gvui-fish-main',
            },
            truncate(cause.name, 12),
          ),
        ];
        const shown = cause.children.slice(0, 8);
        shown.forEach((child, childIndex) => {
          const t = (childIndex + 1) / (shown.length + 1);
          const boneX = baseX + (tipX - baseX) * t;
          const boneY = spineY + (tipY - spineY) * t;
          const labelY = boneY + (above ? -8 : 18);
          const labelX = boneX + 12;
          parts.push(
            h('line', {
              x1: boneX - 5,
              y1: boneY,
              x2: boneX + 18,
              y2: boneY,
              stroke: color,
              'stroke-opacity': 0.58,
              'stroke-width': 1.2,
            }),
            h(
              'text',
              { x: labelX, y: labelY, class: 'gvui-fish-child' },
              truncate(child, 11),
            ),
          );
        });
        return h('g', { key: `${cause.name}-${index}`, class: 'gvui-mark' }, [
          h('title', `${cause.name}\n${cause.children.join('\n')}`),
          ...parts,
        ]);
      });

      return h(
        'section',
        {
          class: 'gvui-custom gvui-fishbone',
          style: themeVars(theme),
          'aria-label': props.title || '鱼骨图',
        },
        [
          props.title ? h('h3', { class: 'gvui-custom-title' }, props.title) : null,
          h(
            'svg',
            {
              viewBox: `0 0 ${width} ${height}`,
              role: 'img',
              'aria-label': `${props.title || '鱼骨图'}：${rootName}`,
            },
            [
              h('defs', [
                h(
                  'marker',
                  {
                    id: 'gvui-fish-arrow',
                    markerWidth: 10,
                    markerHeight: 10,
                    refX: 7,
                    refY: 5,
                    orient: 'auto',
                  },
                  [
                    h('path', {
                      d: 'M 0 0 L 9 5 L 0 10 Z',
                      fill: theme.muted,
                    }),
                  ],
                ),
              ]),
              h('line', {
                x1: spineStart,
                y1: spineY,
                x2: headX - 10,
                y2: spineY,
                stroke: theme.muted,
                'stroke-width': 3,
                'stroke-linecap': 'round',
                'marker-end': 'url(#gvui-fish-arrow)',
              }),
              bones,
              h('rect', {
                x: headX - 2,
                y: spineY - 40,
                width: 96,
                height: 80,
                rx: 14,
                fill: theme.text,
              }),
              h(
                'text',
                {
                  x: headX + 46,
                  y: spineY + 5,
                  'text-anchor': 'middle',
                  class: 'gvui-fish-effect',
                  style: `fill:${theme.background}`,
                },
                truncate(rootName, 8),
              ),
            ],
          ),
        ],
      );
    };
  },
});
