import { JSONSchema4 } from 'json-schema';
import { UiHint } from './agent-communication';

export interface ModuleConfig {
  app: {
    modules: string[];
  };
  [moduleName: string]: Record<string, unknown>;
}

export interface SaveProviderConfigRq {
  provider: string;
  enabled: boolean;
  config: Record<string, unknown>;
}

export interface ModuleConfigMetadata {
  allModules: string[];
  moduleTitles: Record<string, string>;
  moduleDefaults: Record<string, Record<string, unknown>>;
  moduleSchemas: Record<string, JSONSchema4>;
  moduleUiHints: Record<string, UiHint[]>;
}

export interface ConfigIssue {
  paths: string[];
  message: string;
  provider: string;
}

export interface ModuleConfigSpecs {
  provider: string;
  title: string;
  schema: JSONSchema4;
  default: Record<string, unknown>;
  uiHints?: UiHint[];
}
