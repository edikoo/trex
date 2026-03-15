# trex 🦖

> A beautiful, informative `tree` command replacement with icons, git status, language stats, live watch, and more.

```
📁 my-project/  (3 dirs, 12 files, 48.2 KB)  [Node.js: my-app@2.1.0]
├── 📁 src
│   ├── 💙 app.ts              4.2 KB  2026-03-14
│   ├── 💙 utils.ts            1.1 KB  2026-03-12
│   └── ⚛️  components/
│       ├── 📜 Button.jsx       890 B  2026-03-13
│       └── 📜 Modal.jsx        1.2 KB  2026-03-11
├── 📦 package.json            820 B  2026-03-14
├── 💙 tsconfig.json           540 B  2026-03-10
└── 📖 README.md               2.1 KB  2026-03-14

█████████████████████░░░░░░░░  TypeScript 68.2%  JavaScript 21.4%  JSON 10.4%

3 directories, 12 files, 48.2 KB total
```

---

## Features

| Feature | Flag | Description |
|---------|------|-------------|
| **File icons** | always on | 50+ emoji icons by file type |
| **Syntax colors** | always on | Color-coded by language |
| **Git status** | `--git` | Shows M / A / ? / D badges per file |
| **Language bar** | always on | Visual breakdown of codebase languages |
| **Disk usage** | `--du` | Real directory sizes (sum of contents) |
| **Live watch** | `--watch` | Auto-refresh on file changes |
| **Metadata** | `--meta` | Line counts, image dimensions |
| **TODO scanner** | `--todo` | Counts TODO/FIXME/HACK per file |
| **Path squash** | `--squash` | Collapses single-child directory chains |
| **Directory diff** | `--diff <path>` | Compare two directory trees |
| **JSON output** | `--json` | Machine-readable output for scripting |
| **CSV output** | `--csv` | Flat CSV: path, type, size, mtime |
| **Gitignore** | `--gitignore` | Respect `.gitignore` files |
| **Jump navigation** | `--jump <name>` | Find a directory by name |
| **Smart auto-mode** | always on | Auto-detects git repos and project type |

---

## Install

### npm (recommended)
```bash
npm install -g @edikoo/trex
```

### curl (no Node.js required)
```bash
curl -fsSL https://raw.githubusercontent.com/edikoo/trex/main/install.sh | bash
```

### Manual
Download the latest binary for your platform from [Releases](https://github.com/edikoo/trex/releases):

| Platform | Binary |
|----------|--------|
| Linux x64 | `trex-linux-x64.gz` |
| Linux ARM64 | `trex-linux-arm64.gz` |
| macOS x64 | `trex-macos-x64.gz` |
| macOS ARM64 (Apple Silicon) | `trex-macos-arm64.gz` |

```bash
gunzip trex-linux-x64.gz
chmod +x trex-linux-x64
sudo mv trex-linux-x64 /usr/local/bin/trex
```

---

## Usage

```
trex [path] [options]
```

### Display
```bash
trex                          # current directory
trex ~/projects/myapp         # specific path
trex -a                       # show hidden files (dotfiles)
trex --depth 2                # limit to 2 levels deep
trex -L 3                     # alias for --depth
trex --no-icons               # strip emoji icons
trex --no-color               # disable colors (pipe-friendly)
trex --full-path              # show absolute path per entry
trex -p, --perms              # show Unix permissions column
```

### Filtering
```bash
trex --find "*.go"            # show only Go files
trex -x node_modules -x dist  # exclude patterns
trex --dirs-only              # show only directories
trex --files-only             # show only files
trex --gitignore              # respect .gitignore
trex --prune                  # hide empty directories
trex --newer 7d               # modified in last 7 days
trex --older 2026-01-01       # modified before date
trex --min-size 1MB           # files >= 1MB
trex --max-size 500KB         # files <= 500KB
trex --max-files 10           # max 10 files per directory
```

### Sorting
```bash
trex --sort name              # alphabetical (default)
trex --sort size              # largest first
trex --sort date              # most recently modified first
trex -r                       # reverse sort order
```

### Output modes
```bash
trex --du                     # show real directory sizes
trex --count-only             # summary only, no tree
trex --json                   # JSON output
trex --json | jq '.children[].name'
trex --csv                    # flat CSV output
trex --csv > files.csv
```

### Advanced features
```bash
trex --git                    # git status badges (M / A / ? / D)
trex --meta                   # line counts + image dimensions
trex --todo                   # TODO/FIXME/HACK counts per file
trex --todo-only              # only files with TODOs
trex --squash                 # collapse single-child dir chains
trex --diff /other/dir        # compare two directories
trex --watch                  # live refresh on file changes
```

### Power combos
```bash
trex --du --sort size -L 2              # disk usage overview
trex --git --meta --squash              # full project overview
trex --find "*.ts" --newer 7d          # recently changed TypeScript
trex --gitignore --todo-only            # find TODOs in tracked files
trex --json | jq '.children[].name'    # scriptable output
trex --no-color | cat                  # pipe-friendly plain text
```

---

## Shell Navigation (tx)

`trex` can jump to directories by name. Since a subprocess can't `cd` your shell, use the `tx` wrapper:

```bash
# Add to ~/.bashrc or ~/.zshrc
eval "$(trex --init)"
```

Then:
```bash
tx claude        # → cd /home/you/Desktop/work/new-k8s/claude
tx myapp         # → cd wherever myapp is under $HOME
tx              # → runs trex in current directory
```

`tx` searches from your current directory first, then `$HOME`.

---

## Options Reference

```
Display:
  -a, --all              Show hidden files (dotfiles)
  -d, --depth <n>        Limit tree depth (default: unlimited)
  -L, --level <n>        Alias for --depth
      --no-icons         Strip emoji icons (keep colors)
      --no-color         Disable color output
  -p, --perms            Show Unix permissions column
      --full-path        Show absolute path for each entry

Filtering:
  -f, --find <pat>       Show only files matching glob (e.g. "*.go")
  -x, --exclude <pat>    Exclude by glob pattern (repeatable)
  -D, --dirs-only        Show only directories
      --files-only       Show only files
      --gitignore        Respect .gitignore files
      --prune            Hide empty directories
      --newer <date>     Only entries modified after date (YYYY-MM-DD or 7d)
      --older <date>     Only entries modified before date
      --min-size <n>     Only files >= size (e.g. 1MB, 500KB)
      --max-size <n>     Only files <= size
      --max-files <n>    Max files shown per directory

Sorting:
  -s, --sort <by>        Sort by: name (default), date, size
  -r, --reverse          Reverse sort order

Output:
      --du               Show directory sizes (sum of contents)
      --count-only       Print summary only, no tree
      --json             Output as JSON
      --csv              Output as flat CSV (path, type, size, mtime)

Advanced:
      --git              Show git status decorations
      --meta             Show content metadata (line count, image dimensions)
      --todo             Show TODO/FIXME/HACK counts per file
      --todo-only        Show only files with TODOs (implies --todo)
      --squash           Collapse single-child directory chains
      --diff <path>      Compare with another directory
      --watch            Live-refresh mode (re-render on file changes)

Navigation:
  -j, --jump <name>      Find directory by name and print path
      --init             Print shell integration (tx function)

  -h, --help             Show this help
  -v, --version          Show version
```

---

## Requirements

- **npm install**: Node.js >= 18.3.0
- **Binary / curl install**: No dependencies (self-contained executable)

---

## License

MIT © [edikoo](https://github.com/edikoo)
