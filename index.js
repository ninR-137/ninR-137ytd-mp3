const express = require('express');
const pathToFfmpeg = require('ffmpeg-static');
const ffmpeg = require('fluent-ffmpeg');
const ytdl = require('ytdl-core');
const fs = require('fs');
const { URL, parse } = require('url');
const app = express();
const port = 3000;

ffmpeg.bin = pathToFfmpeg.path;
function getId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);

    return (match && match[2].length === 11)
      ? match[2]
      : null;
}

 /*
  There has been some recent issues with
  ytdl-core version: 4.11.1
  Temporary fix is documented here : 
  
  https://github.com/GreepTheSheep/node-ytdl-core

  You can add it on your package.json with npm npm i ytdl-core@https://github.com/GreepTheSheep/node-ytdl-core
 */

const downloadVid = function(req, res, next){
    const q = parse(req.url, true);
    const qdata = q.query;
    var id = qdata.id; // extra param from front end
    var title = qdata.title; // extra param from front end
    var vidlink = 'https://www.youtube.com/watch?v=' + id;


    //TODO: NEED TO ADD ERROR HANDLING FOR INVALID LINK
    var stream = ytdl(vidlink);

    stream.on('error', (err) => {
        console.log("Invalid Link");
        app.locals.error = "Invalid Link";
        req.url = req.url + `&error=${app.locals.error}`;
        res.end();
    });

    res.setHeader('Content-disposition', 'attachment; filename=' + title + '.mp3');
    res.setHeader('Content-type', 'audio/mpeg');

    console.log('Downloading mp3');
    ffmpeg({source: stream})
        .toFormat('mp3')
        .on('end', function() {
            console.log('Finished Downloading mp3');
            res.end();
        })
        .on('error', function(error) {
            console.log('An error occured : ' + error.message);
            app.locals.error = "Unexpected Conversion Error";
            req.url = req.url + `&error=${app.locals.error}`;
            res.end();
        })
        .pipe(res, {end : true});
};


app.use(express.static('static'));
app.use('/css', express.static(__dirname + 'public/css'));
app.use('/js', express.static(__dirname + 'public/js'));
app.set('view engine', 'ejs');
app.use(express.urlencoded({extended : false}));

app.get('/' , (req, res) => {
    res.render('index.ejs');
});


app.post('/' , (req, res) => {
    const vidLink = req.body.ytlink;
    const id = getId(vidLink);
    const title = req.body.vidName;
    const submit = req.body.submit;
    return res.redirect( `/download?id=${id}&title=${title}&vidType=${submit}`);
});


//app.use(downloadVid);


//Puting this on midddleware causes header problems
//This is just more functional
app.get('/download', (req, res) => {
    const q = parse(req.url, true);
    const qdata = q.query;
    var id = qdata.id; // extra param from front end
    var title = qdata.title; // extra param from front end
    var vidType = qdata.vidType;
    var vidlink = 'https://www.youtube.com/watch?v=' + id;


    //TODO NEED TO SHOW ERROR IN THE FRONTEND
    if(vidType === 'mp4'){
        res.setHeader('Content-disposition', 'attachment; filename=' + title + '.mp4');
        res.setHeader('Content-type', 'audio/mpeg');

        var stream = ytdl(vidlink).pipe(res, {end:true});

        stream.on('error', (err) => {
            console.log("Invalid Link");
            res.end();
        });

        stream.on('finish', () => {
            console.log("Finished Downloading video");
            res.end();
        });
    }

    if(vidType === 'mp3'){
        var stream = ytdl(vidlink);

        stream.on('error', (err) => {
            console.log("Invalid Link");
            res.end();
        });

        res.setHeader('Content-disposition', 'attachment; filename=' + title + '.mp3');
        res.setHeader('Content-type', 'audio/mpeg');

        console.log('Downloading mp3');
        ffmpeg({source: stream})
            .toFormat('mp3')
            .on('end', function() {
                console.log('Finished Downloading mp3');
                res.end();
            })
            .on('error', function(error) {
                console.log('An error occured : ' + error.message);
                res.end();
            })
            .pipe(res, {end : true});
    }
});


app.listen(port, () => {
    console.log(`listening to port: ${port}`);
});