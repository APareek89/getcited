/** A file read belongs to the most recent selection, until cleared or submitted. */
export function latestSelection<T = unknown>() {
  let generation = 0;
  let reading = false;
  let value: T | null = null;
  return {
    next: () => { reading = false; value = null; return ++generation; },
    begin: () => { reading = true; value = null; return ++generation; },
    current: (ticket: number) => ticket === generation,
    finish: (ticket: number, result: T | null = null) => {
      if (ticket !== generation) return false;
      reading = false; value = result; return true;
    },
    snapshot: () => ({ generation, reading, value }),
  };
}
