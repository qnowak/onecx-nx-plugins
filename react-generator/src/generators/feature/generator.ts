import {
  formatFiles,
  generateFiles,
  GeneratorCallback,
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
import { replacePlaceholder } from '../shared/replacePlaceholder';
import { GeneralOpenAPIStep } from './steps/general-openapi.step';
import { GeneralPermissionStep } from './steps/general-helm-values.step';

import { ReactFeatureGeneratorSchema } from './schema';

const PARAMETERS: GeneratorParameter<ReactFeatureGeneratorSchema>[] = [
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
      return `${names(values.name).className}`;
    },
    prompt:
      'Provide a name for the resource/entity managed by the feature (e.g. Book): ',
    showInSummary: true,
    showRules: [{ showIf: (values) => values.customizeNamingForAPI }],
  },
];

export async function featureGenerator(
  tree: Tree,
  options: ReactFeatureGeneratorSchema
): Promise<GeneratorCallback> {
  const parameters = await processParams<ReactFeatureGeneratorSchema>(
    PARAMETERS,
    options
  );
  Object.assign(options, parameters);

  const spinner = ora(`Adding React feature ${options.name}`).start();

  const isReact = !!Object.keys(
    readJson(tree, 'package.json').dependencies
  ).find((k) => k.includes('react'));
  if (!isReact) {
    spinner.fail('Currently only React projects are supported.');
    throw new Error('Currently only React projects are supported.');
  }

  const projectConfig = tree.read('project.json');
  let workspaceName = '';
  if (projectConfig) {
    const projectJson = JSON.parse(projectConfig.toString());
    workspaceName = projectJson.name;
  }

  generateFiles(tree, joinPathFragments(__dirname, './files/react'), './', {
    ...options,
    workspaceName: workspaceName,
    featureFileName: names(options.name).fileName,
    featureClassName: names(options.name).className,
    featurePropertyName: names(options.name).propertyName,
  });

  const generatorProcessor =
    new GeneratorProcessor<ReactFeatureGeneratorSchema>();
  generatorProcessor.addStep(new GeneralPermissionStep());
  generatorProcessor.addStep(new GeneralOpenAPIStep());

  generatorProcessor.run(tree, options, spinner);

  adaptAppRouting(tree, options);

  await formatFiles(tree);

  spinner.succeed();
  return () => {
    let cmd = '';
    function log(command: string) {
      console.log('');
      console.log('generate feature ==> ' + command);
    }

    cmd = 'npm run apigen ';
    log(cmd);
    execSync(cmd, { cwd: tree.root, stdio: 'inherit' });
    const files = tree
      .listChanges()
      .map((c) => c.path)
      .filter((p) => p.endsWith('.ts') || p.endsWith('.tsx'))
      .join(' ');

    cmd = 'npx --yes organize-imports-cli ';
    log(cmd);
    execSync(cmd + files, { cwd: tree.root, stdio: 'inherit' });
    cmd = 'npx prettier --write ';
    log(cmd);
    execSync(cmd + files, { cwd: tree.root, stdio: 'inherit' });
  };
}

function adaptAppRouting(tree: Tree, options: ReactFeatureGeneratorSchema) {
  const fileName = names(options.name).fileName;
  const className = names(options.name).className;
  const routingFilePath = 'src/router.tsx';

  if (!tree.exists(routingFilePath)) {
    console.warn(
      'Route file src/router.tsx not found. Skipping routing adaptation.'
    );
    return;
  }

  const content = tree.read(routingFilePath, 'utf8') ?? '';
  if (content.includes(`element: <${className}Feature />`)) {
    return;
  }

  replacePlaceholder(
    tree,
    routingFilePath,
    `${className}Feature`,
    `import ${className}Feature from "./pages/${fileName}";`,
    fileName
  );

  if (
    !(tree.read(routingFilePath, 'utf8') ?? '').includes(
      `import ${className}Feature from "./pages/${fileName}";`
    )
  ) {
    throw new Error(
      `Could not insert feature import into ${routingFilePath}. Please add import ${className}Feature manually.`
    );
  }

  if (!(tree.read(routingFilePath, 'utf8') ?? '').includes(`path: \`\${href}/${fileName}\``)) {
    throw new Error(
      `Could not insert feature route into ${routingFilePath}. Please add path \`\${href}/${fileName}\` manually.`
    );
  }
}

export default featureGenerator;
