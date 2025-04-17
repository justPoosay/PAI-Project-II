import type { Ref } from 'vue';

export type Nullish<T> = T | null | undefined;
export type UnRef<T> = T extends Ref<infer U> ? U : T;
