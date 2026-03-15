#!/usr/bin/env node
import { readdirSync, statSync, lstatSync, readFileSync, readlinkSync, watch as fsWatch, openSync, readSync, closeSync } from 'fs';
import { join, extname, basename, resolve, relative } from 'path';
import { parseArgs } from 'util';
import { spawnSync } from 'child_process';

// ─── ANSI Color System ────────────────────────────────────────────────────────

const colorDir     = str => c('1;36', str);
const colorCode    = str => c('33', str);
const colorScript  = str => c('32', str);
const colorConfig  = str => c('35', str);
const colorDoc     = str => c('34', str);
const colorMedia   = str => c('95', str);
const colorArchive = str => c('91', str);
const colorLink    = str => c('96', str);
const colorDefault = str => str;

// ─── File Type Icons + Colors ─────────────────────────────────────────────────

const FILE_ICONS = {
  'Dockerfile':           '🐳',  'docker-compose.yml':   '🐳',
  'docker-compose.yaml':  '🐳',  '.gitignore':           '🔒',
  '.gitattributes':       '🔒',  '.env':                 '🔒',
  '.env.local':           '🔒',  '.env.example':         '📝',
  'package.json':         '📦',  'package-lock.json':    '🔒',
  'yarn.lock':            '🔒',  'pnpm-lock.yaml':       '🔒',
  'Makefile':             '⚙️ ', 'makefile':             '⚙️ ',
  'CMakeLists.txt':       '⚙️ ', 'README.md':            '📖',
  'readme.md':            '📖',  'LICENSE':              '⚖️ ',
  'license':              '⚖️ ', 'CHANGELOG.md':         '📋',
  'Cargo.toml':           '🦀',  'Cargo.lock':           '🔒',
  'go.mod':               '🐹',  'go.sum':               '🔒',
  'requirements.txt':     '🐍',  'pyproject.toml':       '🐍',
  'setup.py':             '🐍',  'setup.cfg':            '🐍',
  'Pipfile':              '🐍',  'Pipfile.lock':         '🔒',
  'tsconfig.json':        '💙',  'jsconfig.json':        '📜',
  '.eslintrc':            '🔍',  '.eslintrc.js':         '🔍',
  '.eslintrc.json':       '🔍',  '.prettierrc':          '✨',
  '.prettierrc.json':     '✨',  '.babelrc':             '🔄',
  'webpack.config.js':    '📦',  'vite.config.js':       '⚡',
  'vite.config.ts':       '⚡',  'next.config.js':       '▲',
  'next.config.ts':       '▲',
  '.tar.gz': '📦', '.tar.bz2': '📦', '.tar.xz': '📦',
  '.py': '🐍',  '.pyw':  '🐍', '.js':   '📜', '.mjs':  '📜', '.cjs':  '📜',
  '.ts': '💙',  '.tsx':  '⚛️ ','.jsx':  '⚛️ ','.go':   '🐹', '.rs':   '🦀',
  '.c':  '🔵',  '.h':    '🔵', '.cpp':  '🔵', '.cc':   '🔵', '.cxx':  '🔵', '.hpp': '🔵',
  '.java': '☕', '.kt':  '🎯', '.kts':  '🎯', '.swift':'🍎', '.rb':   '💎', '.php': '🐘',
  '.cs': '🔷',  '.fs':   '🔷', '.scala':'🔴', '.lua':  '🌙', '.r':    '📊', '.R':   '📊',
  '.jl': '🔬',  '.ex':   '💜', '.exs':  '💜', '.erl':  '🟣', '.hs':   '🟣', '.ml':  '🔮',
  '.sh': '🐚',  '.bash': '🐚', '.zsh':  '🐚', '.fish': '🐠', '.ps1':  '🔷',
  '.html':'🌐', '.htm':  '🌐', '.css':  '🎨', '.scss': '🎨', '.sass': '🎨', '.less':'🎨',
  '.vue':'💚',  '.svelte':'🔥',
  '.json':'📋', '.json5':'📋', '.yaml':'📋', '.yml': '📋',
  '.toml':'📋', '.ini':  '⚙️ ','.cfg':  '⚙️ ','.conf':'⚙️ ',
  '.md': '📝',  '.mdx':  '📝', '.rst':  '📝', '.txt':  '📄', '.log':  '📄',
  '.csv':'📊',  '.tsv':  '📊', '.xml':  '📋',
  '.svg':'🖼️ ', '.png':  '🖼️ ','.jpg':  '🖼️ ','.jpeg':'🖼️ ','.gif':  '🖼️ ',
  '.webp':'🖼️ ','.ico':  '🖼️ ','.bmp':  '🖼️ ','.tiff':'🖼️ ',
  '.mp4':'🎬',  '.mov':  '🎬', '.avi':  '🎬', '.mkv':  '🎬', '.webm': '🎬',
  '.mp3':'🎵',  '.wav':  '🎵', '.flac': '🎵', '.ogg':  '🎵', '.m4a':  '🎵',
  '.pdf':'📕',
  '.zip':'📦',  '.gz':   '📦', '.bz2':  '📦', '.xz':   '📦',
  '.7z': '📦',  '.rar':  '📦', '.tar':  '📦', '.deb':  '📦', '.rpm':  '📦',
  '.exe':'⚙️ ', '.dll':  '⚙️ ','.so':   '⚙️ ','.dylib':'⚙️ ',
  '.wasm':'🕸️ ','.sql':  '🗄️ ','.db':   '🗄️ ','.sqlite':'🗄️ ',
  '__default__': '📄',
};

const FILE_COLORS = {
  '.py': colorCode,  '.pyw': colorCode, '.js':  colorCode, '.mjs': colorCode, '.cjs': colorCode,
  '.ts': colorCode,  '.tsx': colorCode, '.jsx': colorCode, '.go':  colorCode, '.rs':  colorCode,
  '.c':  colorCode,  '.h':   colorCode, '.cpp': colorCode, '.cc':  colorCode, '.cxx': colorCode,
  '.hpp':colorCode,  '.java':colorCode, '.kt':  colorCode, '.rb':  colorCode,
  '.php':colorCode,  '.cs':  colorCode, '.swift':colorCode,
  '.sh': colorScript,'.bash':colorScript,'.zsh':colorScript,'.fish':colorScript,'.ps1':colorScript,
  '.html':colorDoc,  '.htm': colorDoc,  '.css': colorDoc,  '.scss':colorDoc, '.sass':colorDoc, '.less':colorDoc,
  '.json':colorConfig,'.yaml':colorConfig,'.yml':colorConfig,
  '.toml':colorConfig,'.ini':colorConfig,'.cfg':colorConfig,'.conf':colorConfig,
  '.md': colorDoc,   '.mdx': colorDoc,  '.rst': colorDoc,
  '.svg':colorMedia, '.png': colorMedia,'.jpg': colorMedia,'.jpeg':colorMedia,
  '.gif':colorMedia, '.webp':colorMedia,'.ico': colorMedia,
  '.mp4':colorMedia, '.mov': colorMedia,'.mp3': colorMedia,'.wav': colorMedia,
  '.zip':colorArchive,'.gz': colorArchive,'.tar':colorArchive,'.7z': colorArchive,'.rar':colorArchive,
  '__default__': colorDefault,
};

