(function(angular, d3, $){
	'use strict';
	angular.module('sici')
		.controller('DetallesOrganicaCtrl', ['$q', '$rootScope', '$scope', '$routeParams', '$window', '$location', '$timeout', '$http', '$log', 'JerarquiaAncestros', 'Periodo', 'ExportarResultadosJerarquia', 'ResumenNodoJerarquia', 'Jerarquia',
			function ($q, $rootScope, $scope, $routeParams, $window, $location, $timeout, $http, $log, JerarquiaAncestros, Periodo, ExportarResultadosJerarquia, ResumenNodoJerarquia, Jerarquia) {
				$scope.actualizando = 0;
				$scope.numgraphs = 0;
				$scope.graficasbarras = false;
				$scope.mesActual = (new Date()).getMonth();
				$scope.graphs = false;
				$scope.padre = '';
				$scope.ancestros = [];

				$scope.periodos = Periodo.query(function(){
					$scope.periodo = $scope.periodos[0];
				});

				$scope.getAncestros = function() {
					/* function(jerarquia) */
					return $scope.ancestros;
				};

				$scope.exists = function (attr) {
					
					return $rootScope.anualidad && $scope.resumenJerarquiaSeleccionada[$rootScope.anualidad] &&
						typeof $scope.resumenJerarquiaSeleccionada[$rootScope.anualidad][attr] !== 'undefined';
				};

				$scope.descargarExcel = function () {
					if ($scope.actualizando === 0){
						$scope.actualizando += 1;

						ExportarResultadosJerarquia.get({'jerarquia': $scope.jerarquiaSeleccionada.id}).$promise.then(function(token){
							$scope.actualizando -= 1;
							if (typeof token === 'object'){
								$rootScope.cbDownload(token);
							} else {
								$rootScope.toaster('Error al descargar el informe', 'Error', 'error');
							}
						}, function(){
							$scope.actualizando -= 1;
							$rootScope.toaster('Error al descargar el informe.', 'Error', 'error');
						});
					} else {
						$rootScope.toaster('Espere a que termine la generación y descarga del informe previo solicitado.', 'Error', 'error');
					}
				};
				function sparkline(){
					$('.sparkline>canvas').remove();
					$.each($('.sparkline'), function(k, v){
						const obj = String($(v).attr('data-value'));
						try {
							$(v).sparkline(JSON.parse(obj), {'type': 'bar', 'barColor': '#a94442'});
						} catch (e) {
							/*$log.error('sparkline mal formed VALUE WAS:' + t , obj);*/
							$(v).sparkline([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], {'type': 'bar', 'barColor': '#a94442'});
						}
					});
				}

				$scope.sparkline = function(){
					$timeout(sparkline, 100);
				};
				$scope.updateGraphKeys = function(){
					$scope.sparkline();

					const anualidad = $rootScope.getIntAnualidad();
					var anualidadAnterior = anualidad - 1;
					var graphskeys = [
						{
							'caption': 'RESUMEN DE DATOS DE GESTIÓN ' + anualidad,
							'keys': [
								{'caption': 'Solicitados', 'vals': 'periodos.a' + anualidad + '.solicitados', 'maxx': $scope.mesActual},
								{'caption': 'Iniciados', 'vals': 'periodos.a' + anualidad + '.iniciados', 'maxx': $scope.mesActual},
								{'caption': 'Pendientes', 'vals': 'periodos.a' + anualidad + '.pendientes', 'maxx': $scope.mesActual},
								{'caption': 'Total resueltos', 'vals': 'periodos.a' + anualidad + '.total_resueltos', 'maxx': $scope.mesActual},
								{'caption': 'Total resueltos ' + anualidadAnterior, 'vals': 'periodos.a' + anualidadAnterior + '.total_resueltos', 'maxx': 12}
							]
						},
						{
							'caption': 'RESUELTOS EN PLAZO ' + anualidad,
							'keys': [
								{'caption': 'En plazo', 'vals': 'periodos.a' + anualidad + '.en_plazo', 'maxx': $scope.mesActual},
								{'caption': 'Fuera de plazo', 'vals': 'periodos.a' + anualidad + '.fuera_plazo', 'maxx': $scope.mesActual}
							]
						},
						{
							'caption': 'DESESTIMIENTOS/RENUNCIAS Y PRESCRITOS/CADUCADOS ' + anualidad,
							'keys': [
								{'caption': 'Resueltos por Desistimiento/Renuncia/Caducidad (Resp_Ciudadano)', 'vals': 'periodos.a' + anualidad + '.resueltos_desistimiento_renuncia_caducidad', 'maxx': $scope.mesActual},
								{'caption': 'Resueltos por Prescripcion/Caducidad (Resp_Admon)', 'vals': 'periodos.a' + anualidad + '.resueltos_prescripcion', 'maxx': $scope.mesActual}
							]
						},
						{
							'caption': 'QUEJAS Y RECURSOS CONTRA LOS PROCEDIMIENTOS DE LA JERARQUÍA ' + anualidad,
							'keys': [
								{'caption': 'Quejas presentadas en el mes', 'vals': 'periodos.a' + anualidad + '.quejas', 'maxx': $scope.mesActual},
								{'caption': 'Recursos presentados en el mes', 'vals': 'periodos.a' + anualidad + '.recursos', 'maxx': $scope.mesActual}
							]
						}
					];
					$scope.graphskeys = graphskeys;
					$scope.graphs = [];
					$scope.numgraphs = 0;
					graphskeys.forEach(function (g, i) {
						let maxvalue = 0;
						const data = [];
						const caption = g.caption;
						g.keys.forEach(function (key, indx) {
							let k = $scope.resumenJerarquiaSeleccionada;
							const values = [];
							const indexes = key.vals.split('.');
							for (const j in indexes) {
								const index = indexes[j];
								if (typeof k[index] === 'undefined'){
									break;
								}
								k = k[index];
							}
							if (typeof k !== 'undefined' && k.length > 0) {
								k.forEach(function (val, idx) {
									//dibujar meses anteriores al actual
									if (anualidad < $rootScope.getIntAnualidad() || (idx <= graphskeys[i].keys[indx].maxx && anualidad === $rootScope.getIntAnualidad())) {
										values.push([idx, val]);
										if (maxvalue < val){
											maxvalue = val;
										}
									}
								});
								if (values.length > 0){
									data.push({key: key.caption, values: values});
								}
							} else {
								$log.log('Index malo:' + JSON.stringify(indexes));
								//$log.log(JSON.stringify($scope.resumenJerarquiaSeleccionada));
							}
						});
						var forcey = [0, Math.ceil(maxvalue * 1.3)];
						if (maxvalue > 0 && data.length > 0) {

							$scope.graphs.push({'data': data, 'forcey': forcey, 'caption': caption});
							$scope.numgraphs += 1;
						}
					});
				};

				$scope.resumenJerarquiaSeleccionada = ResumenNodoJerarquia.get({'jerarquia': $routeParams.idjerarquia}, function(){
					$scope.updateGraphKeys();
				});

				$scope.jerarquiaSeleccionada = Jerarquia.get({'id': $routeParams.idjerarquia}, function () {
					$rootScope.setTitle($scope.jerarquiaSeleccionada.nombrelargo);

					$scope.ancestros = JerarquiaAncestros.query({'idjerarquia': $routeParams.idjerarquia}, function(){
						if ($scope.ancestros && $scope.ancestros[0] && $scope.ancestros[0].id === 1){
							$scope.ancestros.reverse();//TODO: revisar este parche
						}
					});

					$scope.superuser = $rootScope.superuser();

					$scope.filtrosocultos = false;

					$scope.gotoBreadCrumb = function () {
						//$location.hash('breadcrumb');
					};

					$scope.gotOkCancel = function () {
						//$location.hash('ok_cancel_changeOrganica');
					};
				});

				$scope.attrspar = [
					'id', 'nombrelargo', 'numprocedimientos'
				];

				$scope.attrstabla = [
					'solicitados',
					'iniciados',
					'quejas', 'recursos',
					'resueltos_1', 'resueltos_5', 'resueltos_10', 'resueltos_15', 'resueltos_30', 'resueltos_45', 'resueltos_mas_45',
					'resueltos_desistimiento_renuncia_caducidad', 'resueltos_prescripcion',
					'en_plazo',
					't_medio_habiles', 't_medio_naturales'
				];
				/* 'totalsolicitudes', */
				$scope.attrstablacalculados = ['total_resueltos', 'fuera_plazo', 'pendientes'];
				$scope.attrstabla = $scope.attrstabla.concat($scope.attrstablacalculados);

				$scope.meses = $rootScope.meses;
				$scope.colorText = $rootScope.colorText;

				$scope.graficasgrandes = false;
				$scope.xAxisTickValuesFunction = function () {
					return function () {
						return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
					};
				};
				$scope.xAxisTickFormatFunction = function () {
					return function (d) {
						return $scope.meses[d];
					};
				};
				$scope.colorFunction2 = function () {
					return function (d, i) {
						return $rootScope.colorToHex($rootScope.colorText(i, 5, 60));
					};
				};
				var colorCategory = d3.scale.category20b();
				$scope.colorFunction = function () {
					return function (d, i) {
						return colorCategory(i);
					};
				};
			}
		]);

})(angular, d3, $);

