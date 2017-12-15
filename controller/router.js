/**
 * Created by Administrator on 2017/12/12.
 */
const fs = require("fs");
const SerialPort = require("serialport");

//  串口默认配置
const comConfig = {
    // baudRate: '9600',    //波特率通过客户端设置
    dataBits: 8,
    parity: 'none',
    stopBits: 1,
    autoOpen: false  //串口自动打开
};

let com;

//  显示首页
exports.showIndex = (req, res, next) => {
    fs.readFile("./test.html", (err, data) => {
        if (err) {
            console.log(err);
            next();
            return;
        }

        res.send(data.toString());
        res.end()
    })
};

//  读取串口列表
exports.showPortList = (req, res, next) => {
    // console.log(req.headers.origin);
    // res.header("Access-Control-Allow-Origin", "*");
    SerialPort.list((err, ports) => {
        if (err) {
            console.log(err);
            req.json({code: 0, desc: err.message});
            next();
            return;
        }

        let portsArr = [];
        ports.forEach((value, key) => {
            portsArr.push(value.comName);
        });

        // console.log("list ", ports);
        res.json({code: 1, desc: ports});
        res.end();
    })
};

//  开关串口操作串口
exports.openPort = (req, res, next) => {
    //  如果没有串口，则打开请求的串口
    if (!com) {
        //  初始化串口
        var config = req.query;
        comConfig.baudRate = ~~(config.baudRate);
        com = new SerialPort(config.comName, comConfig);
        comListener(com);

        com.open((err) => {
            if (err) {
                console.log("err: ", err.message);
                res.json({code: 0, desc: err.message, on: com.isOpen});
                com = null;
                return next();
            }

            console.log("串口打开成功");
            res.json({code: 1, desc: "串口打开成功", on: com.isOpen});
        })
    } else {
        //  如果有一个串口，则关闭存在的串口
        com.close((err) => {
            if (err) {
                console.log("err: ", err.message);
                res.json({code: 0, desc: err.message});
                return next();
            }
            com = null;
            console.log("串口成功关闭");
            res.json({code: 1, desc: "串口成功关闭"});
        });
    }

};


//  串口写入数据
//  串口收到数据后会立刻发送数据
exports.writePort = (req, res, next) => {
    //  串口未打开则跳出
    if (!com || !com.isOpen) {
        res.json({code: 0, desc: "串口尚未打开"});
        return next();
    }
    let buffer = new Buffer(req.query.id);

    // console.log("准备写入数据: ",buffer);
    com.write(buffer, "ascii", () => {
        console.log("写入成功");
    });

    //  如果写on则多次请求'end'事件会累计触发
    com.once("end", (data) => {
        clearTimeout(end);
        console.log("total: ", data);
        res.json({code: 1, desc: data.toJSON()});
        return next();
        // console.log("convert: ",new Buffer(json.data))
    });

    //  500ms内没收到应答则认为读取串口数据失败
    let end = setTimeout(() => {
        res.json({code: 0, desc: "读取失败"});
        console.log("-----------读取失败---------------");
        return next();
    }, 2000);
};

/**目前数据接收的情况
 * PM2005
 * 1.读取编号：发送4bite，收14bite；
 * 2.设置编号：发15bite，收15bite；
 * PM1003
 * 1.读取编号：发送4bite，收14bite；
 * 2.设置编号：发送15bite，收4bite；
 */

/**初始化串口
 * 增加串口监听data事件，数据接收完毕时触发结束事件
 */
function comListener(port, res) {
    let n = 0,
        data = [],
        total = [];
    //  增加监听data事件
    port.addListener("data", (chunk) => {
        //  总bite长度为15时触发数据接收结束事件
        _receiveEnd(chunk, 15, (total) => {
            return port.emit("end", total);
        })
    });

    port.addListener("err", (err) => {
        console.err(err);
    });


//  判断数据接收完毕
//  接收3个parameter  chunk:发送的数据、maxLen:数据总长度、callback:数据接收完成做的事情
    function _receiveEnd(chunk, maxLen, callback) {
        n += chunk.length;
        data.push(chunk);

        console.log(`监听串口数据，当前长度${chunk.length}，总长度${n}-------`, chunk);

        if (n !== maxLen) return;
        total = Buffer.concat(data, maxLen);
        n = 0;
        data = [];
        callback && callback(total);
    }
}

