import { describe, expect, it } from 'bun:test'
import { mergeStreams } from '../webStreams'

describe('mergeStreams', () => {
  it('should merge two streams with text data', async () => {
    const streamA = createTextStream(['Hello ', 'from ', 'stream A'])
    const streamB = createTextStream(['Hello ', 'from ', 'stream B'])

    const mergedStream = mergeStreams(streamA, streamB)
    const result = await readStreamToArray(mergedStream)

    // Should contain all chunks from both streams
    expect(result).toHaveLength(6)
    expect(result).toContain('Hello ')
    expect(result).toContain('from ')
    expect(result).toContain('stream A')
    expect(result).toContain('stream B')
  })

  it('should handle empty streams', async () => {
    const emptyStreamA = new ReadableStream({
      start(controller) {
        controller.close()
      },
    })
    const emptyStreamB = new ReadableStream({
      start(controller) {
        controller.close()
      },
    })

    const mergedStream = mergeStreams(emptyStreamA, emptyStreamB)
    const result = await readStreamToArray(mergedStream)

    expect(result).toHaveLength(0)
  })

  it('should handle one empty stream and one with data', async () => {
    const emptyStream = new ReadableStream({
      start(controller) {
        controller.close()
      },
    })
    const dataStream = createTextStream(['test', 'data'])

    const mergedStream = mergeStreams(emptyStream, dataStream)
    const result = await readStreamToArray(mergedStream)

    expect(result).toHaveLength(2)
    expect(result).toContain('test')
    expect(result).toContain('data')
  })

  it('should handle streams with different amounts of data', async () => {
    const shortStream = createTextStream(['short'])
    const longStream = createTextStream([
      'long',
      'stream',
      'with',
      'more',
      'data',
    ])

    const mergedStream = mergeStreams(shortStream, longStream)
    const result = await readStreamToArray(mergedStream)

    expect(result).toHaveLength(6)
    expect(result).toContain('short')
    expect(result).toContain('long')
    expect(result).toContain('stream')
    expect(result).toContain('with')
    expect(result).toContain('more')
    expect(result).toContain('data')
  })

  it('should handle streams that produce data at different rates', async () => {
    // Create a slow stream
    const slowStream = new ReadableStream({
      start(controller) {
        setTimeout(() => {
          controller.enqueue(new TextEncoder().encode('slow1'))
          setTimeout(() => {
            controller.enqueue(new TextEncoder().encode('slow2'))
            controller.close()
          }, 50)
        }, 50)
      },
    })

    // Create a fast stream
    const fastStream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('fast1'))
        controller.enqueue(new TextEncoder().encode('fast2'))
        controller.close()
      },
    })

    const mergedStream = mergeStreams(slowStream, fastStream)
    const result = await readStreamToArray(mergedStream)

    expect(result).toHaveLength(4)
    expect(result).toContain('slow1')
    expect(result).toContain('slow2')
    expect(result).toContain('fast1')
    expect(result).toContain('fast2')
  })

  it('should handle binary data streams', async () => {
    const binaryStreamA = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('binary A'))
        controller.close()
      },
    })

    const binaryStreamB = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('binary B'))
        controller.close()
      },
    })

    const mergedStream = mergeStreams(binaryStreamA, binaryStreamB)
    const result = await readStreamToArray(mergedStream)

    expect(result).toHaveLength(2)
    expect(result).toContain('binary A')
    expect(result).toContain('binary B')
  })

  it('should close the merged stream when both input streams are closed', async () => {
    const streamA = createTextStream(['A'])
    const streamB = createTextStream(['B'])

    const mergedStream = mergeStreams(streamA, streamB)
    const reader = mergedStream.getReader()

    const chunks: string[] = []
    let done = false

    while (!done) {
      const result = await reader.read()
      done = result.done
      if (!done) {
        chunks.push(result.value)
      }
    }

    reader.releaseLock()

    expect(chunks).toHaveLength(2)
    expect(done).toBe(true)
  })

  it('should handle streams with unicode characters', async () => {
    const unicodeStreamA = createTextStream(['🚀', '✨'])
    const unicodeStreamB = createTextStream(['🎉', '🔥'])

    const mergedStream = mergeStreams(unicodeStreamA, unicodeStreamB)
    const result = await readStreamToArray(mergedStream)

    expect(result).toHaveLength(4)
    expect(result).toContain('🚀')
    expect(result).toContain('✨')
    expect(result).toContain('🎉')
    expect(result).toContain('🔥')
  })
})

// Helper function to create a ReadableStream from string data
function createTextStream(data: string[]): ReadableStream {
  let index = 0
  return new ReadableStream({
    start(controller) {
      const pump = () => {
        if (index < data.length) {
          controller.enqueue(new TextEncoder().encode(data[index]))
          index++
          setTimeout(pump, 10) // Small delay to simulate async behavior
        } else {
          controller.close()
        }
      }
      pump()
    },
  })
}

// Helper function to read all data from a ReadableStream
async function readStreamToArray(stream: ReadableStream): Promise<string[]> {
  const reader = stream.getReader()
  const chunks: string[] = []

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
    }
  } finally {
    reader.releaseLock()
  }

  return chunks
}
