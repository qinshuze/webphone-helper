import {defaults, interceptors} from "./index";
import axios from "axios";

const AdminRequest = axios.create(defaults);
AdminRequest.defaults.baseURL = "/api/admin"
AdminRequest.interceptors.response.use(
    interceptors.response.onFulfilled,
    interceptors.response.onRejected,
)
export default AdminRequest