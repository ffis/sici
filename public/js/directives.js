(function(angular, $){ 'use strict';
    angular.module('sici.directives', []).
      directive('appVersion', ['version', function(version) {
        return function(scope, elm) {
          elm.text(version);
        };
    }])
    .filter('orderObjectBy', function(){
        return function(input, attribute, reverse) {
            if (!angular.isObject(input)){ return input; }
            var array = [];
            for(var objectKey in input){
                array.push(input[objectKey]);
            }
            array.sort(function(a, b){
                if (typeof a[attribute] === 'string'){
                    return a[attribute].localeCompare( b[attribute] );
                }else if (Array.isArray(attribute)) {
                    var c = 0;
                    for(var i = 0; i < attribute.length && c === 0; i++)
                    {
                        var aux = attribute[i];
                        if (typeof a[aux] === 'string'){ c = a[aux].localeCompare( b[aux] );}
                        else{ c = a[aux] - b[aux]; }
                    }
                    return c;
                }
                return a[attribute] - b[attribute];
            });
            if (typeof reverse !== 'undefined' && reverse){
                array.reverse();
            }
            return array;
        };
    })
    .directive('scrollToItem', function() {
        return {
            restrict: 'A',
            scope: { scrollTo: "@" },
            link: function(scope, $elm) {
                $elm.on('click', function() {
                    angular.element('html,body').animate({scrollTop: $(scope.scrollTo).offset().top - 80 }, 'slow');
                });
            }
        };
    })
    .directive('fileInput', ['$parse', function($parse){
        return {
            restrict: 'A',
            link: function(scope, elm, attrs){
                elm.bind('change', function(){
                    $parse(attrs.fileInput).assign(scope, elm[0].files);
                    scope.$apply();
                });
            }
        };
    }])
    .constant('AUTH_EVENTS', {
          loginSuccess: 'auth-login-success',
          loginFailed: 'auth-login-failed',
          logoutSuccess: 'auth-logout-success',
          sessionTimeout: 'auth-session-timeout',
          notAuthenticated: 'auth-not-authenticated',
          notAuthorized: 'auth-not-authorized'
    });
})(angular, $);
