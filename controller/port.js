/**
 * Created by Administrator on 2017/12/12.
 */
const SerialPort = require("serialport");

//  设置串口
let com = new SerialPort("COM3", {
    baudRate: 9600,
    dataBits: 8,
    parity: 'none',
    stopBits: 1,
    autoOpen: false  //串口自动打开
});

//  读取串口列表
exports.readPortList = function (callback) {
    SerialPort.list((err, ports) => {
        if (err) {
            console.log(err);
            return;
        }

        let portsArr = [];
        ports.forEach((value, key) => {
            portsArr.push(value.comName);
        });

        console.log(portsArr);
        callback(portsArr);
    })
};

//  打开串口
exports.openPort = function (callback) {
    com.open((err) => {
        callback(err);
    })

};

//  关闭串口
exports.closePort = function (callback) {
    com.close((err) => {
        callback(err);
    })
};
