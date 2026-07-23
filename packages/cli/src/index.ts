/**
 * Simple argument parser for CLI applications.
 * Parses --flag=value, --flag value, and boolean --flag.
 */
export function parseArgs(args: string[]): Record<string, string | boolean> {
  const result: Record<string, string | boolean> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg.startsWith('--')) {
      const keyStr = arg.slice(2);

      if (keyStr.includes('=')) {
        const [key, value] = keyStr.split('=');
        result[key] = value;
      } else {
        // Look ahead to see if the next arg is a value
        if (i + 1 < args.length && !args[i + 1].startsWith('--')) {
          result[keyStr] = args[i + 1];
          i++; // Skip the value
        } else {
          result[keyStr] = true;
        }
      }
    }
  }

  return result;
}
