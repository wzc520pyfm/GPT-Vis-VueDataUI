import { computed, defineComponent, h, type PropType } from 'vue';
import type { ResolvedThemeTokens } from '../theme.js';
import { rowsOf, text, themeVars, type Row } from '../utils.js';
import { estimateTextWidth, truncate } from './svg.js';

interface GraphNode {
  id: string;
  label: string;
  description: string;
  layer: number;
  x: number;
  y: number;
  color: string;
}

interface GraphEdge {
  from: string;
  to: string;
  label: string;
}

interface PlacedEdge extends GraphEdge {
  source: GraphNode;
  target: GraphNode;
}

interface GraphModel {
  nodes: GraphNode[];
  edges: PlacedEdge[];
  width: number;
  height: number;
}

type GraphMode = 'flow' | 'organization';

let graphSequence = 0;

export const LayeredGraphChart = defineComponent({
  name: 'GptVisLayeredGraph',

  props: {
    nodes: { type: Array as PropType<Row[]>, default: () => [] },
    edges: { type: Array as PropType<Row[]>, default: () => [] },
    mode: { type: String as PropType<GraphMode>, default: 'flow' },
    title: { type: String, default: '' },
    palette: { type: Array as PropType<string[]>, default: () => [] },
    theme: { type: Object as PropType<ResolvedThemeTokens>, required: true },
  },

  setup(props) {
    const markerId = `gvui-graph-arrow-${graphSequence++}`;
    const model = computed(() =>
      layoutGraph(props.nodes, props.edges, props.mode, props.palette, props.theme),
    );

    return () => {
      const { nodes, edges, width, height } = model.value;
      const theme = props.theme;
      const organization = props.mode === 'organization';
      const nodeWidth = organization ? 112 : 148;
      const nodeHeight = organization ? 54 : 46;
      const marker = organization ? '' : `url(#${markerId})`;

      return h(
        'section',
        {
          class: `gvui-custom gvui-graph ${organization ? 'gvui-organization' : 'gvui-flow'}`,
          style: themeVars(theme),
          'aria-label': props.title || (organization ? '组织架构' : '流程图'),
        },
        [
          props.title
            ? h('h3', { class: 'gvui-custom-title' }, props.title)
            : null,
          h(
            'svg',
            {
              viewBox: `0 0 ${width} ${height}`,
              role: 'img',
              'aria-label': props.title || (organization ? '组织架构' : '流程图'),
            },
            [
              h('defs', [
                h(
                  'marker',
                  {
                    id: markerId,
                    markerWidth: 9,
                    markerHeight: 9,
                    refX: 7,
                    refY: 4.5,
                    orient: 'auto',
                  },
                  [
                    h('path', {
                      d: 'M 0 0 L 8 4.5 L 0 9 Z',
                      fill: theme.muted,
                    }),
                  ],
                ),
              ]),
              ...edges.map((edge) => {
                const { d, labelX, labelY } = edgePath(
                  edge.source,
                  edge.target,
                  width,
                  nodeWidth,
                  nodeHeight,
                );
                const labelWidth = estimateTextWidth(edge.label, 10) + 14;
                return h('g', { key: `edge-${edge.from}-${edge.to}-${edge.label}`, class: 'gvui-graph-edge' }, [
                  h('title', `${edge.from} → ${edge.to}${edge.label ? ` · ${edge.label}` : ''}`),
                  h('path', {
                    d,
                    fill: 'none',
                    stroke: theme.muted,
                    'stroke-width': organization ? 1.15 : 1.35,
                    'stroke-opacity': organization ? 0.42 : 0.58,
                    'stroke-linecap': 'round',
                    'marker-end': marker,
                  }),
                  edge.label
                    ? h('g', { class: 'gvui-graph-edge-label' }, [
                        h('rect', {
                          x: labelX - labelWidth / 2,
                          y: labelY - 9,
                          width: labelWidth,
                          height: 18,
                          rx: 9,
                          fill: theme.background,
                          stroke: theme.grid,
                          'stroke-opacity': 0.7,
                        }),
                        h(
                          'text',
                          {
                            x: labelX,
                            y: labelY + 3.5,
                            'text-anchor': 'middle',
                          },
                          truncate(edge.label, 18),
                        ),
                      ])
                    : null,
                ]);
              }),
              ...nodes.map((node) => {
                const labelLength = organization ? 7 : 10;
                return h(
                  'g',
                  {
                    key: node.id,
                    class: 'gvui-graph-node',
                    'data-depth': node.layer,
                  },
                  [
                    h(
                      'title',
                      `${node.label}${node.description ? `\n${node.description}` : ''}`,
                    ),
                    h('rect', {
                      x: node.x - nodeWidth / 2,
                      y: node.y - nodeHeight / 2,
                      width: nodeWidth,
                      height: nodeHeight,
                      rx: organization ? 10 : 9,
                      fill: theme.background,
                      stroke: organization ? theme.grid : node.color,
                      'stroke-width': organization ? 1.1 : 1.5,
                    }),
                    h('rect', {
                      x: node.x - nodeWidth / 2,
                      y: node.y - nodeHeight / 2,
                      width: organization ? nodeWidth : 4,
                      height: organization ? 3 : nodeHeight,
                      rx: organization ? 2 : 2,
                      fill: node.color,
                    }),
                    h(
                      'text',
                      {
                        x: node.x,
                        y: node.y + (node.description ? -2 : 4),
                        'text-anchor': 'middle',
                        class: organization
                          ? 'gvui-org-node-label'
                          : 'gvui-flow-node-label',
                      },
                      truncate(node.label, labelLength),
                    ),
                    node.description
                      ? h(
                          'text',
                          {
                            x: node.x,
                            y: node.y + 14,
                            'text-anchor': 'middle',
                            class: 'gvui-org-node-description',
                          },
                          truncate(node.description, 12),
                        )
                      : null,
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

function layoutGraph(
  rawNodes: Row[],
  rawEdges: Row[],
  mode: GraphMode,
  palette: string[],
  theme: ResolvedThemeTokens,
): GraphModel {
  const organization = mode === 'organization';
  const width = 800;
  const nodeWidth = organization ? 112 : 148;
  const nodeHeight = organization ? 54 : 46;
  const gap = organization ? 14 : 20;
  const rowGap = 14;
  const layerGap = organization ? 50 : 56;
  const top = 28;
  const bottom = 24;
  const colors = palette.length ? palette : theme.palette;

  const seen = new Set<string>();
  const sourceNodes = rowsOf(rawNodes)
    .map((node, index) => {
      const id = text(node.id || node.name || `n${index}`);
      return {
        id,
        label: text(node.label || node.name || node.id || `节点 ${index + 1}`),
        description: text(node.description || node.category || ''),
      };
    })
    .filter((node) => {
      if (seen.has(node.id)) return false;
      seen.add(node.id);
      return true;
    });

  const known = new Set(sourceNodes.map((node) => node.id));
  const edges: GraphEdge[] = rowsOf(rawEdges)
    .map((edge) => ({
      from: text(edge.from ?? edge.source),
      to: text(edge.to ?? edge.target),
      label: text(edge.label ?? edge.name),
    }))
    .filter((edge) => known.has(edge.from) && known.has(edge.to) && edge.from !== edge.to);

  const levels = rankNodes(sourceNodes.map((node) => node.id), edges);
  const ordered = [...sourceNodes].sort(
    (a, b) =>
      (levels.get(a.id) ?? 0) - (levels.get(b.id) ?? 0) ||
      sourceNodes.indexOf(a) - sourceNodes.indexOf(b),
  );
  const grouped = new Map<number, typeof ordered>();
  for (const node of ordered) {
    const layer = levels.get(node.id) ?? 0;
    grouped.set(layer, [...(grouped.get(layer) ?? []), node]);
  }

  const capacity = Math.max(1, Math.floor((width - 48 + gap) / (nodeWidth + gap)));
  const placed: GraphNode[] = [];
  let cursorY = top;
  for (const layer of [...grouped.keys()].sort((a, b) => a - b)) {
    const layerNodes = grouped.get(layer) ?? [];
    const rows = chunk(layerNodes, capacity);
    rows.forEach((row, rowIndex) => {
      const rowWidth = row.length * nodeWidth + (row.length - 1) * gap;
      const startX = (width - rowWidth) / 2 + nodeWidth / 2;
      row.forEach((node, index) => {
        placed.push({
          ...node,
          layer,
          x: startX + index * (nodeWidth + gap),
          y: cursorY + rowIndex * (nodeHeight + rowGap) + nodeHeight / 2,
          color: colors[layer % colors.length],
        });
      });
    });
    cursorY += rows.length * nodeHeight + (rows.length - 1) * rowGap + layerGap;
  }

  const byId = new Map(placed.map((node) => [node.id, node]));
  const placedEdges: PlacedEdge[] = edges
    .map((edge) => {
      const source = byId.get(edge.from);
      const target = byId.get(edge.to);
      return source && target ? { ...edge, source, target } : null;
    })
    .filter((edge): edge is PlacedEdge => edge != null);

  return {
    nodes: placed,
    edges: placedEdges,
    width,
    height: Math.max(340, cursorY - layerGap + bottom),
  };
}

function rankNodes(
  ids: string[],
  edges: GraphEdge[],
): Map<string, number> {
  const levels = new Map(ids.map((id) => [id, 0]));
  const incoming = new Map(ids.map((id) => [id, 0]));
  const outgoing = new Map<string, string[]>(ids.map((id) => [id, []]));
  for (const edge of edges) {
    incoming.set(edge.to, (incoming.get(edge.to) ?? 0) + 1);
    outgoing.set(edge.from, [...(outgoing.get(edge.from) ?? []), edge.to]);
  }

  const queue = ids.filter((id) => (incoming.get(id) ?? 0) === 0);
  const visited = new Set<string>();
  while (queue.length) {
    const id = queue.shift() as string;
    if (visited.has(id)) continue;
    visited.add(id);
    for (const target of outgoing.get(id) ?? []) {
      levels.set(target, Math.max(levels.get(target) ?? 0, (levels.get(id) ?? 0) + 1));
      incoming.set(target, Math.max(0, (incoming.get(target) ?? 0) - 1));
      if ((incoming.get(target) ?? 0) === 0) queue.push(target);
    }
  }

  if (visited.size < ids.length) {
    const fallback = Math.max(0, ...levels.values()) + 1;
    for (const id of ids) {
      if (!visited.has(id)) levels.set(id, fallback);
    }
  }
  return levels;
}

function chunk<T>(items: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    rows.push(items.slice(index, index + size));
  }
  return rows;
}

function edgePath(
  source: GraphNode,
  target: GraphNode,
  width: number,
  nodeWidth: number,
  nodeHeight: number,
): { d: string; labelX: number; labelY: number } {
  if (target.layer > source.layer) {
    const startX = source.x;
    const startY = source.y + nodeHeight / 2;
    const endX = target.x;
    const endY = target.y - nodeHeight / 2;
    const middleY = (startY + endY) / 2;
    return {
      d: `M ${startX} ${startY} C ${startX} ${middleY}, ${endX} ${middleY}, ${endX} ${endY}`,
      labelX: (startX + endX) / 2,
      labelY: middleY,
    };
  }

  const startX = source.x + nodeWidth / 2;
  const tipX = target.x + nodeWidth / 2;
  const routeX = width - 18;
  return {
    d: `M ${startX} ${source.y} C ${routeX} ${source.y}, ${routeX} ${target.y}, ${tipX} ${target.y}`,
    labelX: routeX - 2,
    labelY: (source.y + target.y) / 2,
  };
}
