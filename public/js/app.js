'use strict';

var app = angular.module('app', [
        'ngAnimate',
        'controllers',
        'directives',
        'filters'
    ]).run(function($rootScope, $location, $window) {
    $rootScope.location = location;
    $rootScope.$location = $location;
});

app.config(['$httpProvider', function($httpProvider) {
    $httpProvider.defaults.headers.common["X-Requested-With"] = 'XMLHttpRequest';
}]);