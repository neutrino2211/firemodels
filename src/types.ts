export type InternalFactory = {[key: string]: {rerun: () => void}};
export type ModelType<T> = {
    new (): T,
    from: (key: string) => Promise<T | undefined>,
    find: (key: string, target: string) => Promise<T | undefined>,
    fetchAll: () => Promise<Array<T>>
}