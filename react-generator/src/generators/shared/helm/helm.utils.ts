import { parse, stringify } from 'yaml';
export const COMMENT_KEY = '~comment~';

/**
 * This utility can be used to adapt Values YAML Files
 * It provides a builder-like interface to interact and bases
 * on the YAML library to parse / stringify.
 * When you want to add a comment to your JSON, you can do so by using an
 * object with the COMMENT_KEY as key. Though be aware, once this utility
 * parses the Values YAML again, all previous comments will be lost (as JSON
 * does not have comments).
 */
export class HelmValuesUtil {
  private yamlContent: object;

  constructor(yamlContent: string) {
    this.yamlContent = parse(yamlContent);
  }

  /**
   * Quick access to the permission section of the YAML
   * @returns interface to set items of the section
   */
  permissions(): PermissionSectionUtil {
    if (!this.yamlContent['app']) {
      this.yamlContent['app'] = {};
    }
    if (!this.yamlContent['app']['operator']) {
      this.yamlContent['app']['operator'] = {};
    }
    if (!this.yamlContent['app']['operator']['permission']) {
      this.yamlContent['app']['operator']['permission'] = {};
    }
    if (!this.yamlContent['app']['operator']['permission']['spec']) {
      this.yamlContent['app']['operator']['permission']['spec'] = {};
    }
    if (!this.yamlContent['app']['operator']['permission']['spec']['permissions']) {
      this.yamlContent['app']['operator']['permission']['spec']['permissions'] = {};
    }
    return new PermissionSectionUtil(
      this,
      this.yamlContent['app']['operator']['permission']['spec']['permissions']
    );
  }

  /**
   * Access to the full YAML
   * @returns interface to set items of the section
   */
  full(): PermissionSectionUtil {
    return new PermissionSectionUtil(this, this.yamlContent);
  }

  finalize(): string {
    let asString = stringify(this.yamlContent, {
      lineWidth: 0,
    });
    // Replace comments
    asString = asString.replaceAll(`~comment~:`, '#');
    return asString;
  }
}

export interface ObjectSetOptions {
  // Add a comment after insertion
  comment?: string | undefined;
  // If a value already exists for a key, what action should be performed
  existStrategy: 'skip' | 'replace' | 'extend';
}
export class PermissionSectionUtil {
  private util: HelmValuesUtil;
  private sectionContent: object;

  constructor(util: HelmValuesUtil, sectionContent: object) {
    this.util = util;
    this.sectionContent = sectionContent;
  }

  /**
   * Sets an entry of this section content
   * @param key key of the entry object
   * @param value value of the entry object
   * @param comment comment for the entry (added last)
   * @param options configure existStrategy and comment
   * @returns
   */
  set(key: string, value: object, options?: ObjectSetOptions) {
    const existStrategy = options ? options.existStrategy : 'skip';
    if (this.sectionContent[key] != null) {
      if (existStrategy == 'extend') {
        this.sectionContent[key] = {
          ...this.sectionContent[key],
          ...value,
        };
        return this;
      }
      if (existStrategy == 'skip') {
        return this;
      }
      // Replace is same as initial set
    }
    this.sectionContent[key] = value;
    if (options && options.comment) {
      this.sectionContent[key][COMMENT_KEY] = options.comment;
    }
    return this;
  }

  get(key: string) {
    return this.sectionContent[key];
  }

  /**
   * Return to util interface
   * @returns initial util interface
   */
  done() {
    return this.util;
  }
}
