import { OpenAPIDefault } from '../shared/openapi/models/openapi-default.model';

interface SearchEndpointParameter {
  resource: string;
  className: string;
  propertyName: string;
  searchRequestName: string;
  searchResponseName: string;
}

export function createSearchEndpoint(
  data: OpenAPIDefault,
  parameter: SearchEndpointParameter
) {
  const response: Record<string, unknown> = {};
  response[data.type] = {
    operationId: data.operationId,
    'x-onecx': {
      permissions: {
        [`${parameter.propertyName}`]: ['read'],
      },
    },
    tags: data.tags,
    description: data.description,
    requestBody: {
      content: {
        'application/json': {
          schema: {
            $ref: `#/components/schemas/${parameter.searchRequestName}`,
          },
        },
      },
    },
    responses: {
      '200': {
        description: `${parameter.className} search results retrieved successfully`,
        content: {
          'application/json': {
            schema: {
              $ref: `#/components/schemas/${parameter.searchResponseName}`,
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
