const express = require('express')
const app = express();
const port = 3000;

const pgp = require ('pg-promise')();

// Create the posts JSON from database

const cn_posts =   {
    host: 'db',
    port: 5432,
    database: 'blogapp',
    user: 'blogapp_user',
    password: 'blogapp_user_password',
    max: 30 // use up to 30 connections

    
};

const db_posts = pgp (cn_posts);

 



const cn =  {
    host: 'db',
    port: 5432,
    database: 'blogapp',
    user: 'blogapp_admin',
    password: 'blogapp_admin_password',
    max: 30 // use up to 30 connections

    
};
const db = pgp(cn);

var bodyParser = require('body-parser');
const fs = require('fs');

app.use(express.static(__dirname + '/public'));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Landing page
app.get('/', async (req, res) => {
    /// send the static file
    res.sendFile(__dirname + '/public/html/login.html', (err) => {
        if (err){
            console.log(err);
        }
    })

       console.log ( ' Do I get here - line 22 of app.js');

     const post_data = await db_posts.manyOrNone ( 'select postid, username , entrytime, title ,content from posts inner join  blogapp_admin.user_vw on blogapp_admin.user_vw.id= posts.userid  ');

       let data_posts = JSON.stringify(post_data);
   fs.writeFileSync(__dirname + '/public/json/posts.json', data_posts);

});



// Reset login_attempt.json when server restarts
let login_attempt = {"username" : "null", "password" : "null"};
let data = JSON.stringify(login_attempt);
fs.writeFileSync(__dirname + '/public/json/login_attempt.json', data);

// Store who is currently logged in
let currentUser = null;

// Login POST request
app.post('/',  async (req, res) => {

    // Get username and password entered from user
    var username = req.body.username_input;
    var password = req.body.password_input;
 

   const login_check = await  db.one('SELECT check_user_login ($1,$2, $3, $4) as check', [username, password , 'localhost','127.0.0.1']) ;
    // Valid username and password both entered together
    
    if(login_check.check == 0 ) {
        // Update login_attempt with credentials
        let login_attempt = {"username" : username, "password" : password};
        let data = JSON.stringify(login_attempt);


       fs.writeFileSync(__dirname + '/public/json/login_attempt.json', data);

        // Update current user upon successful login
        currentUser = req.body.username_input;

        // Check if user is a subscriber

        const subs = await db.one ( 'select role from user_vw where username = $1', [currentUser]);

        console.log ( ' Got here - line 105 - subs.role is ' + subs.role );
           // Redirect to home page
        if ( subs.role == 'CONTRIBUTOR') {

            console.log ( ' Got here - line 104 - CONTRIB - subs.role is ' + subs.role );
            res.sendFile(__dirname + '/public/html/index.html', (err) => {
              if (err){
                  console.log(err);
              }
            })
        } 
        else {
            console.log ( ' Got here - line 112 - SUBS - subs.role is ' + subs.role );
        res.sendFile(__dirname + '/public/html/index_subs.html', (err) => {
            if (err){
                console.log(err);
            }
            })

        }
    }  
    else {
        // Resend the failed login page
        res.sendFile(__dirname + '/public/html/login_failed.html', (err) => {
        if (err){
            console.log(err);
        }
    })
    }

});

// Make a post POST request
app.post('/makepost', async function(req, res) {
  console.log ( 'Makepost called ');
    // Read in current posts
    const json = fs.readFileSync(__dirname + '/public/json/posts.json');
    var posts = JSON.parse(json);

    // Get the current date
    let curDate = new Date();
    curDate = curDate.toLocaleString("en-GB");

    // Find post with the highest ID
    let maxId = 0;
    for (let i = 0; i < posts.length; i++) {
        if (posts[i].postId > maxId) {
            maxId = posts[i].postId;
        }
    }

    // Initialise ID for a new post
    let newId = 0;

    // If postId is empty, user is making a new post
    if(req.body.postId == "") {
        newId = maxId + 1;
    } else { // If postID != empty, user is editing a post
        newId = req.body.postId;

        // Find post with the matching ID, delete it from posts so user can submit their new version
        let index = posts.findIndex(item => item.postId == newId);
        posts.splice(index, 1);
    }

    // Add post to posts.json
    posts.push({"username": currentUser , "timestamp": curDate, "postId": newId, "title": req.body.title_field, "content": req.body.content_field});

    fs.writeFileSync(__dirname + '/public/json/posts.json', JSON.stringify(posts));

    // Write post to database, after checking for 
    const query_post = 'with user_w as (select id as userid from blogapp_admin.user_vw  where username=$1) \
           insert into posts ( userid, title, content )   select userid , $2 as title, $3 as content from user_w;';
 
    await db_posts.none (query_post, [ currentUser,  req.body.title_field ,req.body.content_field]);
 


    // Redirect back to my_posts.html
    res.sendFile(__dirname + "/public/html/my_posts.html");
 });

 // Delete a post POST request
 app.post('/deletepost', (req, res) => {

    // Read in current posts
    const json = fs.readFileSync(__dirname + '/public/json/posts.json');
    var posts = JSON.parse(json);

    // Find post with matching ID and delete it
    let index = posts.findIndex(item => item.postId == req.body.postId);
    posts.splice(index, 1);

    // Update posts.json
    fs.writeFileSync(__dirname + '/public/json/posts.json', JSON.stringify(posts));

    res.sendFile(__dirname + "/public/html/my_posts.html");
 });

const server = app.listen(port, () => {
    console.log(`My app listening on port ${port}!`)
});

server.setTimeout ( 300000);


app.use((req, res, next) => {
  req.on('aborted', () => {
    console.error(`Request aborted: ${req.method} ${req.originalUrl}`);
  });
  next();
});