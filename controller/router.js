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

//  不同型号的串口读取和设置编号时应答的bite长度
const type = {
    "PM2005": {setLen: 15, readLen: 14},
    "PM1003": {setLen: 4, readLen: 14},
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
        comListener(com, type[config.productType]);

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
function comListener(port, type) {
    //  n统计字节长度、sum和校验累加、
    // data用来保存一段一段buffer的数组、将一段段buffer连接起来后返回的整个buffer
    let n = 0,
        sum = 0,
        data = [],
        total = [];
    //  增加监听data事件
    port.addListener("data", (chunk) => {
        _receiveEnd(chunk, type, (total) => {

            return port.emit("end", total);
        })
    });

    port.addListener("err", (err) => {
        console.err(err);
    });

    type.setLen = ~~(type.setLen);
    type.readLen = ~~(type.readLen);
//  判断数据接收完毕
//  接收3个parameter  chunk:发送的数据、type:不同型号的通信协议、callback:数据接收完成做的事情
    function _receiveEnd(chunk, type, callback) {
        n += chunk.length;
        data.push(chunk);

        console.log(`监听串口数据，当前长度${chunk.length}，总长度${n}-------`, chunk);
        chunk.forEach((value, key) => {
            sum += value;
        });

        //  如果应答数据的总长度为该型号的设置应答或读取应答长度，且和校验无误，则数据接收完成；都不是则退出
        if (n === type.setLen && sum % 256 === 0) {
            total = Buffer.concat(data, type.setLen);
        } else if (n === type.readLen && sum % 256 === 0) {
            total = Buffer.concat(data, type.readLen);
        } else {
            return;
        }
        n = 0;
        sum = 0;
        data = [];
        callback && callback(total);
    }
}

