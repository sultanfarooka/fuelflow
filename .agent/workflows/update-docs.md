---
description: Complete workflow for updating project documentation and keeping .cursorrules in sync
---

# Update Documentation Workflow

Use this workflow when you need to add a new feature, modify an existing feature, remove a feature, or update any project documentation. This workflow ensures all documentation files stay synchronized.

## 🚀 How to Use

**Mode A – Doc-driven (you changed docs/specs):**  
*"Help me update the docs using the update-docs workflow"* or *"Follow the update-docs workflow to document this change"*

**Mode B – Code-driven (sync PRD from codebase):**  
*"Sync project state with PRD"* or *"Update PRD to match current codebase"*

The AI will guide you through each step and help complete tasks automatically.

---

## When to Use

- Adding a new module or feature
- Changing business rules or specifications
- Removing deprecated functionality
- Making architectural decisions
- Updating technology stack
- Changing code conventions or patterns
- Any significant documentation updates
- **PRD may be out of date with the codebase** (use Mode B)

---

## Mode B: Sync PRD from Codebase

Use this mode when the **codebase is the source of truth** and you want the PRD to reflect what actually exists.

**Trigger:** *"Sync project state with PRD"* or *"Update PRD to match current codebase"*

### B1. Discovery Checklist

Run before sync to discover what exists in the codebase:

| Source | What to Extract |
|:--|:--|
| `FuelFlow.Api/Controllers/*.cs` | Endpoints (route + method), auth requirements |
| `FuelFlow.Application/DTOs/**/*.cs` | Request/response shapes for samples |
| `FuelFlow.Infrastructure/Migrations/*.cs` | New tables, columns (for Key Entities) |
| `*.csproj` (server) | Tech versions (ASP.NET, EF Core, MediatR, FluentValidation) |
| `FuelFlow.Domain/Entities/*.cs` | New entities for schema diagram |

**Discovery commands:**
```bash
# List controllers
ls server/FuelFlow.Api/Controllers/

# List DTOs
ls server/FuelFlow.Application/DTOs/

# List migrations (exclude Designer)
ls server/FuelFlow.Infrastructure/Migrations/*.cs

# Inspect package versions
grep -r "PackageReference\|TargetFramework" server/*.csproj
```

### B2. Comparison Checklist

Compare PRD with discovered codebase:

- [ ] PRD auth endpoints vs `AuthController` (paths, methods)
- [ ] PRD tech versions vs `.csproj` package versions
- [ ] PRD Key Entities vs entities in Domain + migrations
- [ ] PRD Development Phases vs implemented features (e.g. auth, dashboard)
- [ ] PRD sample requests vs DTOs (e.g. `RegisterRequest`)

### B3. Update Rules

Apply these updates to PRD when codebase differs:

| If codebase has… | Update PRD… |
|:--|:--|
| Different endpoint path | Fix path to match controller route |
| New controller/endpoint | Add to endpoint table with status "Implemented" |
| New entity/migration | Add to Key Entities list |
| Different package version | Update tech stack table |
| Implemented feature | Mark Development Phase task as ✅ |

### B4. After Sync

- [ ] Update `docs/IMPLEMENTATION_STATUS.md` – mark implemented phases, add endpoints, update "Next up"
- [ ] Run Step 3 (Sync `.cursorrules`) if tech stack or patterns changed
- [ ] Run Step 4 (CHANGELOG) if significant updates
- [ ] Run Step 5 (Final Verification)

---

## Mode A: Complete Workflow Steps (Doc-Driven)

### Step 1: Understand the Change
- [ ] Clarify exactly what is being added/modified/removed
- [ ] Identify which modules are affected
- [ ] Understand the "why" behind the change (document this in CHANGELOG)
- [ ] Determine if CHANGELOG entry is needed (major changes, new features, tech stack changes)

---

### Step 2: Update Source Documents

