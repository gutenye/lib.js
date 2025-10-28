export async function runCmd(
  cmd: string,
  options?: SpawnSyncArgs[1],
): Promise<void> {
  const newOptions = {
    stdio: ['inherit', 'inherit', 'inherit'],
    ...options,
  } as SpawnSyncArgs[1]
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
  options?: SpawnSyncArgs[1],
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
  } = Bun.spawnSync(['/bin/sh', '-c', cmd], newOptions as SpawnSyncArgs[1])
  if (status === 0) {
    return stdout?.toString().trim() ?? ''
  }
  throw new ShellError(`Command ${cmd} failed with status ${status}`, {
    status,
    stdout: stdout?.toString().trim(),
    stderr: stderr?.toString().trim(),
  })
}

type SpawnSyncArgs = Parameters<typeof Bun.spawnSync>

export class ShellError extends Error {
  status: number
  stdout: string
  stderr: string
  output: string

  constructor(
    message: string,
    {
      status = 1,
      stdout = '',
      stderr = '',
      output = '',
    }: {
      status: number
      stdout?: string
      stderr?: string
      output?: string
    },
  ) {
    super(message)
    this.name = new.target.name
    this.status = status
    this.stdout = stdout
    this.stderr = stderr
    this.output = output
  }
  toJSON() {
    const { name, message, stack, ...rest } = this
    return { name, message, stack, ...rest }
  }
}
