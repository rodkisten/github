export interface NodeCiTask {
  name: 'test' | 'build' | 'lint';
  enabled: boolean;
  command: string;
}

export function getTasks(
  getInput: (name: string) => string,
  getBooleanInput: (name: string) => boolean
): NodeCiTask[] {
  return [
    { name: 'test', enabled: getBooleanInput('run-tests'), command: getInput('test-command') },
    { name: 'build', enabled: getBooleanInput('run-build'), command: getInput('build-command') },
    { name: 'lint', enabled: getBooleanInput('run-lint'), command: getInput('lint-command') },
  ];
}
