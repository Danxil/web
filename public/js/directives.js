'use strict';

var directives = angular.module('directives', []);

directives.directive('getDomElem', function()
{
	return function ($scope, elem, attrs)
	{
		$scope.domElements[attrs.getDomElem] = $(elem[0]);
	};
});


directives.directive('stopProp', function()
{
	return function ($scope, elem, attrs)
	{
		elem.bind(attrs.stopProp, function (e)
		{
			e.stopPropagation();
		});
	};
});

directives.directive('file', function()
{
    return {
        scope:
		{
            file: '='
        },
        link: function($scope, elem, attrs)
		{
			elem.bind('change', function(event)
			{
				$scope.$apply(function()
				{
					var files = event.target.files;
					var file = files[0];
					$scope.file = file ? file.name : undefined;
				});
			});
        }
    };
});

directives.directive('imagePreview', function()
{
	return function ($scope, elem, attrs)
	{
        elem = $(elem[0]);

		attrs.$observe('value', function(value)
		{
			var img = elem.parents('.ng__img-preview-wrapper').find('img.ng-image-preview');
				
			if (!img.length)
			{
				var img = $('<img class="ng-image-preview" alt="">');
				
				elem.parent().append(img);
			}
			
			if (!value.length)
				img.attr('src', '');
			else
			{
				var reader = new FileReader();
				
				reader.onload = function(data)
				{
					img.attr('src', data.target.result);
				}
				
				reader.readAsDataURL(elem[0].files[0]);
			}
		});
	};
});

directives.directive('addScroll', function()
{
	return function ($scope, elem, attrs)
	{
		$(elem[0]).mCustomScrollbar(
		{
			axis: 'x',
			scrollInertia: 800,
			snapAmount: 200,
			mouseWheel:
			{
				scrollAmount: 200
			},
			advanced:{autoExpandHorizontalScroll:true},
			theme: 'rounded-dots'
		});
	};
});

directives.directive('navLink', function()
{
    return function ($scope, elem, attrs)
    {
        $('.main').on('touchmove',  function(e) {e.preventDefault(); console.log(11);});

        $(elem[0]).click(function(event)
        {
            event.preventDefault();

            var link = $(this);
            var page = link.attr('data-nav-link');

            switch (page)
            {
                case 'main':
                {
                    $('.wrapper').animate(
                    {
                        top: 0
                    });

                    break;
                }

                case 'projects':
                {
                    var offsetTop = $('.js__projects').offset().top;

                    $('.wrapper').animate(
                    {
                        top: -offsetTop
                    });

                    break;
                }
            }

            $scope.clickMenuLink(page);
        });
    }
});


directives.directive('scroll', function()
{
    return function ($scope, elem, attrs)
    {
        var elem = $(elem[0]);

        elem.on('mousewheel', function(event)
        {
            event.preventDefault();

            var scrollStep = 50;

            if (event.deltaY < 0)
                elem.scrollLeft(elem.scrollLeft() + scrollStep);
            else
                elem.scrollLeft(elem.scrollLeft() - scrollStep);
        });
    }
});

directives.directive('checkVisibilityPage', function()
{
    return function ($scope, elem, attrs)
    {
        var elem = $(elem[0]);

        function check(flag)
        {
            var distToBottom = $(document).height() - elem.offset().top - $(window).scrollTop() - $(window).height();

            if (distToBottom <= -100)
            {
                $scope.clickMenuLink(attrs.checkVisibilityPage);

                if (flag !== true)
                    $scope.$apply();
            }
        }

        check(true);

        $(window).scroll(check);
    }
});

directives.directive('checkLoadImg', function($timeout, $interval)
{
    return function ($scope, elem, attrs)
    {
        elem = $(elem[0]);

        var successVar = attrs.checkLoadImgSuccess;
        var completeVar = attrs.checkLoadImgComplete;

        if (successVar)
            $scope[successVar] = false;

        if (completeVar)
            $scope.$parent[completeVar] = false;

        $timeout(function()
        {
            var interval = parseInt(attrs.checkLoadImg);

            if (elem.is('img'))
                var img = elem;
            else
                var img = elem.find('img');

            if (img.closest('.ng__check-load-img-wrapper').length == 0)
                var wrapper = elem;
            else
                var wrapper = img.closest('.ng__check-load-img-wrapper');

            wrapper.hide();

            var imgComplete = [];

            img.each(function()
            {
                $(this).load(function()
                {
                    check(img, wrapper, imgComplete, interval);
                });

            });

            img.error(function()
            {
                check(img, wrapper, imgComplete, interval);
            });
        });

        function check(img, wrapper, imgComplete, interval)
        {
            $scope.$apply(function()
            {
                imgComplete.push(true);

                if (imgComplete.length == img.length)
                {
                    if (successVar)
                        $scope[successVar] = [];

                    var i = 0;

                    if (completeVar)
                        $scope.$parent[completeVar] = true;

                    if (interval)
                        var show = $interval(function()
                        {
                            if (i > imgComplete.length)
                                $interval.cancel(show);

                            $(wrapper[i]).show();

                            if (successVar)
                                $scope[successVar].push(true);

                            $(wrapper[i]).addClass('rotateIn'); // Angular long tought before update $scope[successVar]

                            i++;
                        }, interval);
                    else
                    {
                        wrapper.show();

                        for (var i = 0; i < img.length; i++)
                            $scope[successVar].push(true);
                    }
                }
            });
        }
    }
});

directives.directive('toggleForm', function()
{
    return function ($scope, elem, attrs)
    {
        var action = attrs.toggleForm;

        $scope.$watch(action + 'Data', function(newValue, oldValue)
        {
            if (newValue !== undefined)
                $('.bs__' + action + 'Form').modal('show');
            else
                $('.bs__' + action + 'Form').modal('hide');
        });
    }
});

directives.directive('focusMe', function($timeout) {
    return {
        scope: { trigger: '=focusMe' },
        link: function(scope, element) {
            scope.$watch('trigger', function(value) {
                if(value === true) {
                    $timeout(function() {
                        element.focus();
                        scope.trigger = false;
                    });
                }
            });
        }
    };
});

directives.directive('hover', function($timeout) {
    return {
        scope: { trigger: '=focusMe' },
        link: function(scope, elem) {
            elem = $(elem[0]);

            elem.mouseenter(function(){
                elem.prev().addClass('prev-hover');
                elem.next().addClass('next-hover');
            });

            elem.mouseleave(function(){
                elem.siblings().removeClass('prev-hover next-hover');
            });
        }
    };
});
