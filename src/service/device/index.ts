import DataRequest from "../../utils/request/data";

export function getFiles(deviceId: string, path: string, offset: number = 0, size: number = 40) {
    const params = new URLSearchParams()
    params.set("path", path)
    params.set("offset", offset.toString())
    params.set("size", size.toString())
    params.set("_aid", deviceId)
    params.set("_method", "getFileList")
    // return axios.get(`/device/files?${params}`)
    return DataRequest.get(`/api?${params}`)
}