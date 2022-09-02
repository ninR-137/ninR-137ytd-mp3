const express = require('express');
const pathToFfmpeg = require('ffmpeg-static');
const ffmpeg = require('fluent-ffmpeg');
const ytdl = require('ytdl-core');
const fs = require('fs');
const url = require('url');
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
    const q = url.parse(req.url, true);
    const qdata = q.query;
    var id = qdata.id; // extra param from front end
    var title = qdata.title; // extra param from front end
    var vidlink = 'https://www.youtube.com/watch?v=' + id;


    console.log('Downloading MP4');


    var stream = ytdl(vidlink);

    res.setHeader('Content-disposition', 'attachment; filename=' + title + '.mp3');
    res.setHeader('Content-type', 'audio/mpeg');

    console.log('Downloading mp3');
    ffmpeg({source: stream})
        .toFormat('mp3')
        .on('end', function() {
            console.log('Finished Downloading mp3');
            next();
        })
        .on('error', function(error) {
            console.log('An error occured ' + error.message);
        })
        .pipe(res, {end:true});
};


app.set('view engine', 'ejs');
app.use(express.urlencoded({extended : false}));

app.get('/' , (req, res) => {
    res.render('index.ejs');
});


app.post('/' , (req, res) => {
    const vidLink = req.body.ytlink;
    const id = getId(vidLink);
    const title = req.body.vidName;
    res.redirect( `/download?id=${id}&title=${title}`);
});


//app.use(downloadVid);


//FOR NOW USING THE GET REQUEST TO DOWNLOAD THE FILE WHEN IT SHOULD BE HANDLE BY THE MIDDDLEWARE FUNCTION
app.get('/download', (req, res) => {
    const q = url.parse(req.url, true);
    const qdata = q.query;
    var id = qdata.id; // extra param from front end
    var title = qdata.title; // extra param from front end
    var vidlink = 'https://www.youtube.com/watch?v=' + id;


    console.log('Downloading MP4');


    var stream = ytdl(vidlink);

    res.setHeader('Content-disposition', 'attachment; filename=' + title + '.mp3');
    res.setHeader('Content-type', 'audio/mpeg');

    console.log('Downloading mp3');
    ffmpeg({source: stream})
        .toFormat('mp3')
        .on('end', function() {
            console.log('Finished Downloading mp3');
        })
        .on('error', function(error) {
            console.log('An error occured ' + error.message);
        })
        .pipe(res, {end:true});
});


app.listen(port, () => {
    console.log(`listening to port: ${port}`);
});