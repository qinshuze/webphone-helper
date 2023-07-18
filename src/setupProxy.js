const {createProxyMiddleware} = require('http-proxy-middleware');
module.exports = function (app) {
    app.use('/api/admin', createProxyMiddleware({
            target: process.env.REACT_APP_ADMIN_API_URL,
            changeOrigin: true,
            pathRewrite: {'^/api/admin': ''}
        })
    )

    app.use('/api/msg', createProxyMiddleware({
            target: process.env.REACT_APP_MSG_PUSH_API_URL,
            changeOrigin: true,
            pathRewrite: {'^/api/msg': ''}
        })
    )

    app.use('/api/data', createProxyMiddleware({
            target: process.env.REACT_APP_DATA_API_URL,
            changeOrigin: true,
            pathRewrite: {'^/api/data': ''}
        })
    )
}