#### Update docs/ProjectOverView.md (if business requirements changing)
- [ ] Add/modify the feature in the relevant module section
- [ ] Keep descriptions **high-level** (what it does, not how it's built)
- [ ] Update Table of Contents if adding/removing sections
- [ ] Maintain consistent formatting with existing sections
- [ ] Update version/date at top if major changes

#### Update docs/PRD.md (if technical specs changing)
- [ ] Add **technical specifications**:
  - Database tables/columns affected
  - New API endpoints with request/response formats
  - Business validation rules
  - Error handling requirements
- [ ] Add **UI specifications** if screens are affected
- [ ] Update status table at the top if section status changes
- [ ] Update version number and date at top if major changes
- [ ] Update Development Phases status table if applicable

#### Update docs/IMPLEMENTATION_STATUS.md (if implementation changed)
- [ ] Update "Where to Continue" if next task changed
- [ ] Mark completed tasks ✅ in Phase 1 Progress
- [ ] Add new endpoints to "Implemented Endpoints" table
- [ ] Update "Current State Summary" (Backend/Frontend/Database)
- [ ] Update `Last Updated` date

---

### Step 3: Sync `.cursorrules` File

Review and update `.cursorrules` based on changes made to PRD/ProjectOverview:

#### Check Each Section:

**Technology Stack** (`docs/PRD.md` Section 1)
- [ ] Are all technologies listed correctly?
- [ ] Any new libraries or versions added?
- [ ] Any technology removed or replaced?

**Architecture Principles** (`docs/PRD.md` Section 2)
- [ ] Multi-tenancy approach still accurate?
- [ ] Project structure matches current codebase?
- [ ] Any new architectural patterns?

**API Conventions** (`docs/PRD.md` Section 4)
- [ ] Base URL, format, auth still correct?
- [ ] Response format examples still valid?
- [ ] Any new conventions added?

**Database Conventions** (`docs/PRD.md` Section 3)
- [ ] Naming conventions still accurate?
- [ ] Key entities list up to date?
- [ ] Multi-tenancy patterns still correct?

**Business Rules** (`docs/PRD.md` Section 5)
- [ ] All rule IDs (SH-001, PR-001, etc.) still accurate?
- [ ] Any new business rules added?
- [ ] Any rules changed or removed?

**Code Standards** (Frontend/Backend)
- [ ] Code examples still valid?
- [ ] Any new patterns or conventions?
- [ ] Any deprecated practices removed?

**UI/UX Guidelines**
- [ ] Component library still accurate?
- [ ] Responsive breakpoints still correct?
- [ ] Dark mode implementation still accurate?
- [ ] Localization settings still correct?

**Common Patterns**
- [ ] Code examples still work?
- [ ] Any new patterns to add?
- [ ] Any outdated patterns to remove?

**Key Modules Reference**
- [ ] All modules listed accurately?
- [ ] New modules added if applicable?

#### Update Version Tracking in `.cursorrules` Header:
- [ ] Update `Last Updated` date
- [ ] Update `Last Synced with PRD` version and date
- [ ] Update `Last Synced with Project Overview` version and date

---

### Step 4: Update docs/CHANGELOG.md

**When to Add CHANGELOG Entry:**
- ✅ Major feature additions
- ✅ Technology stack changes
- ✅ Architecture changes
- ✅ Significant business rule changes
- ✅ Breaking changes
- ❌ Minor typo fixes (unless they affect implementation)
- ❌ Small clarifications (unless they affect implementation)

**CHANGELOG Format:**
- [ ] Add new entry at the **top** of the file (newest first)
- [ ] Use today's date in format: YYYY-MM-DD
- [ ] Follow semantic versioning:
  - **MAJOR** (X.0.0): Breaking changes, major rewrites, architecture changes
  - **MINOR** (x.Y.0): New features, modules, significant additions
  - **PATCH** (x.y.Z): Bug fixes, clarifications, small updates
- [ ] Categorize changes:
  - **Added**: New features
  - **Changed**: Modifications to existing features
  - **Deprecated**: Features to be removed in future
  - **Removed**: Features removed in this version
  - **Fixed**: Bug fixes
  - **Technical Decisions**: Document the reasoning behind important choices
  - **Why These Choices?**: Explain significant decisions

**Example:**
```markdown
## [1.2.0] - 2026-02-08

### Added
- Dark mode support guidelines in cursor rules
- New API endpoint for CNG sales

### Changed
- Updated UI/UX Guidelines section in cursor rules
- Improved error handling in shift management

### Technical Decisions
- Added workflow for keeping docs in sync
```

---

### Step 5: Final Verification

Before committing, verify:

- [ ] PRD.md and ProjectOverView.md are updated (source of truth)
- [ ] `.cursorrules` reflects key changes from PRD/Overview
- [ ] `.cursorrules` version tracking updated
- [ ] CHANGELOG.md entry added (if warranted)
- [ ] Module names match across all documents
- [ ] Version numbers are consistent
- [ ] No broken internal references
- [ ] File dates/logic are consistent
- [ ] New features appear in all relevant documents
- [ ] `docs/IMPLEMENTATION_STATUS.md` reflects current state (if implementation changed)

---

### Step 6: Commit Changes

Commit all related files together:

```bash
git add docs/PRD.md docs/ProjectOverView.md docs/IMPLEMENTATION_STATUS.md .cursorrules docs/CHANGELOG.md
git commit -m "docs: [brief description] - update docs and sync cursor rules"
```

**Commit Message Format:**
- `docs: add [feature] - update docs and sync cursor rules`
- `docs: update [section] - sync all documentation`
- `docs: [version bump] - major updates, sync all docs`

---

## Examples

### Example 1: Adding a New Module

**User says:** "Add CNG Sales as a core module"

**Actions:**
1. ✅ Update `docs/ProjectOverView.md` - Add Module 11: CNG Sales with full details
2. ✅ Update `docs/PRD.md` - Add CNG Sales section with DB schema, APIs, business rules
3. ✅ Sync `.cursorrules` - Add CNG to Key Modules Reference, update any new patterns
4. ✅ Update `.cursorrules` version tracking
5. ✅ Update `docs/CHANGELOG.md` - Add entry: `## [1.3.0] - 2026-XX-XX` → Added: CNG Sales Module
6. ✅ Verify CNG appears in Table of Contents and module lists
7. ✅ Commit all files together

---

### Example 2: Adding Dark Mode Support

**User says:** "Add dark mode support guidelines"

**Actions:**
1. ✅ Update `docs/PRD.md` - Add dark mode to UI Specifications section
2. ✅ Sync `.cursorrules` - Add Dark Mode section under UI/UX Guidelines
3. ✅ Update `.cursorrules` version tracking
4. ✅ Update `docs/CHANGELOG.md` - Add entry with dark mode addition
5. ✅ Commit all files together

---

### Example 3: Technology Stack Update

**User says:** "Update React to 18.3.0 and TanStack Query to 5.15.0"

**Actions:**
1. ✅ Update `docs/PRD.md` - Update technology versions in Section 1
2. ✅ Sync `.cursorrules` - Update Technology Stack section
3. ✅ Update `.cursorrules` version tracking
4. ✅ Update `docs/CHANGELOG.md` - Add entry: `## [1.1.1] - 2026-XX-XX` → Changed: Updated dependencies
5. ✅ Commit all files together

---

### Example 4: Sync PRD from Codebase (Mode B)

**User says:** "Sync project state with PRD"

**Actions:**
1. ✅ Run Discovery (B1) – List controllers, DTOs, migrations, .csproj versions
2. ✅ Run Comparison (B2) – Compare PRD endpoints vs AuthController, DashboardController; tech versions vs packages; Key Entities vs migrations
3. ✅ Apply updates (B3) – Fix endpoint paths (e.g. `/auth/refreshToken` not `/auth/refresh`), add missing endpoints, update versions, mark implemented phases
4. ✅ Update `docs/IMPLEMENTATION_STATUS.md` – mark implemented phases, add endpoints, update "Next up"
5. ✅ Sync `.cursorrules` if tech stack changed
6. ✅ Update `docs/CHANGELOG.md` – Add entry for PRD sync
7. ✅ Commit all files together

---

### Example 5: After Implementing a Feature

**User says:** "I just implemented Station CRUD. Update the docs."

**Actions:**
1. ✅ Update `docs/PRD.md` – Add endpoint status if needed (or already in PRD)
2. ✅ Update `docs/IMPLEMENTATION_STATUS.md` – Mark 1.6 ✅; add Station endpoints to Implemented table; update "Next up" to 1.7
3. ✅ Update `.cursorrules` version tracking if needed
4. ✅ Update `docs/CHANGELOG.md` – Add entry: Added Station CRUD
5. ✅ Commit all files together

---

## Quick Reference: What Goes Where

| Content Type | PRD.md | ProjectOverView.md | .cursorrules | CHANGELOG.md | IMPLEMENTATION_STATUS.md |
|-------------|--------|-------------------|--------------|--------------|--------------------------|
| **Tech Stack Details** | ✅ Full specs | ❌ | ✅ Summary | ✅ If changed | ❌ |
| **Database Schema** | ✅ Complete | ❌ | ✅ Conventions only | ✅ If changed | ❌ |
| **API Endpoints** | ✅ All endpoints | ❌ | ✅ Conventions only | ✅ If changed | ✅ Implemented list |
| **Business Rules** | ✅ All rules | ✅ High-level | ✅ Key rules | ✅ If changed | ❌ |
| **Module Descriptions** | ❌ | ✅ Detailed | ✅ Reference only | ✅ If new | ❌ |
| **Code Examples** | ❌ | ❌ | ✅ Common patterns | ❌ | ❌ |
| **Architecture Patterns** | ✅ Detailed | ✅ High-level | ✅ Summary | ✅ If changed | ❌ |
| **UI Specifications** | ✅ Detailed | ✅ High-level | ✅ Guidelines | ✅ If changed | ❌ |
| **Implementation Status** | ❌ | ❌ | ❌ | ❌ | ✅ What's done, next up |

---

## Best Practices

1. **Always update source docs first** (PRD.md or ProjectOverView.md) – for Mode A
2. **For sync from codebase (Mode B):** Controllers = endpoint source of truth; migrations = schema source of truth
3. **Keep .cursorrules lean** - it's a reference, not a duplicate
4. **Update CHANGELOG for significant changes** - helps track project evolution
5. **Commit related changes together** - keeps history clean
6. **Review verification checklist** - prevents inconsistencies
7. **Update version tracking** - makes it easy to see when files were last synced
8. **Always explain the "why"** behind changes, not just the "what"
9. **Keep ProjectOverView.md readable** by non-technical stakeholders
10. **PRD.md should have enough detail** for a developer to implement without ambiguity

---

## Troubleshooting

**Q: Do I need to update .cursorrules for every PRD change?**
A: No, only for changes that affect AI assistance (tech stack, conventions, patterns, business rules). Detailed specs stay in PRD.

**Q: When should I update CHANGELOG?**
A: For user-facing changes, major technical decisions, or significant updates. Minor clarifications don't need CHANGELOG entries.

**Q: What if I forget to sync?**
A: Review the "Last Synced" dates in .cursorrules header. If they're outdated, run through the sync checklist (Step 3).

**Q: Can I skip steps if it's a small change?**
A: Yes, but always update the source docs (PRD/ProjectOverview) and version tracking in .cursorrules. CHANGELOG is optional for minor changes.

**Q: When should I use Mode B (Sync from Codebase)?**
A: When PRD may have drifted from the code—e.g. you implemented features but didn't update docs, or endpoint paths differ. Mode B discovers what exists and updates PRD to match.
