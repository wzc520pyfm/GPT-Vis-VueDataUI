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

interface DensityPoint {
  value: number;
  density: number;
}

function kde(values: number[], start: number, end: number, steps = 40): DensityPoint[] {
  const sorted = [...values].sort((a, b) => a - b);
  const mean = sorted.reduce((sum, value) => sum + value, 0) / Math.max(1, sorted.length);
  const variance =
    sorted.reduce((sum, value) => sum + (value - mean) ** 2, 0) /
    Math.max(1, sorted.length - 1);
  const deviation = Math.sqrt(variance);
  const bandwidth =
    sorted.length > 1
      ? Math.max((end - start) / 80, 1.06 * deviation * sorted.length ** -0.2, 0.001)
      : Math.max((end - start) / 20, 0.001);
  const normalizer = sorted.length * bandwidth * Math.sqrt(2 * Math.PI);
  return Array.from({ length: steps }, (_, index) => {
    const value = start + ((end - start) * index) / (steps - 1);
    const density =
      sorted.reduce(
        (sum, sample) => sum + Math.exp(-0.5 * ((value - sample) / bandwidth) ** 2),
        0,
      ) / Math.max(1e-9, normalizer);
    return { value, density };
  });
}

export const ViolinChart = defineComponent({
  name: 'GptVisViolin',

  props: {
    rows: { type: Array as PropType<Row[]>, required: true },
    title: { type: String, default: '' },
    axisXTitle: { type: String, default: '' },
    axisYTitle: { type: String, default: '' },
    startAtZero: { type: Boolean, default: false },
    palette: { type: Array as PropType<string[]>, default: () => [] },
    theme: { type: Object as PropType<ResolvedThemeTokens>, required: true },
  },

  setup(props) {
    const model = computed(() => {
      const rows = rowsOf(props.rows);
      const categories = rowCategories(rows);
      const groups = rowGroups(rows);
      const names = groups.length ? groups : [''];
      const values = rows
        .map((row) => Number(row.value))
        .filter((value) => Number.isFinite(value));
      const scale = niceScale(values, props.startAtZero);
      return { rows, categories, groups, names, scale };
    });

    return () => {
      const { rows, categories, groups, names, scale } = model.value;
      const theme = props.theme;
      const palette = props.palette.length ? props.palette : theme.palette;
      const width = 900;
      const height = 470;
      const left = 76;
      const right = 28;
      const top = 24;
      const bottom = 68;
      const plotWidth = width - left - right;
      const plotHeight = height - top - bottom;
      const y = (value: number) =>
        top + ((scale.max - value) / Math.max(1e-9, scale.max - scale.min)) * plotHeight;
      const band = plotWidth / Math.max(1, categories.length);
      const maxHalfWidth = Math.min(32, Math.max(12, (band * 0.58) / Math.max(1, names.length)));

      const allShapes = categories.flatMap((category) =>
        names.map((group) => {
          const values = groupValues(rows, category, group).sort((a, b) => a - b);
          const data = values.length > 1 ? kde(values, scale.min, scale.max) : [];
          return {
            category,
            group,
            values,
            data,
            maxDensity: Math.max(1e-9, ...data.map((point) => point.density)),
          };
        }),
      );

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

      const violins: ReturnType<typeof h>[] = [];
      categories.forEach((category, categoryIndex) => {
        const center = left + band * (categoryIndex + 0.5);
        names.forEach((group, groupIndex) => {
          const shape = allShapes.find(
            (item) => item.category === category && item.group === group,
          );
          if (!shape || !shape.values.length) return;
          const offset = (groupIndex - (names.length - 1) / 2) * (maxHalfWidth * 2.3);
          const x = center + offset;
          const color = palette[groupIndex % palette.length];
          const half = Math.min(maxHalfWidth, maxHalfWidth * 0.92);
          const rightPoints = shape.data.length
            ? shape.data.map((point) => ({
                x: x + (point.density / shape.maxDensity) * half,
                y: y(point.value),
              }))
            : [];
          const leftPoints = shape.data.length
            ? [...shape.data].reverse().map((point) => ({
                x: x - (point.density / shape.maxDensity) * half,
                y: y(point.value),
              }))
            : [];
          const path =
            rightPoints.length > 1
              ? [
                  `M ${x} ${y(shape.values[0])}`,
                  ...rightPoints.map((point) => `L ${point.x} ${point.y}`),
                  ...leftPoints.map((point) => `L ${point.x} ${point.y}`),
                  'Z',
                ].join(' ')
              : '';
          const median = shape.values[Math.floor(shape.values.length / 2)];
          const label = group ? `${category} / ${group}` : category;
          violins.push(
            h('g', { key: `${category}-${group}`, class: 'gvui-mark' }, [
              h(
                'title',
                `${label}\nn=${shape.values.length}\n中位 ${median}`,
              ),
              path
                ? h('path', {
                    d: path,
                    fill: color,
                    'fill-opacity': 0.22,
                    stroke: color,
                    'stroke-width': 1.35,
                    'stroke-linejoin': 'round',
                  })
                : h('rect', {
                    x: x - 3,
                    y: y(Math.max(...shape.values)),
                    width: 6,
                    height: Math.max(2, y(Math.min(...shape.values)) - y(Math.max(...shape.values))),
                    rx: 3,
                    fill: color,
                    'fill-opacity': 0.28,
                    stroke: color,
                  }),
              h('line', {
                x1: x - Math.min(16, half),
                x2: x + Math.min(16, half),
                y1: y(median),
                y2: y(median),
                stroke: theme.background,
                'stroke-width': 2.4,
                'stroke-linecap': 'round',
              }),
              h('circle', { cx: x, cy: y(median), r: 2.4, fill: theme.background }),
            ]),
          );
        });
        violins.push(
          h(
            'text',
            {
              key: `label-${category}`,
              x: center,
              y: height - bottom + 26,
              'text-anchor': 'middle',
              class: 'gvui-svg-axis',
            },
            truncate(category, 14),
          ),
        );
      });

      const legend = groups.length
        ? h(
            'g',
            { class: 'gvui-svg-legend' },
            groups.map((group, index) => {
              const startX = width - right - groups.length * 92 + index * 92;
              return h('g', { key: group }, [
                h('circle', {
                  cx: startX + 5,
                  cy: 8,
                  r: 4.5,
                  fill: palette[index % palette.length],
                }),
                h('text', { x: startX + 16, y: 12, class: 'gvui-svg-small' }, truncate(group, 8)),
              ]);
            }),
          )
        : null;

      return h(
        'section',
        {
          class: 'gvui-custom gvui-violin',
          style: themeVars(theme),
          'aria-label': props.title || '小提琴图',
        },
        [
          props.title ? h('h3', { class: 'gvui-custom-title' }, props.title) : null,
          h(
            'svg',
            {
              viewBox: `0 0 ${width} ${height}`,
              role: 'img',
              'aria-label': props.title || '小提琴图',
            },
            [
              grid,
              h('line', {
                x1: left,
                x2: left,
                y1: top,
                y2: height - bottom,
                stroke: theme.grid,
              }),
              h('line', {
                x1: left,
                x2: width - right,
                y1: height - bottom,
                y2: height - bottom,
                stroke: theme.grid,
              }),
              violins,
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
                      y: height - 8,
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
