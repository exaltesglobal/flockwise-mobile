// src/core is shared with the Node backend, which has Buffer; on the phone the
// btoa/atob branches run instead, so this only describes the calls core makes.
declare const Buffer: {
  from(data: string, encoding: string): ArrayLike<number> & { toString(encoding?: string): string };
  byteLength(data: string): number;
};
