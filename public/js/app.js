(function(angular, angularFileUploadLoaded){
	'use strict';
	var dependencies = [
		'ngRoute', 'ngAnimate', 'ngSanitize', 'ngCookies', 'angular.filter',
		'ui.bootstrap',
		'easypiechart', 'nvd3ChartDirectives',
		'xeditable', 'colorpicker.module',
		'sici.filters', 'sici.services', 'sici.directives', 'sici.login.util', 'sici.translate',
		'pascalprecht.translate',
		'autocomplete',
		'toaster', 'ngRadialGauge', 'ngDraggable'
	];

	if (angularFileUploadLoaded){
		dependencies.push('ngFileUpload');
	}

	angular.module('sici', dependencies)
		.config(['$routeProvider', '$locationProvider', '$logProvider',
			function($routeProvider, $locationProvider, $logProvider) {
				$logProvider.debugEnabled(false);

				$routeProvider.when('/stats', {templateUrl: 'partials/stats.html', controller: 'StatsCtrl' });
				$routeProvider.when('/inconsistencias', {templateUrl: 'partials/inconsistencias.html', controller: 'InconsistenciasCtrl' });
				$routeProvider.when('/reglasinconsistencias', {templateUrl: 'partials/reglasinconsistencias.html', controller: 'ReglasInconsistenciasCtrl' });
				$routeProvider.when('/procedimiento/:codigo', {templateUrl: 'partials/detalles.html', controller: 'DetallesCtrl' });
				$routeProvider.when('/logout', {templateUrl: 'partials/logout.html', controller: 'LogoutCtrl' });
				$routeProvider.when('/welcome', {templateUrl: 'partials/welcome.html', controller: 'WelcomeCtrl' });
				$routeProvider.when('/login', {templateUrl: 'partials/login.html', controller: 'LoginCtrl' });
				$routeProvider.when('/update', {templateUrl: 'partials/upload.html', controller: 'UpdateCtrl' });
				$routeProvider.when('/updateIE', {templateUrl: 'partials/uploadIE.html', controller: 'UpdateIECtrl' });
				$routeProvider.when('/actividad', {templateUrl: 'partials/actividad.html', controller: 'ActividadCtrl' });
				$routeProvider.when('/recalculate', {templateUrl: 'partials/recalculate.html', controller: 'RecalculateCtrl' });
				$routeProvider.when('/actividad/:idjerarquia', {templateUrl: 'partials/actividad.html', controller: 'ActividadCtrl' });
				$routeProvider.when('/errors', {templateUrl: 'partials/incoherencias.html', controller: 'IncoherenciasCtrl' });
				$routeProvider.when('/permisos', {templateUrl: 'partials/permisoscrud.html', controller: 'PermisoCtrl' });
				$routeProvider.when('/crearprocedimiento', {templateUrl: 'partials/procedimientocrud.html', controller: 'NewProcedimientoCtrl' });
				$routeProvider.when('/etiqueta', {templateUrl: 'partials/etiqueta.html', controller: 'EtiquetaCtrl' });
				$routeProvider.when('/operador', {templateUrl: 'partials/operador.html', controller: 'OperadorCtrl' });
				$routeProvider.when('/periodos', {templateUrl: 'partials/periodos.html', controller: 'PeriodosCtrl' });
				$routeProvider.when('/testexpediente', {templateUrl: 'partials/testexpediente.html', controller: 'TestExpedienteCtrl' });
				$routeProvider.when('/loginas', {templateUrl: 'partials/loginas.html', controller: 'LoginAsCtrl' });
				$routeProvider.when('/informes', {templateUrl: 'partials/informes.html', controller: 'InformesCtrl' });
				$routeProvider.when('/resumenorganica/:idjerarquia', {templateUrl: 'partials/detallesorganica.html', controller: 'DetallesOrganicaCtrl' });
				$routeProvider.when('/debug', {templateUrl: 'partials/debug.html', controller: 'DebugCtrl' });
				$routeProvider.when('/feedback', {templateUrl: 'partials/feedback.html', controller: 'FeedbackCtrl' });
				$routeProvider.when('/carta', {templateUrl: 'partials/carta.html', controller: 'CartaCtrl' });
				$routeProvider.when('/carta/:idjerarquia', {templateUrl: 'partials/carta.html', controller: 'CartaCtrl' });
				$routeProvider.when('/carta/:idjerarquia/:idcarta', {templateUrl: 'partials/carta.html', controller: 'CartaCtrl' });
				$routeProvider.when('/carta-printable/:idjerarquia/:idcarta', {templateUrl: 'partials/carta-printable.html', controller: 'CartaPrintableCtrl' });
				$routeProvider.when('/carta-informe/:idjerarquia/:idcarta', {templateUrl: 'partials/carta-informeanual.html', controller: 'CartaInformeCtrl' });
				$routeProvider.when('/entidadobjeto', {templateUrl: 'partials/entidadobjeto.html', controller: 'EntidadObjetoCtrl' });
				$routeProvider.when('/objetivo/:idobjetivo', {templateUrl: 'partials/objetivo.html', controller: 'ObjetivoCtrl' });
				$routeProvider.when('/indicador/:idjerarquia/:idindicador', {templateUrl: 'partials/indicador.html', controller: 'IndicadorCtrl' });
				$routeProvider.when('/formula/:idobjetivo/:index', {templateUrl: 'partials/formula.html', controller: 'FormulaCtrl' });
				$routeProvider.when('/registroactividad', {templateUrl: 'partials/registroactividad.html', controller: 'RegistroActividadCtrl' });


				$routeProvider.otherwise({redirectTo: '/welcome' });
				$locationProvider.html5Mode(true);
			}
		])
		.run(function(editableOptions) {
			editableOptions.theme = 'bs3';
		});
})(angular, angularFileUploadLoaded);
