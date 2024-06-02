import mockjs, {valid} from "mockjs";
import {eachTree, randomNum} from "../../utils";
import * as localforage from "localforage";

(async function () {

})()

let data: any = []
localforage.getItem("mockFileList").then(value => {
    if (value) return data = value
    data = generateFileOrDir("/", 20)
    localforage.setItem("mockFileList", data)
})

// localforage.getItem("mockData").then((value) => {
//     if (value) {
//         data = value
//     } else {
//         data = mockjs.mock({
//             "list|3-8": [
//                 {
//                     path: "@word",
//                     name: "@ctitle",
//                     isFile: "@boolean",
//                     createTime: "@time",
//                     lastModifyTime: "@time",
//                     isLeaf: false,
//                     size: mockjs.Random.integer(10000, 10000000),
//                     children: mockjs.mock({
//                         "list|1-10": [{
//                             path: "@word",
//                             name: "@ctitle",
//                             isFile: "@boolean",
//                             createTime: "@time",
//                             lastModifyTime: "@time",
//                             isLeaf: false,
//                             size: mockjs.Random.integer(10000, 10000000),
//                             children: mockjs.mock({
//                                 "list|1-10": [{
//                                     path: "@word",
//                                     name: "@ctitle",
//                                     isFile: "@boolean",
//                                     createTime: "@time",
//                                     lastModifyTime: "@time",
//                                     isLeaf: false,
//                                     size: mockjs.Random.integer(10000, 10000000),
//                                     children: mockjs.mock({
//                                         "list|1-10": [{
//                                             path: "@word",
//                                             name: "@ctitle",
//                                             isFile: "@boolean",
//                                             createTime: "@time",
//                                             lastModifyTime: "@time",
//                                             isLeaf: false,
//                                             size: mockjs.Random.integer(10000, 10000000),
//                                             children: mockjs.mock({
//                                                 "list|1-10": [{
//                                                     path: "@word",
//                                                     name: "@ctitle",
//                                                     isFile: "@boolean",
//                                                     createTime: "@time",
//                                                     lastModifyTime: "@time",
//                                                     isLeaf: false,
//                                                     size: mockjs.Random.integer(10000, 10000000),
//                                                     children: mockjs.mock({
//                                                         "list|1-10": [{
//                                                             path: "@word",
//                                                             name: "@ctitle",
//                                                             isFile: "@boolean",
//                                                             createTime: "@time",
//                                                             lastModifyTime: "@time",
//                                                             isLeaf: false,
//                                                             size: mockjs.Random.integer(10000, 10000000),
//                                                             children: mockjs.mock({
//                                                                 "list|1-10": [{
//                                                                     path: "@word",
//                                                                     name: "@ctitle",
//                                                                     isFile: "@boolean",
//                                                                     createTime: "@time",
//                                                                     lastModifyTime: "@time",
//                                                                     isLeaf: false,
//                                                                     size: mockjs.Random.integer(10000, 10000000),
//                                                                     children: mockjs.mock({
//                                                                         "list|1-10": [{
//                                                                             path: "@word",
//                                                                             name: "@ctitle",
//                                                                             isFile: "@boolean",
//                                                                             createTime: "@time",
//                                                                             lastModifyTime: "@time",
//                                                                             isLeaf: false,
//                                                                             size: mockjs.Random.integer(10000, 10000000),
//                                                                             children: []
//                                                                         }]
//                                                                     }).list
//                                                                 }]
//                                                             }).list
//                                                         }]
//                                                     }).list
//                                                 }]
//                                             }).list
//                                         }]
//                                     }).list
//                                 }]
//                             }).list
//                         }]
//                     }).list
//                 }
//             ]
//         }).list
//         localforage.setItem("mockData", data)
//     }
// })

