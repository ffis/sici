(function(angular){ 'use strict';
angular.module('sici.login.util', ['ngResource']).service('Session',
	['$rootScope', '$window', '$log', '$cookieStore',
		function ($rootScope, $window, $log, $cookieStore) {
			this.userId = false;
			this.create = function(data){

				if (data){
					data.date = new Date().getTime();
					for (let attr in data){
						this[attr] = data[attr];
					}

					$rootScope.setLogeado(true);
					$window.localStorage.client_session = JSON.stringify(data);

					return this;
				} else if ($window.localStorage.client_session){
					$log.debug('Cargando desde session storage');
					var suser, user;
					suser = $window.localStorage.client_session;
					if (suser){
						user = JSON.parse(suser);
					}
					const today = new Date().getTime();
					if (user && (today - user.date) < 86400000) { /* 1 day */
						for (let attr in user){
							this[attr] = user[attr];
						}
						$rootScope.setLogeado(true);
					} else {
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
				$cookieStore.remove('JSESSIONID');
				document.cookie = 'JSESSIONID=; Path=/SICI_SSO/; HttpOnly; expires=Thu, 01 Jan 1970 00:00:00 UTC';
			};

			return this;
		}
	]).run(['$rootScope', 'AUTH_EVENTS', 'AuthService',
		function ($rootScope, AUTH_EVENTS, AuthService) {
			$rootScope.$on('$stateChangeStart', function (event) {
				if (!AuthService.isAuthenticated()) {
					event.preventDefault();
					$rootScope.$broadcast(AUTH_EVENTS.notAuthenticated);
				}
			});
		}
	]).run(['$rootScope', '$location', 'AuthService', '$log', '$http', '$window',
		function ($rootScope, $location, AuthService, $log, $http, $window) {
			if (typeof $location.search().ticket === 'string' && $location.search().ticket.trim() !== ''){
				$http.get('/api/authenticate', {'params': {'ticket': $location.search().ticket}}).success(function(data){
					$window.localStorage.token = data.token;
					$log.info('Contraseña válida');
					Session.create(data.profile);
					$location.path('/welcome');
				}).error(function(){
					$log.info('Contraseña no válida');
					delete $window.localStorage.token;
				});
			} else {
				$rootScope.$on('$routeChangeStart', function (event, next) {
					if (!AuthService.isAuthenticated() && next && next.templateUrl !== 'partials/login.html'){
						$log.debug('No autenticado e intentando acceder a otra dirección. Vamos a login');
						$location.path('/login');
					} else if (AuthService.isAuthenticated() && next && next.templateUrl === 'partials/login.html') {
						$log.debug('Autenticado e intentando acceder a login. Vamos a /');
						$location.path('/welcome');
					} else if (next && next.templateUrl) {
						//ignorable
						$log.debug(next.templateUrl);
					} else {
						$log.debug(next);
					}
				});
			}
		}
	]).factory('AuthService', ['$http', 'Session', '$rootScope', '$location', '$route', '$window', '$log', '$q',
		function ($http, Session, $rootScope, $location, $route, $window, $log, $q) {
			return {
				carmlogin: true,
				login: function (credentials) {
					$log.log('credentials', credentials);
					if (Boolean(credentials.notcarmuser)){

						return $http.post('/api/authenticate', credentials).success(function(data){
							$window.localStorage.token = data.token;
							$log.info('Contraseña válida');
							Session.create(data.profile);
						}).error(function(){
							$log.info('Contraseña no válida');
							delete $window.localStorage.token;
						});
					} else {

						if (Session.create() && $rootScope.logeado){
							const deferred = $q.defer();
							deferred.resolve();

							return deferred.promise;
						}
						
						const urlconsulta = '/api/authenticate';
						const deferred = $q.defer();
						$http.get(urlconsulta).then(function(data){
							$log.log(data);

							if (typeof data.t === 'undefined'){
								$log.info('URL sesión no iniciada');
								var full = location.protocol + '//' + location.hostname + (location.port ? ':' + location.port : '');
								$window.location.href = full + urllogin;
							} else {
								/** hacemos un post a la dirección del login. Esperamos respuesta. Si statusCode=401 hay error de autenticación **/
								$http.post('/api/authenticate', data)
									.success(function (httpdata) {
										$window.localStorage.token = httpdata.token;
										$log.info('Contraseña válida');
										Session.create(httpdata.profile);
										deferred.resolve(httpdata.profile);
									}).error(function(){
										$log.info('Contraseña no válida');
										delete $window.localStorage.token;
										deferred.reject();
									});
							}
						}, function(res){
							$log.log('130', res.data);
							//$log.info('URL sesión no iniciada');
							//$window.alert('He fallado ' + JSON.stringify(data));

							if (typeof res.data.redirect === 'string'){
								$log.log('136', res.data.redirect);
								$window.location.href = res.data.redirect;
							}

							deferred.reject();
						});

						return deferred.promise;
					}
				},
				user: function(){
					return Session;
				},
				logout: function() {
					$log.debug('en AuthService.logout');
					var username = Session.userId;
					Session.destroy();
					$rootScope.setLogeado(false);
					$rootScope.logeado = false;

					return $http({
							method: 'POST',
							url: '/logout',
							data: JSON.stringify({ username: username })
						}).then(function(){
							$log.debug('74');
							$location.path('/login');
							$route.reload();
						}, function(res){
							$log.debug(res.statusCode);
							$location.path('/login');
							$route.reload();
						});
				},
				isAuthenticated: function () {
					return $window.localStorage.token && (Boolean(Session.userId) || Boolean(Session.create()));
				},
				isAuthorized: function (authorizedRoles) {
					return true; // dejamos abierta la puerta a un futuro uso de esto
				}
			};
		}
	])
	.factory('AuthInterceptor', ['$rootScope', '$q', '$window', '$location', '$log', 'Session',
		function ($rootScope, $q, $window, $location, $log, Session) {
			return {
				request: function (config) {
					config.headers = config.headers || {};
					if ($window.localStorage.token) {
						config.headers.Authorization = 'Bearer ' + $window.localStorage.token;
					}

					return config;
				},
				response: function (response) {
					if (response.status === 401) { // handle the case where the user is not authenticated

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
					if (response.status === 403){
						var txt = 'Error',
							title = 'No tiene permiso para la funcionalidad solicitada';
						$log.error(response);
						$rootScope.toaster(txt, title, 'error');
					}
					if (response.status === 500){
						var txt = 'Error alguna petición realizada no pudo quedar satisfecha.',
							title = 'Error';
						$log.error(response);
						$rootScope.toaster(txt, title, 'error');
					}

				/* 403 => usuario autenticado pero sin permiso para esta funcionalidad.
					if (response.status === 403) {
					$window.localStorage.token = '';
					Session.destroy();
					}
				  */
					return $q.reject(response);
				}
			};
		}
	])
	.config(function ($httpProvider) {
		$httpProvider.defaults.useXDomain = true;
		delete $httpProvider.defaults.headers.common['X-Requested-With'];
		$httpProvider.interceptors.push('AuthInterceptor');
	});
})(angular);