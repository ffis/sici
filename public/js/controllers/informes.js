function InformesCtrl($rootScope, $scope, $window, $http, ExportarInforme) {
    $rootScope.nav = 'recalculate';
    $scope.actualizando = 0;
    $window.document.title = 'SICI';
    $scope.respuestas = [];
    $scope.funcionalidades = [
        {label: 'Informe global', fn: [{label: "Descargar Excel", cmd: 'descargarexcel', anyo: true}]}
    ];
    $scope.clasefuncionalidades = 'col-md-' + (12 / $scope.funcionalidades.length);
    $scope.anyos = [{code: 'a2014', name: '2014'}, {code: 'a2015', name: '2015'}];
    $scope.anyoSelected = '';

    $scope.invoke = function (cmd) {
        if ($scope.actualizando) {
            alert('Espere a que termine la actualización previa');
            return;
        }
        $scope.actualizando++;
        if (cmd === 'descargarexcel') {
            if ($scope.anyoSelected === '') {
                $scope.respuestas.push({
                    clase: 'alert-warning',
                    mensaje: 'Debe seleccionar un año.'
                });
                $scope.actualizando--;
                return;
            }
            ExportarInforme.get({year: $scope.anyoSelected}, function (token) {
                $scope.actualizando--;
                $scope.respuestas.push({
                    clase: 'alert-success',
                    mensaje: 'Ha funcionado perfectamente.'
                });
                var url = '/download/' + token.time + '/' + token.hash;
                $window.location = url;
            }, function() {
                $scope.actualizando--;
                $scope.respuestas.push({
                    clase: 'alert-warning',
                    mensaje: 'Error al descargar el informe.'
                });
            });
        }
    };
    
    $scope.updateAnyoSelected = function(code) {
        $scope.anyoSelected = code;
    };
}

InformesCtrl.$inject = ['$rootScope', '$scope', '$window', '$http', 'ExportarInforme'];