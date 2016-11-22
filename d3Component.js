angular
    .module('d3-component')
    .directive('d3Component', d3Component);

function d3Component($window, $log) {
    var d3 = $window.d3,
        configuratorPfx = 'd3c',
        configuratorRx = new RegExp('^' + configuratorPfx + '(.+)$');

    function link($scope, $element, $attrs) {
        var componentFactory = $scope.$eval($attrs.d3Component, { d3: d3 }),
            configurators;
        if (!componentFactory || typeof componentFactory !== 'function') {
            throw 'd3-component expression did not evaluate to a function:' + $attrs.d3Component;
        } else {
            configurators = collectConfigurators(componentFactory, $attrs);
            $scope.$watchGroup(
                configurators.map(function(configurator) { return $attrs[configurator.attr]; }),
                function(configValuesNew) {
                    var component = configureComponent(componentFactory, configurators, configValuesNew);
                    $element.empty();
                    if (component) {
                        d3.select($element[0]).call(component);
                    }
                }
            );
        }
    }

    function configureComponent(componentFactory, configurators, configValuesNew) {
        var allDefined = configValuesNew.reduce(function(previous, current) {
                return previous && current !== null && (typeof current !== 'undefined');
            }, true),
            component;
        if (allDefined) {
            component = componentFactory();
            for (var i = 0; i < configurators.length; i++) {
                component = configurators[i].call(component, configValuesNew[i]);
            }
        }
        return component;
    }

    function collectConfigurators(componentFactory, $attrs) {
        var configurators = [],
            component = componentFactory(),
            attr,
            match,
            configurator;
        for (attr in $attrs) {
            if ($attrs.hasOwnProperty(attr)) {
                if ((match = attr.match(configuratorRx))) {
                    configurator = component[camelCase(match[1])];
                    configurator.attr = match[0];
                    if (!configurator || typeof configurator !== 'function') {
                        $log.warn('no such D3 component configuation method: ' +
                            $attrs.d3Component + '().' + camelCase(match[1]) + '()');
                    } else {
                        configurators.push(configurator);
                    }
                }
            }
        }
        return configurators;
    }

    function camelCase(attr) {
        return attr.substring(0, 1).toLowerCase() + attr.substring(1);
    }

    return {
        restrict: 'A',
        link: link
    };
}
