# UI Design Skill — Task Design System

> Custom atomic design system. No Shadcn, no component library.
> Stack: Tailwind CSS v4, Urbanist font, Iconsax React icons.

---

## Design Tokens

### Colors

This project uses a **neutral gray / white** palette.
All color variables are defined in `app/app.css` via `@theme`.

```
Background:    --color-bg         → zinc-50  (light base)
Surface:       --color-surface    → white
Border:        --color-border     → zinc-200
Muted text:    --color-muted      → zinc-400
Body text:     --color-text       → zinc-700
Heading:       --color-heading    → zinc-950

Accent primary:  --color-accent   → zinc-950  (buttons, highlights)
Danger:          --color-danger   → red-500
Success:         --color-success  → emerald-500
Warning:         --color-warning  → amber-500
Info:            --color-info     → blue-500
```

In JSX, always use Tailwind semantic tokens:

```
bg-zinc-50     surface: bg-white        border: border-zinc-200
text-zinc-700  muted: text-zinc-400     heading: text-zinc-950
```

### Spacing Scale

Follow Tailwind's default 4px base unit. Prefer:

- `gap-2` / `gap-4` / `gap-6` inside components
- `p-4` / `p-6` for card/panel padding
- `px-4 py-2` for button padding (sm), `px-5 py-2.5` (md), `px-6 py-3` (lg)

### Border Radius

```
Buttons / Inputs / Badges: rounded-lg    (8px)
Cards / Panels:            rounded-xl    (12px)
Feature cards / Modals:    rounded-2xl   (16px)
Dropdowns / Menus:         rounded-2xl   (16px)
Avatars / Dot indicators:  rounded-full
```

### Shadows

```
Card:     shadow-sm   (subtle lift — border-zinc-200 is usually enough)
Dropdown: shadow-lg   (elevated above content)
Modal:    shadow-2xl
```

---

## Typography

**Font: Urbanist** (Google Fonts, loaded in `app/app.css`)

```css
/* Already in app.css */
@import url("https://fonts.googleapis.com/css2?family=Urbanist:wght@400;500;600;700;800&display=swap");
```

### Type Scale

| Role        | Tailwind class            | Usage                      |
| ----------- | ------------------------- | -------------------------- |
| Display     | `text-3xl font-bold`      | Page hero, empty states    |
| H1          | `text-2xl font-bold`      | Page title (PageHeader)    |
| H2          | `text-xl font-semibold`   | Section titles, card heads |
| H3          | `text-base font-semibold` | Sub-sections, list groups  |
| Body        | `text-sm font-normal`     | Default body text          |
| Small/Muted | `text-xs text-zinc-500`   | Labels, captions, hints    |

Always apply `font-medium` on interactive elements (buttons, nav links).

---

## Icons — Iconsax React

### Installation

```bash
pnpm add iconsax-react
```

### Import & Usage

```tsx
import { Home2, Add, Wallet, ReceiptText } from 'iconsax-react'

// Always pass color="currentColor" explicitly — no exceptions
// Then control the actual color via Tailwind text utilities on the parent/element
<Home2 size={20} color="currentColor" />
<Wallet size={20} color="currentColor" variant="Bulk" />
```

### Available Variants

| Variant   | Usage                                   |
| --------- | --------------------------------------- |
| `Linear`  | Default — clean strokes (most used)     |
| `Outline` | Thicker stroke, slightly bolder         |
| `Bold`    | Filled, high emphasis                   |
| `Bulk`    | Two-tone fill (primary + opacity layer) |
| `Broken`  | Broken stroke, stylized                 |
| `TwoTone` | Two distinct colors                     |

### Conventions for this project

```tsx
// Navigation icons: size=20, variant="Bulk" when active, "Linear" when inactive
<Home2 size={20} color="currentColor" variant={isActive ? "Bulk" : "Linear"} />

// Action buttons (inside button elements): size=18
<Add size={18} color="currentColor" />

// Page headers / empty states: size=40, variant="Bulk"
<Wallet size={40} color="currentColor" variant="Bulk" className="text-zinc-400" />

// Inline with text (labels, table cells): size=16
<ReceiptText size={16} color="currentColor" />
```

