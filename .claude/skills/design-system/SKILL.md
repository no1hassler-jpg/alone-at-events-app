name: design-system
description: Use whenever building, editing, or reviewing any screen, component, or visual element in this app. Defines the app's colors, typography, shapes, and component styling rules. Always apply these instead of inventing new visual choices.

Alone at Events — Design System

This app's visual identity is playful, colorful, and expressive — closer to Partiful or a festival poster than a typical dark-mode utility app. It should feel like it belongs at a night out, not in a spreadsheet. Avoid anything that reads as "corporate SaaS dark mode" (flat near-black backgrounds, muted grays, restrained cool-toned accents).

Colors

* Signature background treatment: a diagonal or radial gradient from magenta/hot pink into orange, evoking a sunset. Use this as the primary background on key screens (Home, Event Detail, Profile) rather than a flat color. Example: `linear-gradient(135deg, #FF2E93 0%, #FF6B35 100%)`.
* Primary accent (buttons, active states, key interactive elements): hot pink/coral — `#FF2E93` or similar. Should feel loud and confident, not muted.
* Text and secondary UI (cards, input fields, nav bars): deep purple, near-black — `#1A0F2E` or similar. Used for readability and contrast against the gradient, not as a competing bright color.
* Success/confirmation states: a warm, energetic green (not clinical/medical green) — e.g. `#00D084`.
* Danger/report/block actions: keep genuinely red, not pink-adjacent, so it's unambiguous — e.g. `#E63946`.
* Avoid: muted grays, navy blues, anything that reads as "productivity app."

Shapes & components

* Bold and chunky, not soft or pill-shaped. Buttons and cards use moderate border radius (think 12-16px, not fully rounded pills) combined with strong color fills or bold outlines.
* High contrast is a feature, not a flaw. Elements should feel confident — solid color blocks, clear borders, not subtle drop shadows or low-contrast tonal variation.
* Cards (event listings, chat previews): solid deep-purple or white fill, bold enough border/shadow to feel tactile, sit clearly on top of the gradient background.
* Buttons: solid accent-color fill for primary actions, bold outline style for secondary actions. Avoid thin, understated buttons.

Typography

* Headings should feel confident and a bit playful — bold weights, slightly larger than a typical utility app.
* Body text stays highly readable — don't sacrifice legibility for style; use the deep-purple/near-black tone against light or white card surfaces, and white/light text directly on the gradient.

What to avoid

* Flat black or flat white backgrounds as the default screen background.
* Muted, desaturated, "safe" color choices.
* Thin borders, subtle shadows, minimal-style restraint — this app should feel bold, not quiet.
* Generic Material Design or iOS-default styling without customization.

When building or editing UI
Before writing any screen or component styling, check this file. If a design decision isn't covered here (e.g. a new screen type), make a choice consistent with this system and flag it to the user as a new pattern being introduced, rather than silently picking something that clashes.
