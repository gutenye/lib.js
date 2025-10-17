import { spawn, spawnSync } from 'node:child_process'

export * from 'node:child_process'

export function runCmdSync(cmd: string, options?: SpawnSyncArgs[2]) {
  const newOptions = { shell: true, stdio: 'inherit', ...options }
  const { status } = spawnSync(cmd, newOptions as SpawnSyncArgs[2])
  if (status !== 0) {
    throw new ShellError(`Command ${cmd} failed with status ${status}`, {
      status,
    })
  }
}

export function captureCmdSync(cmd: string, options?: SpawnSyncArgs[2]) {
  const newOptions = { shell: true, encoding: 'utf8', ...options }
  const { status, stdout, stderr } = spawnSync(
    cmd,
    newOptions as SpawnSyncArgs[2],
  )
  if (status === 0) {
    return { stdout, stderr }
  }
  throw new ShellError(`Command ${cmd} failed with status ${status}`, {
    status,
    stdout: stdout as string,
    stderr: stderr as string,
  })
}

export async function runAndCaptureCmd(cmd: string, options?: SpawnArgs[2]) {
  const newOptions = { shell: true, ...options }
  const child = spawn(cmd, newOptions as SpawnArgs[2])
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
      if (status !== 0) {
        resolve({ output: output.trim() })
      }
      throw new ShellError(`Command ${cmd} failed with status ${status}`, {
        status,
        output,
      })
    })
  })
}

export async function runAndCaptureCmdInTty(
  cmd: string,
  options?: SpawnArgs[2],
) {
  const { default: pty } = await import('node-pty')
  const newOptions = { shell: true, ...options }
  const child = pty.spawn('/bin/sh', ['-c', cmd], newOptions as SpawnArgs[2])
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
      const newOutput = output.trim()
      resolve({ status, output: newOutput })
    })
  })
}

type SpawnArgs = Parameters<typeof spawn>

type SpawnSyncArgs = Parameters<typeof spawnSync>

export class ShellError extends Error {
  status: number | null
  stdout: string | null
  stderr: string | null
  output: string | null

  constructor(
    message: string,
    {
      status = null,
      stdout = null,
      stderr = null,
      output = null,
    }: {
      status: number | null
      stdout?: string | null
      stderr?: string | null
      output?: string | null
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
