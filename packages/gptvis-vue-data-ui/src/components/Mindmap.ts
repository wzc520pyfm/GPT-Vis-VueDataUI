import { computed, defineComponent, h, type PropType } from 'vue';
import type { ResolvedThemeTokens } from '../theme.js';
import { rowsOf, text, themeVars, type Row } from '../utils.js';
import { truncate } from './svg.js';

type Direction = 'both' | 'LR' | 'RL';

interface LayoutNode {
  id: string;
  name: string;
  x: number;
  y: number;
  depth: number;
  side: 'left' | 'right' | 'root';
  color: string;
  parent?: LayoutNode;
}

interface TreeMeta {
  leaves: number;
}

let nodeSequence = 0;

export const MindmapChart = defineComponent({
  name: 'GptVisMindmap',

  props: {
    root: { type: Object as PropType<Row>, required: true },
    direction: { type: String, default: 'both' },
    title: { type: String, default: '' },
    palette: { type: Array as PropType<string[]>, default: () => [] },
    theme: { type: Object as PropType<ResolvedThemeTokens>, required: true },
  },

  setup(props) {
    const model = computed(() => layoutMindmap(props.root, props.direction, props.palette, props.theme));
    return () => {
      const { nodes, width, height, root } = model.value;
      const theme = props.theme;
      const canvasHeight = Math.max(340, height);
      return h(
        'section',
        {
          class: 'gvui-custom gvui-mindmap',
          style: themeVars(theme),
          'aria-label': props.title || '思维导图',
        },
        [
          props.title ? h('h3', { class: 'gvui-custom-title' }, props.title) : null,
          h(
            'svg',
            {
              viewBox: `0 0 ${width} ${canvasHeight}`,
              role: 'img',
              'aria-label': props.title || `思维导图：${root?.name ?? ''}`,
            },
            [
              ...nodes
                .filter((node) => node.parent)
                .map((node) => {
                  const parent = node.parent as LayoutNode;
                  const direction = node.x >= parent.x ? 1 : -1;
                  const parentBoxWidth = Math.min(
                    112,
                    Math.max(54, parent.name.length * 12 + 20),
                  );
                  const fromX =
                    parent.x +
                    direction *
                      (parent.depth === 0 ? 54 : 14 + parentBoxWidth);
                  const toX = node.x;
                  const middleX = (fromX + toX) / 2;
                  return h('path', {
                    key: `edge-${node.id}`,
                    d: `M ${fromX} ${parent.y} C ${middleX} ${parent.y}, ${middleX} ${node.y}, ${toX} ${node.y}`,
                    fill: 'none',
                    stroke: node.color,
                    'stroke-width': node.depth === 1 ? 2 : 1.35,
                    'stroke-opacity': node.depth === 1 ? 0.78 : 0.5,
                    'stroke-linecap': 'round',
                  });
                }),
              ...nodes.map((node) => {
                const isRoot = node.depth === 0;
                const side = node.side;
                const boxWidth = Math.min(112, Math.max(54, node.name.length * 12 + 20));
                const boxX =
                  isRoot
                    ? node.x - Math.max(52, boxWidth / 2)
                    : side === 'left'
                      ? node.x - 14 - boxWidth
                      : node.x + 14;
                const textX = isRoot
                  ? node.x
                  : side === 'left'
                    ? boxX + boxWidth - 10
                    : boxX + 10;
                const anchor = isRoot ? 'middle' : side === 'left' ? 'end' : 'start';
                return h('g', { key: node.id, class: 'gvui-mark' }, [
                  h(
                    'title',
                    `${node.name}${node.depth ? ` · 第 ${node.depth} 层` : ' · 中心主题'}`,
                  ),
                  h('circle', {
                    cx: node.x,
                    cy: node.y,
                    r: isRoot ? 7 : node.depth === 1 ? 5 : 3.5,
                    fill: isRoot ? theme.background : node.color,
                    stroke: node.color,
                    'stroke-width': isRoot ? 3 : 1.6,
                  }),
                  !isRoot
                    ? h('rect', {
                        x: boxX,
                        y: node.y - 14,
                        width: boxWidth,
                        height: 28,
                        rx: 7,
                        fill: theme.background,
                        stroke: node.color,
                        'stroke-opacity': node.depth === 1 ? 0.38 : 0.2,
                      })
                    : null,
                  h(
                    'text',
                    {
                      x: textX,
                      y: node.y + 4,
                      'text-anchor': anchor,
                      class: isRoot ? 'gvui-mind-root' : node.depth === 1 ? 'gvui-mind-branch' : 'gvui-mind-leaf',
                    },
                    truncate(node.name, isRoot ? 18 : 9),
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

function layoutMindmap(
  root: Row,
  direction: string,
  palette: string[],
  theme: ResolvedThemeTokens,
): { nodes: LayoutNode[]; width: number; height: number; root: LayoutNode | null } {
  nodeSequence = 0;
  const colors = palette.length ? palette : theme.palette;
  const children = rowsOf(root.children);
  const normalized: Direction =
    direction === 'LR' || direction === 'RL' ? direction : 'both';
  const width = 940;
  const top = 40;
  const rowHeight = 50;
  const depth = maxDepth(root);
  const gap = Math.max(104, Math.min(150, (width / 2 - 130) / Math.max(1, depth)));

  const sides: Array<'left' | 'right'> = normalized === 'LR'
    ? children.map(() => 'right')
    : normalized === 'RL'
      ? children.map(() => 'left')
      : children.map((_, index) => (index % 2 === 0 ? 'right' : 'left'));

  const leafCounts = children.map(countLeaves);
  const sideLeaves = {
    left: leafCounts.reduce((sum, count, index) => sum + (sides[index] === 'left' ? count : 0), 0),
    right: leafCounts.reduce((sum, count, index) => sum + (sides[index] === 'right' ? count : 0), 0),
  };
  const maxLeaves = Math.max(1, sideLeaves.left, sideLeaves.right);
  const canvasHeight = Math.max(360, maxLeaves * rowHeight + top * 2);
  const rootNode: LayoutNode = {
    id: 'root',
    name: text(root.name || '中心主题'),
    x: width / 2,
    y: canvasHeight / 2,
    depth: 0,
    side: 'root',
    color: colors[0],
  };
  const nodes: LayoutNode[] = [rootNode];

  for (const side of ['left', 'right'] as const) {
    const sideChildren = children.filter((_, index) => sides[index] === side);
    const total = sideLeaves[side];
    if (!sideChildren.length || !total) continue;
    const usable = canvasHeight - top * 2;
    let cursor = top;
    for (const child of sideChildren) {
      const originalIndex = children.indexOf(child);
      const count = leafCounts[originalIndex] ?? 1;
      const span = (count / total) * usable;
      const branchColor = colors[(originalIndex % colors.length + colors.length) % colors.length];
      placeBranch(
        child,
        1,
        side,
        cursor,
        cursor + span,
        rootNode,
        branchColor,
        width,
        gap,
        nodes,
      );
      cursor += span;
    }
  }

  return { nodes, width, height: canvasHeight, root: rootNode };
}

function placeBranch(
  node: Row,
  depth: number,
  side: 'left' | 'right',
  top: number,
  bottom: number,
  parent: LayoutNode,
  color: string,
  width: number,
  gap: number,
  nodes: LayoutNode[],
): void {
  const y = (top + bottom) / 2;
  const x =
    side === 'left'
      ? width / 2 - depth * gap
      : width / 2 + depth * gap;
  const layoutNode: LayoutNode = {
    id: `node-${nodeSequence++}`,
    name: text(node.name || '未命名'),
    x,
    y,
    depth,
    side,
    color,
    parent,
  };
  nodes.push(layoutNode);
  const children = rowsOf(node.children);
  if (!children.length) return;

  const counts = children.map(countLeaves);
  const total = counts.reduce((sum, count) => sum + count, 0);
  const span = bottom - top;
  let cursor = top;
  for (const child of children) {
    const childCount = counts[children.indexOf(child)] ?? 1;
    const height = (childCount / total) * span;
    placeBranch(
      child,
      depth + 1,
      side,
      cursor,
      cursor + height,
      layoutNode,
      color,
      width,
      gap,
      nodes,
    );
    cursor += height;
  }
}

function countLeaves(node: Row): number {
  const children = rowsOf(node.children);
  if (!children.length) return 1;
  return children.reduce((sum, child) => sum + countLeaves(child), 0);
}

function maxDepth(node: Row): number {
  const children = rowsOf(node.children);
  if (!children.length) return 0;
  return 1 + Math.max(...children.map(maxDepth));
}
