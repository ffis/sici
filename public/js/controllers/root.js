(function(angular, document, $, Blob, saveAs, Feedback){
	'use strict';
	angular.module('sici')
	.controller('AppCtrl', ['$window', '$q', '$scope', '$rootScope', '$log', 'Session', '$location', '$http', 'PermisosCalculados', 'AuthService',
		function ($window, $q, $scope, $rootScope, $log, Session, $location, $http, PermisosCalculados, AuthService) {

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
			{ id: '#', caption: 'Reportes', sub: [
				{ id: 'informes', caption: 'Informes', icon: 'fa-file-excel-o' },
				{ id: 'stats', caption: 'Estadísticas', icon: 'fa-bar-chart' },
				{ id: 'errors', caption: 'Incoherencias', icon: 'fa-flag' },
				{ id: 'inconsistencias', caption: 'Inconsistencias', icon: 'fa-exclamation-triangle' }
			] },
			{ id: (IEChecker.test(browser) ? 'updateIE' : 'update'), caption: 'Importar' }
		];
		$rootScope.navegabilidadSuper = [
			{ id: 'recalculate', caption: 'Recalcular datos', icon: 'fa-refresh' },
			{ id: 'permisos', caption: 'Gestionar permisos', icon: 'fa-users' },
			{ id: 'etiqueta', caption: 'Gestionar etiquetas', icon: 'fa-tags'},
			{ id: 'periodos', caption: 'Gestionar períodos', icon: 'fa-calendar'},
			{ id: 'crearprocedimiento', caption: 'Crear procedimiento', icon: 'fa-table' },
			{ id: 'loginas', caption: 'Cambiar de usuario', icon: 'fa-user-plus' },
			{ id: 'feedback', caption: 'Incidencias', icon: 'fa-bug' }
		];
		$rootScope.navegabilidadLast = [
			{ id: 'logout', caption: 'Salir' }
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
			var blob = new Blob(['<meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8"><table width="100%">' + document.getElementById(idx).innerHTML + '</table>'],
				{ type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8' });
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

		$rootScope.apiFeedback = null;

		$rootScope.report = function(){
			if (true && !$rootScope.apiFeedback)
			{
				var adapter = new window.Feedback.Send();
				adapter.send = function( data, callback){
					$log.log(data);
					//callback( (xhr.status === 200) );
					$http.post('/api/v1/public/feedback', data)
						.success(function(answer) { callback(true); $log.info(answer); })
						.error(function(answer) { callback(false); $log.error(answer); });
					callback(true);
				};

				var parameters = {
					h2cPath: '/js/lib/html2canvas.js',
					label: 'Enviar comentarios',
					header: 'Enviar comentarios',
					url: '/api/v1/public/feedback',
					nextLabel: 'Continuar',
					reviewLabel: 'Revisar',
					sendLabel: 'Enviar',
					closeLabel: 'Cerrar',
					messageSuccess: 'Tu comentario ha sido enviado con éxito. Gracias por tu ayuda.',
					messageError: 'Hubo un error enviando una notificación al servidor',
					blackoutClass: 'hidden',
					appendTo: null, // don't add feedback button to page
					adapter: adapter,
					pages: null
				};
				parameters.pages = [
						new window.Feedback.Form([{
							type: 'textarea',
							name: 'Comentario',
							label: 'Por favor, describa su incidencia',
							required: true
						}, {
							type: 'input-text',
							name: 'Contacto',
							label: 'Si lo desea, incluya un teléfono o dirección de correo electrónico de contacto',
							required: false
						} ]),
						new window.Feedback.Screenshot(parameters),
						new window.Feedback.Review()
					];
				$rootScope.apiFeedback = Feedback(parameters);
			}

			$rootScope.apiFeedback.open();
		};

		$rootScope.$on('$locationChangeSuccess', function(){
			angular.element('.navbar-collapse').removeClass('in');
		});
	}
	]);
})(angular, document, $, Blob, saveAs, Feedback);
