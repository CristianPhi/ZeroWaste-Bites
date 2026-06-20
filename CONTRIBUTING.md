# Contributing to ZeroWaste-Bites

## How to Push Code from VS Code to GitHub

### Prerequisites

- [Git](https://git-scm.com/downloads) installed on your machine
- [VS Code](https://code.visualstudio.com/) installed
- A GitHub account with access to this repository

---

### Option 1: Using the VS Code Source Control Panel (Recommended)

1. **Open the Source Control panel**
   - Click the branch icon in the left sidebar, or press `Ctrl+Shift+G` (Windows/Linux) / `Cmd+Shift+G` (Mac)

2. **Stage your changes**
   - You will see a list of changed files under **Changes**
   - Click the `+` icon next to each file to stage it, or click the `+` next to **Changes** to stage all files

3. **Commit your changes**
   - Type a commit message in the text box at the top (e.g., `Add new recipe feature`)
   - Click the **✓ Commit** button (or press `Ctrl+Enter`)

4. **Push to GitHub**
   - Click the **⋯ (More Actions)** menu in the Source Control panel and select **Push**
   - Or click the cloud/sync icon in the bottom status bar

---

### Option 2: Using the Integrated Terminal in VS Code

1. **Open the terminal**
   - Press `` Ctrl+` `` (Windows/Linux) or `` Cmd+` `` (Mac), or go to **Terminal → New Terminal**

2. **Check which files changed**
   ```bash
   git status
   ```

3. **Stage your changes**
   ```bash
   # Stage all changes
   git add .

   # Or stage a specific file
   git add path/to/your/file.ts
   ```

4. **Commit your changes**
   ```bash
   git commit -m "Your descriptive commit message"
   ```

5. **Push to GitHub**
   ```bash
   git push
   ```
   If it's your first push on a new branch:
   ```bash
   git push -u origin your-branch-name
   ```

---

### Common Workflow

```bash
git status                       # See what changed
git add .                        # Stage all changes
git commit -m "Describe change"  # Commit with a message
git push                         # Push to GitHub
```

---

### Troubleshooting

- **Authentication error**: Make sure you are signed into GitHub in VS Code. Go to **Accounts** (bottom-left avatar icon) and sign in with GitHub.
- **Branch not set up**: Run `git push -u origin <branch-name>` on your first push for a new branch.
- **Merge conflicts**: Pull the latest changes first with `git pull`, resolve conflicts, then push again.
