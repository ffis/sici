function NewProcedimientoCtrl($rootScope,$scope,$location,$window,$routeParams, Arbol, ProcedimientoList,DetalleCarmProcedimiento,DetalleCarmProcedimiento2, PersonasByPuesto, Session, Etiqueta,PersonasByRegexp, Procedimiento) {
	$rootScope.nav = 'procedimiento';
	$window.document.title ='SICI: Procedimiento - New';
	$scope.idjerarquia = ($routeParams.idjerarquia) ? $routeParams.idjerarquia :false;
	
	$scope.camposfiltros = ['cod_plaza'];
	$scope.filtros = {};
	$scope.filtro = {};
	$scope.reverse = false;
	$scope.nodoseleccionado = false;
	$scope.padre = "";
	$scope.seleccionado = false;
	$scope.procedimiento = new Procedimiento();
	$scope.responsable = {};
	$scope.padre = {};
	$scope.guardado = false;
	
	///$scope.oallprocedimientos = ProcedimientoList.query({'idjerarquia':seleccionado.id,'recursivo':false});
	
	$scope.$watch('seleccionado', function(old, _new){
		$scope.oallprocedimientos = ProcedimientoList.query({'idjerarquia':_new.id,'recursivo':false});
		if ($scope.procedimiento.padre) {			
			delete $scope.procedimiento.padre;
			alert('El procedimiento padre debe tener pertenecer al mismo nodo de la jerarquía. Se obvia campo padre.');
		}
	});
	
	$scope.$watch('responsable', function(old, _new){
		$scope.procedimiento.cod_plaza = _new.codplaza ;
	});

	$scope.$watch('padre', function(old, _new){
		$scope.procedimiento.responsable = ( typeof _new.codplaza !== 'undefined' ? _new.codplaza : _new.login );		
	});
	
	$scope.getPersonas = function(viewValue) {
		var regex = ""+viewValue
		if (viewValue.length>2) {
			var p = PersonasByRegexp.query({"regex":viewValue}).$promise;
			return p;
		}
		else return [];
	};
	
	$scope.guardar = function(){
		if ($scope.denominacion && $scope.codigo && $scope.seleccionado) {
			$scope.guardado = true;
			Procedimiento.save($scope.procedimiento);
		} else {
			alert('Imposible crear/actualizar el procedimiento. Debe indicar denominacion y codigo');
		}
	}
	
	$scope.showPersona = function (persona){
		if (persona && persona.login && persona.codplaza && persona.nombre && persona.apellidos)
			return persona.login + "-" + persona.codplaza + "-" + persona.nombre+ " " + persona.apellidos;
		else return "";
	}
	
	$scope.arbol = Arbol.query(function(){
		if ($scope.idjerarquia){
			$scope.setJerarquiaById($scope.idjerarquia);
		}
	});
	$scope.oculto = false;

	$scope.jerarquia = Session.create().permisoscalculados.jerarquialectura.concat(Session.create().permisoscalculados.jerarquiaescritura);
	
	$scope.filtrojerarquia = function(item) {
		if ($scope.jerarquia.indexOf(item.id)!=-1 )
			return true;		
		if (item.nodes){
			for(var i=0;i<item.nodes.length;i++) 
				if ($scope.filtrojerarquia(item.nodes[i])) 
					return true;		
		}
		return false;
	};
	
	$scope.filtrosocultos = false;
	
	$scope.setSeleccionado = function(seleccionad){
		if (seleccionad) {			
			$scope.seleccionado = seleccionad;			
			$rootScope.setTitle(seleccionad.title); 
			$scope.cumplimentados = 0;				
			$scope.count = 1;
			$scope.procedimiento = seleccionado.id;
			$("body").animate({scrollTop: $('#detallesjerarquia').offset().top}, "slow");
		}
	};
		
	$scope.isFiltroSelected= function(filtro,key,fa){
		return (typeof filtro[key] != 'undefined' && fa.name==filtro[key]);
	}
	
	
}

NewProcedimientoCtrl.$inject = ['$rootScope','$scope','$location','$window','$routeParams','Arbol','ProcedimientoList','DetalleCarmProcedimiento','DetalleCarmProcedimiento2','PersonasByPuesto','Session', 'Etiqueta','PersonasByRegexp','Procedimiento'];
