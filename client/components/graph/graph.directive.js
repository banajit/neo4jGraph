'use strict';

(function (angular) {

angular.module('neo4jApp')
  .directive('graph', function () {
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
        //Listen for graph render event
        scope.$on('renderGraph', function (event, data) {
           renderSigmaInstance(data);
        });

        function renderSigmaInstance(graphMeta) {
          var graph1 = {
            nodes: [],
            edges: [],
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
          graph.nodes.forEach(function(node) {
            node.id = node.id;
            node.label = node.neo4j_data.SystemName;
            node.size = 8;
            node.x = Math.floor((Math.random() * 100) + 1);
            node.y = Math.floor((Math.random() * 100) + 1);
            node.type = 'image';
            node.url = 'assets/images/img1.png';
            node.color = '#68BDF6';
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
            minNodeSize: 3,
            maxNodeSize: 12,
            minEdgeSize: 1,
            maxEdgeSize: 1,
            defaultLabelColor: '#000',
            //defaultLabelSize: 16,
            defaultEdgeLabelColor: '#014AB6',
            //defaultEdgeLabelSize: 16,
            singleHover: true,
            enableEdgeHovering: true,
            edgeHoverColor: 'edge',
            defaultEdgeHoverColor: '#000'
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
                console.log(edge);
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
          sigmaInstance.refresh();
          return sigmaInstance;
        }
      }
    };
  });

})(angular)

