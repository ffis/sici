function TestExpedienteCtrl($rootScope, $scope, $window, $http, TestExpediente) {
    $rootScope.nav = 'recalculate';
    $window.document.title = 'SICI';
    $scope.respuesta = {
        clase: 'alert-success',
        mensaje: 'Sin ejecutar'
    };
    $scope.inicializar = function () {
        var postData = {'id': 5555, 'usr': 'vcc11n', 'fecha_inicio': 1416480534000};
        var expediente = new TestExpediente(postData);
        expediente.$create({procedimiento: 1782}, function () {
            $scope.respuesta = {
                clase: 'alert-success',
                mensaje: 'Ha funcionado perfectamente.'
            };
        }, function () {
            $scope.respuesta = {
                clase: 'alert-warning',
                mensaje: 'Ha fallado.'
            };
        });
    };

    $scope.finalizar = function () {
        var postData = {'fecha_fin': 1387532580000};
        var expediente = new TestExpediente(postData);
        expediente.$update({procedimiento: 1782, id: 5555}, function () {
            $scope.respuesta = {
                clase: 'alert-success',
                mensaje: 'Ha funcionado perfectamente.'
            };
        }, function () {
            $scope.respuesta = {
                clase: 'alert-warning',
                mensaje: 'Ha fallado.'
            };
        });
    };

    $scope.buscar = function () {
        TestExpediente.get({procedimiento: 1782, id: 5555}, function () {
            $scope.respuesta = {
                clase: 'alert-success',
                mensaje: 'Ha funcionado perfectamente.'
            };
        }, function () {
            $scope.respuesta = {
                clase: 'alert-warning',
                mensaje: 'Ha fallado.'
            };
        });
    }
    
    $scope.borrar = function () {
        TestExpediente.delete({procedimiento: 1782, id: 5555}, function () {
            $scope.respuesta = {
                clase: 'alert-success',
                mensaje: 'Ha funcionado perfectamente.'
            };
        }, function () {
            $scope.respuesta = {
                clase: 'alert-warning',
                mensaje: 'Ha fallado.'
            };
        });
    }
}

TestExpedienteCtrl.$inject = ['$rootScope', '$scope', '$window', '$http', 'TestExpediente'];