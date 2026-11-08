import { describe, expect, it } from 'vitest';
import { buildView } from '../src/build.js';
import { resolveTheme, safeColor, type ThemeSpec } from '../src/theme.js';

describe('theme resolution', () => {
  it('resolves built-in names', () => {
    expect(resolveTheme('default')).toMatchObject({
      name: 'default',
      background: '#FCFAF5',
    });
    expect(resolveTheme('light').name).toBe('default');
    expect(resolveTheme('dark')).toMatchObject({
      name: 'dark',
      background: '#111816',
    });
    expect(resolveTheme('academy').palette[0]).toBe('#4E79A7');
  });

  it('maps ThemeSpec tokens and style overrides', () => {
    const spec: ThemeSpec = {
      id: 'brand',
      label: 'Brand',
      baseTheme: 'dark',
      tokens: {
        colorBackground: '#010203',
        colorText: '#111111',
        colorTextSecondary: '#222222',
        colorStroke: '#333333',
        category10: ['#aa0000', '#00aa00'],
        colorPositive: '#00ff00',
        colorNegative: '#ff0000',
        colorSurface: '#444444',
        colorTextInverse: '#eeeeee',
        colorDefault: '#123456',
      },
      style: {
        backgroundColor: '#050607',
        palette: ['#abcdef'],
      },
    };
    expect(resolveTheme(spec)).toMatchObject({
      name: 'dark',
      background: '#050607',
      text: '#111111',
      muted: '#222222',
      grid: '#333333',
      tooltipBg: '#444444',
      palette: ['#abcdef'],
    });
  });

  it('rejects unsafe colors and fonts', () => {
    const spec = {
      id: 'unsafe',
      label: 'Unsafe',
      tokens: {
        colorText: 'url(javascript:alert(1))',
        colorBackground: 'expression(alert(1))',
        colorStroke: 'red;background:url(x)',
        fontFamily: 'x; behavior:url(#x)',
      },
    };
    const theme = resolveTheme(spec);
    expect(theme.text).toBe('#181713');
    expect(theme.grid).toBe('#E8E2D7');
    expect(theme.fontFamily).not.toContain('url');
    expect(safeColor('rgba(1, 2, 3, 0.5)')).toBe('rgba(1, 2, 3, 0.5)');
  });

  it('uses a ThemeSpec through buildView', () => {
    const spec: ThemeSpec = {
      id: 'paper',
      label: 'Paper',
      baseTheme: 'academy',
      style: { backgroundColor: '#fffdf7' },
    };
    const view = buildView('vis pie\ndata\n  - category A\n    value 2', { theme: spec });
    expect(view.background).toBe('#fffdf7');
  });
});
