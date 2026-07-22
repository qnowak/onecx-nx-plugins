export interface ReactFeatureGeneratorSchema {
  customizeNamingForAPI: boolean;
  existStrategy: 'skip';
  name: string;
  resource: string;
  standalone?: boolean;
}
