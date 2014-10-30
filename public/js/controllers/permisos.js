
function PermisoCtrl($rootScope,$scope,$location,$window,Arbol,Session,PermisosList,PersonasSearchList) {
	$rootScope.nav = 'permisos';
	$window.document.title ='SICI: Permisos';

	$scope.arbol = Arbol.query();
	$scope.oculto = false;	
	$scope.is_show_recursive_users = false;
	$scope.show_responsables = true;
	$scope.show_form_add_permiso = false;
	$scope.personas_plazas = [];
	$scope.persona_o_plaza = null;
	$scope.show_details_permiso = false;
	
	$scope.clearaddpermisoform = function(){
		$scope.logincarm = "";
		$scope.plaza = "";
	}
	$scope.refreshpermisoform = function(){
		$scope.logincarm = persona_o_plaza.login;
		$scope.plaza = persona_o_plaza.plaza;
	}
	$scope.show_recursive_users = function(){
		$scope.is_show_recursive_users = true;
		$scope.setSeleccionado($scope.seleccionado);		
	}
	$scope.show_normal = function(){
		$scope.is_show_recursive_users = false;
		$scope.setSeleccionado($scope.seleccionado);
	}
	$scope.crearpermiso = function() {
		alert('Función no implementada');
		if ($scope.logincarm.replace(/^\s+|\s+$/gm,'') || $scope.plaza.replace(/^\s+|\s+$/gm,''))
		{
			
		}
	}
	
	$scope.eliminarPermiso = function() {
		alert('No implementado');
	}
	
	$scope.searchUser = function(){
		alert('No implementado');
	}
	
	$scope.eliminarResponable = function(procedimiento, responsable) {
		alert('Función no implementada');
	};
	
	$scope.showDetailsPermiso = function(){
		$scope.show_details_permiso = true;
		$scope.seleccionado = false;
	}
	
	$scope.clearaddpermisoform();
	$scope.jerarquia = $rootScope.session.permisoscalculados.jerarquialectura;
	$scope.superuser = $rootScope.session.permisoscalculados.superuser;
	
	$scope.filtrojerarquia = function(item) {
		if ($scope.jerarquia.indexOf(item.id)!=-1 )
			return true;		
		for(var i=0;i<item.nodes.length;i++) 
			if ($scope.filtrojerarquia(item.nodes[i])) 
				return true;		
		return false;
	};

	$scope.filtrosocultos = false;
	$scope.setSeleccionado = function(seleccionad){
			if (seleccionad) {
				$scope.show_form_add_permiso = false;
				$scope.seleccionado = seleccionad;
				$rootScope.setTitle(seleccionad.title); 
				//$scope.procedimientos = ProcedimientoList.query({idjerarquia:seleccionad.id}); 
				$scope.permisostotales = PermisosList.query({idjerarquia:seleccionad.id, 'recursivo':($scope.is_show_recursive_users?1:0)}, function() {
					$scope.permisos = $scope.permisostotales.permisos;
					$scope.procedimientos = $scope.permisostotales.procedimientos;
				});
				console.log($scope.permisostotales);
				$scope.cumplimentados = 0;
				$scope.count = 1;
				$scope.persona_o_plaza='';
				$scope.show_details_permiso=false;
			}
		};
		


	$scope.colorText = $rootScope.colorText;
	
	$scope.isR = function(permiso) {
		return true;
	}
	$scope.isW = function(permiso) {
		return typeof $scope.seleccionado !== 'undefined' 
			&& typeof $scope.seleccionado.id !== 'undefined' 
			&& typeof permiso.jerarquiadirectaescritura !== 'undefined'
			&& Array.isArray(permiso.jerarquiadirectaescritura)
			&& permiso.jerarquiadirectaescritura.indexOf($scope.seleccionado.id)!==-1;
	}
	$scope.isP = function(permiso) {
		return typeof permiso.grantoption !== 'undefined' 
			&& permiso.grantoption > 0;
	}

	$scope.isFiltroSelected= function(filtro,key,fa){
		return (typeof filtro[key] != 'undefined' && fa.name==filtro[key]);
	};

	$scope.addPermiso = function() {
		if ($scope.seleccionado !== 'undefined') {
			$scope.show_form_add_permiso = true;			
		}
	}
	
	var personas_plazas_aux = PersonasSearchList.query({},function(err,data){
		$scope.personas_plazas=[];
		for(var i=0;i<personas_plazas_aux.length;i++)
		{
			$scope.personas_plazas.push(personas_plazas_aux[i].data);
		}
	});
	
    
	
}
PermisoCtrl.$inject = ['$rootScope','$scope','$location','$window','Arbol','Session','PermisosList','PersonasSearchList'];
