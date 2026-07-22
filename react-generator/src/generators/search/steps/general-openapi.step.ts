import { Tree, joinPathFragments, names } from '@nx/devkit';

import { GeneratorStep } from '../../shared/generator.utils';
import { COMMENT_KEY, OpenAPIUtil } from '../../shared/openapi/openapi.utils';
import { SearchGeneratorSchema } from '../schema';
import { createSearchEndpoint } from '../endpoint.util';

export class GeneralOpenAPIStep
  implements GeneratorStep<SearchGeneratorSchema>
{
  process(tree: Tree, options: SearchGeneratorSchema): void {
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
    const className = names(options.resource).className;
    const propertyName = names(options.resource).propertyName;
    const searchRequestName = options.searchRequestName;
    const searchResponseName = options.searchResponseName;

    const apiUtil = new OpenAPIUtil(bffOpenApiContent);
    const res = apiUtil
      .paths()
      .set(
        `/${propertyName}s/search`,
        createSearchEndpoint(
          {
            type: 'post',
            operationId: `search${className}Items`,
            tags: [`${propertyName}`],
            description: `Search ${className} items by search criteria`,
          },
          {
            resource,
            className,
            propertyName,
            searchRequestName,
            searchResponseName,
          }
        )
      )
      .done()
      .schemas()
      .set(`${className}`, {
        type: 'object',
        required: ['id'],
        properties: {
          modificationCount: {
            type: 'integer',
            format: 'int32',
          },
          creationDate: {
            $ref: '#/components/schemas/OffsetDateTime',
          },
          creationUser: {
            type: 'string',
            readOnly: true,
          },
          modificationDate: {
            $ref: '#/components/schemas/OffsetDateTime',
          },
          modificationUser: {
            type: 'string',
            readOnly: true,
          },
          id: {
            type: 'string',
            readOnly: true,
          },
          [COMMENT_KEY]: 'ACTION E: Add entity properties',
        },
      })
      .done()
      .schemas()
      .set(`${searchRequestName}`, {
        type: 'object',
        properties: {
          pageNumber: {
            type: 'integer',
            format: 'int32',
            default: 0,
            description: 'The number of the page',
          },
          pageSize: {
            type: 'integer',
            format: 'int32',
            default: 100,
            maximum: 1000,
            description: 'The size of the page',
          },
          id: {
            type: 'integer',
            format: 'int32',
          },
          changeMe: {
            type: 'string',
            maximum: 255,
            description: 'To be replaced by actual search criteria properties',
          },
          [COMMENT_KEY]: 'ACTION S1: Add search criteria properties',
        },
      })
      .set(`${searchResponseName}`, {
        type: 'object',
        required: ['number', 'size', 'totalElements', 'totalPages', 'stream'],
        properties: {
          number: {
            type: 'integer',
            format: 'int32',
            description: 'Current page number',
          },
          size: {
            type: 'integer',
            format: 'int32',
            description: 'Current page size',
          },
          totalElements: {
            type: 'integer',
            format: 'int64',
            description: 'The total items in the resource',
          },
          totalPages: {
            type: 'integer',
            format: 'int64',
            description: 'Total pages',
          },
          stream: {
            type: 'array',
            description: 'Array of found items',
            items: {
              $ref: `#/components/schemas/${className}`,
            },
          },
        },
      })
      .done()
      .finalize();

    tree.write(joinPathFragments(openApiFolderPath, bffOpenApiPath), res);
  }
  getTitle(): string {
    return 'Adapting OpenAPI (search)';
  }
}
