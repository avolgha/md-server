export function lazy<T>(getter: () => T) {
  let value: T;

  return function () {
    if (!value) {
      value = getter();
    }

    return value;
  };
}
