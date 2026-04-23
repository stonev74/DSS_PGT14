//system test for checking roles for route
const express = require('express');
const session = require('express-session');
const request = require('supertest');
const { expect } = require('chai');
const postRoutes = require('../../app/routes/postroutes.js');

function createAppWithRole(role){
    const app = express();
    app.use(express.json());
    //logged in user with chosen role
    app.use(session({ secret: 'test', resave: false, saveUninitialized: true }));
    app.use((req, res, next) => {
        req.session.authenticated = true;
        req.session.user = { username: 'test', role };
        next();
    });
    //refreshPosts mockup
    const dbPostsStub = {
        manyOrNone: async() => []
    };
    app.use('/', postRoutes(dbPostsStub));
    return app;
}

describe('role route checks', () => {
    it('GET /index.html redirects SUBSCRIBER to /index_subs.html', async() => {
        const app = createAppWithRole('SUBSCRIBER');
        const res = await request(app).get('/index.html');

        expect(res.status).to.equal(302);
        expect(res.headers.location).to.equal('/index_subs.html')
    });
    it('GET /index.html for CONTRIBUTOR', async() => {
        const app = createAppWithRole('CONTRIBUTOR');
        const res = await request(app).get('/index.html');

        expect(res.status).to.equal(200);
    });
})