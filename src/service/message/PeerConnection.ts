import Client from "./Client";
import {PeerConnectionEventMap} from "./PeerConnectionEventMap";
import {MessageEvent} from "./ClientEventMap";

export type CandidateSignaling = {
    sdpMid: string
    sdpMLineIndex: number
    sdp: string
}

export type ConnType = "camera" | "screen"
export type SignalingType =
    "signaling@cameraOffer"
    | "signaling@offer"
    | "signaling@candidate"
    | "signaling@answer"
    | "signaling@closeCamera"
    | "signaling@screenOffer"
export type SignalingContent = {
    msgType: SignalingType
    msgId: string
    payload: any
}

export default class PeerConnection extends EventTarget {
    /** 初始化属性 **/
    private connection: RTCPeerConnection
    private signalingId = window.crypto.randomUUID()
    private connectProcess = ""
    private connectionTimeoutHandler?: NodeJS.Timeout

    addEventListener<K extends keyof PeerConnectionEventMap>(type: K, listener: (this: PeerConnection, ev: PeerConnectionEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void {
        super.addEventListener(type, listener as EventListenerOrEventListenerObject, options)
    }

    removeEventListener<K extends keyof PeerConnectionEventMap>(type: K, listener: (this: PeerConnection, ev: PeerConnectionEventMap[K]) => any, options?: boolean | EventListenerOptions): void {
        super.removeEventListener(type, listener as EventListenerOrEventListenerObject, options)
    }

    /**
     * 构造方法
     * @param clientId 要与目标建立的对等连接的客户端id
     * @param signalingClient 信令客户端
     * @param iceServers 候选服务器地址列表
     */
    constructor(private clientId: string, private signalingClient: Client, iceServers: RTCIceServer[] = []) {
        super();
        iceServers = iceServers.length ? iceServers : [{urls: 'stun:stun.l.google.com:19302'}]
        const configuration = {iceServers};
        this.connection = new RTCPeerConnection(configuration)

        this.connection.addEventListener("connectionstatechange", this.connectionStateChangeHandle)
        this.connection.addEventListener("icecandidate", this.iceCandidateHandle)

        this.connection.addEventListener("iceconnectionstatechange", (ev) => {
            this.connectProcess += ` [iceStateChange: ${this.connection.iceConnectionState}] ->`
        })

        this.connection.addEventListener("signalingstatechange", (ev) => {
            this.connectProcess += ` [signalingStateChange: ${this.connection.signalingState}] ->`
        })

        this.connection.addEventListener("icegatheringstatechange", (ev) => {
            this.connectProcess += ` [iceGatherStateChange: ${this.connection.iceGatheringState}] ->`
        })

        this.connection.addEventListener("track", (ev) => {
            this.dispatchEvent(new RTCTrackEvent("track", {
                bubbles: ev.bubbles,
                cancelable: ev.cancelable,
                composed: ev.composed,
                receiver: ev.receiver,
                track: ev.track,
                transceiver: ev.transceiver,
                streams: [...ev.streams]
            }))
        })

        // 注册信令消息处理器
        signalingClient.addEventListener("message", this.signalingHandle)
    }

    /**
     * 开始连接
     * @param type
     */
    connect(type: ConnType) {
        const typeMap = new Map<ConnType, SignalingType>([
            ["camera", "signaling@cameraOffer"],
            ["screen", "signaling@screenOffer"],
        ])

        this.connectionTimeoutHandler = setTimeout(() => {
            this.connection.close()
            console.error("webrtc connection timeout in", this.connectProcess)
        }, 10000)

        this.signalingClient.send({
            msgType: typeMap.get(type), payload: "", msgId: this.signalingId
        } as SignalingContent, {names: [this.clientId]})

        this.connectProcess += `[Send ${type} offer] ->`
    }

    /**
     * 关闭连接
     */
    close() {
        this.connection.close()
        this.signalingClient.send({
            msgType: "signaling@closeCamera",
            payload: "",
            msgId: this.signalingId
        } as SignalingContent, {names: [this.clientId]})
    }

    /**
     * 连接状态更改处理
     * @private
     */
    private connectionStateChangeHandle = () => {
        this.connectProcess += ` [connectionStateChange: ${this.connection.connectionState}] ->`
        switch (this.connection.connectionState) {
            case "connected":
                this.connectionTimeoutHandler && clearTimeout(this.connectionTimeoutHandler)
                console.log('\x1b[32m%s\x1b[0m', `webrtc 连接成功 ${this.connectProcess}`)
                this.connectProcess = ""
                this.dispatchEvent(new Event("open"))
                break
            case "failed":
                this.signalingClient.removeEventListener("message", this.signalingHandle)
                this.connectionTimeoutHandler && clearTimeout(this.connectionTimeoutHandler)
                console.log('\x1b[31m%s\x1b[0m', `webrtc 连接失败 ${this.connectProcess}`)
                this.dispatchEvent(new Event("failure"))
                break
            case "disconnected":
            case "closed":
                this.signalingClient.removeEventListener("message", this.signalingHandle)
                this.connectionTimeoutHandler && clearTimeout(this.connectionTimeoutHandler)
                console.log('\x1b[33m%s\x1b[0m', `webrtc 连接关闭`)
                this.dispatchEvent(new Event("close"))
                break
        }
    }

    private iceCandidateHandle = (event: RTCPeerConnectionIceEvent) => {
        this.connectProcess += ` [gather icecandidate] ->`
        if (!event.candidate) return;
        this.signalingClient.send({
            msgType: "signaling@candidate",
            msgId: this.signalingId,
            payload: {
                sdpMid: event.candidate.sdpMid || "",
                sdpMLineIndex: event.candidate.sdpMLineIndex || 0,
                sdp: event.candidate.candidate
            } as CandidateSignaling
        } as SignalingContent, {names: [this.clientId]})
    }

    /**
     * 信令消息处理
     * @param ev
     * @private
     */
    private signalingHandle = (ev: MessageEvent) => {
        const signalingContent: SignalingContent = JSON.parse(ev.message.content)

        // 只处理信令id一致的消息
        if (signalingContent.msgId !== this.signalingId) return

        // 信令消息类型处理
        switch (signalingContent.msgType) {
            // 候选服务器信令消息处理
            case "signaling@candidate":
                this.connectProcess += ` [Receive candidate] ->`
                const candidateSignaling: CandidateSignaling = signalingContent.payload

                // 添加候选服务器
                this.connection.addIceCandidate({
                    sdpMid: candidateSignaling.sdpMid,
                    sdpMLineIndex: candidateSignaling.sdpMLineIndex,
                    candidate: candidateSignaling.sdp,
                }).then(() => {
                    this.connectProcess += ` [addIceCandidate] ->`
                }).catch(reason => console.error("webrtc add ice candidate fail: ", reason))
                break

            // 邀约信令消息处理
            case "signaling@offer":
                this.connectProcess += ` [Receive offer] ->`

                // 保存远程邀约信息
                this.connection.setRemoteDescription({type: "offer", sdp: signalingContent.payload})
                    .then(() => {
                        this.connectProcess += ` [Set remoteOffer] ->`

                        // 创建本次邀约的应答
                        return this.connection.createAnswer()
                    })
                    .then(des => {
                        this.connectProcess += ` [Create answer] ->`
                        // 保存应答信息

                        return this.connection.setLocalDescription(des)
                    })
                    .then(() => {
                        this.connectProcess += ` [Set answer] ->`

                        // 发送应答信令消息
                        this.signalingClient.send({
                            msgType: "signaling@answer",
                            payload: this.connection.localDescription?.sdp || "",
                            msgId: this.signalingId
                        } as SignalingContent, {names: [this.clientId]})

                        this.connectProcess += ` [Send answer] ->`
                    }).catch(reason => {
                    console.error("webrtc set sdp fail: ", reason)
                })
                break

            // 应答信令消息处理
            case "signaling@answer":
                this.connectProcess += ` [Receive answer] ->`

                // 保存远程应答信息
                this.connection.setRemoteDescription({type: "answer", sdp: signalingContent.payload})
                    .then(() => {
                        this.connectProcess += ` [Set remoteAnswer] ->`
                    })
                    .catch(reason => console.error("webrtc set answer fail: ", reason))
                break
        }
    }
}