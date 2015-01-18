'use strict';

var controllers = angular.module('controllers', []);

controllers.controller('mainController', ['$scope', '$compile', '$http', '$filter', '$timeout', '$window', '$sce',
	function ($scope, $compile, $http, $filter, $timeout, $window, $sce) {
        function orderResult(autoclose)
        {
            if (autoclose == undefined)
                autoclose = true;

            $scope.orderResult = true;

            if (autoclose)
                $timeout(function()
                {
                    delete $scope.orderResult;

                    delete $scope.orderProcess;
                }, 4000);

            delete $scope.clientContact;

            $scope.orderForm.clientContact.$setUntouched();
        }

		$scope.clickMenuLink = function(page)
		{
			if ($scope.pageActive == page)
				return;

            $scope.pageActive = page;

            switch (page)
			{
				case 'main':
				{

					break;
				}

				case 'projects':
                {
					if ($scope.projects)
						return;

                    ajaxAPI.get.projects($http, function(response)
                    {
                        $scope.projects = response.projects;
                    });

                    break;
                }
			}
		};

		$scope.selectImage = function(image, $scope)
		{
			$scope.currentImage = image
		}

        $scope.sendOrder = function()
        {
            if ($scope.orderForm.$valid)
            {
                $scope.orderForm.clientContact.$setUntouched();

                delete $scope.orderSuccess;

                $scope.orderProcess = true;

                ajaxAPI.post.order($http, {clientContact: $scope.clientContact}, function (response) {
                    $scope.orderSuccess = true;

                    orderResult();
                },function()
                {
                    $scope.orderSuccess = false;

                    orderResult(false);
                });
            }
            else
                $scope.orderForm.clientContact.$setTouched();
        };

        $scope.closeOrderResult = function()
        {
            delete $scope.orderResult;
        };

		$scope.domElements = {};

		$scope.locales = [{link: '/en', name: 'En'}, {link: '/ru', name: 'Ru'}];
	}
]);

