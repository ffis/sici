function DetallesCtrl($rootScope,$scope, $routeParams, $window, Procedimiento,DetalleCarmProcedimiento,DetalleCarmProcedimiento2,Raw,Aggregate,PersonasByPuesto) {

	$scope.detallesCarm = DetalleCarmProcedimiento.get({codigo:$routeParams.codigo});
	$scope.detallesCarm2 = DetalleCarmProcedimiento2.get({codigo:$routeParams.codigo});		
	$scope.numgraphs = 0;
	$scope.graficasbarras = false;
	$scope.mesActual = (new Date()).getMonth();

	$scope.procedimientoSeleccionado = Procedimiento.get({codigo: $routeParams.codigo } ,function(){
		$window.document.title ='SICI: '+$scope.procedimientoSeleccionado.denominacion;
		$scope.anualidad = 0;
		for (var anualidad in $scope.procedimientoSeleccionado.periodos){
			if (parseInt(anualidad) > $scope.anualidad)
				$scope.anualidad = anualidad;	
		}
		
		var cod_plaza = $scope.procedimientoSeleccionado.cod_plaza;
		$scope.responsables = PersonasByPuesto.query({cod_plaza:cod_plaza}); 
		
		var graphskeys = [
				{caption:'RESUMEN DE DATOS DE GESTIÓN',keys:[
					'anualidades.'+	$scope.anualidad+'.solicitados',
					/*'Iniciados','Pendientes','Total resueltos'*/
					]},
				{caption:'RESUELTOS EN PLAZO',keys:['En plazo','Fuera de plazo']},
				{caption:'DESESTIMIENTOS/RENUNCIAS Y PRESCRITOS/CADUCADOS',keys:['Resueltos por Desistimiento/Renuncia/Caducidad (Resp_Ciudadano)',	'Resueltos por Prescripcion/Caducidad (Resp_Admon)']},
				{caption:'QUEJAS Y RECURSOS CONTRA EL PROCEDIMIENTO',keys:['Quejas presentadas en el mes','Recursos presentados en el mes']},
				{caption:'VARIACIÓN DE TRAMITACIÓN MENSUAL (DATOS ABSOLUTOS)',keys:['Tramitados 2013','Total resueltos']},
			];
		$scope.graphs = [];
		graphskeys.forEach(function(g, i){
			$scope.numgraphs = 0;
			var maxvalue = 0;
			var data = [];
			var caption = g.caption;
			g.keys.forEach(function(key,indx){
				var values = [];
				if (typeof $scope.procedimientoSeleccionado[key] != 'undefined'){
					$scope.procedimientoSeleccionado[key].forEach(function (val,idx) {
						values.push( [ idx, val] ) ;
						if (maxvalue< val) maxvalue=val;
					});
					data.push(	{ "key": key,"values": values} );
				}
			})
			var forcey = [0, Math.ceil(maxvalue*1.3) ];
			if (maxvalue>0){
				$scope.graphs.push( { data : data, forcey : forcey, caption:caption} );
				$scope.numgraphs++;
			}
		})

		$scope.inconsistencias =  Raw.query({model: 'reglasinconsistencias'},function(){
			$scope.inconsistencias.forEach(function(i,idx){
				var campo = {'codigo':'$codigo'};
				var restriccion = JSON.parse(i.restriccion);
				restriccion.CODIGO = $scope.procedimientoSeleccionado.codigo;
				$scope.inconsistencias[idx].datos = Aggregate.query({ campo : JSON.stringify(campo), restriccion:JSON.stringify(restriccion)});
			});
		});

	} );	
	$scope.attrspar = [
		'codigo',
		'denominacion',
		'tipo',
		'cod_plaza',
		'fecha_creacion',
		'fecha_fin',
		'fecha_version',
		'Login responsable',
		'Nombre responsable',
		'Correo-e responsable',
		'Teléfono responsable',
		'Plazo maximo legal para resolver (dias naturales)',
		'Plazo maximo legal para responder (dias habiles)',
		'Plazo CS /ANS (dias naturales)',
		'Plazo CS /ANS (dias habiles)',
		'Pendientes iniciales (a 31-12)',
	];
	$scope.attrsanualidad = ['pendientes_iniciales','periodoscerrados','plazo_CS_ANS_habiles','plazo_CS_ANS_naturales','plazo_maximo_resolver','plazo_maximo_responder'];
		
	$scope.attrstabla = [
		'solicitados',
		'iniciados','periodos_cerrados',
		'quejas','recursos',
		'resueltos_1','resueltos_5','resueltos_10','resueltos_15','resueltos_30','resueltos_45','resueltos_mas_45',
		'resueltos_desistimiento_renuncia_caducidad','resueltos_prescripcion',
		'en_plazo',
		't_medio_habiles','t_medio_naturales','total_resueltos',
		];
		/* 'totalsolicitudes', */
	$scope.attrstablacalculados = ['fuera_plazo', 'pendientes'];
	$scope.attrsresp = ['codplaza', 'login','nombre','apellidos','telefono'];


	$scope.meses = $rootScope.meses;
	$scope.colorText = $rootScope.colorText;

	$scope.graficasgrandes = false;
	$scope.xAxisTickValuesFunction = function(){ return function(d){ return [0,1,2,3,4,5,6,7,8,9,10,11]; };};
	$scope.xAxisTickFormatFunction = function(){ return function(d){ return $scope.meses[d]; } };
	$scope.colorFunction2= function(){ return function(d,i){ 
		var color = $scope.colorText(i, 5, 60);
		var r = (color.red<16 ? '0': '')+color.red.toString(16), g = (color.green<16 ? '0': '')+color.green.toString(16), b = (color.blue<16 ? '0': '')+color.blue.toString(16);
	 	return '#'+r+g+b;
	}};
	var colorCategory = d3.scale.category20b()
	$scope.colorFunction = function() {
	    return function(d, i) {
	        return colorCategory(i);
	    };
	};
	$scope.graphs = false;
	$scope.recalculate = function(){
		//
		console.log('incluir código recálculo, a hacer en el servidor');
	}
	$scope.checkNumber = function(data) {
		var valor = parseInt(data);
	    if(isNaN(valor) || ! /^\d+$/.test(data) ){
	      	return "Esto no es un número";
	    }else if (valor<0){
	    	return "No se admiten valores menores de 0";
	    }
	};    
}
DetallesCtrl.$inject = ['$rootScope','$scope','$routeParams','$window','Procedimiento','DetalleCarmProcedimiento','DetalleCarmProcedimiento2','Raw','Aggregate','PersonasByPuesto'];

function parseStr2Int (str){
	var valor = parseInt(str);
	if(isNaN(valor) || ! /^\d+$/.test(data) ) valor=0;
	return valor;
}
