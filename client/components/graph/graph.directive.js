'use strict';

(function (angular) {

angular.module('neo4jApp')
  .directive('graph', function ($timeout, ngToast) {
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
        //Update Graph
        scope.$on('refreshGraph', function (event, data) {
          refreshSigmaInstance(data);
        });

        function refreshSigmaInstance(graphMeta) {
          sigma.neo4j.cypher(
              { url: graphMeta.serverConfig.serverUrl, user: graphMeta.serverConfig.user, password: graphMeta.serverConfig.password },
              graphMeta.neo4jQuery,
              function(graph) {
                sigmaInstance.graph.clear();
                layoutNodesEdges(graph);
              }
          );
        }

        //Listen for graph render event
        scope.$on('renderGraph', function (event, data) {
          renderSigmaInstance(data);
        });

        //update node and edge array
        function layoutNodesEdges(graph) {
          var N = graph.nodes.length, i=0;
          graph.nodes.forEach(function(node) {
            node.label = node.neo4j_data.SystemName;
            node.size = 8;
            node.x = Math.random();
            node.y = Math.random();
            node.type = 'image';
            node.url = graph1.urls[Math.floor(Math.random() * graph1.urls.length)];
            node.color = '#68BDF6';
            sigmaInstance.graph.addNode(node);
            i++;
          });
          graph.edges.forEach(function(edge, key) {
            //edge.count = key;
            edge.color = '#ccc';
            edge.hover_color = '#000';
            sigmaInstance.graph.addEdge(edge);
          });
          sigma.canvas.edges.autoCurve(sigmaInstance);
          var frListener = sigma.layouts.fruchtermanReingold.configure(sigmaInstance, {
            iterations: 500,
            easing: 'quadraticInOut',
            duration: 800,
          });
          sigma.layouts.fruchtermanReingold.start(sigmaInstance);
          //sigmaInstance.refresh();
        }

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
              /*refresh_graph(graph);
              if(graph.nodes.length>0) {
                sigmaInstance = createSigmaInstance(graph);
              }
              else {
                ngToast.create({
                  className: 'warning',
                  content: 'No nodes were found.'
                });
              }*/
            }
          );
        }
        //create sigma instance
        function createSigmaInstance(graph) {
          sigmaInstance = new sigma({
            //graph: graph,
            renderer: {
              container: document.getElementById('neo4jgraph'),
              type: 'canvas',
            }
          });
          layoutNodesEdges(graph);
          sigmaInstance.settings({
            autoCurveSortByDirection: true,
            minNodeSize: 12,
            maxNodeSize: 12,
            minEdgeSize: 1.3,
            maxEdgeSize: 1.3,
            defaultLabelColor: '#000',
            labelAlignment: 'bottom',
            defaultLabelSize: 10,
            drawEdgeLabels: false,
            enableEdgeHovering: true,
            //defaultEdgeHoverColor: '#000',
            zoomOnLocation: true,
            edgeHoverExtremities: true,
            edgeLabelSize: 'proportional',
            defaultEdgeType: "arrow",
            edgeHoverLevel:2,
            zoomMin: 0.001,
            zoomMax: 300
          });
          //bind the events
          sigmaInstance.bind('hovers', function (e) {
            var adjacentNodes = {},
                  adjacentEdges = {};

            if (!e.data.enter.nodes.length) {
              //on mouseout
              sigmaInstance.graph.edges().forEach(function (edge) {
                  edge.color = '#ccc';
                  //edge.hidden = false;
              });
              sigmaInstance.graph.nodes().forEach(function (node) {
                  //node.hidden = false;
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
                    //edge.hidden = false;
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
            nodeMargin: 15,
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
           /* var frListener = sigma.layouts.fruchtermanReingold.configure(sigmaInstance, {
              iterations: 500,
              easing: 'quadraticInOut',
              duration: 800,
              autoarea: true,
            });
            sigma.layouts.fruchtermanReingold.start(sigmaInstance);*/
          });
          return sigmaInstance;
        }
      }
    };
  });

})(angular)

