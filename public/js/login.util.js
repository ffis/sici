angular.module('sici.login.util', ['ngResource'])
	.service('Session', ['$rootScope','$window', 
		function ($rootScope, $window ) {
			this.userId = false;
	  		this.create = function (data) {
			    if (data)
			    {
					data.date = new Date().getTime();
			    	for(var attr in data)
					{
						this[attr] = data[attr];
					}
					
					$rootScope.setLogeado(true);
					$window.localStorage.client_session = JSON.stringify(data);
					return this;
			    }else if ($window.localStorage.client_session)
				{
					console.log("Cargando desde session storage");
					var suser, user;
					suser =$window.localStorage.client_session;			
					suser && (user = JSON.parse(suser));
					var today = new Date().getTime();
					if (user && (today - user.date) < 60*60*1000) {
						for(var attr in user)
						{
							this[attr] = user[attr];
						}
						console.log('Válido');
						$rootScope.setLogeado(true);
					}
					if (user) console.log((today - user.date) < 60*60*1000)
					console.log(user);
					
					return this;
				}
				return false;
			  };
			  this.destroy = function () {
				this.id = null;
				this.userId = null;
				//double remove
				$window.localStorage.client_session = '';
				delete $window.localStorage.client_session;
				$rootScope.setLogeado(false); 
			  };
			  return this;
	}])	
	.run(['$rootScope', 'AUTH_EVENTS', 'AuthService',
		function ($rootScope, AUTH_EVENTS, AuthService) {
		  $rootScope.$on('$stateChangeStart', function (event, next) {		
			if (!AuthService.isAuthenticated()) {
				event.preventDefault();
				$rootScope.$broadcast(AUTH_EVENTS.notAuthenticated);		 
			}
		  });
	 }])
	.run(['$rootScope', '$location', 'AuthService',
		function ($rootScope, $location, AuthService) {
		  $rootScope.$on('$routeChangeStart', function (event, next, current) {		
			if (!AuthService.isAuthenticated() &&  next &&  next.templateUrl != 'partials/login.html'){
				console.info('No autenticado e intentando acceder a otra dirección. Vamos a login');
				$location.path('/login');
			}
			else if (AuthService.isAuthenticated() &&  next  && next.templateUrl == 'partials/login.html') {
				console.info('Autenticado e intentando acceder a login. Vamos a /');
				$location.path('/welcome');
			} else if (next && next.templateUrl) {
				//ignorable
				console.log(next.templateUrl);
			}else{
				console.log(next);
			}
		});
	}])
	.factory('AuthService',	 ['$http','Session','$rootScope', '$location', '$route','$window',
		function ($http, Session, $rootScope, $location, $route, $window) {

		  return {
			login: function (credentials) {
				/** hacemos un post a la dirección del login. Esperamos respuesta. Si statusCode=401 hay error de autenticación **/				
				return $http.post('/authenticate', credentials)
				  	.success(function (data, status, headers, config) {
						$window.localStorage.token = data.token;
						console.error('Contraseña válida');
						Session.create(data.profile);
					}).error(function(data, status, headers, config){
						console.error('Contraseña no válida');
						delete $window.localStorage.token;
					});
			},
			user: function(){
			    return Session;
			},
			logout : function() {
				console.log('en AuthService.logout');
				Session.destroy();
				$rootScope.setLogeado(false);
				$rootScope.logeado=false;

				return /*(!!Session.userId || !!Session.create()) &&*/
				$http(
					{
						method:'POST',
						url: '/logout',
						data: 'username='+Session.userId
					}).then(function(res){		
						console.log('74')
						$location.path('/login');
						$route.reload();
					},function(res){
						console.log(res.statusCode);
						$location.path('/login');
						$route.reload();	
					});
			},			
			isAuthenticated: function () {
				return  $window.localStorage.token && (!!Session.userId || !!Session.create()) ;
			},
			isAuthorized: function (authorizedRoles) {
				return true; // dejamos abierta la puerta a un futuro uso de esto
			}
		  };
	}])
	.factory('AuthInterceptor', ['$rootScope','$q','$window','$location',
		function ($rootScope, $q, $window, $location) {
		  return {
				request: function (config) {
				  config.headers = config.headers || {};
				  if ($window.localStorage.token) {
				    config.headers.Authorization = 'Bearer ' + $window.localStorage.token;
				  }
				  return config;
				},
				response: function (response) {
				  if (response.status === 401) {
				    // handle the case where the user is not authenticated
				    return $q.reject(response);
				  }
				  return response || $q.when(response);
				},
				responseError: function (response) {
				  if (response.status === 401) {
				  	$window.localStorage.token = '';
				   /* $location.path('/login'); ??? */
				  }
				  if (response.status === 403) {
				    $window.localStorage.token = '';
				  }
				  return $q.reject(response);
				}
			};
		}
	])
