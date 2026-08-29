# 1. Record architecture decisions

Date: 2026-08-28

## Status

Accepted

## Context

This is a portfolio project as much as a product. The _why_ behind each choice
should be legible to a reviewer (and to future me).

## Decision

Keep short ADRs in `docs/adr/`, one per significant choice, in the
[Nygard format](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions).
Numbered, append-only; supersede rather than edit.

## Consequences

- A reviewer can reconstruct the reasoning without archaeology.
- Reversing a decision means a new ADR that supersedes the old one.
