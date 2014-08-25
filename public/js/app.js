'use strict';

var app = angular.module('app', ['ngAnimate', 'controllers', 'directives', 'filters']);

app.config(['$httpProvider', function($httpProvider) {
    $httpProvider.defaults.headers.common["X-Requested-With"] = 'XMLHttpRequest';
}]);