import { Tree, joinPathFragments, names } from '@nx/devkit';

import { GeneratorStep } from '../../shared/generator.utils';
import {
  COMMENT_KEY,
  OpenAPIUtil,
} from '../../shared/openapi/openapi.utils';
import { DetailsGeneratorSchema } from '../schema';
import { createUpdateEndpoint } from '../endpoint.util';

export class GeneralOpenAPIStep
  implements GeneratorStep<DetailsGeneratorSchema>
{
  process(tree: Tree, options: DetailsGeneratorSchema): void {
    const openApiFolderPath = 'src/assets/api';
    const bffOpenApiPath = 'openapi-bff.yaml';
    let bffOpenApiContent = tree.read(
      joinPathFragments(openApiFolderPath, bffOpenApiPath),
      'utf8'
    );

    // Create the file if it doesn't exist
    if (!bffOpenApiContent) {
      const templatePath = joinPathFragments(
        'react-generator/src/generators/files/src/assets/api',
        'openapi-bff.yaml.template'
      );
      const defaultOpenApiContent = tree.read(templatePath, 'utf8');
      tree.write(joinPathFragments(openApiFolderPath, bffOpenApiPath), defaultOpenApiContent);
      bffOpenApiContent = defaultOpenApiContent;
    }

    const resource = options.resource;
    const propertyName = names(options.resource).propertyName;
    const getResponseName = options.getResponseName;
    const apiUtil = new OpenAPIUtil(bffOpenApiContent);

    const updateRequestName = options.updateRequestName;
    const updateResponseName = options.updateResponseName;

    apiUtil.paths().set(
      `/${propertyName}s/{id}`,
      {
        get: {
          'x-onecx': {
            permissions: {
              [propertyName]: ['read'],
            },
          },
          operationId: `get${resource}ById`,
          description: `Get ${resource} by id`,
          tags: [propertyName],
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
          responses: {
            '200': {
              description: 'OK',
              content: {
                'application/json': {
                  schema: {
                    $ref: `#/components/schemas/${getResponseName}`,
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
              description: `${resource} not found`,
            },
          },
        },
      },
      {
        existStrategy: 'extend',
      }
    );

    if (options.editMode) {
      apiUtil.paths().set(
        `/${propertyName}s/{id}`,
        {
          ...createUpdateEndpoint(
            {
              type: 'put',
              operationId: `update${resource}ById`,
              tags: [propertyName],
              description: `Update ${resource} by id`,
            },
            {
              resource: resource,
              propertyName: propertyName,
              updateRequestSchema: updateRequestName,
              updateResponseSchema: updateResponseName,
            }
          ),
        },
        {
          existStrategy: 'extend',
        }
      );

      apiUtil
        .schemas()
        .set(`${options.updateRequestName}`, {
          type: 'object',
          properties: {
            dataObject: {
              $ref: `#/components/schemas/${resource}`,
            },
          },
        })
        .set(`${options.updateResponseName}`, {
          type: 'object',
          properties: {
            dataObject: {
              $ref: `#/components/schemas/${resource}`,
            },
            [COMMENT_KEY]: 'ACTION DE1: Modify resource or use flat list here',
          },
        });
    }

    if (options.allowDelete) {
      apiUtil.paths().set(
        `/${propertyName}s/{id}`,
        {
          delete: {
            'x-onecx': {
              permissions: {
                [propertyName]: ['delete'],
              },
            },
            tags: [propertyName],
            operationId: `delete${resource}ById`,
            description: `Delete ${resource} by id`,
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
            responses: {
              '204': {
                description: `${resource} deleted`,
              },
            },
          },
        },
        {
          existStrategy: 'extend',
        }
      );
    }

    apiUtil.schemas().set(resource, {
      type: 'object',
      required: ['id', 'modificationCount'],
      properties: {
        modificationCount: {
          type: 'integer',
          format: 'int32',
        },
        id: {
          type: 'string',
        },
        [COMMENT_KEY]: 'ACTION D1: Add additional entity properties here',
      },
    });

    apiUtil.schemas().set('ProblemDetailResponse', {
      type: 'object',
      properties: {
        errorCode: {
          type: 'string',
        },
        detail: {
          type: 'string',
        },
        params: {
          type: 'array',
          items: {
            $ref: '#/components/schemas/ProblemDetailParam',
          },
        },
        invalidParams: {
          type: 'array',
          items: {
            $ref: '#/components/schemas/ProblemDetailInvalidParam',
          },
        },
      },
    });

    apiUtil.schemas().set('ProblemDetailParam', {
      type: 'object',
      properties: {
        key: {
          type: 'string',
        },
        value: {
          type: 'string',
        },
      },
    });

    apiUtil.schemas().set('ProblemDetailInvalidParam', {
      type: 'object',
      properties: {
        name: {
          type: 'string',
        },
        message: {
          type: 'string',
        },
      },
    });

    apiUtil.schemas().set(getResponseName, {
      type: 'object',
      required: ['result'],
      properties: {
        resource: {
          $ref: `#/components/schemas/${resource}`,
        },
      },
    });

    tree.write(
      joinPathFragments(openApiFolderPath, bffOpenApiPath),
      apiUtil.finalize()
    );
  }

  getTitle(): string {
    return 'Adapting OpenAPI (details)';
  }
}
