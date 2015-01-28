function RecalculateCtrl($rootScope, $scope, $window, $http) {
    $rootScope.nav = 'recalculate';
    $scope.actualizando = 0;
    $window.document.title = 'SICI';
    $scope.respuestas = [];
    $scope.funcionalidades = [
        {label: 'Procedimientos', fn: [{label: "Recalcular caché", cmd: '/api/v1/restricted/fprocedimiento'}]},
        {label: 'Jerarquia', fn: [{label: "Recalcular", cmd: '/api/v1/restricted/jerarquia'}]},
        {label: 'Permisos', fn: [{label: "Recalcular", cmd: '/api/v1/restricted/fpermiso'}]},
        {label: 'Personas', fn: [{label: "Recalcular", cmd: '/api/v1/restricted/excelgesper'}]},
    ];
    $scope.clasefuncionalidades = 'col-md-' + (12 / $scope.funcionalidades.length).toFixed(0);

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

RecalculateCtrl.$inject = ['$rootScope', '$scope', '$window', '$http'];
