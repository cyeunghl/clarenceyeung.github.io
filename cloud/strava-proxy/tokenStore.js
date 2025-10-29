export class InMemoryTokenStore {
  constructor() {
    this._store = new Map();
  }

  async get(sessionId) {
    return this._store.get(sessionId) || null;
  }

  async set(sessionId, value) {
    this._store.set(sessionId, value);
  }

  async clear(sessionId) {
    this._store.delete(sessionId);
  }

  async entries() {
    return Array.from(this._store.entries());
  }
}

export function createTokenStore() {
  // TODO: Replace with Secret Manager, Firestore, DynamoDB, etc.
  return new InMemoryTokenStore();
}
