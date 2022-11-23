const fs = require('fs');
const client = require('https');

function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    client.get(url, (res) => {
      if (res.statusCode === 200) {
        return res
      } else {
          // Consume response data to free up memory
          res.resume();
          reject(new Error(`Request Failed With a Status Code: ${res.statusCode}`));

      }
  });
});
}

downloadImage('https://www.adslzone.net/app/uploads-adslzone.net/2019/04/borrar-fondo-imagen.jpg', 'img.png')
  .then(console.log)
  .catch(console.error);