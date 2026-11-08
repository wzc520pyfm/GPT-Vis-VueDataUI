const STYLE_ID = 'gptvis-vue-data-ui-styles';

export function ensureStyles(): void {
  if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = STYLES;
  document.head.append(style);
}

const STYLES = `
.gvui-host,
.gvui-view,
.gvui-chart-host {
  width: 100%;
  min-height: 280px;
}
.gvui-host {
  position: relative;
  isolation: isolate;
  color: var(--gv-text, #181713);
  font-family: var(--gv-font, "IBM Plex Sans", "Noto Sans SC", sans-serif);
}
.gvui-view {
  position: relative;
  height: 100%;
  min-height: inherit;
  overflow: hidden;
  transition: background-color 180ms ease;
}
.gvui-chart-host {
  height: 100%;
  min-height: inherit;
  position: relative;
  transition: transform 180ms ease;
}
.gvui-data-ui {
  min-height: 300px;
}
.gvui-view[data-chart-type="dual-axes"] .vue-ui-xy text[transform*="rotate(-90)"] {
  display: none;
}
.gvui-custom {
  width: 100%;
  min-height: 300px;
  box-sizing: border-box;
  color: var(--gv-text);
  background: var(--gv-background);
}
.gvui-custom-title,
.gvui-summary-title {
  margin: 0;
  padding: 18px 22px 8px;
  font-size: 16px;
  line-height: 1.35;
  font-weight: 650;
  letter-spacing: -0.01em;
  color: var(--gv-text);
}
.gvui-custom svg {
  display: block;
  width: 100%;
  height: auto;
  overflow: visible;
}
.gvui-custom text {
  font-family: var(--gv-font);
}
.gvui-svg-tick,
.gvui-svg-small {
  fill: var(--gv-muted);
  font-size: 11px;
}
.gvui-svg-axis {
  fill: var(--gv-muted);
  font-size: 12px;
}
.gvui-svg-axis-title {
  fill: var(--gv-muted);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.035em;
}
.gvui-svg-value {
  fill: var(--gv-text);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
}
.gvui-status {
  min-height: inherit;
  height: 100%;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 12px;
  padding: 36px 28px;
  box-sizing: border-box;
  text-align: center;
}
.gvui-status-mark {
  width: 42px;
  height: 42px;
  border-radius: 13px;
  display: grid;
  place-items: center;
  border: 1px solid var(--gv-grid);
  background: color-mix(in srgb, var(--gv-grid) 32%, transparent);
  color: var(--gv-accent);
  font-size: 19px;
  font-family: var(--gv-font);
}
.gvui-status[data-status="error"] .gvui-status-mark {
  color: var(--gv-negative);
}
.gvui-status p {
  margin: 0;
  max-width: 520px;
  font-size: 14px;
  line-height: 1.65;
  color: var(--gv-text);
}
.gvui-status small {
  color: var(--gv-muted);
  font-size: 12px;
}
.gvui-shell {
  width: 100%;
  height: 100%;
  min-height: 330px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--gv-grid) 82%, transparent);
  border-radius: calc(var(--gv-radius) + 6px);
  background: var(--gv-background);
}
.gvui-shell-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 10px;
  border-bottom: 1px solid color-mix(in srgb, var(--gv-grid) 78%, transparent);
  background: color-mix(in srgb, var(--gv-background) 90%, var(--gv-grid));
}
.gvui-shell-tabs,
.gvui-shell-actions {
  display: flex;
  align-items: center;
  gap: 5px;
}
.gvui-shell-tab,
.gvui-shell-action {
  appearance: none;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--gv-muted);
  padding: 7px 11px;
  font: 600 12px/1 var(--gv-font);
  cursor: pointer;
  transition: color 140ms ease, background-color 140ms ease;
}
.gvui-shell-tab:hover,
.gvui-shell-action:hover {
  color: var(--gv-text);
  background: color-mix(in srgb, var(--gv-grid) 42%, transparent);
}
.gvui-shell-tab.is-active {
  color: var(--gv-background);
  background: var(--gv-text);
}
.gvui-shell-action[disabled] {
  opacity: 0.35;
  cursor: default;
}
.gvui-shell-chart {
  flex: 1;
  min-height: 280px;
  overflow: hidden;
}
.gvui-shell-code {
  flex: 1;
  min-height: 280px;
  overflow: auto;
  margin: 0;
  padding: 18px 20px 28px;
  box-sizing: border-box;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  color: var(--gv-text);
  background: var(--gv-background);
  font: 12.5px/1.65 "SFMono-Regular", "JetBrains Mono", "Noto Sans Mono", monospace;
}
.gvui-hidden {
  display: none !important;
}
.gvui-zoom-indicator {
  min-width: 38px;
  text-align: center;
  color: var(--gv-muted);
  font: 600 11px/1 var(--gv-font);
  font-variant-numeric: tabular-nums;
}
.gvui-summary {
  padding: 10px 24px 26px;
  line-height: 1.75;
  font-size: 14px;
  overflow-wrap: anywhere;
}
.gvui-summary-title {
  padding-left: 0;
  padding-right: 0;
}
.gvui-summary-heading {
  margin: 20px 0 8px;
  color: var(--gv-text);
  font-size: 15px;
  line-height: 1.45;
}
.gvui-summary-paragraph {
  margin: 10px 0;
}
.gvui-summary-list {
  margin: 10px 0;
  padding-left: 22px;
}
.gvui-summary li {
  margin: 4px 0;
}
.gvui-summary blockquote {
  margin: 14px 0;
  padding: 8px 0 8px 16px;
  border-left: 3px solid var(--gv-accent);
  color: var(--gv-muted);
}
.gvui-summary-rule {
  margin: 18px 0;
  border: 0;
  border-top: 1px solid var(--gv-grid);
}
.gvui-summary-code {
  padding: 2px 5px;
  border-radius: 5px;
  background: color-mix(in srgb, var(--gv-grid) 48%, transparent);
  font: 0.92em/1.4 "SFMono-Regular", "JetBrains Mono", monospace;
}
.gvui-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin: 0 2px;
  padding: 1px 7px;
  border-radius: 999px;
  color: var(--gv-accent);
  background: color-mix(in srgb, var(--gv-accent) 13%, transparent);
  font-weight: 650;
  font-variant-numeric: tabular-nums;
  box-decoration-break: clone;
}
.gvui-chip.pos {
  color: var(--gv-positive);
  background: color-mix(in srgb, var(--gv-positive) 14%, transparent);
}
.gvui-chip.neg {
  color: var(--gv-negative);
  background: color-mix(in srgb, var(--gv-negative) 14%, transparent);
}
.gvui-chip.meta {
  color: var(--gv-total);
  background: color-mix(in srgb, var(--gv-total) 13%, transparent);
}
.gvui-spark {
  width: 54px;
  height: 18px;
  overflow: visible;
}
.gvui-liquid {
  display: grid;
  align-content: center;
  justify-items: center;
  min-height: 360px;
  padding: 18px 20px 30px;
  box-sizing: border-box;
}
.gvui-liquid .gvui-custom-title {
  padding: 0;
}
.gvui-liquid-svg {
  width: min(430px, 88%);
  max-height: 440px;
}
.gvui-liquid-value {
  font-size: 40px;
  font-weight: 700;
  letter-spacing: -0.04em;
}
.gvui-liquid-caption {
  font-size: 12px;
  letter-spacing: 0.12em;
}
.gvui-liquid-remain {
  font-size: 11px;
}
.gvui-liquid-wave {
  animation: gvui-wave 5.2s ease-in-out infinite alternate;
  transform-origin: center;
}
.gvui-liquid-wave-back {
  animation-duration: 7.4s;
  animation-direction: alternate-reverse;
}
@keyframes gvui-wave {
  from { transform: translateX(-7px) translateY(2px); }
  to { transform: translateX(9px) translateY(-3px); }
}
.gvui-venn,
.gvui-fishbone,
.gvui-mindmap,
.gvui-indented-tree {
  padding-bottom: 12px;
}
.gvui-venn-value {
  fill: var(--gv-text);
  font-size: 16px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.gvui-venn-caption {
  fill: var(--gv-muted);
  font-size: 10px;
}
.gvui-venn-name {
  fill: var(--gv-text);
  font-size: 14px;
  font-weight: 650;
}
.gvui-venn-circle {
  mix-blend-mode: multiply;
}
.gvui-mind-root {
  fill: var(--gv-text);
  font-size: 15px;
  font-weight: 700;
}
.gvui-mind-branch {
  fill: var(--gv-text);
  font-size: 12px;
  font-weight: 650;
}
.gvui-mind-leaf {
  fill: var(--gv-muted);
  font-size: 11px;
}
.gvui-tree-root,
.gvui-tree-label {
  fill: var(--gv-text);
  font-size: 12px;
}
.gvui-tree-root {
  font-weight: 700;
}
.gvui-fish-main {
  fill: var(--gv-text);
  font-size: 12px;
  font-weight: 650;
}
.gvui-fish-child {
  fill: var(--gv-muted);
  font-size: 10px;
}
.gvui-graph {
  padding-bottom: 12px;
}
.gvui-flow-node-label {
  fill: var(--gv-text);
  font-size: 13px;
  font-weight: 650;
}
.gvui-org-node-label {
  fill: var(--gv-text);
  font-size: 12px;
  font-weight: 650;
}
.gvui-org-node-description {
  fill: var(--gv-muted);
  font-size: 9.5px;
}
.gvui-radar-label {
  fill: var(--gv-text);
  font-size: 12px;
  font-weight: 600;
}
.gvui-graph-edge-label text {
  fill: var(--gv-muted);
  font-size: 10px;
}
.gvui-fish-effect {
  font-size: 14px;
  font-weight: 700;
}
@media (max-width: 700px) {
  .gvui-shell-bar {
    align-items: flex-start;
    flex-direction: column;
  }
  .gvui-shell-actions {
    width: 100%;
    justify-content: flex-end;
  }
  .gvui-data-ui[data-chart-type="table"] .vue-ui-table thead tr:nth-child(n + 2) {
    display: none;
  }
  .gvui-data-ui[data-chart-type="table"] .vue-ui-table th,
  .gvui-data-ui[data-chart-type="table"] .vue-ui-table td {
    padding-left: 6px;
    padding-right: 6px;
    font-size: 12px;
  }
  .gvui-summary {
    padding-left: 18px;
    padding-right: 18px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .gvui-liquid-wave {
    animation: none;
  }
  .gvui-view,
  .gvui-chart-host {
    transition: none;
  }
}
`;
