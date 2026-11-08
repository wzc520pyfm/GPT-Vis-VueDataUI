---
name: chart-visualization
description: Choose a chart and write GPT-Vis syntax for the VueDataUI renderer. Use when a user asks to visualize data, select a chart, generate a vis block, or integrate gptvis-vue-data-ui into a Vue app.
---

# Chart visualization

Write a `vis` block. Do not write a VueDataUI config, an ECharts option, or
JavaScript. The runtime parses the block and renders it with VueDataUI.

## Output

Put the block in a `vis` fence. The first line is `vis <type>`. Properties are
`key value` or `key: value`. Quote values that contain spaces. Quoted values stay
strings.

```vis
vis line
title 月度销售额
axisXTitle 月份
axisYTitle 万元
data
  - time 1月
    value 128
    group 华东
  - time 2月
    value 116
    group 华东
```

`theme` is `default`, `light`, `academy`, or `dark`. Colors go under `style` and
must be real colors (`#rrggbb`, `rgb()`, or a CSS color name):

```vis
vis bar
style
  palette
    - #0f6e6b
    - #d4652f
```

## Which chart

| Question | type | Data |
| --- | --- | --- |
| 时间趋势 | `line` or `area` | `time`, `value`, optional `group`. `stack true` on area |
| 类目比较 | `column` (vertical) or `bar` (horizontal) | `category`, `value`, optional `group`. `stack true` to stack |
| 占比 | `pie` | `category`, `value`. `innerRadius 0.6` for a donut |
| 两个数值的关系 | `scatter` | `x`, `y`, optional `group` |
| 多维评分 | `radar` | `name`, `value`, optional `group` |
| 阶段转化 | `funnel` | `category`, `value` |
| 从合计到合计的增减 | `waterfall` | `category`, `value`. Mark totals with `isTotal true` |
| 两个单位 | `dual-axes` | `categories` list, then `series` of `type line` or `type column`, each with `data` and `axisYTitle` |
| 数值分布区间 | `histogram` | a list of numbers, optional `binNumber` |
| 分布与离群 | `boxplot` or `violin` | repeated `category` / `value` rows |
| 两三个集合的重叠 | `venn` | `sets` as a comma-separated string, plus `value` |
| 流量拆分 | `sankey` | `source`, `target`, `value` |
| 层级面积 | `treemap` | `name`, `value`, nested `children` |
| 词频 | `word-cloud` | `text`, `value` |
| 一个百分比 | `liquid` | `percent` from 0 to 1. Optional `shape` `circle`, `rect`, `triangle`, or `pin` |
| 步骤 | `flow-diagram` | `data` with `nodes` (`name`) and `edges` (`source`, `target`, optional `name`) |
| 关系网 | `network-graph` | same nodes and edges. Optional `layout` `force`, `circular`, `grid`, `radial`, `concentric`, or `dagre` |
| 原因拆解 | `mindmap` or `fishbone-diagram` | one root `name` and nested `children` |
| 名单层级 | `indented-tree` | root `name` and `children` |
| 上下级 | `organization-chart` | root `name` and `children` |
| 明细 | `table` | one object per row; keys become columns |
| 结论 | plain markdown, no `vis` line | headings, lists, **bold**, and entities such as `[174 万](metric_value)` or `[+7%](delta_value, assessment="positive")` |

Prefer `line`, `column`, `bar`, `pie`, `dual-axes`, `waterfall`, or `table` for
business questions. Use a relationship chart only when the structure itself is
the answer.

## Rules

- Keep field names in the table above. `time` is for line and area. `category` is
  for column, bar, pie, funnel, waterfall, boxplot, and violin.
- One row is one observation. Repeat `group` on every row of a multi-series chart.
- Numbers are bare. Quote a year or code only when it must stay text, for example
  `"2026-01"`.
- Do not invent a chart type outside the table. There is no `heatmap` in this
  renderer.
- Do not emit scripts, URLs, or event handlers inside labels. Labels are text.
- For a waterfall, a total row sets the running height. A following total without
  `value` uses the running sum.
- A mind map opens to both sides unless `direction` is `LR` or `RL`. A fishbone
  puts the result on the right and causes on both sides.
- Venn diagrams support two or three sets.
- Only `default`, `light`, `academy`, and `dark` are built-in themes. Do not use
  GPT-Vis preset names such as `pop` or `midnight` unless the host app registered a
  compatible `ThemeSpec`.

## Integration

Install `gptvis-vue-data-ui` with its peer dependencies, and import VueDataUI's
stylesheet once:

```bash
npm install gptvis-vue-data-ui vue-data-ui vue
```

```ts
import 'vue-data-ui/style.css';
import { GPTVis } from 'gptvis-vue-data-ui';

const vis = new GPTVis({ container: '#chart', theme: 'academy', height: 460 });
vis.render(syntax);
vis.destroy();
```

Vue component:

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { GPTVisChart } from 'gptvis-vue-data-ui/vue';
import 'vue-data-ui/style.css';

const content = ref('vis column\ndata\n  - category A\n    value 12\n');
</script>

<template>
  <GPTVisChart :content="content" :height="440" />
</template>
```

For token streams, pass the current buffer and set `streaming`; the incomplete
last line is dropped. Use `gptvis-vue-data-ui/syntax` for server-side validation
without loading Vue or VueDataUI.

## References

- [Chart data schemas](references/chart-data.md)
- [ThemeSpec support](references/themes.md)
