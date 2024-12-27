# Child Process

- Drop-in replacement

```ts
import { spawnPlus } from '#/utils/child_process'
```

### spawnPlus

- emit stderr messages on exit
- shell is true by default

```ts
const child = spawnPlus('ls --color')
child.on('errorPlus', (stderr) => {})
```