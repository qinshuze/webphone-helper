import "./device/index"
import mockjs from "mockjs";

mockjs.setup({
    timeout: '1000-6000' // 表示响应时间介于 200 和 600 毫秒之间，默认值是'10-100'。
})
