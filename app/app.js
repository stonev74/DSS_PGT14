const express = require('express')
const app = express();
const port = 3000;
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const https = require('https');
const helmet = require('helmet');
const session = require('express-session');
const { db, db_posts } = require('./db.js');
const registerRoutes = require('./routes/registerroutes.js');
const authRoutes = require('./routes/authroutes.js');
const postRoutes = require('./routes/postroutes.js');
const striperoutes = require('./routes/striperoutes.js');

//session middleware -Vin
//memory store for session
const store = new session.MemoryStore();

app.use(
  session({
    //secret for signing/encrypting cookies, needs to be stored securely later
    secret: "dvndjfdnjkd",
    //cookie to store session idea, expires after 1 hr
    //need to figure out how to logout after cookie expiration, probably timeout function
    cookie: {
      maxAge: 3600000,
      httpOnly: true,
      //set false and lax for local development
      secure: 'auto',
      sameSite: "lax"
    },
    //two properties determining how often session object is saved
    resave: false,
    saveUninitialized: false,
    store
  })
);

app.use(helmet());

//changed to only static assets not html pages so they can't be accessed directly.
app.use('/css', express.static(__dirname + '/public/css'));
app.use('/js', express.static(__dirname + '/public/js'));
app.use('/imgs', express.static(__dirname + '/public/imgs'));
app.use('/json', express.static(__dirname + '/public/json'));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//db variables moved into db.js for cleanliness
//routes moved into router files for cleanliness
app.use('/register', registerRoutes(db));
app.use('/', authRoutes(db));
app.use('/', postRoutes(db_posts));
app.use('/', striperoutes(db));

// Landing page - Get the Graphic Input
app.get('/', async (req, res) => {
  const htmlRoot = path.join(__dirname, 'public', 'html');
  res.sendFile('graphic.html', { root: htmlRoot });
});


const certDir = path.resolve(__dirname, '..', 'certs');
const certPath = path.join(certDir, 'localhost-cert.pem');
const keyPath = path.join(certDir, 'localhost-key.pem');

//running server with https
let server;
if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
  const tlsOptions = {
    cert: fs.readFileSync(certPath),
    key: fs.readFileSync(keyPath)
  };

  server = https.createServer(tlsOptions, app).listen(port, () => {
    console.log(`My app listening on https://localhost:${port}`);
  });
} else {
  //runs via http if https not found
  console.warn('HTTPS certificates not found, falling back to HTTP.');
  console.warn(`Expected cert at: ${certPath}`);
  console.warn(`Expected key at: ${keyPath}`);

  server = app.listen(port, () => {
    console.log(`My app listening on http://localhost:${port}`);
  });
}

server.setTimeout ( 300000 );

app.use((req, res, next) => {
  req.on('aborted', () => {
    console.error(`Request aborted: ${req.method} ${req.originalUrl}`);
  });
  next();
});