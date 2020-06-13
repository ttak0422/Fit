module.exports = {
    mode: "development",
    entry: `${__dirname}/src/index.ts`,
    output: {
        path: `${__dirname}/dist`
    },
    devServer: {
        port: 8888,
        contentBase: "bundle.js"
    },
    module: {
        rules: [
            {
                test: /\.(js|ts)$/,
                use: ["babel-loader", "ts-loader"]
            }
        ]
    },
    resolve: {
        extensions: [".ts", ".js"]
    }
}