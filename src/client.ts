import type { Catalog } from './types.js';

export class MarkieOfflineError extends Error {
  constructor() {
    super('Markie is not running. Please start the Markie desktop app.');
    this.name = 'MarkieOfflineError';
  }
}

function isConnectionRefused(error: unknown): boolean {
  if (error instanceof Error) {
    const cause = (error as NodeJS.ErrnoException & { cause?: unknown }).cause;
    if (cause && typeof cause === 'object' && (cause as NodeJS.ErrnoException).code === 'ECONNREFUSED') {
      return true;
    }
    if (error.message.includes('ECONNREFUSED')) {
      return true;
    }
  }
  return false;
}

export class MarkieClient {
  private baseUrl = 'http://localhost:3210';
  private token: string | null = null;

  async register(): Promise<void> {
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/api/register`);
    } catch (error) {
      if (isConnectionRefused(error)) {
        throw new MarkieOfflineError();
      }
      throw error;
    }

    if (!response.ok) {
      throw new Error(`Markie API error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as { token: string };
    this.token = data.token;
  }

  async getCatalog(): Promise<Catalog> {
    // Lazy registration if startup registration failed
    if (this.token === null) {
      await this.register(); // throws MarkieOfflineError if offline
    }

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/api/catalog`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });
    } catch (error) {
      if (isConnectionRefused(error)) {
        throw new MarkieOfflineError();
      }
      throw error;
    }

    if (!response.ok) {
      throw new Error(`Markie API error: ${response.status} ${response.statusText}`);
    }

    return (await response.json()) as Catalog;
  }

  async getThumbnail(id: string): Promise<Buffer> {
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/api/assets/${id}/thumbnail`);
    } catch (error) {
      if (isConnectionRefused(error)) {
        throw new MarkieOfflineError();
      }
      throw error;
    }

    if (!response.ok) {
      throw new Error(`Markie API error: ${response.status} ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  async getFile(id: string): Promise<{ buffer: Buffer; contentType: string }> {
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/api/assets/${id}/file`);
    } catch (error) {
      if (isConnectionRefused(error)) {
        throw new MarkieOfflineError();
      }
      throw error;
    }

    if (!response.ok) {
      throw new Error(`Markie API error: ${response.status} ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = response.headers.get('content-type') ?? 'application/octet-stream';

    return { buffer, contentType };
  }
}
