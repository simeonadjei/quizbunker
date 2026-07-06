---
name: Mobile select dropdowns — Radix vs native
description: Why Radix Select fails on Android Chrome and the fix applied in the Dashboard.
---

## Rule
Use native `<select>` elements for Year/Subject dropdowns on the Dashboard (and any mobile-critical selects). Do NOT use Radix UI Select for these controls.

## Why
`backdrop-filter: blur()` on `.card-game` and the Navbar promotes elements to GPU compositing layers. On Android Chrome, these compositor layers can paint above Radix's portaled Select dropdown regardless of z-index value. This is a known browser compositing bug — no CSS-only fix is reliable across devices.

## How to apply
- Native `<select>` elements are rendered by the OS picker on mobile, always above all app content.
- Wrap in `relative` div + overlay a `<ChevronDown>` icon (`pointer-events-none absolute right-3`) to restore visual affordance.
- Set `appearance-none` on the select to remove the browser's default arrow.
- Use `colorScheme: 'dark'` inline style so the OS picker uses dark mode on Android.
- Add `htmlFor`/`id` pairing for accessibility.
- Add `disabled={loading || !options.length}` to handle loading/empty states.
