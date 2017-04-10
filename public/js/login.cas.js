(function(angular){
	'use strict';

	angular.module(
		'sici.login.util', ['ngResource']
		).constant('SESSIONNAME', 'client_session'
		).constant('SESSIONTIME', 86400000
		).constant('TOKENNAME', 'token'
		).service('Session',
			['$rootScope', '$window', '$log', '$cookieStore', '$document', 'SESSIONNAME', 'SESSIONTIME', 'TOKENNAME',
				function ($rootScope, $window, $log, $cookieStore, $document, SESSIONNAME, SESSIONTIME, TOKENNAME){
				this.create = function (clientdata, token) {
					if (clientdata && token){
						clientdata.date = new Date().getTime();
						angular.extend(this, clientdata);

						$rootScope.setLogeado(true);
						$window.localStorage[SESSIONNAME] = JSON.stringify(clientdata);
						$window.localStorage[TOKENNAME] = token;

						return this;
					} else if ($window.localStorage[SESSIONNAME]){
						let success = false;
						const today = new Date().getTime();
						
						try {
							const suser = $window.localStorage[SESSIONNAME];

							if (suser){
								const user = JSON.parse(suser);
								
								if (user && (today - user.date) < SESSIONTIME) {
									angular.extend(this, user);
									$rootScope.setLogeado(true);
									success = true;
								}
							}

						} catch (exception) {
							success = false;
							this.destroy();
						}

						if (!success){
							this.destroy();

							return false;
						}

						return this;
					}

					return false;
				};
				this.destroy = function () {
					$window.localStorage[TOKENNAME] = '';
					$window.localStorage[SESSIONNAME] = '';
					Reflect.deleteProperty($window.localStorage, SESSIONNAME);
					Reflect.deleteProperty($window.localStorage, TOKENNAME);

					for (const attr in this){
						if (typeof this[attr] !== 'function'){
							Reflect.deleteProperty(this, attr);
						}
					}
					$rootScope.setLogeado(false);
					
					$cookieStore.remove('io');
					$document.cookie = 'io=; Path=/; HttpOnly; expires=Thu, 01 Jan 1970 00:00:00 UTC';
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
		]).run(['$rootScope', '$location', 'AuthService', '$log', '$http', '$window', 'Session',
			function ($rootScope, $location, AuthService, $log, $http, $window, Session) {
				if (typeof $location.search().ticket === 'string' && $location.search().ticket.trim() !== ''){
					$http.get('/api/authenticate', {'params': {'ticket': $location.search().ticket}}).then(function(res){
						const data = res.data;
						$log.info('Contraseña válida');
						Session.create(data.profile, data.token);
						$location.path('/welcome');
					}).catch(function(){
						$log.info('Contraseña no válida');
						Session.destroy();
					});
				} else {
					$rootScope.$on('$routeChangeStart', function (event, next) {
						if (!AuthService.isAuthenticated() && next && next.templateUrl !== 'partials/login.html'){
							$log.debug('No autenticado e intentando acceder a otra dirección. Vamos a login');
							Session.destroy();
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
					'carmlogin': true,
					login: function (credentials) {
						const urlconsulta = '/api/authenticate';
						$log.log('credentials', credentials);
						if (credentials.notcarmuser){

							return $http.post(urlconsulta, credentials).then(function(res){
								const data = res.data;
								$log.log('Contraseña válida');
								Session.create(data.profile, data.token);
							}, function(res){
								$log.log('Contraseña no válida', res);
								Reflect.deleteProperty($window.localStorage, 'token');
							});
						}
						const deferred = $q.defer();
						if (Session.create() && $rootScope.logeado){
							deferred.resolve();

							return deferred.promise;
						}
						
						$http.post(urlconsulta, credentials).then(function(res){
							const httpdata = res.data;
							$log.log('Autenticación CAS correcta', credentials);
							Session.create(httpdata.profile, httpdata.token);
							deferred.resolve(httpdata.profile);
						}, function(res){
							$log.log('Autenticación CAS fallida', res);
							Reflect.deleteProperty($window.localStorage, 'token');
							deferred.reject();
							if (typeof res.data.redirect === 'string'){
								
								$window.location.href = res.data.redirect;
							}
						});

						return deferred.promise;
					
					},
					user: function(){
						return Session;
					},
					logout: function() {
						$log.debug('en AuthService.logout');
						const username = Session.login;
						Session.destroy();

						return $http.post('/logout', {'username': username}).then(function(){
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
						return $window.localStorage.token && (Boolean(Session.login) || Boolean(Session.create()));
					},
					isAuthorized: function (/*authorizedRoles*/) {
						return true; // dejamos abierta la puerta a un futuro uso de esto
					}
				};
			}
		]).factory('AuthInterceptor', ['$rootScope', '$q', '$window', '$location', '$log', 'Session', 'TOKENNAME',
			function ($rootScope, $q, $window, $location, $log, Session, TOKENNAME) {
				return {
					request: function (config) {
						if ($window.localStorage[TOKENNAME]) {
							config.headers = config.headers || {};
							config.headers.Authorization = 'Bearer ' + $window.localStorage[TOKENNAME];
						}

						return config;
					},
					response: function (response) {
						if (response.status === 401){

							return $q.reject(response);
						}

						return response || $q.when(response);
					},
					responseError: function (response) {
						let txt = 'Error alguna petición realizada no pudo quedar satisfecha.',
							title = 'Error';
						switch (response.status){

							case 401:
								txt = 'Error';
								title = 'La sesión ha caducado o es inválida. Debe iniciar sesión para continuar.';
								Session.destroy();
								$location.path('/login');
							break;

							case 403:
								txt = 'Error';
								title = 'No tiene permiso para la funcionalidad solicitada';
							break;

							case 409:
								txt = 'Error';
								title = 'Algún recurso no pudo resolverse por faltar algún parámetro.';
							break;

							case 500:
								txt = 'Error alguna petición realizada no pudo quedar satisfecha por un fallo puntual del servidor.';
								title = 'Error';
							break;

							default:
						}

						$log.error(response);
						if (txt !== '' && title !== ''){
							$rootScope.toaster(txt, title, 'error');
						}

						return $q.reject(response);
					}
				};
			}
		]).config(function ($httpProvider) {
			$httpProvider.defaults.useXDomain = true;
			Reflect.deleteProperty($httpProvider.defaults.headers.common, 'X-Requested-With');
			$httpProvider.interceptors.push('AuthInterceptor');
		});
})(angular);
