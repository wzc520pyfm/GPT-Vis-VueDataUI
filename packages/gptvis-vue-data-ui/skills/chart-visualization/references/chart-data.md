# Chart data schemas

All charts support `title`, `theme`, and the common `style.backgroundColor` /
`style.palette` fields unless noted. These are the data shapes consumed by
`gptvis-vue-data-ui`. JSON objects and `vis` syntax use the same field names.

## Trend and comparison

### `line`

```ts
{
  type: 'line';
  data: { time: string; value: number; group?: string }[];
  axisXTitle?: string;
  axisYTitle?: string;
  group?: boolean;
}
```

### `area`

```ts
{
  type: 'area';
  data: { time: string; value: number; group?: string }[];
  stack?: boolean;
  axisXTitle?: string;
  axisYTitle?: string;
}
```

### `column` / `bar`

```ts
{
  type: 'column' | 'bar';
  data: { category: string; value: number; group?: string }[];
  stack?: boolean;
  group?: boolean;
  axisXTitle?: string;
  axisYTitle?: string;
}
```

`column` is vertical. `bar` is horizontal. A single-series `bar` uses
`VueUiHorizontalBar`; grouped or stacked bars use the custom grouped-bar renderer.

### `dual-axes`

```ts
{
  type: 'dual-axes';
  categories: string[];
  series: {
    type: 'line' | 'column';
    data: number[];
    name?: string;
    axisYTitle?: string;
  }[];
  axisXTitle?: string;
  axisYTitle?: string;
}
```

Every series should have the same length as `categories`. The adapter keeps
individual scale groups so the two units do not share one axis.

## Composition and stage

### `pie`

```ts
{
  type: 'pie';
  data: { category: string; value: number }[];
  innerRadius?: number; // 0..1
}
```

### `funnel`

```ts
{
  type: 'funnel';
  data: { category: string; value: number }[];
}
```

### `waterfall`

```ts
{
  type: 'waterfall';
  data: {
    category: string;
    value?: number;
    isTotal?: boolean;
  }[];
  startValue?: number;
}
```

A total without `value` uses the current running total.

### `liquid`

```ts
{
  type: 'liquid';
  percent: number; // 0..1
  shape?: 'circle' | 'rect' | 'triangle' | 'pin';
}
```

## Distribution and relationship

### `scatter`

```ts
{
  type: 'scatter';
  data: { x: number; y: number; group?: string; name?: string }[];
  axisXTitle?: string;
  axisYTitle?: string;
}
```

### `histogram`

```ts
{
  type: 'histogram';
  data: number[];
  binNumber?: number;
  axisXTitle?: string;
  axisYTitle?: string;
}
```

Pass raw continuous samples. Do not pass pre-aggregated interval/count rows.

### `boxplot` / `violin`

```ts
{
  type: 'boxplot' | 'violin';
  data: { category: string; value: number; group?: string }[];
  axisXTitle?: string;
  axisYTitle?: string;
  style?: { startAtZero?: boolean };
}
```

Each category should contain multiple raw samples.

### `radar`

```ts
{
  type: 'radar';
  data: { name: string; value: number; group?: string }[];
}
```

The same `group` forms one radar series.

### `venn`

```ts
{
  type: 'venn';
  data: {
    sets: string | string[]; // two or three sets
    value: number;
    label?: string;
  }[];
}
```

## Hierarchy and flow

### `treemap`

```ts
{
  type: 'treemap';
  data: {
    name: string;
    value?: number;
    children?: TreeNode[];
  }[];
}
```

When `value` is omitted, it is summed from children.

### `sankey`

```ts
{
  type: 'sankey';
  data: { source: string; target: string; value: number }[];
}
```

### `flow-diagram`

```ts
{
  type: 'flow-diagram';
  data: {
    nodes: { name: string }[];
    edges: { source: string; target: string; name?: string }[];
  };
}
```

The renderer chooses a layered layout that adapts to narrow containers.

### `network-graph`

```ts
{
  type: 'network-graph';
  data: {
    nodes: { name: string; group?: string; value?: number }[];
    edges: { source: string; target: string; name?: string; value?: number }[];
  };
  layout?: 'force' | 'circular' | 'grid' | 'radial' | 'concentric' | 'dagre';
}
```

### `mindmap`

```ts
{
  type: 'mindmap';
  data: {
    name: string;
    children?: TreeNode[];
  };
  direction?: 'both' | 'LR' | 'RL';
}
```

### `indented-tree`

```ts
{
  type: 'indented-tree';
  data: { name: string; children?: TreeNode[] };
}
```

### `organization-chart`

```ts
{
  type: 'organization-chart';
  data: { name: string; description?: string; children?: TreeNode[] };
}
```

### `fishbone-diagram`

```ts
{
  type: 'fishbone-diagram';
  data: { name: string; children?: TreeNode[] };
}
```

The root is the result; categories and their children are causes.

## Text

### `word-cloud`

```ts
{
  type: 'word-cloud';
  data: { text: string; value: number; color?: string }[];
}
```

### `table`

```ts
{
  type: 'table';
  data: Record<string, string | number>[];
}
```

Keys become column names. Rows are paginated by the VueDataUI table.

### `summary`

Plain Markdown that does not start with `vis ` is treated as a summary. A config
object can also use:

```ts
{
  type: 'summary';
  content: string;
}
```

The summary renderer supports headings, paragraphs, lists, blockquotes, bold,
inline code, and semantic entities such as `[指标](metric_value)`.

## Shared style

```ts
{
  style?: {
    backgroundColor?: string;
    palette?: string[];
    lineWidth?: number;
  };
}
```

`startAtZero` is also read for `boxplot` and `violin`. Other GPT-Vis style
namespaces are accepted by the type but not mapped to VueDataUI in this adapter.
