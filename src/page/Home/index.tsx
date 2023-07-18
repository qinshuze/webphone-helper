import logo from "../../logo.svg";
import gallery from "../../assets/icon/gallery.png";
import camera from "../../assets/icon/camera.png";
import browser from "../../assets/icon/browser.png";
import sms from "../../assets/icon/sms.png";
import back from "../../assets/icon/R1.png";
import file_manager from "../../assets/icon/file_manager.png";
import React, {useEffect, useRef, useState} from "react";
import './index.css';
import {useDeviceId, useDeviceRTCState, useDeviceSocketState, useUserId, useUserToken} from "../../hook/User";
import {Modal, Row} from "antd";
import FileManager from "../../component/FileManager";
import MoveModal from "../../component/MoveModal";
import Client, {MessageContent} from "../../service/message/Client";
import Camera from "../../component/Camera";
import {getUuid} from "../../utils";
import {PoweroffOutlined} from "@ant-design/icons";

type ReceiveMessage = {
    type: "relay" | "join" | "leave" | "disconnected"
    content: string
    sender: string
}

type SendMessage = {
    roomIds?: string[]
    names?: string[]
    tags?: string[]
    content: string
}

type SendContent = {
    msgType: "base@heartbeat" | "signaling@offer" | "signaling@candidate" | "signaling@cameraOffer" | "signaling@answer" | "signaling@closeCamera"
    payload: any
    msgId: string
}

type ReceiveContent = {
    msgType: "base@heartbeatAnswer" | "logout" | "signaling@answer" | "signaling@candidate" | "signaling@cameraAnswer" | "signaling@offer"
    payload: any
    msgId: string
}

let ws: WebSocket | null = null
let msgClient: Client | null = null
let peerConnection: RTCPeerConnection | null = null
let dataChannel: RTCDataChannel | null = null
let webRTCError = ""

type CandidateSdp = {
    sdpMid: string,
    sdpMLineIndex: number,
    sdp: string
}

type CameraState = "open" | "close" | "connecting" | "failure"

