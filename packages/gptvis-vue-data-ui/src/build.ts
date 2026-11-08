import { SUPPORTED, chartLabel } from './catalog.js';
import {
  commonTopLevel,
  styledConfig,
  xyConfig,
  type ConfigOptions,
} from './data-ui-config.js';
import { readConfig } from './parser.js';
import {
  resolveTheme,
  safeColor,
  safePalette,
  type ChartType,
  type ResolvedThemeTokens,
  type VisualizationTheme,
} from './theme.js';
import {
  num,
  percentNumber,
  rowsOf,
  setsOf,
  text,
  treeOf,
  unique,
  valuesOf,
  type Row,
} from './utils.js';

export type DataUiComponent =
  | 'donut'
  | 'flow'
  | 'funnel'
  | 'graph'
  | 'horizontal-bar'
  | 'scatter'
  | 'stackbar'
  | 'table'
  | 'treemap'
  | 'word-cloud'
  | 'xy';

export type CustomComponent =
  | 'area'
  | 'boxplot'
  | 'fishbone'
  | 'flow'
  | 'grouped-bar'
  | 'indented-tree'
  | 'liquid'
  | 'mindmap'
  | 'organization'
  | 'radar'
  | 'summary'
  | 'venn'
  | 'violin';

export interface ViewContext {
  theme?: VisualizationTheme;
  streaming?: boolean;
  width?: number;
  height?: number;
}

interface ViewMeta {
  background: string;
  message: string;
  chartType?: ChartType;
}

export type BuiltView =
  | (ViewMeta & {
      kind: 'data-ui';
      component: DataUiComponent;
      dataset: unknown;
      config: Record<string, unknown>;
    })
  | (ViewMeta & {
      kind: 'custom';
      component: CustomComponent;
      props: Record<string, unknown>;
    })
  | (ViewMeta & {
      kind: 'pending';
    })
  | (ViewMeta & {
      kind: 'error';
    });

export function buildView(input: unknown, context: ViewContext = {}): BuiltView {
  const config = readConfig(input, { streaming: context.streaming });
  const baseTheme = resolveTheme(config.theme, context.theme ?? 'default');
  const configStyle = styleOf(config);
  const background =
    safeColor(configStyle.backgroundColor, baseTheme.background) ?? baseTheme.background;
  const theme: ResolvedThemeTokens = { ...baseTheme, background };

  if (!config.type) {
    return pending(
      background,
      context.streaming ? '正在等待 vis 语法…' : '写一行 vis line、vis bar 或其他图表类型。',
    );
  }

  if (!SUPPORTED.has(config.type)) {
    const stillTyping = context.streaming && typeof input === 'string' && !firstLineClosed(input);
    if (stillTyping) return pending(background, '正在识别图表类型…');
    return error(background, `不支持的类型 ${config.type}。可用类型见 CHARTS。`);
  }

  const type = config.type as ChartType;
  const options: ConfigOptions = {
    theme,
    title: text(config.title),
    width: context.width,
    height: context.height,
    showLegend: false,
  };
  let view: BuiltView | null = null;

  switch (type) {
    case 'line':
      view = lineOrArea(config, options, type);
      break;
    case 'area':
      view = area(config, options);
      break;
    case 'column':
      view = column(config, options);
      break;
    case 'bar':
      view = bar(config, options);
      break;
    case 'pie':
      view = pie(config, options);
      break;
    case 'scatter':
      view = scatter(config, options);
      break;
    case 'radar':
      view = radar(config, options, background);
      break;
    case 'funnel':
      view = funnel(config, options);
      break;
    case 'waterfall':
      view = waterfall(config, options);
      break;
    case 'dual-axes':
      view = dualAxes(config, options);
      break;
    case 'histogram':
      view = histogram(config, options);
      break;
    case 'boxplot':
      view = distribution(config, options, 'boxplot');
      break;
    case 'violin':
      view = distribution(config, options, 'violin');
      break;
    case 'venn':
      view = venn(config, options, background);
      break;
    case 'sankey':
      view = sankey(config, options);
      break;
    case 'treemap':
      view = treemap(config, options);
      break;
    case 'word-cloud':
      view = wordCloud(config, options);
      break;
    case 'liquid':
      view = liquid(config, options, background);
      break;
    case 'flow-diagram':
      view = flow(config, options, background);
      break;
    case 'network-graph':
      view = network(config, options, context);
      break;
    case 'mindmap':
      view = treeView(config, options, 'mindmap', background);
      break;
    case 'indented-tree':
      view = treeView(config, options, 'indented-tree', background);
      break;
    case 'organization-chart':
      view = organization(config, options, background);
      break;
    case 'fishbone-diagram':
      view = treeView(config, options, 'fishbone', background);
      break;
    case 'table':
      view = table(config, options);
      break;
    case 'summary':
      view = summary(config, options, background);
      break;
    default:
      break;
  }

  if (view) return view;
  return pending(background, `${chartLabel(type)}还缺可绘制的数据。`, type);
}

