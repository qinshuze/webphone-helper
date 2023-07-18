import React, {useEffect, useState} from "react";
import './index.css'
import {QRCode, Row} from "antd";
import {getAuthToken, getQRCode} from "../../service/login";
import {useDeviceId, useUserId, useUserToken} from "../../hook/User";
import {useNavigate} from "react-router-dom";
import {Path} from "../../config/routes";
import logo from "../../assets/icon/photo.png";

type SetStateAction<T> = React.Dispatch<React.SetStateAction<T>>
type QrState = "not" | "used" | "complete" | "expired"

function checkAndUpdateQROpState(uuid: string, setState: SetStateAction<QrState>, setUserId: SetStateAction<string>, setDeviceId: SetStateAction<string>) {
    let cumulativeTime = 0
    let currentTime = 0
    const interval = 2000, expireTime = 60000, timeout = 60000
    const expires = parseInt(String((new Date().getTime() + expireTime) / 1000))

    // 每2秒检查二维码状态
    const si = setInterval(async () => {
        // 二维码过期检测
        cumulativeTime += interval
        if (cumulativeTime >= expireTime || currentTime >= timeout) {
            clearInterval(si)
            setState("expired")
            return
        }

        // 请求接口获取二维码状态
        getQRCode(uuid, expires).then(r => {
            switch (r.data.status) {
                case "used": // 已使用（二维码被扫描），更新二维码状态
                    cumulativeTime = 0
                    currentTime += interval
                    setState("used")
                    break
                case "complete":
                    clearInterval(si)
                    setState("complete")
                    setUserId(uuid)
                    setDeviceId(r.data.device_id)
                    break
            }
        }).catch(() => {
            clearInterval(si)
        })
    }, interval)

    return () => clearInterval(si)
}

export default function Login() {
    const [qrId, setQRId] = useState(crypto.randomUUID().toString())
    const [qrStatus, setQrState] = useState<QrState>("not")
    const [, setUserId] = useUserId()
    const [, setDeviceId] = useDeviceId()
    const [token, setToken] = useUserToken()
    const navigate = useNavigate()
    const qrStateMap: Map<QrState, "expired" | "loading" | "active"> = new Map([
        ["expired", "expired"],
        ["not", "active"],
        ["used", "loading"],
        ["complete", "active"],
    ])

    // 判断是否已经登陆，如果已登陆则跳转到首页
    useEffect(() => {
        if (token) navigate(Path.HOME)
    }, [token, navigate])

    // 实时检测二维码状态
    useEffect(() => checkAndUpdateQROpState(qrId, setQrState, setUserId, setDeviceId), [qrId, setQrState, setUserId, setDeviceId])

    // 当二维码状态变更为完成时，请求获取授权令牌并保存
    useEffect(() => {
        if (qrStatus !== "complete") return;
        getAuthToken().then(r => {
            setToken(r.data.token)
            navigate(Path.HOME)
        })
    }, [qrStatus, navigate, setToken])

    return (
        <Row className="QRCode" justify="space-around" align="middle">
            <QRCode
                // 点击刷新二维码
                onRefresh={() => {
                    setQRId(crypto.randomUUID().toString())
                    setQrState("not")
                }}
                status={qrStateMap.get(qrStatus)}
                size={250}
                errorLevel="H"
                value={`${process.env.REACT_APP_ADMIN_API_URL}/qrcode?id=${qrId}`}
                icon={logo}
                iconSize={80}
            />
        </Row>
    )
}
