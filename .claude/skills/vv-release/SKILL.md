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

## Step 1: Update Version

Ask the user what version number to release (e.g., 1.1.3, 1.2.0, 2.0.0).

Once confirmed, update the version in package.json using npm version:

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

## Step 2: Install Dependencies

Ensure all dependencies are up to date:

```bash
npm run install:all
```

This will install dependencies for both the main extension and the webview-ui.

## Step 3: Build Production Bundle

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

## Step 4: Generate VSIX Package

Create the .vsix package file:

```bash
npx vsce package --no-dependencies
```

This will generate a file named `vvcode-<version>.vsix` in the current directory (e.g., `vvcode-1.1.3.vsix`).

Verify the package was created:

```bash
ls -lh *.vsix
```

## Step 5: Final Summary

**Present a summary to the user:**
- Version released: v{VERSION}
- Package file: vvcode-{VERSION}.vsix
- Location: /Users/zhangao/Documents/vv-code/vvcode-{VERSION}.vsix

**Next steps (manual):**
The user can now:
1. Test the .vsix file locally by installing it in VS Code
2. Distribute the .vsix file to users
3. Optionally commit the version change to git:
   ```bash
   git add package.json package-lock.json webview-ui/package-lock.json
   git commit -m "chore: bump version to v{VERSION}"
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