function styleOf(config: Record<string, unknown>): Record<string, unknown> {
  return config.style && typeof config.style === 'object'
    ? (config.style as Record<string, unknown>)
    : {};
}

function paletteOf(config: Record<string, unknown>, theme: ResolvedThemeTokens): string[] {
  return safePalette(styleOf(config).palette, theme.palette);
}

function lineWidthOf(config: Record<string, unknown>, theme: ResolvedThemeTokens): number {
  return num(styleOf(config).lineWidth) ?? theme.lineWidth;
}

function pending(background: string, message: string, chartType?: ChartType): BuiltView {
  return { kind: 'pending', background, message, chartType };
}

function error(background: string, message: string, chartType?: ChartType): BuiltView {
  return { kind: 'error', background, message, chartType };
}

function firstLineClosed(input: string): boolean {
  const body = input.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').trimStart();
  const fenced = body.startsWith('```');
  const source = fenced ? body.slice(body.indexOf('\n') + 1) : body;
  return source.includes('\n');
}

function readyDataUi(
  component: DataUiComponent,
  dataset: unknown,
  config: Record<string, unknown>,
  options: ConfigOptions,
  chartType: ChartType,
  background: string,
): BuiltView {
  return {
    kind: 'data-ui',
    component,
    dataset,
    config,
    background,
    message: `${chartLabel(chartType)} · 已渲染`,
    chartType,
  };
}

function readyCustom(
  component: CustomComponent,
  props: Record<string, unknown>,
  options: ConfigOptions,
  chartType: ChartType,
  background: string,
): BuiltView {
  return {
    kind: 'custom',
    component,
    props,
    background,
    message: `${chartLabel(chartType)} · 已渲染`,
    chartType,
  };
}

interface SeriesData {
  name: string;
  values: Array<number | null>;
}

function groupedSeries(
  rows: Row[],
  categoryKey: string,
  valueKey: string,
  allowGroup: boolean,
): { categories: string[]; series: SeriesData[] } {
  const categories = unique(rows.map((row) => text(row[categoryKey])));
  const groups = allowGroup
    ? unique(rows.map((row) => text(row.group)).filter(Boolean))
    : [];
  const buckets = groups.length ? groups : [''];
  const series = buckets.map((group) => ({
    name: group || '数值',
    values: categories.map((category) => {
      const matches = rows.filter(
        (row) =>
          text(row[categoryKey]) === category &&
          (!group || text(row.group ?? '') === group),
      );
      return matches.length ? num(matches[0][valueKey]) : null;
    }),
  }));
  return { categories, series };
}

function lineOrArea(
  config: Record<string, unknown>,
  options: ConfigOptions,
  type: 'line' | 'area',
): BuiltView | null {
  const rows = rowsOf(config.data).filter(
    (row) => row.time != null && num(row.value) != null,
  );
  if (!rows.length) return null;
  const allowGroup = config.group !== false;
  const { categories, series } = groupedSeries(rows, 'time', 'value', allowGroup);
  const palette = configPalette(config, options.theme);
  const dataset = series.map((entry, index) => ({
    name: entry.name,
    type: 'line',
    series: entry.values,
    scaleLabel: text(config.axisYTitle) || '数值',
    color: palette[index % palette.length],
    useArea: type === 'area',
    smooth: false,
  }));
  const viewOptions = { ...options, showLegend: series.length > 1 };
  return readyDataUi(
    'xy',
    dataset,
    xyConfig(
      {
        ...viewOptions,
        categories,
        axisXTitle: text(config.axisXTitle),
        axisYTitle: text(config.axisYTitle),
        stacked: config.stack === true,
        individualScale: false,
        lineWidth: lineWidthOf(config, options.theme),
        area: type === 'area',
      },
      type === 'area'
        ? {
            line: {
              area: {
                useGradient: true,
                opacity: config.stack === true ? 0.55 : 0.2,
              },
            },
          }
        : {},
    ),
    viewOptions,
    type,
    options.theme.background,
  );
}

function area(config: Record<string, unknown>, options: ConfigOptions): BuiltView | null {
  const rows = rowsOf(config.data).filter(
    (row) => row.time != null && num(row.value) != null,
  );
  if (!rows.length) return null;
  return readyCustom(
    'area',
    {
      rows,
      stack: config.stack === true,
      title: text(config.title),
      axisXTitle: text(config.axisXTitle),
      axisYTitle: text(config.axisYTitle),
      palette: configPalette(config, options.theme),
      theme: options.theme,
    },
    options,
    'area',
    options.theme.background,
  );
}

