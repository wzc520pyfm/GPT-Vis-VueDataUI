import { computed, defineComponent, h, type PropType } from 'vue';
import type { ResolvedThemeTokens } from '../theme.js';
import { num, rowsOf, text, themeVars, type Row } from '../utils.js';
import { formatTick, niceScale, truncate } from './svg.js';

export const RadarChart = defineComponent({
  name: 'GptVisRadar',

  props: {
    rows: { type: Array as PropType<Row[]>, required: true },
    title: { type: String, default: '' },
    palette: { type: Array as PropType<string[]>, default: () => [] },
    theme: { type: Object as PropType<ResolvedThemeTokens>, required: true },
  },

  setup(props) {
    const model = computed(() => {
      const rows = rowsOf(props.rows);
      const categories = [...new Set(rows.map((row) => text(row.name)).filter(Boolean))];
      const groups = [...new Set(rows.map((row) => text(row.group)).filter(Boolean))];
      const names = groups.length ? groups : [''];
      const palette = props.palette.length ? props.palette : props.theme.palette;
      const series = names.map((name, index) => ({
        name: name || '数值',
        color: palette[index % palette.length],
        values: categories.map((category) => {
          const matches = rows.filter(
            (row) =>
              text(row.name) === category &&
              (!name || text(row.group) === name),
          );
          return matches.length ? num(matches[0].value) ?? 0 : 0;
        }),
      }));
      return {
        categories,
        series,
        max: niceScale([0, ...series.flatMap((entry) => entry.values)], true, 5).max,
      };
    });

    return () => {
      const { categories, series, max } = model.value;
      const theme = props.theme;
      const width = 760;
      const height = 450;
      const centerX = width / 2;
      const centerY = 208;
      const radius = 142;
      const count = Math.max(3, categories.length);
      const angle = (index: number) => -Math.PI / 2 + (index / count) * Math.PI * 2;
      const point = (index: number, ratio: number) => ({
        x: centerX + Math.cos(angle(index)) * radius * ratio,
        y: centerY + Math.sin(angle(index)) * radius * ratio,
      });
      const polygon = (ratios: number[]) =>
        ratios
          .map((ratio, index) => {
            const p = point(index, ratio);
            return `${index ? 'L' : 'M'} ${p.x} ${p.y}`;
          })
          .join(' ');

      const rings = [0.25, 0.5, 0.75, 1].map((ratio) =>
        h('path', {
          key: `ring-${ratio}`,
          d: `${polygon(categories.map(() => ratio))} Z`,
          fill: 'none',
          stroke: theme.grid,
          'stroke-width': ratio === 1 ? 1.3 : 1,
        }),
      );
      const axes = categories.map((_, index) => {
        const end = point(index, 1);
        return h('line', {
          key: `axis-${index}`,
          x1: centerX,
          y1: centerY,
          x2: end.x,
          y2: end.y,
          stroke: theme.grid,
          'stroke-width': 1,
        });
      });
      const labels = categories.map((category, index) => {
        const p = point(index, 1.14);
        const anchor =
          Math.abs(p.x - centerX) < 8
            ? 'middle'
            : p.x < centerX
              ? 'end'
              : 'start';
        return h(
          'text',
          {
            key: `label-${category}`,
            x: p.x,
            y: p.y + 4,
            'text-anchor': anchor,
            class: 'gvui-radar-label',
          },
          truncate(category, 10),
        );
      });
      const marks = series.map((entry) => {
        const ratios = entry.values.map((value) => Math.max(0, value) / Math.max(1, max));
        const points = ratios.map((ratio, index) => point(index, ratio));
        return h(
          'g',
          { key: entry.name, class: 'gvui-mark' },
          [
            h(
              'title',
              `${entry.name}\n${categories
                .map((category, index) => `${category}: ${entry.values[index]}`)
                .join('\n')}`,
            ),
            h('path', {
              d: `${polygon(ratios)} Z`,
              fill: entry.color,
              'fill-opacity': 0.16,
              stroke: entry.color,
              'stroke-width': 2,
              'stroke-linejoin': 'round',
            }),
            ...points.map((p, index) =>
              h('circle', {
                key: `point-${index}`,
                cx: p.x,
                cy: p.y,
                r: 3.2,
                fill: theme.background,
                stroke: entry.color,
                'stroke-width': 1.8,
              }),
            ),
          ],
        );
      });
      const legend = series.map((entry, index) =>
        h('g', { key: `legend-${entry.name}` }, [
          h('circle', {
            cx: width / 2 - series.length * 52 + index * 104,
            cy: height - 26,
            r: 5,
            fill: entry.color,
          }),
          h(
            'text',
            {
              x: width / 2 - series.length * 52 + index * 104 + 13,
              y: height - 21,
              class: 'gvui-svg-small',
            },
            truncate(entry.name, 9),
          ),
        ]),
      );
      const scaleLabels = [0.25, 0.5, 0.75, 1].map((ratio) =>
        h(
          'text',
          {
            key: `scale-${ratio}`,
            x: centerX + 6,
            y: centerY - radius * ratio + 4,
            class: 'gvui-svg-tick',
          },
          formatTick(max * ratio),
        ),
      );

      return h(
        'section',
        {
          class: 'gvui-custom gvui-radar',
          style: themeVars(theme),
          'aria-label': props.title || '雷达图',
        },
        [
          props.title ? h('h3', { class: 'gvui-custom-title' }, props.title) : null,
          h(
            'svg',
            {
              viewBox: `0 0 ${width} ${height}`,
              role: 'img',
              'aria-label': props.title || '雷达图',
            },
            [
              rings,
              axes,
              labels,
              scaleLabels,
              marks,
              series.length > 1 ? legend : null,
            ],
          ),
        ],
      );
    };
  },
});
