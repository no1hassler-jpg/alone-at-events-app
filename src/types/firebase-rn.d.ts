// firebase/auth's package.json "exports" field has a top-level "types" key that shadows
// its per-platform "react-native" condition, so TypeScript can't see getReactNativePersistence
// even though Metro resolves the real React Native implementation correctly at runtime.
// The `export {}` below makes this file a module so `declare module` augments (rather than
// replaces) the existing firebase/auth type declarations.
export {};

declare module 'firebase/auth' {
  import { Persistence } from '@firebase/auth';

  export function getReactNativePersistence(storage: unknown): Persistence;
}
