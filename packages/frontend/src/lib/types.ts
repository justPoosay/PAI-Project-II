import type { Ref } from 'vue';

export type Nullish<T> = T | null | undefined;
export type UnRef<T> = T extends Ref<infer U> ? U : T;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ART<T extends (...args: any) => any> = Awaited<ReturnType<T>>;