function column(config: Record<string, unknown>, options: ConfigOptions): BuiltView | null {
  const rows = rowsOf(config.data).filter(
    (row) => row.category != null && num(row.value) != null,
  );
  if (!rows.length) return null;
  const { categories, series } = groupedSeries(
    rows,
    'category',
    'value',
    config.group !== false,
  );
  const palette = configPalette(config, options.theme);
  const dataset = series.map((entry, index) => ({
    name: entry.name,
    type: 'bar',
    series: entry.values,
    scaleLabel: text(config.axisYTitle) || '数值',
    color: palette[index % palette.length],
  }));
  const viewOptions = { ...options, showLegend: series.length > 1 };
  return readyDataUi(
    'xy',
    dataset,
    xyConfig({
      ...viewOptions,
      categories,
      axisXTitle: text(config.axisXTitle),
      axisYTitle: text(config.axisYTitle),
      stacked: config.stack === true,
      individualScale: false,
    }),
    viewOptions,
    'column',
    options.theme.background,
  );
}

function bar(config: Record<string, unknown>, options: ConfigOptions): BuiltView | null {
  const rows = rowsOf(config.data).filter(
    (row) => row.category != null && num(row.value) != null,
  );
  if (!rows.length) return null;
  const { series } = groupedSeries(rows, 'category', 'value', config.group !== false);
  const palette = configPalette(config, options.theme);

  if (config.stack === true || series.length > 1) {
    return readyCustom(
      'grouped-bar',
      {
        rows,
        stack: config.stack === true,
        title: text(config.title),
        axisXTitle: text(config.axisXTitle),
        axisYTitle: text(config.axisYTitle),
        palette,
        theme: options.theme,
      },
      options,
      'bar',
      options.theme.background,
    );
  }

  const categories = unique(rows.map((row) => text(row.category)));
  const dataset = categories.map((category, index) => {
    const match = rows.find((row) => text(row.category) === category);
    return {
      name: category,
      value: match ? num(match.value) : null,
      color: palette[index % palette.length],
    };
  });
  const chartConfig = styledConfig(
    {
      ...options,
      title: text(config.title),
    },
    {
      layout: {
        bars: {
          sort: 'none',
          borderRadius: 4,
          dataLabels: {
            value: {
              show: true,
              roundingValue: 1,
            },
          },
          nameLabels: {
            show: true,
            fontSize: 12,
          },
        },
      },
    },
  );
  return readyDataUi(
    'horizontal-bar',
    dataset,
    chartConfig,
    options,
    'bar',
    options.theme.background,
  );
}

function pie(config: Record<string, unknown>, options: ConfigOptions): BuiltView | null {
  const rows = rowsOf(config.data).filter((row) => num(row.value) != null);
  if (!rows.length) return null;
  const palette = configPalette(config, options.theme);
  const inner = num(config.innerRadius) ?? 0;
  const innerRatio = Math.max(0, Math.min(0.85, inner > 1 ? inner / 100 : inner));
  const dataset = rows.map((row, index) => ({
    name: text(row.category || row.name || '未命名'),
    values: [num(row.value) ?? 0],
    color: palette[index % palette.length],
    comment: text(row.comment),
  }));
  const chartConfig = styledConfig(options, {
    padding: { top: 24, right: 78, bottom: 28, left: 78 },
    layout: {
      donut: {
        radiusRatio: 0.43,
        strokeWidth: innerRatio ? Math.round(256 * (1 - innerRatio)) : 512,
        borderWidth: 1,
        borderColorAuto: true,
      },
      labels: {
        dataLabels: {
          show: true,
          oneLine: true,
          hideUnderValue: 0,
          smallArcClusterThreshold: 0,
          usePercentageParens: false,
        },
        value: {
          show: false,
          rounding: 1,
        },
        percentage: {
          show: true,
          rounding: 1,
        },
        name: {
          show: true,
          fontSize: 11,
        },
        hollow: {
          show: false,
          total: { show: false },
          average: { show: false },
        },
      },
    },
  });
  chartConfig.pie = innerRatio === 0;
  chartConfig.customPalette = palette;
  chartConfig.useBlurOnHover = false;
  return readyDataUi(
    'donut',
    dataset,
    chartConfig,
    options,
    'pie',
    options.theme.background,
  );
}

