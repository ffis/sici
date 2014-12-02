function LoginAsCtrl ($rootScope, $scope, $http, $window) {

	$scope.datosusuario = false;
	$scope.mensaje = false;
	$scope.fake = function(login){

		if (login!=''){
			alert('Autenticando como:' +login)
		  	$http.post('/api/pretend/'+login, {username:login}).
		  		success(function(data, status, headers, config) {
		  			$scope.datosusuario = data;
			  		console.log(data);
			  		console.log(status);
//			  		profile: o, token: token
			  		$scope.mensaje = false;
				}).
				error(function(data, status, headers, config) {
					$scope.mensaje = 'Error descargando datos. Pruebe con otro usuario.'
				});		
		}else{
			$scope.mensaje = 'Error descargando datos. Pruebe con otro usuario.'
		}
	} 

	$scope.confirm = function(){
		if ($scope.datosusuario){
			$window.localStorage.client_session = JSON.stringify($scope.datosusuario.profile);
			$window.localStorage.token = $scope.datosusuario.token;
			$rootScope.setLogeado(true);
		}
	} 

}

LoginAsCtrl.$inject = ['$rootScope','$scope', '$http','$window'];
