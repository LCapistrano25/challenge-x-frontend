import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { resetMockSession } from '@/mocks/handlers';
import { server } from '@/mocks/server';

// O jsdom não implementa a rolagem; a ScrollRestoration do React Router chama window.scrollTo.
window.scrollTo = () => {};

// Upload nos testes: o Request do ambiente jsdom do Vitest converte cada File do FormData em
// Blob sem nome (o servidor recebe "blob" em vez de "entrega.pdf"). Aqui o FormData é refeito
// com File do Node, preservando nome e tipo, como faz o navegador.
//
// O jsdom (< 30.1) guarda os bytes do Blob num objeto interno, sob um Symbol próprio.
const jsdomImpl = Object.getOwnPropertySymbols(new Blob())[0] as symbol;
const bytesOf = (blob: Blob) => {
  const impl = (
    blob as unknown as Record<
      symbol,
      { _bytes?: Uint8Array<ArrayBuffer>; _buffer?: Uint8Array<ArrayBuffer> }
    >
  )[jsdomImpl];
  return impl?._bytes ?? impl?._buffer ?? new Uint8Array();
};
// FormData e File do Node (os globais foram trocados pelos do jsdom).
const nodeBufferModule = 'node:buffer';
const { File: NodeFile } = (await import(/* @vite-ignore */ nodeBufferModule)) as {
  File: typeof File;
};
const NodeFormData = (await new Response(new URLSearchParams()).formData())
  .constructor as typeof FormData;
const JsdomFormData = globalThis.FormData;
const JsdomFile = globalThis.File;
const VitestRequest = globalThis.Request;

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function indexOfBytes(haystack: Uint8Array, needle: Uint8Array, from = 0): number {
  outer: for (let i = from; i <= haystack.length - needle.length; i++) {
    for (let j = 0; j < needle.length; j++) {
      if (haystack[i + j] !== needle[j]) continue outer;
    }
    return i;
  }
  return -1;
}

const CRLF2 = encoder.encode('\r\n\r\n');

function parseMultipart(buffer: ArrayBuffer, boundary: string): FormData {
  const form = new JsdomFormData();
  const raw = new Uint8Array(buffer);
  const sep = encoder.encode(`--${boundary}`);
  let pos = indexOfBytes(raw, sep);
  while (pos !== -1) {
    pos += sep.length;
    if (raw[pos] === 45 && raw[pos + 1] === 45) break;
    if (raw[pos] === 13 && raw[pos + 1] === 10) pos += 2;
    const next = indexOfBytes(raw, sep, pos);
    if (next === -1) break;
    const part = raw.subarray(pos, Math.max(pos, next - 2));
    const headerEnd = indexOfBytes(part, CRLF2);
    if (headerEnd !== -1) {
      const headers = decoder.decode(part.subarray(0, headerEnd));
      const body = part.slice(headerEnd + 4);
      const name = /name="([^"]+)"/.exec(headers)?.[1];
      const filename = /filename="([^"]*)"/.exec(headers)?.[1];
      const type = /content-type:\s*([^\r\n]+)/i.exec(headers)?.[1]?.trim();
      if (name) {
        if (filename !== undefined) {
          form.append(
            name,
            new JsdomFile([body], filename, { type: type || 'application/octet-stream' }),
          );
        } else {
          form.append(name, decoder.decode(body));
        }
      }
    }
    pos = next;
  }
  return form;
}

globalThis.Request = class extends VitestRequest {
  constructor(input: RequestInfo | URL, init?: RequestInit) {
    if (init?.body instanceof FormData) {
      const body = new NodeFormData();
      init.body.forEach((value, key) => {
        if (value instanceof File) {
          body.append(key, new NodeFile([bytesOf(value)], value.name, { type: value.type }));
        } else {
          body.append(key, value);
        }
      });
      super(input, { ...init, body });
    } else {
      super(input, init);
    }
  }

  override async formData(): Promise<FormData> {
    const contentType = this.headers.get('content-type') ?? '';
    const match = /boundary=([^;\s"]+|"[^"]+")/i.exec(contentType);
    const boundary = match?.[1]?.replace(/^"|"$/g, '');
    if (!boundary) return super.formData();
    return parseMultipart(await this.arrayBuffer(), boundary);
  }
};

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));

afterEach(() => {
  cleanup();
  server.resetHandlers();
  resetMockSession();
});

afterAll(() => server.close());
