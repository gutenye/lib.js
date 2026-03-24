# fs & path

## fs

- From https://github.com/jprichardson/node-fs-extra
- Drop-in replacement

```ts
import fs from '#/utils/fs'
```

| Method | Description |
| --- | --- |
| `inputFile(path, options?)` | readFile, undefined if not found |
| `outputFile(path, data, options?)` | writeFile, mkMissingDirs |
| `inputJson(path, options?)` | readJson, undefined if not found |
| `readJson(path, options?)` | readJson, throws if not found |
| `copy(src, dest)` | recursive, mkMissingDirs |
| `copyFile(src, dest)` | single file, mkMissingDirs |
| `move(src, dest)` | rename, mkMissingDirs |
| `remove(path)` | recursive, force |
| `mkdir(path)` | recursive |
| `ensureDirEmpty(path)` | create if missing, throw if not empty |
| `walk(dir)` | recursive async generator of file paths |
| `pathExists(path)` | true/false |
| `isFile(path)` | true/false, false if not found |
| `isDir(path)` | true/false, false if not found |
| `isSymlink(path)` | true/false, false if not found |
| `expandHome(path)` | expand ~ to home dir |
| `expandAbs(path)` | resolve to absolute, expand ~ |
| `cleanPath(path)` | expand ~, remove trailing slashes |
| `isNodeError(error)` | type guard for NodeJS.ErrnoException |

## path

- Drop-in replacement

```ts
import nodePath from '#/utils/path'
```

| Method | Description |
| --- | --- |
| `nameAddSuffix(path, suffix)` | `a.js` → `a-suffix.js` |
| `replaceName(path, name)` | `a.js` → `name.js` |
| `replaceExt(path, ext)` | `a.js` → `a.py` |
| `genUniquePath(path)` | append `(1)`, `(2)` if path exists |
| `hasExt(path, exts)` | check if path has one of the extensions |
