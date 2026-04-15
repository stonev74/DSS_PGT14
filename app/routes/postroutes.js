//routes involving displaying and making posts
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const xss = require('xss');
const { authenticateUser } = require('../authorizeuser.js');
const { getPosts } = require('../getposts.js');

module.exports = (db_posts) => {
  const htmlRoot = path.join(__dirname, '..', 'secured', 'html');

  //middleware for refreshing posts.json
  const refreshPosts = async (req, res, next) => {
    try {
      await getPosts(db_posts);
    } catch (err) {
      console.error('Failed to refresh posts:', err);
      res.status(500).send('Unable to get posts.');
    }
    next();
  };

  //get route for contrib homepage
  router.get('/index.html', authenticateUser, refreshPosts, (req, res) => {
    //checks role if user exists
    const role = req.session.user?.role;

    // console.log('Line 184, role is ' + role);
    //only send to regular index if contributor
    if (role === 'CONTRIBUTOR') {
      res.sendFile('index.html', { root: htmlRoot });
    }
    //redirects to sub index
    return res.redirect('/index_subs.html');
  });

  //get route for sub home page
  router.get('/index_subs.html', authenticateUser, refreshPosts, (req, res) => {
    res.sendFile('index_subs.html', { root: htmlRoot });
  });

  //get route to give current user to front end
  router.get('/current-user', authenticateUser, (req, res) => {
    return res.json({ username: req.session.user.username });
  });

  //get route for posts page
  router.get('/posts', authenticateUser, refreshPosts, (req, res) => {
    res.sendFile('posts.html', { root: htmlRoot });
  });

  //get route for my_posts page
  router.get('/my_posts', authenticateUser, (req, res) => {
    res.sendFile('my_posts.html', { root: htmlRoot });
  });

  // Make a post POST request
  router.post('/makepost', authenticateUser, async (req, res) => {
    // console.log('Makepost called ');
    // Read in current posts
    const json = fs.readFileSync(path.join(__dirname, '..', 'public', 'json', 'posts.json'));
    const posts = JSON.parse(json);
    // Get the current date
    let curDate = new Date();
    curDate = curDate.toLocaleString('en-GB');
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
    if (req.body.postId == '') {
      newId = maxId + 1;
    } else { // If postID != empty, user is editing a post
      newId = req.body.postId;

      // Find post with the matching ID, delete it from posts so user can submit their new version
      let index = posts.findIndex(item => item.postId == newId);
      posts.splice(index, 1);
    }
    // Clean posts
    var clean_title = xss(req.body.title_field);
    var clean_content = xss(req.body.content_field);
    // Add post to posts.json
    posts.push({ 'username': req.session.user.username, 'timestamp': curDate, 'postId': newId, 'title': clean_title, 'content': clean_content });

    fs.writeFileSync(path.join(__dirname, '..', 'public', 'json', 'posts.json'), JSON.stringify(posts));

    // Write post to database
    await db_posts.proc('insert_post', [req.session.user.username, clean_title, clean_content]);

    // Redirect back to my_posts.html
    res.sendFile(path.join(__dirname, '..', 'secured', 'html', 'my_posts.html'));
  });

  // Delete a post POST request
  router.post('/deletepost', authenticateUser, (req, res) => {
    // Read in current posts
    const json = fs.readFileSync(path.join(__dirname, '..', 'public', 'json', 'posts.json'));
    var posts = JSON.parse(json);

    // Find post with matching ID and delete it
    let index = posts.findIndex(item => item.postId == req.body.postId);
    posts.splice(index, 1);

    // Update posts.json
    fs.writeFileSync(path.join(__dirname, '..', 'public', 'json', 'posts.json'), JSON.stringify(posts));

    res.sendFile(path.join(__dirname, '..', 'secured', 'html', 'my_posts.html'));
  });

  return router;
};