/*

			//    $scope.downloadGraphic = function (id) {
			//        console.log(id);
			//        var canvas = document.getElementById(id);
			//        var ctx = canvas.getContext("2d");
			//        // draw to canvas...
			//        canvas.toBlob(function (blob) {
			//            saveAs(blob, "image.png");
			//        });
			//    };
			//
			//    $scope.guardarImagen = function(id) {
			////        http://techslides.com/save-svg-as-an-image
			//      var html = d3.select('#svg'+id)
			//        .attr("version", 1.1)
			//        .attr("xmlns", "http://www.w3.org/2000/svg")
			//        .node().parentNode.innerHTML;
			//
			//        console.log(html);
			//        var imgsrc = 'data:image/svg+xml;base64,'+ btoa(html);
			//        var img = '<img src="'+imgsrc+'">';
			//        d3.select("#svgdataurl"+id).html(img);
			//
			//
			//        var canvas = document.querySelector("canvas"),
			//                context = canvas.getContext("2d");
			//
			//        var image = new Image();
			//        image.src = imgsrc;
			//        image.onload = function() {
			//            context.drawImage(image, 0, 0);
			//            var canvasdata = canvas.toDataURL("image/png");
			//            var pngimg = '<img src="'+canvasdata+'">';
			//            d3.select("#pngdataurl"+id).html(pngimg);
			//
			//            var a = document.createElement("a");
			//            a.download = "grafica.png";
			//            a.href = canvasdata;
			//            a.click();
			//        };
			//    };
*/
