'use strict';

(function() {

    angular
        .module('mini', ['ui.router', 'ngSanitize', 'MassAutoComplete', 'ngResource', 'btford.socket-io'])
        .service('LoginService', ['$resource', loginservice])
        .controller('mainController', mainController)
        .controller('HomeController', HomeController)
        .directive('ngEnter', tapdirective)
        .factory('io', iofactory);



    function mainController($scope, $http, $timeout, $q, $sce) {
        var vm = this;
        $scope.title = "miniInbox";
        $scope.redirect = function() {
            window.location.href = '/auth/facebook';

        };
    }

    // ===============================================
    function HomeController($scope, $http, $rootScope, $timeout, $q, LoginService, $sce, io) {

        $scope.result1 = '';
        $scope.options1 = null;
        $scope.details1 = '';

        var socket = io.connect('http://localhost:3003/');
        LoginService.get(function(RES) {
                console.log(RES);
                $scope.user = RES.user;
                $scope.titlechat = "";
                $scope.entreMessage = "";
                $scope.Onlineuser = {};
                $scope.commingMessage = {};
                $scope.autolist = [];
                socket.on('connect', function() {

                    console.log("connection established")
                        // when the client emits 'sendchat', this listens and executes

                    // when the client emits 'adduser', this listens and executes
                    socket.emit('adduser', RES.user)

                    socket.on('updatechat', function(userID, id) {

                    });
                    socket.on('store_userID', function(userID) {
                        console.log('store_userID', userID)
                    })

                    socket.on('msg_user_found', function(val) {
                        console.log("val", val);
                        if (val != '' && $scope.entreMessage != '') {
                            if ($scope.commingMessage[val]) {
                                socket.emit('msg_user', val, RES.user.profileID, {
                                    userpic: RES.user.profilePic,
                                    message: $scope.entreMessage
                                })
                                $scope.commingMessage[val].push({
                                    pic: RES.user.fullname,
                                    message: $scope.entreMessage,
                                    userpic: RES.user.profilePic
                                });
                                console.log($scope.commingMessage);
                                $scope.entreMessage = '';
                                if (!$scope.$$phase) {
                                    //$digest or $apply
                                    $scope.$apply()
                                }

                            } else {
                                $scope.commingMessage[val] = [];
                                socket.emit('msg_user', val, RES.user.profileID, {
                                    userpic: RES.user.profilePic,
                                    message: $scope.entreMessage,
                                })
                                $scope.commingMessage[val].push({
                                    pic: RES.user.fullname,
                                    message: $scope.entreMessage,
                                    userpic: RES.user.profilePic
                                });
                                console.log($scope.commingMessage);
                                $scope.entreMessage = '';
                                if (!$scope.$$phase) {
                                    //$digest or $apply
                                    $scope.$apply()
                                }

                            }

                        }

                    })

                    socket.on('msg_user_handle', function(userID, msg) {
                        // console.log(userID, msg);
                        if ($scope.commingMessage[userID]) {
                            $scope.commingMessage[userID].push({
                                pic: userID,
                                message: msg.message,
                                userpic: msg.userpic
                            });
                            console.log($scope.commingMessage);
                            if (!$scope.$$phase) {
                                //$digest or $apply
                                $scope.$apply()
                            }
                        } else {
                            $scope.commingMessage[userID] = [];
                            $scope.commingMessage[userID].push({
                                pic: userID,
                                message: msg.message,
                                userpic: msg.userpic
                            });
                            console.log($scope.commingMessage);
                            if (!$scope.$$phase) {
                                //$digest or $apply
                                $scope.$apply()
                            }
                        }
                    })
                    socket.on('updateusers', function(usr) {
                        for (var id in usr) {
                            $scope.autolist.push({
                                    name: usr[id]['user']['fullname'],
                                    profileID: id,
                                    userPic: usr[id]['user']['profilePic'],
                                    socketID: usr[id]['socketID'],
                                })
                                // $scope.$apply()
                        }

                        $scope.Onlineuser = usr;
                        // for(key )
                        $scope.$apply()
                        console.log("$scope.Onlineuser", $scope.Onlineuser);
                        console.log($scope.autolist)
                    })

                    $scope.clickuser = function(key) {
                            $scope.titlechat = $scope.Onlineuser[key]['user']['fullname']
                            $scope.profileID = key;
                            if (!$scope.$$phase) {
                                //$digest or $apply
                                $scope.$apply()
                            }

                        }
                        // when the user sends a private msg to a user id, first find the userID
                    $scope.check_user = function() {
                            if ($scope.profileID != '' && $scope.Onlineuser[$scope.profileID]) {
                                socket.emit('check_user', RES.user.profileID, $scope.Onlineuser[$scope.profileID]['socketID'])
                            }
                        }
                        // when the user sends a private message to a user.. perform this
                        // $scope.msg_user = function(friend) {
                        //     socket.emit('msg_user', RES.user.fullname, friend.fullname, msg)
                        // }

                    $scope.sendMessage = function(msg) {
                        console.log($scope.Onlineuser[$scope.profileID])
                        console.log(msg);
                        if (msg != '') {
                            $scope.check_user()
                        }

                    }
                });
            })
            // =======================

        $scope.dirty = {};

        function highlight(str, term) {
            var highlight_regex = new RegExp('(' + term + ')', 'gi');
            return str.replace(highlight_regex,
                '<span class="highlight">$1</span>');
        };

        function suggest_users(term) {
            var q = term.toLowerCase().trim(),
                results = [];
            // console.log($scope.autolist)
            if ($scope.autolist.length != 0) {
                for (var i = 0; i < $scope.autolist.length; i++) {
                    var user = $scope.autolist[i];
                    if (user.name.toLowerCase().indexOf(q) !== -1)
                    // user.email.toLowerCase().indexOf(q) !== -1)
                        results.push({
                        value: user.name,
                        // Pass the object as well. Can be any property name.
                        obj: user,
                        label: $sce.trustAsHtml(

                            '<div class="row">' +
                            ' <div >' +
                            '<a class="pull-left">' +
                            '<img class="media-object img-circle" style="max-height:40px;" src="' + user.userPic + '"/>' +
                            '</a>' +
                            '<div class="media-body" >' +
                            '<h5>' + highlight(user.name, term) + '</h5>' +
                            '</div>' +
                            '</div>' +
                            '</div>'
                        )
                    });
                }
                $scope.results = results;
                if (!$scope.$$phase) {
                    //$digest or $apply
                    $scope.$apply()
                }
                console.log($scope.results)
                return results;

            }
        }
        $scope.ac_options_users = {
            suggest: suggest_users,
            on_select: function(selected) {
                console.log(selected);
                // console.log($scope.Onlineuser[$scope.profileID])
                $scope.clickuser(selected.obj.profileID)
            }
        };

    }
    // =====================================
    function loginservice($resource) {
        return $resource('/test');
    }

    function getuserservice($resource) {
        return $resource('/getuser');
    }


    function iofactory(socketFactory) {
        // var myIoSocket = io.connect('http://localhost:3003/roomlist');

        // var socket = socketFactory({
        //     ioSocket: myIoSocket
        // });

        return io;
    }

    function tapdirective() {
        return function(scope, element, attrs) {
            element.bind("keydown keypress", function(event) {
                if (event.which === 13) {
                    scope.$apply(function() {
                        scope.$eval(attrs.ngEnter);
                    });

                    event.preventDefault();
                }
            });
        };
    }
})();