// data = mockjs.mock({
//     "list|1-10": [ {
//         path: "@word",
//         name: "@ctitle",
//         isFile: "@boolean",
//         createTime: "@time",
//         lastModifyTime: "@time",
//         size: mockjs.Random.integer(10000, 10000000),
//         isLeaf: false,
//         children: mockjs.mock({
//             "list|0-10": [ {
//                 path: "@word",
//                 name: "@ctitle",
//                 isFile: "@boolean",
//                 createTime: "@time",
//                 lastModifyTime: "@time",
//                 size: mockjs.Random.integer(10000, 10000000),
//                 isLeaf: false,
//                 children: []
//             }]
//         }).list
//     }]
// }).list
let currNum = 0
const max = 100
const random = mockjs.Random
const fileExt = [".jpg", ".png", ".gif", ".txt", "", ".mp4", ".mp3", ".zip", ".exe", ".html"]
function generateFileOrDir(path: string, length: number): any[] {
    currNum++
    const files = []
    for (let i = 0; i < length; i++) {
        const isFile = random.boolean()
        if (isFile) {
            const ext = fileExt[random.integer(0, fileExt.length - 1)]
            const name = (random.boolean() ? random.word(2, 8) : random.cword(2, 8)) + ext
            const newPath = (path + "/" + name).replace(/\/+/g, "/")
            files.push({
                path: newPath,
                name: name,
                isFile: isFile,
                createTime: new Date().getTime(),
                lastModifyTime: new Date().getTime(),
                isLeaf: true,
                size: random.integer(0, 10000000),
                children: []
            })
        } else {
            const isLeaf = random.boolean()
            const name = (random.boolean() ? random.word(2, 8) : random.cword(2, 8))
            const newPath = (path + "/" + name).replace(/\/+/g, "/")

            files.push({
                path: newPath,
                name: name,
                isFile: isFile,
                createTime: new Date().getTime(),
                lastModifyTime: new Date().getTime(),
                isLeaf: isLeaf,
                size: random.integer(10000, 10000000),
                children: (isLeaf || currNum >= max) ? [] : generateFileOrDir(newPath, random.integer(1, 10))
            })
        }
    }

    return files
}

let re = new RegExp(`${process.env.REACT_APP_DATA_API_URL}/api[\\s\\S]*?_method=getFileList`)
mockjs.mock(re, (params) => {
    const queryParams = new URLSearchParams(params.url.split("?")[1] || "")
    const path = queryParams.get("path") || "/"
    const offset = parseInt(queryParams.get("offset") || "0")


    // const root = mockjs.mock({
    //     path: "/",
    //     name: "Root",
    //     isFile: false,
    //     createTime: "@time",
    //     lastModifyTime: "@time",
    //     isLeaf: false,
    //     size: mockjs.Random.integer(10000, 10000000),
    //     children: data
    // })
    //
    // const fileExt = [".jpg", ".png", ".gif", ".txt", "", ".mp4", ".mp3", ".zip", ".exe", ".html"]
    // eachTree(root, (treeNode) => {
    //     treeNode.node.isFile && (treeNode.node.name = mockjs.Random.word() + fileExt[mockjs.Random.integer(0, fileExt.length - 1)])
    //     treeNode.node.isFile && (treeNode.node.children = [])
    //     treeNode.node.isLeaf = !treeNode.node.children.length
    //
    //     const parentNode = treeNode.prev?.node
    //     if (parentNode) {
    //         if (parentNode.path === "/") {
    //             treeNode.node.path = parentNode.path + treeNode.node.path
    //         } else {
    //             treeNode.node.path = parentNode.path + "/" + treeNode.node.path
    //         }
    //     }
    // })
    // if (path === "/" || path === "") {
    //     const children = [...root.children]
    //
    //     return children.map((v: any, k: any) => {
    //         v.children = v.children.map((j: any, l: any) => {
    //             j.children = []
    //             return j
    //         })
    //         return v
    //     })
    // }

    let result: any[] = []
    let n = 0
    eachTree({path: "/", children: data}, (treeNode) => {
        if (path === treeNode.prev?.node.path && n >= offset) {
            const tmp = {...treeNode.node}
            tmp.children = []
            result.push(tmp)
            n++
        }
    })

    return result
})

// let fileDownloadUrl = new RegExp(`${process.env.REACT_APP_DATA_API_URL}/file\\/download[\\s\\S]*?`)
// mockjs.mock(fileDownloadUrl, (params) => {
//     console.log("wwww")
//     return fetch("https://ts2.cn.mm.bing.net/th/id/OIP-C.mH9YLFEL5YdVxJM82mjVJQAAAA?rs=1&pid=ImgDetMain")
// })