### Icon color

All icons must have `color="currentColor"`. The actual color is then driven by Tailwind text utilities on the icon or a parent element:

```tsx
<span className="text-zinc-500"><Add size={20} color="currentColor" /></span>
<Danger size={18} color="currentColor" className="text-red-500" />
```

---

## Component Patterns

All components live in `app/components/ui/`. Keep each file under 150 lines.
No `export default` — use named exports only.

---

### Button

```tsx
// app/components/ui/Button.tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

// Variants
const VARIANTS = {
  primary:   'bg-zinc-950 text-white hover:bg-zinc-800',
  secondary: 'bg-white text-zinc-800 hover:bg-zinc-50 border border-zinc-200',
  ghost:     'bg-transparent text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100',
  danger:    'bg-red-500/10 text-red-600 hover:bg-red-500/20 border border-red-200',
}

// Sizes
const SIZES = {
  sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
  md: 'px-4 py-2 text-sm rounded-lg gap-2',
  lg: 'px-5 py-2.5 text-base rounded-lg gap-2',
}

// Usage
<Button variant="primary" size="md" leftIcon={<Add size={16} />}>
  New Invoice
</Button>
<Button variant="secondary">Cancel</Button>
<Button variant="ghost" loading={isSubmitting}>Save</Button>
<Button variant="danger" leftIcon={<Trash size={16} />}>Delete</Button>
```

---

### Badge

```tsx
// app/components/ui/Badge.tsx
interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'muted'
  size?: 'sm' | 'md'
  dot?: boolean
  children: React.ReactNode
}

const BADGE_VARIANTS = {
  default: 'bg-zinc-100 text-zinc-700 border border-zinc-200',
  success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border border-amber-200',
  danger:  'bg-red-50 text-red-600 border border-red-200',
  info:    'bg-blue-50 text-blue-700 border border-blue-200',
  muted:   'bg-zinc-50 text-zinc-400 border border-zinc-200',
}

// Usage
<Badge variant="success" dot>Paid</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="danger">Overdue</Badge>
```

---

### Input / Textarea

```tsx
// app/components/ui/Input.tsx
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  error?: string
  leftIcon?: React.ReactNode
}

// Base classes
const INPUT_BASE = [
  'w-full bg-white border border-zinc-200 rounded-lg',
  'px-3 py-2 text-sm text-zinc-800 placeholder:text-zinc-400',
  'focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400',
  'disabled:opacity-50 disabled:cursor-not-allowed',
].join(' ')

// Error state
const INPUT_ERROR = 'border-red-500/50 focus:ring-red-500/50'

// Usage
<Input label="Client name" placeholder="Acme Corp" error={errors?.name} />
<Input leftIcon={<SearchNormal size={16} />} placeholder="Search..." />
```

---

### Card

```tsx
// app/components/ui/Card.tsx
interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hoverable?: boolean
}

// Base
const CARD_BASE = 'bg-white border border-zinc-200 rounded-xl'
const CARD_PADDING = { none: '', sm: 'p-3', md: 'p-4', lg: 'p-6' }
const CARD_HOVER = 'hover:border-zinc-300 transition-colors cursor-pointer'

// Usage
<Card padding="md">...</Card>
<Card padding="lg" hoverable>...</Card>
```

---

### Modal

```tsx
// app/components/ui/Modal.tsx
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

// Overlay: fixed inset-0 bg-black/40 backdrop-blur-sm z-50
// Panel: bg-white border border-zinc-200 rounded-2xl shadow-2xl
// Sizes: sm=max-w-sm | md=max-w-md | lg=max-w-lg
```

---

### Select

```tsx
// app/components/ui/Select.tsx
// Same base styles as Input, use native <select> with custom styling
const SELECT_BASE = [
  "w-full bg-white border border-zinc-200 rounded-lg",
  "px-3 py-2 text-sm text-zinc-800",
  "focus:outline-none focus:ring-1 focus:ring-zinc-400",
  "appearance-none cursor-pointer",
].join(" ");
```

---

### Dropdown / Menu

