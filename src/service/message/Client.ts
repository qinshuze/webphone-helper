import {ClientEventMap, CloseEvent, ErrorEvent, MessageEvent} from "./ClientEventMap";
import {getUuid} from "../../utils";

export type ReceiveMessage = {
    readonly type: "relay" | "join" | "leave"
    readonly sender: string
    readonly content: string
}

export type SendMessage = {
    names: string[]
    roomIds: string[]
    tags: string[]
    content: string
}

export type SendOptions = {
    names?: string[], roomIds?: string[], tags?: string[]
}

export type MessageContent = {
    msgType?: string
    msgId?: string
    payload: any
}

export type ClientOpenEvent = () => any
export type ClientCloseEvent = (code: number, reason: string) => any
export type ClientMessageEvent = (message: ReceiveMessage) => any
export type ClientErrorEvent = (reason: string) => any

export default class Client extends EventTarget{
    /** 初始化属性 **/
    private websocket?: WebSocket
    private isAuthed = true
    private isConnecting = false
    private isClosed = false

    /** 事件初始化 **/
    // private openEventListeners: Set<ClientOpenEvent> = new Set()
    // private closeEventListeners: Set<ClientCloseEvent> = new Set()
    // private messageEventListeners: Set<ClientMessageEvent> = new Set()
    // private errorEventListeners: Set<ClientErrorEvent> = new Set()

    addEventListener<K extends keyof ClientEventMap>(type: K, listener: (this: Client, ev: ClientEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void {
        super.addEventListener(type, listener as EventListenerOrEventListenerObject, options)
    }

    removeEventListener<K extends keyof ClientEventMap>(type: K, listener: (this: Client, ev: ClientEventMap[K]) => any, options?: boolean | EventListenerOptions): void {
        super.removeEventListener(type, listener as EventListenerOrEventListenerObject, options)
    }

    dispatchEvent(event: Event): boolean {
        return super.dispatchEvent(event)
    }

    constructor(readonly url: string) {
        super();
        this.connect(url)
    }

    /**
     * 开始连接
     * @param url
     * @private
     */
    private connect(url: string) {
        this.isConnecting = true

        this.websocket = new WebSocket(url)
        this.websocket.addEventListener("open", (ev) => {
            setTimeout(() => {
                if (!this.isAuthed) return;
                this.isConnecting = false
                this.dispatchEvent(new Event("open"))
            }, 200)
        })

        this.websocket.addEventListener("error", (ev) => {
            this.dispatchEvent(new ErrorEvent(""))
        })

        this.websocket.addEventListener("close", (ev) => {
            if (ev.code === 3001) this.isAuthed = false
            if (!this.isClosed) setTimeout(() => this.connect(url), 5000)

            if (this.isClosed) {
                this.dispatchEvent(new CloseEvent(ev.code, ev.reason))
            }
        })

        this.websocket.addEventListener("message", (ev) => {
            const receiveMessage: ReceiveMessage = JSON.parse(ev.data)
            this.heartbeatMsgHandle(receiveMessage)
            this.dispatchEvent(new MessageEvent(receiveMessage))
        })
    }

    /**
     * 注册打开回调
     * @param callback
     */
    onOpen(callback: ClientOpenEvent) {
        this.addEventListener("open", callback)
    }

    /**
     * 注册关闭回调
     * @param callback
     */
    onClose(callback: (ev: CloseEvent) => any) {
        this.addEventListener("close", callback)
    }

    /**
     * 注册错误回调
     * @param callback
     */
    onError(callback: (ev: ErrorEvent) => any) {
        this.addEventListener("error", callback)
    }

    /**
     * 注册消息回调
     * @param callback
     */
    onMessage(callback: (ev: MessageEvent) => any) {
        this.addEventListener("message", callback)
    }

    /**
     * 心跳包消息处理
     * @param message
     * @private
     */
    private heartbeatMsgHandle(message: ReceiveMessage) {
        const content = JSON.parse(message.content)
        if (!content) return;
        if (content.msgType !== "base@heartbeat") return;
        this.send({msgType: "base@heartbeatAnswer"}, {
            names: [message.sender]
        })
    }

    /**
     * 发送消息
     * @param content
     * @param options
     */
    send(content: any, options?: SendOptions) {
        if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
            throw Error("message client is not open")
        }

        const sendMessage: SendMessage = {
            content: JSON.stringify(content), ...{
                names: options?.names || [],
                roomIds: options?.roomIds || [],
                tags: options?.tags || [],
            }
        }
        this.websocket?.send(JSON.stringify(sendMessage))
    }

    /**
     * 发送并接收消息
     * @param content
     * @param options
     * @param timeout
     */
    sendAndReceive(content: MessageContent, options?: SendOptions, timeout = 10000) {
        content.msgId = content.msgId || getUuid()
        content.msgType = content.msgType || ""

        return new Promise<ReceiveMessage>((resolve, reject) => {
            const timeoutHandler = setTimeout(() => {
                this.removeEventListener("message", callback)
                reject("network check timeout")
            }, timeout)

            const callback = (ev: MessageEvent) => {
                const sendContent = JSON.parse(ev.message.content)
                if (!sendContent || sendContent.msgId !== content.msgId) return;
                clearTimeout(timeoutHandler)
                this.removeEventListener("message", callback)
                resolve(ev.message)
            }

            this.addEventListener("message", callback)

            this.send(content, options)
        })
    }

    /**
     * 获取与目标客户端之间的延迟
     * @param clientId 目标客户端id，
     * @param timeout 超时时间 ms 默认5秒
     */
    getNetworkDelay(clientId: string, timeout = 5000) {
        return new Promise<number>((resolve, reject) => {

            const startTime = new Date().getTime()
            this.sendAndReceive({
                msgType: "base@heartbeat",
                payload: ""
            }, {names: [clientId]}, timeout).then(() => {
                resolve(parseInt(String(new Date().getTime() - startTime)))
            }).catch(reason => reject(reason))
        })
    }

    close() {
        this.isClosed = true
        this.websocket?.close()
    }
}