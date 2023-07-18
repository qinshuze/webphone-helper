import {Result} from "antd";
import {DisconnectOutlined} from "@ant-design/icons";

export function NotFound() {
    return (
        <Result icon={<DisconnectOutlined/>} title="404" subTitle="您访问的页面不存在 😥"/>
    )
}