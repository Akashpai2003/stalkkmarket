# AI Project Rules

## Project Name

StalkTheMarket

Use this project name consistently across all documentation, planning, architecture, and implementation.

---

## Protected Files

The following files are considered foundational and should never be modified unless explicitly requested by the user.

Protected Files:

* docs/project_context.md
* docs/reference_rules.md

These files define the project's vision and reference system.

Treat them as read only.

---

## Documentation Generation Rules

When generating documentation:

Always use:

* project_context.md
* reference_rules.md
* product_structure.md

as the primary sources of truth.

---

## Reference Analysis

Always analyze:

references/ui/
references/wireframes/
references/inspirations/

before making design decisions.

Extract:

* Layout patterns
* Component patterns
* Typography hierarchy
* Spacing systems
* Interaction patterns

Do not copy designs.

---

## Design Philosophy

StalkTheMarket is not a traditional trading platform.

Avoid creating experiences that resemble:

* TradingView
* Zerodha
* Upstox
* Angel One

The product should feel closer to:

* Perplexity
* Linear
* Modern AI workspaces

---

## Development Workflow

Before creating any feature:

1. Review project_context.md
2. Review reference_rules.md
3. Review product_structure.md
4. Review existing documentation
5. Update progress_log.md

Only then begin implementation.

---

## Missing Documentation

If any documentation file is empty or incomplete:

Generate and populate it automatically using:

* Existing documentation
* Reference folders
* Product structure
* Design principles

without requiring user intervention.

---

## Memory Rules

Always maintain:

docs/memory.md

Track:

* Major decisions
* UI decisions
* Architecture decisions
* Component decisions
* Future features
* Things intentionally avoided

Update after every significant change.

---

## Progress Log Rules

Always maintain:

docs/progress_log.md

After every task record:

Date

Task Completed

Files Modified

Reasoning

Next Step

This file acts as the project's development history.

---

## Current Priority

Current focus:

Build the cleanest possible AI assisted swing trading workspace.

Prioritize:

* Simplicity
* Clarity
* Research workflow
* Opportunity discovery

Avoid:

* Feature bloat
* Excessive charts
* Information overload
* Complex portfolio systems

V1 should be minimal.
