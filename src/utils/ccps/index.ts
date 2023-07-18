import axios, {AxiosResponse} from "axios";

type Options = {
    tags?: string[]
    roomIds?: string[]
}

export class Client {
    public static readonly WAIT: number = 0
    public static readonly CONNECTING: number = 1
    public static readonly OPEN: number = 2
    public static readonly CLOSED: number = 3
    public static readonly AUTH: number = 3

    readonly token: string = ""
    readonly realm: string = ""
    readonly name: string = ""
    readonly tags: string[] = []
    readonly roomIds: string[] = []
    private conn?: WebSocket
    private status: number = 0

    constructor(accessKey: string, token: string, name: string, options: Options) {
        this.token = token
        this.name = name
        this.realm = accessKey
        options.tags && (this.tags = options.tags)
        options.roomIds && (this.roomIds = options.roomIds)
    }

    onError() {

    }

    connect() {
        return new Promise((resolve, reject: (reason: string) => void) => {
            this.authToken().catch(reason => {
                reject(reason)
            })

            const queryParams = new URLSearchParams()
            queryParams.set("token", this.token)
            queryParams.set("name", this.name)
            queryParams.set("tags", this.tags.join(","))
            queryParams.set("room_id", this.roomIds.join(","))

            this.conn = new WebSocket(`ws://localhost:8001?${queryParams.toString()}`)
            this.conn.onerror = () => {

            }
        })
    }

    private authToken() {
        return new Promise<void>((resolve, reject) => {
            axios.get(`http://localhost:8888/auth/client?token=${this.token}&realm=${this.realm}`)
                .then(r => {
                    resolve()
                })
                .catch((r: AxiosResponse) => {
                    reject(`client auth fail: ${r.data.err_code} ${r.data.err_msg}`)
                })
        })
    }
}