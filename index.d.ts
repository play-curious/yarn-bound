declare module "yarn-bound" {
  export class YarnBound<VariableStorage> {
    constructor(options: {
      dialogue: string,
      startAt: string,
      variableStorage: VariableStorage,
      functions: Record<string, (...args: string[]) => unknown>,
      handleCommand?: Function,
      combineTextAndOptionsResults?: boolean,
      locale?: string
    });
  
    advance(optionIndex?: number): void;
    registerFunction(name: string, func: unknown): void;
  
    currentResult: Result;
    history: Result[];
  }
  
  export type Result = TextResult | OptionsResult | CommandResult;
  
  export class TextResult {
    text: string;
    hashtags: string[];
    metadata: Metadata;
  }
  
  export class OptionsResult {
      options: Option[];
      metadata: Metadata;
  }
  
  export class CommandResult {
    command: string;
    hashtags: string[];
    metadata: Metadata;
  }
  
  export interface Metadata {
      title: string;
      filetags: string[];
  }
  
  export interface Option {
      text: string;
      isAvailable: boolean;
      hashtags: [];
  }
}