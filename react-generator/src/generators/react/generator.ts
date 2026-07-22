import {
  addDependenciesToPackageJson,
  formatFiles,
  generateFiles,
  GeneratorCallback,
  joinPathFragments,
  names,
  Tree,
} from '@nx/devkit';
import { execSync } from 'child_process';
import * as ora from 'ora';

import processParams, { GeneratorParameter } from '../shared/parameters.utils';
import { GeneratorProcessor } from '../shared/generator.utils';
import { ReactGeneratorSchema } from './schema';
import { GeneralOpenAPIStep } from './steps/general-openapi.step';
import { StylesStep } from './steps/styles.step';
import { AIStep } from './steps/ai.step';
import { StateManagementStep } from './steps/state-management.step';
import {
  addBaseToPackageJson,
  addScriptsToPackageJson,
} from './utils/package-json.utils';
import { adaptTsConfig } from './utils/ts-config.utils';
import { adaptProjectConfiguration } from './utils/project-config.utils';

const PARAMETERS: GeneratorParameter<ReactGeneratorSchema>[] = [
  {
    key: 'chatty',
    type: 'boolean',
    required: 'never',
    default: false,
  },
  {
    key: 'styles',
    type: 'select',
    required: 'interactive',
    prompt: 'Which CSS framework would you like to use?',
    default: 'primeflex',
    choices: ['primeflex', 'tailwind'],
  },
  {
    key: 'aiTool',
    type: 'select',
    required: 'interactive',
    prompt: 'Would you like to add AI agent configuration files?',
    default: 'none',
    choices: ['none', 'copilot'],
  },
  {
    key: 'stateManagement',
    type: 'select',
    required: 'interactive',
    prompt: 'Would you like to add state management?',
    default: 'none',
    choices: ['none', 'zustand'],
  },
];

