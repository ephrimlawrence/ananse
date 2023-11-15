let configure, processCLIArgs, run;

import('@japa/runner').then(module => {
  ({ configure, processCLIArgs, run } = module);
  processCLIArgs(process.argv.splice(2));
  configure({
    files: ['tests/**/*.spec.js'],
    plugins: [
      assert(),
      apiClient('http://localhost:3333'),
      expectTypeOf(),
      snapshot(),
    ],
  });
  run();
});
