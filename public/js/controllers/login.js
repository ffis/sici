(function(angular){
	'use strict';
	angular.module('sici').controller('LogoutCtrl', ['$scope', '$rootScope', '$routeParams', '$location', 'AuthService', 'AUTH_EVENTS', '$window', '$http',
		function ($scope, $rootScope, $routeParams, $location, AuthService, AUTH_EVENTS, $window, $http){
			$scope.imagen = 'background: transparent url("/imgs/flag.svg")';

			$rootScope.setTitle('Sesión cerrada');
			AuthService.logout();
			$rootScope.setLogeado(false);

			if ($rootScope.loginCarm){
				$rootScope.toaster('Sesión cerrada');
			}

			$scope.back = function(){ $window.history.back(); };
			$scope.logout = function(){ AuthService.logout(); };
			$scope.mensaje = '';
		}
	]).controller('LoginCtrl', ['$scope', '$rootScope', 'AUTH_EVENTS', 'AuthService', '$window', '$location', '$route', '$log', '$timeout',
		function ($scope, $rootScope, AUTH_EVENTS, AuthService, $window, $location, $route, $log, $timeout){

			if (AuthService.isAuthenticated()){
				$location.path('/welcome');
			}

			$rootScope.loginCarm = true;
			$rootScope.setTitle('Inicio de sesión');
			$scope.imagen = 'background: transparent url("/imgs/flag.svg")';
			$scope.credentials = {'username': '', 'password': '', 'notcarmuser': false};
			$scope.hideForm = function(){
				$rootScope.loginCarm = true;
				$scope.credentials.notcarmuser = false;
			};
			$scope.showForm = function(){
				$rootScope.loginCarm = false;
				$scope.credentials.notcarmuser = true;
			};
			$scope.login = function (credentials){
				if (!$rootScope.loginCarm && (credentials.username.trim() === '' || credentials.password.trim() === '' )){
					$scope.mensaje = 'Introduzca su nombre de usuario y contraseña para continuar';
				} else {
					if (AuthService.isAuthenticated()){
						$log.debug('Ya autenticado JWT');
						$rootScope.$broadcast(AUTH_EVENTS.loginSuccess);
						$scope.mensaje = '';
						$location.path('/welcome');
						$rootScope.logeado = true;
						$route.reload();
					} else {
						$log.debug('No autenticado, let\'s test');
						AuthService.login(credentials).then(function() {
							$log.debug('Login success');
							$rootScope.$broadcast(AUTH_EVENTS.loginSuccess);
							$scope.mensaje = '';
							$location.path('/welcome');
							$rootScope.setLogeado(true);
							$route.reload();
						}, function(){
							$log.debug('Failure');
							$timeout(function(){
								$scope.mensaje = 'Error: Usuario o contraseña incorrectos';
							}, 100);
							$rootScope.$broadcast(AUTH_EVENTS.loginFailed);
							$scope.credentials.password = '';
						});
					}
				}
			};
			$scope.mensaje = '';
		}
	]);
})(angular);
