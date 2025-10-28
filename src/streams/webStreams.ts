export function mergeStreams(streamA: ReadableStream, streamB: ReadableStream) {
  const readerA = streamA.pipeThrough(new TextDecoderStream()).getReader()
  const readerB = streamB.pipeThrough(new TextDecoderStream()).getReader()

  return new ReadableStream({
    start(controller) {
      const pump = async (reader: ReadableStreamDefaultReader) => {
        for (;;) {
          const { done, value } = await reader.read()
          if (done) break
          controller.enqueue(value)
        }
      }
      Promise.all([pump(readerA), pump(readerB)]).then(() => controller.close())
    },
  })
}
