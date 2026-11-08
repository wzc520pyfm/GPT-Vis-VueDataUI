export type ThemeName = 'default' | 'light' | 'dark' | 'academy';

export type ChartType =
  | 'area'
  | 'bar'
  | 'boxplot'
  | 'column'
  | 'dual-axes'
  | 'fishbone-diagram'
  | 'flow-diagram'
  | 'funnel'
  | 'histogram'
  | 'indented-tree'
  | 'line'
  | 'liquid'
  | 'mindmap'
  | 'network-graph'
  | 'organization-chart'
  | 'pie'
  | 'radar'
  | 'sankey'
  | 'scatter'
  | 'summary'
  | 'table'
  | 'treemap'
  | 'venn'
  | 'violin'
  | 'waterfall'
  | 'word-cloud';

export interface ThemeStyle {
  backgroundColor?: string;
  palette?: string[];
  title?: Record<string, unknown>;
  axis?: Record<string, unknown>;
  legend?: Record<string, unknown>;
  label?: Record<string, unknown>;
  mark?: Record<string, unknown>;
  node?: Record<string, unknown>;
  edge?: Record<string, unknown>;
  table?: {
    header?: Record<string, unknown>;
    cell?: Record<string, unknown>;
    border?: Record<string, unknown>;
  };
  summary?: Record<string, unknown>;
  texture?: 'rough' | 'default';
  lineWidth?: number;
}

export interface ThemeTokens {
  colorDefault?: string;
  colorBackground?: string;
  colorSurface?: string;
  colorText?: string;
  colorTextSecondary?: string;
  colorTextInverse?: string;
  colorStroke?: string;
  colorPositive?: string;
  colorNegative?: string;
  colorNeutral?: string;
  category10?: string[];
  category20?: string[];
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number | 'normal' | 'bold';
  lineHeight?: number;
  spacingSmall?: number;
  spacingMedium?: number;
  lineWidth?: number;
  radius?: number;
}

export interface ThemeSpec {
  id: string;
  label: string;
  description?: string;
  baseTheme?: string;
  tokens?: ThemeTokens;
  style?: ThemeStyle;
  charts?: Partial<Record<ChartType, { style?: ThemeStyle }>>;
}

export type VisualizationTheme = ThemeName | ThemeSpec;

export interface ResolvedThemeTokens {
  name: Exclude<ThemeName, 'light'>;
  background: string;
  text: string;
  muted: string;
  grid: string;
  tooltipBg: string;
  tooltipText: string;
  palette: string[];
  positive: string;
  negative: string;
  total: string;
  fontFamily: string;
  lineWidth: number;
  radius: number;
}

const DEFAULT_PALETTE = [
  '#3559E0',
  '#0B9B8B',
  '#DD9A18',
  '#D45D59',
  '#5A76B3',
  '#8C6BAF',
  '#4D8A63',
  '#2D89A4',
];

const DARK_PALETTE = [
  '#8FA9FF',
  '#74D7C9',
  '#F3C46C',
  '#F19B96',
  '#A7BBEB',
  '#C9ADEB',
  '#8FCCA4',
  '#7CC8E0',
];

const ACADEMY_PALETTE = [
  '#4E79A7',
  '#F28E2B',
  '#E15759',
  '#76B7B2',
  '#59A14F',
  '#EDC948',
  '#B07AA1',
  '#9C755F',
];

export function resolveTheme(
  theme: unknown,
  fallback: VisualizationTheme = 'default',
): ResolvedThemeTokens {
  const selected = isThemeName(theme) || isThemeSpec(theme) ? theme : fallback;
  if (isThemeSpec(selected)) return applyThemeSpec(namedTheme(selected.baseTheme), selected);
  return namedTheme(selected);
}

export function isThemeName(value: unknown): value is ThemeName {
  return value === 'default' || value === 'light' || value === 'dark' || value === 'academy';
}

export function isThemeSpec(value: unknown): value is ThemeSpec {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const spec = value as Partial<ThemeSpec>;
  return typeof spec.id === 'string' || typeof spec.label === 'string';
}

