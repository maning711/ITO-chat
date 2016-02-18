/**
 * created by maning
 */
angular.module('technodeApp').config(function($routeProvider, $locationProvider) {
    $locationProvider.html5Mode(true);
    $routeProvider.when('/', {
        templateUrl: '/pages/room.html',
        controller: 'roomCtrl'
    }).when('/login', {
        templateUrl: '/pages/login.html',
        controller: 'LoginCtrl'
    }).otherwise({
        redirectTo: '/login'
    });
});