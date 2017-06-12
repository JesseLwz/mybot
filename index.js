var linebot = require('linebot');
var express = require('express');

var bot = linebot({
    channelId: 1519666472,
    channelSecret: 'a636c7b132faae8e4105aca68e9c6082',
    channelAccessToken: 'SVXCMSo50NBIfXdzLpsVPDTNwJd9boEZSPM8bfRG/WPHZv9AEJE2W2mcx5OBOujFVv7gCLiLF0fkh2nKkmPKriRhYBZL7MJy4LYD3JNF6ZQarbTB7s9AM4i84Os7os9IeWupoFEA9a/YH6o0DSoZfgdB04t89/1O/w1cDnyilFU='
});

bot.on('message', function (event) {
    if (event.message.type = 'text') {
        var msg = '你剛說 : ' + event.message.text;
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