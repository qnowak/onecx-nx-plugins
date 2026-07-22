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
import { ReactFeatureRoutesStep } from './steps/react-feature-routes.step';
import { ReactSearchComponentStep } from './steps/react-search-component.step';
import { GeneralTranslationsStep } from './steps/general-translations.step';
import { GeneralOpenAPIStep } from './steps/general-openapi.step';

import { DetailsGeneratorSchema } from './schema';

const PARAMETERS: GeneratorParameter<DetailsGeneratorSchema>[] = [
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
    default: (values) => {
      return `${names(values.featureName).className}`;
    },
    prompt: 'Provide a name for the Resource (e.g. Book): ',
    showInSummary: true,
    showRules: [{ showIf: (values) => values.customizeNamingForAPI }],
  },
  {
    key: 'getResponseName',
    type: 'text',
    required: 'interactive',
    default: (values) => {
      return `Get${names(values.resource).className}Response`;
    },
    prompt:
      'Provide a name for the GetResourceResponse (e.g. GetBookResponse): ',
    showInSummary: true,
    showRules: [{ showIf: (values) => values.customizeNamingForAPI }],
  },
  {
    key: 'editMode',
    type: 'boolean',
    required: 'interactive',
    prompt: 'Do you want to have an Edit Mode for this page?',
    showInSummary: true,
    default: false,
  },
  {
    key: 'updateRequestName',
    type: 'text',
    required: 'interactive',
    default: (values) => {
      return `Update${names(values.resource).className}Request`;
    },
    prompt: 'Provide a name for the update request (e.g. UpdateBookRequest): ',
    showInSummary: true,
    showRules: [
      { showIf: (values) => values.customizeNamingForAPI && values.editMode },
    ],
  },
  {
    key: 'updateResponseName',
    type: 'text',
    required: 'interactive',
    default: (values) => {
      return `Update${names(values.resource).className}Response`;
    },
    prompt:
      'Provide a name for the update response (e.g. UpdateBookResponse): ',
    showInSummary: true,
    showRules: [
      { showIf: (values) => values.customizeNamingForAPI && values.editMode },
    ],
  },
  {
    key: 'allowDelete',
    type: 'boolean',
    required: 'interactive',
    prompt: 'Do you want to have a Delete Button on this page?',
    showInSummary: true,
    default: false,
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

export async function detailsGenerator(
  tree: Tree,
  options: DetailsGeneratorSchema
): Promise<GeneratorCallback> {
  const parameters = await processParams(PARAMETERS, options);
  Object.assign(options, parameters);

  const spinner = ora(
    `Adding React details to feature "${options.featureName}"`
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

  generateFiles(
    tree,
    joinPathFragments(__dirname, './files/react'),
    `${directory}/`,
    {
      ...options,
      featureFileName: featureNames.fileName,
      featureClassName: featureNames.className,
      featurePropertyName: featureNames.propertyName,
      featureConstantName: featureNames.constantName,
      resourceFileName: resourceNames.fileName,
      resourceClassName: resourceNames.className,
      resourcePropertyName: resourceNames.propertyName,
      resourceConstantName: resourceNames.constantName,
      updateRequestPropertyName: names(options.updateRequestName).propertyName,
      updateResponsePropertyName: names(options.updateResponseName).propertyName,
    }
  );

  const generatorProcessor = new GeneratorProcessor<DetailsGeneratorSchema>();
  generatorProcessor.addStep(new ReactFeatureRoutesStep());
  
  // Optionally extend search with features to navigate to details (if search was generated beforehand)
  const searchPageFilePath = `src/pages/${featureNames.fileName}/${resourceNames.fileName}-search/${resourceNames.fileName}-search.page.tsx`;
  if (tree.exists(searchPageFilePath)) {
    generatorProcessor.addStep(new ReactSearchComponentStep());
  }
  
  generatorProcessor.addStep(new GeneralTranslationsStep());
  generatorProcessor.addStep(new GeneralOpenAPIStep());
  await generatorProcessor.run(tree, options, spinner, true);

  await formatFiles(tree);
  spinner.succeed('React details generator scaffold is ready.');

  return () => {
    let cmd = '';

    function log(command: string) {
      console.log('');
      console.log('generate react details ==> ' + command);
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

export default detailsGenerator;
