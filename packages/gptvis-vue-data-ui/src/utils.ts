import type { ResolvedThemeTokens } from './theme.js';

export interface Row {
  [key: string]: unknown;
}

export function num(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

export function text(value: unknown): string {
  if (value == null) return '';
  return String(value);
}

export function rowsOf(data: unknown): Row[] {
  if (!Array.isArray(data)) return [];
  return data.filter(
    (item): item is Row => Boolean(item) && typeof item === 'object' && !Array.isArray(item),
  );
}

export function treeOf(data: unknown): Row | null {
  if (Array.isArray(data)) {
    const nodes = rowsOf(data);
    if (nodes.length === 1) return nodes[0];
    if (nodes.length > 1) return { name: '全部', children: nodes };
    return null;
  }
  if (data && typeof data === 'object') {
    const node = data as Row;
    if (node.name != null || node.children != null) return node;
  }
  return null;
}

export function unique(values: string[]): string[] {
  return [...new Set(values)];
}

export function formatNumber(value: number, locale = 'zh-CN'): string {
  if (!Number.isFinite(value)) return '—';
  const rounded = Math.round(value * 100) / 100;
  return Math.abs(rounded) >= 1000 ? rounded.toLocaleString(locale) : String(rounded);
}

export function formatPercent(value: number): string {
  const ratio = value > 1 && value <= 100 ? value / 100 : value;
  const clamped = Math.max(0, Math.min(1, ratio));
  return `${Math.round(clamped * 1000) / 10}%`.replace(/\.0%$/, '%');
}

export function percentNumber(value: unknown): number | null {
  const parsed = num(value);
  if (parsed == null) return null;
  const ratio = parsed > 1 && parsed <= 100 ? parsed / 100 : parsed;
  return Math.max(0, Math.min(1, ratio));
}

export function setsOf(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => text(item).trim()).filter(Boolean);
  return text(value)
    .replace(/^\[|\]$/g, '')
    .split(/[,，、\s]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function valuesOf(data: unknown): number[] {
  if (typeof data === 'string') {
    return data
      .split(/[\s,，]+/)
      .map((value) => num(value))
      .filter((value): value is number => value != null);
  }
  if (!Array.isArray(data)) return [];
  return data
    .map((item) => (item && typeof item === 'object' ? num((item as Row).value) : num(item)))
    .filter((value): value is number => value != null);
}

export function quartiles(values: number[]): [number, number, number, number, number] {
  const sorted = [...values].sort((a, b) => a - b);
  if (!sorted.length) return [0, 0, 0, 0, 0];
  const at = (probability: number): number => {
    const position = (sorted.length - 1) * probability;
    const low = Math.floor(position);
    const high = Math.ceil(position);
    if (low === high) return sorted[low];
    return sorted[low] * (high - position) + sorted[high] * (position - low);
  };
  return [sorted[0], at(0.25), at(0.5), at(0.75), sorted[sorted.length - 1]];
}

export function themeVars(theme: ResolvedThemeTokens): Record<string, string> {
  return {
    '--gv-background': theme.background,
    '--gv-text': theme.text,
    '--gv-muted': theme.muted,
    '--gv-grid': theme.grid,
    '--gv-tooltip-bg': theme.tooltipBg,
    '--gv-tooltip-text': theme.tooltipText,
    '--gv-positive': theme.positive,
    '--gv-negative': theme.negative,
    '--gv-total': theme.total,
    '--gv-accent': theme.palette[0] ?? theme.total,
    '--gv-font': theme.fontFamily,
    '--gv-radius': `${theme.radius}px`,
  };
}

export function escapeSelector(value: string): string {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') return CSS.escape(value);
  return value.replace(/[^\w-]/g, '\\$&');
}
