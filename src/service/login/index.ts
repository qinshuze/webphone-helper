import {enc, HmacSHA512} from "crypto-js";
import MsgPushRequest from "../../utils/request/msg";
import AdminRequest from "../../utils/request/admin";

/**
 * 获取二维码状态
 * @param id 二维码id
 * @param expires 过期时间
 */
export function getQRCode(id: string, expires: number) {
    return AdminRequest.get<API.QRCode>(`/qrcode?id=${id}&expires=${expires}`)
}

/**
 * 获取授权令牌
 */
export async function getAuthToken() {
    const accessKey = process.env.REACT_APP_MSG_PUSH_ACCESS_KEY || ""
    const secret = process.env.REACT_APP_MSG_PUSH_ACCESS_SECRET || ""

    const params = new URLSearchParams({
        access_key: accessKey,
        timestamp: parseInt(String(new Date().getTime() / 1000)) + "",
    })

    params.sort()
    const url = `${new URL(process.env.REACT_APP_MSG_PUSH_API_URL || "").host}/token` || ""
    const signStr = `GET ${url}?${params.toString()}`
    const hash = HmacSHA512(signStr, secret)
    const signature = window.btoa(enc.Base64.stringify(hash))

    params.set("signature", signature)
    return MsgPushRequest.get<{ token: string }>(`/token?${params.toString()}`)
}