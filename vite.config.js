export default {
  server: {
    host: '0.0.0.0',
    allowedHosts: [ process.env[ 'REPLIT_DOMAINS' ].split( ',' )[0]]
  }
}