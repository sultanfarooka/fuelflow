# Agent Workflows

This directory contains workflows to help maintain consistency and follow best practices when working on the Fuel Flow project.

## Main Workflow

### **update-docs.md** (Complete Documentation Workflow)
A comprehensive workflow that covers:
- Updating `docs/PRD.md` and `docs/ProjectOverView.md`
- Syncing `.cursorrules` with documentation changes
- Updating `docs/CHANGELOG.md` when needed
- Verification and commit steps

**When to use:** 
- Adding new features, modules, or business rules
- Updating technology stack or architecture
- Changing code conventions or patterns
- Any significant documentation updates

**Quick trigger:** Ask AI: *"Help me update the docs using the update-docs workflow"* or *"Follow the update-docs workflow to document this change"*

---

## How to Use the Workflow

### Method 1: AI-Assisted (Recommended)

Simply ask Cursor AI to follow the workflow:

```
"Help me update the docs using the update-docs workflow"
"I updated the PRD, help me sync everything using the workflow"
"Follow the update-docs workflow to document this new feature"
"I'm adding a new module, use the update-docs workflow"
```

The AI will:
1. Read the workflow file
2. Guide you through each step
3. Help complete tasks automatically where possible
4. Ensure all files stay synchronized

### Method 2: Manual

1. Open `.agent/workflows/update-docs.md`
2. Follow the step-by-step instructions
3. Use the checklists to track your progress
4. Complete verification steps
5. Commit all related files together

---

## Workflow Structure

The workflow includes:
- **When to Use** - When this workflow applies
- **Complete Step-by-Step Instructions** - Detailed guidance for all documentation updates
- **Checklists** - Track your progress through each step
- **Examples** - Real-world scenarios (adding modules, tech updates, etc.)
- **Quick Reference Table** - What content goes where
- **Best Practices** - Tips and recommendations
- **Troubleshooting** - Common questions and answers

---

## Workflow Steps Overview

1. **Understand the Change** - Clarify what's being updated
2. **Update Source Documents** - PRD.md and/or ProjectOverView.md
3. **Sync .cursorrules** - Keep AI context up to date
4. **Update CHANGELOG.md** - Document significant changes
5. **Final Verification** - Ensure consistency across all files
6. **Commit Changes** - Commit all related files together

---

## Tips

1. **Use AI assistance** - The workflow is designed to work with Cursor AI
2. **Follow steps in order** - Steps are designed to be completed sequentially
3. **Use checklists** - They help ensure nothing is missed
4. **Review examples** - They show how the workflow applies to real scenarios
5. **Always update source docs first** - PRD.md and ProjectOverView.md are the source of truth
6. **Keep .cursorrules lean** - It's a reference guide, not a duplicate of PRD

---

## Need Help?

**For any documentation updates:**
- Use `.agent/workflows/update-docs.md` - It covers everything!

**Quick reference:**
- The workflow includes a "Quick Reference" table showing what content goes where
- Examples are included for common scenarios
- Troubleshooting section answers common questions
