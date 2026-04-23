//unit test for authenticating user
const { expect } = require('chai');
//sinon for creating mocks etc for tests
const sinon = require('sinon');
const { authenticateUser } = require('../../app/authorizeuser.js');

describe('authenticateUser', () => {
    it("authenticateUser calls next when authenticated", () => {
        const req = { session: {authenticated: true} };
        const res = { status : sinon.stub().returnsThis(), send: sinon.stub() };
        const next = sinon.stub();

        authenticateUser(req, res, next);
        expect(next.calledOnce).to.equal(true);
    });

    it("authenticateUser returns 403 when not authenticated", () => {
        const req = { session: {authenticated: false } };
        const res = { status: sinon.stub().returnsThis(), send: sinon.stub() };
        const next = sinon.stub();
        
        authenticateUser(req, res, next);
        expect(res.status.calledWith(403)).to.equal(true);
        expect(next.called).to.equal(false);
    });
    
    
});
