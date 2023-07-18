import MoveModal, {MoveModalProps} from "../MoveModal";
import React, {useEffect, useRef, useState} from "react";
import PeerConnection from "../../service/message/PeerConnection";
import Client from "../../service/message/Client";

type CameraProps = {
    msgClient: Client
    modal?: MoveModalProps
    width?: number
    height?: number
    title?: string
    deviceId: string
    className?: string
}

type ConnState = "connecting" | "open" | "failure" | "close"
let peerConnection: PeerConnection|null = null
let divId = "camera-" + window.crypto.randomUUID()
export default function Camera(props: CameraProps) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const [mediaStream, setMediaStream] = useState<MediaStream | null>(null)
    const [connStatus, setConnState] = useState<ConnState>("connecting")

    const modalProps = {...props.modal} || {}
    const old =modalProps.onCancel
    modalProps.onCancel = (event) => {
        peerConnection?.close()
        old?.(event)
    }

    useEffect(() => {
        const [auth, turnUrl] = (process.env.REACT_APP_TURN_URL||"").split("@")
console.log({
    urls: turnUrl || "",
    username: auth?.split(":")[0] || "",
    credential: auth?.split(":")[1] || "",
})
        peerConnection = new PeerConnection(props.deviceId, props.msgClient, [{
            urls: turnUrl || "",
            username: auth?.split(":")[0] || "",
            credential: auth?.split(":")[1] || "",
        }])
        peerConnection.addEventListener("track", (ev) => {
            console.log(ev)
            if (ev.track.kind !== "video") return;

            const video = document.getElementById(divId) as HTMLVideoElement
            video.style.display = "inherit"
            video.srcObject = ev.streams[0]
            video.play()
            // setTimeout(() => {
            //
            //     video.srcObject = ev.streams[0]
            //     video.play()
            // }, 1000)

            // setMediaStream(ev.streams[0])
        })
        peerConnection.addEventListener("open", () => setConnState("open"))
        peerConnection.addEventListener("failure", () => setConnState("failure"))
        peerConnection.addEventListener("close", () => setConnState("close"))
        peerConnection.connect("camera")
    }, [])

    return <MoveModal {...modalProps} width={props.width || 300} height={props.height||500} title={props.title || "相机"}>
        <div className={`camera ${props.className || ""}`} style={{
            width: props.width || 300,
            height: props.height || 500,
            textAlign: "center",
            lineHeight: "500px",
        }}>
            {connStatus === "connecting" ? <span style={{color: "rgba(213,132,132,0.88)"}}>正在打开相机...</span> : ""}
            {connStatus === "failure" ? <span style={{color: "red"}}>相机打开失败</span> : ""}
            <video id={divId} muted style={{ display: "none", height: props.height || 500, width: props.width || 300}} controls
                   src=""></video>

        </div>
    </MoveModal>
}