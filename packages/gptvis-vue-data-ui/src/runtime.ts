import {
  createApp,
  h,
  shallowRef,
  type App,
  type Ref,
} from 'vue';
import { buildView, type BuiltView, type ViewContext } from './build.js';
import { readConfig } from './parser.js';
import { RuntimeView } from './runtime-view.js';
import { ensureStyles } from './styles.js';
import type { ResolvedThemeTokens, VisualizationTheme } from './theme.js';
import { resolveTheme } from './theme.js';
import { themeVars } from './utils.js';

const ZOOMABLE = new Set([
  'flow-diagram',
  'network-graph',
  'mindmap',
  'indented-tree',
  'organization-chart',
  'fishbone-diagram',
]);

export interface GPTVisOptions {
  container: string | HTMLElement;
  width?: number;
  height?: number;
  theme?: VisualizationTheme;
  streaming?: boolean;
  wrapper?: boolean;
  locale?: string;
  onStatus?: (status: RenderStatus) => void;
}

export interface RenderStatus {
  state: 'pending' | 'ready' | 'unsupported' | 'error';
  message: string;
}

interface Shell {
  root: HTMLDivElement;
  chart: HTMLDivElement;
  code: HTMLPreElement;
  tabs: HTMLButtonElement[];
  zoom: HTMLSpanElement;
  zoomOut: HTMLButtonElement;
  zoomIn: HTMLButtonElement;
}

interface LocaleText {
  chart: string;
  code: string;
  copy: string;
  copied: string;
  download: string;
  zoomIn: string;
  zoomOut: string;
  source: string;
}

const LOCALES: Record<string, LocaleText> = {
  en: {
    chart: 'Chart',
    code: 'Code',
    copy: 'Copy',
    copied: 'Copied',
    download: 'SVG',
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out',
    source: 'Source',
  },
  'zh-CN': {
    chart: '图表',
    code: '代码',
    copy: '复制',
    copied: '已复制',
    download: '下载',
    zoomIn: '放大',
    zoomOut: '缩小',
    source: '源代码',
  },
};

export class GPTVis {
  private root: HTMLElement;
  private host: HTMLDivElement;
  private app: App;
  private view: Ref<BuiltView | null> = shallowRef(null);
  private themeStyle: Ref<Record<string, string>> = shallowRef({});
  private options: GPTVisOptions;
  private shell: Shell | null = null;
  private observer: ResizeObserver | null = null;
  private lastInput: unknown = '';
  private sourceText = '';
  private lastSize = '';
  private lastStatus = '';
  private resizeFrame = 0;
  private zoom = 1;

  constructor(options: GPTVisOptions) {
    this.options = options;
    ensureStyles();
    const container = resolveContainer(options.container);
    container.replaceChildren();
    const theme = resolveTheme(undefined, options.theme ?? 'default');
    this.root = document.createElement('div');
    this.root.className = 'gvui-host';
    this.root.style.background = theme.background;
    this.root.style.setProperty('--gv-background', theme.background);
    this.root.style.setProperty('--gv-text', theme.text);
    this.root.style.setProperty('--gv-font', theme.fontFamily);
    this.root.style.minHeight = `${options.height ?? 440}px`;
    if (options.width) this.root.style.width = `${options.width}px`;

    let viewHost: HTMLElement = this.root;
    if (options.wrapper) {
      this.shell = createShell(options, (action) => {
        if (action === 'copy') void this.copySource();
        if (action === 'download') this.downloadSvg();
        if (action === 'zoom-in') this.zoomTo(this.getZoom() * 1.2);
        if (action === 'zoom-out') this.zoomTo(this.getZoom() / 1.2);
        if (action === 'chart' || action === 'code') this.setTab(action);
      });
      container.append(this.shell.root);
      viewHost = this.shell.chart;
    } else {
      container.append(this.root);
    }
    this.host = document.createElement('div');
    this.host.className = 'gvui-chart-host';
    viewHost.append(this.host);

    this.app = createApp({
      name: 'GptVisRoot',
      setup: () => () =>
        this.view.value
          ? h(RuntimeView, {
              view: this.view.value,
              themeStyle: this.themeStyle.value,
            })
          : null,
    });
    this.app.mount(this.host);

    this.observer = new ResizeObserver(() => this.scheduleRelayout());
    this.observer.observe(this.root);
  }

  render(input: string | Record<string, unknown>): void {
    this.lastInput = input;
    this.sourceText = typeof input === 'string' ? input : safeStringify(input);
    this.updateShellState();
    this.draw(true);
  }

  resize(): void {
    this.draw(true);
  }

  zoomTo(zoom: number): void {
    if (!Number.isFinite(zoom)) return;
    this.zoom = Math.min(4, Math.max(0.25, zoom));
    this.applyZoom();
    this.updateShellState();
  }

  getZoom(): number {
    return this.zoom;
  }

  destroy(): void {
    if (this.resizeFrame && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(this.resizeFrame);
    }
    this.observer?.disconnect();
    this.observer = null;
    this.app.unmount();
    this.host.remove();
    if (this.shell) this.shell.root.remove();
    else this.root.remove();
    this.shell = null;
  }

