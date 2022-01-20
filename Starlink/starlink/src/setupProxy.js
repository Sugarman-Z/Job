const { createProxyMiddleware } = require('http-proxy-middleware');
module.exports = function(app) {
    app.use(
        '/api',
        createProxyMiddleware({
            target: 'https://api.n2yo.com', // target url
            changeOrigin: true, // whether it is needed to changeorigin
        })
    );
};
