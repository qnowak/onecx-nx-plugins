import { Tree, names } from '@nx/devkit';

import { GeneratorStep } from '../../shared/generator.utils';
import { replacePlaceholder } from '../../shared/replacePlaceholder';
import { DetailsGeneratorSchema } from '../schema';

export class ReactSearchComponentStep
  implements GeneratorStep<DetailsGeneratorSchema>
{
  process(tree: Tree, options: DetailsGeneratorSchema): void {
    const featureFileName = names(options.featureName).fileName;
    const resourceFileName = names(options.resource).fileName;
    const resourceClassName = names(options.resource).className;
    const filePath = `src/pages/${featureFileName}/${resourceFileName}-search/${resourceFileName}-search.page.tsx`;

    if (!tree.exists(filePath)) {
      return;
    }

    // Add useNavigate import
    if (!tree.read(filePath, 'utf8')?.includes('useNavigate')) {
      const useTranslationImportRegex =
        /import\s*\{\s*useTranslation\s*\}\s*from\s*['"]react-i18next['"];?/;
      replacePlaceholder(
        tree,
        filePath,
        '',
        '',
        {
          goal: `Add useNavigate import to ${resourceClassName}SearchPage`,
          find: useTranslationImportRegex,
          replaceWith:
            "import { useTranslation } from 'react-i18next';\nimport { useNavigate } from 'react-router';",
        }
      );
    }

    // Add navigate const after the useTranslation hook
    if (
      !tree.read(filePath, 'utf8')?.includes('const navigate = useNavigate()')
    ) {
      const useTranslationHookRegex =
        /const\s*\{\s*t\s*\}\s*=\s*useTranslation\(\);/;
      replacePlaceholder(
        tree,
        filePath,
        '',
        '',
        {
          goal: `Add navigate const to ${resourceClassName}SearchPage`,
          find: useTranslationHookRegex,
          replaceWith:
            'const { t } = useTranslation();\n  const navigate = useNavigate();',
        }
      );
    }

    // Add SearchRow type import used by handleViewItem.
    // Use a regex-based replacement so small formatting differences don't break generation.
    if (!tree.read(filePath, 'utf8')?.includes(`type ${resourceClassName}SearchRow`)) {
      const searchTypesImportRegex = new RegExp(
        `import\\s*\\{([^}]*)\\}\\s*from\\s*['"]\\./${resourceFileName}-search\\.types['"];?`
      );
      replacePlaceholder(
        tree,
        filePath,
        '',
        '',
        {
          goal: `Add ${resourceClassName}SearchRow type import to ${resourceClassName}SearchPage`,
          find: searchTypesImportRegex,
          replaceWith: `import {$1, type ${resourceClassName}SearchRow } from './${resourceFileName}-search.types';`,
        }
      );
    }

    // Add the view handler that navigates to the details page
    if (!tree.read(filePath, 'utf8')?.includes('const handleViewItem =')) {
      const findMethod = 'const handleReset = () => {';
      const replaceWithMethod = `const handleViewItem = (item: ${resourceClassName}SearchRow) => {
    navigate(\`./\${item.id}\`);
  };

  const handleReset = () => {`;

      replacePlaceholder(
        tree,
        filePath,
        '',
        '',
        {
          goal: `Add view handler to ${resourceClassName}SearchPage`,
          find: findMethod,
          replaceWith: replaceWithMethod,
        }
      );
    }

    // Wire the view handler into the results section
    if (!tree.read(filePath, 'utf8')?.includes('onViewItem={handleViewItem}')) {
      replacePlaceholder(
        tree,
        filePath,
        '',
        '',
        {
          goal: `Add onViewItem prop to ${resourceClassName}SearchResultsSection`,
          find: 'results={results}',
          replaceWith: 'onViewItem={handleViewItem}\n            results={results}',
        }
      );
    }
  }

  getTitle(): string {
    return 'Adapting React Search Component (details)';
  }
}
