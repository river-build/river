const TODO_Symbol = Symbol('TODO')
// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
export type TODO<T extends string = ''> = any & { [TODO_Symbol]: T }
