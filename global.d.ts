interface ObjectConstructor {
  entries<T extends object>(o: T): [keyof T, T[keyof T]][];
}
