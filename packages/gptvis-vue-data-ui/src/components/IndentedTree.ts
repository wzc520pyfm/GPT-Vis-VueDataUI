import { computed, defineComponent, h, type PropType } from 'vue';
import type { ResolvedThemeTokens } from '../theme.js';
import { rowsOf, text, themeVars, type Row } from '../utils.js';
import { truncate } from './svg.js';

interface TreeRow {
  id: string;
  name: string;
  depth: number;
  parent?: string;
  color: string;
}

let treeSequence = 0;

export const IndentedTreeChart = defineComponent({
  name: 'GptVisIndentedTree',

  props: {
    root: { type: Object as PropType<Row>, required: true },
    title: { type: String, default: '' },
    palette: { type: Array as PropType<string[]>, default: () => [] },
    theme: { type: Object as PropType<ResolvedThemeTokens>, required: true },
  },

  setup(props) {
    const model = computed(() => flattenTree(props.root, props.palette, props.theme));
    return () => {
      const { rows, width, height, depthCount } = model.value;
      const theme = props.theme;
      const rowHeight = 42;
      const index = new Map(rows.map((row, position) => [row.id, position]));
      const boxWidth = Math.min(184, Math.max(150, (width - 64) / Math.max(1, depthCount)));

      return h(
        'section',
        {
          class: 'gvui-custom gvui-indented-tree',
          style: themeVars(theme),
          'aria-label': props.title || '缩进树',
        },
        [
          props.title ? h('h3', { class: 'gvui-custom-title' }, props.title) : null,
          h(
            'svg',
            {
              viewBox: `0 0 ${width} ${height}`,
              role: 'img',
              'aria-label': props.title || '缩进树',
            },
            [
              ...rows
                .filter((row) => row.parent)
                .map((row) => {
                  const parentIndex = index.get(row.parent as string) ?? 0;
                  const rowIndex = index.get(row.id) ?? 0;
                  const parentDepth = row.depth - 1;
                  const fromX = 24 + parentDepth * 212 + boxWidth;
                  const fromY = 34 + parentIndex * rowHeight + 16;
                  const toX = 24 + row.depth * 212;
                  const toY = 34 + rowIndex * rowHeight + 16;
                  const midX = (fromX + toX) / 2;
                  return h('path', {
                    key: `edge-${row.id}`,
                    d: `M ${fromX} ${fromY} H ${midX} V ${toY} H ${toX}`,
                    fill: 'none',
                    stroke: row.color,
                    'stroke-opacity': 0.42,
                    'stroke-width': 1.4,
                  });
                }),
              ...rows.map((row, position) => {
                const x = 24 + row.depth * 212;
                const y = 34 + position * rowHeight;
                return h('g', { key: row.id, class: 'gvui-mark' }, [
                  h('title', `${row.name} · 第 ${row.depth + 1} 层`),
                  h('rect', {
                    x,
                    y,
                    width: boxWidth,
                    height: 32,
                    rx: 7,
                    fill: theme.background,
                    stroke: row.color,
                    'stroke-opacity': row.depth === 0 ? 0.9 : 0.36,
                    'stroke-width': row.depth === 0 ? 1.6 : 1,
                  }),
                  h('rect', {
                    x,
                    y: y + 8,
                    width: 3,
                    height: 16,
                    rx: 2,
                    fill: row.color,
                  }),
                  h(
                    'text',
                    {
                      x: x + 14,
                      y: y + 21,
                      class: row.depth === 0 ? 'gvui-tree-root' : 'gvui-tree-label',
                    },
                    truncate(row.name, 14),
                  ),
                ]);
              }),
            ],
          ),
        ],
      );
    };
  },
});

function flattenTree(
  root: Row,
  palette: string[],
  theme: ResolvedThemeTokens,
): { rows: TreeRow[]; width: number; height: number; depthCount: number } {
  treeSequence = 0;
  const colors = palette.length ? palette : theme.palette;
  const rows: TreeRow[] = [];
  let depthCount = 1;
  const visit = (node: Row, depth: number, color: string, parent?: string): void => {
    const id = `tree-${treeSequence++}`;
    rows.push({
      id,
      name: text(node.name || node.category || '未命名'),
      depth,
      parent,
      color,
    });
    depthCount = Math.max(depthCount, depth + 1);
    rowsOf(node.children).forEach((child, index) =>
      visit(child, depth + 1, depth === 0 ? colors[index % colors.length] : color, id),
    );
  };
  visit(root, 0, colors[0]);
  return {
    rows,
    width: Math.max(680, 48 + depthCount * 212 + 120),
    height: Math.max(220, 70 + rows.length * 42),
    depthCount,
  };
}
