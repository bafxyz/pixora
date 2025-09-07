# Git Commit Message Guidelines for AI

When executing Git operations:

1. **Default behavior** (no type specified): Show current Git status and provide guidance on next steps
2. **type=commit**: Create a conventional commit with **only staged files** (files added with `git add`)
3. **type=push**: Push changes to the current branch 
4. **type=pull**: Pull latest changes from the remote branch
5. **type=status**: Show detailed Git status
6. **type=log**: Show recent commit history
7. **type=diff**: Show current changes

**Git Commit Standards:**
- Use conventional commit format: `<emoji><type>(<scope>): <description>`
- Include appropriate emoji prefix for the change type:
  - 🛠️ fix — bug fixes
  - 📦 feat — new features  
  - 📃 docs — documentation
  - 🧹 chore — maintenance tasks
  - 🔙 revert — revert changes
  - 🏗️ build — build system changes
  - ⚙️ ci — CI/CD processes
  - 🎨 style — code style changes
  - 🔨 refactor — code refactoring
  - 🚀 perf — performance improvements
  - 🧪 test — testing changes

**Git Commit Message Format:**
  - `<emoji><type>(<scope>): <description>`
  - `<type>` and `<scope>` must be lowercase.
  - `<description>` should be concise, start with a lowercase verb, and clearly describe the change (max 50 characters).
  - If multiple files/components are changed, use a general scope or the most relevant one.
  - Always include the related issue/ticket number if available.
  - Do **not** use `git reset` without explicit permission.
  - Do **not** reference Claude code or use "Co-authored-by" in commits.
  - Ensure messages are clear, concise, and follow these guidelines.

**Arguments:**
- `type`: Operation type (commit, push, pull, status, log, diff)
- Additional arguments depend on the operation type

**Examples:**
- `/git` → Show Git status and guidance
- `/git type=commit` → Create a conventional commit
- `/git type=push` → Push to current branch
- `/git type=status` → Show detailed Git status
