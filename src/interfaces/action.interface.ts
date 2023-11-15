interface Action<T = any> extends Function {
  new (...args: any[]): T;
}
