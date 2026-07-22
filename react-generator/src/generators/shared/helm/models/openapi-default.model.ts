export interface OpenAPIDefault {
  type: 'get' | 'post' | 'put' | 'delete';
  operationId: string;
  tags: string[];
  description: string;
  requestBody?: object;
  responses?: object;
}
