# Design System

## Color

使用 CSS 变量实现，基于 OKLCH 理念转换为浏览器兼容的 sRGB 值。

**Strategy**: Restrained -- tinted neutrals + 一个强调色 <=15% 表面。

### Light Mode (`:root`)

| Token | Value | Usage |
|---|---|---|
| `--bg-base` | `#fafafa` | 页面背景 |
| `--bg-surface` | `#ffffff` | 卡片、面板、输入框背景 |
| `--bg-elevated` | `#ffffff` | 浮层、下拉菜单（与 surface 一致，通过边框区分） |
| `--bg-hover` | `#f5f5f5` | 悬停状态背景 |
| `--bg-active` | `#eef2ff` | 激活/选中状态背景（accent subtle） |
| `--border-subtle` | `#e5e5e5` | 默认边框、分割线 |
| `--border-strong` | `#d4d4d4` | 悬停边框 |
| `--border-focus` | `#4f46e5` | 聚焦边框（accent） |
| `--text-primary` | `#171717` | 主标题、正文 |
| `--text-secondary` | `#525252` | 次要文字、标签 |
| `--text-tertiary` | `#737373` | 占位符、禁用、辅助说明 |
| `--text-inverse` | `#ffffff` | 深色背景上的文字 |
| `--accent` | `#4f46e5` | 强调色（靛蓝） |
| `--accent-hover` | `#4338ca` | 强调色悬停 |
| `--accent-subtle` | `#eef2ff` | 强调色浅色背景 |
| `--success` | `#16a34a` | 成功 |
| `--warning` | `#ca8a04` | 警告 |
| `--danger` | `#dc2626` | 危险 |

### Dark Mode (`[data-theme="dark"]`)

| Token | Value | Usage |
|---|---|---|
| `--bg-base` | `#0a0a0a` | 页面背景 |
| `--bg-surface` | `#171717` | 卡片、面板、输入框背景 |
| `--bg-elevated` | `#262626` | 浮层、下拉菜单 |
| `--bg-hover` | `#262626` | 悬停状态背景 |
| `--bg-active` | `#1e1b4b` | 激活/选中状态背景 |
| `--border-subtle` | `#262626` | 默认边框 |
| `--border-strong` | `#404040` | 悬停边框 |
| `--border-focus` | `#6366f1` | 聚焦边框（更亮的 accent） |
| `--text-primary` | `#fafafa` | 主文字 |
| `--text-secondary` | `#a3a3a3` | 次要文字 |
| `--text-tertiary` | `#737373` | 占位符、禁用 |
| `--text-inverse` | `#0a0a0a` | 浅色背景上的文字 |
| `--accent` | `#6366f1` | 强调色（更亮以适应深色背景） |
| `--accent-hover` | `#818cf8` | 强调色悬停 |
| `--accent-subtle` | `#1e1b4b` | 强调色深色背景 |
| `--success` | `#22c55e` | 成功 |
| `--warning` | `#eab308` | 警告 |
| `--danger` | `#ef4444` | 危险 |

## Typography

- **Font stack**: `-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif`
- **Base size**: 14px
- **Line height**: 1.5（正文），1.25（标题）
- **Scale**: 12px / 14px / 16px / 18px / 20px / 24px / 30px（ratio ~1.15-1.2）
- **Font weight**: 400（正文），500（标签、按钮），600（标题）

## Spacing

- **Base unit**: 4px
- **Scale**: 4 / 8 / 12 / 16 / 20 / 24 / 32 / 48 / 64
- **Page padding**: 24px（桌面），16px（移动端）
- **Card padding**: 20px
- **Section gap**: 24px
- **Input padding**: 8px 12px

## Elevation

不使用阴影制造层级。层级通过：
1. 背景色变化（base -> surface -> elevated）
2. 细边框（1px solid border-subtle）

唯一例外：模态框遮罩和下拉菜单使用极轻微阴影：
- Light: `0 4px 24px rgba(0, 0, 0, 0.08)`
- Dark: `0 4px 24px rgba(0, 0, 0, 0.3)`

## Radius

- **Small**（按钮、输入框、标签、分页）：6px
- **Medium**（卡片、下拉面板）：8px
- **Large**（模态框）：12px

## Motion

- **原则**：动画只用于状态过渡的澄清，从不用于装饰
- **缓动**：`cubic-bezier(0, 0, 0.2, 1)`（ease-out 指数曲线）
- **时长**：150ms（微交互），200ms（面板过渡）
- **禁用**：`@media (prefers-reduced-motion: reduce)` 下所有动画为 instant