controllers.controller('adminController', ['$scope', '$compile', '$http', '$filter',
	function ($scope, $compile, $http, $filter)
	{
		$scope.domElements = {};

		ajaxAPI.get.projects($http, function(response)
		{
			$scope.projects = response.projects;
			$scope.currentUser = response.currentUser;
		});

		$scope.toggleForm = function(action, data)
        {
            switch (action)
            {
                case 'newProject':
                {
                    if ($scope.newProjectData)
                        delete $scope.newProjectData;
                    else {
						$scope.newProjectData =
						{
							images: [],
							links: [],
							shots: []
						};

						$scope.linkPhantomWatcher = $scope.$watch('newProjectData.linkPhantom', function (newValue, oldValue) {
							if (newValue && !oldValue)
								$scope.newProjectData.links.push(newValue)

							$scope.newProjectData.linkPhantom = '';
						});

						$scope.linksWatcher = $scope.$watchCollection('newProjectData.links', function (newValue, oldValue) {
							angular.forEach(newValue, function (value, index) {
								if (!value)
									$scope.newProjectData.links.splice(index, 1);
							});
						});

						$scope.shotPhantomWatcher = $scope.$watch('newProjectData.shotPhantom', function (newValue, oldValue) {
							if (newValue && !oldValue)
								$scope.newProjectData.shots.push(newValue)

							$scope.newProjectData.shotPhantom = '';
						});

						$scope.shotsWatcher = $scope.$watchCollection('newProjectData.shots', function (newValue, oldValue) {
							angular.forEach(newValue, function (value, index) {
								if (!value)
									$scope.newProjectData.shots.splice(index, 1);
							});
						});
					}

                    break;
                }

                case 'editProject':
                {
                    if ($scope.editProjectData)
                    {
                        delete $scope.editProjectData;
                        delete $scope.amendProjectData;
                    }
                    else
                    {
                        $scope.editProjectData =
                        {
                            images:
                            {
                                new: [],
                                delete: []
                            },
							links:
							{
								new: [],
								delete: []
							},
							shots: []
                        }

						$scope.linkPhantomWatcher = $scope.$watch('amendProjectData.linkPhantom', function (newValue, oldValue) {
							if (newValue && !oldValue)
								$scope.amendProjectData.links.push(newValue)

							$scope.amendProjectData.linkPhantom = '';
						});

						$scope.linksWatcher = $scope.$watchCollection('amendProjectData.links', function (newValue, oldValue) {
							angular.forEach(newValue, function (value, index) {
								if (!value)
									$scope.amendProjectData.links.splice(index, 1);
							});
						});

						$scope.shotPhantomWatcher = $scope.$watch('editProjectData.shotPhantom', function (newValue, oldValue) {
							if (newValue && !oldValue)
								$scope.editProjectData.shots.push(newValue)

							$scope.editProjectData.shotPhantom = '';
						});

						$scope.shotsWatcher = $scope.$watchCollection('editProjectData.shots', function (newValue, oldValue) {
							angular.forEach(newValue, function (value, index) {
								if (!value)
									$scope.editProjectData.shots.splice(index, 1);
							});
						});

                        $scope.amendProjectData = data.project;
                        $scope.amendProjectData.$index = data.$index;

						$scope.editProjectData.order = data.project.order;
                        $scope.editProjectData.title = data.project.title;
                        $scope.editProjectData.description = data.project.description;

						$scope.defaultAmnedLinks = [];

						angular.forEach(data.project.links, function (value, index) {
							$scope.defaultAmnedLinks.push(value);
						});
                    }

                    break;
                }
            }

            $scope.toggleOverlay();
		};


		$scope.createProject = function()
		{
			ajaxAPI.post.projects(newProjectForm, function(response)
			{
				$scope.$apply(function()
				{
					$scope.projects.push($scope.newProjectData);

					$scope.projects[$scope.projects.length - 1]._id = response._id;
					$scope.projects[$scope.projects.length - 1].images = response.images;

					$scope.toggleForm('newProject');
				});
			});

			$scope.linkPhantomWatcher();
			$scope.linksWatcher();

			$scope.shotPhantomWatcher();
			$scope.shotsWatcher();
		};

		$scope.editProject = function(_id)
		{
			$scope.linkPhantomWatcher();
			$scope.linksWatcher();

			$scope.shotPhantomWatcher();
			$scope.shotsWatcher();

			angular.forEach($scope.defaultAmnedLinks, function (value, index) {
				if ($scope.amendProjectData.links.indexOf(value) == -1)
					$scope.editProjectData.links.delete.push(value);
			});

			angular.forEach($scope.amendProjectData.links, function (value, index) {
				if ($scope.defaultAmnedLinks.indexOf(value) == -1)
					$scope.editProjectData.links.new.push(value);
			});

			ajaxAPI.put.projects(editProjectForm, _id, function(response)
			{
				$scope.$apply(function()
				{
					$scope.projects[$scope.amendProjectData.$index].title = $scope.editProjectData.title;
					$scope.projects[$scope.amendProjectData.$index].description = $scope.editProjectData.description;

					if (response.newImages)
						for (var i = 0; i < response.newImages.length; i++)
							$scope.projects[$scope.amendProjectData.$index].images.push(response.newImages[i]);

					if ($scope.editProjectData.images.delete.length)
					{
						var deleteImages = $scope.editProjectData.images.delete;

						for (var i = 0; i < deleteImages.length; i++)
							$scope.projects[$scope.amendProjectData.$index].images.splice($scope.projects[$scope.amendProjectData.$index].images.indexOf(deleteImages[i]), 1);
					}

					if (response.newLinks)
						for (var i = 0; i < response.newImages.length; i++)
							$scope.projects[$scope.amendProjectData.$index].links.push(response.newLinks[i]);

					if ($scope.editProjectData.links.delete.length)
					{
						var deleteLinks = $scope.editProjectData.images.delete;

						for (var i = 0; i < deleteLinks.length; i++)
							$scope.projects[$scope.amendProjectData.$index].links.splice($scope.projects[$scope.amendProjectData.$index].links.indexOf(deleteLinks[i]), 1);
					}

                    $scope.toggleForm('editProject');
				});
			});
		};

        $scope.deleteNewImg = function(array, $index)
        {
            array[$index] = null;
        }

        $scope.deleteProject = function(id, $index)
        {
            ajaxAPI.delete.projects($http, id, function(response)
            {
                $scope.projects.splice($index, 1);
            });
        };

        $scope.deleteImage = function(image)
		{
			$scope.editProjectData.images.delete.push(image);
		};

		$scope.logout = function()
		{
			ajaxAPI.delete.session($http, function(response, code)
			{
				window.location = '/session';
			});
		};

        $scope.toggleOverlay = function()
        {
            if ($scope.overlay)
                delete $scope.overlay;
            else
                $scope.overlay = true;
        };
	}
]);

controllers.controller('authorisationController', ['$scope', '$compile', '$http', '$filter',
	function ($scope, $compile, $http, $filter)
	{
		$scope.authorisation = function()
		{
			ajaxAPI.post.session($http, $scope.authorisationData, function(response, code)
			{
				window.location = '/administration';
			},
			function(response, code)
			{
				if (code == 401)
				{
					$scope.authorisationError = true;
					
					delete $scope.authorisationData.pass;
				}
			});
		}
	}
]);

controllers.controller('registrationController', ['$scope', '$compile', '$http', '$filter',
	function ($scope, $compile, $http, $filter)
	{
		$scope.newUser = function()
		{
			$scope.newUserSuccess = false;
			$scope.newUserError = false;
			
			ajaxAPI.post.newUser($http, $scope.newUserData, function(response)
			{
				$scope.newUserSuccess = true;
			}, function()
			{
				$scope.newUserError = true;
			});
		}
	}
]);

controllers.controller('usersController', ['$scope', '$compile', '$http', '$filter',
	function ($scope, $compile, $http, $filter)
	{
		ajaxAPI.get.users($http, function(response)
		{
			$scope.users = response;
		});
		
		$scope.addToAdmin = function($index)
		{	
			ajaxAPI.put.users($http, $scope.users[$index].login, {group: 0}, function(response)
			{
				$scope.users[$index].group = 0;
			});
		}
		
		$scope.removeFromAdmin = function($index)
		{	
			ajaxAPI.put.users($http, $scope.users[$index].login, {group: 1}, function(response)
			{
				$scope.users[$index].group = 1;
			});
		}
	}
]);
