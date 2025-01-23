import { promises as fs } from 'fs'
import { createInterface } from 'readline'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
})

const question = (query) => new Promise((resolve) => rl.question(query, resolve))

const banner = `
██╗     ██╗██████╗ ██████╗  █████╗ ██████╗ ██╗   ██╗
██║     ██║██╔══██╗██╔══██╗██╔══██╗██╔══██╗╚██╗ ██╔╝
██║     ██║██████╔╝██████╔╝███████║██████╔╝ ╚████╔╝ 
██║     ██║██╔══██╗██╔══██╗██╔══██║██╔══██╗  ╚██╔╝  
███████╗██║██████╔╝██║  ██║██║  ██║██║  ██║   ██║   
╚══════╝╚═╝╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝   
                                                      
████████╗███████╗███╗   ███╗██████╗ ██╗      █████╗ ████████╗███████╗
╚══██╔══╝██╔════╝████╗ ████║██╔══██╗██║     ██╔══██╗╚══██╔══╝██╔════╝
   ██║   █████╗  ██╔████╔██║██████╔╝██║     ███████║   ██║   █████╗  
   ██║   ██╔══╝  ██║╚██╔╝██║██╔═══╝ ██║     ██╔══██║   ██║   ██╔══╝  
   ██║   ███████╗██║ ╚═╝ ██║██║     ███████╗██║  ██║   ██║   ███████╗
   ╚═╝   ╚══════╝╚═╝     ╚═╝╚═╝     ╚══════╝╚═╝  ╚═╝   ╚═╝   ╚══════╝
`

function validatePackageName(name) {
  if (!name) {
    return { valid: false, errors: ['Package name cannot be empty'] }
  }

  if (name.length > 214) {
    return { valid: false, errors: ['Package name cannot be longer than 214 characters'] }
  }

  // Handle scoped packages
  const scopedPackageRegex = /^@([^/]+)\/([^/]+)$/
  const isScoped = name.startsWith('@')

  if (isScoped) {
    if (!name.match(scopedPackageRegex)) {
      return {
        valid: false,
        errors: ['Scoped package names must be in the format @scope/package-name'],
      }
    }

    const [, scope, packageName] = name.match(scopedPackageRegex)

    // Validate scope
    if (!scope.match(/^[a-z0-9-_.]+$/)) {
      return {
        valid: false,
        errors: [
          'Scope can only contain URL-safe characters: lowercase letters, numbers, hyphens, underscores, and dots',
        ],
      }
    }

    // Validate package name part
    if (!packageName.match(/^[a-z0-9-_.]+$/)) {
      return {
        valid: false,
        errors: [
          'Package name can only contain URL-safe characters: lowercase letters, numbers, hyphens, underscores, and dots',
        ],
      }
    }

    if (packageName.match(/[._]{2,}/) || scope.match(/[._]{2,}/)) {
      return { valid: false, errors: ['Neither scope nor package name can contain consecutive dots or underscores'] }
    }

    if (scope.match(/^[._]/) || packageName.match(/^[._]/)) {
      return { valid: false, errors: ['Neither scope nor package name can start with dots or underscores'] }
    }

    // Package name must be lowercase
    if (name.toLowerCase() !== name) {
      return { valid: false, errors: ['Package name must be lowercase'] }
    }

    return { valid: true }
  }

  // Non-scoped package validation
  if (name.match(/^[._]/)) {
    return { valid: false, errors: ['Package name cannot start with dots or underscores'] }
  }

  // Package name must be lowercase
  if (name.toLowerCase() !== name) {
    return { valid: false, errors: ['Package name must be lowercase'] }
  }

  // Package name can only contain URL-safe characters
  if (!name.match(/^[a-z0-9-_.]+$/)) {
    return {
      valid: false,
      errors: [
        'Package name can only contain URL-safe characters: lowercase letters, numbers, hyphens, underscores, and dots',
      ],
    }
  }

  // No consecutive dots or underscores
  if (name.match(/[._]{2,}/)) {
    return { valid: false, errors: ['Package name cannot contain consecutive dots or underscores'] }
  }

  // No node_modules or favicon.ico
  const blacklist = ['node_modules', 'favicon.ico']
  if (blacklist.includes(name)) {
    return { valid: false, errors: ['Package name is blacklisted'] }
  }

  return { valid: true }
}

async function main() {
  console.log(banner)
  console.log('\nWelcome to the Library Template initialization!\n')

  // Ask for library name
  let isValidName = false
  let libraryName
  while (!isValidName) {
    libraryName = await question("What's your library's name? ")
    const validation = validatePackageName(libraryName)
    if (validation.valid) {
      isValidName = true
    } else {
      console.error('\nInvalid package name. Errors:')
      validation.errors.forEach((error) => {
        console.error(`- ${error}`)
      })
      console.log('')
    }
  }

  // Ask about PR preview
  const enablePrPreview = (await question('\nSet up PR and commit automatic package preview? (yes/no) '))
    .toLowerCase()
    .startsWith('y')

  // Ask about automatic release
  const enableAutoRelease = (await question('\nSet up automatic package changeset release and publish? (yes/no) '))
    .toLowerCase()
    .startsWith('y')

  // Show confirmation
  console.log('\nPlease confirm the following changes:')
  console.log(`- Package name will be set to: ${libraryName}`)
  console.log(`- PR preview publishing will be: ${enablePrPreview ? 'ENABLED' : 'DISABLED'}`)
  console.log(`- Automatic release will be: ${enableAutoRelease ? 'ENABLED' : 'DISABLED'}`)

  const confirm = await question('\nProceed with these changes? (yes/no) ')

  if (!confirm.toLowerCase().startsWith('y')) {
    console.log('Initialization cancelled.')
    process.exit(0)
  }

  // Apply changes
  try {
    // Update package.json
    const packageJsonPath = join(__dirname, 'package.json')
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'))
    packageJson.name = libraryName
    await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n')

    // Handle workflow files
    if (enablePrPreview) {
      await fs.rename(
        join(__dirname, '.github/workflows/publish-any-commit.yml.disabled'),
        join(__dirname, '.github/workflows/publish-any-commit.yml')
      )
    }

    if (enableAutoRelease) {
      await fs.rename(
        join(__dirname, '.github/workflows/release.yml.disabled'),
        join(__dirname, '.github/workflows/release.yml')
      )
    }

    // Delete .changeset folder and CHANGELOG.md
    await fs.rm(join(__dirname, '.changeset'), { recursive: true, force: true })
    await fs.rm(join(__dirname, 'CHANGELOG.md'), { force: true })

    // Install dependencies
    console.log('\nInstalling dependencies...')
    const { stdout, stderr } = await execAsync('pnpm install', { stdio: 'inherit' })
    if (stdout) console.log(stdout)
    if (stderr) console.error(stderr)

    // Remove setup script from package.json
    delete packageJson.scripts['setup:template']
    await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n')

    // Self-destruct this file
    await fs.unlink(__filename)

    console.log('\nInitialization completed successfully! 🎉')
  } catch (error) {
    console.error('Error applying changes:', error)
    process.exit(1)
  }

  rl.close()
}

main().catch(console.error)
