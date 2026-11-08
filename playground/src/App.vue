<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { chartLabel, readConfig, type RenderStatus, type VisualizationTheme } from 'gptvis-vue-data-ui';
import { GPTVisChart } from 'gptvis-vue-data-ui/vue';
import {
  EXAMPLES,
  EXAMPLE_GROUPS,
  findExample,
  type ChartExample,
} from './examples';

interface ThemeOption {
  key: string;
  label: string;
  swatch: string[];
  value: VisualizationTheme;
}

const themeOptions: ThemeOption[] = [
  {
    key: 'default',
    label: '暖白',
    swatch: ['#FCFAF5', '#3559E0', '#DD9A18'],
    value: 'default',
  },
  {
    key: 'dark',
    label: '深色',
    swatch: ['#111816', '#8FA9FF', '#74D7C9'],
    value: 'dark',
  },
  {
    key: 'academy',
    label: '学院',
    swatch: ['#F7F3EA', '#4E79A7', '#E15759'],
    value: 'academy',
  },
  {
    key: 'brand',
    label: '品牌',
    swatch: ['#F8F6F0', '#0C746C', '#E47B3F'],
    value: {
      id: 'nebula-report',
      label: 'Nebula Report',
      baseTheme: 'default',
      tokens: {
        colorBackground: '#F8F6F0',
        colorSurface: '#112622',
        colorText: '#10231F',
        colorTextSecondary: '#65736E',
        colorStroke: '#DDE2DC',
        colorDefault: '#0C746C',
        colorPositive: '#1D7A4D',
        colorNegative: '#B34F43',
        category10: ['#0C746C', '#E47B3F', '#2E5C8A', '#B34F43', '#7D6D9F', '#7A8D3C'],
        fontFamily: '"Avenir Next", "PingFang SC", sans-serif',
        lineWidth: 2.4,
        radius: 6,
      },
    },
  },
];

const selected = ref<ChartExample>(EXAMPLES[0]);
const content = ref(EXAMPLES[0].content);
const query = ref('');
const themeKey = ref('default');
const streaming = ref(false);
const copied = ref(false);
const status = ref<RenderStatus>({ state: 'pending', message: '正在挂载 VueDataUI…' });
const editor = ref<HTMLTextAreaElement | null>(null);
const gutter = ref<HTMLElement | null>(null);
let streamTimer = 0;
let copyTimer = 0;

const theme = computed<VisualizationTheme>(
  () => themeOptions.find((option) => option.key === themeKey.value)?.value ?? 'default',
);

const filteredGroups = computed(() =>
  EXAMPLE_GROUPS.map((group) => ({
    group,
    items: EXAMPLES.filter(
      (example) =>
        example.group === group &&
        (!query.value.trim() ||
          `${example.label} ${example.type} ${example.note}`
            .toLowerCase()
            .includes(query.value.trim().toLowerCase())),
    ),
  })).filter((entry) => entry.items.length),
);

const lineNumbers = computed(() =>
  Array.from({ length: content.value.split('\n').length }, (_, index) =>
    String(index + 1).padStart(2, '0'),
  ).join('\n'),
);

const currentType = computed(() => {
  try {
    return readConfig(content.value, { streaming: streaming.value }).type || selected.value.type;
  } catch {
    return selected.value.type;
  }
});

const currentLabel = computed(() =>
  currentType.value ? chartLabel(currentType.value) : selected.value.label,
);

const statusLabel = computed(() => {
  if (status.value.state === 'ready') return '已渲染';
  if (status.value.state === 'pending') return streaming.value ? '流式接收中' : '等待数据';
  if (status.value.state === 'unsupported') return '语法提示';
  return '渲染错误';
});

const charCount = computed(() => content.value.length);
const lineCount = computed(() => content.value.split('\n').length);
const previewBackground = computed(() => {
  if (themeKey.value === 'dark') return '#111816';
  if (themeKey.value === 'academy') return '#F7F3EA';
  if (themeKey.value === 'brand') return '#F8F6F0';
  return '#FCFAF5';
});

function choose(example: ChartExample): void {
  stopStream();
  selected.value = example;
  content.value = example.content;
  status.value = { state: 'pending', message: '正在准备图表…' };
}

function reset(): void {
  stopStream();
  content.value = selected.value.content;
  status.value = { state: 'pending', message: '已恢复示例…' };
}

