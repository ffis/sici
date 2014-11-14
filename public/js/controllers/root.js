'use strict';

function AppCtrl($q, $scope, $rootScope, Session, $location, PermisosCalculados) {

	$rootScope.setTitle   = function (title){ $scope.name = title; };
	$rootScope.setLogeado = function(t){
		$rootScope.logeado = t;
		if (t) {
			$rootScope.permisosCalculados = PermisosCalculados.query({});
		}
	};
	$rootScope.session = Session;
	$rootScope.nav = '';
	$rootScope.logeado = false;
	$rootScope.meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
	$rootScope.navegabilidad  = [
		{ id:'inicio', caption:'Inicio' },
		{ id:'actividad', caption:'Actividad' },
		{ id:'stats', caption:'Estadísticas' },
		{ id:'errors', caption:'Incoherencias' },
		{ id:'inconsistencias', caption:'Inconsistencias' },
		{ id:'update', caption:'Actualizar mediante fichero' },
		{ id:'logout', caption:'Salir' },
	];
	$rootScope.navegabilidadSuper = [
		{ id:'recalculate', caption:'Recalcular datos' },
		{ id:'permisos', caption:'Gestionar permisos' },
		{ id:'etiqueta', caption: 'Gestionar etiquetas'},
		{ id:'periodos', caption: 'Gestionar períodos'},
		{ id:'crearprocedimiento', caption: 'Crear procedimiento'},
	];
	
	if ($rootScope.logeado) {
		$rootScope.permisosCalculados = PermisosCalculados.query({});
	}
	
	
	$rootScope.loginCarm = false;

	$rootScope.irProcedimiento = function(){
		var id = parseInt($rootScope.procedimiento);
		if (id>0){
			$location.path('/procedimiento/'+id);
		}
	}

	$rootScope.colorText = function(i, numcolors, phase)
	{
	    if (phase == undefined) phase = 0;
	    center = 128;
	    width = 127;
	    frequency = Math.PI*2/numcolors;
	    
	    return {
	        red   : Math.ceil(Math.sin(frequency*i+2+phase) * width + center),
	        green : Math.ceil(Math.sin(frequency*i+0+phase) * width + center),
	        blue  : Math.ceil(Math.sin(frequency*i+4+phase) * width + center)
	    };
	};

	$rootScope.exportXLS = function(idx, nombre){
	    var blob = new Blob(['<meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8"><table width="100%">'+document.getElementById(idx).innerHTML+'</table>'], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8"
        });
        saveAs(blob, nombre+".xls");
	};

	$rootScope.exportDOC = function(idx, nombre){
		$("#"+idx).wordExport(nombre);
	};

	$rootScope.R = function(procedimiento) {
		var def = $q.defer();
		$rootScope.permisosCalculados.$promise.then(function(){
			def.resolve(
				$rootScope.permisosCalculados.procedimientoslectura.indexOf(procedimiento.codigo)!==-1 ||
				$rootScope.permisosCalculados.procedimientosescritura.indexOf(procedimiento.codigo)!==-1
			);
		}, function(){
			def.reject();
		});
		return def.promise;
	};
	
	$rootScope.W = function(procedimiento) {
		var def = $q.defer();
		$rootScope.permisosCalculados.$promise.then(function(){
			def.resolve(
				$rootScope.permisosCalculados.procedimientosescritura.indexOf(procedimiento.codigo)!==-1
			);
		}, function(){
			def.reject();
		});
		return def.promise;
	};
	
	var defsuperuser = $q.defer();
	
	$rootScope.superuser = function() {
		
		$rootScope.permisosCalculados.$promise.then(function(){
			defsuperuser.resolve(
				!!$rootScope.permisosCalculados.superuser
			);
		}, function(){
			defsuperuser.reject();
		});
		return defsuperuser.promise;
	}
	
	$rootScope.jerarquialectura = function(){
		var def = $q.defer();

		$rootScope.permisosCalculados.$promise.then(function(){
			def.resolve(
				$rootScope.permisosCalculados.jerarquialectura
			);
		}, function(){
			def.reject();
		});
		return def.promise;
	}
	
	$rootScope.jerarquiaescritura = function(){
		var def = $q.defer();

		$rootScope.permisosCalculados.$promise.then(function(){
			def.resolve(
				$rootScope.permisosCalculados.jerarquiaescritura
			);
		}, function(){
			def.reject();
		});
		return def.promise;
	}

	$rootScope.grantoption = function(){
		var def = $q.defer();

		$rootScope.permisosCalculados.$promise.then(function(){
			def.resolve(
				$rootScope.permisosCalculados.grantoption
			);
		}, function(){
			def.reject();
		});
		return def.promise;	
	}

}

AppCtrl.$inject = ['$q','$scope','$rootScope','Session', '$location','PermisosCalculados'];