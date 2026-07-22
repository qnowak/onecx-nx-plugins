import { OpenAPIDefault } from '../shared/openapi/models/openapi-default.model';

interface CreateEndpointParameter {
  resource: string;
  propertyName: string;
  createRequestName: string;
  createResponseName: string;
}

export function createCreateEndpoint(
  data: OpenAPIDefault,
  parameter: CreateEndpointParameter
) {
  const response: Record<string, unknown> = {};
  response[data.type] = {
    'x-onecx': {
      permissions: {
        [parameter.propertyName]: ['write'],
      },
    },
    tags: data.tags,
    operationId: data.operationId,
    description: data.description,
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            $ref: `#/components/schemas/${parameter.createRequestName}`,
          },
        },
      },
    },
    responses: {
      '201': {
        description: `New ${parameter.resource} created`,
        content: {
          'application/json': {
            schema: {
              $ref: `#/components/schemas/${parameter.createResponseName}`,
            },
          },
        },
      },
      '400': {
        description: 'Bad request',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ProblemDetailResponse',
            },
          },
        },
      },
    },
  };
  return response;
}

interface UpdateEndpointParameter {
  resource: string;
  propertyName: string;
  updateRequestSchema: string;
  updateResponseSchema: string;
}

export function createUpdateEndpoint(
  data: OpenAPIDefault,
  parameter: UpdateEndpointParameter
) {
  const response: Record<string, unknown> = {};
  response[data.type] = {
    'x-onecx': {
      permissions: {
        [parameter.propertyName]: ['write'],
      },
    },
    tags: data.tags,
    operationId: data.operationId,
    description: data.description,
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
        },
      },
    ],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            $ref: `#/components/schemas/${parameter.updateRequestSchema}`,
          },
        },
      },
    },
    responses: {
      '200': {
        description: `${parameter.resource} updated`,
        content: {
          'application/json': {
            schema: {
              $ref: `#/components/schemas/${parameter.updateResponseSchema}`,
            },
          },
        },
      },
      '400': {
        description: 'Bad request',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ProblemDetailResponse',
            },
          },
        },
      },
      '404': {
        description: `${parameter.resource} not found`,
      },
    },
  };
  return response;
}
