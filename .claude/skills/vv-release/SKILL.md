---
name: vv-release
description: Quick release workflow for VVCode - bump version, build, and package the extension
---

# VVCode Release

Quick release workflow for VVCode - bump version, build, and package the extension.

## Overview

This workflow helps you:
1. Update the version number in package.json
2. Install all dependencies
3. Build the production bundle
4. Generate the VSIX package file

## Step 1: Confirm or Update Version

### 1.1: Check Current Version

First, read the current version from package.json:

```bash
cat package.json | grep '"version"'
```

### 1.2: Ask User to Confirm or Update

Show the current version to the user and ask:
- "当前版本是 X.X.X，是否使用此版本进行发布？"
- If the user confirms: proceed to Step 2 with the current version
- If the user wants to change: ask what version number to release (e.g., 1.1.3, 1.2.0, 2.0.0)

### 1.3: Update Version (if needed)

If the user wants to update the version, use npm version:

```bash
npm version <new-version> --no-git-tag-version
```

For example:
- Patch release (1.1.2 → 1.1.3): `npm version patch --no-git-tag-version`
- Minor release (1.1.2 → 1.2.0): `npm version minor --no-git-tag-version`
- Major release (1.1.2 → 2.0.0): `npm version major --no-git-tag-version`
- Specific version: `npm version 1.1.3 --no-git-tag-version`

Verify the version was updated:

```bash
cat package.json | grep '"version"'
```

### 1.4: Save the Version Number

Save the confirmed/updated version number for use in later steps (changelog, summary, etc.).

## Step 2: Update Changelog

Before building, update the CHANGELOG.md with the new version's changes.

### 2.1: Read Current Changelog

Read the current CHANGELOG.md to see the format and existing entries:

```bash
head -50 CHANGELOG.md
```

### 2.2: Generate Draft Changelog

First, try to auto-generate a draft changelog from git commits since the last release.

#### 2.2.1: Get Last Release Tag

Find the last version tag:

```bash
git tag --list 'v*' --sort=-v:refname | head -1
```

If no tag exists, use the first commit:

```bash
git rev-list --max-parents=0 HEAD
```

#### 2.2.2: Get Commit Messages

Get commits since the last release:

```bash
git log <last-tag-or-first-commit>..HEAD --oneline --no-merges
```

#### 2.2.3: Categorize Commits

Analyze the commit messages and try to categorize them into:
- **Added**: commits with "add", "feat", "feature" keywords
- **Changed**: commits with "change", "update", "refactor" keywords
- **Fixed**: commits with "fix", "bug", "resolve" keywords
- **Deprecated**: commits with "deprecate" keyword
- **Removed**: commits with "remove", "delete" keyword
- **Security**: commits with "security", "vulnerability" keyword

Generate a draft changelog in the format:
```
### Added
- [auto-generated items based on commits]

### Changed
- [auto-generated items based on commits]

### Fixed
- [auto-generated items based on commits]
```

Remove empty categories.

### 2.3: Ask for User Input

Show the auto-generated draft changelog to the user and ask:

"我已根据 git 提交记录自动生成以下 changelog 草稿：

[SHOW DRAFT CHANGELOG]

请选择：
1. 直接使用这个自动生成的版本
2. 在此基础上修改（请告诉我需要修改的内容）
3. 完全手动输入新的 changelog"

Wait for user choice and input:
- If option 1: use the draft as-is
- If option 2: apply the user's modifications to the draft
- If option 3: ask the user to provide the complete changelog content

**Changelog categories reference:**
- **Added**: New features
- **Changed**: Changes in existing functionality  
- **Fixed**: Bug fixes
- **Deprecated**: Soon-to-be removed features
- **Removed**: Removed features
- **Security**: Security fixes

### 2.4: Generate Final Changelog Entry

Create the final changelog entry with:
- Version number (from Step 1)
- Current date in YYYY-MM-DD format
- User-confirmed/modified changes (from Step 2.3)

Format:
```markdown
## [VERSION] - YYYY-MM-DD

[FINAL_CHANGELOG_CONTENT]
```

### 2.5: Show Preview and Confirm

Present the complete new changelog entry to the user and ask for final confirmation:
- Show the full entry that will be added
- Ask: "请确认以上最终的 changelog 内容是否正确？如需修改，请告诉我具体要改什么。"

Wait for user confirmation or modification request.

### 2.6: Update CHANGELOG.md

Once confirmed, update CHANGELOG.md by inserting the new entry after the header:

Use the `replace_in_file` tool to insert the new version entry right after the "# VVCode Changelog" line, before the first existing version entry.

### 2.7: Verify Update

Verify the changelog was updated correctly:

```bash
head -30 CHANGELOG.md
```

Show the user the updated changelog and confirm it looks correct.

## Step 3: Install Dependencies

Ensure all dependencies are up to date:

```bash
npm run install:all
```

This will install dependencies for both the main extension and the webview-ui.

## Step 4: Build Production Bundle

Build the production version with optimizations:

```bash
npm run package
```

This command:
- Runs type checking
- Builds the webview UI
- Runs linting
- Bundles the extension with esbuild in production mode

Wait for the build to complete successfully before proceeding.

## Step 5: Generate VSIX Package

Create the .vsix package file:

```bash
npx vsce package --no-dependencies
```

This will generate a file named `vvcode-<version>.vsix` in the current directory (e.g., `vvcode-1.1.3.vsix`).

Verify the package was created:

```bash
ls -lh *.vsix
```

## Step 6: Final Summary

**Present a summary to the user:**
- Version released: v{VERSION}
- Package file: vvcode-{VERSION}.vsix
- Location: /Users/zhangao/Documents/vv-code/vvcode-{VERSION}.vsix

**Next steps (manual):**
The user can now:
1. Test the .vsix file locally by installing it in VS Code
2. Distribute the .vsix file to users
3. Optionally commit the version change and changelog to git:
   ```bash
   git add package.json package-lock.json webview-ui/package-lock.json CHANGELOG.md
   git commit -m "chore: release v{VERSION}"
   git tag v{VERSION}
   git push && git push --tags
   ```

## Handling Errors

### Build failures
If the build fails, check the error messages:
- **Type errors**: Fix TypeScript errors reported by check-types
- **Lint errors**: Run `npm run lint:fix` to auto-fix formatting issues
- **Build errors**: Check esbuild output for module resolution or syntax errors

### VSCE package errors
If `vsce package` fails:
- Ensure all required fields in package.json are filled (name, publisher, version, etc.)
- Check that the package.json is valid JSON
- Verify the icon file exists at the specified path

### Dependency issues
If install:all fails:
- Clear node_modules: `npm run clean:deps`
- Try again: `npm run install:all`
- Check for npm registry connectivity issues
