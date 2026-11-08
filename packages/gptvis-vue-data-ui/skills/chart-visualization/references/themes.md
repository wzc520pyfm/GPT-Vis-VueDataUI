# Theme support

`gptvis-vue-data-ui` has four built-in themes:

| Name | Look |
| --- | --- |
| `default` | Warm off-white background, blue primary |
| `light` | Alias of `default` |
| `dark` | Deep green-black background, bright category colors |
| `academy` | Warm paper background, classic academic palette |

Do not assume GPT-Vis presets such as `gpt-vis`, `pop`, `midnight`, `paper`,
`product`, `neon-circuit`, `terra-print`, `mono-signal`, `candy-pop`, or
`bauhaus` exist in this adapter.

For a brand palette, pass a `ThemeSpec` object to `theme`:

```ts
const theme = {
  id: 'brand-report',
  label: 'Brand Report',
  baseTheme: 'default',
  tokens: {
    colorBackground: '#F8F6F0',
    colorText: '#10231F',
    colorTextSecondary: '#65736E',
    colorStroke: '#DDE2DC',
    colorSurface: '#112622',
    colorTextInverse: '#F8F6F0',
    colorDefault: '#0C746C',
    category10: ['#0C746C', '#E47B3F', '#2E5C8A'],
    colorPositive: '#1D7A4D',
    colorNegative: '#B34F43',
    fontFamily: '"Avenir Next", "PingFang SC", sans-serif',
    lineWidth: 2.4,
    radius: 6,
  },
  style: {
    backgroundColor: '#F8F6F0',
    palette: ['#0C746C', '#E47B3F', '#2E5C8A'],
  },
};
```

## Token mapping

| Token | Effect |
| --- | --- |
| `colorBackground` | Chart background |
| `colorText` | Primary text |
| `colorTextSecondary`, `colorNeutral` | Muted text and axis ticks |
| `colorStroke` | Grid lines |
| `colorSurface` | Tooltip background |
| `colorTextInverse` | Tooltip text |
| `category10`, `category20` | Category palette |
| `colorPositive`, `colorNegative` | Positive/negative semantic colors |
| `colorDefault` | Accent color |
| `fontFamily` | Font family |
| `lineWidth` | Line width |
| `radius` | Corner radius token |

`style.backgroundColor` and `style.palette` override resolved tokens.

## Limits

- Only safe color literals are accepted.
- `ThemeSpec.charts` is not applied.
- Function formatters and arbitrary VueDataUI component options are not accepted.
- The adapter does not guarantee pixel-level parity with GPT-Vis/G2 themes.
