import {defaults, interceptors} from "./index";
import axios from "axios";

const DataRequest = axios.create(defaults);
DataRequest.defaults.baseURL = "/api/data"
DataRequest.interceptors.response.use(
    interceptors.response.onFulfilled,
    interceptors.response.onRejected,
)
export default DataRequest