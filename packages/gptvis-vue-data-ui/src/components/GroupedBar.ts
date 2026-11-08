import { computed, defineComponent, h, type PropType } from 'vue';
import type { ResolvedThemeTokens } from '../theme.js';
import { num, rowsOf, text, themeVars, type Row } from '../utils.js';
import {
  formatTick,
  niceScale,
  rowCategories,
  rowGroups,
  truncate,
} from './svg.js';

interface BarValue {
  group: string;
  value: number;
  color: string;
}

export const GroupedBarChart = defineComponent({
  name: 'GptVisGroupedBar',

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
      const rows = rowsOf(props.rows);
      const categories = rowCategories(rows);
      const groups = rowGroups(rows);
      const names = groups.length ? groups : ['数值'];
      const palette = props.palette.length ? props.palette : props.theme.palette;
      const colors = new Map(
        names.map((group, index) => [group, palette[index % palette.length]]),
      );
      const byCategory = categories.map((category) => {
        const values: BarValue[] = [];
        for (const group of names) {
          const match = rows.find(
            (row) =>
              text(row.category || row.name || '全部') === category &&
              (groups.length === 0 || text(row.group) === group),
          );
          const value = match ? num(match.value) : null;
          if (value != null) {
            values.push({
              group,
              value,
              color: colors.get(group) ?? palette[0],
            });
          }
        }
        return { category, values };
      });

      const scaleValues = props.stack
        ? byCategory.flatMap(({ values }) => {
            const positives = values
              .filter((item) => item.value >= 0)
              .reduce((sum, item) => sum + item.value, 0);
            const negatives = values
              .filter((item) => item.value < 0)
              .reduce((sum, item) => sum + item.value, 0);
            return [positives, negatives];
          })
        : byCategory.flatMap(({ values }) => values.map((item) => item.value));

      return {
        groups,
        names,
        colors,
        byCategory,
        scale: niceScale(scaleValues, true),
      };
    });

    return () => {
      const { groups, names, colors, byCategory, scale } = model.value;
      const theme = props.theme;
      const width = 900;
      const rowHeight = props.stack ? 50 : Math.max(44, names.length * 28 + 22);
      const height = Math.max(300, byCategory.length * rowHeight + 92);
      const left = 104;
      const right = 52;
      const top = 20;
      const bottom = 48;
      const plotWidth = width - left - right;
      const plotHeight = height - top - bottom;
      const band = plotHeight / Math.max(1, byCategory.length);
      const zero = scale.min >= 0 ? 0 : scale.max <= 0 ? 1 : -scale.min / (scale.max - scale.min);
      const x = (value: number) =>
        left + ((value - scale.min) / Math.max(1e-9, scale.max - scale.min)) * plotWidth;
      const zeroX = left + Math.max(0, Math.min(1, zero)) * plotWidth;

      const grid = scale.ticks.map((tick) =>
        h('g', { key: `tick-${tick}` }, [
          h('line', {
            x1: x(tick),
            x2: x(tick),
            y1: top,
            y2: height - bottom,
            stroke: theme.grid,
            'stroke-dasharray': tick === 0 ? '0' : '3 5',
          }),
          h(
            'text',
            {
              x: x(tick),
              y: height - bottom + 22,
              'text-anchor': 'middle',
              class: 'gvui-svg-tick',
            },
            formatTick(tick),
          ),
        ]),
      );

      const marks = byCategory.map(({ category, values }, categoryIndex) => {
        const centerY = top + band * (categoryIndex + 0.5);
        const segments: ReturnType<typeof h>[] = [];

        if (props.stack) {
          let positive = 0;
          let negative = 0;
          for (const item of values) {
            const from = item.value >= 0 ? positive : negative;
            const to = from + item.value;
            if (item.value >= 0) positive = to;
            else negative = to;
            const x1 = x(from);
            const x2 = x(to);
            segments.push(
              h('rect', {
                key: `segment-${item.group}`,
                x: Math.min(x1, x2),
                y: centerY - 17,
                width: Math.max(1, Math.abs(x2 - x1)),
                height: 34,
                rx: 3,
                fill: item.color,
                'fill-opacity': 0.9,
              }),
            );
          }
          const total = values.reduce((sum, item) => sum + item.value, 0);
          segments.push(
            h(
              'text',
              {
                key: 'total',
                x: total >= 0 ? x(total) + 8 : x(total) - 8,
                y: centerY + 4,
                'text-anchor': total >= 0 ? 'start' : 'end',
                class: 'gvui-svg-value',
              },
              formatTick(total),
            ),
          );
        } else {
          const count = Math.max(1, values.length);
          const available = names.length ? 34 : 24;
          const barHeight = Math.max(7, Math.min(18, (available - (count - 1) * 4) / count));
          const totalHeight = count * barHeight + (count - 1) * 4;
          values.forEach((item, valueIndex) => {
            const y = centerY - totalHeight / 2 + valueIndex * (barHeight + 4);
            const x1 = Math.min(zeroX, x(item.value));
            const x2 = Math.max(zeroX, x(item.value));
            segments.push(
              h('rect', {
                key: `bar-${item.group}`,
                x: x1,
                y,
                width: Math.max(1, x2 - x1),
                height: barHeight,
                rx: 3,
                fill: item.color,
              }),
            );
            segments.push(
              h(
                'text',
                {
                  key: `value-${item.group}`,
                  x: item.value >= 0 ? x2 + 6 : x1 - 6,
                  y: y + barHeight / 2 + 4,
                  'text-anchor': item.value >= 0 ? 'start' : 'end',
                  class: 'gvui-svg-value',
                },
                formatTick(item.value),
              ),
            );
          });
        }

        return h('g', { key: category, class: 'gvui-mark' }, [
          h(
            'title',
            values.map((item) => `${item.group}: ${formatTick(item.value)}`).join('\n'),
          ),
          h('line', {
            x1: zeroX,
            x2: zeroX,
            y1: centerY - band * 0.38,
            y2: centerY + band * 0.38,
            stroke: theme.muted,
            'stroke-opacity': 0.28,
          }),
          h(
            'text',
            {
              x: left - 14,
              y: centerY + 4,
              'text-anchor': 'end',
              class: 'gvui-svg-axis',
            },
            truncate(category, 12),
          ),
          ...segments,
        ]);
      });

      const legend = groups.length
        ? h(
            'g',
            { class: 'gvui-svg-legend' },
            groups.map((group, index) => {
              const startX = width - right - groups.length * 94 + index * 94;
              return h('g', { key: group }, [
                h('rect', {
                  x: startX,
                  y: 3,
                  width: 10,
                  height: 10,
                  rx: 2,
                  fill: colors.get(group),
                }),
                h(
                  'text',
                  { x: startX + 16, y: 12, class: 'gvui-svg-small' },
                  truncate(group, 8),
                ),
              ]);
            }),
          )
        : null;

      return h(
        'section',
        {
          class: 'gvui-custom gvui-grouped-bar',
          style: themeVars(theme),
          'aria-label': props.title || '分组条形图',
        },
        [
          props.title ? h('h3', { class: 'gvui-custom-title' }, props.title) : null,
          h(
            'svg',
            {
              viewBox: `0 0 ${width} ${height}`,
              role: 'img',
              'aria-label': props.title || '分组条形图',
            },
            [
              grid,
              h('line', {
                x1: left,
                x2: width - right,
                y1: height - bottom,
                y2: height - bottom,
                stroke: theme.grid,
              }),
              marks,
              legend,
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
              props.axisYTitle
                ? h(
                    'text',
                    {
                      x: 18,
                      y: top + plotHeight / 2,
                      transform: `rotate(-90 18 ${top + plotHeight / 2})`,
                      'text-anchor': 'middle',
                      class: 'gvui-svg-axis-title',
                    },
                    props.axisYTitle,
                  )
                : null,
            ],
          ),
        ],
      );
    };
  },
});
