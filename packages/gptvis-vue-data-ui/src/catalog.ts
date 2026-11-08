import type { ChartType } from './theme.js';

export interface ChartSpec {
  type: ChartType;
  label: string;
  group: '统计' | '关系' | '文本';
  note: string;
}

export const CHARTS: ChartSpec[] = [
  { type: 'line', label: '折线图', group: '统计', note: '时间趋势，可用 group 分系列' },
  { type: 'area', label: '面积图', group: '统计', note: '趋势面积，支持 stack' },
  { type: 'column', label: '柱状图', group: '统计', note: '纵向比较，支持分组和堆叠' },
  { type: 'bar', label: '条形图', group: '统计', note: '横向比较，长标签更易读' },
  { type: 'pie', label: '饼图', group: '统计', note: '占比，innerRadius 画成环形' },
  { type: 'scatter', label: '散点图', group: '统计', note: '两个数值字段的相关关系' },
  { type: 'radar', label: '雷达图', group: '统计', note: 'name / value，可用 group 对比' },
  { type: 'funnel', label: '漏斗图', group: '统计', note: '阶段转化和流失' },
  { type: 'waterfall', label: '瀑布图', group: '统计', note: '增减贡献，isTotal 标记合计' },
  { type: 'dual-axes', label: '双轴图', group: '统计', note: '柱线组合，左右各自单位' },
  { type: 'histogram', label: '直方图', group: '统计', note: '一列数字加 binNumber' },
  { type: 'boxplot', label: '箱线图', group: '统计', note: '按类别汇总原始数值' },
  { type: 'violin', label: '小提琴图', group: '统计', note: '按类别展示概率密度' },
  { type: 'venn', label: '韦恩图', group: '统计', note: '两到三个集合的交集' },
  { type: 'sankey', label: '桑基图', group: '统计', note: 'source / target / value' },
  { type: 'treemap', label: '矩形树图', group: '统计', note: '带 children 的层级面积' },
  { type: 'word-cloud', label: '词云', group: '统计', note: 'text / value' },
  { type: 'liquid', label: '水波图', group: '统计', note: '单个 percent，0 到 1' },
  { type: 'flow-diagram', label: '流程图', group: '关系', note: 'nodes 与 edges，自适应分层' },
  { type: 'network-graph', label: '网络图', group: '关系', note: '力导向或固定布局' },
  { type: 'mindmap', label: '思维导图', group: '关系', note: '默认从中心向两侧展开' },
  { type: 'indented-tree', label: '缩进树', group: '关系', note: '层级名单' },
  { type: 'organization-chart', label: '组织架构', group: '关系', note: '自上而下的树' },
  { type: 'fishbone-diagram', label: '鱼骨图', group: '关系', note: '结果在右，原因分列两侧' },
  { type: 'table', label: '表格', group: '文本', note: '对象行，键名就是列名' },
  { type: 'summary', label: '摘要', group: '文本', note: '非 vis 正文按摘要排版' },
];

export const SUPPORTED = new Set<string>(CHARTS.map((chart) => chart.type));

export function chartLabel(type: string): string {
  return CHARTS.find((chart) => chart.type === type)?.label ?? type;
}

