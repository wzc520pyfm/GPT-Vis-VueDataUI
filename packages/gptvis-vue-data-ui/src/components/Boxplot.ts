import { computed, defineComponent, h, type PropType } from 'vue';
import type { ResolvedThemeTokens } from '../theme.js';
import { quartiles, rowsOf, text, themeVars, type Row } from '../utils.js';
import {
  formatTick,
  groupValues,
  niceScale,
  rowCategories,
  rowGroups,
  truncate,
} from './svg.js';

interface BoxStats {
  low: number;
  q1: number;
  median: number;
  q3: number;
  high: number;
  outliers: number[];
}

function boxStats(values: number[]): BoxStats {
  const sorted = [...values].sort((a, b) => a - b);
  const [min, q1, median, q3, max] = quartiles(sorted);
  const iqr = q3 - q1;
  const lowFence = q1 - iqr * 1.5;
  const highFence = q3 + iqr * 1.5;
  const inside = sorted.filter((value) => value >= lowFence && value <= highFence);
  return {
    low: inside[0] ?? min,
    q1,
    median,
    q3,
    high: inside[inside.length - 1] ?? max,
    outliers: sorted.filter((value) => value < lowFence || value > highFence),
  };
}

export const BoxplotChart = defineComponent({
  name: 'GptVisBoxplot',

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
      return { categories, groups, names, scale };
    });

    return () => {
      const { categories, groups, names, scale } = model.value;
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
      const boxWidth = Math.min(42, Math.max(15, (band * 0.62) / Math.max(1, names.length)));

      const grid = scale.ticks.map((tick) =>
        h('g', { key: `tick-${tick}` }, [
          h('line', {
            x1: left,
            x2: width - right,
            y1: y(tick),
            y2: y(tick),
            stroke: theme.grid,
            'stroke-width': 1,
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

      const boxes: ReturnType<typeof h>[] = [];
      categories.forEach((category, categoryIndex) => {
        const center = left + band * (categoryIndex + 0.5);
        names.forEach((group, groupIndex) => {
          const values = groupValues(rowsOf(props.rows), category, group);
          if (!values.length) return;
          const stats = boxStats(values);
          const offset = (groupIndex - (names.length - 1) / 2) * (boxWidth + 10);
          const x = center + offset;
          const color = palette[groupIndex % palette.length];
          const label = group ? `${category} / ${group}` : category;
          boxes.push(
            h('g', { key: `${category}-${group}`, class: 'gvui-mark' }, [
              h('title', `${label}\n最大 ${stats.high} · Q3 ${stats.q3}\n中位 ${stats.median}\nQ1 ${stats.q1} · 最小 ${stats.low}`),
              h('line', {
                x1: x,
                x2: x,
                y1: y(stats.low),
                y2: y(stats.high),
                stroke: color,
                'stroke-width': 1.5,
              }),
              h('line', {
                x1: x - 10,
                x2: x + 10,
                y1: y(stats.low),
                y2: y(stats.low),
                stroke: color,
                'stroke-width': 1.5,
              }),
              h('line', {
                x1: x - 10,
                x2: x + 10,
                y1: y(stats.high),
                y2: y(stats.high),
                stroke: color,
                'stroke-width': 1.5,
              }),
              h('rect', {
                x: x - boxWidth / 2,
                y: y(stats.q3),
                width: boxWidth,
                height: Math.max(1, y(stats.q1) - y(stats.q3)),
                rx: 3,
                fill: color,
                'fill-opacity': 0.2,
                stroke: color,
                'stroke-width': 1.5,
              }),
              h('line', {
                x1: x - boxWidth / 2,
                x2: x + boxWidth / 2,
                y1: y(stats.median),
                y2: y(stats.median),
                stroke: color,
                'stroke-width': 3,
                'stroke-linecap': 'round',
              }),
              ...stats.outliers.map((outlier, outlierIndex) =>
                h('circle', {
                  key: outlierIndex,
                  cx: x,
                  cy: y(outlier),
                  r: 2.8,
                  fill: theme.background,
                  stroke: color,
                  'stroke-width': 1.4,
                }),
              ),
            ]),
          );
        });
        boxes.push(
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
                h('rect', {
                  x: startX,
                  y: 3,
                  width: 10,
                  height: 10,
                  rx: 2,
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
          class: 'gvui-custom gvui-boxplot',
          style: themeVars(theme),
          'aria-label': props.title || '箱线图',
        },
        [
          props.title ? h('h3', { class: 'gvui-custom-title' }, props.title) : null,
          h(
            'svg',
            {
              viewBox: `0 0 ${width} ${height}`,
              role: 'img',
              'aria-label': props.title || '箱线图',
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
              boxes,
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

