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
const NodeFormData = (await new Response(new URLSearchParams()).formData())
  .constructor as typeof FormData;
const NodeFile = (
  await new Response(
    '--b\r\nContent-Disposition: form-data; name="f"; filename="f"\r\n\r\n\r\n--b--',
    {
      headers: { 'Content-Type': 'multipart/form-data; boundary=b' },
    },
  ).formData()
).get('f')!.constructor as typeof File;
const VitestRequest = globalThis.Request;

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
};

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));

afterEach(() => {
  cleanup();
  server.resetHandlers();
  resetMockSession();
});

afterAll(() => server.close());