function stream(): void {
  if (streaming.value) {
    stopStream();
    return;
  }
  stopStream();
  const source = selected.value.content;
  let cursor = 0;
  content.value = '';
  streaming.value = true;
  status.value = { state: 'pending', message: '正在接收 vis 语法…' };
  const chunk = Math.max(2, Math.round(source.length / 190));
  streamTimer = window.setInterval(() => {
    cursor = Math.min(source.length, cursor + chunk);
    content.value = source.slice(0, cursor);
    if (cursor >= source.length) {
      window.clearInterval(streamTimer);
      streamTimer = 0;
      streaming.value = false;
    }
  }, 26);
}

function stopStream(): void {
  if (streamTimer) window.clearInterval(streamTimer);
  streamTimer = 0;
  streaming.value = false;
}

async function copy(): Promise<void> {
  try {
    await navigator.clipboard.writeText(content.value);
    copied.value = true;
    if (copyTimer) window.clearTimeout(copyTimer);
    copyTimer = window.setTimeout(() => {
      copied.value = false;
    }, 1400);
  } catch {
    copied.value = false;
  }
}

function handleStatus(next: RenderStatus): void {
  status.value = next;
}

function syncGutter(event: Event): void {
  if (!gutter.value) return;
  gutter.value.scrollTop = (event.target as HTMLTextAreaElement).scrollTop;
}

function useKeyboardShortcut(event: KeyboardEvent): void {
  if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
    event.preventDefault();
    stream();
  }
}

watch(
  () => content.value,
  async () => {
    await nextTick();
    if (streaming.value && editor.value) {
      editor.value.scrollTop = editor.value.scrollHeight;
      if (gutter.value) gutter.value.scrollTop = editor.value.scrollTop;
    }
  },
  { flush: 'post' },
);

onBeforeUnmount(() => {
  stopStream();
  if (copyTimer) window.clearTimeout(copyTimer);
});
</script>

