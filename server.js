const http = require('http');
const fs = require('fs');
const port = 8085;

const server = http.createServer();

server.on('request', (req, res) => {
    if (req.method === "GET" && req.url.startsWith('/public/')) {

        try {
            const file = fs.readFileSync(`.${req.url}`);
            res.end(file);
        } catch (err) {
            console.log(err);
            res.statusCode = 404;
            res.end('Page not found');
        }
    
    } else if (req.method === "GET" && req.url === '/') {

        res.writeHead(302, { Location: '/index' });
        res.end();

    } else if (req.method === "GET" && req.url === '/index') {

        const file = fs.readFileSync('./public/index.html');
        res.end(file);

    } else if (req.method === "GET" && req.url === '/images') {

        let html = '<!DOCTYPE html><html><head><title>Mur</title><link rel="stylesheet" type="text/css" href="/public/style-mur.css"></head><body>';
        html += '<a href="/index">Index</a>';
        html += '<a href="/public/image-description.html">Image description</a>';
        html += '<h1>Mur de toutes les zimages</h1>';
        const files = fs.readdirSync('./public/images');
        html += '<div id="mur">';
        files.forEach(file => {
            if (file.endsWith('small.jpg')) {
                const imageNumber = file.match(/\d+/)[0];
                html += '<a href="/page-image/' + imageNumber + '"><img src="/public/images/' + file + '" /></a>';
            }
        });
        html += '</div>';
        html += '</body></html>';
        res.end(html);

    } else if (req.method === "GET" && req.url.startsWith('/page-image/')) {

        let imageNumber = req.url.split('/')[2];

        let html = '<!DOCTYPE html><html><head><title>Image' + imageNumber + '</title><link rel="stylesheet" type="text/css" href="/public/style-page-image.css"></head><body>';
        html += '<a href="/images">Mur</a>';
        html += '<br>';
        html += '<img id="main_image" src="/public/images/image' + imageNumber + '.jpg" width=500/>';
        html += '<br>';
        html += '<p id="comment">Une image... c\'est tout</p>';
        if (imageNumber > 1) {
            html += '<a href="/page-image/' + (+imageNumber - 1) + '"><img id="small_image_left" src="/public/images/image' + (+imageNumber - 1) + '_small.jpg" width=auto/>';
        }
        if (imageNumber < fs.readdirSync('./public/images').filter(file => file.endsWith('_small.jpg')).length) {
            html += '<a href="/page-image/' + (+imageNumber + 1) + '"><img id="small_image_right" src="/public/images/image' + (+imageNumber + 1) + '_small.jpg" width=auto/>';
        }
        html += '</body></html>';
        res.end(html);

    } else {
        res.statusCode = 404;
        res.end('Page not found');
    }
});

server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});