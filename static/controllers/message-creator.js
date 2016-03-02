/**
 * created by maning
 */
angular.module('technodeApp').controller('MessageCreatorCtrl', function($scope, socket) {
    $scope.createMessage = function () {
        socket.emit('createMessage', $scope.newMessage)
        $scope.newMessage = ''
    }
});