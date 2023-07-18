declare namespace API {
    export type QRCode = {
        id: string,
        status: "wait" | "used" | "complete",
        device_id: string
    }
}