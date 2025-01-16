import { TransformConfig } from '../types';

export class DataTransformer {
  private inputTransform?: (data: any) => any;
  private outputTransform?: (data: any) => any;

  constructor(config?: TransformConfig) {
    this.inputTransform = config?.input;
    this.outputTransform = config?.output;
  }

  transformInput(data: any): any {
    if (this.inputTransform) {
      return this.inputTransform(data);
    }
    return data;
  }

  transformOutput(data: any): any {
    if (this.outputTransform) {
      return this.outputTransform(data);
    }
    return data;
  }
}
