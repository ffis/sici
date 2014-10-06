'use strict';


// Declare app level module which depends on filters, and services
var app = angular.module('sici', [

	'ngRoute','ngAnimate','ngSanitize','angular.filter',
	'ui.bootstrap',
/*
  'easypiechart','xeditable','nvd3ChartDirectives',
  'angularFileUpload',
  'sici.filters', 'sici.services', 'sici.directives'
*/
  ]).
  config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
/*
    $routeProvider.when('/actividad', {templateUrl: 'partial/1', controller: 'MyCtrl1'});
    $routeProvider.when('/errors', {templateUrl: 'partial/2', controller: 'MyCtrl2'});
    $routeProvider.when('/stats', {templateUrl: 'partial/3', controller: 'StatsCtrl'});
    $routeProvider.when('/inconsistencias', {templateUrl: 'partial/4', controller: 'InconsistenciasCtrl'});
    $routeProvider.when('/procedimiento/:CODIGO', {templateUrl: 'partial/5', controller: 'DetallesCtrl'});
    $routeProvider.when('/reglasinconsistencias', {templateUrl: 'partial/6', controller: 'ReglasInconsistenciasCtrl'});
    $routeProvider.when('/welcome', {templateUrl: 'partial/7', controller: 'WelcomeCtrl'});
    $routeProvider.when('/logout', {templateUrl: 'partial/8', controller: 'LogoutCtrl'});
    $routeProvider.when('/update', {templateUrl: 'partial/9', controller: 'UpdateCtrl'});

    */
		$routeProvider.when('/login', {templateUrl: 'partials/login.html', controller: 'LoginCtrl'});	
    
    $routeProvider.otherwise({redirectTo: '/welcome'});
    $locationProvider.html5Mode(true);
  }]);

app.run(function(editableOptions) {
  editableOptions.theme = 'bs3'; // bootstrap3 theme. Can be also 'bs2', 'default'
});
