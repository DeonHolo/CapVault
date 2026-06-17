# CapVault V2 Design System

## Product Character

CapVault V2 is an academic operations tool. It should feel focused, quiet, and reliable rather than like a marketing site or a generic dashboard.

The primary workflow is:

1. Sir publishes a deliverable form.
2. Student submits through a public form link.
3. CapVault checks PDF/Drive/link rules.
4. Sir/adviser reviews attention flags.
5. Final accepted PDFs are archived.

## UI Principles

- Build the real workflow as the first screen. Do not use a landing page as the main experience.
- Student submission forms should feel familiar to Google Forms but cleaner and more guided.
- Staff views should be operational and attention-focused.
- Tables should be dense but readable.
- Avoid oversized cards, decorative gradients, marketing copy, and dashboard filler.
- Use visible labels, helper text, inline field errors, loading states, and success states.
- Buttons must have comfortable horizontal padding, clear icons, and at least 44px height.
- Use color as support, not as the only source of meaning.
- Keep page actions predictable and preserve filter/search state.

## Visual Tokens

- Background: `#f6f8fb`
- Surface: `#ffffff`
- Surface muted: `#f1f5f9`
- Text primary: `#0f172a`
- Text secondary: `#475569`
- Border: `#dbe3ef`
- Primary: `#0f766e`
- Primary dark: `#115e59`
- Accent: `#2563eb`
- Warning: `#b45309`
- Danger: `#b91c1c`
- Success: `#047857`
- Radius: 8px for panels and controls, 12px only for large containers
- Shadow: low, diffuse, never floating/glassy

## Typography

- Font family: Inter, Aptos, Segoe UI, system sans-serif
- Body: 14-16px, line-height 1.5
- Labels: 12px uppercase, 600 weight, no negative letter spacing
- Tables: 13-14px with tabular numbers where useful
- Headings: restrained; do not use hero-scale type inside dashboards

## Layout

- Desktop staff shell: left navigation plus top workspace strip.
- Student public form: centered single-column form with grouped sections.
- Mobile: single-column, no horizontal overflow, tables become scroll containers with clear boundaries.
- Use 8px spacing rhythm.
- Avoid cards inside cards.

## Component Rules

- Buttons: icon + text where command meaning benefits from icon; 44px minimum height; 18-24px horizontal padding.
- Inputs/selects/textareas: visible labels; helper/error text below field; focus ring.
- Status chips: small text with border and icon or label; never rely on color alone.
- Tables: sticky headers where helpful, low-contrast dividers, hover/selected state.
- Notifications/attention items: readable two-column rows, never crammed text blocks.

## V2 Navigation

Staff/admin navigation:

- Command Center
- Forms
- Tracker
- Review
- Archive
- Student Status
- Workspace

Public route:

- `/submit/:slug`

