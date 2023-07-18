import {defaults, interceptors} from "./index";
import axios from "axios";

const MsgPushRequest = axios.create(defaults);
MsgPushRequest.defaults.baseURL = "/api/msg"
MsgPushRequest.interceptors.response.use(
    interceptors.response.onFulfilled,
    interceptors.response.onRejected,
)
export default MsgPushRequest