const assert = require('assert')
const be = require('bejs')
const Session = require('../src/session')
const auth = new Session({
    secret: '@2e£$1#1&$23_-!',
    serverHost: 'www.mdslab.org',
    time: 1 // minutes
  })

let token = ''
const expiredToken = 'eyJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJ3d3cubWRzbGFiLm9yZyIsImV4cCI6IjIwMTctMDgtMTZUMDc6MjY6MTEuMzgyWiIsImlkIjoxLCJ0eXBlIjoidXNlciJ9.dVtZJYpPYuzdusGyI_-EwF1zpnSiJyFI7bbmOcJZLgA'

describe('createToken', function() {
  it('should return new token', async () => {
    token = await auth.createToken(1, 'user')
    console.log(token)
    assert.equal(be.emptyString(token), false)
  });

  it('should return new token with custom expiration', async () => {
    let exp = new Date().getTime() + (360000 * 24 * 30)
    token = await auth.createToken(1, 'user', exp)
    console.log(token)
    assert.equal(be.emptyString(token), false)
  });
});

describe('decodeToken', function() {
  it('should not return a decoded token', async () => {
    let result = await auth.decodeToken(token.substring(0, 10))
    console.log(result)
    assert.equal(result.hasOwnProperty('id'), false)
  });

  it('should return decoded token', async () => {
    let result = await auth.decodeToken(token)
    console.log(result)
    assert.equal(result.hasOwnProperty('id'), true)
  });
});


describe('check', function() {

  it('should return isLogged false', async () => {
    let result = await auth.check(token)
    console.log(result)
    assert.equal(result.isLogged, false)
  });

  it('should not decode the token', async () => {
    let result = await auth.check('JIUzI1NiJ9.eyJpc3MiOiJ3d')
    console.log(result)
    assert.equal(result.isLogged, false)
  });

  it('should return object with not valid token message', async () => {
    const session = {
        user: 1,
        token: expiredToken,
        exp: new Date().getTime() + 1,
        type: 'user'
      }
    await auth.insert(session)
    let result = await auth.check(expiredToken)
    console.log(result)
    assert.equal(result.isLogged, false)
  });

  it('should return session status object', async () => {
    const session = {
        user: 1,
        token,
        exp: new Date().getTime() + 1,
        type: 'user'
      }
    await auth.insert(session)
    let result = await auth.check(token)
    console.log(result)
    assert.equal(result.isLogged, true)
  });

});

describe('deleteToken', function() {
  it('should remove a token', async () => {
    await auth.deleteToken(token)
    let result = await auth.check(token)
    console.log(result)
    assert.equal(result.isLogged, false)
  });
});
