'use strict';

function IncoherenciasCtrl($rootScope,$scope,$window, Raw) {
	$rootScope.nav = 'errors';
	/*
	$scope.procedimiento = Procedimiento.query({idjerarquia: $routeParams.id } );	
	$scope.enexcelperonoenguia = Raw.query({model: 'enexcelperonoenguia'});
	$scope.enexcelperonoenprocedimiento = Raw.query({model: 'enexcelperonoenprocedimiento'});
	$scope.enguiaperonoencrawler = Raw.query({model: 'enguiaperonoencrawler'});
	$scope.enguiaperonoenexcel = Raw.query({model: 'enguiaperonoenexcel'});
	$scope.excel = Raw.query({model: 'excel'});
	*/
	$scope.mostrartodos = "1";
	$scope.idsencomun = false;
	/*
	$scope.pagination = Pagination.getNew(10);
	$scope.pagination.numPages = $scope.idsencomun ? Math.ceil(Object.keys($scope.idsencomun).length/$scope.pagination.perPage) : 0;
	*/
	$window.document.title ='SICI: Incoherencias';

	$scope.guiacarm = Raw.query({model: 'guiacarm'}, function(){
		if (!$scope.idsencomun) $scope.idsencomun = {};
		$scope.guiacarm.forEach(function(g){
			if (typeof $scope.idsencomun['id'+g.id] === 'undefined')
				$scope.idsencomun['id'+g.id] = {id: parseInt(g.id), guiacarm: g};
			else
				$scope.idsencomun['id'+g.id].guiacarm = g;
		});
	});
	$scope.procedimiento = Raw.query({model: 'procedimiento'},function(){
		if (!$scope.idsencomun) $scope.idsencomun = {};
		$scope.procedimiento.forEach(function(p){
			if (typeof $scope.idsencomun['id'+p.codigo] === 'undefined')
				$scope.idsencomun['id'+p.codigo] = {id: parseInt(p.codigo), procedimiento: p};
			else
				$scope.idsencomun['id'+p.codigo].procedimiento = p;
		});
	});
	$scope.crawled = Raw.query({model: 'crawled'},function(){
		if (!$scope.idsencomun) $scope.idsencomun = {};
		$scope.crawled.forEach(function(p){
			if (typeof $scope.idsencomun['id'+p.id] === 'undefined')
				$scope.idsencomun['id'+p.id] = {id: parseInt(p.id), crawled: p};
			else
				$scope.idsencomun['id'+p.id].crawled = p;
		});
	});
	$scope.toDays = function(str){
		str = str.replace("\r"," ").replace("\n"," ").trim();
		var n = parseInt(str);
		if (str.indexOf('Mes')!==-1) n*=30;
		return n;
	}
	$scope.parseInt = function(n){ return (n && n!='') ? parseInt(n):0};
	$scope.testwarning = function(row){
		if (!row.crawled || !row.crawled.any || !row.crawled.any['Plazo de resolución']) return true;
		if (!row.procedimiento ) return true;
		var sum = $scope.parseInt(row.procedimiento['Plazo maximo legal para resolver (dias naturales)']) +
			$scope.parseInt(row.procedimiento['Plazo maximo legal para responder (dias habiles)']) +
			$scope.parseInt(row.procedimiento['Plazo CS /ANS (dias naturales)']) +
			$scope.parseInt(row.procedimiento['Plazo CS /ANS (dias habiles)']);
		var	plazo = $scope.toDays( row.crawled.any['Plazo de resolución']);
		return ( sum != plazo );
	}

	$scope.camposexcel = [
		'Plazo maximo legal para resolver (dias naturales)',
		'Plazo maximo legal para responder (dias habiles)',
		'Plazo CS /ANS (dias naturales)',
		'Plazo CS /ANS (dias habiles)',
	];
	$scope.camposguia = ['Plazo de resolución'];

	$scope.noexisteenguiaesteprocedimiento = function(p) {
		var encontrado = false;
		var j = $scope.guiacarm.length;
		for(var i=0;i<j;i++){
			if ($scope.guiacarm[i].id == p.codigo){
				encontrado=true;break;
			}
		};
		return !encontrado;
	};
	$scope.noexisteenprocedimientoestafichaguia = function(g) {
		var encontrado = false;
		var j = $scope.procedimiento.length;
		for(var i=0;i<j;i++){
			if (g.id == $scope.procedimiento[i].codigo){
				encontrado=true;break;
			}
		}
		return !encontrado;
	};
}

IncoherenciasCtrl.$inject = ['$rootScope','$scope','$window','Raw'];

