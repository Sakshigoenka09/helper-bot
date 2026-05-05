let pipeline;

async function embedText(text) {
  if (!pipeline) {
    const { pipeline: transformersPipeline } = await import('@xenova/transformers');
    pipeline = await transformersPipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }

  const output = await pipeline(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}

module.exports = { embedText };
