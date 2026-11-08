import { computed, defineComponent, h, type PropType } from 'vue';
import type { ResolvedThemeTokens } from '../theme.js';
import { rowsOf, themeVars, type Row } from '../utils.js';
import {
  formatTick,
  groupValues,
  niceScale,
  rowCategories,
  rowGroups,
  truncate,
} from './svg.js';

interface AreaSeries {
  name: string;
  color: string;
  values: Array<number | null>;
  lower: Array<number | null>;
  upper: Array<number | null>;
}

export const AreaChart = defineComponent({
  name: 'GptVisArea',

  props: {
    rows: { type: Array as PropType<Row[]>, required: true },
    stack: { type: Boolean, default: false },
    title: { type: String, default: '' },
    axisXTitle: { type: String, default: '' },
    axisYTitle: { type: String, default: '' },
    palette: { type: Array as PropType<string[]>, default: () => [] },
    theme: { type: Object as PropType<ResolvedThemeTokens>, required: true },
  },

  setup(props) {
    const model = computed(() => {
      const rows = rowsOf(props.rows).map((row) => ({
        ...row,
        category: row.time ?? row.category ?? row.name ?? '全部',
      }));
      const categories = rowCategories(rows);
      const groups = rowGroups(rows);
      const names = groups.length ? groups : [''];
      const palette = props.palette.length ? props.palette : props.theme.palette;
      const entries = names.map((name, index) => ({
        name: name || '数值',
        color: palette[index % palette.length],
        values: categories.map((category) => {
          const values = groupValues(rows, category, name);
          return values.length ? values.reduce((sum, value) => sum + value, 0) : null;
        }),
      }));

      const positive = categories.map(() => 0);
      const negative = categories.map(() => 0);
      const stacked = entries.map((entry) => ({
        ...entry,
        lower: entry.values.map((value, index) => {
          if (value == null) return null;
          return value >= 0 ? positive[index] : negative[index];
        }),
        upper: entry.values.map((value, index) => {
          if (value == null) return null;
          const base =
            value >= 0 ? positive[index] : negative[index];
          const next = base + value;
          if (value >= 0) positive[index] = next;
          else negative[index] = next;
          return next;
        }),
      }));
      const series: AreaSeries[] = props.stack
        ? stacked
        : entries.map((entry) => ({
            ...entry,
            lower: entry.values.map((value) => (value == null ? null : 0)),
            upper: entry.values,
          }));
      const scaleValues = series.flatMap((entry) => [
        ...entry.lower.filter((value): value is number => value != null),
        ...entry.upper.filter((value): value is number => value != null),
      ]);

      return {
        categories,
        groups,
        series,
        scale: niceScale([0, ...scaleValues], true),
      };
    });

    return () => {
      const { categories, groups, series, scale } = model.value;
      const theme = props.theme;
      const width = 900;
      const height = 450;
      const left = 66;
      const right = 26;
      const top = 20;
      const bottom = 96;
      const plotWidth = width - left - right;
      const plotHeight = height - top - bottom;
      const x = (index: number) =>
        categories.length <= 1
          ? left + plotWidth / 2
          : left + (index / (categories.length - 1)) * plotWidth;
      const y = (value: number) =>
        top + ((scale.max - value) / Math.max(1e-9, scale.max - scale.min)) * plotHeight;
      const zero = Math.max(top, Math.min(height - bottom, y(0)));

      const grid = scale.ticks.map((tick) =>
        h('g', { key: `tick-${tick}` }, [
          h('line', {
            x1: left,
            x2: width - right,
            y1: y(tick),
            y2: y(tick),
            stroke: theme.grid,
            'stroke-dasharray': tick === scale.min ? '0' : '3 5',
          }),
          h(
            'text',
            {
              x: left - 12,
              y: y(tick) + 4,
              'text-anchor': 'end',
              class: 'gvui-svg-tick',
            },
            formatTick(tick),
          ),
        ]),
      );

      const xLabels = categories.map((category, index) =>
        h(
          'text',
          {
            key: `x-${category}`,
            x: x(index),
            y: height - bottom + 20,
            'text-anchor': 'middle',
            class: 'gvui-svg-axis',
          },
          truncate(category, 12),
        ),
      );

      const areas = series.map((entry) => {
        const upperPoints = entry.upper
          .map((value, index) =>
            value == null ? null : ([x(index), y(value)] as const),
          )
          .filter((point): point is readonly [number, number] => point != null);
        const lowerPoints = entry.lower
          .map((value, index) =>
            value == null ? null : ([x(index), y(value)] as const),
          )
          .filter((point): point is readonly [number, number] => point != null);
        const areaPath = [...upperPoints, ...lowerPoints.reverse()]
          .map((point, index) => `${index ? 'L' : 'M'} ${point[0]} ${point[1]}`)
          .join(' ');
        const linePath = upperPoints
          .map((point, index) => `${index ? 'L' : 'M'} ${point[0]} ${point[1]}`)
          .join(' ');
        return h('g', { key: entry.name, class: 'gvui-mark' }, [
          h(
            'title',
            `${entry.name}\n${categories
              .map((category, index) => `${category}: ${entry.values[index] ?? '—'}`)
              .join('\n')}`,
          ),
          areaPath
            ? h('path', {
                d: `${areaPath} Z`,
                fill: entry.color,
                'fill-opacity': props.stack ? 0.34 : 0.2,
                stroke: 'none',
              })
            : null,
          linePath
            ? h('path', {
                d: linePath,
                fill: 'none',
                stroke: entry.color,
                'stroke-width': 2,
                'stroke-linecap': 'round',
                'stroke-linejoin': 'round',
              })
            : null,
        ]);
      });

      const legend = groups.length
        ? h(
            'g',
            { class: 'gvui-svg-legend' },
            groups.map((group, index) => {
              const startX = left + index * 106;
              return h('g', { key: group }, [
                h('rect', {
                  x: startX,
                  y: height - 16,
                  width: 10,
                  height: 10,
                  rx: 2,
                  fill: series[index]?.color,
                }),
                h(
                  'text',
                  {
                    x: startX + 16,
                    y: height - 7,
                    class: 'gvui-svg-small',
                  },
                  truncate(group, 9),
                ),
              ]);
            }),
          )
        : null;

      return h(
        'section',
        {
          class: 'gvui-custom gvui-area',
          style: themeVars(theme),
          'aria-label': props.title || '面积图',
        },
        [
          props.title ? h('h3', { class: 'gvui-custom-title' }, props.title) : null,
          h(
            'svg',
            {
              viewBox: `0 0 ${width} ${height}`,
              role: 'img',
              'aria-label': `${props.title || '面积图'}${groups.length ? `：${groups.join('、')}` : ''}`,
            },
            [
              grid,
              h('line', {
                x1: left,
                x2: width - right,
                y1: zero,
                y2: zero,
                stroke: theme.grid,
              }),
              areas,
              xLabels,
              legend,
              props.axisYTitle
                ? h(
                    'text',
                    {
                      x: 22,
                      y: top + plotHeight / 2,
                      transform: `rotate(-90 22 ${top + plotHeight / 2})`,
                      'text-anchor': 'middle',
                      class: 'gvui-svg-axis-title',
                    },
                    props.axisYTitle,
                  )
                : null,
              props.axisXTitle
                ? h(
                    'text',
                    {
                      x: left + plotWidth / 2,
                      y: height - 40,
                      'text-anchor': 'middle',
                      class: 'gvui-svg-axis-title',
                    },
                    props.axisXTitle,
                  )
                : null,
            ],
          ),
        ],
      );
    };
  },
});
