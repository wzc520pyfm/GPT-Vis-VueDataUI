import type { Row } from '../utils.js';
import { num, text } from '../utils.js';

export interface Scale {
  min: number;
  max: number;
  ticks: number[];
}

export function niceScale(values: number[], startAtZero = false, tickCount = 5): Scale {
  if (!values.length) return { min: 0, max: 1, ticks: [0, 1] };
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const min = startAtZero ? Math.min(0, rawMin) : rawMin;
  const max = Math.max(rawMax, min + 1);
  const span = Math.max(max - min, 1);
  const padding = span * (startAtZero ? 0.04 : 0.08);
  const low = startAtZero ? 0 : min - padding;
  const high = max + padding;
  const roughStep = (high - low) / Math.max(2, tickCount - 1);
  const power = 10 ** Math.floor(Math.log10(roughStep || 1));
  const normalized = roughStep / power;
  const multiple = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  const step = multiple * power;
  const niceMin = Math.floor(low / step) * step;
  const niceMax = Math.ceil(high / step) * step;
  const ticks: number[] = [];
  for (let value = niceMin; value <= niceMax + step / 2; value += step) {
    ticks.push(Number(value.toPrecision(12)));
  }
  return { min: niceMin, max: niceMax, ticks };
}

export function estimateTextWidth(value: string, fontSize = 12): number {
  let width = 0;
  for (const character of value) {
    width += /[\u3000-\u9fff]/u.test(character) ? fontSize : fontSize * 0.58;
  }
  return width;
}

export function truncate(value: string, length = 18): string {
  return value.length > length ? `${value.slice(0, length - 1)}…` : value;
}

export function formatTick(value: number): string {
  const absolute = Math.abs(value);
  if (absolute >= 10_000) return `${Math.round(value / 100) / 10}k`;
  if (absolute >= 1000) return value.toLocaleString('zh-CN', { maximumFractionDigits: 0 });
  if (absolute > 0 && absolute < 1) return String(Math.round(value * 100) / 100);
  return String(Math.round(value * 10) / 10);
}

export function rowCategories(rows: Row[]): string[] {
  return [
    ...new Set(
      rows.map((row) => text(row.category || row.name || '全部')).filter(Boolean),
    ),
  ];
}

export function rowGroups(rows: Row[]): string[] {
  return [...new Set(rows.map((row) => text(row.group)).filter(Boolean))];
}

export function groupValues(rows: Row[], category: string, group = ''): number[] {
  return rows
    .filter(
      (row) =>
        text(row.category || row.name || '全部') === category &&
        text(row.group ?? '') === group,
    )
    .map((row) => num(row.value))
    .filter((value): value is number => value != null);
}


