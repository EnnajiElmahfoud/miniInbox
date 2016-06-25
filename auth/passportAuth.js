module.exports = function(passport, FacebookStrategy, config, mongoose) {

    var chatUser = new mongoose.Schema({
        profileID: String,
        fullname: String,
        profilePic: String,
        friends: []
    })

    var userModel = mongoose.model('chatUser', chatUser);

    passport.serializeUser(function(user, done) {
        done(null, user.id);
    })

    passport.deserializeUser(function(id, done) {
        userModel.findById(id, function(err, user) {
            done(err, user);
        })
    })

    passport.use(new FacebookStrategy({
        clientID: config.fb.appID,
        clientSecret: config.fb.appSecret,
        callbackURL: config.fb.callbackURL,
        scope: ['user_friends'],
        profileFields: ['id', 'displayName', 'photos', 'friends']
    }, function(accessToken, refreshToken, profile, done) {
        //check if rthe user exist in the db if not create one and retrun the profile
        //if exist tghen return the user
         userModel.findOne({
                'profileID': profile.id
            }, function(err, result) {
            if (result) {
                result.friends= profile._json.friends.data;
                result.fullname= profile.displayName;
                result.profilePic= profile.photos[0].value || '';
                result.save(function(err) {
                    done(null, result);
                });
            } else {
                var newChatUser = new userModel({
                    profileID: profile.id,
                    fullname: profile.displayName,
                    profilePic: profile.photos[0].value || '',
                    friends: profile._json.friends.data
                });

                newChatUser.save(function(err) {
                    done(null, newChatUser);
                });
            }
        })

    }));
}