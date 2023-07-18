import MoveModal, {MoveModalProps} from "../MoveModal";
import "./index.css"

type PlayerProps = {
    src: string
    modal?: MoveModalProps
    width?: number
    height?: number
    title?: string
}
export default function Player(props: PlayerProps) {
    return (
        <MoveModal {...props.modal} width={props.width || 800} height={props.height} title={props.title || "播放器"}>
            <div className="player">
                <video style={{height: props.height, width: props.width || 800}} controls src={props.src}></video>
            </div>
        </MoveModal>
    )
}