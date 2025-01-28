# Templates folder

This folder is being targeted as a monorepo project. Create new test cases for your library here and install the the library as a workspace dependency.

## Installation example

To install the monorepo library `@joycostudio/generic` as a workspace dependency, run the following command from the root of the monorepo:

```bash
pnpm add @joycostudio/generic --filter ./templates/[your-template-project]
```

Replace `your-template-project` with the name of your specific template project directory.
