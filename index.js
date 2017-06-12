var linebot = require('linebot');
var express = require('express');

var bot = linebot({
    channelId: 1519666472,
    channelSecret: 'a636c7b132faae8e4105aca68e9c6082',
    channelAccessToken: 'SVXCMSo50NBIfXdzLpsVPDTNwJd9boEZSPM8bfRG/WPHZv9AEJE2W2mcx5OBOujFVv7gCLiLF0fkh2nKkmPKriRhYBZL7MJy4LYD3JNF6ZQarbTB7s9AM4i84Os7os9IeWupoFEA9a/YH6o0DSoZfgdB04t89/1O/w1cDnyilFU='
});

var jp;
var timer2;
_japan();//抓日幣匯率

bot.on('message', function (event) {
    if (event.message.type = 'text') {
        var msg = '你剛說 : ' + event.message.text  + 'BTW 日匯率:'+jp;
        event.reply(msg).then(function (data) {
            // success 
            console.log(msg);
        }).catch(function (error) {
            // error 
            console.log('error');
        });
    }
});

const app = express();
const linebotParser = bot.parser();
app.post('/', linebotParser);

//因為 express 預設走 port 3000，而 heroku 上預設卻不是，要透過下列程式轉換 TEST
var server = app.listen(process.env.PORT || 8080, function () {
    var port = server.address().port;
    console.log("App now running on port", port);
});

function _japan() {
  clearTimeout(timer2);
  request({
    url: "http://rate.bot.com.tw/Pages/Static/UIP003.zh-TW.htm",
    method: "GET"
  }, function(error, response, body) {
    if (error || !body) {
      return;
    } else {
      var $ = cheerio.load(body);
      var target = $(".rate-content-sight.text-right.print_hide");
      console.log(target[15].children[0].data);
      jp = target[15].children[0].data;
      if (jp < 0.28) {
        bot.push('使用者 ID', '現在日幣 ' + jp + '，該買啦！');
      }
      timer2 = setInterval(_japan, 120000);
    }
  });
}