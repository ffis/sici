function LogoutCtrl($scope,$rootScope, $routeParams, $location,AuthService,AUTH_EVENTS,$window){
	console.error('intentando destruir sesión')
	$scope.imagen = "background: transparent url('imgs/flag.svg')";
	$window.document.title ='Sesión cerrada';
	//$scope.login = Session.create();
	//Session.destroy();
	AuthService.logout();
	$rootScope.setLogeado(false);

	$window.document.title ='Inicio de sesión';

	$scope.imagen = "background: transparent url('/imgs/flag.svg')";
	$scope.back = function() { window.history.back(); };
	/*** inicializamos la credenciales a valores vacíos **/
	$scope.credentials = { username: '', password: '' };
	/** login será una función que comprueba las credenciales y propaga un evento 
	    loginSuccess o loginFailed dependiendo de si ha sido o no autenticado 
	    el usuario **/
	$scope.login = function (credentials) {
	    /** preguntamos si se ha conseguido o no autenticar mediante la función login del servicio AuthService descrito más abajo **/
	    if(credentials.username.trim()=='' ||credentials.password.trim()=='' )
	    {
	     	$scope.mensaje = 'Introduzca su nombre de usuario y contraseña para continuar';
	    }else{
	        AuthService.login(credentials,$scope).then(
		        function() {
			        $rootScope.$broadcast(AUTH_EVENTS.loginSuccess);
		        },
		        function(){
			        $rootScope.$broadcast(AUTH_EVENTS.loginFailed);
		        }
	        );
	    }
	};
	$scope.logout = function(){  AuthService.logout();	}
	$scope.mensaje = '';
} 

function LoginCtrl($scope, $rootScope, AUTH_EVENTS, AuthService, $window, $location,$route) { 
                //$spMenu.hide();
  console.log('LoginCtrl');
	$window.document.title ='Inicio de sesión';

	$scope.imagen = "background: transparent url('/imgs/flag.svg')";
	$scope.back = function() { window.history.back(); };
	/*** inicializamos la credenciales a valores vacíos **/
	$scope.credentials = { username: '', password: '' };
	/** login será una función que comprueba las credenciales y propaga un evento 
	    loginSuccess o loginFailed dependiendo de si ha sido o no autenticado 
	    el usuario **/
	$scope.login = function (credentials) {
	    /** preguntamos si se ha conseguido o no autenticar mediante la función login del servicio AuthService descrito más abajo **/
	    if(!$rootScope.loginCarm && (credentials.username.trim()=='' ||credentials.password.trim()=='' ))
	    {
	     	$scope.mensaje = 'Introduzca su nombre de usuario y contraseña para continuar';
	    }else{

	        AuthService.login(credentials).then(
		        function() {
		        	console.log('OK?');
			        $rootScope.$broadcast(AUTH_EVENTS.loginSuccess);
					$scope.mensaje = '';
					$location.path('/');
					$rootScope.logeado = true;
					$route.reload();
		        },
		        function(){
		        	console.error('KO?');
		        	$scope.mensaje = 'Error: Usuario o contraseña incorrectos';	
			        $rootScope.$broadcast(AUTH_EVENTS.loginFailed);
			        $scope.credentials.password='';
		        }
	        );
	    }
	};
	$scope.logout = function(){  AuthService.logout();	}
	$scope.mensaje = '';
	
}


LogoutCtrl.$inject = ['$scope', '$rootScope','$routeParams', '$location','AuthService','AUTH_EVENTS','$window'];
LoginCtrl.$inject =  ['$scope', '$rootScope', 'AUTH_EVENTS','AuthService','$window','$location','$route'];
