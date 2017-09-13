var linebot = require('linebot');
var express = require('express');
var getJSON = require('get-json');
var request = require("request"); //可以想像成就是在後端載入一個網頁
var cheerio = require("cheerio"); //網頁裡面的 jQuery ( 用法一樣，因為它的核心就是 jQuery )

var bot = linebot({
  channelId: 1519666472,
  channelSecret: 'a636c7b132faae8e4105aca68e9c6082',
  channelAccessToken: 'SVXCMSo50NBIfXdzLpsVPDTNwJd9boEZSPM8bfRG/WPHZv9AEJE2W2mcx5OBOujFVv7gCLiLF0fkh2nKkmPKriRhYBZL7MJy4LYD3JNF6ZQarbTB7s9AM4i84Os7os9IeWupoFEA9a/YH6o0DSoZfgdB04t89/1O/w1cDnyilFU='
});

var timer;
var timer2;
var pm = [];
var jp;

var rateArray = [];
var titleArray = [];

_getJSON();

_japan();



_bot();
const app = express();
const linebotParser = bot.parser();
app.post('/', linebotParser);

//因為 express 預設走 port 3000，而 heroku 上預設卻不是，要透過下列程式轉換 TEST
var server = app.listen(process.env.PORT || 8080, function () {
  var port = server.address().port;
  console.log("App now running on port", port);
});

function _bot() {
  bot.on('message', function (event) {
    if (event.message.type == 'text') {
      var msg = event.message.text;
      var replyMsg = '';

      if (msg.indexOf('地點') != -1) {
        pm.forEach(function (e, i) {
          replyMsg += e[0] + ',';
        });
      }
      else if (msg.indexOf('匯率') != -1) {
        rateArray.forEach(function (e, i) {
          if (msg.indexOf(e[0]) != -1 || msg.indexOf(e[1]) != -1) {
            replyMsg = e[0] + '的匯率為 ' + e[2];
          }          
        });
        if (replyMsg == '') {
          replyMsg = msg +'的'+rateArray[7][0]+'怎麼會'+msg.indexOf(rateArray[7][1]);
        }
      }
      else if (msg.indexOf('日幣') != -1) {
        replyMsg = '目前日幣 ' + jp;
      }
      else if (msg.indexOf('測試') != -1) {
        if (rateArray.length < 1)
          replyMsg = '測試軌';
        else
          replyMsg = rateArray[7][1];
      }
      else if (msg.indexOf('屁孩') != -1) {
        var maxNum = 6;
        var minNum = 0;
        var n = Math.floor(Math.random() * (maxNum - minNum + 1)) + minNum;
        switch (n) {
          case 1:
            replyMsg = '在叫我嗎?';
            break;
          case 2:
            replyMsg = '衝蝦小?';
            break;
          case 3:
            replyMsg = '何事呼朕?';
            break;
          case 4:
            replyMsg = '我很忙低';
            break;
          case 5:
            replyMsg = '有話快說';
            break;
          default:
            replyMsg = '叫屁喔!';
        }
      }
      else {
        if (msg.indexOf('PM2.5') != -1 || msg.indexOf('pm2.5') != -1) {
          pm.forEach(function (e, i) {
            if (msg.indexOf(e[0]) != -1) {
              replyMsg = e[0] + '的 PM2.5 數值為 ' + e[1];
            }
          });
          if (replyMsg == '') {
            replyMsg = '請輸入正確的地點';
          }
        }
        if (replyMsg == '') {
          replyMsg = '不知道「' + msg + '」是什麼意思 :p';
        }
      }

      event.reply(replyMsg).then(function (data) {
        console.log(replyMsg);
      }).catch(function (error) {
        console.log('error');
      });
    }
  });
}

function _getJSON() {
  clearTimeout(timer);
  getJSON('http://opendata2.epa.gov.tw/AQX.json', function (error, response) {
    response.forEach(function (e, i) {
      pm[i] = [];
      pm[i][0] = e.SiteName;
      pm[i][1] = e['PM2.5'] * 1;
      pm[i][2] = e.PM10 * 1;
    });
  });
  timer = setInterval(_getJSON, 3600000); //每小時抓取一次新資料
}

function _japan() {
  clearTimeout(timer2);
  request({
    url: "http://rate.bot.com.tw/Pages/Static/UIP003.zh-TW.htm",
    method: "GET"
  }, function (error, response, body) {
    if (error || !body) {
      return;
    } else {
      var $ = cheerio.load(body);
      var target = $(".rate-content-sight.text-right.print_hide");
      //console.log(target[15].children[0].data);
      jp = target[15].children[0].data;

      //TODO 幣別匯率做成 Array or JSON
      var title = $(".currency.phone-small-font");
      var rateName = $(".hidden-phone.print_show");
      var decimal = $(".rate-content-sight.text-right.print_hide");
      //titleArray.push(rateName[7].children[0].data);
      for (var i = 0; i < title.length; i++) {

        var res = rateName[i].children[0].data.split("(")

        rateArray[i] = [];
        rateArray[i][0] = res[0].trim();  //中文
        rateArray[i][1] = res[1].replace(")", "").trimRight(); //簡英
        rateArray[i][2] = decimal[2 * i].children[0].data;
        
        //rateArray.push('{"' + rateName[i].children[0].data + '":[' + decimal[2 * i].children[0].data + ']}');
        //titleArray.push(rateName[i].children[0].data);
      }


      if (jp < 0.275) {
        bot.push('U967cd37216aad96584958423f28e92cc', '現在日幣 ' + jp + '，該買啦！');
      }
      timer2 = setInterval(_japan, 1800000);
    }
  });
}



