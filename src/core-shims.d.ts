// src/core is shared with the Node backend; it guards Buffer with typeof before use.
declare const Buffer: { from(data: string, encoding: string): ArrayLike<number> } | undefined;