// ─── Utility Functions ────────────────────────────────────────────────────────

const segmenter = new Intl.Segmenter();

function visualWidth(str) {
  const plain = str.replace(/\x1b\[[0-9;]*m/g, '');
  let width = 0;
  for (const { segment } of segmenter.segment(plain)) {
    const cp = segment.codePointAt(0);
    if (cp === 0x200D || (cp >= 0xFE00 && cp <= 0xFE0F) ||
        (cp >= 0x0300 && cp <= 0x036F) || (cp >= 0x1F3FB && cp <= 0x1F3FF)) continue;
    if ((cp >= 0x1F300 && cp <= 0x1FAFF) || (cp >= 0x2600 && cp <= 0x27BF) ||
        (cp >= 0x4E00 && cp <= 0x9FFF)   || (cp >= 0x3000 && cp <= 0x303F)) {
      width += 2;
    } else { width += 1; }
  }
  return width;
}

function formatSize(bytes) {
  if (bytes === null || bytes === undefined) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
}

function parseSize(str) {
  if (!str) return null;
  const m = str.match(/^(\d+\.?\d*)\s*(B|KB|MB|GB)?$/i);
  if (!m) { console.error(`trex: invalid size '${str}'`); process.exit(1); }
  const mul = { B: 1, KB: 1024, MB: 1024**2, GB: 1024**3 };
  return parseFloat(m[1]) * (mul[(m[2] ?? 'B').toUpperCase()] ?? 1);
}

function formatDate(mtime) {
  const d = new Date(mtime);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function parseDate(str) {
  // Supports YYYY-MM-DD or relative like 7d, 30d
  const rel = str.match(/^(\d+)d$/i);
  if (rel) {
    const d = new Date();
    d.setDate(d.getDate() - parseInt(rel[1]));
    return d.getTime();
  }
  const ts = Date.parse(str);
  if (isNaN(ts)) { console.error(`trex: invalid date '${str}'`); process.exit(1); }
  return ts;
}

function formatPerms(mode) {
  const bits = [
    [0o400,'r'],[0o200,'w'],[0o100,'x'],
    [0o040,'r'],[0o020,'w'],[0o010,'x'],
    [0o004,'r'],[0o002,'w'],[0o001,'x'],
  ];
  return bits.map(([bit, ch]) => (mode & bit) ? ch : '-').join('');
}

function matchesGlob(name, pattern) {
  const regex = new RegExp('^' + pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*').replace(/\?/g, '.') + '$');
  return regex.test(name);
}

// ─── Gitignore ────────────────────────────────────────────────────────────────

const gitignoreCache = new Map();
function loadGitignore(dirPath) {
  if (gitignoreCache.has(dirPath)) return gitignoreCache.get(dirPath);
  let patterns = [];
  try {
    patterns = readFileSync(join(dirPath, '.gitignore'), 'utf8')
      .split('\n').map(l => l.trim())
      .filter(l => l && !l.startsWith('#') && !l.startsWith('!'))
      .map(l => ({ pattern: l.replace(/\/$/, ''), dirOnly: l.endsWith('/') }));
  } catch {}
  gitignoreCache.set(dirPath, patterns);
  return patterns;
}

function isGitignored(name, isDir, patterns) {
  for (const { pattern, dirOnly } of patterns) {
    if (dirOnly && !isDir) continue;
    if (matchesGlob(name, pattern)) return true;
  }
  return false;
}

// ─── CLI Argument Parsing ─────────────────────────────────────────────────────

const HELP = `
trex — A beautiful, informative tree command replacement

Usage: trex [path] [options]

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

New Features:
      --git              Show git status decorations
      --meta             Show content metadata (line count, image dimensions)
      --todo             Show TODO/FIXME/HACK counts per file
      --todo-only        Show only files with TODOs (implies --todo)
      --squash           Collapse single-child directory chains
      --diff <path>      Compare with another directory (separate output mode)
      --watch            Live-refresh mode (re-render on file changes)

Navigation:
  -j, --jump <name>      Find a directory by name and print its path (use with tx shell fn)
      --init             Print shell integration function for tx() (add to ~/.bashrc)

  -h, --help             Show this help
  -v, --version          Show version

Examples:
  trex --find "*.go"                    Find all Go files
  trex --du --sort size -L 2            Disk usage by dir, largest first
  trex --gitignore                      Respect .gitignore
  trex --newer 7d --min-size 100KB      Large recently modified files
  trex --json | jq '.children[].name'   Scriptable output
  trex --perms --sort size              Show permissions + sort by size
  trex --git                            Show git status decorations
  trex --diff /other/dir                Compare two directories
  trex --watch                          Live refresh on changes
`.trim();

const VERSION = '1.1.0';

// Pre-process flags that conflict with parseArgs --no-* handling
const rawArgv = process.argv.slice(2);
const noColorFlag = rawArgv.includes('--no-color');
const noIconsFlag = rawArgv.includes('--no-icons');
const filteredArgv = rawArgv.filter(a => a !== '--no-color' && a !== '--no-icons');

let parsedArgs;
try {
  parsedArgs = parseArgs({
    args: filteredArgv,
    options: {
      all:          { type: 'boolean', short: 'a', default: false },
      depth:        { type: 'string',  short: 'd' },
      level:        { type: 'string',  short: 'L' },
      sort:         { type: 'string',  short: 's' },
      reverse:      { type: 'boolean', short: 'r', default: false },
      exclude:      { type: 'string',  short: 'x', multiple: true },
      find:         { type: 'string',  short: 'f' },
      du:           { type: 'boolean',             default: false },
      gitignore:    { type: 'boolean',             default: false },
      prune:        { type: 'boolean',             default: false },
      'dirs-only':  { type: 'boolean', short: 'D', default: false },
      'files-only': { type: 'boolean',             default: false },
      newer:        { type: 'string' },
      older:        { type: 'string' },
      'min-size':   { type: 'string' },
      'max-size':   { type: 'string' },
      'max-files':  { type: 'string' },
      perms:        { type: 'boolean', short: 'p', default: false },
      'full-path':  { type: 'boolean',             default: false },
      'count-only': { type: 'boolean',             default: false },
      json:         { type: 'boolean',             default: false },
      csv:          { type: 'boolean',             default: false },
      git:          { type: 'boolean',             default: false },
      meta:         { type: 'boolean',             default: false },
      todo:         { type: 'boolean',             default: false },
      'todo-only':  { type: 'boolean',             default: false },
      squash:       { type: 'boolean',             default: false },
      diff:         { type: 'string' },
      'diff-all':   { type: 'boolean',             default: false },
      watch:        { type: 'boolean',             default: false },
      jump:         { type: 'string',  short: 'j' },
      init:         { type: 'boolean',             default: false },
      help:         { type: 'boolean', short: 'h', default: false },
      version:      { type: 'boolean', short: 'v', default: false },
    },
    allowPositionals: true,
  });
} catch (err) {
  console.error(`trex: ${err.message}`);
  process.exit(1);
}

const { values: opts, positionals } = parsedArgs;
if (opts.help)    { console.log(HELP); process.exit(0); }
if (opts.version) { console.log(`trex v${VERSION}`); process.exit(0); }

// ── --init: print shell integration function ──
if (opts.init) {
  console.log(`# trex shell integration — add to ~/.bashrc or ~/.zshrc:
# eval "$(trex --init)"
tx() {
  if [ -z "$1" ]; then trex; return; fi
  local dir
  dir=$(trex --jump "$1" 2>/dev/null)
  if [ -n "$dir" ]; then
    echo "$dir"
    cd "$dir"
  else
    trex "$@"
  fi
}`);
  process.exit(0);
}

// ── --jump: find directory by name and print its path ──
if (opts.jump !== undefined) {
  const query = opts.jump.toLowerCase();
  // Search CWD first (closest match), then HOME
  const cwd = process.cwd();
  const home = process.env.HOME ?? '/';
  const searchRoots = cwd === home ? [home] : [cwd, home];

  function findDir(base, name, depth) {
    if (depth > 6) return null;
    let entries;
    try { entries = readdirSync(base, { withFileTypes: true }); } catch { return null; }
    // Exact match first
    for (const e of entries) {
      if (!e.isDirectory()) continue;
      if (e.name.toLowerCase() === name) return join(base, e.name);
    }
    // Recurse (skip hidden and common noisy dirs)
    for (const e of entries) {
      if (!e.isDirectory()) continue;
      if (e.name.startsWith('.') || e.name === 'node_modules' || e.name === 'dist') continue;
      const found = findDir(join(base, e.name), name, depth + 1);
      if (found) return found;
    }
    return null;
  }

  let found = null;
  for (const root of searchRoots) {
    found = findDir(root, query, 1);
    if (found) break;
  }

  if (found) {
    process.stdout.write(found + '\n');
    process.exit(0);
  } else {
    console.error(`trex: directory '${opts.jump}' not found`);
    process.exit(1);
  }
}

// Color helpers (respects --no-color and NO_COLOR env)
const _ce = !noColorFlag && process.env.NO_COLOR === undefined;
function c(codes, str) { return _ce ? `\x1b[${codes}m${str}\x1b[0m` : str; }
const cd   = str => c('1;36', str);  const cCode = str => c('33', str);
const cScr = str => c('32', str);    const cCfg  = str => c('35', str);
const cDoc = str => c('34', str);    const cMed  = str => c('95', str);
const cArc = str => c('91', str);    const cTr   = str => c('90', str);
const cSz  = str => c('36', str);    const cDt   = str => c('90', str);
const cSum = str => c('1;37', str);  const cErr  = str => c('31', str);
const cLnk = str => c('96', str);    const cDef  = str => str;
const cPrm = str => c('90', str);    const cArr  = str => c('90', str);
function cc(code, str) { return c(code, str); }

function _mc(fn) {
  if (fn === colorCode)    return cCode;  if (fn === colorScript)  return cScr;
  if (fn === colorConfig)  return cCfg;   if (fn === colorDoc)     return cDoc;
  if (fn === colorMedia)   return cMed;   if (fn === colorArchive) return cArc;
  if (fn === colorLink)    return cLnk;   if (fn === colorDir)     return cd;
  return cDef;
}

function getIconAndColor(name, isDir, isSymlink) {
  if (isSymlink) return { icon: '🔗', colorFn: cLnk };
  if (isDir)     return { icon: '📁', colorFn: cd };
  if (FILE_ICONS[name])     return { icon: FILE_ICONS[name],     colorFn: _mc(FILE_COLORS[name]) };
  const comp = name.match(/(\.[a-z]+\.[a-z]+)$/i)?.[1];
  if (comp && FILE_ICONS[comp]) return { icon: FILE_ICONS[comp], colorFn: _mc(FILE_COLORS[comp]) };
  const ext = extname(name).toLowerCase();
  if (ext && FILE_ICONS[ext])   return { icon: FILE_ICONS[ext],  colorFn: _mc(FILE_COLORS[ext]) };
  return { icon: FILE_ICONS['__default__'], colorFn: cDef };
}

// ─── Options ──────────────────────────────────────────────────────────────────

const maxDepth    = opts.depth     !== undefined ? parseInt(opts.depth, 10)
                  : opts.level     !== undefined ? parseInt(opts.level, 10) : Infinity;
const showAll     = opts.all;
const excludes    = opts.exclude   ?? [];
const sortBy      = opts.sort      ?? 'name';
const reverseSort = opts.reverse;
const findPattern = opts.find      ?? null;
const showDu      = opts.du;
const gitignoreExplicit = rawArgv.includes('--gitignore');
let   useGitignore= opts.gitignore;
const pruneEmpty  = opts.prune;
const dirsOnly    = opts['dirs-only'];
const filesOnly   = opts['files-only'];
const newerThan   = opts.newer     ? parseDate(opts.newer) : null;
const olderThan   = opts.older     ? parseDate(opts.older) : null;
const minSize     = opts['min-size'] ? parseSize(opts['min-size']) : null;
const maxSize     = opts['max-size'] ? parseSize(opts['max-size']) : null;
const maxFiles    = opts['max-files'] ? parseInt(opts['max-files'], 10) : null;
const showPerms   = opts.perms;
const fullPath    = opts['full-path'];
const countOnly   = opts['count-only'];
const jsonOut     = opts.json;
const csvOut      = opts.csv;
const showGit     = opts.git;
const showMeta    = opts.meta;
const showTodo    = opts.todo || opts['todo-only'];
const todoOnly    = opts['todo-only'];
const doSquash    = opts.squash;
const diffPath    = opts.diff     ?? null;
const diffAll     = opts['diff-all'];
const watchMode   = opts.watch;
const rootPath    = resolve(positionals[0] ?? '.');

// ─── Smart auto-mode (feature 8) ─────────────────────────────────────────────

let projectInfo = null;

function detectProjectInfo(rp) {
  // Check if inside a git repo
  const gitCheck = spawnSync('git', ['-C', rp, 'rev-parse', '--git-dir'], { encoding: 'utf8' });
  if (gitCheck.status === 0 && !gitignoreExplicit) {
    useGitignore = true;
  }

  // Detect project type
  try {
    const pkgPath = join(rp, 'package.json');
    const pkgContent = readFileSync(pkgPath, 'utf8');
    const pkg = JSON.parse(pkgContent);
    if (pkg.name) {
      projectInfo = `Node.js: ${pkg.name}${pkg.version ? '@' + pkg.version : ''}`;
      return;
    }
  } catch {}

  try {
    const gomod = readFileSync(join(rp, 'go.mod'), 'utf8');
    const m = gomod.match(/^module\s+(\S+)/m);
    if (m) { projectInfo = `Go: ${m[1]}`; return; }
  } catch {}

  try {
    const cargo = readFileSync(join(rp, 'Cargo.toml'), 'utf8');
    const nameM = cargo.match(/^name\s*=\s*"([^"]+)"/m);
    const verM  = cargo.match(/^version\s*=\s*"([^"]+)"/m);
    if (nameM) {
      projectInfo = `Rust: ${nameM[1]}${verM ? '@' + verM[1] : ''}`;
      return;
    }
  } catch {}

  try {
    const pyproj = readFileSync(join(rp, 'pyproject.toml'), 'utf8');
    const nameM = pyproj.match(/^name\s*=\s*"([^"]+)"/m);
    if (nameM) { projectInfo = `Python: ${nameM[1]}`; return; }
  } catch {}

  try {
    readFileSync(join(rp, 'pom.xml'), 'utf8');
    projectInfo = 'Java/Maven project';
    return;
  } catch {}
}

