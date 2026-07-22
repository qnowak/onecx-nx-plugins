export interface SearchGeneratorSchema {
  customizeNamingForAPI: boolean;
  existStrategy: 'skip';
  featureName: string;
  resource: string;
  searchRequestName: string;
  searchResponseName: string;
  serviceName: string;
  standalone?: boolean;
}
