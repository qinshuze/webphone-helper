import "./device/index"
import "./admin/index"
import mockjs from "mockjs";

mockjs.setup({
    timeout: '200-1000' // 表示响应时间介于 200 和 600 毫秒之间，默认值是'10-100'。
})
