import { Tree, names } from '@nx/devkit';

import { updateYaml } from '../../shared/yaml';
import { GeneratorStep } from '../../shared/generator.utils';
import { ReactPageGeneratorSchema } from '../schema';

export class GeneralPermissionsStep
  implements GeneratorStep<ReactPageGeneratorSchema>
{
  process(tree: Tree, options: ReactPageGeneratorSchema): void {
    const constantName = names(options.pageName).constantName;
    const pageName = options.pageName;

    const folderPath = 'helm/values.yaml';

    if (tree.exists(folderPath)) {
      updateYaml(tree, folderPath, (yaml) => {
        yaml['app'] ??= {};
        yaml['app']['operator'] ??= {};
        yaml['app']['operator']['permission'] ??= {};
        yaml['app']['operator']['permission']['spec'] ??= {};
        yaml['app']['operator']['permission']['spec']['permissions'] ??= {};
        yaml['app']['operator']['permission']['spec']['permissions'][
          constantName
        ] ??= {};
        yaml['app']['operator']['permission']['spec']['permissions'][
          constantName
        ]['VIEW'] ??= `View ${pageName} page`;
        return yaml;
      });
    }
  }
  getTitle(): string {
    return 'Adapting Permissions';
  }
}
