export function randomNum(minNum: number, maxNum: number) {
    return parseInt(String(Math.random() * (maxNum - minNum + 1) + minNum), 10);
}

type TreeNode<T> = { node: T, prev: TreeNode<T> | null, next: TreeNode<T> | null }

export function eachTree<T>(tree: T, callback: (treeNode: TreeNode<T>) => boolean | void, childrenName: string = "children") {
    type objKey = keyof T

    const nodes: TreeNode<T>[] = [{node: tree, prev: null, next: null}]
    let next = nodes.shift()
    while (next) {
        const _time: TreeNode<T>[] = []
        for (const item of (next.node[childrenName as objKey] || []) as T[]) {
            _time.push({node: item, prev: next, next: null})
        }

        _time && nodes.unshift(..._time)

        next.next = nodes[0]
        if (callback(next) === false) return;

        next = nodes.shift()
    }
}

export function getUuid (): string {
    if (typeof crypto === 'object') {
        if (typeof crypto.randomUUID === 'function') {
            return crypto.randomUUID();
        }
        if (typeof crypto.getRandomValues === 'function' && typeof Uint8Array === 'function') {
            const callback = (c: any) => {
                const num = Number(c);
                return (num ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (num / 4)))).toString(16);
            };
            // @ts-ignore
            return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, callback);
        }
    }
    let timestamp = new Date().getTime();
    let perforNow = (typeof performance !== 'undefined' && performance.now && performance.now() * 1000) || 0;
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        let random = Math.random() * 16;
        if (timestamp > 0) {
            random = (timestamp + random) % 16 | 0;
            timestamp = Math.floor(timestamp / 16);
        } else {
            random = (perforNow + random) % 16 | 0;
            perforNow = Math.floor(perforNow / 16);
        }
        return (c === 'x' ? random : (random & 0x3) | 0x8).toString(16);
    });
}