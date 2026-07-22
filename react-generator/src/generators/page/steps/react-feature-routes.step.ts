import { Tree, names } from '@nx/devkit';

import {
  GeneratorStep,
  GeneratorStepError,
} from '../../shared/generator.utils';
import { replacePlaceholder } from '../../shared/replacePlaceholder';
import { ReactPageGeneratorSchema } from '../schema';

export class ReactFeatureRoutesStep
  implements GeneratorStep<ReactPageGeneratorSchema>
{
  process(tree: Tree, options: ReactPageGeneratorSchema): void {
    const featureFileName = names(options.featureName).fileName;
    const pageFileName = names(options.pageName).fileName;
    const pageClassName = names(options.pageName).className;
    const routeFilePath = 'src/router.tsx';

    if (!tree.exists(routeFilePath)) {
      throw new GeneratorStepError(
        'React route file not found. Expected src/router.tsx'
      );
    }

    const pageComponentName = `${pageClassName}Page`;
    const importPath = `./pages/${featureFileName}/${pageFileName}/${pageFileName}.page`;

    replacePlaceholder(
      tree,
      routeFilePath,
      pageComponentName,
      `import ${pageComponentName} from '${importPath}';`,
      `${featureFileName}/${pageFileName}`
    );
  }

  getTitle(): string {
    return 'Adapting React Feature Routes';
  }
}
