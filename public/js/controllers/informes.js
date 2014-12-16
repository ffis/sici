function InformesCtrl($rootScope, $scope, $window, $http, ExportarPersonas) {
    $rootScope.nav = 'recalculate';
    $scope.actualizando = 0;
    $window.document.title = 'SICI';
    $scope.respuestas = [];
    $scope.funcionalidades = [
        {label: 'Informe global', fn: [{label: "Descargar Excel", cmd: 'descargarexcel'}]}
    ];
    $scope.clasefuncionalidades = 'col-md-' + (12 / $scope.funcionalidades.length);

    $scope.invoke = function (cmd) {
        if ($scope.actualizando) {
            alert('Espere a que termine la actualización previa');
            return;
        }
        $scope.actualizando++;
        if (cmd === 'descargarexcel') {
            ExportarPersonas.get(function (token) {
                $scope.actualizando--;
                $scope.respuestas.push({
                    clase: 'alert-success',
                    mensaje: 'Ha funcionado perfectamente.'
                });
                var url = '/download/' + token.time + '/' + token.hash;
                $window.location = url;
            });
        }
    };
}

InformesCtrl.$inject = ['$rootScope', '$scope', '$window', '$http', 'ExportarPersonas'];