function scatter(config: Record<string, unknown>, options: ConfigOptions): BuiltView | null {
  const rows = rowsOf(config.data).filter(
    (row) => num(row.x) != null && num(row.y) != null,
  );
  if (!rows.length) return null;
  const palette = configPalette(config, options.theme);
  const groups = unique(rows.map((row) => text(row.group)).filter(Boolean));
  const buckets = groups.length ? groups : [''];
  const dataset = buckets.map((group, index) => ({
    name: group || '样本',
    color: palette[index % palette.length],
    values: rows
      .filter((row) => text(row.group ?? '') === group)
      .map((row, pointIndex) => {
        const size = num(row.size);
        return {
          name: text(row.name || row.label || pointIndex + 1),
          x: num(row.x) ?? 0,
          y: num(row.y) ?? 0,
          ...(size == null
            ? {}
            : { weight: Math.min(18, Math.max(2, size)) }),
        };
      }),
  }));
  const viewOptions = { ...options, showLegend: groups.length > 0 };
  const scatterConfig = {
    ...commonTopLevel(viewOptions),
    responsive: false,
    customPalette: palette,
    style: {
      backgroundColor: options.theme.background,
      color: options.theme.text,
      fontFamily: options.theme.fontFamily,
      title: options.title
        ? {
            text: options.title,
            color: options.theme.text,
            fontSize: 15,
            bold: true,
          }
        : {},
      layout: {
        height: options.height ?? 440,
        width: options.width ?? 820,
        axis: {
          show: true,
          stroke: options.theme.grid,
          strokeWidth: 1,
        },
        correlation: {
          show: false,
        },
        plots: {
          radius: 5,
          stroke: options.theme.background,
          strokeWidth: 1.2,
          opacity: 0.86,
          name: { show: false },
        },
        dataLabels: {
          xAxis: {
            name: text(config.axisXTitle),
            show: Boolean(text(config.axisXTitle)),
            scales: {
              show: true,
              steps: 5,
              useNiceScale: true,
              labels: { color: options.theme.muted, fontSize: 10 },
              verticalLines: { show: true, stroke: options.theme.grid },
            },
          },
          yAxis: {
            name: text(config.axisYTitle),
            show: Boolean(text(config.axisYTitle)),
            scales: {
              show: true,
              steps: 5,
              useNiceScale: true,
              labels: { color: options.theme.muted, fontSize: 10 },
              horizontalLines: { show: true, stroke: options.theme.grid },
            },
          },
        },
        marginalBars: { show: false },
      },
      legend: {
        show: groups.length > 1,
        color: options.theme.text,
        position: 'bottom',
      },
      tooltip: {
        show: true,
        backgroundColor: options.theme.tooltipBg,
        color: options.theme.tooltipText,
        borderColor: options.theme.grid,
      },
    },
  };
  return readyDataUi(
    'scatter',
    dataset,
    scatterConfig,
    viewOptions,
    'scatter',
    options.theme.background,
  );
}

function radar(
  config: Record<string, unknown>,
  options: ConfigOptions,
  background: string,
): BuiltView | null {
  const rows = rowsOf(config.data).filter(
    (row) => row.name != null && num(row.value) != null,
  );
  if (!rows.length) return null;
  return readyCustom(
    'radar',
    {
      rows,
      title: text(config.title),
      palette: configPalette(config, options.theme),
      theme: options.theme,
    },
    options,
    'radar',
    background,
  );
}

function funnel(config: Record<string, unknown>, options: ConfigOptions): BuiltView | null {
  const rows = rowsOf(config.data)
    .filter((row) => num(row.value) != null)
    .map((row) => ({
      name: text(row.category || row.name || '未命名'),
      value: num(row.value) ?? 0,
    }))
    .sort((a, b) => b.value - a.value);
  if (!rows.length) return null;
  const palette = configPalette(config, options.theme);
  const dataset = rows.map((row, index) => ({
    ...row,
    color: palette[index % palette.length],
  }));
  return readyDataUi(
    'funnel',
    dataset,
    styledConfig(options),
    options,
    'funnel',
    options.theme.background,
  );
}

function waterfall(config: Record<string, unknown>, options: ConfigOptions): BuiltView | null {
  const rows = rowsOf(config.data).filter(
    (row) => row.category != null || row.name != null,
  );
  if (!rows.length) return null;
  let cursor = num(config.startValue) ?? 0;
  const steps = rows.map((row) => {
    const name = text(row.category || row.name);
    const isTotal = row.isTotal === true || row.isIntermediateTotal === true;
    const value = isTotal ? num(row.value) ?? cursor : num(row.value) ?? 0;
    if (isTotal) cursor = value;
    else cursor += value;
    return {
      name,
      type: isTotal ? 'total' : 'change',
      series: [{ name, value }],
    };
  });
  const dataset = [
    {
      name: text(config.title) || '瀑布图',
      type: 'waterfall',
      series: steps,
    },
  ];
  const styled = styledConfig(options, {
    waterfall: {
      colors: {
        positive: options.theme.positive,
        negative: options.theme.negative,
        total: options.theme.total,
      },
      segmentLabels: {
        show: false,
      },
      stepLabels: {
        show: true,
        rounding: 0,
      },
    },
  });
  return readyDataUi(
    'stackbar',
    dataset,
    styled,
    options,
    'waterfall',
    options.theme.background,
  );
}

