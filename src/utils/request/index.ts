import axios, {AxiosResponse, CreateAxiosDefaults} from "axios";
import {notification} from "antd";

export const defaults: CreateAxiosDefaults = {
    timeout: 30000,
    baseURL: "/",
    headers: {
        "Content-Type": "application/json"
    },
    validateStatus: (status: number) => {
        return status < 600
    }
}

export const interceptors = {
    response: {
        onFulfilled: (response: AxiosResponse) => {
            switch (response.status) {
                case 400:
                    notification.error({
                        message: "网络请求错误",
                        description: "网络接口请求错误，请检查网络连接后重试。"
                    })
                    break
                case 401:
                    break
                case 403:
                    notification.error({
                        message: "访问受限",
                        description: "你没有访问指定资源的权限"
                    })
                    break
                case 404:
                    notification.error({
                        message: "客户端请求错误",
                        description: "请求资源不存在或已被删除"
                    })
                    break
                case 408:
                    notification.error({
                        message: "请求超时",
                        description: "接口请求超时"
                    })
                    break
                case 422:
                    notification.error({
                        message: "参数输入错误",
                        description: response.data?.err_msg || "客户端参数输入错误"
                    })
                    break
                default:
                    if (response.status > 300) {
                        notification.error({
                            message: "网络请求异常",
                            description: "网络接口请求异常，请稍后重试"
                        })
                        break
                    }
            }

            return response
        },
        onRejected: (error: any) => {
            notification.error({
                message: "网络请求错误",
                description: "网络接口请求错误，请检查网络连接后重试。"
            })
            console.error(error)

            return Promise.reject(error);
        }
    }
}

const ApiRequest = axios.create(defaults);

ApiRequest.interceptors.response.use(interceptors.response.onFulfilled, interceptors.response.onRejected)

export default ApiRequest