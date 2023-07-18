import React, {useCallback, useContext, useEffect} from "react";
import {AppContext} from "../../App";

function initState(): UI.User {
    return {
        test: "qqqq",
        id: localStorage.getItem("userId") || "",
        deviceId: localStorage.getItem("deviceId") || "",
        token: localStorage.getItem("token") || "",

        deviceSocketState: "connecting",
        deviceRTCState: "connecting",
    }
}

export function useLoginStatus(): boolean {
    useEffect(() => {
        localStorage.getItem("token")
    })
    return false
}

export function useUserState(): [UI.User, React.Dispatch<React.SetStateAction<UI.User>>] {
    const [state, setState] = useContext(AppContext)
    const userState = state.user || initState()

    const callback = useCallback((value: ((prevState: UI.User) => UI.User) | UI.User) => {
        const newUserState = state.user || initState()
        if (value instanceof Function) {
            value(newUserState)
        } else {
            setState({...state, user: {...value}})
        }
    }, [state, setState])

    return [userState, callback]
}

export function useUserToken(): [string, React.Dispatch<React.SetStateAction<string>>] {
    const [state, setState] = useContext(AppContext)
    const callback = useCallback((value: ((prevState: string) => string) | string) => {
        setState(s => {
            if (value instanceof Function) value = value(s.user.token)
            if (value === s.user.token) return s
            localStorage.setItem("token", value)
            return {...s, user: {...s.user, token: value}}
        })
    }, [setState])

    return [state.user.token, callback]
}

export function useUserId(): [string, React.Dispatch<React.SetStateAction<string>>] {
    const [state, setState] = useContext(AppContext)
    const callback = useCallback((value: ((prevState: string) => string) | string) => {
        setState(s => {
            if (value instanceof Function) value = value(s.user.id)
            if (value === s.user.id) return s
            localStorage.setItem("id", value)
            return {...s, user: {...s.user, id: value}}
        })
    }, [setState])

    return [state.user.id, callback]
}

export function useDeviceId(): [string, React.Dispatch<React.SetStateAction<string>>] {
    const [state, setState] = useContext(AppContext)
    const callback = useCallback((value: ((prevState: string) => string) | string) => {
        setState(s => {
            if (value instanceof Function) value = value(s.user.deviceId)
            if (value === s.user.deviceId) return s
            localStorage.setItem("deviceId", value)
            return {...s, user: {...s.user, deviceId: value}}
        })
    }, [setState])

    return [state.user.deviceId, callback]
}

export function useDeviceSocketState(): [UI.DeviceSocketState, React.Dispatch<React.SetStateAction<UI.DeviceSocketState>>] {
    const [state, setState] = useContext(AppContext)
    const callback = useCallback((value: ((prevState: UI.DeviceSocketState) => UI.DeviceSocketState) | UI.DeviceSocketState) => {
        setState(s => {
            if (value instanceof Function) value = value(s.user.deviceSocketState)
            if (value === s.user.deviceSocketState) return s
            return {...s, user: {...s.user, deviceSocketState: value}}
        })
    }, [setState])

    return [state.user.deviceSocketState, callback]
}

export function useDeviceRTCState(): [UI.DeviceRTCState, React.Dispatch<React.SetStateAction<UI.DeviceRTCState>>] {
    const [state, setState] = useContext(AppContext)
    const callback = useCallback((value: ((prevState: UI.DeviceRTCState) => UI.DeviceRTCState) | UI.DeviceRTCState) => {
        setState(s => {
            if (value instanceof Function) value = value(s.user.deviceRTCState)
            if (value === s.user.deviceRTCState) return s
            return {...s, user: {...s.user, deviceRTCState: value}}
        })
    }, [setState])

    return [state.user.deviceRTCState, callback]
}