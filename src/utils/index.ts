import {RouteObject} from "react-router-dom";
import {LoaderFunctionArgs} from "@remix-run/router/utils";

export function routeInterceptor(routes: RouteObject[], interceptors: ((args: LoaderFunctionArgs) => any)[]) {
    const newRoutes: RouteObject[] = []
    routes.forEach((route, k) => {
        const loader = route.loader
        const tmp: RouteObject = {...route}

        tmp.loader = (args: LoaderFunctionArgs) => {
            interceptors.forEach((c, i) => {
                c(args)
            })

            return loader?.(args) || null
        }

        newRoutes.push(tmp)
    })

    return newRoutes
}

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