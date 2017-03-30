(function(angular, $, Blob, saveAs, window){
	'use strict';
	angular.module('sici').controller('AppCtrl', ['$window', '$q', '$rootScope', '$log', 'Session', '$location', '$http', 'toaster', 'PermisosCalculados', 'AuthService', '$document', 'Preferencias',
		function ($window, $q, $rootScope, $log, Session, $location, $http, toaster, PermisosCalculados, AuthService, $document, Preferencias) {

			$rootScope.setTitle = function (title){ $window.document.title = 'SICI - ' + title; };
			$rootScope.setLogeado = function(t){
				$rootScope.logeado = t;
				if (t && typeof $rootScope.permisoscalculados === 'undefined') {
					$rootScope.permisoscalculados = PermisosCalculados.query({});
				} else if (!t) {
					Reflect.deleteProperty($rootScope, 'permisoscalculados');
				}
			};

			$rootScope.toaster = function(txt, title, type){
				if (typeof type === 'undefined'){
					type = 'success';
				} else if (typeof title === 'undefined'){
					title = 'Aviso';
				}
				toaster.pop(type, title, txt);
			};

			$rootScope.anualidades = [];
			const maxanualidad = new Date().getFullYear();
			for (let i = 2013; i <= maxanualidad; i++){
				$rootScope.anualidades.push({'value': 'a' + i, 'label': i});
			}
			$rootScope.anualidad = 'a' + maxanualidad;
			$rootScope.getIntAnualidad = function(){ return parseInt($rootScope.anualidad.substring(1, 5), 10); };

			$rootScope.session = Session;
			$rootScope.nav = '';
			$rootScope.logeado = false;
			$rootScope.meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
			$rootScope.inicialesmeses = ['E', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
			const IEChecker = /MSIE [6789]+/i;
			const browser = $window.navigator.userAgent;
			$rootScope.navegabilidad = [
				{'id': 'inicio', 'caption': 'Inicio'},
				{'id': 'actividad', 'caption': 'Actividad'},
				{'id': 'carta', 'caption': 'Carta'},
				{'id': '#', 'caption': 'Reportes', 'sub': [
						{'id': 'informes', 'caption': 'Informes', 'icon': 'fa-file-excel-o'},
						{'id': 'stats', 'caption': 'Estadísticas', 'icon': 'fa-bar-chart'},
						{'id': 'errors', 'caption': 'Incoherencias', 'icon': 'fa-flag'},
						{'id': 'inconsistencias', 'caption': 'Inconsistencias', 'icon': 'fa-exclamation-triangle'}
					]
				},
				{'id': (IEChecker.test(browser) ? 'updateIE' : 'update'), 'caption': 'Importar'}
			];
			$rootScope.navegabilidadSuper = [
				{'id': 'recalculate', 'caption': 'Recalcular datos', 'icon': 'fa-refresh'},
				{'id': 'permisos', 'caption': 'Gestionar permisos', 'icon': 'fa-users'},
				{'id': 'etiqueta', 'caption': 'Gestionar etiquetas', 'icon': 'fa-tags'},
				{'id': 'periodos', 'caption': 'Gestionar períodos', 'icon': 'fa-calendar'},
				{'id': 'crearprocedimiento', 'caption': 'Crear procedimiento', 'icon': 'fa-table'},
				{'id': 'loginas', 'caption': 'Cambiar de usuario', 'icon': 'fa-user-secret'},
				{'id': 'feedback', 'caption': 'Incidencias', 'icon': 'fa-bug'},
				{'id': 'registroactividad', 'caption': 'Registro de actividad', 'icon': 'fa-hourglass-half'}
			];
			$rootScope.navegabilidadLast = [
				{'id': 'logout', 'caption': 'Salir'}
			];

			$rootScope.loginCarm = AuthService.carmlogin;

			$rootScope.irProcedimiento = function(){
				if (parseInt($rootScope.procedimiento, 10) > 0){
					$location.path('/procedimiento/' + $rootScope.procedimiento);
				}
			};
			$rootScope.isIndicadorCumplimentado = function(indicador, anualidad){
				if (typeof anualidad === 'undefined'){ return false; }
				if (typeof indicador.valores === 'undefined'){ return false; }
				if (typeof indicador.valores[anualidad] === 'undefined'){ return false; }

				return indicador.valores[anualidad].some(function(info){ return info; });
			};

			$rootScope.isInt = function(n){
				return parseInt(n, 10) === n;
			};

			$rootScope.colorText = function(i, numcolors, phase){
				if (typeof phase === 'undefined'){
					phase = 0;
				}
				const center = 128,
					width = 127,
					frequency = Math.PI * 2 / numcolors;

				return {
					'red': Math.ceil(Math.sin(((frequency * i) + 2 + phase) * width) + center),
					'green': Math.ceil(Math.sin(((frequency * i) + 0 + phase) * width) + center),
					'blue': Math.ceil(Math.sin(((frequency * i) + 4 + phase) * width) + center)
				};
			};

			$rootScope.colorToHex = function(color){
				const rgb = color.blue | (color.green << 8) | (color.red << 16),
					s = rgb.toString(16);

				return '#' + '000000'.substring(0, 6 - s.length) + s;
			};

			$rootScope.exportXLS = function(idx, nombre){
				const blob = new Blob(['<meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8"><table width="100%">' + $document.getElementById(idx).innerHTML + '</table>'],
					{'type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8'});
				saveAs(blob, nombre + '.xls');
			};

			$rootScope.exportDOC = function (idx, nombre){
				$log.log(idx, nombre);
				$log.error('not supported');

				return false;
			};

			$rootScope.R = function (procedimiento) {
				const def = $q.defer();
				if ($rootScope.permisoscalculados){
					$rootScope.permisoscalculados.$promise.then(function(){
						def.resolve(
								$rootScope.permisoscalculados.superuser ||
								$rootScope.permisoscalculados.procedimientoslectura.indexOf(procedimiento.codigo) !== -1 ||
								$rootScope.permisoscalculados.procedimientosescritura.indexOf(procedimiento.codigo) !== -1
								);
					}, def.reject);
				} else {
					def.reject();
				}

				return def.promise;
			};

			$rootScope.W = function (procedimiento) {
				const def = $q.defer();
				if ($rootScope.permisoscalculados){
					$rootScope.permisoscalculados.$promise.then(function () {
						def.resolve($rootScope.permisoscalculados.superuser || $rootScope.permisoscalculados.procedimientosescritura.indexOf(procedimiento.codigo) !== -1 );
					}, def.reject);
				} else {
					def.reject();
				}

				return def.promise;
			};

			$rootScope.superuser = function () {
				const def = $q.defer();
				if ($rootScope.permisoscalculados){
					$rootScope.permisoscalculados.$promise.then(function () {
						def.resolve(Boolean($rootScope.permisoscalculados.superuser));
					}, def.reject);
				} else {
					def.reject();
				}

				return def.promise;
			};

			$rootScope.jerarquialectura = function () {
				const def = $q.defer();
				if ($rootScope.permisoscalculados){
					$rootScope.permisoscalculados.$promise.then(function () {
						def.resolve($rootScope.permisoscalculados.jerarquialectura);
					}, def.reject);
				} else {
					def.reject();
				}

				return def.promise;
			};

			$rootScope.jerarquiaescritura = function () {
				const def = $q.defer();
				if ($rootScope.permisoscalculados){
					$rootScope.permisoscalculados.$promise.then(function () {
						def.resolve($rootScope.permisoscalculados.jerarquiaescritura);
					}, def.reject);
				} else {
					def.reject();
				}

				return def.promise;
			};

			$rootScope.grantoption = function () {
				const def = $q.defer();
				if ($rootScope.permisoscalculados){
					$rootScope.permisoscalculados.$promise.then(function() {
						def.resolve($rootScope.permisoscalculados.superuser || $rootScope.permisoscalculados.grantoption);
					}, def.reject);
				} else {
					def.reject();
				}

				return def.promise;
			};

			$rootScope.recalcularpermisos = function(){
				if ($rootScope.logeado) {
					$rootScope.permisoscalculados = PermisosCalculados.query({});
				}
			};

			$rootScope.cbDownload = function (token) {
				const url = '/api/download/' + token.time + '/' + token.hash + (token.extension ? '?extension=' + token.extension : '');
				$window.location = url;
			};

			$rootScope.apiFeedback = null;
			$rootScope.condensed = Preferencias.condensed();
			$rootScope.$watch('condensed', function(){
				Preferencias.condensed($rootScope.condensed);
			});

			$rootScope.report = function(){
				if (!$rootScope.apiFeedback){
					const adapter = new window.Feedback.Send();
					adapter.send = function(data, callback){
						$log.log(data);
						//callback( (xhr.status === 200) );
						$http.post('/api/v1/public/feedback', data).success(function(answer){
							callback(true);
							$log.info(answer);
						}).catch(function(answer){
							callback(false);
							$log.error(answer);
						});
					};

					const parameters = {
						'h2cPath': '/js/lib/html2canvas.js',
						'label': 'Enviar comentarios',
						'header': 'Enviar comentarios',
						'url': '/api/v1/public/feedback',
						'nextLabel': 'Continuar',
						'reviewLabel': 'Revisar',
						'sendLabel': 'Enviar',
						'closeLabel': 'Cerrar',
						'messageSuccess': 'Tu comentario ha sido enviado con éxito. Gracias por tu ayuda.',
						'messageError': 'Hubo un error enviando una notificación al servidor',
						'blackoutClass': 'hidden',
						'appendTo': null, // don't add feedback button to page
						'adapter': adapter,
						'pages': null
					};
					parameters.pages = [
						new window.Feedback.Form([{
							'type': 'textarea',
							'name': 'Comentario',
							'label': 'Por favor, describa su incidencia',
							'required': true
						}, {
							'type': 'input-text',
							'name': 'Contacto',
							'label': 'Si lo desea, incluya un teléfono o dirección de correo electrónico de contacto',
							'required': false
						}]),
						new window.Feedback.Screenshot(parameters),
						new window.Feedback.Review()
					];
					$rootScope.apiFeedback = window.Feedback(parameters);
				}
				$rootScope.apiFeedback.open();
			};

			$rootScope.$on('$locationChangeSuccess', function(){
				angular.element('.navbar-collapse').removeClass('in');
			});
		}
	]);
})(angular, $, Blob, saveAs, window);
