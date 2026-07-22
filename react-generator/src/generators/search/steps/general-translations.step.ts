import { Tree, joinPathFragments, names, updateJson } from '@nx/devkit';
import * as fs from 'fs';
import path = require('path');

import { SearchGeneratorSchema } from '../schema';
import { GeneratorStep } from '../../shared/generator.utils';
import { renderJsonFile } from '../../shared/renderJsonFile';
import { deepMerge } from '../../shared/deepMerge';

export class GeneralTranslationsStep
  implements GeneratorStep<SearchGeneratorSchema>
{
  process(tree: Tree, options: SearchGeneratorSchema): void {
    const folderPath = 'src/i18n/sources';
    const templateJsonPath = path.resolve(
      __dirname,
      '../input-files/i18n/master.json.template'
    );

    try {
      const masterJsonContent = renderJsonFile(templateJsonPath, {
        ...options,
        resourceConstantName: names(options.resource).constantName,
        resourceClassName: names(options.resource).className,
      });

      tree.children(folderPath).forEach((file) => {
        updateJson(tree, joinPathFragments(folderPath, file), (json) => {
          const jsonPath = joinPathFragments(
            path.resolve(__dirname, '../input-files/i18n/'),
            file + '.template'
          );
          let jsonContent = {};
          if (fs.existsSync(jsonPath)) {
            jsonContent = renderJsonFile(jsonPath, {
              ...options,
              resourceConstantName: names(options.resource).constantName,
              resourceClassName: names(options.resource).className,
            });
          }
          json = deepMerge(masterJsonContent, jsonContent, json);
          return json;
        });
      });
    } catch (e) {
      console.log(e);
    }
  }

  getTitle(): string {
    return 'Adapting Translations';
  }
}