function dualAxes(config: Record<string, unknown>, options: ConfigOptions): BuiltView | null {
  const categories = Array.isArray(config.categories)
    ? config.categories.map((item) => text(item))
    : [];
  const seriesConfig = rowsOf(config.series).filter((item) => Array.isArray(item.data));
  if (!categories.length || !seriesConfig.length) return null;
  const palette = configPalette(config, options.theme);
  const dataset = seriesConfig.map((item, index) => ({
    name: text(item.name) || text(item.axisYTitle) || `系列 ${index + 1}`,
    type: item.type === 'line' ? 'line' : 'bar',
    series: (item.data as unknown[]).map((value) => num(value)),
    color: palette[index % palette.length],
    scaleLabel: text(item.axisYTitle) || (index === 0 ? '左轴' : '右轴'),
  }));
  const viewOptions = { ...options, showLegend: true };
  return readyDataUi(
    'xy',
    dataset,
    xyConfig({
      ...viewOptions,
      categories,
      axisXTitle: text(config.axisXTitle),
      axisYTitle: text(seriesConfig[0]?.axisYTitle || config.axisYTitle),
      individualScale: true,
    }),
    viewOptions,
    'dual-axes',
    options.theme.background,
  );
}

function histogram(config: Record<string, unknown>, options: ConfigOptions): BuiltView | null {
  const values = valuesOf(config.data);
  if (!values.length) return null;
  const bins = Math.max(1, Math.round(num(config.binNumber) ?? 8));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const step = (max - min || 1) / bins;
  const counts = Array.from({ length: bins }, () => 0);
  for (const value of values) {
    const index = Math.min(bins - 1, Math.max(0, Math.floor((value - min) / step)));
    counts[index] += 1;
  }
  const digits = max - min > 20 ? 0 : max - min > 2 ? 1 : 2;
  const rounded = (value: number) => {
    const factor = 10 ** digits;
    return Math.round(value * factor) / factor;
  };
  const categories = counts.map((_, index) => {
    const start = min + index * step;
    return `${rounded(start)}–${rounded(start + step)}`;
  });
  const palette = configPalette(config, options.theme);
  const dataset = [
    {
      name: '频数',
      type: 'bar',
      series: counts,
      color: palette[0],
    },
  ];
  return readyDataUi(
    'xy',
    dataset,
    xyConfig({
      ...options,
      categories,
      axisXTitle: text(config.axisXTitle) || '区间',
      axisYTitle: text(config.axisYTitle) || '频数',
    }),
    options,
    'histogram',
    options.theme.background,
  );
}

function distribution(
  config: Record<string, unknown>,
  options: ConfigOptions,
  type: 'boxplot' | 'violin',
): BuiltView | null {
  const rows = rowsOf(config.data).filter((row) => num(row.value) != null);
  if (!rows.length) return null;
  return readyCustom(
    type,
    {
      rows,
      title: text(config.title),
      axisXTitle: text(config.axisXTitle),
      axisYTitle: text(config.axisYTitle),
      startAtZero: styleOf(config).startAtZero === true,
      palette: configPalette(config, options.theme),
      theme: options.theme,
    },
    options,
    type,
    options.theme.background,
  );
}

function venn(
  config: Record<string, unknown>,
  options: ConfigOptions,
  background: string,
): BuiltView | null {
  const rows = rowsOf(config.data)
    .map((row) => ({
      sets: setsOf(row.sets ?? row.name),
      value: num(row.value) ?? 0,
      label: text(row.label),
    }))
    .filter((row) => row.sets.length);
  if (!rows.length) return null;
  const names = unique(rows.flatMap((row) => row.sets));
  if (names.length < 2) return error(background, '韦恩图至少需要两个集合。', 'venn');
  if (names.length > 3) {
    return error(
      background,
      `韦恩图只支持两个集合或三个集合，这份数据有 ${names.length} 个集合。`,
      'venn',
    );
  }
  return readyCustom(
    'venn',
    {
      rows,
      title: text(config.title),
      palette: configPalette(config, options.theme),
      theme: options.theme,
    },
    options,
    'venn',
    background,
  );
}

function sankey(config: Record<string, unknown>, options: ConfigOptions): BuiltView | null {
  const rows = rowsOf(config.data).filter(
    (row) => row.source != null && row.target != null && num(row.value) != null,
  );
  if (!rows.length) return null;
  const dataset = rows.map((row) => [
    text(row.source),
    text(row.target),
    num(row.value) ?? 0,
  ]);
  return readyDataUi(
    'flow',
    dataset,
    styledConfig(options, {
      padding: { left: 72, right: 72, top: 18, bottom: 18 },
      nodes: {
        width: 12,
        borderRadius: 3,
        labels: {
          show: true,
          showValue: false,
          fontSize: 12,
        },
      },
      links: {
        opacity: 0.5,
        smooth: true,
      },
    }),
    options,
    'sankey',
    options.theme.background,
  );
}

function treemap(config: Record<string, unknown>, options: ConfigOptions): BuiltView | null {
  const dataset = treemapNodes(config.data);
  if (!dataset.length) return null;
  return readyDataUi(
    'treemap',
    dataset,
    styledConfig(options),
    options,
    'treemap',
    options.theme.background,
  );
}

