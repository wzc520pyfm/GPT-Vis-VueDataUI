import type { ResolvedThemeTokens } from './theme.js';

export interface ConfigOptions {
  theme: ResolvedThemeTokens;
  title: string;
  width?: number;
  height?: number;
  showLegend?: boolean;
}

export interface XyConfigOptions extends ConfigOptions {
  categories: string[];
  axisXTitle?: string;
  axisYTitle?: string;
  stacked?: boolean;
  individualScale?: boolean;
  lineWidth?: number;
  area?: boolean;
}

export function commonTopLevel(options: ConfigOptions): Record<string, unknown> {
  return {
    responsive: true,
    theme: options.theme.name === 'dark' ? 'dark' : undefined,
    customPalette: options.theme.palette,
    userOptions: { show: false },
    table: { show: false },
  };
}

export function chartStyle(
  options: ConfigOptions,
  extra: Record<string, unknown> = {},
): Record<string, unknown> {
  const { theme, title, width, height, showLegend = false } = options;
  return {
    width: width ?? 820,
    height: height ?? 440,
    backgroundColor: theme.background,
    color: theme.text,
    fontFamily: theme.fontFamily,
    ...(title
      ? {
          title: {
            text: title,
            color: theme.text,
            fontSize: 15,
            bold: true,
          },
        }
      : {}),
    legend: {
      show: showLegend,
      color: theme.text,
      backgroundColor: 'transparent',
      position: 'bottom',
    },
    tooltip: {
      show: true,
      backgroundColor: theme.tooltipBg,
      color: theme.tooltipText,
      borderColor: theme.grid,
    },
    userOptions: { show: false },
    ...extra,
  };
}

export function styledConfig(
  options: ConfigOptions,
  extraChart: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    ...commonTopLevel(options),
    style: {
      chart: chartStyle(options, extraChart),
    },
  };
}

export function xyConfig(
  options: XyConfigOptions,
  extraChart: Record<string, unknown> = {},
): Record<string, unknown> {
  const { theme, title, categories, axisXTitle, axisYTitle } = options;
  return {
    ...commonTopLevel(options),
    showTable: false,
    chart: {
      width: options.width ?? 820,
      height: options.height ?? 440,
      backgroundColor: theme.background,
      color: theme.text,
      fontFamily: theme.fontFamily,
      ...(title
        ? {
            title: {
              text: title,
              color: theme.text,
              fontSize: 15,
              bold: true,
            },
          }
        : {}),
      legend: {
        show: Boolean(options.showLegend),
        color: theme.text,
        backgroundColor: 'transparent',
        position: 'bottom',
      },
      tooltip: {
        show: true,
        backgroundColor: theme.tooltipBg,
        color: theme.tooltipText,
        borderColor: theme.grid,
      },
      userOptions: { show: false },
      grid: {
        stroke: theme.grid,
        showHorizontalLines: true,
        showVerticalLines: false,
        labels: {
          color: theme.muted,
          axis: {
            xLabel: axisXTitle || '',
            yLabel: options.individualScale ? '' : axisYTitle || '',
            fontSize: 11,
          },
          xAxisLabels: {
            values: categories,
            color: theme.muted,
            fontSize: 11,
            autoRotate: {
              enable: false,
              angle: 0,
            },
          },
          yAxis: {
            color: theme.muted,
            labelWidth: 58,
            rounding: 1,
            stacked: Boolean(options.stacked),
            useIndividualScale: Boolean(options.individualScale),
          },
        },
      },
      line: {
        strokeWidth: options.lineWidth ?? theme.lineWidth,
        useGradient: true,
        area: {
          useGradient: Boolean(options.area),
          opacity: options.area ? 0.2 : 0,
        },
      },
      bar: {
        borderRadius: 4,
      },
      zoom: {
        show: false,
      },
      ...extraChart,
    },
    line: {
      strokeWidth: options.lineWidth ?? theme.lineWidth,
      area: {
        useGradient: Boolean(options.area),
        opacity: options.area ? 0.2 : 0,
      },
    },
  };
}

