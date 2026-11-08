import { computed, defineComponent, h, type PropType } from 'vue';
import type { ResolvedThemeTokens } from '../theme.js';
import { formatNumber, themeVars } from '../utils.js';

interface VennRow {
  sets: string[];
  value: number;
  label: string;
}

interface Circle {
  name: string;
  cx: number;
  cy: number;
  r: number;
  color: string;
}

interface RegionLabel {
  key: string;
  sets: string[];
  x: number;
  y: number;
  value: number;
  label: string;
}

export const VennChart = defineComponent({
  name: 'GptVisVenn',

  props: {
    rows: { type: Array as PropType<VennRow[]>, required: true },
    title: { type: String, default: '' },
    palette: { type: Array as PropType<string[]>, default: () => [] },
    theme: { type: Object as PropType<ResolvedThemeTokens>, required: true },
  },

  setup(props) {
    const model = computed(() => {
      const rows = props.rows.filter((row) => row.sets.length);
      const names = [...new Set(rows.flatMap((row) => row.sets))].slice(0, 3);
      const palette = props.palette.length ? props.palette : props.theme.palette;
      const circles: Circle[] =
        names.length === 2
          ? [
              { name: names[0], cx: 330, cy: 235, r: 164, color: palette[0] },
              { name: names[1], cx: 548, cy: 235, r: 164, color: palette[1] },
            ]
          : [
              {
                name: names[0] ?? 'A',
                cx: 430,
                cy: 194,
                r: 164,
                color: palette[0],
              },
              {
                name: names[1] ?? 'B',
                cx: 323,
                cy: 346,
                r: 164,
                color: palette[1],
              },
              {
                name: names[2] ?? 'C',
                cx: 537,
                cy: 346,
                r: 164,
                color: palette[2],
              },
            ];
      const anchors = regionAnchors(circles);
      const labels: RegionLabel[] = rows.map((row) => {
        const key = [...row.sets].sort().join('|');
        const anchor = anchors.get(key) ?? {
          x: 440,
          y: 300,
        };
        return {
          key,
          sets: row.sets,
          x: anchor.x,
          y: anchor.y,
          value: row.value,
          label: row.label,
        };
      });
      return { names, circles, labels };
    });

    return () => {
      const { names, circles, labels } = model.value;
      const theme = props.theme;
      return h(
        'section',
        {
          class: 'gvui-custom gvui-venn',
          style: themeVars(theme),
          'aria-label': props.title || '韦恩图',
        },
        [
          props.title ? h('h3', { class: 'gvui-custom-title' }, props.title) : null,
          h(
            'svg',
            {
              viewBox: '0 0 880 540',
              role: 'img',
              'aria-label': props.title || `韦恩图：${names.join('、')}`,
            },
            [
              h('defs', [
                ...circles.map((circle, index) =>
                  h(
                    'radialGradient',
                    { id: `gvui-venn-${index}`, cx: '36%', cy: '34%', r: '72%' },
                    [
                      h('stop', {
                        offset: '0%',
                        'stop-color': circle.color,
                        'stop-opacity': 0.42,
                      }),
                      h('stop', {
                        offset: '100%',
                        'stop-color': circle.color,
                        'stop-opacity': 0.18,
                      }),
                    ],
                  ),
                ),
              ]),
              ...circles.map((circle, index) =>
                h('circle', {
                  key: circle.name,
                  cx: circle.cx,
                  cy: circle.cy,
                  r: circle.r,
                  fill: `url(#gvui-venn-${index})`,
                  stroke: circle.color,
                  'stroke-width': 2,
                  'stroke-opacity': 0.75,
                  class: 'gvui-venn-circle',
                }),
              ),
              ...labels.map((label) =>
                h(
                  'g',
                  {
                    key: `${label.key}-${label.x}`,
                    class: 'gvui-mark',
                    'aria-label': `${label.label || label.sets.join(' 与 ')}：${label.value}`,
                  },
                  [
                    h(
                      'title',
                      `${label.label || label.sets.join(' 与 ')}\n${formatNumber(label.value)}`,
                    ),
                    h(
                      'text',
                      {
                        x: label.x,
                        y: label.y,
                        'text-anchor': 'middle',
                        class: 'gvui-venn-value',
                      },
                      formatNumber(label.value),
                    ),
                    label.label
                      ? h(
                          'text',
                          {
                            x: label.x,
                            y: label.y + 18,
                            'text-anchor': 'middle',
                            class: 'gvui-venn-caption',
                          },
                          label.label,
                        )
                      : null,
                  ],
                ),
              ),
              ...names.map((name, index) => {
                const position =
                  names.length === 2
                    ? {
                        x: index === 0 ? 190 : 690,
                        y: 72,
                        anchor: 'middle',
                      }
                    : [
                        { x: 430, y: 42, anchor: 'middle' },
                        { x: 142, y: 500, anchor: 'middle' },
                        { x: 724, y: 500, anchor: 'middle' },
                      ][index];
                return h(
                  'g',
                  { key: `name-${name}` },
                  [
                    h('circle', {
                      cx:
                        position.anchor === 'middle'
                          ? position.x - Math.min(78, name.length * 7 + 10)
                          : position.x,
                      cy: position.y - 4,
                      r: 5,
                      fill: circles[index]?.color,
                    }),
                    h(
                      'text',
                      {
                        x: position.x,
                        y: position.y,
                        'text-anchor': position.anchor,
                        class: 'gvui-venn-name',
                      },
                      name,
                    ),
                  ],
                );
              }),
            ],
          ),
        ],
      );
    };
  },
});

function regionAnchors(circles: Circle[]): Map<string, { x: number; y: number }> {
  if (circles.length === 2) {
    const [left, right] = circles;
    return new Map([
      [[left.name].sort().join('|'), { x: left.cx - 78, y: left.cy + 8 }],
      [[right.name].sort().join('|'), { x: right.cx + 78, y: right.cy + 8 }],
      [
        [left.name, right.name].sort().join('|'),
        { x: (left.cx + right.cx) / 2, y: left.cy + 8 },
      ],
    ]);
  }

  const [top, left, right] = circles;
  return new Map([
    [[top.name].sort().join('|'), { x: top.cx, y: top.cy - 72 }],
    [[left.name].sort().join('|'), { x: left.cx - 82, y: left.cy + 62 }],
    [[right.name].sort().join('|'), { x: right.cx + 82, y: right.cy + 62 }],
    [
      [top.name, left.name].sort().join('|'),
      { x: top.cx - 88, y: top.cy + 98 },
    ],
    [
      [top.name, right.name].sort().join('|'),
      { x: top.cx + 88, y: top.cy + 98 },
    ],
    [
      [left.name, right.name].sort().join('|'),
      { x: (left.cx + right.cx) / 2, y: left.cy + 106 },
    ],
    [
      [top.name, left.name, right.name].sort().join('|'),
      { x: (left.cx + right.cx) / 2, y: 304 },
    ],
  ]);
}
