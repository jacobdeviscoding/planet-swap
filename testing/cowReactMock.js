const React = require('react')

// Unit tests must not execute the app entry (it boots the router, store, and network).
const UserContext = React.createContext(undefined)

module.exports = { UserContext }
