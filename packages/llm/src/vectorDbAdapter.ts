// @typepurify/llm - Vector DB Adapter (In-Memory Zero-Dependency)
export class VectorDBPoolAdapter {
  private vectors: Array<{ id: string; embedding: number[]; metadata: any }> = [];

  private cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0,
      normA = 0,
      normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  public upsert(id: string, embedding: number[], metadata: any = {}) {
    this.vectors.push({ id, embedding, metadata });
  }

  public query(queryEmbedding: number[], topK = 3) {
    return this.vectors
      .map((v) => ({ ...v, score: this.cosineSimilarity(queryEmbedding, v.embedding) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }
}
