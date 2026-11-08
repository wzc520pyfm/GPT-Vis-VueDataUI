# GPT-Vis VueDataUI

让 [VueDataUI](https://github.com/graphieros/vue-data-ui) 用户直接使用
[GPT-Vis](https://github.com/antvis/GPT-Vis) 的 `vis` 语法。

模型或业务代码继续输出同一种图表描述：

```vis
vis column
title 各区域销售额
data
  - category 华东
    value 128
  - category 华南
    value 96
```

适配层负责解析语法并渲染成 VueDataUI 图表。公开 API 与
[gptvis-echarts](https://github.com/wzc520pyfm/GPT-Vis-ECharts) 对齐：
`GPTVis`、`bindGPTVis`、`parse`、`isVisSyntax`，以及 26 个同名图表构造函数。
本仓库不依赖 AntV、ECharts 或 `@antv/gpt-vis`。

## 能力

- 26 种 GPT-Vis 图表类型，字段名和选图方式保持兼容。
- Vue 3 组件、命令式 `GPTVis`、服务端 `syntax` 入口。
- 支持 Markdown `vis` fenced block、JSON 配置对象和流式半截输入。
- `default`、`light`、`dark`、`academy` 四套内置主题，以及兼容 `ThemeSpec` 的自定义主题。
- 可选的工具栏：图表/代码切换、复制源码、下载可见 SVG。
- 流程图、网络图、思维导图等关系图支持运行时缩放。

## 仓库结构

```text
packages/gptvis-vue-data-ui/   可发布库
playground/                    本地演示与视觉验收
```

图表字段、API、主题和限制详见
[packages/gptvis-vue-data-ui/README.md](packages/gptvis-vue-data-ui/README.md)。
给 Agent 使用的选图与语法说明在
[skills/chart-visualization/SKILL.md](packages/gptvis-vue-data-ui/skills/chart-visualization/SKILL.md)。

## 本地运行

```bash
npm install
npm run dev
```

默认打开 http://127.0.0.1:4318 。左侧修改 `vis` 语法，右侧即时渲染。

```bash
npm test
npm run typecheck
npm run build
```

## 渲染方式

统计图优先使用 VueDataUI 原生组件；原生组件的语义或交互不适合时，由适配层的
Vue/SVG 组件补齐。例如面积图、雷达图、箱线图、小提琴图、韦恩图、水波图、
思维导图、缩进树、鱼骨图以及流程图/组织架构的层次布局。

`vue-data-ui` 是 peer dependency。应用除了安装本包，还需要安装 `vue-data-ui`
并导入 `vue-data-ui/style.css`。

```bash
npm install gptvis-vue-data-ui vue-data-ui vue
```

```ts
import 'vue-data-ui/style.css';
import { GPTVis } from 'gptvis-vue-data-ui';
```

## 兼容边界

- 只支持 GPT-Vis 的 `vis` 文法，不暴露 VueDataUI 的任意组件配置、函数或事件处理器。
- 颜色只接受安全颜色字面量；文本通过 Vue 文本节点渲染，不使用 `v-html`。
- `ThemeSpec` 支持 token 与全局样式覆盖，但不承诺 GPT-Vis 后续新增的全部预设主题。
- 自定义 SVG 图表是适配层补齐的兼容实现，不保证与 GPT-Vis/G2 的像素级一致。

## License

MIT，见 [LICENSE](LICENSE)。`vis` 文法设计来自 AntV GPT-Vis；本仓库的解析器、
VueDataUI 映射和自定义渲染器是独立实现。
