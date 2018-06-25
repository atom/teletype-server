module.exports =
class TwilioIceServerProvider {
  constructor ({twilioAccount, twilioAuthToken}) {
      this.twilioAccount = twilioAccount
      this.twilioAuthToken = twilioAuthToken
  }

  async fetchICEServers () {
    const twilioICEServerURL = `https://${this.twilioAccount}:${this.twilioAuthToken}@api.twilio.com/2010-04-01/Accounts/${this.twilioAccount}/Tokens.json`

    const response = JSON.parse(await request.post(twilioICEServerURL))
    return {ttl: parseInt(response.ttl), servers: response.ice_servers}

  }
}
