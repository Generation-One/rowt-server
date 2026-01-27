# CLAUDE.md — Rowt Server

## Project Memory

This project uses Mai's memory system to track coding sessions. At the end of every session, save a summary using the `save_project_memory` MCP tool.

### How to save

Call `save_project_memory` with:
- **project**: `rowt-server`
- **title**: Kebab-case summary (e.g., `fix-order-status-sync`)
- **summary**: Markdown with this structure:

```markdown
# Title

**Date:** YYYY-MM-DD
**Project:** Rowt Server
**Topic:** One-line description
**Technologies:** Relevant tech
**Branch:** branch-name
**Commits:** list of SHAs if applicable

## Summary
What was done, 2-4 paragraphs.

## Key Decisions
- Decision and rationale

## Files Changed
- Path → what changed

## Next Steps
- What's left to do
```

### When to save
- End of every coding session
- After significant milestones mid-session
- When switching to a different area of the codebase

### Reading context
Use `read_project_memory` to check what's already been recorded before starting work. This helps you understand recent changes and decisions.
