export const env = {
  // O OpenAPI define o servidor como http://localhost:8000 e os caminhos já incluem /api.
  apiUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:8000',
  enableMocks: import.meta.env.VITE_ENABLE_MOCKS === 'true',
  microsoftTenantId: import.meta.env.VITE_MICROSOFT_TENANT_ID ?? '',
  microsoftClientId: import.meta.env.VITE_MICROSOFT_CLIENT_ID ?? '',
  microsoftRedirectUri: import.meta.env.VITE_MICROSOFT_REDIRECT_URI ?? '',
} as const;
