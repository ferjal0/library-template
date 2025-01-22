# WTF is this?

A generic library template starter for new JOYCO libs.

## Good to know

If you **DON't** need react as a peer dependency you **NEED** to delete it.

```bash
# 1. Remove both the devDependencies and peerDependencies
pnpm remove @types/react react
```

Then **manually** remove the peerDependencies section from `package.json` and also check `eslint.config.js`, `tsconfig.json`.
