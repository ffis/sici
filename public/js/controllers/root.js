'use strict';

function AppCtrl($scope, $rootScope, Session) {
	$rootScope.setTitle   = function (title){ $scope.name = title; };
	$rootScope.setLogeado = function(t){
		$rootScope.logeado = t;
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
	];

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
		return
		$rootScope.session.permisoscalculados.procedimientoslectura.indexOf(procedimiento.codigo)!==-1 ||
		$rootScope.session.permisoscalculados.procedimientosescritura.indexOf(procedimiento.codigo)!==-1
	};
	
	$rootScope.W = function(procedimiento) {
		return $rootScope.session.permisoscalculados.procedimientosescritura.indexOf(procedimiento.codigo)!==-1;	
	};
	
	$rootScope.superuser = function() {
		return !!$rootScope.session.permisoscalculados.superuser;
	}
}

AppCtrl.$inject = ['$scope','$rootScope','Session'];