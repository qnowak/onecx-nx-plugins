import { Tree, names } from '@nx/devkit';

import { GeneratorStep } from '../../shared/generator.utils';
import { replacePlaceholder } from '../../shared/replacePlaceholder';
import { ReactPageGeneratorSchema } from '../schema';

export class ReactFeaturePageRegistrationStep
  implements GeneratorStep<ReactPageGeneratorSchema>
{
  process(tree: Tree, options: ReactPageGeneratorSchema): void {
    const featureFileName = names(options.featureName).fileName;
    const pageFileName = names(options.pageName).fileName;
    const pageClassName = names(options.pageName).className;

    const indexFilePath = `src/pages/${featureFileName}/index.tsx`;
    const pageComponent = `${pageClassName}Page`;
    const importLine = `import { ${pageComponent} } from './${pageFileName}/${pageFileName}.page';`;

    replacePlaceholder(tree, indexFilePath, pageComponent, importLine);
  }

  getTitle(): string {
    return 'Adapting React Feature Page Registration';
  }
}
