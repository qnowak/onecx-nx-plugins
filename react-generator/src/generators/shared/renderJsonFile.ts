import ejs = require('ejs');
import { readFileSync } from 'fs';

export function renderJsonFile(
  filePath: string,
  options: Record<string, unknown>
) {
  const enJsonTemplate = readFileSync(filePath, 'utf-8');
  const enJsonContent = ejs.render(
    enJsonTemplate,
    options,
    {
      filename: filePath,
    }
  );

  return JSON.parse(enJsonContent);
}
