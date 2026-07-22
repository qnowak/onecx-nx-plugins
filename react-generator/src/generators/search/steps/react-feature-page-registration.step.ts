import { Tree, names } from '@nx/devkit';

import { GeneratorStep } from '../../shared/generator.utils';
import { replacePlaceholder } from '../../shared/replacePlaceholder';
import { SearchGeneratorSchema } from '../schema';

export class ReactFeaturePageRegistrationStep
  implements GeneratorStep<SearchGeneratorSchema>
{
  process(tree: Tree, options: SearchGeneratorSchema): void {
    const featureFileName = names(options.featureName).fileName;
    const resourceFileName = names(options.resource).fileName;
    const resourceClassName = names(options.resource).className;

    const indexFilePath = `src/pages/${featureFileName}/index.tsx`;
    const pageComponent = `${resourceClassName}SearchPage`;
    const importLine = `import { ${pageComponent} } from './${resourceFileName}-search/${resourceFileName}-search.page';`;

    replacePlaceholder(tree, indexFilePath, pageComponent, importLine);
  }

  getTitle(): string {
    return 'Adapting React Feature Page Registration';
  }
}
