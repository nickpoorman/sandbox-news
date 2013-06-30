var url = require('url');
var topic = {url: "about.me/nickpoorman"};
if(!topic.url.match(/^http:\/\//g)){
  topic.url = 'http://' + topic.url;
}
var parsed = url.parse(topic.url);
console.log(parsed);
var hostname = url.parse(topic.url).hostname.replace(/^www\./g,"");
console.log(hostname);