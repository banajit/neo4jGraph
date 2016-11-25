'use strict';

(function (angular) {

angular.module('neo4jApp')
  .directive('graph', function ($timeout) {
    return {
      templateUrl: 'components/graph/graph.html',
      restrict: 'EA',
      controller: 'graphCtrl',
      link: function (scope) {
        var sigmaInstance, loaded = 0;
        sigma.utils.pkg('sigma.canvas.nodes');
        sigma.canvas.nodes.image = (function() {
          var _cache = {},
              _loading = {},
              _callbacks = {};
          // Return the renderer itself:
          var renderer = function(node, context, settings) {
            var args = arguments,
                prefix = settings('prefix') || '',
                size = node[prefix + 'size'],
                color = node.color || settings('defaultNodeColor'),
                url = node.url;
            if (_cache[url]) {
              context.save();
              // Draw the clipping disc:
              context.beginPath();
              context.arc(
                node[prefix + 'x'],
                node[prefix + 'y'],
                node[prefix + 'size'],
                0,
                Math.PI * 2,
                true
              );
              context.closePath();
              context.clip();
              // Draw the image
              context.drawImage(
                _cache[url],
                node[prefix + 'x'] - size,
                node[prefix + 'y'] - size,
                2 * size,
                2 * size
              );
              // Quit the "clipping mode":
              context.restore();
              // Draw the border:
              context.beginPath();
              context.arc(
                node[prefix + 'x'],
                node[prefix + 'y'],
                node[prefix + 'size'],
                0,
                Math.PI * 2,
                true
              );
              context.lineWidth = 1;
              context.strokeStyle = node.color || settings('defaultNodeColor');
              context.stroke();
            } else {
              sigma.canvas.nodes.image.cache(url);
              sigma.canvas.nodes.def.apply(
                sigma.canvas.nodes,
                args
              );
            }
          };
          // Let's add a public method to cache images, to make it possible to
          // preload images before the initial rendering:
          renderer.cache = function(url, callback) {
            if (callback)
              _callbacks[url] = callback;
            if (_loading[url])
              return;
            var img = new Image();
            img.onload = function() {
              _loading[url] = false;
              _cache[url] = img;
              if (_callbacks[url]) {
                _callbacks[url].call(this, img);
                delete _callbacks[url];
              }
            };
            _loading[url] = true;
            img.src = url;
          };
          return renderer;
        })();
        //TODO Needs to remove hardcoded urls
        var graph1 = {
          urls : [
                'assets/images/img1.png',
                'assets/images/img2.png',
                'assets/images/img3.png',
                'assets/images/img4.png'
              ],
          colors : [
                '#617db4',
                '#668f3c',
                '#c6583e',
                '#b956af'
              ]
        };
        //Listen for graph render event
        scope.$on('renderGraph', function (event, data) {
           renderSigmaInstance(data);
        });

        function renderSigmaInstance(graphMeta) {
          // Run Cypher query:
          sigma.neo4j.cypher(
              { url: graphMeta.serverConfig.serverUrl, user: graphMeta.serverConfig.user, password: graphMeta.serverConfig.password },
              graphMeta.neo4jQuery,
            function(graph) {
              graph1.urls.forEach(function(url) {
                sigma.canvas.nodes.image.cache(
                  url,
                  function() {
                    if (++loaded === graph1.urls.length)
                      // Instantiate sigma:
                       sigmaInstance = createSigmaInstance(graph);
                  }
                );
              });
            }
          );
        }
        //create sigma instance
        function createSigmaInstance(graph) {
          var sigmaInstance = new sigma({
            graph: graph,
            renderer: {
              container: document.getElementById('neo4jgraph'),
              type: 'canvas',
            }
          });
          var N = graph.nodes.length, i=0;
          graph.nodes.forEach(function(node) {
            node.id = node.id;
            node.label = node.neo4j_data.SystemName;
            node.size = 8;
            node.x = Math.cos(2 * i * Math.PI / N);
            node.y = Math.sin(2 * i * Math.PI / N);
            node.type = 'image';
            node.url = graph1.urls[Math.floor(Math.random() * graph1.urls.length)];
            node.color = '#68BDF6';
            i++;
          });
          graph.edges.forEach(function(edge, key) {
            edge.id = edge.id;
            edge.label = edge.label;
            edge.source = edge.source;
            edge.target = edge.target;
            edge.type = 'arrow';
            edge.count = key;
            edge.color = '#ccc';
            edge.hover_color = '#000';
          });
          sigmaInstance.settings({
            autoCurveSortByDirection: true,
            minNodeSize: 12,
            maxNodeSize: 12,
            minEdgeSize: 1,
            maxEdgeSize: 1,
            defaultLabelColor: '#000',
            //defaultLabelSize: 16,
            defaultEdgeLabelColor: '#014AB6',
            //defaultEdgeLabelSize: 16,
            enableEdgeHovering: true,
            edgeHoverColor: 'edge',
            defaultEdgeHoverColor: '#000',
            zoomOnLocation: false,
            sideMargin: 5,
            edgeHoverExtremities: true
          });
          //bind the events
          sigmaInstance.bind('hovers', function (e) {
            var adjacentNodes = {},
                  adjacentEdges = {};

            if (!e.data.enter.nodes.length) {
              //on mouseout
              sigmaInstance.graph.edges().forEach(function (edge) {
                  edge.color = '#ccc';
                  edge.hidden = false;
              });
              sigmaInstance.graph.nodes().forEach(function (node) {
                  node.hidden = false;
              });
            }
            else {
              //on mousein
              // Get adjacent nodes:
              e.data.enter.nodes.forEach(function(node) {
                adjacentNodes[node.id] = node.id;
              });
              var neighborNodes = {};
              sigmaInstance.graph.edges().forEach(function (edge) {
                  if (adjacentNodes[edge.source] !== undefined || adjacentNodes[edge.target] !== undefined) {
                    edge.color = '#000';
                    edge.hidden = false;
                    neighborNodes[edge.source] = edge.source;
                    neighborNodes[edge.target] = edge.target;
                  }
                  else {
                     //edge.hidden = true;
                  }
              });
              /*sigmaInstance.graph.nodes().forEach(function (node) {
                  if (neighborNodes[node.id] !== undefined) {
                    node.hidden = false;
                  }
                  else {
                     node.hidden = true;
                  }
              });*/
            }
            sigmaInstance.refresh();
          });

          //Show tooltip
          var config_tooltip = {
            node: [{
              show: 'clickNode',
              cssClass: 'sigma-tooltip',
              position: 'top',
              autoadjust: true,
              renderer: function(node) {
                var customTemplate = '<md-card class="entity"><div class="card-info">';
                customTemplate += '<h2 class="card-header" title="' + node.label + '">' + node.label + '</h2>';
                customTemplate += '<ul>';
                angular.forEach(node.neo4j_data, function(value, key){
                  customTemplate += '<li><span class="li-title">' + key + '</span><span title="' + value + '" class="li-value">' + value + '</span></li>';
                });
                customTemplate += '</ul></div></md-card>';
                return Mustache.render(customTemplate, node);
              }
            }],
            edge: [{
              show: 'clickEdge',
              cssClass: 'sigma-tooltip',
              position: 'top',
              autoadjust: true,
              renderer: function(edge) {
                var customTemplate = '<md-card class="entity"><div class="card-info">';
                customTemplate += '<h2 class="card-header">' + edge.label + '</h2>';
                customTemplate += '<ul>';
                angular.forEach(edge.neo4j_data, function(value, key){
                  customTemplate += '<li><span uib-tooltip="After today restriction" class="li-title">' + key + '</span><span class="li-value">' + value + '</span></li>';
                });
                customTemplate += '</ul></div></md-card>';
                return Mustache.render(customTemplate, edge);
              }
            }]
          };

          // Instanciate the tooltips plugin with a Mustache renderer for node tooltips:
          var tooltips = sigma.plugins.tooltips(sigmaInstance, sigmaInstance.renderers[0], config_tooltip);


          //nonoverlaping node config
          var config = {
            nodeMargin: 10,
            scaleNodes: 2
          };
          var listener = sigmaInstance.configNoverlap(config);
          sigmaInstance.startNoverlap();
          sigma.canvas.edges.autoCurve(sigmaInstance);

          //make nodes draggable
          var activeState = sigma.plugins.activeState(sigmaInstance);
          var renderer = sigmaInstance.renderers[0];
          var dragListener = new sigma.plugins.dragNodes(sigmaInstance, renderer, activeState);
          dragListener.bind('drop', function(event) {
            $timeout(function () {
                tooltips.close();
            });
          });



          // Configure the ForceLink algorithm:
          var fa = sigma.layouts.configForceLink(sigmaInstance, {
            worker: true,
            autoStop: true,
            background: true,
            scaleRatio: 10,
            gravity: 2,
            barnesHutOptimize: false,
            easing: 'cubicInOut'
          });
          // Bind the events:
          fa.bind('start interpolate stop', function(e) {
            if (e.type === 'start') {
              $('<div class="modal-backdrop"></div><div class="layout-progress"><span><i class="fa fa-spinner fa-spin fa-3x fa-fw"></i></span><span>Layout in progress, please wait...</span></div>').appendTo(document.body);
            }
            else if (e.type === 'interpolate') {
              $(".modal-backdrop").remove();
              $(".layout-progress").remove();
            }
          });
          sigma.layouts.startForceLink();
          return sigmaInstance;
        }
      }
    };
  });

})(angular)

