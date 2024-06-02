import mockjs from "mockjs";

mockjs.mock(`/api/admin/qrcode`, (params) => {
    return Promise.resolve({
        id: "aaaaaaa",
        status: "complete",
        device_id: "test-dev"
    })
})