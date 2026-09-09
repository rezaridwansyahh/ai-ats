import weaviate from 'weaviate-client';

const COLLECTION_NAME = 'OnboardingDocumentChunk';

let clientPromise = null;

function getClient() {
  if (!clientPromise) {
    clientPromise = weaviate.connectToLocal({
      host: process.env.WEAVIATE_HOST || 'localhost',
      port: Number(process.env.WEAVIATE_PORT) || 8080,
      grpc: false,
    });
  }
  return clientPromise;
}

class WeaviateService {
  async ensureSchema() {
    const client = await getClient();
    const collections = await client.collections.listAll();
    const exists = collections.some((c) => c.name === COLLECTION_NAME);
    if (exists) return;

    await client.collections.create({
      name: COLLECTION_NAME,
      description: 'Chunks of admin-uploaded compliance/policy documents for the onboarding chatbot.',
      vectorizer: 'text2vec-openai',
      properties: [
        { name: 'content', dataType: 'text', description: 'Chunk text' },
        { name: 'source', dataType: 'text', description: 'Human-readable source document name' },
        { name: 'sourceId', dataType: 'int', description: 'onboarding_source.id this chunk belongs to' },
        { name: 'companyId', dataType: 'int', description: 'core_company.id — required for scoping retrieval' },
      ],
    });
  }

  async insertChunks({ companyId, sourceId, sourceName, chunks }) {
    const client = await getClient();
    const collection = client.collections.get(COLLECTION_NAME);

    for (const chunk of chunks) {
      await collection.data.insert({
        properties: { content: chunk, source: sourceName, sourceId, companyId },
      });
    }
  }

  async deleteBySourceId(sourceId) {
    const client = await getClient();
    const collection = client.collections.get(COLLECTION_NAME);
    await collection.data.deleteMany(
      collection.filter.byProperty('sourceId').equal(sourceId)
    );
  }

  async queryContext({ companyId, query, limit = 3 }) {
    const client = await getClient();
    const collection = client.collections.get(COLLECTION_NAME);

    const results = await collection.query.nearText(query, {
      limit,
      filters: collection.filter.byProperty('companyId').equal(companyId),
    });

    return results.objects.map((obj) => ({
      content: obj.properties.content,
      source: obj.properties.source,
    }));
  }
}

export default new WeaviateService();