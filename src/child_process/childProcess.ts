import { spawn, spawnSync } from 'node:child_process'

export * from 'node:child_process'

export async function runCmd(
  cmd: string,
  options?: SpawnSyncOptions,
): Promise<void> {
  const newOptions = { stdio: 'inherit', shell: true, ...options }
  console.log(cmd)
  const { status } = spawnSync(cmd, newOptions as SpawnSyncOptions)
  if (status !== 0) {
    throw new ShellError(`Command ${cmd} failed with status ${status}`, {
      status,
    })
  }
}

export async function captureCmd(
  cmd: string,
  options?: SpawnSyncOptions,
): Promise<string> {
  const newOptions = {
    stdio: ['inherit', 'pipe', 'pipe'],
    shell: true,
    encoding: 'utf8',
    ...options,
  }
  console.log(cmd)
  const { status, stdout, stderr } = spawnSync(
    cmd,
    newOptions as SpawnSyncOptions,
  )
  if (status === 0) {
    return stdout.toString().trim()
  }
  throw new ShellError(`Command ${cmd} failed with status ${status}`, {
    status: status ?? 1,
    stdout: stdout.toString().trim(),
    stderr: stderr.toString().trim(),
  })
}

export async function runAndCaptureCmd(
  cmd: string,
  options?: SpawnOptions,
): Promise<string> {
  const newOptions = {
    stdio: ['inherit', 'pipe', 'pipe'],
    shell: true,
    ...options,
  }
  console.log(cmd)
  const child = spawn(cmd, newOptions as SpawnOptions)
  let output = ''
  child.stdout?.on('data', (chunk) => {
    process.stdout.write(chunk)
    output += chunk
  })
  child.stderr?.on('data', (chunk) => {
    process.stderr.write(chunk)
    output += chunk
  })
  return new Promise((resolve, reject) => {
    child.on('close', (status) => {
      if (status === 0) {
        resolve(output.trim())
      }
      throw new ShellError(`Command ${cmd} failed with status ${status}`, {
        status: status ?? 1,
        output,
      })
    })
  })
}

export async function runAndCaptureCmdInTty(
  cmd: string,
  options?: SpawnOptions,
): Promise<string> {
  const { default: pty } = await import('node-pty')
  const newOptions = {
    stdio: ['inherit', 'pipe', 'pipe'],
    shell: true,
    ...options,
  }
  console.log(cmd)
  const child = pty.spawn('/bin/sh', ['-c', cmd], newOptions as SpawnOptions)
  let output = ''
  child.stdout?.on('data', (chunk: string) => {
    process.stdout.write(chunk)
    output += chunk
  })
  child.stderr?.on('data', (chunk: string) => {
    process.stderr.write(chunk)
    output += chunk
  })
  return new Promise((resolve) => {
    child.on('close', (status: number) => {
      if (status === 0) {
        resolve(output.trim())
      }
      throw new ShellError(`Command ${cmd} failed with status ${status}`, {
        status,
        output,
      })
    })
  })
}

type SpawnArgs = Parameters<typeof spawn>

type SpawnOptions = SpawnArgs[2]

type SpawnSyncArgs = Parameters<typeof spawnSync>

type SpawnSyncOptions = SpawnSyncArgs[2]

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
