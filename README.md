node-restover
=

A small express based rest api for Pushover
-

Used to send push notifications to mobile devices with the pushover app installed

Requires typescript 2+

Install
--
1. Clone the repository
1. `yarn` or `npm install`
1. `yarn run build` or `npm build`
1. Edit config.json

Run
-
`node dist/index.js`

Use
-
POST request to `http://<address>:<port>/send`

Body properties:

- `message` (required): The message!
- `device`: A specific device to sent the message to
- `title`: The title of the message
- `url`: A url to include
- `url_title`: a title for the url
- `priority`: message priority, see pushover docs
- `timestamp`: A unix timestamp that will be displayed on the device
- `sound`: The name of the sound to play, see pushover docs

TODOs
-
- HTTPS
- Auth/Access Control
