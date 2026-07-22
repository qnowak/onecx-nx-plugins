import { Tree, names } from '@nx/devkit';

import {
  GeneratorStep,
  GeneratorStepError,
} from '../../shared/generator.utils';
import { replacePlaceholder } from '../../shared/replacePlaceholder';
import { DetailsGeneratorSchema } from '../schema';

export class ReactFeatureRoutesStep
  implements GeneratorStep<DetailsGeneratorSchema>
{
  process(tree: Tree, options: DetailsGeneratorSchema): void {
    const featureFileName = names(options.featureName).fileName;
    const resourceFileName = names(options.resource).fileName;
    const resourceClassName = names(options.resource).className;
    const routeFilePath = 'src/router.tsx';

    if (!tree.exists(routeFilePath)) {
      throw new GeneratorStepError(
        'React route file not found. Expected src/router.tsx'
      );
    }

    const pageComponentName = `${resourceClassName}DetailsPage`;
    const importPath = `./pages/${featureFileName}/${resourceFileName}-details/${resourceFileName}-details.page`;

    replacePlaceholder(
      tree,
      routeFilePath,
      pageComponentName,
      `import ${pageComponentName} from '${importPath}';`,
      `${featureFileName}/:id`
    );
  }

  getTitle(): string {
    return 'Adapting React Feature Routes';
  }
}
