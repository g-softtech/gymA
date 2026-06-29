# AI Developer Rules: CortexFit Gym OS

## Theme-Safe UI Rule

CortexFit uses a unified theme system with `next-themes` and Tailwind CSS variables.

**DO NOT** mix uncontrolled Tailwind dark classes (e.g., `dark:bg-gray-900`, `dark:text-white`) blindly. This leads to inconsistent theming and duplicate styling logic.

**REQUIRED PATTERN:**
All new UI must use either:
1. **Semantic tokens** via Tailwind classes (`bg-background`, `text-foreground`, `bg-card`, `border-border`, `text-muted-foreground`)
2. **CSS variables** (`var(--background)`, `var(--primary)`) if custom styling is needed.

The single source of truth for theming is `app/globals.css`, which defines `:root` and `.dark` variables and maps them to Tailwind `@theme inline`.
