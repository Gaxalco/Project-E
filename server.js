const http = require('http');
const fs = require('fs');
const port = 8085;

const server = http.createServer();
let comments = [];
let likes = [];

server.on('request', (req, res) => {
    if (req.method === "GET" && req.url.startsWith('/public/')) {
        handlePublicRequest(req, res);
    } else if (req.method === "GET" && req.url === '/') {
        redirectToIndex(res);
    } else if (req.method === "GET" && req.url === '/index') {
        serveIndexPage(res);
    } else if (req.method === "GET" && req.url === '/images') {
        serveImagesPage(res);
    } else if (req.method === "GET" && req.url.startsWith('/page-image/')) {
        serveImagePage(req, res);
    } else if (req.method === "POST" && req.url.startsWith('/image-description/')) {
        handleImageDescription(req, res);
    } else if (req.method === "POST" && req.url.startsWith('/image-like/')) {
        handleImageLike(req, res);
    } else {
        res.statusCode = 404;
        res.end('Page not found');
    }
});

server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});

function handlePublicRequest(req, res) {
    try {
        const file = fs.readFileSync(`.${req.url}`);
        res.end(file);
    } catch (err) {
        console.log(err);
        res.statusCode = 404;
        res.end('Page not found');
    }
}

function redirectToIndex(res) {
    res.writeHead(302, { Location: '/index' });
    res.end();
}

function serveIndexPage(res) {
    const file = fs.readFileSync('./public/index.html');
    res.end(file);
}

function serveImagesPage(res) {
    let html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Mur</title>
        <link rel="stylesheet" type="text/css" href="/public/style-mur.css">
    </head>
    <body>
        <nav>
            <a href="/index">Index</a>
        </nav>
        <h1>Mur de toutes les zimages</h1>
        <div id="mur">
    `;
    const files = fs.readdirSync('./public/images');
    files.forEach(file => {
        if (file.endsWith('small.jpg')) {
            const imageNumber = file.match(/\d+/)[0];
            html += `
            <a href="/page-image/${imageNumber}"><img src="/public/images/${file}" /></a>
            `;
        }
    });
    html += `
        </div>
    </body>
    </html>
    `;
    res.end(html);
}

function serveImagePage(req, res) {
    let imageNumber = req.url.split('/')[2];
    let isLiked = likes.some(like => like.imageNumber == imageNumber);

    let html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Image ${imageNumber}</title>
        <link rel="stylesheet" type="text/css" href="/public/style-page-image.css">
    </head>
    <body>
        <a id="index" href="/images">Mur</a>
        <br>
        <div class="image-container">
            <img id="main_image" src="/public/images/image${imageNumber}.jpg" width=500/>
            <span id="heart-icon" class="heart-icon" style="color: ${isLiked ? 'red' : 'black'};">&#9829;</span>
        </div>
        <br>
        <p id="comment">Une image... c'est tout</p>
    `;
    if (imageNumber > 1) {
        html += `<a href="/page-image/${+imageNumber - 1}"><img id="small_image_left" src="/public/images/image${+imageNumber - 1}_small.jpg" width=auto/></a>`;
    }
    html += `
        <div id="comments-section">
            <h2>Commentaires</h2>
            <div id="comments">
    `;
    comments.forEach(comment => {
        if (comment.imageNumber == imageNumber) {
            html += `<p class="comment">${comment.description}</p>`;
        }
    });
    html += `
            </div>
            <h3>Ajouter un commentaire</h3>
            <form action="/image-description/${imageNumber}" method="POST">
                <input type="hidden" name="imageNumber" value="${imageNumber}">
                <textarea id="textComment" name="description" rows="4" cols="50" placeholder="Votre commentaire..."></textarea>
                <br>
                <input id="sendComment" type="submit" value="Envoyer">
            </form>
        </div>
    `;
    if (imageNumber < fs.readdirSync('./public/images').filter(file => file.endsWith('_small.jpg')).length) {
        html += `<a href="/page-image/${+imageNumber + 1}"><img id="small_image_right" src="/public/images/image${+imageNumber + 1}_small.jpg" width="auto"/></a>`;
    }
    html += `
        <script>
            document.getElementById('heart-icon').addEventListener('click', function() {
                fetch('/image-like/${imageNumber}', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: 'imageNumber=' + ${imageNumber}
                }).then(response => {
                    if (response.ok) {
                        if (this.style.color === 'red') {
                            this.style.color = 'black';
                        }
                        else {
                            this.style.color = 'red';
                        }
                    }
                });
            });
        </script>
        </body>
    </html>
    `;
    res.end(html);
}

function handleImageDescription(req, res) {
    req.on("data", (data) => {
        let imageNumber = data.toString().split('&')[0].split('=')[1];
        let description = data.toString().split('&')[1].split('=')[1].replace(/\+/g, ' ').replace(/%0D%0A/g, '<br>');
        comments.push({ imageNumber, description });
        console.log(comments);
    });
    res.statusCode = 302;
    let imageNumber = req.url.split('/')[2];
    res.setHeader('Location', `/page-image/${imageNumber}`);
    res.end();
}

function handleImageLike(req, res) {
    req.on("data", (data) => {
        let imageNumber = data.toString().split('&')[0].split('=')[1];
        if (!likes.some(like => like.imageNumber == imageNumber)) {
            likes.push({ imageNumber });
        } else {
            likes = likes.filter(like => like.imageNumber != imageNumber);
        }
        console.log(likes);
    });
    res.statusCode = 302;
    let imageNumber = req.url.split('/')[2];
    res.setHeader('Location', `/page-image/${imageNumber}`);
    res.end();
}