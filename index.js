var linebot = require('linebot');
var express = require('express');
var getJSON = require('get-json');
var request = require("request"); // 可以想像成就是在後端載入一個網頁
var cheerio = require("cheerio"); // 網頁裡面的 jQuery ( 用法一樣，因為它的核心就是 jQuery )
var rp = require('request-promise');
// var http = require("https");

var bot = linebot({
  channelId: process.env.channelId, // 1519666472,
  channelSecret: process.env.ChannelSecret, // 'a636c7b132faae8e4105aca68e9c6082', 這邊使用HEROKU的環境變數
  channelAccessToken: process.env.ChannelAccessToken // 'SVXCMSo50NBIfXdzLpsVPDTNwJd9boEZSPM8bfRG/WPHZv9AEJE2W2mcx5OBOujFVv7gCLiLF0fkh2nKkmPKriRhYBZL7MJy4LYD3JNF6ZQarbTB7s9AM4i84Os7os9IeWupoFEA9a/YH6o0DSoZfgdB04t89/1O/w1cDnyilFU='
});

var timer;
var timer2;
var pm = []; //紀錄地點PM2.5
var jp; //指定紀錄日圓
var rateArray = []; //紀錄幣別匯率

var imgurl = ''; //放圖片網址

_getPMJSON();

_watchJapan(); //定時監控日幣匯率


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

      var reType = 'text'; //回傳格式: text  pic
      var picUrl = ''; //回傳圖片的URL

      if (msg.indexOf('梗圖') == 0) {
        reType = 'pic';
        var keyword = msg.substring(2)
        searchImgurImg(keyword);
        picUrl = imgurl;
      } else if (msg.indexOf('地精') == 0) {
        //還是有問題 第一次好像沒有執行 
        getImgurImg(); //去呼叫 Imgur API 抓相簿圖片
        //if (imgurl = !'') {
        reType = 'pic';
        picUrl = imgurl;
        //}
        //else {
        //  replyMsg = '沒有梗圖...'
        //}        

      } else
      if (msg.indexOf('地點') != -1) {
        pm.forEach(function (e, i) {
          replyMsg += e[0] + ',';
        });
        if (replyMsg != '')
          replyMsg = replyMsg.slice(0, -1);
      } else if (msg.indexOf('幣別') != -1) {
        rateArray.forEach(function (e, i) {
          replyMsg += e[0] + ',';
        });
        if (replyMsg != '')
          replyMsg = replyMsg.slice(0, -1);
      } else if (msg.indexOf('匯率') != -1) {
        rateArray.forEach(function (e, i) {
          if (msg.indexOf(e[0]) != -1 || msg.indexOf(e[1]) != -1) {
            replyMsg = e[0] + '的匯率為 ' + e[2];
          }
        });
        if (replyMsg == '') {
          // replyMsg = msg +'的'+rateArray[7][0]+'怎麼會'+msg.indexOf(rateArray[7][1]);
          replyMsg = '不懂';
        }
      } else if (msg.indexOf('日幣') != -1) {
        if (jp != 'undefined')
          replyMsg = '目前日幣 ' + jp;
        else
          replyMsg = '爬蟲中...';
      } else if (msg.indexOf('測試') != -1) {
        if (rateArray.length < 1)
          replyMsg = '測試軌';
        else
          replyMsg = rateArray[7][1];
      } else if (msg.indexOf('屁孩') != -1) {
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
      } else {
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

      if (reType == 'text') {
        event.reply(replyMsg).then(function (data) {
          console.log(replyMsg);
        }).catch(function (error) {
          console.log('error');
        });
      } else if (reType == 'pic') {
        //回傳網址看看
        // event.reply(picUrl).then(function (data) {
        //   console.log(picUrl);
        // }).catch(function (error) {
        //   console.log('error');
        // });

        event.reply({
          type: 'image',
          originalContentUrl: picUrl,
          previewImageUrl: picUrl
        }).catch(function (error) {
          replayText(error.toString());
        });

      }
    }
  });
}


function _getPMJSON() {
  clearTimeout(timer);
  getJSON('http://opendata2.epa.gov.tw/AQX.json', function (error, response) {
    response.forEach(function (e, i) {
      pm[i] = [];
      pm[i][0] = e.SiteName;
      pm[i][1] = e['PM2.5'] * 1;
      pm[i][2] = e.PM10 * 1;
    });
  });
  timer = setInterval(_getPMJSON, 3600000); //每小時抓取一次新資料
}

function _watchJapan() {
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

      //爬蟲方式抓HTML上資料 幣別匯率存成 Array or JSON
      var title = $(".currency.phone-small-font");
      var rateName = $(".hidden-phone.print_show");
      var decimal = $(".rate-content-sight.text-right.print_hide");
      for (var i = 0; i < title.length; i++) {
        var res = rateName[i].children[0].data.split("(")
        rateArray[i] = [];
        rateArray[i][0] = res[0].trim(); //日圓
        rateArray[i][1] = res[1].replace(")", "").trimRight(); //JPY
        rateArray[i][2] = decimal[(2 * i) + 1].children[0].data; //匯率
      }

      if (jp < 0.273) {
        bot.push('U967cd37216aad96584958423f28e92cc', '現在日幣 ' + jp + '，該買啦！');
      }
      timer2 = setInterval(_watchJapan, 1800000); //每半小時抓取一次新資料
    }
  });
}


function getImgurImg() {
  var imgur_options = {
    method: 'GET',
    uri: `https://api.imgur.com/3/album/ZTx3D/images`,
    headers: {
      "Authorization": `Client-ID 3c3846d8407e6a3`
    },
    json: true
  };

  return rp(imgur_options)
    .then(function (imgur_response) {
      // collect image urls from the album
      var array_images = [];
      imgur_response.data.forEach(function (item) {
        array_images.push(item.link);
      })
      // choose one of images randomly
      imgurl = array_images[Math.floor(Math.random() * array_images.length)];
    })
}

function searchImgurImg(_keyword) {
  var imgur_options = {
    method: 'GET',
    uri: `https://api.imgur.com/3/gallery/search/?q=` + _keyword,
    headers: {
      "Authorization": `Client-ID 3c3846d8407e6a3`
    },
    json: true
  };

  return rp(imgur_options)
    .then(function (imgur_response) {

      imgurl = imgur_response.data[0].images[0].link

    })
}