function makePeerConn(deviceId: string, ws: WebSocket, options: {
    onOpen?: (conn: RTCPeerConnection) => any,
    onFailure?: (reason: string) => any,
    onClose?: (conn: RTCPeerConnection) => any,
    onProgress?: (progress: number) => any,
} = {}) {
    const signalingId = getUuid()
    const configuration = {iceServers: [{urls: 'stun:stun.l.google.com:19302'}]};
    const peerConnection = new RTCPeerConnection(configuration)

    let timeout: NodeJS.Timeout|null = null
    let step = ""

    const messageCallback = (ev: MessageEvent) => {
        const receiveMessage: ReceiveMessage = JSON.parse(ev.data)
        const receiveContent: ReceiveContent = JSON.parse(receiveMessage.content)

        if (receiveContent.msgId !== signalingId) return
        switch (receiveContent.msgType) {
            case "signaling@candidate":
                step += ` [Receive candidate] ->`
                const candidateData: CandidateSdp = receiveContent.payload
                peerConnection.addIceCandidate({
                    sdpMid: candidateData.sdpMid,
                    sdpMLineIndex: candidateData.sdpMLineIndex,
                    candidate: candidateData.sdp,
                }).then(() => {
                    step += ` [addIceCandidate] ->`
                }).catch(reason => console.error("webrtc add ice candidate fail: ", reason))
                break
            case "signaling@offer":
                step += ` [Receive offer] ->`
                peerConnection.setRemoteDescription({type: "offer", sdp: receiveContent.payload})
                    .then(() => {
                        step += ` [Set remoteOffer] ->`
                        return peerConnection.createAnswer()
                    })
                    .then(des => {
                        step += ` [Create answer] ->`
                        return peerConnection.setLocalDescription(des)
                    })
                    .then(() => {
                        step += ` [Set answer] ->`
                        const sendContent: SendContent = {
                            msgType: "signaling@answer",
                            payload: peerConnection.localDescription?.sdp || "",
                            msgId: signalingId
                        }
                        const sendMessage: SendMessage = {names: [deviceId], content: JSON.stringify(sendContent)}
                        ws.send(JSON.stringify(sendMessage))
                        step += ` [Send answer] ->`
                    }).catch(reason => {console.error("webrtc set sdp fail: ", reason)})
                break
            case "signaling@answer":
                step += ` [Receive answer] ->`
                peerConnection.setRemoteDescription({type: "answer", sdp: receiveContent.payload})
                    .then(() => {
                        step += ` [Set remoteAnswer] ->`
                    })
                    .catch(reason => console.error("webrtc set answer fail"))
                break
        }
    }

    peerConnection.addEventListener("connectionstatechange", (ev) => {
        step += ` [connectionStateChange: ${peerConnection.connectionState}] ->`
        console.log(peerConnection.connectionState)
        switch (peerConnection.connectionState) {
            case "connected":
                timeout && clearTimeout(timeout)
                options.onOpen?.(peerConnection)
                console.log('\x1b[32m%s\x1b[0m', `webrtc 连接成功 ${step}`, options)
                step = ""
                break
            case "failed":
                ws.removeEventListener("message", messageCallback)
                options.onFailure?.(`webrtc connection fail: in ${step}`)
                timeout && clearTimeout(timeout)
                console.log('\x1b[31m%s\x1b[0m', `webrtc 连接失败 ${step}`)
                break
            case "disconnected":
            case "closed":
                ws.removeEventListener("message", messageCallback)
                options.onClose?.(peerConnection)
                timeout && clearTimeout(timeout)
                console.log('\x1b[33m%s\x1b[0m', `webrtc 连接关闭`)
                break
        }
    })

    peerConnection.addEventListener("iceconnectionstatechange", (ev) => {
        step += ` [iceStateChange: ${peerConnection.iceConnectionState}] ->`
    })

    peerConnection.addEventListener("signalingstatechange", (ev) => {
        step += ` [signalingStateChange: ${peerConnection.signalingState}] ->`
    })

    peerConnection.addEventListener("icegatheringstatechange", (ev) => {
        step += ` [iceGatherStateChange: ${peerConnection.iceGatheringState}] ->`
    })

    peerConnection.addEventListener("icecandidate", (event) => {
        step += ` [gather icecandidate] ->`

        if (!event.candidate) return;
        const candidate: CandidateSdp = {
            sdpMid: event.candidate.sdpMid || "",
            sdpMLineIndex: event.candidate.sdpMLineIndex || 0,
            sdp: event.candidate.candidate
        }
        const sendContent: SendContent = {msgType: "signaling@candidate", payload: candidate, msgId: signalingId}
        const sendMessage: SendMessage = {names: [deviceId], content: JSON.stringify(sendContent)}
        ws.send(JSON.stringify(sendMessage))
    })

    ws.addEventListener("message", messageCallback)

    const typeMap = new Map<string, any>([
        ["camera", "signaling@cameraOffer"],
        ["screen", "signaling@screenOffer"],
    ])

    return {
        peerConnection,
        open: (type: "camera"|"screen") => {
            timeout = setTimeout(() => {
                peerConnection.close()
                options.onFailure?.(`webrtc connection fail: timeout in ${step}`)
                console.error("webrtc connection timeout in", step)
            }, 10000)

            const sendContent: SendContent = {msgType: typeMap.get(type), payload: "", msgId: signalingId}
            const sendMessage: SendMessage = {names: [deviceId], content: JSON.stringify(sendContent)}
            ws.send(JSON.stringify(sendMessage))
            step += `[Send ${type} offer] ->`
        },
        close: () => {
            peerConnection.close()
            const sendContent: SendContent = {
                msgType: "signaling@closeCamera",
                payload: "",
                msgId: signalingId
            }
            const sendMessage: SendMessage = {names: [deviceId], content: JSON.stringify(sendContent)}
            ws.send(JSON.stringify(sendMessage))
        }
    }
}