function treemapNodes(data: unknown): Array<Record<string, unknown>> {
  return rowsOf(data).map((row) => {
    const children = row.children ? treemapNodes(row.children) : [];
    const ownValue = num(row.value);
    const value =
      ownValue ??
      children.reduce((sum, child) => sum + Number(child.value ?? 0), 0);
    return {
      name: text(row.name || row.category || '未命名'),
      value,
      ...(children.length ? { children } : {}),
      ...(safeColor(row.color) ? { color: safeColor(row.color) } : {}),
    };
  });
}

function wordCloud(config: Record<string, unknown>, options: ConfigOptions): BuiltView | null {
  const palette = configPalette(config, options.theme);
  const dataset = rowsOf(config.data)
    .map((row, index) => ({
      name: text(row.text || row.name || row.word),
      value: num(row.value) ?? 0,
      color: safeColor(row.color) ?? palette[index % palette.length],
    }))
    .filter((row) => row.name);
  if (!dataset.length) return null;
  return readyDataUi(
    'word-cloud',
    dataset.sort((a, b) => b.value - a.value),
    styledConfig(options, {
      controls: { show: false },
      zoom: { show: false },
    }),
    options,
    'word-cloud',
    options.theme.background,
  );
}

function liquid(
  config: Record<string, unknown>,
  options: ConfigOptions,
  background: string,
): BuiltView | null {
  const percent = percentNumber(config.percent);
  if (percent == null) return null;
  const shape =
    config.shape === 'rect' || config.shape === 'triangle' || config.shape === 'pin'
      ? config.shape
      : 'circle';
  return readyCustom(
    'liquid',
    {
      percent,
      shape,
      title: text(config.title),
      palette: configPalette(config, options.theme),
      theme: options.theme,
    },
    options,
    'liquid',
    background,
  );
}

interface GraphData {
  nodes: Array<Record<string, unknown>>;
  links: Array<Record<string, unknown>>;
}

function graphData(data: unknown): GraphData {
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const record = data as Row;
    if (Array.isArray(record.nodes) || Array.isArray(record.edges)) {
      const nodes = rowsOf(record.nodes).map((node, index) => {
        const name = text(node.name || node.id || `节点 ${index + 1}`);
        return {
          ...node,
          name,
          id: name,
        };
      });
      const links = rowsOf(record.edges).map((edge) => ({
        ...edge,
        source: text(edge.source),
        target: text(edge.target),
      }));
      return { nodes, links };
    }
  }

  const rows = rowsOf(data);
  if (rows.some((row) => row.source != null && row.target != null)) {
    const names = unique(rows.flatMap((row) => [text(row.source), text(row.target)]));
    return {
      nodes: names.map((name) => ({ name, id: name })),
      links: rows.map((row) => ({
        source: text(row.source),
        target: text(row.target),
        name: text(row.name),
        value: num(row.value),
      })),
    };
  }
  return { nodes: [], links: [] };
}

function network(
  config: Record<string, unknown>,
  options: ConfigOptions,
  context: ViewContext,
): BuiltView | null {
  const graph = graphData(config.data);
  if (!graph.nodes.length) return null;
  const layout = text(config.layout) || 'force';
  const positions =
    layout === 'force'
      ? null
      : graphPositions(
          graph.nodes.map((node) => text(node.name)),
          graph.links,
          layout,
          context.width ?? 900,
          context.height ?? 520,
        );
  const palette = configPalette(config, options.theme);
  const dataset = {
    nodes: graph.nodes.map((node, index) => ({
      id: text(node.id || node.name),
      label: text(node.name),
      group: text(node.group || node.category || '默认'),
      value: num(node.value) ?? 1,
      color: safeColor(node.color) ?? palette[index % palette.length],
      ...(positions
        ? {
            x: positions[index]?.x ?? 0,
            y: positions[index]?.y ?? 0,
            fixed: true,
          }
        : {}),
    })),
    links: graph.links.map((edge) => ({
      source: text(edge.source),
      target: text(edge.target),
      label: text(edge.name),
      value: num(edge.value) ?? 1,
      directed: true,
    })),
  };
  const styled = styledConfig(options, {
    nodes: {
      sizeByValue: true,
      minRadius: 12,
      maxRadius: 28,
      colorByGroup: true,
      stroke: options.theme.background,
      strokeWidth: 2,
      labels: {
        show: true,
        color: options.theme.text,
        fontSize: 11,
        position: 'bottom',
        offsetY: 8,
      },
    },
    links: {
      color: options.theme.muted,
      opacity: 0.36,
      width: 1.1,
      arrows: { show: true },
    },
  });
  (styled as Record<string, unknown>).layout = {
    iterations: layout === 'force' ? 280 : 0,
    chargeStrength: -180,
    linkDistance: 92,
  };
  (styled as Record<string, unknown>).viewport = {
    initialFit: true,
    fitOnResize: true,
    fitOnUpdate: true,
  };
  (styled as Record<string, unknown>).interaction = {
    zoom: { enabled: true },
    pan: { enabled: true },
    drag: { enabled: layout === 'force' },
    highlight: { enabled: true, neighbors: true },
  };
  return readyDataUi(
    'graph',
    dataset,
    styled,
    options,
    'network-graph',
    options.theme.background,
  );
}

