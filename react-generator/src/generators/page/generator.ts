import {
  formatFiles,
  generateFiles,
  GeneratorCallback,
  installPackagesTask,
  joinPathFragments,
  names,
  readJson,
  Tree,
} from '@nx/devkit';
import { execSync } from 'child_process';
import * as ora from 'ora';

import { GeneratorProcessor } from '../shared/generator.utils';
import processParams, {
  GeneratorParameter,
} from '../shared/parameters.utils';
import { GeneralTranslationsStep } from './steps/general-translations.step';
import { ReactFeaturePageRegistrationStep } from './steps/react-feature-page-registration.step';
import { ReactFeatureRoutesStep } from './steps/react-feature-routes.step';

import { ReactPageGeneratorSchema } from './schema';
import { GeneralPermissionsStep } from './steps/general-permissions.step';

const PARAMETERS: GeneratorParameter<ReactPageGeneratorSchema>[] = [
  {
    key: 'pageName',
    type: 'text',
    required: 'always',
    default: 'Page',
    prompt: 'Provide a name for the page (e.g. "Book" for BookPage): ',
    showInSummary: true,
  },
  {
    key: 'pageTitle',
    type: 'text',
    required: 'always',
    default: 'Page Title',
    prompt: 'Provide a title for the page: ',
    showInSummary: true,
  },
  {
    key: 'standalone',
    type: 'boolean',
    required: 'never',
    default: false,
  },
];

export async function pageGenerator(
  tree: Tree,
  options: ReactPageGeneratorSchema
): Promise<GeneratorCallback> {
  const parameters = await processParams<ReactPageGeneratorSchema>(
    PARAMETERS,
    options
  );
  Object.assign(options, parameters);

  const spinner = ora(
    `Adding React page to feature "${options.featureName}"`
  ).start();

  const pkg = readJson(tree, 'package.json');
  const deps = {
    ...(pkg.dependencies ?? {}),
    ...(pkg.devDependencies ?? {}),
  };
  const isReact = !!Object.keys(deps).find((k) => k.includes('react'));

  if (!isReact) {
    spinner.fail('Currently only React projects are supported.');
    throw new Error('Currently only React projects are supported.');
  }

  const directory = '.';
  const featureNames = names(options.featureName);
  const pageNames = names(options.pageName);

  const templateVariables = {
    ...options,
    featureFileName: featureNames.fileName,
    featureClassName: featureNames.className,
    featurePropertyName: featureNames.propertyName,
    featureConstantName: featureNames.constantName,
    pageFileName: pageNames.fileName,
    pageClassName: pageNames.className,
    pagePropertyName: pageNames.propertyName,
    pageConstantName: pageNames.constantName,
    pageName: options.pageName,
    pageTitle: options.pageTitle,
    standalone: options.standalone,
  };

  generateFiles(
    tree,
    joinPathFragments(__dirname, './files/react/src/pages'),
    `${directory}/src/pages`,
    templateVariables
  );

  // The page reuses the shared accelerator components (PortalPage, PageHeader,
  // Content). They are owned by the react-search generator; scaffold them here
  // only when they are not already present so the page works standalone.
  const acceleratorIndexPath = 'src/components/accelerator/index.ts';
  if (!tree.exists(acceleratorIndexPath)) {
    generateFiles(
      tree,
      joinPathFragments(
        __dirname,
        '../search/files/react/src/components/accelerator'
      ),
      `${directory}/src/components/accelerator`,
      templateVariables
    );
  } else {
    spinner.info(
      'Skipping shared accelerator generation because src/components/accelerator already exists.'
    );
  }

  const generatorProcessor = new GeneratorProcessor<ReactPageGeneratorSchema>();
  generatorProcessor.addStep(new ReactFeaturePageRegistrationStep());
  generatorProcessor.addStep(new ReactFeatureRoutesStep());
  generatorProcessor.addStep(new GeneralTranslationsStep());
  generatorProcessor.addStep(new GeneralPermissionsStep());
  await generatorProcessor.run(tree, options, spinner, true);

  await formatFiles(tree);
  spinner.succeed('React page generator scaffold is ready.');

  return () => {
    let cmd = '';

    function log(command: string) {
      console.log('');
      console.log('generate react page ==> ' + command);
    }

    installPackagesTask(tree);

    const files = tree
      .listChanges()
      .map((c) => c.path)
      .filter((p) => p.endsWith('.ts') || p.endsWith('.tsx'))
      .join(' ');

    if (!files) {
      return;
    }

    cmd = 'npx --yes organize-imports-cli ';
    log(cmd);
    execSync(cmd + files, { cwd: tree.root, stdio: 'inherit' });

    cmd = 'npx prettier --write ';
    log(cmd);
    execSync(cmd + files, { cwd: tree.root, stdio: 'inherit' });
  };
}

export default pageGenerator;