detectProjectInfo(rootPath);

// ─── Filtering helpers ────────────────────────────────────────────────────────

function shouldExclude(name, isDir, dirPath) {
  if (!showAll && name.startsWith('.')) return true;
  for (const pat of excludes) { if (matchesGlob(name, pat)) return true; }
  if (useGitignore) {
    if (name === '.git') return true;
    if (isGitignored(name, isDir, loadGitignore(dirPath))) return true;
  }
  return false;
}

function passesFilters(entry) {
  if (newerThan !== null && entry.mtime < newerThan) return false;
  if (olderThan !== null && entry.mtime > olderThan) return false;
  if (!entry.isDir) {
    if (minSize !== null && entry.size < minSize) return false;
    if (maxSize !== null && entry.size > maxSize) return false;
  }
  return true;
}

// ─── Find probe ──────────────────────────────────────────────────────────────

function dirHasMatch(dirPath, depth) {
  if (depth > maxDepth) return false;
  let children;
  try { children = readdirSync(dirPath); } catch { return false; }
  for (const name of children) {
    const childPath = join(dirPath, name);
    let isDir = false;
    try { isDir = lstatSync(childPath).isDirectory(); } catch { continue; }
    if (shouldExclude(name, isDir, dirPath)) continue;
    if (isDir) { if (dirHasMatch(childPath, depth + 1)) return true; }
    else { if (matchesGlob(name, findPattern)) return true; }
  }
  return false;
}

