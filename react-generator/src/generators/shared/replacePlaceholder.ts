import { Tree } from '@nx/devkit';
import { tsquery } from '@phenomnomnominal/tsquery';
import { ScriptKind } from 'typescript';

interface ReplacePlaceholderOptions {
  routePath?: string;
  find?: string | RegExp;
  replaceWith?: string;
  goal?: string;
}

/**
 * Registers a generated page in a feature's `index.tsx` barrel file by adding the
 * page import and replacing the `<div>` placeholder with the page component.
 *
 * @param tree - The Nx `Tree`.
 * @param indexFilePath - Path to the feature `index.tsx`.
 * @param pageComponent - The page component name to render (e.g. `BookSearchPage`).
 * @param importLine - The full import statement for the page component.
 */
export function replacePlaceholder(
  tree: Tree,
  indexFilePath: string,
  pageComponent: string,
  importLine: string,
  optionsOrRoutePath?: string | ReplacePlaceholderOptions
): void {
  if (!tree.exists(indexFilePath)) {
    return;
  }

  const content = tree.read(indexFilePath, 'utf8');
  if (!content) {
    return;
  }

  const options: ReplacePlaceholderOptions =
    typeof optionsOrRoutePath === 'string'
      ? { routePath: optionsOrRoutePath }
      : optionsOrRoutePath ?? {};

  const routePath = options.routePath;

  const withImport = importLine
    ? content.includes(importLine)
      ? content
      : `${importLine}\n${content}`
    : content;

  if (options.find && options.replaceWith !== undefined) {
    const updatedContent = withImport.replace(options.find, options.replaceWith);
    if (updatedContent === withImport) {
      const goal = options.goal ?? 'Apply replacement';
      const comment = `// Generator Failure occurred!\n// The goal of the generation was to: ${goal}\n//\n// Could not find expected pattern for replacement.\n//\n// Please perform the replacement manually.\n`;
      tree.write(indexFilePath, `${comment}\n${withImport}`);
      return;
    }

    tree.write(indexFilePath, updatedContent);
    return;
  }

  if (routePath) {
    const ast = tsquery.ast(withImport, indexFilePath, ScriptKind.TSX);
    const routeArrays = tsquery(
      ast,
      'CallExpression:has(Identifier[name="useMemo"]) ReturnStatement > ArrayLiteralExpression'
    );
    const routeArray = routeArrays[routeArrays.length - 1];

    if (!routeArray) {
      const comment = `// Generator Failure occurred!\n// The goal of the generation was to: Add route for ${pageComponent}\n//\n// Could not find useMemo route array.\n//\n// Please perform the replacement manually.\n`;
      tree.write(indexFilePath, `${comment}\n${withImport}`);
      return;
    }

    const routeArrayText = routeArray.getText();
    if (
      routeArrayText.includes(`path: \`\${href}/${routePath}\``) ||
      routeArrayText.includes(`element: <${pageComponent} />`)
    ) {
      tree.write(indexFilePath, withImport);
      return;
    }

    const routeToAdd = `    {\n      path: \`\${href}/${routePath}\`,\n      element: <${pageComponent} />,\n      handle: {},\n    }`;
    const routeArrayEnd = routeArray.getEnd();
    const beforeArray = withImport.substring(0, routeArrayEnd);
    const afterArray = withImport.substring(routeArrayEnd);
    const closingBracketPos = beforeArray.lastIndexOf(']');
    const beforeElement = beforeArray.substring(0, closingBracketPos);
    const afterElement = beforeArray.substring(closingBracketPos);
    const needsComma =
      !beforeElement.trim().endsWith(',') &&
      !beforeElement.trim().endsWith('[');
    const separator = needsComma ? ',\n' : '\n';

    tree.write(
      indexFilePath,
      `${beforeElement}${separator}${routeToAdd}${afterElement}${afterArray}`
    );
    return;
  }

  if (withImport.includes(`<${pageComponent}`)) {
    return;
  }

  const featurePlaceholderRegex =
    /<div>\s*[^<]*feature - add pages using search generator or other generators\s*<\/div>/;
  if (featurePlaceholderRegex.test(withImport)) {
    const replaced = withImport.replace(
      featurePlaceholderRegex,
      `<${pageComponent} />`
    );
    tree.write(indexFilePath, replaced);
    return;
  }

  const ast = tsquery.ast(withImport, indexFilePath, ScriptKind.TSX);
  const strictPlaceholders = tsquery(
    ast,
    'JsxElement:has(> JsxOpeningElement > Identifier[name="div"])'
  );
  const broadPlaceholders = tsquery(
    ast,
    'JsxElement:has(JsxOpeningElement Identifier[name="div"])'
  );
  const placeholder = strictPlaceholders[0] ?? broadPlaceholders[0];

  if (!placeholder) {
    const comment = `// Generator Failure occurred!
// The goal of the generation was to: Replace the <div> placeholder with ${pageComponent}
//
// Could not find the <div> placeholder element to replace.
//
// Please perform the replacement manually.
`;
    tree.write(indexFilePath, `${comment}\n${withImport}`);
    console.error(
      `Error: Could not replace the placeholder. Review the file for more information: ${indexFilePath}`
    );
    return;
  }

  const updatedContent =
    withImport.slice(0, placeholder.getStart(ast)) +
    `<${pageComponent} />` +
    withImport.slice(placeholder.getEnd());

  tree.write(indexFilePath, updatedContent);
}
