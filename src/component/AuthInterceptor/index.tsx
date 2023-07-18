import {useLocation} from "react-router-dom";
import React from "react";
import {useUserToken} from "../../hook/User";

export default function AuthInterceptor(props: { children?: React.ReactNode }) {
    const location = useLocation()
    const [token] = useUserToken()

    if (!token && location.pathname !== "/login") {
        window.location.replace("/login")
    }

    return (
        <div>
            {props.children}
        </div>
    )
}