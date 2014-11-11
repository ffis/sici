function NewProcedimientoCtrl($rootScope,$scope,$location,$window,$routeParams, Arbol, ProcedimientoList,DetalleCarmProcedimiento,DetalleCarmProcedimiento2, PersonasByPuesto, Session, Etiqueta,PersonasByRegexp) {
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
	
	///$scope.oallprocedimientos = ProcedimientoList.query({'idjerarquia':seleccionado.id,'recursivo':false});
	
	$scope.$watch('seleccionado', function(old, _new){
		$scope.oallprocedimientos = ProcedimientoList.query({'idjerarquia':_new.id,'recursivo':false});
	});
	
	$scope.getPersonas = function(viewValue) {
		var regex = ""+viewValue
		if (viewValue.length>2)
			return PersonasByRegexp.query({"regex":viewValue});
		else return [];
	};
	
	$scope.setJerarquiaById = function(idjerarquia){
		var setJ = function(nodo, idjerarquia){
			if (nodo.id == idjerarquia){
				$scope.setSeleccionado(nodo);
				return true;
			}
			
			if (nodo.nodes ==null) return false;
			for(var i=0,j=nodo.nodes.length; i<j;i++){
				if (setJ(nodo.nodes[i], idjerarquia)) {
					return true;
				}
			}
			return false;
		};
		$scope.arbol.forEach(function(nodo,idx){
			setJ(nodo,idjerarquia);
		})
	};
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
				$("body").animate({scrollTop: $('#detallesjerarquia').offset().top}, "slow");
			}
		};
	$scope.isFiltroSelected= function(filtro,key,fa){
		return (typeof filtro[key] != 'undefined' && fa.name==filtro[key]);
	}
	
	
}

NewProcedimientoCtrl.$inject = ['$rootScope','$scope','$location','$window','$routeParams','Arbol','ProcedimientoList','DetalleCarmProcedimiento','DetalleCarmProcedimiento2','PersonasByPuesto','Session', 'Etiqueta','PersonasByRegexp'];
