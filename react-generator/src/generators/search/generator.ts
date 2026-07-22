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
import { GeneralOpenAPIStep } from './steps/general-openapi.step';
import { GeneralPermissionsStep } from './steps/general-permissions.step';
import { GeneralTranslationsStep } from './steps/general-translations.step';
import { ReactFeaturePageRegistrationStep } from './steps/react-feature-page-registration.step';

import { SearchGeneratorSchema } from './schema';

const PARAMETERS: GeneratorParameter<SearchGeneratorSchema>[] = [
  {
    key: 'customizeNamingForAPI',
    type: 'boolean',
    required: 'interactive',
    default: false,
    prompt: 'Do you want to customize the names for the generated API?',
  },
  {
    key: 'resource',
    type: 'text',
    required: 'interactive',
    default: (values) => `${names(values.featureName).className}`,
    prompt: 'Provide a name for the Resource (e.g. Book): ',
    showInSummary: true,
    showRules: [{ showIf: (values) => values.customizeNamingForAPI }],
  },
  {
    key: 'searchRequestName',
    type: 'text',
    required: 'interactive',
    default: (values) => `Search${names(values.resource).className}Request`,
    prompt: 'Provide a name for the Search Request (e.g. SearchBookRequest): ',
    showInSummary: true,
    showRules: [{ showIf: (values) => values.customizeNamingForAPI }],
  },
  {
    key: 'searchResponseName',
    type: 'text',
    required: 'interactive',
    default: (values) => `Search${names(values.resource).className}Response`,
    prompt:
      'Provide a name for the Search Response (e.g. SearchBookResponse): ',
    showInSummary: true,
    showRules: [{ showIf: (values) => values.customizeNamingForAPI }],
  },
  {
    key: 'serviceName',
    type: 'text',
    required: 'never',
    default: (values) =>
      GeneratorProcessor.getServiceName(`${names(values.resource).className}`),
  },
  {
    key: 'standalone',
    type: 'boolean',
    required: 'never',
    default: false,
  },
];

export async function searchGenerator(
  tree: Tree,
  options: SearchGeneratorSchema
): Promise<GeneratorCallback> {
  const parameters = await processParams<SearchGeneratorSchema>(
    PARAMETERS,
    options
  );
  Object.assign(options, parameters);

  const spinner = ora(
    `Adding React search to feature "${options.featureName}"`
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
  const resourceNames = names(options.resource);

  const templateVariables = {
    ...options,
    featureFileName: featureNames.fileName,
    featureClassName: featureNames.className,
    featurePropertyName: featureNames.propertyName,
    resourceFileName: resourceNames.fileName,
    resourceClassName: resourceNames.className,
    resourcePropertyName: resourceNames.propertyName,
    resourceConstantName: resourceNames.constantName,
  };

  generateFiles(
    tree,
    joinPathFragments(__dirname, './files/react/src/pages'),
    `${directory}/src/pages`,
    templateVariables
  );

  generateFiles(
    tree,
    joinPathFragments(
      __dirname,
      './files/react/src/components/__featureFileName__/__resourceFileName__-search'
    ),
    `${directory}/src/components/${resourceNames.fileName}`,
    templateVariables
  );

  const acceleratorIndexPath = 'src/components/accelerator/index.ts';
  if (!tree.exists(acceleratorIndexPath)) {
    generateFiles(
      tree,
      joinPathFragments(__dirname, './files/react/src/components/accelerator'),
      `${directory}/src/components/accelerator`,
      templateVariables
    );
  } else {
    spinner.info(
      'Skipping shared accelerator generation because src/components/accelerator already exists.'
    );
  }

  if (!tree.exists('src/hooks')) {
    spinner.info('Creating src/hooks folder for generated hooks.');
  }
  generateFiles(
    tree,
    joinPathFragments(__dirname, './files/react/src/hooks'),
    `${directory}/src/hooks`,
    templateVariables
  );

  const generatorProcessor = new GeneratorProcessor<SearchGeneratorSchema>();
  generatorProcessor.addStep(new ReactFeaturePageRegistrationStep());
  generatorProcessor.addStep(new GeneralTranslationsStep());
  generatorProcessor.addStep(new GeneralOpenAPIStep());
  generatorProcessor.addStep(new GeneralPermissionsStep());
  await generatorProcessor.run(tree, options, spinner, true);

  await formatFiles(tree);
  spinner.succeed('React search generator scaffold is ready.');

  return () => {
    let cmd = '';

    function log(command: string) {
      console.log('');
      console.log('generate react search ==> ' + command);
    }

    cmd = 'npm run apigen ';
    log(cmd);
    execSync(cmd, { cwd: tree.root, stdio: 'inherit' });

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

export default searchGenerator;
