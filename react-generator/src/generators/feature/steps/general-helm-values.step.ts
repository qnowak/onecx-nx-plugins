import { joinPathFragments, names, Tree } from '@nx/devkit';

import { ReactFeatureGeneratorSchema } from '../schema';
import { GeneratorStep } from '../../shared/generator.utils';
import { COMMENT_KEY, HelmValuesUtil } from '../../shared/helm/helm.utils';

export class GeneralPermissionStep
  implements GeneratorStep<ReactFeatureGeneratorSchema>
{
  process(tree: Tree, options: ReactFeatureGeneratorSchema): void {
    const helmPath = 'helm';
    const valuesPath = 'values.yaml';
    const valuesContent = tree.read(
      joinPathFragments(helmPath, valuesPath),
      'utf8'
    );

    const resourceConstantName = names(options.resource).constantName;
    const resourceName = options.resource;

    const helmUtil = new HelmValuesUtil(valuesContent);
    const res = helmUtil
      .permissions()
      .set(`${resourceConstantName}`, {
        CREATE: `Create ${resourceName} item`,
        EDIT: `Edit ${resourceName} item`,
        DELETE: `Delete ${resourceName} item`,
        SEARCH: `Search ${resourceName} items`,
        VIEW: `View ${resourceName} item details`,
        IMPORT: `Import ${resourceName} items`,
        EXPORT: `Export ${resourceName} items`,
        BACK: `Navigate back in details of ${resourceName} item`,
        [COMMENT_KEY]: 'ACTION P: Adjust permissions for the entity',
      })
      .done()
      .finalize();

    tree.write(joinPathFragments(helmPath, valuesPath), res);
  }

  getTitle(): string {
    return 'Adapting Permissions in Helm Values';
  }
}
