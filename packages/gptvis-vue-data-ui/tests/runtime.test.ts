import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp, h, nextTick, ref } from 'vue';
import { bindGPTVis, GPTVis, type RenderStatus } from '../src/runtime.js';
import { GPTVisChart } from '../src/vue.js';

const instances: Array<{ destroy: () => void; host: HTMLElement }> = [];

afterEach(() => {
  for (const instance of instances.splice(0)) {
    instance.destroy();
    instance.host.remove();
  }
});

function host(): HTMLElement {
  const element = document.createElement('div');
  element.style.width = '880px';
  element.style.height = '520px';
  document.body.append(element);
  return element;
}

async function settle(): Promise<void> {
  await nextTick();
  await new Promise((resolve) => window.setTimeout(resolve, 0));
  await nextTick();
}

describe('GPTVis runtime', () => {
  it('mounts a VueDataUI chart and reports ready', async () => {
    const container = host();
    const statuses: RenderStatus[] = [];
    const vis = new GPTVis({
      container,
      height: 440,
      onStatus: (status: RenderStatus) => statuses.push(status),
    });
    instances.push({ destroy: () => vis.destroy(), host: container });
    vis.render(`vis column
title 区域销售
data
  - category 华东
    value 120
  - category 华南
    value 98
`);
    await settle();
    expect(container.querySelector('[data-component="xy"]')).not.toBeNull();
    expect(container.querySelector('.vue-ui-xy')).not.toBeNull();
    expect(statuses.at(-1)?.state).toBe('ready');
  });

  it('renders a custom chart without VueDataUI', async () => {
    const container = host();
    const vis = new GPTVis({ container, height: 440 });
    instances.push({ destroy: () => vis.destroy(), host: container });
    vis.render('vis liquid\npercent 0.64\ntitle 目标完成');
    await settle();
    expect(container.querySelector('[data-component="liquid"]')).not.toBeNull();
    expect(container.querySelector('.gvui-liquid')).not.toBeNull();
    expect(container.textContent).toContain('64%');
  });

  it('redraws when the same instance receives new syntax', async () => {
    const container = host();
    const vis = new GPTVis({ container, height: 440 });
    instances.push({ destroy: () => vis.destroy(), host: container });
    vis.render('vis pie\ndata\n  - category A\n    value 1');
    await settle();
    expect(container.querySelector('[data-component="donut"]')).not.toBeNull();
    vis.render('vis liquid\npercent 0.42');
    await settle();
    expect(container.querySelector('[data-component="liquid"]')).not.toBeNull();
    expect(container.textContent).toContain('42%');
  });

  it('switches wrapper tabs, copies source and exposes zoom methods', async () => {
    const container = host();
    const vis = new GPTVis({
      container,
      wrapper: true,
      locale: 'zh-CN',
      height: 440,
    });
    instances.push({ destroy: () => vis.destroy(), host: container });
    vis.render(`vis network-graph
data
  nodes
    - name 甲
    - name 乙
  edges
    - source 甲
      target 乙
`);
    await settle();
    const codeTab = container.querySelector<HTMLButtonElement>('[data-action="code"]');
    expect(codeTab).not.toBeNull();
    codeTab?.click();
    await nextTick();
    expect(container.querySelector('.gvui-shell-code')?.classList.contains('gvui-hidden')).toBe(
      false,
    );
    const clipboard = vi
      .spyOn(navigator.clipboard, 'writeText')
      .mockResolvedValue(undefined);
    container.querySelector<HTMLButtonElement>('[data-action="copy"]')?.click();
    await new Promise((resolve) => window.setTimeout(resolve, 0));
    expect(clipboard).toHaveBeenCalledWith(
      expect.stringContaining('vis network-graph'),
    );
    expect(vis.getZoom()).toBe(1);
    vis.zoomTo(1.2);
    expect(vis.getZoom()).toBe(1.2);
    vis.zoomTo(99);
    expect(vis.getZoom()).toBe(4);
  });

  it('supports bindGPTVis and detects errors', async () => {
    const container = host();
    const statuses: RenderStatus[] = [];
    const chart = bindGPTVis(container, {
      onStatus: (status: RenderStatus) => statuses.push(status),
    });
    instances.push({ destroy: () => chart.destroy(), host: container });
    chart.update('vis unknown\ndata\n  - category A');
    await settle();
    expect(statuses.at(-1)?.state).toBe('unsupported');
    expect(container.textContent).toContain('不支持的类型');
  });

  it('updates GPTVisChart content without remounting the runtime', async () => {
    const container = host();
    const content = ref('vis liquid\npercent 0.35');
    const app = createApp({
      setup: () => () =>
        h(GPTVisChart, {
          content: content.value,
          height: 440,
        }),
    });
    app.mount(container);
    instances.push({ destroy: () => app.unmount(), host: container });
    await settle();
    const runtime = container.querySelector('.gvui-host');
    expect(runtime).not.toBeNull();
    expect(container.textContent).toContain('35%');

    content.value = 'vis liquid\npercent 0.72';
    await settle();

    expect(container.querySelector('.gvui-host')).toBe(runtime);
    expect(container.textContent).toContain('72%');
  });

  it('renders summary entities as text and chips', async () => {
    const container = host();
    const vis = new GPTVis({ container, height: 440 });
    instances.push({ destroy: () => vis.destroy(), host: container });
    vis.render(`## 本季摘要

[总收入](metric_value)达到 [174 万](metric_value)，同比 [+7%](delta_value, assessment="positive")。
`);
    await settle();
    expect(container.querySelector('[data-component="summary"]')).not.toBeNull();
    expect(container.querySelector('.gvui-summary')).not.toBeNull();
    expect(container.textContent).toContain('174 万');
    expect(container.querySelectorAll('.gvui-chip').length).toBe(3);
    expect(container.querySelector('script')).toBeNull();
  });

  it('destroys observers and app output', async () => {
    const container = host();
    const vis = new GPTVis({ container });
    vis.render('vis pie\ndata\n  - category A\n    value 1');
    await settle();
    vis.destroy();
    expect(container.childElementCount).toBe(0);
  });
});
