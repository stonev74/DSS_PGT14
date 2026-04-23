//security test for protected routes
const express = require('express');
const session = require('express-session');
const request = require('supertest');
const postRoutes = require('../../app/routes/postroutes.js');

describe('protected routes', () => {
    it('GET /index.html returns 403 when unauthenticated', async () => {
        const app = express();
        app.use(express.json());
        app.use(session({ secret: 'test', resave: false, saveUninitialized: true }));
        app.use('/', postRoutes({ proc: async() => {} }));
        const res = await request(app).get('/index.html')
        if (res.status !== 403) throw new Error('Expected 403');
    });
});