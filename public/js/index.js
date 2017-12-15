/**
 * Created by Administrator on 2017/12/12.
 */
$(function () {
    //  页面启动就开始读取串口列表
    $.get("/portList", function (result) {
        if (!result.code) return;
        var ports = result.desc;
        var str = "";

        ports.forEach(function (value, key) {
            str += `<option value="${value.comName}">${value.comName}</option>`
        });

        console.log(result);
        $("#ports").html(str);
    });

//  开关串口
    $("#open").on("click", function () {
        var _this = $(this);
        var data = {
            productType: $("#type").val(),
            baudRate: $("#baudRate").val(),
            comName: $("#ports").val()
        };
        $.get("/openPort", data, function (result) {
            if (result.code) {
                if (!result.on) {
                    _this.val("打开串口");
                    $("#type").attr("disabled", false);
                    $("#ports").attr("disabled", false);
                    $("#baudRate").attr("disabled", false);
                } else {
                    _this.val("关闭串口");
                    $("#type").attr("disabled", true);
                    $("#ports").attr("disabled", true);
                    $("#baudRate").attr("disabled", true)
                }
            }else {
                alert(result.desc);
            }
        })
    });

//  发送数据
    $("#SendButton").on("click", function () {
        $("#txtReceive").val("");
        //  数据准备
        var data = $.trim($("#txtSend").val()).split(" ");
        console.log(data);
        if (!(data.length === 4 || data.length === 15)) {
            alert("数据格式错误");    //检查数据
            return;
        }
        //  16进制数组data:[11,01,1F,CF] 转10进制数组buffer:[17, 1, 31, 207]传递给后台
        var buffer = data.map(function (value) {
            return Number("0x" + value);
        });

        //  发送数据
        $.get("/writePort", {id: buffer}, function (result) {
            if (!result.code) {
                alert(result.desc);
                return;
            }
            result = result.desc.data;
            //  接收到的结果10进制转16进制
            var hexArr = result.map(function (value) {
                var v = value.toString(16).toUpperCase();
                return v.length === 1 ? "0" + v : v;
            });
            $("#txtReceive").val("").val(hexArr.toString().replace(/,/g, " "));
        })

    });

    $("#clearBtn").on("click", function () {
        $("#txtReceive").val("");
    });
});
