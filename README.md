# 运行 #
 app.js运行后，打开 http://127.0.0.1:3000 就可以开始测试程序了；
 串口没有`receivedEnd`方法,所以自己写了一个结束通信的方法：
 1. 接收到指定字节长度且满足和校验时候；
 2. 后台如果2s内没收到就认为读取通信失败

####  这一点需要自己定制，根据实际需求来改变。

 **即在你需要的时候触发** `port.emit("end", total);`就可以了
 