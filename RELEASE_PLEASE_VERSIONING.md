# Release-Please Versioning Guide

## Important: When to Remove `versioning: 'prerelease'`

### Current State (Prerelease Versions) - WORKING FINE

When your packages are using **prerelease versions** (like `0.0.3-alpha.0`, `0.1.0-beta.1`, etc.), the `versioning: 'prerelease'` field **CAN BE USED** and is working correctly.

**✅ CURRENT CONFIG (Working):**

```json
{
  "packages": {
    ".": {
      "release-type": "node",
      "prerelease": true,
      "prerelease-type": "alpha",
      "versioning": "prerelease" // ← This is working fine for prereleases
    }
  }
}
```

### When to Remove `versioning: 'prerelease'`

The `versioning: 'prerelease'` field should be **REMOVED** when:

1. **Transitioning to stable versions** (like `1.0.0`, `2.1.0`)
2. **Moving away from prerelease mode**
3. **Starting a new stable release cycle**

**❌ INCORRECT for stable versions:**

```json
{
  "packages": {
    ".": {
      "release-type": "node",
      "versioning": "prerelease" // ← REMOVE THIS for stable versions
    }
  }
}
```

**✅ CORRECT for stable versions:**

```json
{
  "packages": {
    ".": {
      "release-type": "node"
      // No versioning field needed for stable versions
    }
  }
}
```

### Migration Path

#### Step 1: Current (Prerelease) - WORKING

```json
{
  "packages": {
    ".": {
      "release-type": "node",
      "prerelease": true,
      "prerelease-type": "alpha",
      "versioning": "prerelease" // ← Keep this for prereleases
    }
  }
}
```

#### Step 2: When reaching stable version (1.0.0) - REMOVE

```json
{
  "packages": {
    ".": {
      "release-type": "node"
      // Remove versioning field for stable versions
    }
  }
}
```

### Current Configuration (Prerelease Versions)

Since your packages are currently at:

- Main package: `0.0.1-alpha.0`
- Dapp package: `0.0.1-alpha.0`

### Summary

| Package Version | Config Field               | Action                |
| --------------- | -------------------------- | --------------------- |
| `0.0.3-alpha.0` | `versioning: 'prerelease'` | ✅ **KEEP** (working) |
| `1.0.0`         | `versioning: 'prerelease'` | ❌ **REMOVE**         |

**Remember**: The `versioning` field works fine for prereleases but should be removed when transitioning to stable versions!
