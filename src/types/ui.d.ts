declare namespace UI {
    type App = {
        user: User
    }

    type DeviceSocketState = "online" | "offline" | "disconnected" | "connecting"
    type DeviceRTCState = "online" | "offline" | "disconnected" | "connecting"

    type User = {
        test: string
        id: string
        deviceId: string,
        token: string,
        deviceSocketState: UI.DeviceSocketState,
        deviceRTCState: UI.DeviceRTCState,
    }
}