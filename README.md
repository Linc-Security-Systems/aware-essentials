# Overview

This repo contains implementation of 2 libraries:
- @awarevue/agent-sdk
- @awarevue/api-types

Those libraries are typically imported by developers who wish to write a new agent that connects devices to Aware platform.

# 🦋 Versioning and Publishing with Changesets

This repo uses [Changesets](https://github.com/changesets/changesets) to manage versioning across packages.  
Publishing is automated via GitHub Actions and happens directly when changes are pushed to `main`.

## 🔧 When should you add a changeset?

Add a changeset **whenever you make a change that should result in a new version** of a package:

- ✅ New feature → `minor`
- ✅ Bug fix → `patch`
- ✅ Breaking change → `major`

---

## ✅ Workflow Summary

### 1. Make your code changes

Modify your package as needed (`api-types`, `agent-sdk`, etc.).

### 2. Add a changeset file

Run:

```bash
yarn changeset