function namedTheme(theme: unknown): ResolvedThemeTokens {
  const name: Exclude<ThemeName, 'light'> = theme === 'dark' || theme === 'academy' ? theme : 'default';

  if (name === 'dark') {
    return {
      name,
      background: '#111816',
      text: '#F3F0E8',
      muted: '#A9B4AE',
      grid: '#2B3631',
      tooltipBg: '#1D2723',
      tooltipText: '#F7F4ED',
      palette: DARK_PALETTE,
      positive: '#75D6A0',
      negative: '#F29B9B',
      total: '#8FA9FF',
      fontFamily: '"IBM Plex Sans", "Source Sans 3", "Noto Sans SC", sans-serif',
      lineWidth: 2,
      radius: 8,
    };
  }

  if (name === 'academy') {
    return {
      name,
      background: '#F7F3EA',
      text: '#172832',
      muted: '#5C6B72',
      grid: '#DED5C4',
      tooltipBg: '#172832',
      tooltipText: '#F7F3EA',
      palette: ACADEMY_PALETTE,
      positive: '#59A14F',
      negative: '#E15759',
      total: '#4E79A7',
      fontFamily: '"Source Serif 4", "Noto Serif SC", Georgia, serif',
      lineWidth: 2,
      radius: 4,
    };
  }

  return {
    name: 'default',
    background: '#FCFAF5',
    text: '#181713',
    muted: '#6E6A61',
    grid: '#E8E2D7',
    tooltipBg: '#181713',
    tooltipText: '#FCFAF5',
    palette: DEFAULT_PALETTE,
    positive: '#247B4A',
    negative: '#B64A42',
    total: '#3559E0',
    fontFamily: '"IBM Plex Sans", "Source Sans 3", "Noto Sans SC", sans-serif',
    lineWidth: 2,
    radius: 8,
  };
}

function applyThemeSpec(base: ResolvedThemeTokens, spec: ThemeSpec): ResolvedThemeTokens {
  const tokens = spec.tokens ?? {};
  const style = spec.style ?? {};
  const baseBackground = safeColor(tokens.colorBackground, base.background) ?? base.background;
  const palette = safePalette(tokens.category10 ?? tokens.category20, base.palette);

  return {
    ...base,
    background: safeColor(style.backgroundColor, baseBackground) ?? baseBackground,
    text: safeColor(tokens.colorText, base.text) ?? base.text,
    muted:
      safeColor(tokens.colorTextSecondary ?? tokens.colorNeutral, base.muted) ?? base.muted,
    grid: safeColor(tokens.colorStroke, base.grid) ?? base.grid,
    tooltipBg: safeColor(tokens.colorSurface, base.tooltipBg) ?? base.tooltipBg,
    tooltipText: safeColor(tokens.colorTextInverse, base.tooltipText) ?? base.tooltipText,
    palette: safePalette(style.palette, palette),
    positive: safeColor(tokens.colorPositive, base.positive) ?? base.positive,
    negative: safeColor(tokens.colorNegative, base.negative) ?? base.negative,
    total: safeColor(tokens.colorDefault, base.total) ?? base.total,
    fontFamily: safeFont(tokens.fontFamily) ?? base.fontFamily,
    lineWidth: safeNumber(tokens.lineWidth, base.lineWidth),
    radius: safeNumber(tokens.radius, base.radius),
  };
}

const COLOR =
  /^(?:#[0-9a-f]{3,8}|rgba?\([\d.%\s,/+-]+\)|hsla?\([\d.%\s,/+-]+\)|[a-z]{3,24})$/i;

export function safeColor(value: unknown, fallback?: string): string | undefined {
  if (typeof value !== 'string') return fallback;
  const color = value.trim();
  return COLOR.test(color) ? color : fallback;
}

export function safePalette(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;
  const colors = value
    .map((item) => safeColor(item))
    .filter((item): item is string => Boolean(item));
  return colors.length ? colors : fallback;
}

function safeFont(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const font = value.trim();
  if (!font || /[;{}<>\\]/.test(font) || /url\s*\(/i.test(font)) return undefined;
  return font;
}

function safeNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

