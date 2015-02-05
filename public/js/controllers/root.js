(function(angular, document, $, Blob, saveAs){
	'use strict';
	angular.module('sici')
	.controller('AppCtrl', ['$window', '$q', '$scope', '$rootScope', '$log', 'Session', '$location', 'PermisosCalculados', 'AuthService',
		function ($window, $q, $scope, $rootScope, $log, Session, $location, PermisosCalculados, AuthService) {

		$rootScope.setTitle = function (title){ $scope.name = title; };
		$rootScope.setLogeado = function(t){
			$rootScope.logeado = t;
			if (t && typeof $rootScope.permisoscalculados === 'undefined') {
				$rootScope.permisoscalculados = PermisosCalculados.query({});
			}else if (!t) {
				delete $rootScope.permisoscalculados;
			}
		};
		$rootScope.session = Session;
		$rootScope.nav = '';
		$rootScope.logeado = false;
		$rootScope.meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
		var IEChecker = /MSIE [6789]+/i;
		var browser = $window.navigator.userAgent;
		$rootScope.navegabilidad = [
			{ id: 'inicio', caption: 'Inicio' },
			{ id: 'actividad', caption: 'Actividad' },
			{ id: 'stats', caption: 'Estadísticas' },
			{ id: 'errors', caption: 'Incoherencias' },
			{ id: 'inconsistencias', caption: 'Inconsistencias' },
			{ id: (IEChecker.test(browser) ? 'updateIE' : 'update'), caption: 'Actualizar mediante fichero' },
			{ id: 'http://intranet.carm.es/web/integra.servlets.Blob?ARCHIVO=GU%CDA%20R%C1PIDA.pdf&TABLA=ARCHIVOS&CAMPOCLAVE=IDARCHIVO&VALORCLAVE=103830&CAMPOIMAGEN=ARCHIVO&IDTIPO=60', caption: 'Ayuda'},
			{ id: 'logout', caption: 'Salir' }
		];
		$rootScope.navegabilidadSuper = [
			{ id: 'recalculate', caption: 'Recalcular datos' },
			{ id: 'permisos', caption: 'Gestionar permisos' },
			{ id: 'etiqueta', caption: 'Gestionar etiquetas'},
			{ id: 'periodos', caption: 'Gestionar períodos'},
			{ id: 'crearprocedimiento', caption: 'Crear procedimiento'},
			{ id: 'loginas', caption: 'Cambiar de usuario'},
			{ id: 'informes', caption: 'Informes'}
		];

		$rootScope.loginCarm = AuthService.carmlogin;

		$rootScope.irProcedimiento = function(){
			if (parseInt($rootScope.procedimiento) > 0){
				$location.path('/procedimiento/' + $rootScope.procedimiento);
			}
		};

		$rootScope.colorText = function(i, numcolors, phase)
		{
			if (typeof phase === 'undefined'){ phase = 0; }
			var center = 128, width = 127, frequency = Math.PI * 2 / numcolors;
			return {
				red: Math.ceil(Math.sin(frequency * i + 2 + phase) * width + center),
				green: Math.ceil(Math.sin(frequency * i + 0 + phase) * width + center),
				blue: Math.ceil(Math.sin(frequency * i + 4 + phase) * width + center)
			};
		};
		$rootScope.colorToHex = function(color){
			var rgb = color.blue | (color.green << 8) | (color.red << 16),
			s = rgb.toString(16);
			return '#' + '000000'.substring(0, 6 - s.length) + s;
		};

		$rootScope.exportXLS = function(idx, nombre){
			var blob = new Blob(['<meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8"><table width="100%">' + document.getElementById(idx).innerHTML + '</table>'], {
				type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8'
			});
			saveAs(blob, nombre + '.xls');
		};

		$rootScope.exportDOC = function (idx, nombre) { $log.error('not supported');
			return false;
		};

		$rootScope.R = function (procedimiento) {
			var def = $q.defer();
			$rootScope.permisoscalculados.$promise.then(function () {
				def.resolve(
						$rootScope.permisoscalculados.procedimientoslectura.indexOf(procedimiento.codigo) !== -1 ||
						$rootScope.permisoscalculados.procedimientosescritura.indexOf(procedimiento.codigo) !== -1
						);
			}, function () {
				def.reject();
			});
			return def.promise;
		};

		$rootScope.W = function (procedimiento) {
			var def = $q.defer();
			$rootScope.permisoscalculados.$promise.then(function () {
				def.resolve( $rootScope.permisoscalculados.procedimientosescritura.indexOf(procedimiento.codigo) !== -1 );
			}, function () {
				def.reject();
			});
			return def.promise;
		};

		$rootScope.superuser = function () {
			var defsuperuser = $q.defer();
			$rootScope.permisoscalculados.$promise.then(function () {
				defsuperuser.resolve( !!$rootScope.permisoscalculados.superuser );
			}, function () {
				defsuperuser.reject();
			});
			return defsuperuser.promise;
		};

		$rootScope.jerarquialectura = function () {
			var def = $q.defer();
			$rootScope.permisoscalculados.$promise.then(function () {
				def.resolve( $rootScope.permisoscalculados.jerarquialectura);
			}, function () {
				def.reject();
			});
			return def.promise;
		};

		$rootScope.jerarquiaescritura = function () {
			var def = $q.defer();
			$rootScope.permisoscalculados.$promise.then(function () {
				def.resolve( $rootScope.permisoscalculados.jerarquiaescritura);
			}, function () {
				def.reject();
			});
			return def.promise;
		};

		$rootScope.grantoption = function () {
			var def = $q.defer();
			$rootScope.permisoscalculados.$promise.then(function () {
				def.resolve( $rootScope.permisoscalculados.grantoption);
			}, function () {
				def.reject();
			});
			return def.promise;
		};

		$rootScope.recalcularpermisos = function()
		{
			if ($rootScope.logeado) {
				$rootScope.permisoscalculados = PermisosCalculados.query({});
			}
		};

		$rootScope.$on('$locationChangeSuccess', function(){
			angular.element('.navbar-collapse').removeClass('in');
		});
	}
	]);
})(angular, document, $, Blob, saveAs);
