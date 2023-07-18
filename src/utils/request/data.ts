import {defaults, interceptors} from "./index";
import axios from "axios";

const DataRequest = axios.create(defaults);
DataRequest.defaults.baseURL = process.env.REACT_APP_DATA_API_URL
DataRequest.interceptors.response.use(
    interceptors.response.onFulfilled,
    interceptors.response.onRejected,
)
export default DataRequest