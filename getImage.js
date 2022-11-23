const request = require('request');

let url = 'http://website.com/image.png';
request({ url, encoding: null }, (err, resp, buffer) => {
  if (err) { return console.log(err); }
  return buffer
});