function graphPositions(
  names: string[],
  links: Array<Record<string, unknown>>,
  layout: string,
  width: number,
  height: number,
): Array<{ x: number; y: number }> {
  const degree = new Map(names.map((name) => [name, 0]));
  for (const link of links) {
    for (const key of [text(link.source), text(link.target)]) {
      if (degree.has(key)) degree.set(key, (degree.get(key) ?? 0) + 1);
    }
  }

  if (layout === 'grid') {
    const columns = Math.ceil(Math.sqrt(names.length));
    const rows = Math.ceil(names.length / columns);
    return names.map((_, index) => ({
      x: ((index % columns) + 1) * (width / (columns + 1)),
      y: (Math.floor(index / columns) + 1) * (height / (rows + 1)),
    }));
  }

  if (layout === 'dagre') {
    return layeredPositions(names, links, width, height);
  }

  if (layout === 'circular' || layout === 'radial' || layout === 'concentric') {
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.36;
    let ordered = [...names];
    if (layout === 'concentric') {
      ordered.sort((a, b) => (degree.get(b) ?? 0) - (degree.get(a) ?? 0));
    }
    if (layout === 'radial') {
      const center = ordered[0];
      const others = ordered.filter((name) => name !== center);
      return names.map((name) => {
        if (name === center) return { x: centerX, y: centerY };
        const index = others.indexOf(name);
        const angle = (index / Math.max(1, others.length)) * Math.PI * 2 - Math.PI / 2;
        return {
          x: centerX + Math.cos(angle) * radius,
          y: centerY + Math.sin(angle) * radius,
        };
      });
    }
    return names.map((name) => {
      const index = ordered.indexOf(name);
      const angle = (index / Math.max(1, ordered.length)) * Math.PI * 2 - Math.PI / 2;
      const ring = layout === 'concentric'
        ? 0.55 + (1 - (degree.get(name) ?? 0) / Math.max(1, Math.max(...degree.values()))) * 0.45
        : 1;
      return {
        x: centerX + Math.cos(angle) * radius * ring,
        y: centerY + Math.sin(angle) * radius * ring,
      };
    });
  }

  return names.map((_, index) => ({
    x: (index + 1) * (width / (names.length + 1)),
    y: height / 2,
  }));
}

function layeredPositions(
  names: string[],
  links: Array<Record<string, unknown>>,
  width: number,
  height: number,
): Array<{ x: number; y: number }> {
  const layers = new Map(names.map((name) => [name, 0]));
  for (let pass = 0; pass < names.length; pass += 1) {
    let changed = false;
    for (const link of links) {
      const source = layers.get(text(link.source));
      const target = layers.get(text(link.target));
      if (source == null || target == null) continue;
      if (target <= source) {
        layers.set(text(link.target), source + 1);
        changed = true;
      }
    }
    if (!changed) break;
  }
  const maxLayer = Math.max(0, ...layers.values());
  const columns = new Map<number, string[]>();
  for (const name of names) {
    const layer = layers.get(name) ?? 0;
    columns.set(layer, [...(columns.get(layer) ?? []), name]);
  }
  const positions = new Map<string, { x: number; y: number }>();
  for (const [layer, column] of columns) {
    column.forEach((name, index) => {
      positions.set(name, {
        x: maxLayer ? 80 + (layer / maxLayer) * (width - 160) : width / 2,
        y: ((index + 1) / (column.length + 1)) * height,
      });
    });
  }
  return names.map((name) => positions.get(name) ?? { x: width / 2, y: height / 2 });
}

function flow(
  config: Record<string, unknown>,
  options: ConfigOptions,
  background: string,
): BuiltView | null {
  const graph = graphData(config.data);
  if (!graph.nodes.length) return null;
  const aliases = new Map<string, string>();
  const nodes = graph.nodes.map((node, index) => {
    const id = text(node.id || node.name || `n${index}`);
    aliases.set(id, id);
    aliases.set(text(node.name), id);
    return { id, label: text(node.name || node.label || id) };
  });
  const edges = graph.links
    .map((edge) => ({
      from: aliases.get(text(edge.from ?? edge.source)) ?? '',
      to: aliases.get(text(edge.to ?? edge.target)) ?? '',
      label: text(edge.label ?? edge.name),
    }))
    .filter((edge) => edge.from && edge.to);
  return readyCustom(
    'flow',
    {
      nodes,
      edges,
      mode: 'flow',
      title: options.title,
      palette: configPalette(config, options.theme),
      theme: options.theme,
    },
    options,
    'flow-diagram',
    background,
  );
}

