//security test for login rate limiter
const express = require('express');
const session = require('express-session');
const request = require('supertest');
const authRoutes = require('../../app/routes/authroutes.js');

describe('login rate limit', () => {
    it('returns 429 after repeated attempts', async () => {
        const app = express();
        app.use(express.json());
        app.use(session({ secret: 'test', resave: false, saveUninitialized: true}));
        app.use('/', authRoutes({ one: async() => ({ check: 1 }) }));
        let status = 0;
        for (let i = 0; i < 12; i++){
            const res = await request(app)
            .post('/password')
            .send({ username_input: 'u', password_input: 'p'});
            status = res.status;
        }
        if (status !== 429) throw new Error('Expected 429 after limit');
    });
});