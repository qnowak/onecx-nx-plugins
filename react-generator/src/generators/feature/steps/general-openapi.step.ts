import { Tree, joinPathFragments, names } from '@nx/devkit';
import { GeneratorStep } from '../../shared/generator.utils';
import { ReactFeatureGeneratorSchema } from '../schema';
import {
  COMMENT_KEY,
  OpenAPIUtil,
} from '../../shared/openapi/openapi.utils';

export class GeneralOpenAPIStep
  implements GeneratorStep<ReactFeatureGeneratorSchema>
{
  process(tree: Tree, options: ReactFeatureGeneratorSchema): void {
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

    const apiUtil = new OpenAPIUtil(bffOpenApiContent);
    const res = apiUtil
      .tags()
      .add(
        `${propertyName}`,
        {
          name: `${propertyName}`,
          description: `Managing ${resource} items`,
        },
        {
          existStrategy: 'skip',
        }
      )
      .done()
      .schemas()
      .set(
        `${resource}`,
        {
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
        },
        {
          existStrategy: 'skip',
        }
      )
      .done()
      .finalize();

    tree.write(joinPathFragments(openApiFolderPath, bffOpenApiPath), res);
  }

  getTitle(): string {
    return 'Adapting Entity Schema in OpenAPI';
  }
}
