import mockjs from "mockjs";
import {eachTree} from "../../utils";
import * as localforage from "localforage";

(async function () {

})()

let data: any = []
localforage.getItem("mockData").then((value) => {
    if (value) {
        data = value
    } else {
        data = mockjs.mock({
            "list|3-8": [
                {
                    path: "@word",
                    name: "@ctitle",
                    isFile: "@boolean",
                    createTime: "@time",
                    lastModifyTime: "@time",
                    isLeaf: false,
                    size: mockjs.Random.integer(10000, 10000000),
                    children: mockjs.mock({
                        "list|1-10": [{
                            path: "@word",
                            name: "@ctitle",
                            isFile: "@boolean",
                            createTime: "@time",
                            lastModifyTime: "@time",
                            isLeaf: false,
                            size: mockjs.Random.integer(10000, 10000000),
                            children: mockjs.mock({
                                "list|1-10": [{
                                    path: "@word",
                                    name: "@ctitle",
                                    isFile: "@boolean",
                                    createTime: "@time",
                                    lastModifyTime: "@time",
                                    isLeaf: false,
                                    size: mockjs.Random.integer(10000, 10000000),
                                    children: mockjs.mock({
                                        "list|1-10": [{
                                            path: "@word",
                                            name: "@ctitle",
                                            isFile: "@boolean",
                                            createTime: "@time",
                                            lastModifyTime: "@time",
                                            isLeaf: false,
                                            size: mockjs.Random.integer(10000, 10000000),
                                            children: mockjs.mock({
                                                "list|1-10": [{
                                                    path: "@word",
                                                    name: "@ctitle",
                                                    isFile: "@boolean",
                                                    createTime: "@time",
                                                    lastModifyTime: "@time",
                                                    isLeaf: false,
                                                    size: mockjs.Random.integer(10000, 10000000),
                                                    children: mockjs.mock({
                                                        "list|1-10": [{
                                                            path: "@word",
                                                            name: "@ctitle",
                                                            isFile: "@boolean",
                                                            createTime: "@time",
                                                            lastModifyTime: "@time",
                                                            isLeaf: false,
                                                            size: mockjs.Random.integer(10000, 10000000),
                                                            children: mockjs.mock({
                                                                "list|1-10": [{
                                                                    path: "@word",
                                                                    name: "@ctitle",
                                                                    isFile: "@boolean",
                                                                    createTime: "@time",
                                                                    lastModifyTime: "@time",
                                                                    isLeaf: false,
                                                                    size: mockjs.Random.integer(10000, 10000000),
                                                                    children: mockjs.mock({
                                                                        "list|1-10": [{
                                                                            path: "@word",
                                                                            name: "@ctitle",
                                                                            isFile: "@boolean",
                                                                            createTime: "@time",
                                                                            lastModifyTime: "@time",
                                                                            isLeaf: false,
                                                                            size: mockjs.Random.integer(10000, 10000000),
                                                                            children: []
                                                                        }]
                                                                    }).list
                                                                }]
                                                            }).list
                                                        }]
                                                    }).list
                                                }]
                                            }).list
                                        }]
                                    }).list
                                }]
                            }).list
                        }]
                    }).list
                }
            ]
        }).list
        localforage.setItem("mockData", data)
    }
})

// data = mockjs.mock({
//     "list|2": [ {
//         path: "@word",
//         name: "@ctitle",
//         isFile: false,
//         createTime: "@time",
//         lastModifyTime: "@time",
//         size: mockjs.Random.integer(10000, 10000000),
//         children: mockjs.mock({
//             "list|2": [ {
//                 path: "@word",
//                 name: "@ctitle",
//                 isFile: false,
//                 createTime: "@time",
//                 lastModifyTime: "@time",
//                 size: mockjs.Random.integer(10000, 10000000),
//                 children: mockjs.mock({
//                     "list|2": [ {
//                         path: "@word",
//                         name: "@ctitle",
//                         isFile: false,
//                         createTime: "@time",
//                         lastModifyTime: "@time",
//                         size: mockjs.Random.integer(10000, 10000000),
//                         children: []
//                     }]
//                 }).list
//             }]
//         }).list
//     }]
// }).list

mockjs.mock(/device\/files[\s\S]*?/, (params) => {
    const queryParams = new URLSearchParams(params.url.split("?")[1] || "")
    const path = queryParams.get("path") || ""

    const root = mockjs.mock({
        path: "/",
        name: "Root",
        isFile: false,
        createTime: "@time",
        lastModifyTime: "@time",
        size: mockjs.Random.integer(10000, 10000000),
        children: data
    })

    const fileExt = [".jpg", ".png", ".gif", ".txt", "", ".mp4", ".mp3", ".zip", ".exe", ".html"]
    eachTree(root, (treeNode) => {
        treeNode.node.isFile && (treeNode.node.name = mockjs.Random.word() + fileExt[mockjs.Random.integer(0, fileExt.length - 1)])
        treeNode.node.isFile && (treeNode.node.children = [])
        treeNode.node.isLeaf = !treeNode.node.children.length

        const parentNode = treeNode.prev?.node
        if (parentNode) {
            if (parentNode.path === "/") {
                treeNode.node.path = parentNode.path + treeNode.node.path
            } else {
                treeNode.node.path = parentNode.path + "/" + treeNode.node.path
            }
        }
    })
    if (path === "/" || path === "") {
        const children = [...root.children]

        return children.map((v: any, k: any) => {
            v.children = v.children.map((j: any, l: any) => {
                j.children = []
                return j
            })
            return v
        })
    }

    let result: any[] = []
    eachTree(root, (treeNode) => {
        if (path === treeNode.node.path) {
            const children = [...treeNode.node.children]
            result = children.map((v: any, k: any) => {
                v.children = v.children.map((j: any, l: any) => {
                    j.children = []
                    return j
                })
                return v
            })
        }
    })

    return result
})