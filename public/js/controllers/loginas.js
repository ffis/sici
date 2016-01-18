(function(angular){
	'use strict';
	angular.module('sici')
		.controller('LoginAsCtrl', ['$rootScope', '$scope', '$http', '$window', 'Session',
			function ($rootScope, $scope, $http, $window, Session) {
				$scope.datosusuario = false;
				$scope.actualuser = JSON.parse($window.localStorage.client_session);
				$scope.mensaje = false;
				$scope.fake = function(login){
					if (login !== ''){
						$http.post('/api/v1/restricted/pretend/' + login, {username: login}).
							success(function(data) {
								$scope.datosusuario = data;
								$scope.actualuser = JSON.parse($window.localStorage.client_session);
								$scope.mensaje = false;
							}).
							error(function() {
								$scope.mensaje = 'Error descargando datos. Pruebe con otro usuario.';
							});
					}else{
						$scope.mensaje = 'Error descargando datos. Seleccione un usuario.';
					}
				};

				$scope.confirm = function(){
					if ($scope.datosusuario){
						$rootScope.recalcularpermisos();
						$window.localStorage.token = $scope.datosusuario.token;
						Session.create($scope.datosusuario.profile);
						$rootScope.setLogeado(true);
						$scope.actualuser = JSON.parse($window.localStorage.client_session);
					}
				};
			}
		]
	);
})(angular);