// ─── Du size (bypasses depth limit) ──────────────────────────────────────────

function computeFullSize(dirPath) {
  let total = 0;
  try {
    for (const name of readdirSync(dirPath)) {
      try {
        const st = statSync(join(dirPath, name));
        total += st.isDirectory() ? computeFullSize(join(dirPath, name)) : st.size;
      } catch {}
    }
  } catch {}
  return total;
}

// ─── Git Status (feature 1) ───────────────────────────────────────────────────

let gitStatusMap = null; // Map<relPath, status>
let gitRootPath  = null;

function loadGitStatus(rp) {
  // Get git root
  const rootResult = spawnSync('git', ['-C', rp, 'rev-parse', '--show-toplevel'],
    { encoding: 'utf8' });
  if (rootResult.status !== 0) return;
  gitRootPath = rootResult.stdout.trim();

  const result = spawnSync('git', ['-C', rp, 'status', '--porcelain', '-u'],
    { encoding: 'utf8' });
  if (result.status !== 0) return;

  gitStatusMap = new Map();
  for (const line of result.stdout.split('\n')) {
    if (line.length < 4) continue;
    const xy = line.substring(0, 2);
    let filePart = line.substring(3);
    // handle rename: "R old -> new" format in porcelain
    if (xy.startsWith('R') || xy.endsWith('R')) {
      // porcelain v1: "R  old -> new" or "RM old -> new"
      const arrowIdx = filePart.indexOf(' -> ');
      if (arrowIdx !== -1) filePart = filePart.substring(arrowIdx + 4);
    }
    const filePath = filePart.trim();
    let status;
    if (xy === '??') status = 'untracked';
    else if (xy[1] === 'D' || xy[0] === 'D') status = 'deleted';
    else if (xy[0] === 'A') status = 'added';
    else if (xy[0] === 'R' || xy[1] === 'R') status = 'renamed';
    else status = 'modified';
    gitStatusMap.set(filePath, status);
  }
}

function getGitStatus(entryFullPath) {
  if (!gitStatusMap || !gitRootPath) return null;
  const rel = relative(gitRootPath, entryFullPath);
  return gitStatusMap.get(rel) ?? null;
}

function getDirGitStatus(entryFullPath) {
  if (!gitStatusMap || !gitRootPath) return null;
  const rel = relative(gitRootPath, entryFullPath) + '/';
  for (const [k] of gitStatusMap) {
    if (k.startsWith(rel)) return 'modified';
  }
  return null;
}

function gitBadge(status) {
  if (!showGit) return '';
  if (!status)  return '   ';
  switch (status) {
    case 'modified':  return cc('33', '✏️ ');
    case 'added':     return cc('32', '✅ ');
    case 'deleted':   return cc('31', '🗑️ ');
    case 'untracked': return cc('90', '❓ ');
    case 'renamed':   return cc('34', '📝 ');
    default:          return '   ';
  }
}

if (showGit) loadGitStatus(rootPath);

// ─── Language Breakdown (feature 2) ──────────────────────────────────────────

let langBytes = new Map(); // ext -> bytes

const LANG_COLORS = {
  '.go':   '36',
  '.js':   '33', '.mjs':  '33', '.cjs':  '33',
  '.ts':   '34', '.tsx':  '34', '.jsx':  '34',
  '.py':   '34',
  '.rs':   '31',
  '.rb':   '31',
  '.java': '93', '.kt':   '93',
  '.c':    '94', '.cpp':  '94', '.h':    '94', '.hpp':  '94',
  '.sh':   '32', '.bash': '32', '.zsh':  '32',
  '.md':   '37', '.rst':  '37', '.txt':  '37',
  '.json': '35', '.yaml': '35', '.yml':  '35', '.toml': '35',
  '.html': '35', '.css':  '35', '.scss': '35',
};