export async function reactGenerator(
  tree: Tree,
  options: ReactGeneratorSchema
): Promise<GeneratorCallback> {
  function log(command: unknown) {
    if (options.chatty) {
      console.log('');
      console.log('generate react ==> ' + command);
    }
  }
  const parameters = await processParams<ReactGeneratorSchema>(
    PARAMETERS,
    options
  );
  Object.assign(options, parameters);

  const spinner = ora('Adding React').start();
  const directory = '.';

  const { applicationGenerator } = await import('@nx/react');

  const applicationGeneratorCallback = await applicationGenerator(tree, {
    name: options.name,
    directory: directory,
    style: 'css',
    tags: ``,
    projectNameAndRootFormat: 'as-provided',
    e2eTestRunner: 'none',
    bundler: 'vite',
    unitTestRunner: 'vitest',
    routing: false,
    linter: 'eslint',
  });

  tree.delete(`${directory}/src/app/app.tsx`);
  tree.delete(`${directory}/src/app/app.spec.tsx`);
  tree.delete(`${directory}/src/app/app.module.css`);

  tree.delete(`${directory}/src/app/nx-welcome.tsx`);

  generateFiles(
    tree,
    joinPathFragments(__dirname, './files'),
    `${directory}/`,
    {
      ...options,
      className: names(options.name).className,
      remoteModuleName: names(options.name).className,
      remoteModuleFileName: names(options.name).fileName,
      fileName: names(options.name).fileName,
      constantName: names(options.name).constantName,
      propertyName: names(options.name).propertyName,
    }
  );

  const generatorProcessor = new GeneratorProcessor();
  generatorProcessor.addStep(new GeneralOpenAPIStep());
  generatorProcessor.addStep(new StylesStep());
  generatorProcessor.addStep(new AIStep());
  generatorProcessor.addStep(new StateManagementStep());

  await generatorProcessor.run(tree, options, spinner);

  addBaseToPackageJson(tree, options);
  addScriptsToPackageJson(tree);

  const oneCXLibVersion = '^9.0.0-rc.10';
  const reactVersion = '^19.0.0';
  const nxVersion = '22.7.4';

  addDependenciesToPackageJson(
    tree,
    {
      '@onecx/accelerator': oneCXLibVersion,
      '@onecx/react-utils': oneCXLibVersion,
      '@onecx/react-remote-components': oneCXLibVersion,
      '@onecx/react-integration-interface': oneCXLibVersion,
      '@onecx/react-webcomponents': oneCXLibVersion,
      '@onecx/react-auth': oneCXLibVersion,
      '@onecx/integration-interface': oneCXLibVersion,
      '@r2wc/react-to-web-component': '^2.1.0',
      react: reactVersion,
      'react-dom': reactVersion,
      'react-router': '^7.13.0',
      'react-i18next': '16.5.4',
      i18next: '25.8.0',
      primereact: '^10.9.7',
      primeicons: '^7.0.0',
      primeflex: '^4.0.0',
      quill: '^2.0.3',
      'chart.js': '^4.5.0',
      '@tanstack/react-query': '^5.62.0',
    },
    {
      '@nx/vite': nxVersion,
      '@nx/eslint': nxVersion,
      '@nx/eslint-plugin': nxVersion,
      '@nx/react': nxVersion,
      '@nx/js': nxVersion,
      '@nx/web': nxVersion,
      '@nx/workspace': nxVersion,
      '@openapitools/openapi-generator-cli': '^2.16.3',
      '@swc-node/register': '~1.11.1',
      '@swc/cli': '~0.3.12',
      '@swc/core': '^1.15.8',
      '@swc/helpers': '~0.5.11',
      '@vitejs/plugin-react': '^5.1.1',
      '@vitest/ui': '^4.1.7',
      '@eslint/js': '^8.57.1',
      eslint: '^9.8.0',
      'eslint-config-prettier': '^10.0.0',
      'eslint-plugin-import': '2.31.0',
      'eslint-plugin-prettier': '^5.2.1',
      'eslint-plugin-jsx-a11y': '^6.10.0',
      'eslint-plugin-react': '^7.37.0',
      'eslint-plugin-react-hooks': '^5.0.0',
      nx: nxVersion,
      prettier: '^3.7.4',
      'sonar-scanner': '^3.1.0',
      typescript: '^5.9.3',
      vite: '^7.1.7',
      vitest: '^4.1.7',
      '@vitest/coverage-v8': '^4.1.7',
      jsdom: '^27.0.1',
      '@module-federation/vite': '1.16.0',
      'vite-plugin-static-copy': '^4.1.0',
      '@testing-library/dom': '^10.0.0',
      '@testing-library/jest-dom': '^6.0.0',
      '@testing-library/react': '^16.0.0',
      '@types/react': '^19.0.0',
      '@types/react-dom': '^19.0.0',
      '@types/node': '^22.0.0',
      '@types/postcss-import': '^14.0.3',
      'postcss-import': '^16.1.1',
    }
  );

  adaptTsConfig(tree);
  adaptProjectConfiguration(tree, options);

  await formatFiles(tree);

  spinner.succeed();

  return async () => {
    await applicationGeneratorCallback();

    const dirsToClean = ['.vscode', 'apps', 'libs'].filter((d) =>
      tree.exists(d)
    );
    if (dirsToClean.length > 0) {
      const cmd = `rm -rf ${dirsToClean.join(' ')}`;
      log(cmd);
      execSync(cmd, { cwd: tree.root, stdio: 'inherit' });
    }

    if (tree.exists('.gitignore.org')) {
      const cmd = 'mv -f .gitignore.org .gitignore';
      log(cmd);
      execSync(cmd, { cwd: tree.root, stdio: 'inherit' });
    }

    const cmd = 'npm run apigen ';
    log(cmd);
    execSync(cmd, { cwd: tree.root, stdio: 'inherit' });

    const files = tree
      .listChanges()
      .map((c) => c.path)
      .filter((p) => p.endsWith('.ts') || p.endsWith('.tsx'))
      .join(' ');
    const prettierCmd = 'npx prettier --write ';
    log(prettierCmd);
    execSync(prettierCmd + files, { cwd: tree.root, stdio: 'inherit' });
  };
}

export default reactGenerator;
