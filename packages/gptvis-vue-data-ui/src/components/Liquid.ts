import { computed, defineComponent, h, type PropType } from 'vue';
import type { ResolvedThemeTokens } from '../theme.js';
import { formatPercent, percentNumber, themeVars } from '../utils.js';

type LiquidShape = 'circle' | 'pin' | 'rect' | 'triangle';

let liquidSequence = 0;

export const LiquidChart = defineComponent({
  name: 'GptVisLiquid',

  props: {
    percent: { type: [Number, String], required: true },
    shape: { type: String as PropType<LiquidShape>, default: 'circle' },
    title: { type: String, default: '' },
    palette: { type: Array as PropType<string[]>, default: () => [] },
    theme: { type: Object as PropType<ResolvedThemeTokens>, required: true },
  },

  setup(props) {
    const clipId = `gvui-liquid-${liquidSequence++}`;
    const ratio = computed(() => percentNumber(props.percent) ?? 0);
    const label = computed(() => formatPercent(ratio.value));

    return () => {
      const theme = props.theme;
      const palette = props.palette.length ? props.palette : theme.palette;
      const color = palette[0] ?? theme.total;
      const secondary = palette[1] ?? color;
      const rest = 100 - ratio.value * 100;
      const shape =
        props.shape === 'rect' || props.shape === 'triangle' || props.shape === 'pin'
          ? props.shape
          : 'circle';
      const waveLevel = 18 + ratio.value * 244;

      const clipShape =
        shape === 'rect'
          ? h('rect', { x: 110, y: 60, width: 220, height: 310, rx: 28 })
          : shape === 'triangle'
            ? h('path', { d: 'M 220 54 L 366 356 L 74 356 Z' })
            : shape === 'pin'
              ? h('path', {
                  d: 'M 220 52 C 145 52 88 109 88 184 C 88 290 220 382 220 382 C 220 382 352 290 352 184 C 352 109 295 52 220 52 Z',
                })
              : h('circle', { cx: 220, cy: 220, r: 162 });

      return h(
        'section',
        {
          class: 'gvui-custom gvui-liquid',
          style: themeVars(theme),
          'aria-label': props.title || `水波图 ${label.value}`,
        },
        [
          props.title ? h('h3', { class: 'gvui-custom-title' }, props.title) : null,
          h(
            'svg',
            {
              viewBox: '0 0 440 440',
              role: 'img',
              'aria-label': `${props.title || '水波图'} ${label.value}`,
              class: 'gvui-liquid-svg',
            },
            [
              h('defs', [
                h('clipPath', { id: clipId }, [clipShape]),
                h('linearGradient', { id: `${clipId}-gradient`, x1: '0', x2: '1' }, [
                  h('stop', { offset: '0%', 'stop-color': color }),
                  h('stop', { offset: '100%', 'stop-color': secondary }),
                ]),
              ]),
              h('g', { 'clip-path': `url(#${clipId})` }, [
                h('rect', {
                  x: 50,
                  y: 40,
                  width: 340,
                  height: 360,
                  fill: theme.grid,
                  'fill-opacity': 0.45,
                }),
                h('path', {
                  class: 'gvui-liquid-wave gvui-liquid-wave-back',
                  d: wavePath(waveLevel + 8, 440, 18, 0.7),
                  fill: secondary,
                  'fill-opacity': 0.32,
                }),
                h('path', {
                  class: 'gvui-liquid-wave',
                  d: wavePath(waveLevel, 440, 22, 1),
                  fill: `url(#${clipId}-gradient)`,
                  'fill-opacity': 0.86,
                }),
              ]),
              h('g', { fill: 'none', stroke: color, 'stroke-width': 2 }, [clipShape]),
              h(
                'text',
                {
                  x: 220,
                  y: 230,
                  'text-anchor': 'middle',
                  class: 'gvui-liquid-value',
                  style: `fill:${theme.text}`,
                },
                label.value,
              ),
              h(
                'text',
                {
                  x: 220,
                  y: 258,
                  'text-anchor': 'middle',
                  class: 'gvui-liquid-caption',
                  style: `fill:${theme.muted}`,
                },
                '完成度',
              ),
              h('circle', {
                cx: 220,
                cy: 405,
                r: 5,
                fill: ratio.value >= 1 ? theme.positive : color,
              }),
              h(
                'text',
                {
                  x: 234,
                  y: 410,
                  class: 'gvui-liquid-remain',
                  style: `fill:${theme.muted}`,
                },
                `剩余 ${Math.round(rest * 10) / 10}%`,
              ),
            ],
          ),
        ],
      );
    };
  },
});

function wavePath(level: number, width: number, amplitude: number, phase: number): string {
  const points: string[] = [];
  const from = -20;
  const to = width + 20;
  for (let x = from; x <= to; x += 10) {
    const y =
      level +
      Math.sin((x / 68) * Math.PI + phase * 2.1) * amplitude +
      Math.sin((x / 33) * Math.PI + 0.8) * amplitude * 0.24;
    points.push(`${x === from ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  points.push(`L ${to} 420 L ${from} 420 Z`);
  return points.join(' ');
}
