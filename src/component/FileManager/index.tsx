import MoveModal, {MoveModalProps} from "../MoveModal";
import {Breadcrumb, Col, Empty, Image, Layout, List, Row, Skeleton, Tree} from "antd";
import type {DataNode} from "antd/es/tree";
import file_manager from "../../assets/icon/file_manager.png";
import "./index.css"
import {
    FileFilled,
    FileImageFilled,
    FileMarkdownFilled,
    FilePdfFilled,
    FilePptFilled,
    FileTextFilled,
    FileWordFilled,
    FileZipFilled,
    FolderFilled,
    LoadingOutlined,
    PlayCircleOutlined,
    SyncOutlined
} from "@ant-design/icons";
import React, {useEffect, useState} from "react";
import {getFiles} from "../../service/device";
import {eachTree, randomNum} from "../../utils";
import {useDeviceId} from "../../hook/User";
import Player from "../Player";
import ReactDOM from "react-dom/client";

const {DirectoryTree} = Tree;

type RemoteFile = {
    path: string
    name: string
    isFile: boolean
    createTime: number
    lastModifyTime: number
    size: number
    isLeaf: boolean
    children: RemoteFile[]
}

function randomArr(len: number, min: number, max: number): string[] {
    const arr: string[] = []
    for (let i = 0; i < len; i++) {
        arr.push(randomNum(min, max) + "%")
    }
    return arr
}

function getRemoteFiles(path: string, offset: number = 0, size: number = 40) {
    return new Promise<RemoteFile[]>((resolve, reject) => {
        getFiles(currentDeviceId, path, offset, size).then(r => r.data).then((dataList: RemoteFile[]) => {
            return resolve(dataList);
        }).catch(reason => {
            reject(reason)
        })
    })
}

function addFileTreeNode(fileTreeData: RemoteFile, path: string, nodes: RemoteFile[], isCover: boolean = true) {
    const newFileTreeData: RemoteFile = {...fileTreeData}
    eachTree(newFileTreeData, (treeNode) => {
        if (treeNode.node.path !== path) return;
        if (isCover) {
            treeNode.node.children = nodes
        } else {
            treeNode.node.children = [...treeNode.node.children, ...nodes]
        }
    })

    return newFileTreeData
}

const fileType: Map<string, React.ReactElement> = new Map([
    ["jpg", <FileImageFilled/>],
    ["png", <FileImageFilled/>],
    ["gif", <FileImageFilled/>],
    ["pdf", <FilePdfFilled/>],
    ["ppt", <FilePptFilled/>],
    ["word", <FileWordFilled/>],
    ["zip", <FileZipFilled/>],
    ["md", <FileMarkdownFilled/>],
    ["txt", <FileTextFilled/>],
])

type FileManagerProps = {
    width?: number | string
    height?: number | string
    modal?: MoveModalProps
    title?: string
}

// 初始变量
const rootPath = "/storage/emulated/0"
const rootNode = {
    name: "根",
    path: rootPath,
    isFile: false,
    createTime: 0,
    lastModifyTime: 0,
    isLeaf: false,
    children: [],
    size: 0
}
let currentDeviceId = ""

function FileType(props: { file: RemoteFile }) {
    const type = props.file.name.split(".").pop() || ""
    if (["jpg", "jpeg", "png", "gif"].includes(type)) {
        return <Image
            placeholder={true}
            style={{height: "100%"}}
            src={`${process.env.REACT_APP_DATA_API_URL}/file/download?_aid=${currentDeviceId}&_path=${encodeURIComponent(props.file.path)}`}
            fallback="data:image/png;base64,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"
        />
    }

    if (["mp4"].includes(type)) {
        return <div>
            <PlayCircleOutlined onClick={() => {
                const div = document.createElement("div")
                document.body.appendChild(div)
                ReactDOM.createRoot(div).render(<Player modal={{
                    onCancel: () => {
                        div.remove()
                    }
                }} height={600}
                                                        src={`${process.env.REACT_APP_DATA_API_URL}/file/download?_aid=${currentDeviceId}&_path=${encodeURIComponent(props.file.path)}`}/>)
                div.click()
            }}/>
        </div>
    }

    return <a
        href={`${process.env.REACT_APP_DATA_API_URL}/file/download?_aid=${currentDeviceId}&_path=${encodeURIComponent(props.file.path)}`}>
        {
            fileType.get(type) || <FileFilled/>
        }
    </a>
}