<template>
  <div class="site-shell">
    <header class="topbar">
      <a class="brand" href="/" aria-label="GPT-Vis VueDataUI 首页">
        <span class="brand-mark" aria-hidden="true">
          <span></span><span></span><span></span>
        </span>
        <span class="brand-name">GPT-Vis</span>
        <span class="brand-cross">×</span>
        <span class="brand-partner">Vue Data UI</span>
      </a>
      <nav class="topbar-actions" aria-label="项目链接">
        <span class="version-pill">v0.1.0 · 26 types</span>
        <a
          class="github-link"
          href="https://github.com/wzc520pyfm/GPT-Vis-VueDataUI"
          target="_blank"
          rel="noreferrer"
        >
          GitHub
          <span aria-hidden="true">↗</span>
        </a>
      </nav>
    </header>

    <main class="workspace">
      <aside class="sidebar">
        <div class="sidebar-head">
          <span class="eyebrow">CHART GRAMMAR</span>
          <h2>选一个图表开始</h2>
          <p>模型写 vis，VueDataUI 负责画。26 类语法与 GPT-Vis 对齐。</p>
        </div>

        <label class="search-field">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="6.5"></circle>
            <path d="m16 16 4 4"></path>
          </svg>
          <input v-model="query" type="search" placeholder="搜索图表或类型" />
          <kbd>{{ EXAMPLES.length }}</kbd>
        </label>

        <div class="catalog">
          <section v-for="entry in filteredGroups" :key="entry.group" class="catalog-group">
            <div class="catalog-label">
              <span>{{ entry.group }}</span>
              <span>{{ String(entry.items.length).padStart(2, '0') }}</span>
            </div>
            <button
              v-for="example in entry.items"
              :key="example.type"
              type="button"
              class="catalog-item"
              :class="{ active: selected.type === example.type }"
              @click="choose(example)"
            >
              <span class="catalog-index">{{ String(EXAMPLES.indexOf(example) + 1).padStart(2, '0') }}</span>
              <span class="catalog-copy">
                <strong>{{ example.label }}</strong>
                <small>{{ example.type }}</small>
              </span>
              <span class="catalog-arrow" aria-hidden="true">↗</span>
            </button>
          </section>
          <p v-if="!filteredGroups.length" class="empty-search">没有匹配的图表，换个关键词试试。</p>
        </div>

        <div class="sidebar-foot">
          <span class="signal-dot"></span>
          <span>Vue 3 · VueDataUI 3.28</span>
        </div>
      </aside>

      <section class="stage">
        <div class="hero">
          <div class="hero-copy">
            <span class="eyebrow">VIS SYNTAX, VUE NATIVE</span>
            <h1>让模型直接写图表。<br /><em>Vue 来画。</em></h1>
            <p>
              保留 GPT-Vis 的流式语法、26 种图表与同名 API，
              把渲染交给 VueDataUI。零 AntV，零 ECharts。
            </p>
          </div>
          <div class="hero-stats">
            <div>
              <strong>26</strong>
              <span>chart types</span>
            </div>
            <div>
              <strong>1</strong>
              <span>vis grammar</span>
            </div>
            <div>
              <strong>∞</strong>
              <span>token streams</span>
            </div>
          </div>
        </div>

        <div class="demo-card">
          <div class="demo-head">
            <div class="demo-title">
              <span class="mini-mark" aria-hidden="true"></span>
              <div>
                <span class="demo-kicker">{{ selected.group }} / {{ currentType }}</span>
                <strong>{{ currentLabel }}</strong>
              </div>
              <span
                class="status"
                :class="`status-${status.state}`"
                :title="status.message"
              >
                <span class="status-dot"></span>
                {{ statusLabel }}
              </span>
            </div>

            <div class="demo-tools">
              <div class="theme-switcher" aria-label="图表主题">
                <button
                  v-for="option in themeOptions"
                  :key="option.key"
                  type="button"
                  :class="{ active: themeKey === option.key }"
                  :title="option.label"
                  @click="themeKey = option.key"
                >
                  <span class="swatch" aria-hidden="true">
                    <i
                      v-for="(color, index) in option.swatch"
                      :key="color"
                      :style="{ background: color, zIndex: 4 - index }"
                    ></i>
                  </span>
                  <span>{{ option.label }}</span>
                </button>
              </div>
              <span class="tool-divider"></span>
              <button type="button" class="tool-button" @click="reset">重置</button>
              <button type="button" class="tool-button" @click="copy">
                {{ copied ? '已复制' : '复制' }}
              </button>
              <button
                type="button"
                class="stream-button"
                :class="{ running: streaming }"
                @click="stream"
              >
                <span class="stream-icon" aria-hidden="true">{{ streaming ? 'Ⅱ' : '▶' }}</span>
                {{ streaming ? '停止' : '流式演示' }}
              </button>
            </div>
          </div>

          <div class="demo-body">
            <section class="editor-panel" aria-label="vis 语法编辑器">
              <div class="panel-head">
                <div class="panel-title">
                  <span class="panel-dot red"></span>
                  <span class="panel-dot amber"></span>
                  <span class="panel-dot green"></span>
                  <span>syntax.vis</span>
                </div>
                <span class="panel-meta">⌘ ↵ 播放</span>
              </div>
              <div class="editor-scroll">
                <pre ref="gutter" class="line-gutter" aria-hidden="true">{{ lineNumbers }}</pre>
                <textarea
                  ref="editor"
                  v-model="content"
                  class="code-editor"
                  spellcheck="false"
                  aria-label="vis 语法"
                  @scroll="syncGutter"
                  @keydown="useKeyboardShortcut"
                ></textarea>
              </div>
              <div class="editor-foot">
                <span><i class="lang-dot"></i> vis / plain text</span>
                <span>{{ lineCount }} 行 · {{ charCount }} 字符</span>
              </div>
            </section>

            <section class="preview-panel" aria-label="图表预览">
              <div class="panel-head preview-head">
                <div class="panel-title">
                  <span class="preview-pulse"></span>
                  <span>Live preview</span>
                </div>
                <span class="panel-meta">VueDataUI renderer</span>
              </div>
              <div
                class="preview-stage"
                :style="{ background: previewBackground }"
              >
                <div class="preview-grid" aria-hidden="true"></div>
                <GPTVisChart
                  :content="content"
                  :theme="theme"
                  :streaming="streaming"
                  :height="500"
                  @status="handleStatus"
                />
                <div v-if="streaming" class="streaming-flag">
                  <span></span>
                  streaming
                </div>
              </div>
              <div class="preview-foot">
                <span class="preview-note">{{ selected.note }}</span>
                <span class="render-status" :title="status.message">{{ status.message }}</span>
              </div>
            </section>
          </div>
        </div>

        <div class="feature-row">
          <article>
            <span class="feature-number">01</span>
            <h3>同一套 vis 语法</h3>
            <p>JSON、流式 Syntax、Markdown 正文摘要都能直接交给 <code>render()</code>。</p>
          </article>
          <article>
            <span class="feature-number">02</span>
            <h3>Vue 原生组件</h3>
            <p>13 类图表映射到 VueDataUI，其余由轻量 Vue + SVG 图层补齐。</p>
          </article>
          <article>
            <span class="feature-number">03</span>
            <h3>对模型保持克制</h3>
            <p>没有任意 option、脚本或事件处理器；颜色与内容都经过安全边界。</p>
          </article>
        </div>

        <footer class="page-footer">
          <span>Built for Vue teams. Grammar by GPT-Vis.</span>
          <span>MIT · wzc520pyfm/GPT-Vis-VueDataUI</span>
        </footer>
      </section>
    </main>
  </div>
</template>
