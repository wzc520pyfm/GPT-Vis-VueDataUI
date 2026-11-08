import { GPTVis, bindGPTVis, type GPTVisOptions, type RenderStatus } from './runtime.js';

export { CHARTS, SUPPORTED, chartLabel } from './catalog.js';
export type { ChartSpec } from './catalog.js';
export { buildView } from './build.js';
export type {
  BuiltView,
  CustomComponent,
  DataUiComponent,
  ViewContext,
} from './build.js';
export { isVisSyntax, parse, readConfig } from './parser.js';
export type { ParsedConfig, ParseOptions } from './parser.js';
export { GPTVis, bindGPTVis };
export type { GPTVisOptions, RenderStatus, GPTVisOptions as VisualizationOptions };
export {
  Area,
  Bar,
  Boxplot,
  Column,
  DualAxes,
  FishboneDiagram,
  FlowDiagram,
  Funnel,
  Histogram,
  IndentedTree,
  Line,
  Liquid,
  Mindmap,
  NetworkGraph,
  OrganizationChart,
  Pie,
  Radar,
  Sankey,
  Scatter,
  Summary,
  Table,
  Treemap,
  Venn,
  Violin,
  Waterfall,
  WordCloud,
} from './charts.js';
export type { ChartHandle, ChartTypeName } from './charts.js';
export { isThemeName, isThemeSpec, resolveTheme } from './theme.js';
export type {
  ChartType,
  ResolvedThemeTokens,
  ThemeName,
  ThemeSpec,
  ThemeStyle,
  ThemeTokens,
  VisualizationTheme,
} from './theme.js';

/** Kept as a named reference so the package type surface mirrors the constructor. */
export const GPTVisConstructor = GPTVis;

export type { GPTVisOptions as BindOptions };
