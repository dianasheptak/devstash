# AI Interaction Guidelines

## Communication

- Be concise and direct
- Explain non-obvious decisions briefly
- Ask before large refactors or architectural changes
- Don't add features not in the project spec
- Never delete files without clarification

## Workflow

This is the common workflow that we will use for every single feature/fix:

1. **Document** - Document the feature in @context/current-feature.md.
2. **Branch** - Create new branch for feature, fix, etc
3. **Implement** - Implement the feature/fix that I create in @context/current-feature.md
4. **Test** - Verify it works in the browser. When the change touches server actions or utilities in `src/lib/**`, add or update Vitest tests next to the module (`*.test.ts`). Run `npm run test:run` and `npm run build` and fix any failures. Do **not** write tests for React components.
5. **Iterate** - Iterate and change things if needed
6. **Commit** - Only after tests pass, build passes, and everything works
7. **Merge** - Merge to main
8. **Delete Branch** - Delete branch after merge
9. **Review** - Review AI-generated code periodically and on demand.
10. Mark as completed in @context/current-feature.md and add to history

Do NOT commit without permission and until the build passes and tests pass. If either fails, fix the issues first.

## Testing

- Framework: **Vitest** (`npm run test`, `npm run test:run`)
- Scope: **server actions and utilities only**. Co-locate tests next to the module (e.g. `src/lib/foo.ts` → `src/lib/foo.test.ts`)
- We do **not** unit-test React components. `.test.tsx` files are excluded by `vitest.config.ts`
- Prefer pure-function tests. For modules that touch Prisma / network / `next-auth`, mock with `vi.mock()` at the import boundary rather than hitting the real service

## Branching

We will create a new branch for every feature/fix. Name branch **feature/[feature]** or **fix[fix]**, etc. Ask to delete the branch once merged.

## Commits

- Ask before committing (don't auto-commit)
- Use conventional commit messages (feat:, fix:, etc.)
- Keep commits focused (one feature/fix per commit)
- Never put "Generated With Claude" or "Co-Authored-By" in the commit messages

## When Stuck

- If something isn't working after 2-3 attempts, stop and explain the issue
- Don't keep trying random fixes
- Ask for clarification if requirements are unclear

## Code Changes

- Make minimal changes to accomplish the task
- Don't refactor unrelated code unless asked
- Don't add "nice to have" features
- Preserve existing patterns in the codebase

## Code Review

Review AI-generated code periodically, especially for:

- Security (auth checks, input validation)
- Performance (unnecessary re-renders, N+1 queries)
- Logic errors (edge cases)
- Patterns (matches existing codebase?)