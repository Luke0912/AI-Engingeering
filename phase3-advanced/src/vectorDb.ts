import fs from 'fs';
import path from 'path';

// We import the HuggingFace Transformers library to generate embeddings locally.
// This requires NO API keys and runs entirely on your CPU!
import { pipeline, FeatureExtractionPipeline } from '@xenova/transformers';

export interface DocumentChunk {
  id: string;
  text: string;
  vector: number[];
  source: string;
}

export class VectorDB {
  private chunks: DocumentChunk[] = [];
  private embedder: FeatureExtractionPipeline | null = null;
  private isInitialized = false;

  /**
   * Initializes the embedding model.
   * Downloads a small ~22MB model (Xenova/all-MiniLM-L6-v2) on first run.
   */
  async init() {
    if (this.isInitialized) return;

    console.log('🧠 [VectorDB] Initializing local embedding model (this may take a moment on first run)...');

    // Create a feature extraction pipeline. 
    // all-MiniLM-L6-v2 is the industry standard open-source embedding model.
    this.embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
      quantized: true // Use a compressed version to save memory
    });

    this.isInitialized = true;
    console.log('✅ [VectorDB] Model loaded!');
  }

  /**
   * Converts a string of text into a high-dimensional vector array.
   */
  async getEmbedding(text: string): Promise<number[]> {
    if (!this.embedder) throw new Error("Embedder not initialized!");

    // Generate the embedding tensor
    const output = await this.embedder(text, { pooling: 'mean', normalize: true });

    // Extract the raw float array from the tensor
    return Array.from(output.data);
  }

  /**
   * Reads all .txt files from a directory, chunks them into paragraphs,
   * generates vectors for each chunk, and saves them in memory.
   */
  async loadKnowledgeBase(directoryPath: string) {
    if (!this.isInitialized) await this.init();

    console.log(`📚 [VectorDB] Scanning knowledge base at: ${directoryPath}`);

    if (!fs.existsSync(directoryPath)) {
      console.warn(`⚠️ [VectorDB] Directory does not exist: ${directoryPath}`);
      return;
    }

    const files = fs.readdirSync(directoryPath).filter(f => f.endsWith('.txt'));

    for (const file of files) {
      const filePath = path.join(directoryPath, file);
      const content = fs.readFileSync(filePath, 'utf-8');

      // Basic Chunking: Split by double-newlines (paragraphs)
      const paragraphs = content.split('\n\n').map(p => p.trim()).filter(p => p.length > 20);

      console.log(`📄 [VectorDB] Processing ${file}: ${paragraphs.length} chunks found.`);

      for (let i = 0; i < paragraphs.length; i++) {
        const text = paragraphs[i];
        const vector = await this.getEmbedding(text);

        this.chunks.push({
          id: `${file}-chunk-${i}`,
          text,
          vector,
          source: file
        });
      }
    }

    console.log(`💾 [VectorDB] Knowledge base loaded. Total vector chunks in memory: ${this.chunks.length}`);
  }

  /**
   * Performs a mathematical Cosine Similarity search to find the most relevant chunks.
   */
  async search(query: string, topK: number = 2): Promise<DocumentChunk[]> {
    if (!this.isInitialized) await this.init();
    if (this.chunks.length === 0) return []; // Nothing to search

    const queryVector = await this.getEmbedding(query);

    // Calculate cosine similarity against all chunks
    const results = this.chunks.map(chunk => {
      const similarity = this.cosineSimilarity(queryVector, chunk.vector);
      return { chunk, similarity };
    });

    // Sort descending by similarity
    results.sort((a, b) => b.similarity - a.similarity);

    // Return the top K results
    return results.slice(0, topK).map(r => r.chunk);
  }

  /**
   * The core math behind Vector Databases: Cosine Similarity.
   * Returns a score between -1 and 1 indicating how similar two vectors are.
   */
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}

// Export a singleton instance
export const vectorDb = new VectorDB();