  private draw(force = false): void {
    const width = this.options.width || this.host.clientWidth || this.root.clientWidth || 820;
    const height =
      this.options.height ||
      Math.max(280, this.host.clientHeight || this.root.clientHeight || 440);
    const size = `${Math.round(width)}x${Math.round(height)}`;
    if (!force && size === this.lastSize && this.view.value) return;
    this.lastSize = size;
    const context: ViewContext = {
      theme: this.options.theme,
      streaming: this.options.streaming,
      width,
      height,
    };

    let next: BuiltView;
    try {
      next = buildView(this.lastInput, context);
    } catch (error) {
      const message = error instanceof Error ? error.message : '图表渲染失败';
      next = {
        kind: 'error',
        background: messageBackground(this.options.theme),
        message,
      };
    }

    const config = readConfig(this.lastInput, { streaming: this.options.streaming });
    const theme = resolveTheme(config.theme, this.options.theme ?? 'default');
    const resolved: ResolvedThemeTokens = {
      ...theme,
      background: next.background,
    };
    this.themeStyle.value = themeVars(resolved);
    this.root.style.background = next.background;
    this.root.style.setProperty('--gv-background', next.background);
    this.root.style.setProperty('--gv-text', resolved.text);
    this.root.style.setProperty('--gv-muted', resolved.muted);
    this.root.style.setProperty('--gv-grid', resolved.grid);
    this.root.style.setProperty('--gv-accent', resolved.palette[0] ?? resolved.total);
    this.root.style.setProperty('--gv-positive', resolved.positive);
    this.root.style.setProperty('--gv-negative', resolved.negative);
    this.root.style.setProperty('--gv-total', resolved.total);
    this.root.style.setProperty('--gv-font', resolved.fontFamily);
    this.root.style.setProperty('--gv-radius', `${resolved.radius}px`);
    this.view.value = next;

    if (this.shell) {
      const zoomable = Boolean(next.chartType && ZOOMABLE.has(next.chartType));
      this.shell.zoomOut.disabled = !zoomable;
      this.shell.zoomIn.disabled = !zoomable;
      this.shell.zoom.parentElement?.classList.toggle('gvui-hidden', !zoomable);
    }
    if (this.zoom !== 1 && next.kind === 'data-ui') this.applyZoom();

    const state: RenderStatus['state'] =
      next.kind === 'pending'
        ? 'pending'
        : next.kind === 'error'
          ? 'unsupported'
          : 'ready';
    this.emitStatus({ state, message: next.message });
  }

  private scheduleRelayout(): void {
    const width = this.options.width || this.root.clientWidth;
    const height = this.options.height || this.root.clientHeight;
    const size = `${Math.round(width)}x${Math.round(height)}`;
    if (size === this.lastSize || typeof requestAnimationFrame !== 'function') return;
    if (this.resizeFrame) cancelAnimationFrame(this.resizeFrame);
    this.resizeFrame = requestAnimationFrame(() => {
      this.resizeFrame = 0;
      this.draw();
    });
  }

  private emitStatus(status: RenderStatus): void {
    const key = `${status.state}:${status.message}`;
    if (this.lastStatus === key) return;
    this.lastStatus = key;
    this.options.onStatus?.(status);
  }

  private applyZoom(): void {
    this.host.style.transform = this.zoom === 1 ? '' : `scale(${this.zoom})`;
    this.host.style.transformOrigin = 'top center';
    if (this.shell) this.shell.zoom.textContent = `${Math.round(this.zoom * 100)}%`;
  }

  private updateShellState(): void {
    if (!this.shell) return;
    this.shell.code.textContent = this.sourceText || '// 还没有输入 vis 语法';
    this.applyZoom();
  }

  private setTab(tab: 'chart' | 'code'): void {
    if (!this.shell) return;
    const showChart = tab === 'chart';
    this.shell.chart.classList.toggle('gvui-hidden', !showChart);
    this.shell.code.classList.toggle('gvui-hidden', showChart);
    this.shell.tabs.forEach((button, index) =>
      button.classList.toggle('is-active', index === (showChart ? 0 : 1)),
    );
  }

  private async copySource(): Promise<void> {
    if (!this.shell) return;
    const copyButton = this.shell.root.querySelector<HTMLButtonElement>(
      '[data-action="copy"]',
    );
    try {
      await copyText(this.sourceText);
      if (copyButton) {
        const original = copyButton.textContent;
        copyButton.textContent = localeOf(this.options.locale).copied;
        window.setTimeout(() => {
          copyButton.textContent = original;
        }, 1200);
      }
    } catch {
      this.emitStatus({ state: 'error', message: '复制失败，请手动选择代码。' });
    }
  }

