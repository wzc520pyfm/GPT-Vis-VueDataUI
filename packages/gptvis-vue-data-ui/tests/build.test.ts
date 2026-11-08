import { describe, expect, it } from 'vitest';
import { buildView } from '../src/build.js';
import { CHARTS } from '../src/catalog.js';

const LINEAR = `vis line
data
  - time 1月
    value 10
    group 华东
  - time 2月
    value 12
    group 华东
  - time 1月
    value 8
    group 华南
  - time 2月
    value 9
    group 华南
`;

describe('VueDataUI build mapping', () => {
  it('builds a grouped line as VueUiXy data', () => {
    const view = buildView(LINEAR);
    expect(view.kind).toBe('data-ui');
    if (view.kind !== 'data-ui') return;
    expect(view.component).toBe('xy');
    expect(view.dataset).toEqual([
      expect.objectContaining({ name: '华东', type: 'line', series: [10, 12] }),
      expect.objectContaining({ name: '华南', type: 'line', series: [8, 9] }),
    ]);
    expect(view.config.showTable).toBe(false);
  });

  it('uses horizontal bars and a custom grouped bar renderer', () => {
    const simple = buildView('vis bar\ndata\n  - category 甲\n    value 4\n  - category 乙\n    value 7');
    expect(simple).toMatchObject({ kind: 'data-ui', component: 'horizontal-bar' });

    const grouped = buildView(`vis bar
stack true
data
  - category 甲
    value 4
    group 2025
  - category 甲
    value 6
    group 2026
`);
    expect(grouped).toMatchObject({ kind: 'custom', component: 'grouped-bar' });
  });

  it('builds grouped columns and dual axes', () => {
    const column = buildView(`vis column
data
  - category 甲
    value 1
    group A
  - category 乙
    value 2
    group B
`);
    expect(column).toMatchObject({ kind: 'data-ui', component: 'xy' });
    if (column.kind === 'data-ui') {
      expect((column.dataset as unknown[]).length).toBe(2);
    }

    const axes = buildView({
      type: 'dual-axes',
      categories: ['Q1', 'Q2'],
      series: [
        { type: 'line', axisYTitle: '收入', data: [10, 14] },
        { type: 'column', axisYTitle: '人数', data: [4, 7] },
      ],
    });
    expect(axes).toMatchObject({ kind: 'data-ui', component: 'xy' });
    if (axes.kind === 'data-ui') {
      expect(axes.dataset).toEqual([
        expect.objectContaining({ scaleLabel: '收入' }),
        expect.objectContaining({ scaleLabel: '人数' }),
      ]);
      expect(axes.config).toMatchObject({
        chart: {
          grid: {
            labels: {
              axis: { yLabel: '' },
            },
          },
        },
      });
    }
  });

  it('builds a waterfall dataset from totals and changes', () => {
    const view = buildView(`vis waterfall
data
  - category 收入
    value 100
    isTotal true
  - category 成本
    value -30
  - category 利润
    isTotal true
`);
    expect(view).toMatchObject({ kind: 'data-ui', component: 'stackbar' });
    if (view.kind !== 'data-ui') return;
    const dataset = view.dataset as Array<{
      type: string;
      series: Array<{ type: string; series: Array<{ value: number }> }>;
    }>;
    expect(dataset[0].type).toBe('waterfall');
    expect(dataset[0].series.map((step) => step.series[0].value)).toEqual([100, -30, 70]);
    expect(view.config).toMatchObject({
      style: {
        chart: {
          waterfall: {
            segmentLabels: { show: false },
            stepLabels: { show: true },
          },
        },
      },
    });
  });

  it('keeps time-series rows for the custom area chart', () => {
    const view = buildView({
      type: 'area',
      data: [
        { time: 'Q1', value: 12 },
        { time: 'Q2', value: 18 },
      ],
    });
    expect(view).toMatchObject({ kind: 'custom', component: 'area' });
    if (view.kind !== 'custom') return;
    expect((view.props.rows as Array<{ time: string }>).map((row) => row.time)).toEqual([
      'Q1',
      'Q2',
    ]);
  });

  it('keeps scatter points visible and disables correlation guides', () => {
    const view = buildView({
      type: 'scatter',
      data: [
        { x: 1, y: 2, group: 'A', name: '点一' },
        { x: 3, y: 4, group: 'A' },
      ],
    });
    expect(view).toMatchObject({ kind: 'data-ui', component: 'scatter' });
    if (view.kind !== 'data-ui') return;
    const dataset = view.dataset as Array<{
      values: Array<{ x: number; y: number; weight?: number }>;
    }>;
    expect(dataset[0].values[0]).toEqual({ name: '点一', x: 1, y: 2 });
    expect(dataset[0].values[1].weight).toBeUndefined();
    expect(view.config).toMatchObject({
      style: { layout: { correlation: { show: false }, plots: { radius: 5 } } },
    });
  });

  it('uses the supported donut label options', () => {
    const view = buildView({
      type: 'pie',
      innerRadius: 0.6,
      data: [{ category: 'A', value: 5 }],
    });
    expect(view).toMatchObject({ kind: 'data-ui', component: 'donut' });
    if (view.kind !== 'data-ui') return;
    expect(view.config).toMatchObject({
      useBlurOnHover: false,
      style: {
        chart: {
          layout: {
            labels: {
              dataLabels: {
                oneLine: true,
                smallArcClusterThreshold: 0,
                usePercentageParens: false,
              },
              value: { show: false },
              percentage: { show: true },
              hollow: {
                show: false,
                total: { show: false },
                average: { show: false },
              },
            },
          },
        },
      },
    });
  });

  it('maps every public chart type to a renderer', () => {
    const samples: Record<string, Record<string, unknown> | string> = {
      line: { type: 'line', data: [{ time: 'Q1', value: 1 }] },
      area: { type: 'area', data: [{ time: 'Q1', value: 1 }] },
      column: { type: 'column', data: [{ category: 'A', value: 1 }] },
      bar: { type: 'bar', data: [{ category: 'A', value: 1 }] },
      pie: { type: 'pie', data: [{ category: 'A', value: 1 }] },
      scatter: { type: 'scatter', data: [{ x: 1, y: 2 }] },
      radar: { type: 'radar', data: [{ name: 'A', value: 1 }] },
      funnel: { type: 'funnel', data: [{ category: 'A', value: 1 }] },
      waterfall: { type: 'waterfall', data: [{ category: 'A', value: 1 }] },
      'dual-axes': {
        type: 'dual-axes',
        categories: ['A'],
        series: [{ type: 'line', data: [1] }],
      },
      histogram: { type: 'histogram', data: [1, 2, 3] },
      boxplot: { type: 'boxplot', data: [{ category: 'A', value: 1 }] },
      violin: {
        type: 'violin',
        data: [
          { category: 'A', value: 1 },
          { category: 'A', value: 2 },
        ],
      },
      venn: {
        type: 'venn',
        data: [{ sets: ['A', 'B'], value: 2 }],
      },
      sankey: { type: 'sankey', data: [{ source: 'A', target: 'B', value: 2 }] },
      treemap: { type: 'treemap', data: [{ name: 'A', value: 1 }] },
      'word-cloud': { type: 'word-cloud', data: [{ text: 'A', value: 1 }] },
      liquid: { type: 'liquid', percent: 0.5 },
      'flow-diagram': {
        type: 'flow-diagram',
        data: { nodes: [{ name: 'A' }, { name: 'B' }], edges: [{ source: 'A', target: 'B' }] },
      },
      'network-graph': {
        type: 'network-graph',
        data: { nodes: [{ name: 'A' }, { name: 'B' }], edges: [{ source: 'A', target: 'B' }] },
      },
      mindmap: { type: 'mindmap', data: { name: 'A', children: [{ name: 'B' }] } },
      'indented-tree': { type: 'indented-tree', data: { name: 'A', children: [{ name: 'B' }] } },
      'organization-chart': {
        type: 'organization-chart',
        data: { name: 'A', children: [{ name: 'B' }] },
      },
      'fishbone-diagram': {
        type: 'fishbone-diagram',
        data: { name: '问题', children: [{ name: '人', children: [{ name: '培训不足' }] }] },
      },
      table: { type: 'table', data: [{ 名称: 'A', 值: 1 }] },
      summary: '# 摘要\n\n[收入](metric_name)达到 [20](metric_value)。',
    };

    for (const chart of CHARTS) {
      const view = buildView(samples[chart.type]);
      expect(['data-ui', 'custom']).toContain(view.kind);
      expect(view.chartType).toBe(chart.type);
    }
  });

  it('returns pending and error states without throwing', () => {
    expect(buildView('vis line\ntitle 暂无数据').kind).toBe('pending');
    expect(buildView('vis', { streaming: true }).kind).toBe('pending');
    expect(buildView('vis heatmap\ndata\n  - x 1').kind).toBe('error');
    const venn = buildView({
      type: 'venn',
      data: [
        { sets: ['A', 'B'], value: 1 },
        { sets: ['C', 'D'], value: 1 },
      ],
    });
    expect(venn.kind).toBe('error');
    expect(venn.message).toContain('两个集合');
  });

  it('normalizes organization charts into a responsive layered graph', () => {
    const view = buildView({
      type: 'organization-chart',
      data: {
        name: '总部',
        description: '集团',
        children: [{ name: '产品' }, { name: '研发' }],
      },
    });
    expect(view.kind).toBe('custom');
    if (view.kind !== 'custom') return;
    expect(view.component).toBe('organization');
    const props = view.props as {
      nodes: Array<{ id: string; label: string; description: string }>;
      edges: Array<{ from: string; to: string }>;
    };
    expect(props.nodes.map((node) => node.label)).toEqual(['总部', '产品', '研发']);
    expect(props.nodes[0].description).toBe('集团');
    expect(props.edges).toHaveLength(2);
    expect(props.edges.every((edge) => edge.from && edge.to)).toBe(true);
    expect(props.edges.map((edge) => edge.from)).toEqual(['n0', 'n0']);
  });

  it('builds flow diagrams as a responsive layered graph', () => {
    const view = buildView({
      type: 'flow-diagram',
      data: {
        nodes: [{ name: '开始' }, { name: '评审' }, { name: '发布' }],
        edges: [
          { source: '开始', target: '评审', name: '提交' },
          { source: '评审', target: '发布' },
        ],
      },
    });
    expect(view.kind).toBe('custom');
    if (view.kind !== 'custom') return;
    expect(view.component).toBe('flow');
    const props = view.props as {
      nodes: Array<{ id: string; label: string }>;
      edges: Array<{ from: string; to: string; label: string }>;
    };
    expect(props.nodes.map((node) => node.label)).toEqual(['开始', '评审', '发布']);
    expect(props.edges).toEqual([
      { from: '开始', to: '评审', label: '提交' },
      { from: '评审', to: '发布', label: '' },
    ]);
  });
});
