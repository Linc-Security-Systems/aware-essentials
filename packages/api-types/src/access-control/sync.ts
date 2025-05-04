export type ResponseWithProgressKey<T = object> = {
  syncProgressKey: string;
} & T;
