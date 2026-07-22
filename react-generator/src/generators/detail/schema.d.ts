export interface DetailsGeneratorSchema {
  featureName: string;
  customizeNamingForAPI: boolean;
  serviceName: string;
  resource: string;
  getResponseName: string;
  editMode: boolean;
  allowDelete: boolean;
  standalone?: boolean;
  updateRequestName: string;
  updateResponseName: string;
}