  private downloadSvg(): void {
    const svg = this.host.querySelector('svg');
    if (!svg) {
      this.emitStatus({ state: 'error', message: '当前视图没有可下载的 SVG。' });
      return;
    }
    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    const styles = getComputedStyle(this.root);
    const variables = [
      ['--gv-text', styles.getPropertyValue('--gv-text')],
      ['--gv-muted', styles.getPropertyValue('--gv-muted')],
      ['--gv-grid', styles.getPropertyValue('--gv-grid')],
      ['--gv-background', styles.getPropertyValue('--gv-background')],
      ['--gv-accent', styles.getPropertyValue('--gv-accent')],
    ]
      .map(([key, value]) => `${key}:${value};`)
      .join('');
    const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
    style.textContent = `:root{${variables}}text{font-family:${styles.fontFamily};}`;
    clone.prepend(style);
    const blob = new Blob([new XMLSerializer().serializeToString(clone)], {
      type: 'image/svg+xml;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `gptvis-${Date.now()}.svg`;
    anchor.click();
    URL.revokeObjectURL(url);
  }
}

export function bindGPTVis(
  container: string | HTMLElement,
  options: Omit<GPTVisOptions, 'container'> = {},
): {
  update: (content: string | Record<string, unknown>) => void;
  resize: () => void;
  zoomTo: (zoom: number) => void;
  getZoom: () => number;
  destroy: () => void;
} {
  const instance = new GPTVis({ container, ...options });
  return {
    update(content) {
      instance.render(content);
    },
    resize() {
      instance.resize();
    },
    zoomTo(zoom) {
      instance.zoomTo(zoom);
    },
    getZoom() {
      return instance.getZoom();
    },
    destroy() {
      instance.destroy();
    },
  };
}

function createShell(
  options: GPTVisOptions,
  onAction: (
    action: 'chart' | 'code' | 'copy' | 'download' | 'zoom-in' | 'zoom-out',
  ) => void,
): Shell {
  const locale = localeOf(options.locale);
  const shell = document.createElement('div');
  shell.className = 'gvui-shell';
  const bar = document.createElement('div');
  bar.className = 'gvui-shell-bar';
  const tabs = document.createElement('div');
  tabs.className = 'gvui-shell-tabs';
  const actions = document.createElement('div');
  actions.className = 'gvui-shell-actions';

  const chartTab = button('chart', locale.chart, 'gvui-shell-tab is-active');
  const codeTab = button('code', locale.code, 'gvui-shell-tab');
  const copy = button('copy', locale.copy, 'gvui-shell-action');
  const download = button('download', locale.download, 'gvui-shell-action');
  download.title = 'Download visible SVG';
  const zoomOut = button('zoom-out', '−', 'gvui-shell-action');
  zoomOut.title = locale.zoomOut;
  zoomOut.setAttribute('aria-label', locale.zoomOut);
  const zoomIn = button('zoom-in', '+', 'gvui-shell-action');
  zoomIn.title = locale.zoomIn;
  zoomIn.setAttribute('aria-label', locale.zoomIn);
  const zoom = document.createElement('span');
  zoom.className = 'gvui-zoom-indicator';
  zoom.textContent = '100%';
  const zoomGroup = document.createElement('span');
  zoomGroup.className = 'gvui-shell-actions gvui-hidden';
  zoomGroup.append(zoomOut, zoom, zoomIn);

  tabs.append(chartTab, codeTab);
  actions.append(zoomGroup, copy, download);
  bar.append(tabs, actions);
  const chart = document.createElement('div');
  chart.className = 'gvui-shell-chart';
  const code = document.createElement('pre');
  code.className = 'gvui-shell-code gvui-hidden';
  code.setAttribute('aria-label', locale.source);
  shell.append(bar, chart, code);
  [chartTab, codeTab, copy, download, zoomOut, zoomIn].forEach((item) => {
    item.addEventListener('click', () => {
      onAction(item.dataset.action as Parameters<typeof onAction>[0]);
    });
  });
  return { root: shell, chart, code, tabs: [chartTab, codeTab], zoom, zoomOut, zoomIn };
}

function button(
  action: string,
  label: string,
  className: string,
): HTMLButtonElement {
  const element = document.createElement('button');
  element.type = 'button';
  element.className = className;
  element.dataset.action = action;
  element.textContent = label;
  return element;
}

function localeOf(locale?: string): LocaleText {
  return LOCALES[locale ?? 'en'] ?? LOCALES.en;
}

function resolveContainer(container: string | HTMLElement): HTMLElement {
  if (typeof container !== 'string') return container;
  const element = document.querySelector(container);
  if (!(element instanceof HTMLElement)) throw new Error(`找不到容器：${container}`);
  return element;
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function messageBackground(theme?: VisualizationTheme): string {
  return resolveTheme(theme, 'default').background;
}

async function copyText(value: string): Promise<void> {
  if (!value) throw new Error('没有可复制的内容');
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const area = document.createElement('textarea');
  area.value = value;
  area.style.position = 'fixed';
  area.style.opacity = '0';
  document.body.append(area);
  area.select();
  const copied = document.execCommand('copy');
  area.remove();
  if (!copied) throw new Error('复制失败');
}
