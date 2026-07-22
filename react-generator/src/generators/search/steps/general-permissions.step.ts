import { Tree, names } from '@nx/devkit';

import { updateYaml } from '../../shared/yaml';
import { GeneratorStep } from '../../shared/generator.utils';
import { SearchGeneratorSchema } from '../schema';

export class GeneralPermissionsStep
  implements GeneratorStep<SearchGeneratorSchema>
{
  process(tree: Tree, options: SearchGeneratorSchema): void {
    const constantName = names(options.resource).constantName;
    const resourceName = options.resource;

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
        ]['CREATE'] ??= `Create ${resourceName} item`;
        yaml['app']['operator']['permission']['spec']['permissions'][
          constantName
        ]['EDIT'] ??= `Edit ${resourceName} item`;
        yaml['app']['operator']['permission']['spec']['permissions'][
          constantName
        ]['DELETE'] ??= `Delete ${resourceName} item`;
        yaml['app']['operator']['permission']['spec']['permissions'][
          constantName
        ]['SEARCH'] ??= `Search ${resourceName} items`;
        yaml['app']['operator']['permission']['spec']['permissions'][
          constantName
        ]['VIEW'] ??= `View ${resourceName} item details`;
        yaml['app']['operator']['permission']['spec']['permissions'][
          constantName
        ]['IMPORT'] ??= `Import ${resourceName} items`;
        yaml['app']['operator']['permission']['spec']['permissions'][
          constantName
        ]['EXPORT'] ??= `Export ${resourceName} items`;
        yaml['app']['operator']['permission']['spec']['permissions'][
          constantName
        ]['BACK'] ??= `Navigate back in details of ${resourceName} item`;
        return yaml;
      });
    }
  }
  getTitle(): string {
    return 'Adapting Permissions';
  }
}
