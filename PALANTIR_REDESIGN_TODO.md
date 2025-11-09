# Palantir UI Redesign - Remaining Work

## ✅ Completed (Committed)
- [x] Dark theme color system (globals.css)
- [x] Navigation redesign (header + sidebar, fixed overlap)
- [x] Component styles (cards, buttons, badges)
- [x] Layout spacing (pt-14 pl-56)

## 📋 Remaining Pages to Redesign

### High Priority
1. **Home Page** (app/page.tsx) - 683 lines
   - Update hero section colors
   - Replace ACM brand gradients with Palantir blues
   - Update stat cards to dark theme
   - Replace emojis with SVG icons
   - Update all section backgrounds

2. **Query Page** (app/query/page.tsx)
   - Dark theme input forms
   - Update LLM response cards
   - Dark loading states
   - Button styling

3. **History Page** (app/history/page.tsx)
   - Dark theme list view
   - Update filters/search
   - Card styling

4. **History Details Page**
   - Dark theme layout
   - **ADD: Follow-up questions (like Perplexity)**
   - Update response cards

### Medium Priority
5. **Workflows Page** - Update workflow cards
6. **Ontology Page** - Update knowledge graph viz
7. **Competitors Page** - Update map visualization

### Low Priority
8. **Admin Pages** - Update all admin interfaces

## 🎨 Design Patterns to Apply

### Color Replacements
- `bg-white` → `bg-dark-surface`
- `bg-gray-50` → `bg-dark-bg`
- `text-gray-900` → `text-dark-text`
- `text-gray-600` → `text-dark-text-muted`
- `border-gray-200` → `border-dark-border`
- ACM brand blue → `accent-blue`
- ACM gold → `accent-cyan` or `accent-yellow`

### Component Updates
- Replace emoji icons with heroicons SVGs
- Add subtle border glows on hover
- Use darker shadows
- More technical/data-focused aesthetics

## 🚀 Deployment Strategy
- Complete all page redesigns in this branch
- Test thoroughly
- Single large PR with full Palantir redesign
