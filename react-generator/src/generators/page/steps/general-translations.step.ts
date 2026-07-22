import { Tree, joinPathFragments, names, updateJson } from '@nx/devkit';
import * as fs from 'fs';
import path = require('path');

import { ReactPageGeneratorSchema } from '../schema';
import { GeneratorStep } from '../../shared/generator.utils';
import { renderJsonFile } from '../../shared/renderJsonFile';
import { deepMerge } from '../../shared/deepMerge';

export class GeneralTranslationsStep
  implements GeneratorStep<ReactPageGeneratorSchema>
{
  process(tree: Tree, options: ReactPageGeneratorSchema): void {
    const folderPath = 'src/assets/i18n/';
    const masterJsonPath = path.resolve(
      __dirname,
      '../input-files/i18n/master.json.template'
    );

    const renderVariables = {
      ...options,
      featureConstantName: names(options.featureName).constantName,
      featureClassName: names(options.featureName).className,
      pageConstantName: names(options.pageName).constantName,
      pageClassName: names(options.pageName).className,
    };

    const masterJsonContent = renderJsonFile(masterJsonPath, renderVariables);

    tree.children(folderPath).forEach((file) => {
      updateJson(tree, joinPathFragments(folderPath, file), (json) => {
        try {
          const jsonPath = joinPathFragments(
            path.resolve(__dirname, '../input-files/i18n/'),
            file + '.template'
          );
          let jsonContent = {};
          if (fs.existsSync(jsonPath)) {
            jsonContent = renderJsonFile(jsonPath, renderVariables);
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
