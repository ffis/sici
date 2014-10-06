'use strict';

/* Services */


// Demonstrate how to register services
// In this case it is a simple value service.

angular.module('myApp.services', ['ngResource'])
    .factory('Arbol', ['$resource',
        function ($resource) {
            return $resource('/api/arbol', {}, { query: {method:'GET', isArray:true} });
		}])
    .factory('Procedimiento', ['$resource',
        function ($resource) {
            return $resource('/api/procedimiento/:CODIGO', {}, {  });
		}])
    .factory('ProcedimientoList', ['$resource',
        function ($resource) {
            return $resource('/api/procedimientoList/:idjerarquia', {}, { query: {method:'GET', isArray:true} });
		}])
	.factory('DetalleCarmProcedimiento', ['$resource',
        function ($resource) {
            return $resource('/api/gs/:CODIGO', {}, {});
		}])
	.factory('DetalleCarmProcedimiento2', ['$resource',
        function ($resource) {
            return $resource('/api/cr/:CODIGO', {}, {});
		}])
	.factory('Raw', ['$resource',
        function ($resource) {
            return $resource('/api/raw/:model', {}, {});
		}])
	.factory('Aggregate', ['$resource',
        function ($resource) {
            return $resource('/api/aggregate/:campo/:restriccion', {}, { query: {method:'GET', isArray:true} });
		}])
	.factory('AuthService',	 ['$http','Session','$rootScope', '$location', '$route',
		function ($http, Session, $rootScope, $location, $route) {

		  return {
			login: function (credentials, $scope) {
				/** hacemos un post a la dirección del login. Esperamos respuesta. Si statusCode=401 hay error de autenticación **/				
				return $http
			  ({
				method:'POST',
				url: '/login',
				data: 'username='+credentials.username+"&password="+credentials.password,
				headers: {'Content-Type': 'application/x-www-form-urlencoded'}
			  })				
			  .then(function (res) {
					/** si el post acaba en éxito creamos la sesión con los valores resultantes **/
					$scope.mensaje = '';
					$location.path('/');
					Session.create(res.data);
					$rootScope.logeado=true;
					$route.reload();					
				},function(res){
					/** si error de login 401 **/
					$scope.mensaje = (res.status==401 ? 'Usuario o contraseña incorrectos': '');					
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
				return !!Session.userId || !!Session.create() ;
			},
			isAuthorized: function (authorizedRoles) {
				return true; // dejamos abierta la puerta a un futuro uso de esto
			}
		  };
	}])
	.service('Session', ['$rootScope', 
		function ($rootScope) {
			this.userId = false;
	  		this.create = function (data) {
			    if (data)
			    {
			        this.id = data.login;
					this.userId = data.login;	
					data.userId = data.login;
					this.habilitado = data.habilitado;
					this.nombre = data.nombre;
					this.img = data.img;
					data.date = new Date().getTime();
					$rootScope.setLogeado(true);
					sessionStorage.setItem('client_session',JSON.stringify(data));
					return this;
			    }else if (sessionStorage.getItem('client_session'))
				{
					console.log("Cargando desde session storage");
					var suser, user;
					suser = sessionStorage.getItem('client_session');			
					suser && (user = JSON.parse(suser));
					var today = new Date().getTime();
					if (user && (today - user.date) < 60*60*1000) {
						this.id = user.id;
						this.userId = user.userId;
						this.nombre = user.nombre;
						this.perfil = user.perfil;
						this.img = user.img;
						this.date = user.date;
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
				//this.userRole = null;
				sessionStorage.setItem('client_session',"");
				sessionStorage.removeItem('client_session');
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
			if (!AuthService.isAuthenticated() &&  next &&  next.templateUrl != 'partials/partial0.html'){
				console.info('No autenticado e intentando acceder a otra dirección. Vamos a login');
				$location.path('/login');
			}
			else if (AuthService.isAuthenticated() &&  next  && next.templateUrl == 'partials/partial0.html') {
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
	.config(function ($httpProvider) {
	  $httpProvider.interceptors.push([
		'$injector',
		function ($injector) {
		  return $injector.get('AuthInterceptor');
		}
	  ]);
	})	
	.factory('AuthInterceptor', ['$rootScope', '$q', 'AUTH_EVENTS','$location','Session',
	    function ($rootScope, $q, AUTH_EVENTS,$location,Session) {
	      return {
		    responseError: function (response) {
		      if (response.status === 401) {
			    $rootScope.$broadcast(AUTH_EVENTS.notAuthenticated, response);
			    //parche sesión caducada o inexistente por reinicio del servidor
                sessionStorage.setItem('client_session',"");
		        Session.id = null;
		        Session.userId = null;
                $location.path('/login');
		      }
		      if (response.status === 403) {
			    $rootScope.$broadcast(AUTH_EVENTS.notAuthorized, response);
		      }
		      if (response.status === 419 || response.status === 440) {
			    $rootScope.$broadcast(AUTH_EVENTS.sessionTimeout, response);
		      }
		      return $q.reject(response);
		    }
	      };
	    }])		
	.value('version', '0.1');
