import Home from "../page/Home";
import Login from "../page/Login";
import {Navigate, RouteObject} from "react-router-dom";
import AuthInterceptor from "../component/AuthInterceptor";
import {NotFound} from "../page/Error/404";

export const Path = {
    HOME: "/",
    LOGIN: "/login",
    NOT_FOUND: "/404"
}

const routes: RouteObject[] = [
    {
        path: Path.HOME,
        element: <AuthInterceptor><Home/></AuthInterceptor>
    },
    {
        path: Path.LOGIN,
        element: <Login/>,
    },
    {
        path: Path.NOT_FOUND,
        element: <NotFound/>
    },
    {
        path: "*",
        element: <Navigate to="/404"/>
    },
]

export default routes;