```tsx
// app/components/ui/Dropdown.tsx
// Inspired by image 2 — white card, rounded-2xl, generous item padding

// Panel: bg-white border border-zinc-200 rounded-2xl shadow-lg p-1.5 min-w-[200px]
// Item base: flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-700
//            hover:bg-zinc-100 cursor-pointer transition-colors
// Item icon: size=18, color="currentColor", text-zinc-500
// Separator: border-t border-zinc-100 my-1
// Danger item: text-red-600 hover:bg-red-50
```

---

### PageHeader

```tsx
// app/components/layout/PageHeader.tsx
interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode; // Right-side CTA button
}

// Layout: flex justify-between items-start | border-b border-zinc-200 pb-6 mb-6
// Title: text-xl font-semibold text-zinc-950
// Description: text-sm text-zinc-400 mt-1
```

---

### EmptyState

```tsx
// app/components/ui/EmptyState.tsx
interface EmptyStateProps {
  icon: React.ReactNode; // Iconsax icon, size=40, variant="Bulk"
  title: string;
  description?: string;
  action?: React.ReactNode;
}

// Layout: flex flex-col items-center justify-center gap-3 py-16 text-center
// Icon wrapper: p-4 bg-zinc-100 rounded-2xl text-zinc-400 mb-2
// Title: text-base font-semibold text-zinc-700
// Description: text-sm text-zinc-400 max-w-xs
```

---

### Stat Card (Finance module)

```tsx
// app/components/ui/StatCard.tsx
interface StatCardProps {
  label: string;
  value: string; // Pre-formatted currency/number
  trend?: "up" | "down" | "neutral";
  icon: React.ReactNode;
  iconColor?: string; // Tailwind text class e.g. "text-emerald-400"
}

// Layout: Card padding="md", flex gap-4 items-start
// Icon: p-2.5 rounded-lg bg-zinc-100, text-zinc-500 (or iconColor)
// Value: text-2xl font-bold text-zinc-950
// Label: text-xs text-zinc-400 uppercase tracking-wide
```

---

## Sidebar Navigation

```tsx
// Navigation item states
const NAV_LINK_BASE =
  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors";
const NAV_LINK_ACTIVE = "bg-zinc-100 text-zinc-900";
const NAV_LINK_INACTIVE = "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100";

// Icon: size=18, variant="Bulk" active / "Linear" inactive
// Sidebar background: bg-white border-r border-zinc-200
// Sidebar sections with labels:
// text-[10px] font-semibold uppercase tracking-widest text-zinc-400 px-3 mt-6 mb-1
```

---

## Layout Rules

- **Page background**: `bg-zinc-50` (never white directly on body)
- **Page content**: `max-w-6xl mx-auto px-6 py-8`
- **Page greeting header**: `text-2xl font-bold text-zinc-950` + `text-sm text-zinc-400` (style Chariow)
- **Grid layouts**: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`
- **Stat row**: `grid grid-cols-2 lg:grid-cols-3 gap-4`
- **Form max width**: `max-w-2xl`
- **Dividers**: `border-t border-zinc-200`
- **Sidebar width**: `w-60` fixed, `bg-white border-r border-zinc-200 h-screen`

---

## Light-first Approach

This app is **light mode only**. Do not add `dark:` variants.
Background is `zinc-50`, surfaces are `white`. Never use dark/black backgrounds for pages.

---

## DO / DON'T

**DO:**

- Use `text-zinc-400` for secondary/muted text
- Use `border-zinc-200` for all borders
- Use `bg-white` for cards/surfaces, `bg-zinc-50` for page background
- Use `rounded-lg` on inputs/buttons, `rounded-xl` on cards
- Use Iconsax `Bulk` variant for empty states and sidebar active icons
- Always wrap page content in `<PageHeader>` + content area
- Control icon color via Tailwind `className` — always with `color="currentColor"` on the icon

**DON'T:**

- Don't use dark/black backgrounds (light-only app)
- Don't use Shadcn or Radix primitives
- Don't create components over 150 lines — split them
- Don't hardcode colors — use Tailwind utilities
- Don't use `outline` variant buttons — use `secondary` or `ghost`
- Don't repeat icon size/variant inconsistently across a same context
- **Never omit `color="currentColor"` on Iconsax icons** — always pass it explicitly
