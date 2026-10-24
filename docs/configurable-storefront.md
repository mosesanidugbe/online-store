# Configurable Storefront Structure

## Purpose

The storefront should let the store owner change homepage content and arrangement without requiring a code change for every campaign, product selection, or section reorder. The application will keep a small set of supported section types in code and load each page's configuration from persistent storage.

This document records the proposed first version of that design. It does not implement the dashboard, database tables, API routes, or rendering code.

## Design principles

1. **Configuration is data, not executable code.** Store content and settings as data. Do not store arbitrary HTML, JavaScript, component names, or executable templates in the database.
2. **The application owns capabilities; the owner owns content.** Code defines the available section types, validation rules, and rendering behavior. The owner controls supported content, settings, visibility, and ordering.
3. **Render from saved configuration.** The homepage should be assembled from the ordered configuration returned by the backend, rather than from a fixed list of sections in the page component.
4. **Unknown or invalid configuration must fail safely.** Validate settings against the selected section type. An unknown type or invalid configuration should be skipped or handled with a safe fallback and logged, rather than breaking the whole homepage.
5. **Keep the first version small.** Start with a few useful section types. Add new types when a real need appears; don't build a generic page builder prematurely.
6. **Persist owner changes.** The eventual dashboard must save changes to the backend/database. Client-only demo state is not the source of truth.

## Stable vs. owner-configurable

| Stable application responsibilities | Owner-configurable data |
| --- | --- |
| Supported section types and their rendering components | Which supported sections appear on the homepage |
| Validation and defaults for each section type | Section content and supported settings |
| Authentication and owner-only authorization | Section visibility and display order |
| Product, category, and inventory rules | Which products/categories a section references |
| Responsive layout behavior and accessibility | Text, images, links, and other content exposed by a section |
| Safe handling of missing/invalid data | Storefront presentation choices exposed by the configuration model |

A configurable value should not become a hardcoded condition scattered across React components. Conversely, not every implementation detail needs to become a setting: only expose options that are useful to the owner and can be validated.

## First supported homepage section types

Begin with these three types:

### 1. \`hero_banner\`

A prominent introductory or campaign area.

Initial settings/content:
- Heading and optional supporting text
- Image URL, if an image is used
- Optional call-to-action label and destination
- Optional visual variant chosen from a finite set supported by the client

### 2. \`featured_products\`

A product collection selected for emphasis.

Initial settings/content:
- Section heading and optional supporting text
- Product selection or a defined selection rule
- Maximum number of products to show, within a validated limit

Product data itself remains in the products table; the section should reference products rather than duplicate their names, prices, stock, or active state.

### 3. \`category_grid\`

A group of categories that helps customers browse the catalogue.

Initial settings/content:
- Section heading
- Selected categories and/or a supported category-selection rule
- Validated display limit and supported layout variant

The category data model and exact selection behavior can be finalized when category management is designed. Do not hardcode individual category names into the homepage component.

## Proposed section configuration

Each configured homepage section should have a stable identifier and common metadata, plus settings specific to its type. Conceptually:

\`\`\`json
{
  "id": "section-identifier",
  "type": "hero_banner",
  "title": "Summer collection",
  "is_visible": true,
  "display_order": 0,
  "settings": {
    "heading": "Find your next favourite",
    "description": "Explore the latest collection.",
    "image_url": "/images/campaign.jpg",
    "cta_label": "Shop now",
    "cta_href": "/products"
  }
}
\`\`\`

This is an illustrative data contract, not a final database schema. The shared fields are:

- \`id\`: stable identity for editing and reordering a section
- \`type\`: identifier from the allowlisted section-type registry
- \`title\`: owner-facing label in the dashboard; not necessarily visible to customers
- \`is_visible\`: whether the section should be rendered
- \`display_order\`: position relative to other sections
- \`settings\`: validated data specific to the selected type

Use a relational table for common metadata and a JSON/JSONB settings column as a reasonable starting point for type-specific settings. The exact table name, constraints, migration, and API contract should be decided in the implementation task. If configuration grows more complex, revisit the storage model based on actual requirements.

## Rendering and validation flow

The intended flow is:

1. The storefront requests the saved homepage configuration from the backend.
2. The backend returns sections in display order and applies the appropriate validation/authorization rules.
3. The client looks up each section's \`type\` in a fixed registry of supported renderers.
4. Each renderer receives validated settings and fetches or receives referenced product/category data.
5. Invisible sections are not rendered. Unsupported or malformed sections are handled safely without taking down the entire page.
6. The owner dashboard uses the same supported section types and settings definitions to create, edit, hide/show, and reorder sections.
7. Saving changes persists them through owner-authorized API routes, so a reload and a different visitor see the saved state.

The owner dashboard must not be able to submit arbitrary component names or executable content. All write endpoints must enforce the existing owner authorization on the server; hiding controls in the UI is not authorization.

## Placeholder products during development

The products table already has two separate flags:

- \`is_placeholder\`: identifies fictional/test products used during development.
- \`is_active\`: indicates whether a product is eligible for normal display/use; it is not a substitute for identifying placeholder data.

Keep these meanings separate. A placeholder may be active for development demonstrations, while a real product may be inactive. The owner dashboard should make placeholders easy to identify and manage, and the storefront should render product records dynamically instead of relying on hardcoded product arrays.

For development, support creating a small set of fictional products through the owner dashboard and displaying active placeholders so product grids can be exercised end to end. Before production, define an explicit environment/display policy that prevents placeholder products from appearing to real customers by accident. Do not assume that \`is_active = true\` means a placeholder is safe for production display, and do not delete placeholder records merely to hide them from customers.

Placeholder product lifecycle and visibility should be handled independently of homepage section configuration. A featured-products section should reference products or use a validated selection rule; it should not embed a separate copy of product data.

## Suggested implementation sequence

1. Define and validate the first three section types and their settings.
2. Add persistent storage and owner-authorized API endpoints for reading and changing homepage configuration.
3. Implement dynamic storefront rendering from the saved configuration.
4. Build owner-dashboard controls to add supported sections, edit settings, toggle visibility, and reorder sections.
5. Connect product/category sections to database-backed records, including development placeholders.
6. Test persistence, ordering, visibility, invalid configuration handling, owner authorization, and placeholder exclusion from production display.

## Out of scope for this first implementation

- A free-form drag-and-drop page builder
- Arbitrary HTML/CSS/JavaScript authored in the dashboard
- Unlimited section types or deeply nested layouts
- A complete category-management system
- Production deployment changes or automatic deletion of placeholder data

These can be considered later if the store's actual needs justify them.
