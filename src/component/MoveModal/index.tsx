import React, {CSSProperties, useLayoutEffect, useRef, useState} from "react";
// import "./index.css"
import "./index.scss"
import Draggable from 'react-draggable';
import {CloseOutlined} from "@ant-design/icons";
import {randomNum} from "../../utils";
import ReactDOM from "react-dom/client";
import {createPortal} from "react-dom";

export type MoveModalProps = {
    children?: React.ReactNode
    title?: string
    onCancel?: (event: React.MouseEvent<HTMLElement, MouseEvent>) => any
    width?: number | string
    style?: CSSProperties
    bodyStyle?: CSSProperties
    initX?: number
    initY?: number
    showX?: number
    showY?: number
    height?: number | string
    active?: boolean
    onClick?: (event: React.MouseEvent<HTMLElement, MouseEvent>) => any
}

// 初始变量
let width: number | string | undefined = 0
let height: number | string | undefined = 0
let initY: number | string | undefined = 0
let initX: number | string | undefined = 0
let initStyle: React.CSSProperties
let initBodyStyle: React.CSSProperties

export function MoveModalCreate(element: React.ReactElement) {
    const div = document.createElement("div")
    document.body.appendChild(div)
    ReactDOM.createRoot(div).render(element)
    // document.body.appendChild(createPortal(element, document.body))
}

export default function MoveModal(props: MoveModalProps) {
    const [isDestroyed, setIsDestroyed] = useState(false)
    const [style, setStyle] = useState(props.style || {})
    const [isInit, setIsInit] = useState(false)
    const [isMoving, setIsMoving] = useState(false)
    const moveModalRef = useRef<HTMLDivElement>(null)

    width = style.width || props.width
    height = style.height || props.height
    initY = props.showY
    initX = props.showX
    initStyle = style
    initBodyStyle = props.bodyStyle || {}

    initBodyStyle.width = width
    initBodyStyle.height = height
    if (!isInit) {
        style.opacity = 0
        style.top = props.initY || 0
        style.left = props.initX || 0
    }

    useLayoutEffect(() => {
        if (moveModalRef.current) {
            const offsetWidth = moveModalRef.current.offsetWidth
            const offsetHeight = moveModalRef.current.offsetHeight
            const top = initY || parseInt((offsetHeight / 2).toFixed(2)) + randomNum(0, 50)
            const left = initX || parseInt((offsetWidth / 2).toFixed(2)) + randomNum(0, 50)

            setIsInit(true)
            setStyle({
                ...initStyle,
                top: (top < 0) ? 0 : `calc(50% - ${parseInt(top as string) - 26}px)`,
                left: (left < 0) ? 0 : `calc(50% - ${left}px)`,
                // width: width,
                // height: height,
                opacity: 1,
            })
        }
    }, [])

    return (
        !isDestroyed ?
            createPortal(<Draggable onStart={() => setIsMoving(true)} onStop={() => setIsMoving(false)}
                                    handle=".move-modal-title">
                <div ref={moveModalRef} onClick={(event) => {
                    const elements = document.querySelectorAll(".move-modal-active")
                    elements.forEach((v) => {
                        if (v !== event.currentTarget) {
                            v.className = event.currentTarget.className.replaceAll("move-modal-active", "")
                        }
                    })
                    event.currentTarget.className = `${event.currentTarget.className} move-modal-active`
                }}
                     className={`move-modal${isMoving ? " move-modal-moving" : ""}${props.active ? " move-modal-active" : ""}`}
                     style={style}>
                    <div className="move-modal-header">
                        <div className="move-modal-title">{props.title || "未命名窗口"}</div>
                        <div className="move-modal-close" onClick={(event) => {
                            setIsDestroyed(true)
                            props.onCancel?.(event)
                        }}><CloseOutlined/></div>
                    </div>
                    <div style={initBodyStyle} className="move-modal-body">
                        {props.children}
                    </div>
                </div>
            </Draggable>, document.body)
            : null
    )
}