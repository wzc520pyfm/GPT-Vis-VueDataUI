# gptvis-vue-data-ui

GPT-Vis 的 VueDataUI 适配层。模型继续写 `vis` 语法，图由
[VueDataUI](https://github.com/graphieros/vue-data-ui) 绘制，不安装 AntV 或 ECharts。

公开入口和 `@antv/gpt-vis` / `gptvis-echarts` 对齐：`GPTVis`、`bindGPTVis`、
`parse`、`isVisSyntax`、`readConfig`，以及 26 个同名图表构造函数。

## 安装

`vue` 和 `vue-data-ui` 是 peer dependencies，需要应用一起安装：

```bash
npm install gptvis-vue-data-ui vue-data-ui vue
```

支持的版本：

- Vue `>= 3.3`
- VueDataUI `>= 3.28`
- Node.js `>= 20`（构建和服务端解析）

在应用入口导入 VueDataUI 的样式：

```ts
import 'vue-data-ui/style.css';
```

本包自己的少量布局样式会在创建 `GPTVis` 实例时自动注入，不需要额外 CSS 入口。

## Vue 组件

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { GPTVisChart } from 'gptvis-vue-data-ui/vue';
import 'vue-data-ui/style.css';

const content = ref(`vis pie
title 预算分配
innerRadius 0.62
data
  - category 产品研发
    value 46
  - category 市场投放
    value 22
  - category 客户成功
    value 16
`);
</script>

<template>
  <GPTVisChart :content="content" :height="440" />
</template>
```

`content` 可以是 `vis` 字符串、JSON 字符串、摘要 Markdown 或配置对象。流式接收时：

```vue
<GPTVisChart
  :content="buffer"
  streaming
  theme="dark"
  :height="460"
  @status="handleStatus"
/>
```

组件 props：

| 属性        | 类型                                   | 默认值      | 说明                                          |
| ----------- | -------------------------------------- | ----------- | --------------------------------------------- |
| `content`   | `string \| Record<string, unknown>`    | `''`        | `vis`、JSON、摘要文本或配置对象               |
| `theme`     | `VisualizationTheme`                   | `'default'` | 内置主题名或 `ThemeSpec`                      |
| `streaming` | `boolean`                              | `false`     | 丢弃未写完的末行，允许边接收边渲染            |
| `wrapper`   | `boolean`                              | `false`     | 显示图表/代码切换、复制、下载 SVG、缩放工具条 |
| `locale`    | `string`                               | `'en'`      | 工具条文案；支持 `zh-CN`                      |
| `width`     | `number`                               | `undefined` | 固定宽度                                      |
| `height`    | `number`                               | `undefined` | 图表区域高度                                  |
| `onStatus`  | `(status) => void`                     | `undefined` | 渲染状态回调                                  |

组件同时会发出 `status` 事件。`content` 更新时复用同一个 `GPTVis` 实例，
主题、尺寸或 `streaming` 等 props 改变时会重新挂载。

## 命令式 API

```ts
import { GPTVis } from 'gptvis-vue-data-ui';
import 'vue-data-ui/style.css';

const vis = new GPTVis({
  container: '#chart',
  theme: 'academy',
  height: 460,
  wrapper: true,
  locale: 'zh-CN',
});

vis.render(`
vis line
title 月度收入
data
  - time 1月
    value 128
  - time 2月
    value 146
  - time 3月
    value 139
`);

vis.zoomTo(1.2);
vis.getZoom();
vis.destroy();
```

构造参数：

| 字段        | 类型                    | 说明                                       |
| ----------- | ----------------------- | ------------------------------------------ |
| `container` | `string \| HTMLElement` | 必填，CSS 选择器或元素                     |
| `width`     | `number`                | 可选，像素宽度                             |
| `height`    | `number`                | 可选，像素高度；默认约 440                 |
| `theme`     | `VisualizationTheme`    | `default` / `light` / `dark` / `academy` 或 `ThemeSpec` |
| `streaming` | `boolean`               | 是否按流式输入处理                         |
| `wrapper`   | `boolean`               | 是否显示工具栏                             |
| `locale`    | `string`                | 工具条语言，默认英文，支持 `zh-CN`         |
| `onStatus`  | `(status) => void`      | 状态回调                                   |

`RenderStatus.state` 为 `pending`、`ready`、`unsupported` 或 `error`。
`GPTVis.render()` 重复调用会更新现有视图；切换类型时旧图表会被销毁。

### 原生绑定

适用于在 `onMounted` 中绑定 DOM 的场景：

```ts
import { bindGPTVis } from 'gptvis-vue-data-ui';

const chart = bindGPTVis(el.value, { theme: 'default' });
chart.update(buffer);
chart.resize();
chart.destroy();
```

返回对象包含 `update`、`resize`、`zoomTo`、`getZoom`、`destroy`。

## 单图构造函数

只需要一种图时，可以用同名构造函数，配置对象里不需要再写 `type`：

```ts
import { Pie } from 'gptvis-vue-data-ui';

const pie = Pie({ container: '#chart', theme: 'academy' });
pie.render({
  data: [
    { category: '人力', value: 46 },
    { category: '投放', value: 22 },
  ],
  innerRadius: 0.6,
});
```

可用构造函数：

`Line`、`Area`、`Column`、`Bar`、`Pie`、`Scatter`、`Radar`、`Funnel`、
`Waterfall`、`DualAxes`、`Histogram`、`Boxplot`、`Violin`、`Venn`、`Sankey`、
`Treemap`、`WordCloud`、`Liquid`、`FlowDiagram`、`NetworkGraph`、`Mindmap`、
`IndentedTree`、`OrganizationChart`、`FishboneDiagram`、`Table`、`Summary`。

## 服务端与语法校验

`gptvis-vue-data-ui/syntax` 不导入 Vue、VueDataUI 或浏览器运行时，可用于服务端、
Worker、Dify 插件或生成前校验：

```ts
import { isVisSyntax, parse, readConfig } from 'gptvis-vue-data-ui/syntax';

if (isVisSyntax(buffer)) {
  const config = parse(buffer);
  const normalized = readConfig(buffer, { streaming: true });
}
```

`readConfig` 接受 `vis` 字符串、JSON 字符串、配置对象或普通 Markdown 文本。
普通文本会映射为 `summary`。

## 流式输出

```ts
const vis = new GPTVis({ container: '#chart', streaming: true });

onToken((buffer) => {
  if (buffer.trimStart().startsWith('vis')) vis.render(buffer);
});
```

流式模式下：

- 尚未换行的最后一行会被丢弃，避免把半截字段画坏。
- 只收到 `v`、`vi`、`vis` 时返回等待状态。
- 完整行会立即渲染；后续 token 到达时增量更新。

## 主题

内置主题：

- `default`：暖白背景与蓝色主色。
- `light`：`default` 的别名。
- `dark`：深色背景与高亮分类色。
- `academy`：暖纸背景和经典学术配色。

不承诺 GPT-Vis 新增的全部主题名（如 `pop`、`midnight` 等）。如果需要品牌色，
传 `ThemeSpec`：

```ts
import type { ThemeSpec } from 'gptvis-vue-data-ui';

const theme: ThemeSpec = {
  id: 'brand',
  label: '品牌报告',
  baseTheme: 'default',
  tokens: {
    colorBackground: '#F8F6F0',
    colorText: '#10231F',
    colorTextSecondary: '#65736E',
    colorStroke: '#DDE2DC',
    colorSurface: '#112622',
    colorTextInverse: '#F8F6F0',
    colorDefault: '#0C746C',
    category10: ['#0C746C', '#E47B3F', '#2E5C8A'],
    colorPositive: '#1D7A4D',
    colorNegative: '#B34F43',
    fontFamily: '"Avenir Next", "PingFang SC", sans-serif',
    lineWidth: 2.4,
    radius: 6,
  },
  style: {
    palette: ['#0C746C', '#E47B3F', '#2E5C8A'],
  },
};
```

主题 token 映射：

| ThemeSpec token                                        | 用途                     |
| ------------------------------------------------------ | ------------------------ |
| `colorBackground`                                      | 图表背景                 |
| `colorText`                                            | 主文本                   |
| `colorTextSecondary` / `colorNeutral`                  | 次级文本、坐标轴刻度     |
| `colorStroke`                                          | 网格线                   |
| `colorSurface`                                         | tooltip 背景             |
| `colorTextInverse`                                     | tooltip 文本             |
| `category10` / `category20`                            | 分类色板                 |
| `colorPositive` / `colorNegative`                      | 正向/负向语义色          |
| `colorDefault`                                         | 强调色                   |
| `fontFamily`、`lineWidth`、`radius`                    | 字体、线宽、圆角         |

`style.backgroundColor` 和 `style.palette` 会覆盖 token。当前适配层实际消费的
单图 `style` 字段是 `backgroundColor`、`palette`、`lineWidth`，以及箱线图/小提琴图的
`startAtZero`。其他 `ThemeStyle` 命名空间、`ThemeSpec.charts` 和函数式 formatter
暂不应用。

## 图表类型与渲染映射

| `type`                | 数据字段                                                       | 渲染器                          |
| --------------------- | -------------------------------------------------------------- | ------------------------------- |
| `line`                | `time`、`value`，可选 `group`                                  | `VueUiXy`                       |
| `area`                | `time`、`value`，可选 `group`、`stack`                         | 自定义 SVG 面积图               |
| `column`              | `category`、`value`，可选 `group`、`stack`                     | `VueUiXy`                       |
| `bar`                 | `category`、`value`，可选 `group`、`stack`                     | 单系列 `VueUiHorizontalBar`；分组/堆叠用自定义 SVG |
| `pie`                 | `category`、`value`，可选 `innerRadius`                        | `VueUiDonut`                    |
| `scatter`             | `x`、`y`，可选 `group`、`name`                                 | `VueUiScatter`                  |
| `radar`               | `name`、`value`，可选 `group`                                  | 自定义 SVG 雷达图               |
| `funnel`              | `category`、`value`                                            | `VueUiFunnel`                   |
| `waterfall`           | `category`、`value`，`isTotal true` 标记合计                    | `VueUiStackbar`                 |
| `dual-axes`           | `categories`，`series[].type/data/axisYTitle`                  | `VueUiXy`                       |
| `histogram`           | 原始数字数组，可选 `binNumber`                                 | `VueUiXy`                       |
| `boxplot`             | 重复的 `category`、`value`，可选 `group`                       | 自定义 SVG 箱线图               |
| `violin`              | 重复的 `category`、`value`，可选 `group`                       | 自定义 SVG 小提琴图             |
| `venn`                | `sets`（2–3 个）与 `value`                                     | 自定义 SVG 韦恩图               |
| `sankey`              | `source`、`target`、`value`                                    | `VueUiFlow`                     |
| `treemap`             | `name`、`value`，可嵌套 `children`                             | `VueUiTreemap`                  |
| `word-cloud`          | `text`、`value`                                                | `VueUiWordCloud`                |
| `liquid`              | `percent`（0–1），可选 `shape`                                 | 自定义 SVG 水波图               |
| `flow-diagram`        | `nodes` / `edges`                                              | 自定义分层图                    |
| `network-graph`       | `nodes` / `edges`，可选 `layout`                               | `VueUiGraph`                    |
| `mindmap`             | 根 `name` 与嵌套 `children`，可选 `direction`                  | 自定义 SVG 思维导图             |
| `indented-tree`       | 根 `name` 与 `children`                                        | 自定义 SVG 缩进树               |
| `organization-chart`  | 根 `name` 与 `children`                                        | 自定义分层组织架构              |
| `fishbone-diagram`    | 结果根节点与原因 `children`                                    | 自定义 SVG 鱼骨图               |
| `table`               | 对象数组，键名成为列名                                         | `VueUiTable`                    |
| `summary`             | Markdown 文本                                                  | 自定义 Vue 文本摘要             |

原生 VueDataUI 组件负责大部分统计图、表格、关系图和词云；其余图表由适配层补齐。
这些补齐组件遵循相同的 `vis` 字段，但不保证与 GPT-Vis/G2 像素级一致。

## 工具栏、复制与下载

`wrapper: true` 时提供：

- 图表 / 代码切换。
- 复制完整源码。
- 下载当前可见 SVG。
- 流程图、网络图、思维导图、缩进树、组织架构、鱼骨图支持 25%–400% 缩放。

`GPTVis.zoomTo()` 和 `getZoom()` 可在无工具栏时直接调用画布缩放。

## 安全与兼容边界

- 不接受任意 VueDataUI 组件 option、回调、事件处理器或 URL。
- 不执行 LLM 生成的 JavaScript。
- 文本一律通过 Vue 文本节点输出，不使用 `v-html`；摘要的 Markdown 渲染器也只构建文本、
  标题、列表、引用和行内标注。
- 颜色只接受 `#hex`、`rgb()`、`hsl()` 或 CSS 颜色名。
- 语法中未知字段会被忽略；未知 `type` 返回 `unsupported` 状态，不抛异常。
- 图表绘制依赖 VueDataUI 组件自身的能力；部分交互（如原生 tooltip、图例 toggle）
  在不同组件间不完全一致。

## 开发

```bash
npm install
npm run dev
npm test
npm run typecheck
npm run build
```

库源码在 `src/`，测试在 `tests/`。`src/syntax.ts` 必须保持无 Vue/VueDataUI import，
发布前由 `scripts/check-package.mjs` 检查入口和产物。

## License

MIT，见 `LICENSE`。`vis` 文法设计来自 AntV GPT-Vis；解析器、VueDataUI 映射和
自定义渲染器为独立实现。