function organization(
  config: Record<string, unknown>,
  options: ConfigOptions,
  background: string,
): BuiltView | null {
  const root = treeOf(config.data);
  if (!root) return null;
  const nodes: Array<{ id: string; label: string; description: string }> = [];
  const edges: Array<{ from: string; to: string }> = [];
  let sequence = 0;
  const visit = (node: Row, parent?: string): void => {
    const id = `n${sequence++}`;
    nodes.push({
      id,
      label: text(node.name || node.category || '未命名'),
      description: text(node.description),
    });
    if (parent) edges.push({ from: parent, to: id });
    for (const child of rowsOf(node.children)) visit(child, id);
  };
  visit(root);
  return readyCustom(
    'organization',
    {
      nodes,
      edges,
      mode: 'organization',
      title: options.title,
      palette: configPalette(config, options.theme),
      theme: options.theme,
    },
    options,
    'organization-chart',
    background,
  );
}

function treeView(
  config: Record<string, unknown>,
  options: ConfigOptions,
  component: 'fishbone' | 'indented-tree' | 'mindmap',
  background: string,
): BuiltView | null {
  const root = treeOf(config.data);
  if (!root) return null;
  const children = rowsOf(root.children);
  if (!children.length && (component === 'fishbone' || component === 'mindmap')) {
    return null;
  }
  return readyCustom(
    component,
    {
      root,
      direction: text(config.direction) || 'both',
      title: text(config.title),
      palette: configPalette(config, options.theme),
      theme: options.theme,
    },
    options,
    config.type as ChartType,
    background,
  );
}

function table(config: Record<string, unknown>, options: ConfigOptions): BuiltView | null {
  const rows = rowsOf(config.data);
  if (!rows.length) return null;
  const columns: string[] = [];
  for (const row of rows) {
    for (const key of Object.keys(row)) if (!columns.includes(key)) columns.push(key);
  }
  const header = columns.map((name) => {
    const numeric = rows.every((row) => row[name] == null || num(row[name]) != null);
    return {
      name,
      type: numeric ? 'numeric' : 'text',
      isSort: true,
      ...(numeric ? { sum: true, average: true, decimals: 2 } : {}),
    };
  });
  const dataset = {
    header,
    body: rows.map((row) => ({
      td: columns.map((column) => {
        const value = row[column];
        return value == null ? '' : typeof value === 'number' ? value : text(value);
      }),
    })),
  };
  const tableConfig = {
    responsive: true,
    userOptions: { show: false },
    fontFamily: options.theme.fontFamily,
    maxHeight: options.height ?? 440,
    rowsPerPage: 10,
    useChart: false,
    style: {
      title: {
        text: options.title,
        color: options.theme.text,
        fontSize: 15,
        bold: true,
        backgroundColor: options.theme.background,
      },
      th: {
        backgroundColor: options.theme.background,
        color: options.theme.muted,
        outline: options.theme.background,
        buttons: {
          filter: {
            inactive: {
              backgroundColor: options.theme.background,
              color: options.theme.muted,
            },
            active: {
              backgroundColor: options.theme.palette[0],
              color: options.theme.background,
            },
          },
          cancel: {
            inactive: {
              backgroundColor: options.theme.background,
              color: options.theme.muted,
            },
            active: {
              backgroundColor: options.theme.palette[0],
              color: options.theme.background,
            },
          },
        },
      },
      rows: {
        even: {
          backgroundColor: options.theme.name === 'dark' ? '#151E1A' : '#FFFFFF',
          color: options.theme.text,
        },
        odd: {
          backgroundColor: options.theme.background,
          color: options.theme.text,
        },
      },
      inputs: {
        backgroundColor: options.theme.background,
        color: options.theme.text,
        border: options.theme.grid,
        accentColor: options.theme.palette[0],
      },
      infoBar: {
        backgroundColor: options.theme.background,
        color: options.theme.muted,
      },
      pagination: {
        buttons: {
          backgroundColor: options.theme.background,
          color: options.theme.text,
          opacityDisabled: '0.35',
        },
        navigationIndicator: {
          backgroundColor: options.theme.palette[0],
        },
      },
      exportMenu: {
        show: false,
      },
    },
  };
  return readyDataUi(
    'table',
    dataset,
    tableConfig as Record<string, unknown>,
    options,
    'table',
    options.theme.background,
  );
}

function summary(
  config: Record<string, unknown>,
  options: ConfigOptions,
  background: string,
): BuiltView | null {
  const content = text(config.content || config.text || '');
  if (!content.trim() && !options.title) return null;
  return readyCustom(
    'summary',
    {
      content,
      title: options.title,
      theme: options.theme,
      palette: configPalette(config, options.theme),
    },
    options,
    'summary',
    background,
  );
}

function configPalette(
  config: Record<string, unknown>,
  theme: ResolvedThemeTokens,
): string[] {
  return paletteOf(config, theme);
}

function trimNumber(value: number): string {
  return String(Math.round(value * 100) / 100);
}
