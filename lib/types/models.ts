export interface Model {
  id: string;
  name: string;
  provider: string;
  providerId: string;
  // ✅ Added this to fix the error
  providerOptions?: Record<string, any>;
}
