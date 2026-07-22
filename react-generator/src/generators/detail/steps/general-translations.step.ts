import { Tree, joinPathFragments, names, updateJson } from '@nx/devkit';
import * as fs from 'fs';
import path = require('path');

import { DetailsGeneratorSchema } from '../schema';
import { GeneratorStep } from '../../shared/generator.utils';
import { renderJsonFile } from '../../shared/renderJsonFile';
import { deepMerge } from '../../shared/deepMerge';

export class GeneralTranslationsStep
  implements GeneratorStep<DetailsGeneratorSchema>
{
  process(tree: Tree, options: DetailsGeneratorSchema): void {
    const folderPath = 'src/assets/i18n/';
    const masterJsonPath = path.resolve(
      __dirname,
      '../input-files/i18n/master.json.template'
    );

    const masterJsonContent = renderJsonFile(masterJsonPath, {
      ...options,
      featureConstantName: names(options.featureName).constantName,
      featureClassName: names(options.featureName).className,
      resourceConstantName: names(options.resource).constantName,
      resourceClassName: names(options.resource).className,
    });

    console.log('Files:', tree.children(folderPath));

    tree.children(folderPath).forEach((file) => {
      updateJson(tree, joinPathFragments(folderPath, file), (json) => {
        try {
          const jsonPath = joinPathFragments(
            path.resolve(__dirname, '../input-files/i18n/'),
            file + '.template'
          );
          let jsonContent = {};
          if (fs.existsSync(jsonPath)) {
            jsonContent = renderJsonFile(jsonPath, {
              ...options,
              featureConstantName: names(options.featureName).constantName,
              featureClassName: names(options.featureName).className,
              resourceConstantName: names(options.resource).constantName,
              resourceClassName: names(options.resource).className,
            });
          }
          json = deepMerge(masterJsonContent, jsonContent, json);
        } catch (error) {
          console.error(error);
        }
        return json;
      });
    });
  }
  getTitle(): string {
    return 'Adapting Translations';
  }
}
