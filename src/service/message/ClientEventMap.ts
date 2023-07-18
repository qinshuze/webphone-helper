import {ReceiveMessage} from "./Client";

export class ErrorEvent extends Event{
    constructor(readonly reason: string) {
        super("error");
    }
}

export class CloseEvent extends Event{
    constructor(readonly code: number, readonly reason: string) {
        super("close");
    }
}

export class MessageEvent extends Event{
    constructor(readonly message: ReceiveMessage) {
        super("message");
    }
}

export interface ClientEventMap {
    "open": Event
    "close": CloseEvent
    "error": ErrorEvent
    "message": MessageEvent
}