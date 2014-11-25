'use strict';

/* Directives */


angular.module('sici.directives', []).
  directive('appVersion', ['version', function(version) {
    return function(scope, elm, attrs) {
      elm.text(version);
    };
  }])
  .filter('orderObjectBy',function(){
        return function(input, attribute, reverse) {
            if (!angular.isObject(input)) return input;
            var array = [];
            for(var objectKey in input){
                array.push(input[objectKey]);
            }
            array.sort(function(a,b){
                if (typeof a[attribute] == 'string')
                    return a[attribute].localeCompare( b[attribute] );
								else if (Array.isArray(attribute)) {
									var c=0;
									for(var i=0;i<attribute.length;i++)
									{
										var aux = attribute[i];						
										if (typeof a[aux] == 'string') c = a[aux].localeCompare( b[aux] );							 
										else c = a[aux] - b[aux];
										if (c!=0) break;						
									}
									return c;
								}
                return a[attribute] - b[attribute];
            });
            if (typeof reverse != 'undefined' && reverse)
                array.reverse();
            
            return array;
        }
    })  
.directive('scrollToItem', function() {                                                      
    return {                                                                                 
        restrict: 'A',                                                                       
        scope: {                                                                             
            scrollTo: "@"                                                                    
        },                                                                                   
        link: function(scope, $elm,attr) {                                                   

            $elm.on('click', function() {                                                    
                $('html,body').animate({scrollTop: $(scope.scrollTo).offset().top-80 }, "slow");
            });                                                                              
        }                                                                                    
    }})
 .constant('AUTH_EVENTS', {
		      loginSuccess: 'auth-login-success',
		      loginFailed: 'auth-login-failed',
		      logoutSuccess: 'auth-logout-success',
		      sessionTimeout: 'auth-session-timeout',
		      notAuthenticated: 'auth-not-authenticated',
		      notAuthorized: 'auth-not-authorized',
	    })
	    .config(function ($httpProvider) {
	      $httpProvider.interceptors.push([
		    '$injector',
		    function ($injector) {
		      return $injector.get('AuthInterceptor');
		    }
	      ]);
	    })  
  ;
