/**
 * Created by Administrator on 2017/12/12.
 */
const express = require("express");
const router = require("./controller/router");

const app = express();

//  添加访问白名单
app.all('*',(req,res,next)=>{
    let origin = req.headers.origin;
    let host = req.headers.host;
    //  允许本地调试和服务器主机请求
    if (/127\.0\.0\.1.?/.test(host) || /http:\/\/192\.168\.16\.150.?/.test(origin)){
        res.header("Access-Control-Allow-Origin", origin);
        res.header("Access-Control-Allow-Credentials",'true');
    }
    return next();
});

//  静态资源
app.use("/public", express.static("public"));
//  展示首页
app.get("/", router.showIndex);

//  获取串口list
app.get("/portList", router.showPortList);

//  开关串口
app.get("/openPort",router.openPort);

//  写入数据
app.get("/writePort",router.writePort);


app.listen(3000);