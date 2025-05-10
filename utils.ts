// TypeScript 4.0 now lets you specify the type of catch clause variables as unknown instead. unknown is safer than any because it reminds us that we need to perform some sorts of type-checks before operating on our values.
// https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-0.html#unknown-on-catch-clause-bindings
export function handleError(functionName: string, error: unknown) {
  // If the error is an Error object, then run this code block.
  if (error instanceof Error) {
    console.error(functionName, "ERROR:", error.message);
  }
  // If the error was NOT an Error object, then run this code block. 
  else {
    console.error(functionName, String(error));
  }
}
