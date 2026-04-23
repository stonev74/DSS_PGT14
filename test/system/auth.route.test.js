//system test for authentication route
const express = require('express');
const session = require('express-session');
const request = require('supertest');
const authRoutes = require('../../app/routes/authroutes.js');

describe('auth routes', () => {
    let app;
    //beforeEach sets up app and session before testing each route
    beforeEach(() => {
        app = express();
        app.use(express.json());
        app.use(session({ secret: 'test', resave: false, saveUninitialized: true }));
        app.use('/', authRoutes({ one: async() => ({ check: 1})}));
    });
    it('GET /login returns 200', async() => {
        const res = await request(app).get('/login');
        if (res.status !== 200) throw new Error('Expected 200');
    });
    it('GET /index.html with cont role', async() => {
        session.role = 'CONTRIBUTOR';
        const res = await request(app).get('/index');
        
    })
    it('GET /index redirects with sub role', async() => {
        session.role = 'SUBSCRIBER';
        const res = await request(app).get('/index');
        
    })
});