let isOpenCamera = false
export default function Home() {
    const [token, setToken] = useUserToken()
    const [userId, setUserId] = useUserId()
    const [deviceId, setDeviceId] = useDeviceId()
    const [cameraStatus, setCameraState] = useState<CameraState>("connecting")
    const [deviceSocketState, setDeviceSocketState] = useDeviceSocketState()
    const [moveModals, setMoveModals] = useState<React.ReactNode[]>([])
    const [networkDelay, setNetworkDelay] = useState(0)
    const cameraRef = useRef<any>()

    const addMoveModal = (moveModal: React.ReactElement) => {
        setMoveModals([...moveModals, moveModal])
    }

    const initRef = useRef(false)
    useEffect(() => {
        if (initRef.current) return;
        initRef.current = true
        if (!token) return;

        let networkDelays: number[] = []
        setInterval(() => {
            if (networkDelays.length) {
                const n = networkDelays.reduce((a, b) => a + b, 0) / networkDelays.length
                setNetworkDelay(parseInt(String(n)))
            }
        }, 5000)

        const getNetworkStateManager = () => {
            let closed = false
            const getNetworkDelay = () => {
                msgClient?.getNetworkDelay(deviceId).then(delay => {
                    if (closed) return;
                    setDeviceSocketState("online")
                    if (networkDelays.length > 5) networkDelays.shift()
                    networkDelays.push(delay)
                    setTimeout(() => getNetworkDelay(), 1000)
                }).catch(reason => {
                    setDeviceSocketState("offline")
                    console.log(reason)
                })
            }

            return {
                start: () => {
                    closed = false
                    getNetworkDelay()
                },
                stop: () => {
                    closed = true
                }
            }
        }

        let networkStateManager = getNetworkStateManager()
        const accessKey = process.env.REACT_APP_MSG_PUSH_ACCESS_KEY || ""
        const wsUrl = process.env.REACT_APP_MSG_PUSH_URL || ""

        msgClient = new Client(`${wsUrl}?token=${token}&name=${userId}&room_ids=${deviceId}&realm=${accessKey}`)
        msgClient.addEventListener("open", () => {
            networkStateManager.start()
        })

        msgClient.addEventListener("close", (ev) => {
            networkStateManager.stop()
            switch (ev.code) {
                case 3001:
                    Modal.warning({
                        title: "会话过期",
                        content: <div>当前会话已失效，请重新登陆</div>,
                        onOk: () => {
                            setToken("")
                            setUserId("")
                            setDeviceId("")
                            window.location.replace("/login")
                        }
                    })
                    break
                default:
                    Modal.warning({
                        title: "会话已关闭",
                        content: <div>会话意外中断，请刷新页面进行重试。点击确认按钮刷新页面</div>,
                        onOk: () => {
                            window.location.reload()
                        }
                    })
            }
        })

        msgClient.addEventListener("message", (ev) => {
            const message = ev.message
            if (message.sender !== deviceId) return;
            switch (message.type) {
                case "leave":
                    setDeviceSocketState("offline")
                    setNetworkDelay(0)
                    networkStateManager.stop()
                    break
                case "join":
                    setDeviceSocketState("online")
                    setNetworkDelay(0)
                    networkStateManager.start()
                    break
            }

            const messageContent: MessageContent = JSON.parse(message.content)
            switch (messageContent.msgType) {
                case "logout":
                    Modal.warning({
                        title: "会话过期",
                        content: <div>终端设备已退出，会话结束</div>,
                        onOk: () => {
                            setToken("")
                            setUserId("")
                            setDeviceId("")
                            window.location.replace("/login")
                        }
                    })
                    break
            }
        })
    }, [])

    return (
        <div style={{backgroundImage: `url(${back})`, backgroundColor: "#282c34", backgroundSize: "100% 100%", backgroundAttachment: "fixed"}} className="App">
            {moveModals}
            <div style={{position: "absolute", height: "100%"}}>
                <Row style={{minHeight: "100vh"}} justify="space-around" align="middle">
                    <div className="left-navigation">
                        <div onClick={() => {
                            if (deviceSocketState !== "online") {
                                Modal.warning({
                                    title: "状态异常",
                                    content: <div>终端设备不在线</div>,
                                    onOk: () => {}
                                })
                                return;
                            }

                            addMoveModal(<FileManager key={getUuid()}/>)
                        }}
                             className="left-navigation-item">
                            <img title="文件管理器" className="left-navigation-icon" src={file_manager} alt=""/>
                        </div>
                        <div onClick={() => {
                            let cameraPeerConn: { open: any; peerConnection: RTCPeerConnection; close: any; } | null = null

                            const d = document.querySelector(".camera-video-source")
                            if (d) {
                                // @ts-ignore
                                d.click()
                                return;
                            }

                            if (deviceSocketState !== "online") {
                                Modal.warning({
                                    title: "状态异常",
                                    content: <div>终端设备不在线</div>,
                                    onOk: () => {}
                                })
                                return;
                            }

                            if (!msgClient) {
                                Modal.warning({
                                    title: "状态异常",
                                    content: <div>网络通信异常：连接未打开</div>,
                                    onOk: () => {}
                                })
                                return;
                            }

                            isOpenCamera = true
                            addMoveModal(<Camera className="camera-video-source" modal={{
                                onCancel: () => isOpenCamera = false
                            }} key={getUuid()} msgClient={msgClient} deviceId={deviceId} />)

                            return

                            const PlayVideo = (props: { open: boolean }) => {
                                const videoRef = useRef<HTMLVideoElement>(null)
                                useEffect(() => {
                                    if (!videoRef.current || !ws) return
                                    cameraPeerConn = makePeerConn(deviceId, ws, {
                                        onOpen: () => {
                                            setCameraState("open")
                                        },
                                        onFailure: () => {
                                            setCameraState("failure")
                                        },
                                        onClose: () => {
                                            setCameraState("close")
                                        }
                                    })

                                    cameraPeerConn.open("camera")
                                    cameraPeerConn.peerConnection.ontrack = (ev) => {
                                        console.log(ev, videoRef)
                                        if (ev.track.kind !== "video") return;
                                        const video = document.getElementById("video") as HTMLVideoElement
                                        video.srcObject = ev.streams[0]
                                        video.play()

                                        if (!videoRef.current) return;
                                        videoRef.current.srcObject = ev.streams[0]
                                        videoRef.current.play()
                                    }

                                }, [])
                                console.log(props.open)
                                return <video muted controls ref={videoRef} style={{display: props.open ? "inherit" : "none"}}></video>
                            }

                            addMoveModal(<MoveModal onCancel={() => {
                                cameraPeerConn?.close()
                            }} title="相机" key={getUuid()}>
                                <div id="id" style={{
                                    width: 300,
                                    height: 500,
                                    textAlign: "center",
                                    lineHeight: "500px",
                                }}>
                                    <PlayVideo open={cameraStatus === "open"}/>
                                    {cameraStatus === "connecting" ?
                                        <span style={{color: "rgba(213,132,132,0.88)"}}>正在打开相机...</span> : ""}
                                    {cameraStatus === "failure" ? <span style={{color: "red"}}>相机打开失败</span> : ""}
                                </div>
                            </MoveModal>)
                        }
                        } className="left-navigation-item">
                            <img title="相机" className="left-navigation-icon" src={camera} alt=""/>
                        </div>
                        <div onClick={() => {
                            Modal.warning({
                                title: "功能未开放",
                                content: <div>此功能正在开发中</div>,
                                onOk: () => {}
                            })
                        }} className="left-navigation-item">
                            <img title="图库" className="left-navigation-icon" src={gallery} alt=""/>
                        </div>
                        <div onClick={() => {
                            Modal.warning({
                                title: "功能未开放",
                                content: <div>此功能正在开发中</div>,
                                onOk: () => {}
                            })
                        }} className="left-navigation-item"><img title="屏幕共享" className="left-navigation-icon" src={browser}
                                                                   alt=""/></div>
                        <div onClick={() => {
                            Modal.warning({
                                title: "功能未开放",
                                content: <div>此功能正在开发中</div>,
                                onOk: () => {}
                            })
                        }} className="left-navigation-item"><img title="短信" className="left-navigation-icon" src={sms} alt=""/>
                        </div>
                    </div>
                </Row>
            </div>
            <div style={{
                position: "absolute",
                width: "300px",
                left: "calc(50% - 160px)",
                padding: "10px",
                border: "1px solid #1d2026",
                background: "#1d2026",
                borderRadius: "10px",
                top: "20px",
                color: "#989898",
            }}>
                <span style={{marginRight: 10}}>设备状态:</span>
                {
                    deviceSocketState === "connecting"
                        ? <span style={{color: "rgba(213, 132, 132, 0.88)"}}>连接中...</span>
                        : deviceSocketState === "online"
                            ? <span style={{color: "green"}}>在线</span>
                            : <span style={{color: "red"}}>离线</span>
                }
                <span style={{marginLeft: 20, marginRight: 10}}>网络延迟:</span>
                <div style={{display: "inline-block", width: 65}}>
                    {
                        networkDelay === 0
                            ? <span>--</span>
                            : networkDelay < 200
                                ? <span style={{color: "green"}}>{networkDelay}ms</span>
                                : networkDelay < 500
                                    ? <span style={{color: "yellow"}}>{networkDelay}ms</span>
                                    : <span style={{color: "red"}}>{networkDelay}ms</span>
                    }
                </div>

                <span title="退出登录" onClick={() => {
                    msgClient?.send({msgType: "logout"} as MessageContent, {names: [deviceId]})
                    setTimeout(() => {
                        setToken("")
                        setUserId("")
                        setDeviceId("")
                        window.location.replace("/login")
                    }, 100)
                }} className="power" style={{padding: "2px 5px", borderRadius: 4}}><PoweroffOutlined /></span>
                {/*<span style={{marginLeft: 20, marginRight: 10}}>隧道状态:</span>*/}
                {/*{*/}
                {/*    deviceSocketState !== "online" ? <span>--</span> :*/}
                {/*        deviceRTCState === "connecting"*/}
                {/*            ? <span style={{color: "rgba(213, 132, 132, 0.88)"}}>连接中...</span>*/}
                {/*            : deviceRTCState === "online"*/}
                {/*                ? <span style={{color: "green"}}>已连接</span>*/}
                {/*                : <span title={webRTCError} style={{color: "red"}}>连接失败</span>*/}
                {/*}*/}
            </div>
            <header className="App-header">
                <img src={logo} className="App-logo" alt="logo"/>
                <p>
                    Edit <code>src/App.tsx</code> and save to reload.
                </p>
                <a
                    className="App-link"
                    href="https://reactjs.org"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Learn React
                </a>
            </header>
        </div>
    )
}