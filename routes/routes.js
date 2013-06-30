/**
 * routes.js
 */

module.exports = function(app) {
  app.use(require('../modules/topic.js'));
  app.use(require('../modules/auth.js'));
  app.use(require('../modules/session.js'));


  app.get("/server/status", function(req, res) {
    return res.type('txt').send('online');
  });
};