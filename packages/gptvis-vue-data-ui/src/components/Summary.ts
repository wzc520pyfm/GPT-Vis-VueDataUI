import {
  computed,
  defineComponent,
  h,
  type PropType,
  type VNode,
  type VNodeChild,
} from 'vue';
import type { ResolvedThemeTokens } from '../theme.js';
import { formatNumber, themeVars } from '../utils.js';

interface Entity {
  label: string;
  type: string;
  assessment: string;
  detail: number[];
}

type Token =
  | { kind: 'text'; value: string }
  | { kind: 'strong'; children: Token[] }
  | { kind: 'code'; value: string }
  | { kind: 'entity'; entity: Entity };

export const SummaryChart = defineComponent({
  name: 'GptVisSummary',

  props: {
    content: { type: String, default: '' },
    title: { type: String, default: '' },
    palette: { type: Array as PropType<string[]>, default: () => [] },
    theme: { type: Object as PropType<ResolvedThemeTokens>, required: true },
  },

  setup(props) {
    const blocks = computed(() => parseBlocks(props.content));

    return () => {
      const theme = props.theme;
      const colors = props.palette.length ? props.palette : theme.palette;
      return h(
        'article',
        {
          class: 'gvui-custom gvui-summary',
          style: themeVars(theme),
          'aria-label': props.title || '摘要',
        },
        [
          props.title ? h('h2', { class: 'gvui-summary-title' }, props.title) : null,
          ...blocks.value.map((block, index) => renderBlock(block, index, colors, theme)),
        ],
      );
    };
  },
});

type Block =
  | { kind: 'heading'; level: number; text: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'list'; items: string[]; ordered: boolean }
  | { kind: 'quote'; text: string }
  | { kind: 'rule' };

function parseBlocks(source: string): Block[] {
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  const blocks: Block[] = [];
  let paragraph: string[] = [];
  let listItems: string[] = [];
  let listOrdered = false;

  const flushParagraph = (): void => {
    if (!paragraph.length) return;
    blocks.push({ kind: 'paragraph', text: paragraph.join(' ') });
    paragraph = [];
  };
  const flushList = (): void => {
    if (!listItems.length) return;
    blocks.push({ kind: 'list', items: listItems, ordered: listOrdered });
    listItems = [];
  };

  for (const raw of lines) {
    const line = raw.trim();
    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    const bullet = line.match(/^[-*+]\s+(.+)$/);
    const ordered = line.match(/^\d+[.)]\s+(.+)$/);
    const quote = line.match(/^>\s?(.*)$/);

    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }
    if (/^([-*_])\1{2,}$/.test(line)) {
      flushParagraph();
      flushList();
      blocks.push({ kind: 'rule' });
      continue;
    }
    if (heading) {
      flushParagraph();
      flushList();
      blocks.push({
        kind: 'heading',
        level: Math.min(4, heading[1].length),
        text: heading[2],
      });
      continue;
    }
    if (bullet || ordered) {
      flushParagraph();
      const nextOrdered = Boolean(ordered);
      if (listItems.length && listOrdered !== nextOrdered) flushList();
      listOrdered = nextOrdered;
      listItems.push((bullet?.[1] ?? ordered?.[1]) as string);
      continue;
    }
    if (quote) {
      flushParagraph();
      flushList();
      blocks.push({ kind: 'quote', text: quote[1] });
      continue;
    }
    flushList();
    paragraph.push(line);
  }
  flushParagraph();
  flushList();
  return blocks;
}

function renderBlock(
  block: Block,
  index: number,
  colors: string[],
  theme: ResolvedThemeTokens,
): VNode {
  if (block.kind === 'rule') return h('hr', { key: index, class: 'gvui-summary-rule' });
  if (block.kind === 'heading') {
    return h(
      `h${Math.min(4, block.level + 1)}`,
      { key: index, class: 'gvui-summary-heading' },
      inline(block.text, colors, theme),
    );
  }
  if (block.kind === 'quote') {
    return h('blockquote', { key: index }, inline(block.text, colors, theme));
  }
  if (block.kind === 'list') {
    return h(
      block.ordered ? 'ol' : 'ul',
      { key: index, class: 'gvui-summary-list' },
      block.items.map((item, itemIndex) =>
        h('li', { key: itemIndex }, inline(item, colors, theme)),
      ),
    );
  }
  return h(
    'p',
    { key: index, class: 'gvui-summary-paragraph' },
    inline(block.text, colors, theme),
  );
}

