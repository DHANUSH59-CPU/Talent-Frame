// src/lib/pineconeClient.js
const { Pinecone } = require("@pinecone-database/pinecone");

let client;
let index;

async function initPinecone() {
  if (client && index) return { client, index };

  // ✅ only apiKey is required — environment is auto-detected
  client = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
  });

  const indexName = process.env.PINECONE_INDEX;
  if (!indexName) throw new Error("PINECONE_INDEX not set in env");

  index = client.index(indexName);
  return { client, index };
}

// Upsert, fetch, delete
async function upsertVector(userId, values, metadata = {}) {
  if (!userId) throw new Error("userId required");
  if (!Array.isArray(values)) throw new Error("values must be an array");

  const { index } = await initPinecone();
  const vector = { id: String(userId), values, metadata };
  return await index.upsert([vector]);
}

async function fetchVector(userId) {
  const { index } = await initPinecone();
  return await index.fetch([String(userId)]);
}

async function deleteVector(userId) {
  const { index } = await initPinecone();
  return await index.delete([String(userId)]);
}

module.exports = { initPinecone, upsertVector, fetchVector, deleteVector };
