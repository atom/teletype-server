module.exports =
class CoturnIceServerProvider {
  constructor ({coturnUsername, coturnPassword}) {
      this.coturnUsername = coturnUsername
      this.coturnPassword = coturnPassword
  }

  async fetchICEServers () {
    return {ttl: 86400, servers: [
          {
              'urls': 'stun:stun.l.google.com:19302'
          },
          {
              'urls': 'turn:localhost:3478?transport=udp',
              'username': this.coturnUsername,
              'credential': this.coturnPassword
          },
          {
              'urls': 'turn:localhost:3478?transport=tcp',
              'username': this.coturnUsername,
              'credential': this.coturnPassword
          }
      ]
    }

  }
}