function inline(source: string, colors: string[], theme: ResolvedThemeTokens): VNodeChild[] {
  return tokens(source).map((token, index) => tokenNode(token, index, colors, theme));
}

function tokenNode(
  token: Token,
  index: number,
  colors: string[],
  theme: ResolvedThemeTokens,
): VNodeChild {
  if (token.kind === 'text') return token.value;
  if (token.kind === 'strong') {
    return h(
      'strong',
      { key: index },
      token.children.map((child, childIndex) =>
        tokenNode(child, childIndex, colors, theme),
      ),
    );
  }
  if (token.kind === 'code') {
    return h('code', { key: index, class: 'gvui-summary-code' }, token.value);
  }

  const { entity } = token;
  const negative =
    entity.assessment === 'negative' ||
    entity.type === 'negative_value' ||
    /^-.+/.test(entity.label);
  const positive =
    entity.assessment === 'positive' ||
    entity.type === 'positive_value' ||
    entity.type === 'delta_value';
  const tone = negative ? 'neg' : positive ? 'pos' : entity.type === 'rank' ? 'meta' : '';
  return h(
    'span',
    {
      key: index,
      class: ['gvui-chip', tone],
      'data-entity': entity.type,
      title: entity.type,
    },
    [
      h('span', entity.label),
      entity.detail.length > 1
        ? sparkline(entity.detail, colors[0] ?? theme.total, theme, negative)
        : null,
    ],
  );
}

function sparkline(
  values: number[],
  color: string,
  theme: ResolvedThemeTokens,
  descending: boolean,
): VNode {
  const width = 54;
  const height = 18;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const points = values.map((value, index) => {
    const x = (index / Math.max(1, values.length - 1)) * (width - 2) + 1;
    const y = height - 2 - ((value - min) / span) * (height - 4);
    return `${Math.round(x * 10) / 10},${Math.round(y * 10) / 10}`;
  });
  return h(
    'svg',
    {
      class: 'gvui-spark',
      viewBox: `0 0 ${width} ${height}`,
      'aria-label': `序列 ${values.map((value) => formatNumber(value)).join('、')}`,
    },
    [
      h('polyline', {
        points: points.join(' '),
        fill: 'none',
        stroke: descending ? theme.negative : color,
        'stroke-width': 1.6,
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
      }),
    ],
  );
}

const ENTITY_PATTERN =
  /\[([^\]]+)\]\(\s*([A-Za-z_][\w-]*)((?:\s*,\s*[\w-]+\s*=\s*(?:"[^"]*"|'[^']*'|\[[^\]]*\]|[^,)\]]+))*)\s*\)/g;

function tokens(source: string): Token[] {
  const output: Token[] = [];
  let cursor = 0;
  const entityPattern = new RegExp(ENTITY_PATTERN.source, 'g');
  let entityMatch: RegExpExecArray | null;

  while ((entityMatch = entityPattern.exec(source))) {
    if (entityMatch.index > cursor) {
      output.push(...plainTokens(source.slice(cursor, entityMatch.index)));
    }
    output.push({
      kind: 'entity',
      entity: {
        label: entityMatch[1],
        type: entityMatch[2],
        assessment: attribute(entityMatch[3] ?? '', 'assessment'),
        detail: numericDetail(attribute(entityMatch[3] ?? '', 'detail')),
      },
    });
    cursor = entityMatch.index + entityMatch[0].length;
  }
  if (cursor < source.length) output.push(...plainTokens(source.slice(cursor)));
  return output;
}

function plainTokens(source: string): Token[] {
  const output: Token[] = [];
  const pattern = /\*\*([^*]+)\*\*|`([^`]+)`/g;
  let cursor = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(source))) {
    if (match.index > cursor) {
      output.push({ kind: 'text', value: source.slice(cursor, match.index) });
    }
    if (match[1] != null) {
      output.push({ kind: 'strong', children: plainTokens(match[1]) });
    } else if (match[2] != null) {
      output.push({ kind: 'code', value: match[2] });
    }
    cursor = match.index + match[0].length;
  }
  if (cursor < source.length) {
    output.push({ kind: 'text', value: source.slice(cursor) });
  }
  return output;
}

function attribute(source: string, name: string): string {
  const pattern = new RegExp(`${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^,)\\]]+))`);
  const match = pattern.exec(source);
  return (match?.[1] ?? match?.[2] ?? match?.[3] ?? '').trim();
}

function numericDetail(source: string): number[] {
  return source
    .replace(/^\[|\]$/g, '')
    .split(/[,，\s]+/)
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item));
}
