var
    async = require('async'),
    error = require('./../../error'),
    response = require('./../../util/response.js');

// @todo: move decision var to config
// @todo: add state

module.exports = function(req, res, client, scope, user, redirectUri) {

    var
        accessTokenValue;

    async.waterfall([
        // Check user decision
        function(cb) {
            if (!req.body || typeof(req.body['decision']) == 'undefined')
                cb(new error.invalidRequest('No decision parameter passed'));
            else if (req.body['decision'] == 0)
                cb(new error.accessDenied('User denied the access to the resource'));
            else {
                req.oauth2.logger.debug('Decision check passed');
                cb();
            }
        },
        // Generate new accessToken and save it
        function(cb) {
            accessTokenValue = req.oauth2.model.accessToken.generateToken();
            req.oauth2.model.accessToken.save(accessTokenValue, user, client, scope, req.oauth2.model.accessToken.ttl, function(err) {
                if (err)
                    cb(new error.serverError('Failed to call accessToken::save method'));
                else {
                    req.oauth2.logger.debug('Access token saved: ', accessTokenValue);
                    cb();
                }
            });
        }
    ],
    function(err) {
        if (err) response.error(req, res, err, redirectUri);
        else{
            data =  {
                token_type:    "bearer",
                access_token:  accessTokenValue
            }
            if(req.oauth2.model.accessToken.ttl)
                data.expires_in = req.oauth2.model.accessToken.ttl;

            response.data(req, res, data, redirectUri, true);
        }
     });
};