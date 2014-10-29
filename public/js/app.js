'use strict';

var app = angular.module('sici', [
  	'ngRoute','ngAnimate','ngSanitize','angular.filter',
  	'ui.bootstrap',
    'easypiechart','nvd3ChartDirectives',
    'angularFileUpload','xeditable',
    'sici.filters', 'sici.services', 'sici.directives','sici.login.util','sici.translate',
    'pascalprecht.translate',
	'autocomplete',
  ]).
  config(['$routeProvider', '$locationProvider','$logProvider', function($routeProvider, $locationProvider, $logProvider) {
    $logProvider.debugEnabled(false);

    $routeProvider.when('/stats', {templateUrl: 'partials/stats.html', controller: 'StatsCtrl'});
    $routeProvider.when('/inconsistencias', {templateUrl: 'partials/inconsistencias.html', controller: 'InconsistenciasCtrl'});
    $routeProvider.when('/reglasinconsistencias', {templateUrl: 'partials/reglasinconsistencias.html', controller: 'ReglasInconsistenciasCtrl'});
    $routeProvider.when('/procedimiento/:codigo', {templateUrl: 'partials/detalles.html', controller: 'DetallesCtrl'});
    $routeProvider.when('/logout',    {templateUrl: 'partials/logout.html',    controller: 'LogoutCtrl'   });
    $routeProvider.when('/welcome',   {templateUrl: 'partials/welcome.html',   controller: 'WelcomeCtrl'  });
		$routeProvider.when('/login',     {templateUrl: 'partials/login.html',     controller: 'LoginCtrl'    });	
    $routeProvider.when('/update',    {templateUrl: 'partials/upload.html',    controller: 'UpdateCtrl'   });
    $routeProvider.when('/actividad', {templateUrl: 'partials/actividad.html', controller: 'ActividadCtrl'});
    $routeProvider.when('/recalculate', {templateUrl: 'partials/recalculate.html', controller: 'RecalculateCtrl'});
    $routeProvider.when('/actividad/:idjerarquia', {templateUrl: 'partials/actividad.html', controller: 'ActividadCtrl'});
    $routeProvider.when('/errors',    {templateUrl: 'partials/incoherencias.html', controller: 'IncoherenciasCtrl'});
	$routeProvider.when('/permisos',    {templateUrl: 'partials/permisoscrud.html', controller: 'PermisoCtrl'});

    $routeProvider.otherwise({redirectTo: '/welcome'});
    $locationProvider.html5Mode(true);
  }]);
