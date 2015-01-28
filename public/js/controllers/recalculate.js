function RecalculateCtrl($rootScope, $scope, $window, $http, PersonasActualizacionGesper) {
    $rootScope.nav = 'recalculate';
    $scope.actualizando = 0;
    $window.document.title = 'SICI';
    $scope.respuestas = [];
    $scope.funcionalidades = [
        {label: 'Procedimientos', fn: [{label: "Recalcular caché", cmd: '/api/fprocedimiento'}]},
        {label: 'Jerarquia', fn: [{label: "Recalcular", cmd: '/api/fjerarquia'}]},
        {label: 'Permisos', fn: [{label: "Recalcular", cmd: '/api/fpermiso'}]},
        {label: 'Personas', fn: [{label: "Recalcular", cmd: '/api/excelgesper'}]},
        {label: 'Importar Procedimientos', fn: [{label: "Importar", cmd: '/test/testImportadorExcel'}]},
        {label: 'Consultar login', fn: [{label: "Consultar login", cmd: '/api/persona/infoByLogin/ain51q'}]}
    ];
    $scope.clasefuncionalidades = 'col-md-' + (12 / $scope.funcionalidades.length);

    $scope.invoke = function (cmd) {
        if ($scope.actualizando) {
            alert('Espere a que termine la actualización previa');
            return;
        }
        $scope.actualizando++;
        $http.get(cmd).then(function () {
            $scope.actualizando--;
            $scope.respuestas.push({
                clase: 'alert-success',
                mensaje: 'Ha funcionado perfectamente.'
            });
        }, function () {
            $scope.actualizando--;
            $scope.respuestas.push({
                clase: 'alert-warning',
                mensaje: 'Ha fallado.'
            });
        });
    };
    
    $scope.actualizarPersonas = function() {
        PersonasActualizacionGesper.query(function(data) {
//            console.log(data);
        });
    };

}

RecalculateCtrl.$inject = ['$rootScope', '$scope', '$window', '$http', 'PersonasActualizacionGesper'];