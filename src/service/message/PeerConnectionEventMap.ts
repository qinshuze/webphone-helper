export class FailureEvent extends Event{
    constructor(readonly reason: string) {
        super("failure");
    }
}

export class CloseEvent extends Event{
    constructor(readonly code: number, readonly reason: string) {
        super("close");
    }
}

export interface PeerConnectionEventMap {
    "open": Event
    "close": CloseEvent
    "failure": FailureEvent
    "track": RTCTrackEvent
}