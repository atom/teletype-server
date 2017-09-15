module.exports =
class ICEServerRegistry {
  constructor ({request, twilioAccount, twilioAuthToken}) {
    this.request = request
    this.twilioICEServerURL = `https://${twilioAccount}:${twilioAuthToken}@api.twilio.com/2010-04-01/Accounts/${twilioAccount}/Tokens.json`
  }

  async getServers () {
    const response = await this.request.post(this.twilioICEServerURL)
    return JSON.parse(response).ice_servers
  }
}