export default function FileManager(props: FileManagerProps) {
    // 状态初始化
    const [deviceId] = useDeviceId()
    const [fileTreeData, setFileTreeData] = useState<RemoteFile>(rootNode)
    const [currentPath, setCurrentPath] = useState<string>(fileTreeData.path)
    const [skeletonLoading, setSkeletonLoading] = useState(false)
    const [listLoading, setListLoading] = useState(false)
    const [asyncLoadData, setAsyncLoadData] = useState<{ path: string, promise: Promise<string> } | null>(null)

    currentDeviceId = deviceId

    // 数据初始化
    const fileListData: RemoteFile[] = []
    const pathNavigationData: RemoteFile[] = []
    const fileNavigationTreeMap: Map<string, DataNode> = new Map()
    eachTree(fileTreeData, (treeNode) => {
        if (!treeNode.node.isFile) {
            const disabled = (!asyncLoadData && listLoading && currentPath === treeNode.node.path)
            fileNavigationTreeMap.set(treeNode.node.path, {
                title: treeNode.node.name,
                key: treeNode.node.path,
                isLeaf: disabled ? true : treeNode.node.isLeaf,
                disabled: disabled,
                icon: disabled ? <LoadingOutlined/> : <FolderFilled/>
            })
        }

        if (treeNode.node.path === currentPath) {
            let prev = treeNode.prev
            pathNavigationData.unshift(treeNode.node)
            while (prev) {
                pathNavigationData.unshift(prev.node)
                prev = prev.prev
            }

            if (treeNode.node.children.length) {
                // fileListData.push(...[...treeNode.node.children].sort((a) => a.isFile ? 1 : -1))
                fileListData.push(...treeNode.node.children)
            }
        }
    })

    // 组装导航树
    const fileNavigationTree = fileNavigationTreeMap.get(fileTreeData.path)
    fileNavigationTreeMap.forEach((v, k) => {
        if (k === fileTreeData.path) return;
        const path = k.slice(0, k.lastIndexOf("/")) || "/"
        const parentNode = fileNavigationTreeMap.get(path)
        parentNode && (parentNode.children ? parentNode.children.push(v) : parentNode.children = [v])
    })

    useEffect(() => {
        setSkeletonLoading(true)
        getRemoteFiles(rootPath).then(dataList => {
            console.log(dataList)
            setFileTreeData({...rootNode, children: dataList})
        }).finally(() => {
            setSkeletonLoading(false)
        })
    }, [])

    return (
        <MoveModal {...props.modal} width={props.width || 1000} height={props.height}
                   title={props.title || "文件管理器"}>
            <div className="file-manager">
                <Layout>
                    <Layout.Sider className="file-manager-tree">
                        <Skeleton loading={skeletonLoading} paragraph={{rows: 12, width: randomArr(12, 80, 100)}}
                                  style={{width: "95%"}} active>
                            <DirectoryTree loadData={({key, children}) => {
                                return new Promise<void>((resolve, reject) => {
                                    if (children?.length) return resolve()
                                    const path = key as string
                                    setAsyncLoadData({
                                        path, promise: new Promise((rs, rt) => {
                                            getRemoteFiles(path).then(dataList => {
                                                setFileTreeData(treeData => addFileTreeNode(treeData, path, dataList))
                                                resolve()
                                                rs(path)
                                            }).catch(reason => {
                                                reject(reason)
                                                rt(reason)
                                            }).finally(() => {
                                                setAsyncLoadData(null)
                                            })
                                        })
                                    })
                                })
                            }} onSelect={(keys, e) => {
                                if (e.nativeEvent.detail === 2) {
                                    if (listLoading) return;
                                    setCurrentPath(e.node.key as string)
                                }
                            }} treeData={fileNavigationTree?.children}/>
                        </Skeleton>
                    </Layout.Sider>
                    <Layout className="file-manager-content" style={{cursor: listLoading ? "wait" : "auto"}}>
                        <Skeleton style={{padding: "0 20px", marginTop: "10px"}} loading={skeletonLoading}
                                  paragraph={{rows: 12, width: randomArr(12, 80, 100)}} active>
                            <Layout.Header>
                                <Row justify="space-around" align="middle" className="file-manager-content-path">
                                    <Col span={23}>
                                        <Breadcrumb items={pathNavigationData.map((v, k) => {
                                            if (k === (pathNavigationData.length - 1)) {
                                                return {
                                                    title: <div
                                                        className="file-manager-content-path-item">{v.name}</div>
                                                }
                                            }

                                            return {
                                                title: <div onClick={() => {
                                                    if (listLoading) return;
                                                    setCurrentPath(v.path)
                                                }} className="file-manager-content-path-item link">{v.name}</div>
                                            }
                                        })}/>
                                    </Col>
                                    <Col span={1}>
                                        <div className={`file-manager-content-reload ${listLoading ? "" : "hover"}`}>
                                            <SyncOutlined style={{cursor: listLoading ? "wait" : "pointer"}}
                                                          spin={listLoading}
                                                          onClick={() => {
                                                              if (listLoading) return;
                                                              setListLoading(true)
                                                              getRemoteFiles(currentPath).then(dataList => {
                                                                  setFileTreeData(treeData => addFileTreeNode(treeData, currentPath, dataList))
                                                              }).finally(() => {
                                                                  setListLoading(false)
                                                              })
                                                          }} rotate={-90}/>
                                        </div>
                                    </Col>
                                </Row>
                            </Layout.Header>
                            <Layout.Content onScroll={(e) => {
                                if (listLoading) return;
                                if (parseInt(String(e.currentTarget.scrollHeight - e.currentTarget.scrollTop)) === e.currentTarget.clientHeight) {
                                    setListLoading(true)
                                    getRemoteFiles(currentPath, fileListData.length).then(dataList => {
                                        setFileTreeData(treeData => addFileTreeNode(treeData, currentPath, dataList, false))
                                    }).finally(() => {
                                        setListLoading(false)
                                    })
                                }
                            }}>
                                {
                                    fileListData.length
                                        ? <div className="file-manager-list">
                                            <List dataSource={fileListData} grid={{gutter: 10, column: 6}}
                                                  renderItem={(v) => (
                                                      <List.Item>
                                                          <div title={
                                                              v.isFile
                                                                  ? `创建日期：${new Date(v.createTime).toLocaleString()}\n最后修改时间：${new Date(v.lastModifyTime).toLocaleString()}\n大小: ${(v.size / 1024 / 1024).toFixed(2)}MB`
                                                                  : `创建日期：${new Date(v.createTime).toLocaleString()}\n最后修改时间：${new Date(v.lastModifyTime).toLocaleString()}\n大小: ${(v.size / 1024 / 1024).toFixed(2)}MB\n文件：${v.children.join(",")}`
                                                          } onClick={(event) => {
                                                              const elements = document.querySelectorAll(".file-manager-list-item-active")
                                                              elements.forEach((v) => {
                                                                  if (v !== event.currentTarget) {
                                                                      v.className = event.currentTarget.className.replaceAll("file-manager-list-item-active", "")
                                                                  }
                                                              })

                                                              event.currentTarget.className = `${event.currentTarget.className} file-manager-list-item-active`

                                                              if (event.detail === 2) {
                                                                  if (listLoading || v.isFile) return;
                                                                  setCurrentPath(v.path)
                                                                  if (!v.isLeaf && !v.children.length) {
                                                                      setListLoading(true)
                                                                      if (asyncLoadData && asyncLoadData.path === v.path) {
                                                                          asyncLoadData.promise.finally(() => {
                                                                              setListLoading(false)
                                                                          })
                                                                          return;
                                                                      }

                                                                      getRemoteFiles(v.path).then(dataList => {
                                                                          setFileTreeData(treeData => addFileTreeNode(treeData, v.path, dataList))
                                                                      }).finally(() => {
                                                                          setListLoading(false)
                                                                      })
                                                                      return;
                                                                  }
                                                              }

                                                          }} className="file-manager-list-item">
                                                              <div className="file-manager-list-item-icon">
                                                                  {
                                                                      v.isFile ? <FileType file={v}/> :
                                                                          <img src={file_manager} alt=""/>
                                                                  }
                                                              </div>
                                                              <p className="file-manager-list-item-title">{v.name}</p>
                                                          </div>
                                                      </List.Item>
                                                  )}>
                                            </List>
                                        </div>
                                        : <Row style={{height: "100%"}} justify="space-around" align="middle">
                                            {
                                                listLoading ? <LoadingOutlined style={{fontSize: 50, color: "#282c34"}}/> :
                                                    <Empty/>
                                            }
                                        </Row>
                                }
                            </Layout.Content>
                        </Skeleton>
                    </Layout>
                </Layout>
            </div>
        </MoveModal>
    )
}