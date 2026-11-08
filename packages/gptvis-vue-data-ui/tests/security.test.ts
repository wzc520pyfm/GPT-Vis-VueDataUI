import { afterEach, describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { GPTVis } from '../src/runtime.js';

const IMG = '<img src=x onerror=alert(1)>';
const SCRIPT = '<script>alert(1)</script>';
const hosts: HTMLElement[] = [];

afterEach(() => {
  hosts.splice(0).forEach((host) => host.remove());
});

async function render(input: string | Record<string, unknown>): Promise<HTMLElement> {
  const container = document.createElement('div');
  container.style.width = '800px';
  container.style.height = '500px';
  document.body.append(container);
  hosts.push(container);
  const vis = new GPTVis({ container, height: 440 });
  vis.render(input);
  await nextTick();
  await new Promise((resolve) => window.setTimeout(resolve, 0));
  await nextTick();
  return container;
}

describe('safe Vue rendering', () => {
  it('renders summary entities without v-html injection', async () => {
    const container = await render(
      `# 销售 ${SCRIPT}\n\n[${IMG}](metric_name) 达到 [520](metric_value)，[增长](delta_value, assessment="positive")。`,
    );
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('script')).toBeNull();
    expect(container.textContent).toContain(IMG);
    expect(container.querySelectorAll('.gvui-chip').length).toBeGreaterThan(0);
    expect(container.querySelector('.gvui-chip.pos')).not.toBeNull();
  });

  it('renders table titles and headers as text', async () => {
    const container = await render(`vis table
title ${IMG}
data
  - 名称 ${IMG}
    备注 ${SCRIPT}
`);
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('script')).toBeNull();
    expect(container.textContent).toContain(IMG);
  });

  it('keeps custom SVG labels escaped by Vue text nodes', async () => {
    const container = await render(`vis liquid
title ${IMG}
percent 0.75
`);
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('script')).toBeNull();
    expect(container.textContent).toContain('75%');
  });
});
