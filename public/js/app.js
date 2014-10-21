'use strict';


// Declare app level module which depends on filters, and services
var app = angular.module('sici', [
	'ngRoute','ngAnimate','ngSanitize','angular.filter',
	'ui.bootstrap',
  'easypiechart',
/*
  'xeditable','nvd3ChartDirectives',
*/
  'angularFileUpload',

  'sici.filters', 'sici.services', 'sici.directives','sici.login.util'

  ]).
  config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
/*
    
    $routeProvider.when('/errors', {templateUrl: 'partial/2', controller: 'MyCtrl2'});
    $routeProvider.when('/stats', {templateUrl: 'partial/3', controller: 'StatsCtrl'});
    $routeProvider.when('/inconsistencias', {templateUrl: 'partial/4', controller: 'InconsistenciasCtrl'});
    
    $routeProvider.when('/reglasinconsistencias', {templateUrl: 'partial/6', controller: 'ReglasInconsistenciasCtrl'});
    */


    $routeProvider.when('/procedimiento/:codigo', {templateUrl: 'partials/detalles.html', controller: 'DetallesCtrl'});
    $routeProvider.when('/logout',  {templateUrl: 'partials/logout.html',  controller: 'LogoutCtrl'});
    $routeProvider.when('/welcome', {templateUrl: 'partials/welcome.html', controller: 'WelcomeCtrl'});
		$routeProvider.when('/login',   {templateUrl: 'partials/login.html',   controller: 'LoginCtrl'});	
    $routeProvider.when('/update', {templateUrl: 'partials/upload.html', controller: 'UpdateCtrl'});
    $routeProvider.when('/actividad', {templateUrl: 'partials/actividad.html', controller: 'ActividadCtrl'});
    
    $routeProvider.otherwise({redirectTo: '/welcome'});
    $locationProvider.html5Mode(true);
  }]);
/*
app.run(function(editableOptions) {
  editableOptions.theme = 'bs3'; // bootstrap3 theme. Can be also 'bs2', 'default'
});*/
