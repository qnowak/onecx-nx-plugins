import { Tree } from '@nx/devkit';
import ora = require('ora');

interface GeneratorStepErrorParameters {
  stopExecution: boolean;
}

const DEFAULT_ERROR_PARAMETERS: GeneratorStepErrorParameters = {
  stopExecution: false,
};

export class GeneratorStepError extends Error {
  errorParameters: GeneratorStepErrorParameters;

  constructor(message: string, parameters?: GeneratorStepErrorParameters) {
    super(message);
    this.errorParameters = {
      ...DEFAULT_ERROR_PARAMETERS,
      ...parameters,
    };
  }
}

export interface GeneratorStep<T> {
  process(tree: Tree, options: T): void | Promise<void>;
  getTitle(): string;
  isApplicable?(options: T): boolean;
}

export class GeneratorProcessor<T> {
  private steps: GeneratorStep<T>[] = [];
  private errors: GeneratorStepError[] = [];
  private _printErrors = false;

  addStep(step: GeneratorStep<T>) {
    this.steps.push(step);
  }

  async run(tree: Tree, options: T, ora?: ora.Ora, printErrors = false) {
    this._printErrors = printErrors;
    this.errors = [];
    for (const step of this.steps) {
      if (step.isApplicable && !step.isApplicable(options)) {
        continue;
      }
      if (ora) {
        const stepTitle = step.getTitle().trimEnd();
        ora.info(stepTitle);
      }
      try {
        await step.process(tree, options);
      } catch (error) {
        if (error instanceof GeneratorStepError) {
          const gsf = error as GeneratorStepError;
          this.errors.push(gsf);
          if (gsf.errorParameters.stopExecution) {
            break;
          }
        }
      }
    }
    this.printErrors(ora);
  }

  getErrors(): GeneratorStepError[] {
    return this.errors;
  }

  hasStoppedExecution(): boolean {
    return this.errors.find((e) => e.errorParameters.stopExecution)
      ?.errorParameters.stopExecution;
  }

  printErrors(ora?: ora.Ora) {
    if (this.errors.length > 0 && this._printErrors) {
      if (ora) {
        ora.fail('Some errors occurred during generation:');
      } else {
        console.error('Some errors occurred during generation:');
      }
      this.errors.forEach((e) => {
        console.error(e.message);
      });
      if (this.hasStoppedExecution()) {
        console.error(
          'One of the errors above stopped the generation, check for possible issues.'
        );
      }
    }
  }

  static async runBatch<T>(
    tree: Tree,
    options: T,
    steps: GeneratorStep<T>[],
    ora?: ora.Ora,
    printErrors = false
  ): Promise<GeneratorProcessor<T>> {
    const genProc = new GeneratorProcessor();
    steps.forEach((s) => genProc.addStep(s));
    await genProc.run(tree, options, ora, printErrors);
    return genProc;
  }

  static getServiceName(name: string): string {
    return name + 'Api';
  }
}
