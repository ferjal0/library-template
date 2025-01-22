# WTF is this?

A generic library template starter for new JOYCO libs.

## ❗️ MUST DO ON TEMPLATE FORK ❗️
This is a sample package that serves as a template. If you are forking from it you NEED to update the `package.json` "name" field. Also **DELETE** the `.changeset/` folder and the `CHANGELOG.md` file to start your library versioning history from the very start.

## 👀 Good to know

If you **DON't** need react as a peer dependency you **NEED** to delete it.

```bash
# 1. Remove both the devDependencies and peerDependencies
pnpm remove @types/react react
```

Then **manually** remove the peerDependencies section from `package.json` and also check `eslint.config.js`, `tsconfig.json`.

## 🦋 Version Management

This library uses [Changesets](https://github.com/changesets/changesets) to manage versions and publish releases. Here's how to use it:

### Adding a changeset

When you make changes that need to be released:

```bash
pnpm changeset
```

This will prompt you to:

1. Select which packages you want to include in the changeset
2. Choose whether it's a major/minor/patch bump
3. Provide a summary of the changes

### Creating a release

To create a new version and update the changelog:

```bash
# 1. Create new versions of packages
pnpm changeset version

# 2. Build the packages
pnpm build

# 3. Publish to npm
pnpm changeset publish
```

Remember to commit all changes after creating a release.