const LANG_NAMES = {
  '.go':   'Go',
  '.js':   'JavaScript', '.mjs':  'JavaScript', '.cjs':  'JavaScript',
  '.ts':   'TypeScript',  '.tsx':  'TypeScript',  '.jsx':  'JSX',
  '.py':   'Python',
  '.rs':   'Rust',
  '.rb':   'Ruby',
  '.java': 'Java',        '.kt':   'Kotlin',
  '.c':    'C',           '.cpp':  'C++',         '.h':    'C/C++ Header', '.hpp': 'C++ Header',
  '.sh':   'Shell',       '.bash': 'Shell',        '.zsh':  'Shell',
  '.md':   'Markdown',    '.rst':  'reStructuredText', '.txt': 'Text',
  '.json': 'JSON',        '.yaml': 'YAML',         '.yml':  'YAML',    '.toml': 'TOML',
  '.html': 'HTML',        '.css':  'CSS',           '.scss': 'SCSS',
};

function accumulateLangBytes(name, size) {
  const ext = extname(name).toLowerCase();
  const key = ext || 'other';
  langBytes.set(key, (langBytes.get(key) ?? 0) + size);
}

function renderLangBar() {
  if (langBytes.size === 0) return null;
  let total = 0;
  for (const v of langBytes.values()) total += v;
  if (total === 0) return null;

  const sorted = [...langBytes.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const parts = sorted.map(([ext, bytes]) => {
    const pct = ((bytes / total) * 100).toFixed(1);
    const name = LANG_NAMES[ext] ?? (ext === 'other' ? 'Other' : ext.slice(1));
    const colorCode = LANG_COLORS[ext] ?? '90';
    return cc(colorCode, `${name} ${pct}%`);
  });

  return parts.join('  ');
}

// ─── Meta (feature 3) ─────────────────────────────────────────────────────────

const TEXT_EXTENSIONS = new Set([
  '.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx', '.py', '.pyw', '.go', '.rs',
  '.rb', '.php', '.java', '.kt', '.c', '.h', '.cpp', '.hpp', '.cc', '.cxx',
  '.cs', '.swift', '.sh', '.bash', '.zsh', '.fish', '.ps1', '.lua', '.r',
  '.html', '.htm', '.css', '.scss', '.sass', '.less', '.vue', '.svelte',
  '.json', '.json5', '.yaml', '.yml', '.toml', '.ini', '.cfg', '.conf',
  '.md', '.mdx', '.rst', '.txt', '.log', '.csv', '.tsv', '.xml', '.sql',
  '.env', '.gitignore', '.gitattributes', '.editorconfig', '.prettierrc',
  '.eslintrc', '.babelrc',
]);

const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp']);

function computeMeta(filePath, name, size) {
  try {
    const ext = extname(name).toLowerCase();

    if (IMAGE_EXTENSIONS.has(ext)) {
      if (ext === '.png') {
        const buf = Buffer.alloc(24);
        const fd = openSync(filePath, 'r');
        readSync(fd, buf, 0, 24, 0);
        closeSync(fd);
        const w = buf.readUInt32BE(16);
        const h = buf.readUInt32BE(20);
        return `${w}×${h}`;
      } else if (ext === '.jpg' || ext === '.jpeg') {
        const readSize = Math.min(size, 65536);
        const buf = Buffer.alloc(readSize);
        const fd = openSync(filePath, 'r');
        readSync(fd, buf, 0, readSize, 0);
        closeSync(fd);
        for (let i = 0; i < buf.length - 9; i++) {
          if (buf[i] === 0xFF && buf[i+1] >= 0xC0 && buf[i+1] <= 0xC3) {
            const h = buf.readUInt16BE(i + 5);
            const w = buf.readUInt16BE(i + 7);
            return `${w}×${h}`;
          }
        }
        return null;
      } else if (ext === '.gif') {
        const buf = Buffer.alloc(10);
        const fd = openSync(filePath, 'r');
        readSync(fd, buf, 0, 10, 0);
        closeSync(fd);
        const w = buf.readUInt16LE(6);
        const h = buf.readUInt16LE(8);
        return `${w}×${h}`;
      }
      return null;
    }

    if (TEXT_EXTENSIONS.has(ext) && size < 1024 * 1024) {
      const content = readFileSync(filePath, 'utf8');
      const lines = (content.match(/\n/g) ?? []).length + 1;
      return `${lines.toLocaleString()} lines`;
    }
  } catch {}
  return null;
}

// ─── TODO Scanner (feature 4) ─────────────────────────────────────────────────

const TODO_PATTERN = /\b(TODO|FIXME|HACK|BUG|NOTE|XXX)\b/gi;
const TODO_LABELS = ['TODO', 'FIXME', 'HACK', 'BUG', 'NOTE', 'XXX'];

function computeTodos(filePath, size) {
  if (size >= 500 * 1024) return null;
  try {
    const content = readFileSync(filePath, 'utf8');
    const counts = {};
    let m;
    TODO_PATTERN.lastIndex = 0;
    while ((m = TODO_PATTERN.exec(content)) !== null) {
      const key = m[1].toUpperCase();
      counts[key] = (counts[key] ?? 0) + 1;
    }
    const hasAny = Object.values(counts).some(v => v > 0);
    return hasAny ? counts : null;
  } catch {}
  return null;
}

function totalTodoCount(todos) {
  if (!todos) return 0;
  return Object.values(todos).reduce((a, b) => a + b, 0);
}

function renderTodos(todos) {
  if (!todos) return '';
  const parts = [];
  for (const label of TODO_LABELS) {
    if (todos[label]) {
      const color = label === 'FIXME' || label === 'BUG' ? '31' : '33';
      parts.push(cc(color, `[${todos[label]} ${label}]`));
    }
  }
  return parts.join(' ');
}

function renderDirTodos(total) {
  if (!total) return '';
  return cc('90', `[${total}↓]`);
}

// ─── Tree Walk ────────────────────────────────────────────────────────────────

let treeStats = { dirs: 0, files: 0, totalBytes: 0 };

// parentIsLasts: boolean[] — one entry per ancestor level (indices 0..depth-2).
// Each boolean says whether that ancestor was the last child in its parent,
// which determines whether to draw '    ' (true) or '│   ' (false) for that level.
// isLast: whether this entry is the last visible child in its own parent — used
// for the connector ('└── ' vs '├── ').

function walk(dirPath, parentIsLasts, depth, entries) {
  if (depth > maxDepth) return showDu ? computeFullSize(dirPath) : 0;

  let children;
  try { children = readdirSync(dirPath); }
  catch {
    entries.push({ name: '[Permission Denied]', isDir: false, isSymlink: false,
      size: null, mtime: null, duSize: null, perms: null, symTarget: null,
      parentIsLasts: [...parentIsLasts], isLast: true,
      icon: '🚫', colorFn: cErr, error: true,
      fullPath: dirPath, gitStatus: null, meta: null, todos: null });
    return 0;
  }

  // Pre-stat all children
  const fileMeta = {};
  for (const name of children) {
    const cp = join(dirPath, name);
    try {
      const lst = lstatSync(cp);
      const isSymlink = lst.isSymbolicLink();
      const st = isSymlink ? (() => { try { return statSync(cp); } catch { return lst; } })() : lst;
      let symTarget = null;
      if (isSymlink) { try { symTarget = readlinkSync(cp); } catch {} }
      fileMeta[name] = { isDir: st.isDirectory(), isSymlink, size: st.size, mtime: st.mtimeMs,
                     mode: st.mode, symTarget };
    } catch { fileMeta[name] = { isDir: false, isSymlink: false, size: 0, mtime: 0, mode: 0, symTarget: null }; }
  }

  // Apply exclusions
  children = children.filter(name => {
    const { isDir } = fileMeta[name] ?? {};
    return !shouldExclude(name, isDir, dirPath);
  });

  // Apply --find
  if (findPattern) {
    children = children.filter(name => {
      const { isDir } = fileMeta[name];
      return isDir ? dirHasMatch(join(dirPath, name), depth + 1) : matchesGlob(name, findPattern);
    });
  }

  // Sort
  children.sort((a, b) => {
    const sa = fileMeta[a], sb = fileMeta[b];
    if (sa.isDir !== sb.isDir) return sa.isDir ? -1 : 1;
    let cmp = 0;
    if (sortBy === 'date') cmp = sb.mtime - sa.mtime;
    else if (sortBy === 'size') cmp = sb.size - sa.size;
    else cmp = a.toLowerCase().localeCompare(b.toLowerCase());
    return reverseSort ? -cmp : cmp;
  });

  // Apply --max-files (cap per-dir file count, dirs are never capped)
  if (maxFiles !== null) {
    let fileCount = 0;
    children = children.filter(name => {
      if (fileMeta[name].isDir) return true;
      return ++fileCount <= maxFiles;
    });
  }

  let subtreeBytes = 0;

  // Pass 1: recurse into all dirs to collect subEntries and subtree sizes.
  const childData = [];

  for (const name of children) {
    const { isDir, isSymlink, size, mtime, mode, symTarget } = fileMeta[name];
    const childFullPath = join(dirPath, name);
    const { icon, colorFn } = getIconAndColor(name, isDir, isSymlink);
    const perms = showPerms ? formatPerms(mode) : null;

    if (isDir) {
      const childParentIsLasts = [...parentIsLasts, null];
      const subEntries = [];
      const childBytes = walk(childFullPath, childParentIsLasts, depth + 1, subEntries);
      subtreeBytes += childBytes;

      // Git status for dirs: check if any descendant has a status
      const gitStatus = showGit ? (getDirGitStatus(childFullPath) ?? getGitStatus(childFullPath)) : null;

      // Aggregate todos for dirs
      let dirTodoTotal = 0;
      if (showTodo) {
        for (const sub of subEntries) {
          if (sub.todos) dirTodoTotal += totalTodoCount(sub.todos);
          if (sub.dirTodoTotal) dirTodoTotal += sub.dirTodoTotal;
        }
      }

      childData.push({ name, isDir: true, isSymlink, size: null, duSize: childBytes,
        mtime, perms, symTarget, icon, colorFn, fullPath: childFullPath,
        subEntries, childParentIsLasts, gitStatus, dirTodoTotal });
    } else {
      const fileSize = size ?? 0;
      subtreeBytes += fileSize;

      // Accumulate language bytes
      accumulateLangBytes(name, fileSize);

      // Git status for files
      const gitStatus = showGit ? getGitStatus(childFullPath) : null;

      // Meta
      const meta = showMeta ? computeMeta(childFullPath, name, fileSize) : null;

      // TODOs
      const ext = extname(name).toLowerCase();
      const todos = (showTodo && TEXT_EXTENSIONS.has(ext)) ? computeTodos(childFullPath, fileSize) : null;

      const entry = { name, isDir: false, isSymlink, size: fileSize, duSize: null,
        mtime, perms, symTarget, icon, colorFn, fullPath: childFullPath,
        parentIsLasts: [...parentIsLasts], isLast: false,
        gitStatus, meta, todos };
      childData.push({ name, isDir: false, entry });
    }
  }

  // Pass 2: determine which children are visible, assign isLast, fix up parentIsLasts.

  const visibleIndices = [];
  for (let i = 0; i < childData.length; i++) {
    const cd = childData[i];
    if (cd.isDir) {
      if (pruneEmpty && cd.subEntries.length === 0) continue;
      visibleIndices.push(i);
    } else {
      const { entry } = cd;
      if (!passesFilters(entry)) continue;
      if (dirsOnly) continue;
      // --todo-only: skip files with no todos
      if (todoOnly && !entry.todos) continue;
      visibleIndices.push(i);
    }
  }

  for (let vi = 0; vi < visibleIndices.length; vi++) {
    const i = visibleIndices[vi];
    const cd = childData[i];
    const isLast = vi === visibleIndices.length - 1;

    if (cd.isDir) {
      if (!filesOnly) {
        for (const e of cd.subEntries) e.parentIsLasts[parentIsLasts.length] = isLast;
        treeStats.dirs++;
        entries.push({ name: cd.name, isDir: true, isSymlink: cd.isSymlink,
          size: null, duSize: cd.duSize, mtime: cd.mtime, perms: cd.perms,
          symTarget: cd.symTarget, icon: cd.icon, colorFn: cd.colorFn,
          fullPath: cd.fullPath,
          parentIsLasts: [...parentIsLasts], isLast,
          gitStatus: cd.gitStatus, meta: null, todos: null,
          dirTodoTotal: cd.dirTodoTotal });
      } else {
        for (const e of cd.subEntries) e.parentIsLasts[parentIsLasts.length] = true;
      }
      entries.push(...cd.subEntries);
    } else {
      const { entry } = cd;
      entry.isLast = isLast;
      treeStats.files++;
      treeStats.totalBytes += entry.size;
      entries.push(entry);
    }
  }

  return subtreeBytes;
}

// ─── Squash (feature 5) ───────────────────────────────────────────────────────

function applySquash(entries) {
  let changed = true;
  while (changed) {
    changed = false;
    for (let i = 0; i < entries.length - 1; i++) {
      const cur  = entries[i];
      const next = entries[i + 1];

      // cur must be a dir
      if (!cur.isDir) continue;
      // next must be a dir
      if (!next.isDir) continue;
      // next's depth must be exactly one deeper
      if (next.parentIsLasts.length !== cur.parentIsLasts.length + 1) continue;
      // next must be the only child — isLast=true guarantees no siblings after it,
      // and dirs-first sorting guarantees no file siblings come before it either.
      if (!next.isLast) continue;

      // Squash: merge names
      cur.name = cur.name + '/' + next.name;
      cur.fullPath = next.fullPath;
      cur.mtime    = next.mtime;
      cur.duSize   = next.duSize;

      // Remove next entry
      entries.splice(i + 1, 1);

      // Fix grandchildren: remove the extra parentIsLasts level
      const removeIdx = cur.parentIsLasts.length;
      for (let j = i + 1; j < entries.length; j++) {
        const e = entries[j];
        if (e.parentIsLasts.length <= removeIdx) break;
        e.parentIsLasts.splice(removeIdx, 1);
      }

      changed = true;
      break;
    }
  }
  return entries;
}

// ─── JSON output ──────────────────────────────────────────────────────────────

function buildJsonTree(dirPath, depth) {
  if (depth > maxDepth) return null;
  let children;
  try { children = readdirSync(dirPath); } catch { return null; }

  const meta = {};
  for (const name of children) {
    const cp = join(dirPath, name);
    try {
      const lst = lstatSync(cp);
      const isSymlink = lst.isSymbolicLink();
      const st = isSymlink ? (() => { try { return statSync(cp); } catch { return lst; } })() : lst;
      let symTarget = null;
      if (isSymlink) { try { symTarget = readlinkSync(cp); } catch {} }
      meta[name] = { isDir: st.isDirectory(), isSymlink, size: st.size, mtime: st.mtimeMs, symTarget };
    } catch { meta[name] = { isDir: false, isSymlink: false, size: 0, mtime: 0, symTarget: null }; }
  }

  children = children.filter(n => !shouldExclude(n, meta[n]?.isDir, dirPath));
  if (findPattern) {
    children = children.filter(n => meta[n].isDir
      ? dirHasMatch(join(dirPath, n), depth + 1)
      : matchesGlob(n, findPattern));
  }

  const result = [];
  for (const name of children) {
    const { isDir, isSymlink, size, mtime, symTarget } = meta[name];
    const cp = join(dirPath, name);
    if (isDir) {
      const sub = buildJsonTree(cp, depth + 1);
      const node = { name, type: 'directory', path: cp, mtime: formatDate(mtime) };
      if (showDu) node.size = formatSize(computeFullSize(cp));
      if (symTarget) node.symTarget = symTarget;
      node.children = sub ?? [];
      result.push(node);
    } else {
      const node = { name, type: 'file', path: cp, size: formatSize(size), size_bytes: size,
                     mtime: formatDate(mtime) };
      if (isSymlink && symTarget) node.symTarget = symTarget;
      if (!dirsOnly) result.push(node);
    }
  }
  return result;
}

// ─── CSV output ───────────────────────────────────────────────────────────────

function emitCsv(entries) {
  console.log('path,type,size_bytes,size_human,mtime,perms');
  for (const e of entries) {
    const type = e.isDir ? 'directory' : 'file';
    const sz = e.isDir ? (showDu ? e.duSize ?? '' : '') : (e.size ?? '');
    const szh = e.isDir ? (showDu ? formatSize(e.duSize) : '') : formatSize(e.size);
    const dt = e.mtime ? formatDate(e.mtime) : '';
    const p = e.perms ?? '';
    const path = `"${e.fullPath.replace(/"/g, '""')}"`;
    console.log(`${path},${type},${sz},${szh},${dt},${p}`);
  }
}

// ─── Diff mode (feature 6) ────────────────────────────────────────────────────

function buildFlatMap(dirPath, depth, relBase) {
  const map = new Map();
  if (depth > maxDepth) return map;
  let children;
  try { children = readdirSync(dirPath); } catch { return map; }
  for (const name of children) {
    const fullP = join(dirPath, name);
    let st;
    try { st = statSync(fullP); } catch { continue; }
    const rel = relBase ? relBase + '/' + name : name;
    if (st.isDirectory()) {
      const sub = buildFlatMap(fullP, depth + 1, rel);
      for (const [k, v] of sub) map.set(k, v);
    } else {
      map.set(rel, { size: st.size, mtime: st.mtimeMs });
    }
  }
  return map;
}

function runDiff(path1, path2) {
  const p1 = resolve(path1);
  const p2 = resolve(path2);

  console.log(cTr(`Comparing: ${p1}  ↔  ${p2}`));
  console.log('');

  const map1 = buildFlatMap(p1, 1, '');
  const map2 = buildFlatMap(p2, 1, '');

  const allKeys = new Set([...map1.keys(), ...map2.keys()]);
  const removed = [], added = [], changed = [], same = [];

  for (const k of [...allKeys].sort()) {
    const v1 = map1.get(k);
    const v2 = map2.get(k);
    if (v1 && !v2) removed.push({ k, v1 });
    else if (!v1 && v2) added.push({ k, v2 });
    else if (v1.size !== v2.size) changed.push({ k, v1, v2 });
    else same.push({ k, v1 });
  }

  const nameWidth = Math.max(
    ...removed.map(x => x.k.length),
    ...added.map(x => x.k.length),
    ...changed.map(x => x.k.length),
    20
  ) + 2;

  for (const { k, v1 } of removed) {
    console.log(c('31', `- ${k.padEnd(nameWidth)}  ${formatSize(v1.size).padStart(10)}`));
  }
  for (const { k, v2 } of added) {
    console.log(c('32', `+ ${k.padEnd(nameWidth)}  ${formatSize(v2.size).padStart(10)}`));
  }
  for (const { k, v1, v2 } of changed) {
    const delta = v2.size - v1.size;
    const deltaStr = (delta >= 0 ? '+' : '') + formatSize(Math.abs(delta));
    const sign = delta >= 0 ? '+' : '-';
    console.log(c('33', `~ ${k.padEnd(nameWidth)}  ${formatSize(v1.size).padStart(8)} → ${formatSize(v2.size).padStart(8)}  (${sign}${formatSize(Math.abs(delta))})`));
  }
  if (diffAll) {
    for (const { k, v1 } of same) {
      console.log(cTr(`= ${k.padEnd(nameWidth)}  ${formatSize(v1.size).padStart(10)}`));
    }
  }

  console.log('');
  const parts = [];
  if (removed.length) parts.push(c('31', `${removed.length} removed`));
  if (added.length)   parts.push(c('32', `${added.length} added`));
  if (changed.length) parts.push(c('33', `${changed.length} changed`));
  if (same.length && diffAll) parts.push(cTr(`${same.length} same`));
  if (parts.length === 0) parts.push(cTr('No differences found'));
  console.log(parts.join(', '));
}

// ─── Render output ────────────────────────────────────────────────────────────

function renderOutput(entries, rootDuSize) {
  const totalStr = formatSize(treeStats.totalBytes);
  const footer = `${treeStats.dirs} director${treeStats.dirs === 1 ? 'y' : 'ies'}, ` +
                 `${treeStats.files} file${treeStats.files === 1 ? '' : 's'}, ${totalStr} total`;

  if (countOnly) { console.log(cSum(footer)); return; }

  // Apply squash if requested
  let displayEntries = doSquash ? applySquash([...entries]) : entries;

  // Compute max visual width for column alignment
  const rootDisplay = fullPath ? rootPath : basename(rootPath);
  const gitPrefixWidth = showGit ? 3 : 0; // 3 chars for git badge
  let maxNameWidth = visualWidth(rootDisplay) + 4 + gitPrefixWidth;
  for (const e of displayEntries) {
    const displayName = fullPath ? e.fullPath : e.name;
    const prefix = e.parentIsLasts.map(b => b ? '    ' : '│   ').join('');
    const connector = e.isLast ? '└── ' : '├── ';
    const gitPad = showGit ? '   ' : '';
    const w = visualWidth(gitPad + prefix + connector + e.icon + ' ' + displayName);
    if (w > maxNameWidth) maxNameWidth = w;
  }
  maxNameWidth += 2;

  // Root header
  const rootSummary = showDu ? formatSize(rootDuSize) : `${treeStats.dirs} dirs, ${treeStats.files} files, ${totalStr}`;
  const projectSuffix = projectInfo ? '  ' + cTr(`[${projectInfo}]`) : '';
  console.log(cd(`📁 ${rootDisplay}/`) + '  ' + cTr(`(${rootSummary})`) + projectSuffix);

  // Entries
  for (const e of displayEntries) {
    const displayName = fullPath ? e.fullPath : e.name;
    const prefix = e.parentIsLasts.map(b => b ? '    ' : '│   ').join('');
    const connector = e.isLast ? '└── ' : '├── ';
    const gitStr = showGit ? gitBadge(e.gitStatus) : '';
    const nameColRaw = (showGit ? '   ' : '') + prefix + connector + (noIconsFlag ? ' ' : e.icon) + ' ' + displayName + (e.isDir ? '/' : '');
    const pad = ' '.repeat(Math.max(2, maxNameWidth - visualWidth(nameColRaw)));

    const iconPart = noIconsFlag ? ' ' : e.icon;
    const treePrefix = cTr(prefix + connector);
    const symSuffix  = e.symTarget ? cArr(` → ${e.symTarget}`) : '';
    const coloredName = e.colorFn(displayName + (e.isDir ? '/' : '')) + symSuffix;
    const nameCol = gitStr + treePrefix + iconPart + ' ' + coloredName;

    // Permissions column
    const permCol = showPerms ? cPrm((e.perms ?? '         ') + '  ') : '';

    // Size column (7-char right-aligned)
    const sizeVal = e.isDir ? (showDu ? e.duSize : null) : e.size;
    const sizeStr = (sizeVal !== null && sizeVal !== undefined) ? formatSize(sizeVal) : '';
    const sizePadded = cSz(sizeStr.padStart(7));

    // Date column
    const dateStr = e.mtime ? formatDate(e.mtime) : '';

    // Meta column
    const metaStr = (showMeta && e.meta) ? '  ' + cTr(e.meta) : '';

    // Todo column
    let todoStr = '';
    if (showTodo) {
      if (e.isDir && e.dirTodoTotal) {
        todoStr = '  ' + renderDirTodos(e.dirTodoTotal);
      } else if (!e.isDir && e.todos) {
        todoStr = '  ' + renderTodos(e.todos);
      }
    }

    if (!sizeStr) {
      console.log(`${nameCol}${pad}${permCol}         ${cDt(dateStr)}${metaStr}${todoStr}`);
    } else {
      console.log(`${nameCol}${pad}${permCol}${sizePadded}  ${cDt(dateStr)}${metaStr}${todoStr}`);
    }
  }

  // Language bar footer
  const langBar = renderLangBar();
  if (langBar && !countOnly && !jsonOut && !csvOut) {
    console.log('');
    console.log(langBar);
  }

  // Footer
  console.log('');
  console.log(cSum(footer));
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const rootName = basename(rootPath);
try { statSync(rootPath); } catch (err) {
  console.error(cErr(`trex: cannot access '${rootPath}': ${err.message}`));
  process.exit(1);
}

// ── Diff mode ──
if (diffPath !== null) {
  runDiff(rootPath, diffPath);
  process.exit(0);
}

// ── JSON mode ──
if (jsonOut) {
  const tree = {
    name: rootName, type: 'directory', path: rootPath,
    mtime: formatDate(statSync(rootPath).mtimeMs),
    children: buildJsonTree(rootPath, 1) ?? [],
  };
  if (showDu) tree.size = formatSize(computeFullSize(rootPath));
  console.log(JSON.stringify(tree, null, 2));
  process.exit(0);
}

// ── Collect entries (all other modes) ──
const entries = [];
const rootDuSize = walk(rootPath, [], 1, entries);

// ── CSV mode ──
if (csvOut) { emitCsv(entries); process.exit(0); }

// ── Summary only ──
if (countOnly) {
  const totalStr = formatSize(treeStats.totalBytes);
  const footer = `${treeStats.dirs} director${treeStats.dirs === 1 ? 'y' : 'ies'}, ` +
                 `${treeStats.files} file${treeStats.files === 1 ? '' : 's'}, ${totalStr} total`;
  console.log(cSum(footer));
  process.exit(0);
}

// ── Watch mode (feature 7) ──
if (watchMode) {
  renderOutput(entries, rootDuSize);
  console.log(cTr('Press Ctrl+C to stop watching...'));

  let debounceTimer = null;
  let lastFile = '';

  const watcher = fsWatch(rootPath, { recursive: true }, (eventType, filename) => {
    lastFile = filename ?? '';
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      // Reset stats
      treeStats = { dirs: 0, files: 0, totalBytes: 0 };
      langBytes  = new Map();

      // Clear screen
      process.stdout.write('\x1b[2J\x1b[H');

      // Status line
      console.log(cTr(`[watching] last change: ${lastFile} at ${new Date().toLocaleTimeString()}`));

      // Reload git status if needed
      if (showGit) {
        gitStatusMap = null;
        gitRootPath  = null;
        loadGitStatus(rootPath);
      }

      // Re-walk and re-render
      const newEntries = [];
      const newRootDuSize = walk(rootPath, [], 1, newEntries);
      renderOutput(newEntries, newRootDuSize);
      console.log(cTr('Press Ctrl+C to stop watching...'));
    }, 150);
  });

  process.on('SIGINT', () => {
    watcher.close();
    process.exit(0);
  });
} else {
  // ── Normal render ──
  renderOutput(entries, rootDuSize);
}
