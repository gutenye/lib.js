export async function runCmd(
  cmd: string,
  options?: SpawnSyncOptions,
): Promise<void> {
  const newOptions = {
    stdio: ['inherit', 'inherit', 'inherit'],
    ...options,
  } as SpawnSyncOptions
  console.log(cmd)
  const { exitCode } = Bun.spawnSync(['/bin/sh', '-c', cmd], newOptions)
  if (exitCode !== 0) {
    throw new ShellError(`Command '${cmd}' exited with code ${exitCode}`, {
      status: exitCode,
    })
  }
}

export async function captureCmd(
  cmd: string,
  options?: SpawnSyncOptions,
): Promise<string> {
  const newOptions = {
    stdio: ['inherit', 'pipe', 'pipe'],
    ...options,
  }
  console.log(cmd)
  const {
    exitCode: status,
    stdout,
    stderr,
  } = Bun.spawnSync(['/bin/sh', '-c', cmd], newOptions as SpawnSyncOptions)
  if (status === 0) {
    return stdout?.toString().trim() ?? ''
  }
  throw new ShellError(`Command ${cmd} failed with status ${status}`, {
    status,
    stdout: stdout?.toString().trim(),
    stderr: stderr?.toString().trim(),
  })
}

export async function runAndCaptureCmd(
  cmd: string,
  options?: SpawnSyncOptions,
): Promise<string> {
  console.log(cmd)

  const newOptions = {
    stdio: ['inherit', 'pipe', 'pipe'],
    ...options,
  }
  const child = Bun.spawn(
    ['/bin/sh', '-c', cmd],
    newOptions as SpawnSyncOptions,
  )

  let stdout = ''
  let stderr = ''
  await Promise.all([
    (async () => {
      for await (const chunk of child.stdout.pipeThrough(
        new TextDecoderStream(),
      )) {
        process.stdout.write(chunk)
        stdout += chunk
      }
    })(),
    (async () => {
      for await (const chunk of child.stderr.pipeThrough(
        new TextDecoderStream(),
      )) {
        process.stderr.write(chunk)
        stderr += chunk
      }
    })(),
  ])

  const exitCode = await child.exited
  stdout = stdout.trim()
  stderr = stderr.trim()
  if (exitCode === 0) {
    return stdout
  }
  throw new ShellError(`Command ${cmd} failed with status ${exitCode}`, {
    status: exitCode,
    stdout,
    stderr,
  })
}

type SpawnSyncArgs = Parameters<typeof Bun.spawnSync>

type SpawnSyncOptions = SpawnSyncArgs[1]

export class ShellError extends Error {
  status: number
  stdout: string
  stderr: string

  constructor(
    message: string,
    {
      status = 1,
      stdout = '',
      stderr = '',
    }: {
      status: number
      stdout?: string
      stderr?: string
    },
  ) {
    super(message)
    this.name = new.target.name
    this.status = status
    this.stdout = stdout
    this.stderr = stderr
  }
  toJSON() {
    const { name, message, stack, ...rest } = this
    return { name, message, stack, ...rest }
  }
}
