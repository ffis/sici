(function(angular){
	'use strict';
	angular.module('sici')
		.controller('LogoutCtrl', ['$scope', '$rootScope', '$routeParams', '$location', 'AuthService', 'AUTH_EVENTS', '$window', '$http', '$log',
			function ($scope, $rootScope, $routeParams, $location, AuthService, AUTH_EVENTS, $window, $http, $log){

				$log.error('intentando destruir sesión');
				$scope.imagen = 'background: transparent url("/imgs/flag.svg")';

				$window.document.title = 'Sesión cerrada';
				//$scope.login = Session.create();
				//Session.destroy();
				AuthService.logout();
				$rootScope.setLogeado(false);

				if ($rootScope.loginCarm){
					$http.get('/SICI_SSO/Logout').success(function(){
						$log.log('Sesión cerrada');
					});
				}

				$scope.back = function() { window.history.back(); };
				$scope.logout = function(){ AuthService.logout(); };
				$scope.mensaje = '';
			}
		])
		.controller('LoginCtrl', ['$scope', '$rootScope', 'AUTH_EVENTS', 'AuthService', '$window', '$location', '$route', '$log',
			function ($scope, $rootScope, AUTH_EVENTS, AuthService, $window, $location, $route, $log)
			{
				$log.error('intentando destruir sesión');

				$window.document.title = 'Inicio de sesión';
				$scope.imagen = 'background: transparent url("/imgs/flag.svg")';
				$scope.back = function() { window.history.back(); };
				$scope.logout = function(){ AuthService.logout();	};
				/*** inicializamos la credenciales a valores vacíos **/
				$scope.credentials = { username: '', password: '' };
				/** login será una función que comprueba las credenciales y propaga un evento
					loginSuccess o loginFailed dependiendo de si ha sido o no autenticado
					el usuario **/
				$scope.login = function (credentials) {
					/** preguntamos si se ha conseguido o no autenticar mediante la función login del servicio AuthService descrito más abajo **/
					if(!$rootScope.loginCarm && (credentials.username.trim() === '' || credentials.password.trim() === '' ))
					{
						$scope.mensaje = 'Introduzca su nombre de usuario y contraseña para continuar';
					}else{
						AuthService.login(credentials).then(
							function() {
								$log.log('OK?');
								$rootScope.$broadcast(AUTH_EVENTS.loginSuccess);
								$scope.mensaje = '';
								$location.path('/');
								$rootScope.logeado = true;
								$route.reload();
							},
							function(){
								$log.error('KO?');
								$scope.mensaje = 'Error: Usuario o contraseña incorrectos';
								$rootScope.$broadcast(AUTH_EVENTS.loginFailed);
								$scope.credentials.password = '';
							}
						);
					}
				};
				$scope.mensaje = '';
			}
		]);
})(angular);
