const jws = require('jws')
const redis = require('redis')
const TOKEN_NOT_VALID = 'Token is not valid'

class Session {
  /**
   * constructor config
   * @param  {string} secret a secret key used to generate the token
   * @param  {string} serverHost hostname of the server
   * @param  {int}    time minutes of life for the token
   */
  constructor(config){
    this.secret = config.secret
    this.server = config.serverHost
    this.time = config.time
    this.client = redis.createClient({ host: config.redisHost })
  }

  /**
   * insert admin or user session
   * @param  {int}  session.user id of the user
   * @param  {string}  session.token generated token
   * @param  {unixtime}  session.exp expiration time of token
   */
  async insert(session){
    await this.client.set(`${session.type}-${session.user}`, `${session.token}`, 'EX', session.exp)
  }

  /**
   * deleteToken description
   * @param  {type}  token user token
   */
  async deleteToken(token){
    const decoded = await this.decodeToken(token)
    await this.client.del(`${decoded.type}-${decoded.id}`)
  }

  /**
   * check the token status
   * @param  {string}  token        user token
   * @param  {object}  error        internal error list params
   * @return {Object}  isLogged: boolean, token: 'string', message: 'string', updated: boolean
   */
  async check(token){

    let isLogged = false
    let message = null

    const decoded = await this.decodeToken(token)

    if(!decoded){

      message = TOKEN_NOT_VALID

    } else {

      if(new Date() > new Date(decoded.exp)){

        await this.client.del(`${decoded.type}-${decoded.id}`)
        message = TOKEN_NOT_VALID

      } else {

        const storedToken = await this.retrieveKey(`${decoded.type}-${decoded.id}`)

        if(storedToken === token)
          isLogged = true

      }
    }

    return { isLogged, token, message }
  }

  /**
   * createToken
   * @param  {type}  id user id or anything that you like to use as identificator
   * @return {string}   token
   */
  async createToken(id, type, exp) {
    let expiration = null

    if(exp === undefined){
      const time = new Date()
      time.setMinutes(time.getMinutes() + this.time)
      expiration = time
    } else {
      expiration = new Date(exp)
    }

    const payload = {
      iss: this.server,
      exp: expiration,
      id: id,
      type: type
    }

    return await jws.sign({ header: { alg: 'HS256' }, payload: payload, secret: this.secret })
  }

  /**
   * decodeToken return the information crypted inside the token
   * @param  {type}    token description
   * @return {decoded} contain serverHost, expiration date and an identificator
   */
  async decodeToken(token) {
  	let decoded = false
    try {
      await jws.verify(String(token), 'HS256', String(this.secret))
  		decoded = await jws.decode(token)
  		decoded = JSON.parse(decoded.payload)
  	}
  	catch(error) {
      if(error){
        return false
      }
    }
  	return decoded
  }

  /**
   * retrieveKey return the information crypted inside the token
   * @param  {key}     id that we want search
   * @return {object}  return value or error
   */
  async retrieveKey(key) {

    return new Promise((resolve, reject) => {
      this.client.get(`${key}`, function (err, value){
         if (err){
           reject(err)
           return
         }
         resolve(value)
      })
    })

  }

}

module.exports = Session
