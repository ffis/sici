angular.module('sici.login.util', ['ngResource'])
	.service('Session', ['$rootScope','$window', '$log', '$cookieStore',
		function ($rootScope, $window, $log, $cookieStore ) {
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
					$log.debug("Cargando desde session storage");
					var suser, user;
					suser =$window.localStorage.client_session;			
					suser && (user = JSON.parse(suser));
					var today = new Date().getTime();
					if (user && (today - user.date) < 24*60*60*1000) {
						for(var attr in user)
						{
							this[attr] = user[attr];
						}
						$rootScope.setLogeado(true);
					}else{
						$window.localStorage.client_session = '';
						delete $window.localStorage.client_session;
						$rootScope.setLogeado(false); 
					}
					
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
				/*Set-Cookie:JSESSIONID=; Path=/SICI_SSO/; HttpOnly*/
				$http.get('/SICI_SSO/Logout').success(function(){
					console.log('Sesión cerrada');
				});
				$cookieStore.remove("JSESSIONID");
				document.cookie = "JSESSIONID=; Path=/SICI_SSO/; HttpOnly; expires=Thu, 01 Jan 1970 00:00:00 UTC";
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
	.run(['$rootScope', '$location', 'AuthService','$log',
		function ($rootScope, $location, AuthService, $log) {
		  $rootScope.$on('$routeChangeStart', function (event, next, current) {		
			if (!AuthService.isAuthenticated() &&  next &&  next.templateUrl != 'partials/login.html'){
				$log.debug('No autenticado e intentando acceder a otra dirección. Vamos a login');
				$location.path('/login');
			}
			else if (AuthService.isAuthenticated() &&  next  && next.templateUrl == 'partials/login.html') {
				$log.debug('Autenticado e intentando acceder a login. Vamos a /');
				$location.path('/welcome');
			} else if (next && next.templateUrl) {
				//ignorable
				$log.debug(next.templateUrl);
			}else{
				$log.debug(next);
			}
		});
	}])
	.factory('AuthService',	 ['$http','Session','$rootScope', '$location', '$route','$window','$log', '$q',
		function ($http, Session, $rootScope, $location, $route, $window,$log, $q) {

		  return {
			login: function (credentials) {
				var urlconsulta = '/SICI_SSO/LoginSSO';
				var urllogin = '/SICI_SSO/';
				
				var deferred = $q.defer()
				$http.get(urlconsulta).success(
					function(data, status, headers, config){
						if (typeof data.t === 'undefined') {								
							$log.info('URL sesión no iniciada');
							var full = location.protocol+'//'+location.hostname+(location.port ? ':'+location.port: '');
							window.location.href=full+urllogin;
						}else{
							
							/** hacemos un post a la dirección del login. Esperamos respuesta. Si statusCode=401 hay error de autenticación **/				
							$http.post('/authenticate', data)
								.success(function (data, status, headers, config) {
									$window.localStorage.token = data.token;
									$log.info('Contraseña válida');
									Session.create(data.profile);
									deferred.resolve(data.profile);
								}).error(function(data, status, headers, config){
									$log.info('Contraseña no válida');
									delete $window.localStorage.token;
									deferred.reject();
								});
						}
					}
				).error(function(data, status, headers, config){
					$log.info('URL sesión no iniciada');
					alert('He fallado '+ JSON.stringify(data));
					deferred.reject();
				});
				return deferred.promise;
				
				
			},
			user: function(){
			    return Session;
			},
			logout : function() {
				$log.debug('en AuthService.logout');
				Session.destroy();
				$rootScope.setLogeado(false);
				$rootScope.logeado = false;

				return /*(!!Session.userId || !!Session.create()) &&*/
				$http(
					{
						method:'POST',
						url: '/logout',
						data: 'username='+Session.userId
					}).then(function(res){		
						$log.debug('74')
						$location.path('/login');
						$route.reload();
					},function(res){
						$log.debug(res.statusCode);
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
	.factory('AuthInterceptor', ['$rootScope','$q','$window','$location','Session',
		function ($rootScope, $q, $window, $location,Session) {
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
				  	Session.destroy();
				    $location.path('/login');//si no tiene sesion se manda a login
				  }
				  if (response.status === 403) {
				    $window.localStorage.token = '';
					Session.destroy();
				  }
				  return $q.reject(response);
				}
			};
		}
	])
	.config(function ($httpProvider) {
		$httpProvider.defaults.useXDomain = true;
        delete $httpProvider.defaults.headers.common['X-Requested-With'];
		$httpProvider.interceptors.push('AuthInterceptor');
	})
