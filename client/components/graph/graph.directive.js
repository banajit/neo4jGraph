'use strict';

(function (angular) {

angular.module('neo4jApp')
  .directive('graph', function ($timeout, ngToast, $compile, $mdDialog, CONSTANTS, neo4jSrv) {
    return {
      templateUrl: 'components/graph/graph.html',
      restrict: 'EA',
      controller: 'graphCtrl',
      link: function (scope) {
        var currentSchema = CONSTANTS.getSchema();
        var sigmaInstance, loaded = 0;
        var appConfig = CONSTANTS.getConfig();
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
                0,
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
                'graph/uploads/Penguins.jpg'
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
          startLoader('Fetching data, please wait...');
          sigma.neo4j.cypher(
              { url: graphMeta.serverConfig.serverUrl, user: graphMeta.serverConfig.user, password: graphMeta.serverConfig.password },
              graphMeta.neo4jQuery,
              function(graph) {
                sigmaInstance.graph.clear();
                if(graphMeta.existGraph != undefined) {
                  var tempNodes = graphMeta.existGraph.nodes.concat(graph.nodes);
                  var graphNodes = {};
                  graph.nodes = [];
                  tempNodes.forEach(function(node) {
                    graphNodes[node.id] = node;
                  })
                  angular.forEach(graphNodes, function(node){
                    graph.nodes.push(node);
                  });
                }
                layoutNodesEdges(graph);
                var conf = {
                  animation: {
                    node: {
                      duration: 800
                    },
                    edge: {
                      duration: 800
                    },
                    center: {
                      duration: 300
                    }
                  },
                  //focusOut: true,
                  zoomDef: 1
                };
                var locate = sigma.plugins.locate(sigmaInstance, conf);
                locate.center(1);

              }
          );
        }

        //Listen for graph render event
        scope.$on('renderGraph', function (event, data) {
          renderSigmaInstance(data);
        });


        //listen for node update
        scope.$on('updateNodeToGraph', function (event, inputNode) {
          sigmaInstance.graph.nodes().forEach(function (node) {
              if(inputNode.id == node.id) {
                node.neo4j_data = inputNode.neo4j_data;
                if(inputNode.neo4j_data.iconUrl !== undefined) {
                  image_urls.push(inputNode.neo4j_data.iconUrl);
                  //node.url = inputNode.neo4j_data.iconUrl;
                  node.image = {
                    url: node.neo4j_data.iconUrl,
                    clip: 1,
                    scale: 1.4,
                    w: 1,
                    h: 1
                  };
                }
                var defaultRank = currentSchema.nodes[node.labelType]._default['defaultRank'];
                var rank = (node.neo4j_data.Rank != undefined)?node.neo4j_data.Rank:defaultRank;
                node.size = getNodeSize(rank);
                node.label = node.neo4j_data[currentSchema.nodes[node.labelType]._default['defaultLabel']];
              }
          });
          image_urls.forEach(function(url) {
            sigma.canvas.nodes.image.cache(
              url,
              function() {
                sigmaInstance.refresh();
              }
            );
          });
        });
        //listen for edge update
        scope.$on('updateEdgeToGraph', function (event, inputEdge) {
          sigmaInstance.graph.edges().forEach(function (edge) {
              if(inputEdge.id == edge.id) {
                edge.neo4j_data = inputEdge.neo4j_data;
                 edge.label = edge.neo4j_data[currentSchema['relationships'][edge.neo4j_type]['_default']['defaultLabel']];
              }
          });
          sigmaInstance.refresh();

        });
        scope.$on('deleteNodeToGraph', function (event, inputNode) {
          sigmaInstance.graph.dropNode(inputNode.id);
          sigmaInstance.refresh();
        });

        scope.$on('deleteEdgeToGraph', function (event, inputEdge) {
          sigmaInstance.graph.dropEdge(inputEdge.id);
          sigmaInstance.refresh();

        });


        //listen for node add
        scope.$on('addNodeToGraph', function (event, node) {
          node.x = Math.random();
          node.y = Math.random();
          node.label = node.neo4j_data[currentSchema.nodes[node.labelType]._default['defaultLabel']];
          node.type = 'image';
          var defaultRank = currentSchema.nodes[node.labelType]._default['defaultRank'];
          var rank = (node.neo4j_data.Rank != undefined)?node.neo4j_data.Rank:defaultRank;
          node.size = getNodeSize(rank);
          if(node.neo4j_data.iconUrl !== undefined) {
            image_urls.push(node.neo4j_data.iconUrl);
            //node.url = node.neo4j_data.iconUrl;
            node.image = {
              url: node.neo4j_data.iconUrl,
              clip: 1,
              scale: 1.4,
              w: 1,
              h: 1
            };
          }
          node.border_color = appConfig.graphConfig.nodeBorderColor;
          node.border_size = appConfig.graphConfig.nodeBorderSize;
          node.color = currentSchema.nodes[node.labelType]._default['defaultColor'];
          sigmaInstance.graph.addNode(node);
          image_urls.forEach(function(url) {
            sigma.canvas.nodes.image.cache(
              url,
              function() {
                sigmaInstance.refresh();
              }
            );
          });
          startColaLayout();
        });

        //listen for node add
        scope.$on('addEdgeToGraph', function (event, edge) {
          edge.color = currentSchema['relationships'][edge.neo4j_type]['_default']['defaultColor'];
          edge.hover_color = '#000';
          edge.type = 'curvedArrow';
          edge.label = edge.neo4j_data[currentSchema['relationships'][edge.neo4j_type]['_default']['defaultLabel']];
          sigmaInstance.graph.addEdge(edge);
          sigma.canvas.edges.autoCurve(sigmaInstance);
          sigmaInstance.refresh();
        });
        var image_urls = [];

        function getNodeSize(rank) {
          var nodeSize = ((appConfig.graphConfig.maxNodeSize+appConfig.graphConfig.nodeSizeFactor)-rank*appConfig.graphConfig.nodeSizeFactor);
          return nodeSize;
        }

        //start cola layout
        function startColaLayout() {
          sigmaInstance.startCola({
              handleDisconnected: true,
              convergenceThreshold: 0.01,
              initialUnconstrainedIterations: sigmaInstance.graph.nodes().length,
              initialUserConstraintIterations: sigmaInstance.graph.nodes().length,
              linkLength:0,
              symmetricDiffLinkLengths:20
          });
        }

        //update node and edge array
        function layoutNodesEdges(graph) {
          var N = graph.nodes.length, i=0;
          graph.nodes.forEach(function(node) {
            node.labelType = node.neo4j_labels[0];
            node.label = node.neo4j_data[currentSchema.nodes[node.labelType]._default['defaultLabel']];
            var defaultRank = currentSchema.nodes[node.labelType]._default['defaultRank'];
            var rank = (node.neo4j_data.Rank != undefined)?node.neo4j_data.Rank:defaultRank;
            node.size = getNodeSize(rank);
            if(node.neo4j_data.iconUrl == undefined) {
              //node.type = 'def';
              node.color = currentSchema.nodes[node.labelType]._default['defaultColor'];
            }
            else {
              node.type = 'image';
              //node.url = node.neo4j_data.iconUrl;
              node.color = currentSchema.nodes[node.labelType]._default['defaultColor'];
              node.image = {
                url: node.neo4j_data.iconUrl,
                clip: 1,
                scale: 1.4,
                w: 1,
                h: 1
              };
            }

            node.border_size = appConfig.graphConfig.nodeBorderSize;
            node.border_color = appConfig.graphConfig.nodeBorderColor;
            sigmaInstance.graph.addNode(node);
            i++;
          });
          graph.edges.forEach(function(edge, key) {
            if(currentSchema['relationships'][edge.neo4j_type] != undefined) {
              edge.label = edge.neo4j_data[currentSchema['relationships'][edge.neo4j_type]['_default']['defaultLabel']];
              edge.color = currentSchema['relationships'][edge.neo4j_type]['_default']['defaultColor'];
            }
            else {
               edge.label = edge.neo4j_data['Name'];
               edge.color = '#000';
            }
            edge.hover_color = '#000';
            edge.type = "arrow";
            sigmaInstance.graph.addEdge(edge);
          });
          stopLoader();
          sigma.canvas.edges.autoCurve(sigmaInstance);
          startColaLayout(graph);
        }

        function startLoader(message) {
          $('<div class="modal-backdrop"></div><div class="layout-progress"><span><i class="fa fa-spinner fa-spin fa-3x fa-fw"></i></span><span>' + message + '</span></div>').appendTo(document.body);
        }

        function stopLoader() {
          $(".modal-backdrop").remove();
          $(".layout-progress").remove();
        }

        function renderSigmaInstance(graphMeta) {
          // Run Cypher query:
          startLoader('Fetching data, please wait...');
          sigma.neo4j.cypher(
              { url: graphMeta.serverConfig.serverUrl, user: graphMeta.serverConfig.user, password: graphMeta.serverConfig.password },
              graphMeta.neo4jQuery,
            function(graph) {
              graph.edgeNodeRef = {};
              angular.forEach(graph.nodes, function (value, key) {
                  var tempSource = [];
                  var tempTarget = [];
                  if(value.neo4j_data.iconUrl != undefined) {
                    image_urls.push(value.neo4j_data.iconUrl);
                  }
              });
              //sigmaInstance = createSigmaInstance(graph);
              if(image_urls.length == 0) {
                sigmaInstance = createSigmaInstance(graph);
              }
              else {
                image_urls = image_urls.filter(function(elem, index, self) {
                   return index == self.indexOf(elem) && elem != undefined;
                })
                image_urls.forEach(function(url) {
                  sigma.canvas.nodes.image.cache(
                    url,
                    function() {
                      if (++loaded == image_urls.length){
                        sigmaInstance = createSigmaInstance(graph);
                      }
                    }
                  );
                });
              }
            }
          );
        }

        function rescaleWindow() {
          $timeout(function () {
              if($(document).width() == 0) {
                rescaleWindow();
              }
              else {
                sigmaInstance.refresh();
              }
          });
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

          rescaleWindow();

          layoutNodesEdges(graph);
          sigmaInstance.settings({
            autoCurveSortByDirection: true,
            minNodeSize: appConfig.graphConfig.minNodeSize,
            maxNodeSize: appConfig.graphConfig.maxNodeSize,
            defaultLabelColor: appConfig.graphConfig.nodeLabelFontColor,
            labelHoverBGColor: appConfig.graphConfig.labelHoverBGColor,
            defaultHoverLabelBGColor: appConfig.graphConfig.labelHoverBGColor,
            labelAlignment: 'bottom',
            nodeHoverLevel:2,
            defaultLabelSize: appConfig.graphConfig.nodeLabelFontSize,
            drawEdgeLabels: false,
            enableEdgeHovering: true,
            edgeHoverSizeRatio: 2,
            zoomOnLocation: true,
            edgeHoverExtremities: true,
            doubleClickEnabled: false,
            nodeActiveBorderSize: 2,
            nodeActiveOuterBorderSize: 3,
            defaultNodeActiveBorderColor: '#fff',
            defaultNodeActiveOuterBorderColor: 'rgb(236, 81, 72)',
            zoomMin: 0.1,
            zoomMax:2,
            minArrowSize:6,
            sideMargin: 10,
            defaultEdgeHoverLabelBGColor: appConfig.graphConfig.edgeHoverLabelBGColor
          });

          //bind the events
          sigmaInstance.bind('hovers', function (e) {
            var adjacentNodes = {},
                  adjacentEdges = {};

            if (!e.data.enter.nodes.length) {
              //on mouseout
              sigmaInstance.graph.edges().forEach(function (edge) {
                if(currentSchema['relationships'][edge.neo4j_type] != undefined) {
                   edge.color = currentSchema['relationships'][edge.neo4j_type]['_default']['defaultColor'];
                }
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
            }
            sigmaInstance.refresh();
          });

          function resetActiveState() {
            neo4jRelatedNodes = {};
            activeState.dropNodes();
            sigmaInstance.graph.nodes().forEach(function (node) {
                node.type = 'image';
            });
            sigmaInstance.refresh();
          }

          var neo4jRelatedNodes = {};
          sigmaInstance.bind('clickNode', function (e) {
            if(e.data.captor.ctrlKey == true && scope.graphMode == 'editor') {
              sigmaInstance.graph.nodes().forEach(function (node) {
                  if(e.data.node.id == node.id) {
                    if(neo4jRelatedNodes[e.data.node.id] != undefined) {
                      delete neo4jRelatedNodes[e.data.node.id];
                      activeState.dropNodes(node.id);
                      node.type = 'image';
                    }
                    else {
                      neo4jRelatedNodes[e.data.node.id] = e.data.node.id;
                      node.border_size = appConfig.graphConfig.nodeBorderSize;
                      activeState.addNodes(node.id);
                      node.type = 'def';
                    }
                  }
              });
              if(activeState.nodes().length == 2) {
                $mdDialog.show({
                  locals: {activeNodes:activeState.nodes()},
                  controller: 'suggestRelationCtrl',
                  templateUrl: 'app/graphEditor/suggestRelations.html',
                  parent: angular.element(document.body),
                  //targetEvent: ev,
                  clickOutsideToClose:true
                })
                .then(function(answer) {
                  resetActiveState();
                }, function() {
                  resetActiveState();
                });

              }

              sigmaInstance.refresh();
              $timeout(function () {
                  tooltips.close();
              });
            }
          });

          //Show tooltip
          var config_tooltip = {
            node: [
              {
                show: 'clickNode',
                cssClass: 'sigma-tooltip',
                position: 'right',
                autoadjust: true,
                  renderer: function(node) {
                    var mdcard = document.createElement('md-card');
                    mdcard.className = 'entity';
                    mdcard.innerHTML = '<div class="arrow"></div>';

                    var cardInfo = document.createElement('div');
                    cardInfo.id = 'neo4j-card-info';
                    cardInfo.className = 'card-info';
                    cardInfo.innerHTML = '<h2 class="card-header border-color-accent1" title="' + node.label + '"><span class="text-color-accent2">' + node.label + '</span></h2>';


                    var queryParams = [];
                    var listInfo = '';
                    angular.forEach(currentSchema['nodes'][node.labelType]['properties'], function(value, key){
                      var KeyVal = node.neo4j_data[key];
                      if(neo4jSrv.getMicaNodeKey(node.labelType, key) != false) {
                         queryParams.push('entity.' + neo4jSrv.getMicaNodeKey(node.labelType, key) + ':' + encodeURI(KeyVal));
                      }
                      if(value.visible != false && !angular.isUndefined(KeyVal)) {
                        listInfo += '<li><span class="li-title">' + key + '</span><span title="' + KeyVal + '" class="li-value">' + KeyVal + '</span></li>';
                      }
                    });
                    var missingProps = _.difference(Object.keys(node.neo4j_data), Object.keys(currentSchema['nodes'][node.labelType]['properties']));
                    angular.forEach(missingProps, function(value){
                      if(value!= 'iconUrl') {
                        var KeyVal = node.neo4j_data[value];
                        listInfo += '<li><span class="li-title">' + value + '</span><span title="' + KeyVal + '" class="li-value">' + KeyVal + '</span></li>';
                      }
                    });
                    var cardInfoList = document.createElement('ul');
                    cardInfoList.innerHTML = listInfo;

                    cardInfo.appendChild(cardInfoList);

                    var micaUrl = neo4jSrv.getMicaUrl();
                    var queryStr =  micaUrl + '?filters_must=' + queryParams.join('&');


                    var footerElm = document.createElement('div');
                    footerElm.className = 'card-footer border-color-accent1';

                    var dropDownElm = document.createElement('div');
                    dropDownElm.className = 'dropdown';

                    dropDownElm.innerHTML = '<a class="text-color-accent2 cursor-pointer" data-toggle="dropdown">Actions<span class="caret"></span></a>';
                    dropDownElm.onclick = function () {
                        jQuery(".dropdown-menu").toggle();
                    };

                    var dropDownListWrapper = document.createElement('ul');
                    dropDownListWrapper.className = 'dropdown-menu';

                    var dropDownList1 = document.createElement('li');

                    dropDownList1.onclick = function () {
                        jQuery(".dropdown-menu").toggle();
                    };

                    var dropDownSearch = document.createElement('a');
                    dropDownSearch.className = 'cursor-pointer';
                    dropDownSearch.onclick = function () {
                        window.top.location.href = queryStr;
                    };
                    dropDownSearch.innerHTML = 'Search';

                    dropDownList1.appendChild(dropDownSearch);
                    dropDownListWrapper.appendChild(dropDownList1);
                    if(scope.graphMode == 'editor') {
                      var dropDownList2 = document.createElement('li');

                      dropDownList2.onclick = function () {
                          updateNode(node);
                      };
                      dropDownList2.innerHTML = '<a href="#">Edit</a>';

                      var dropDownList3 = document.createElement('li');

                      dropDownList3.onclick = function () {
                          deleteNode(node);
                      };
                      dropDownList3.innerHTML = '<a href="#">Delete</a>';
                      dropDownListWrapper.appendChild(dropDownList2);
                      dropDownListWrapper.appendChild(dropDownList3);
                    }


                    dropDownElm.appendChild(dropDownListWrapper);
                    footerElm.appendChild(dropDownElm);

                    cardInfo.appendChild(footerElm);
                    mdcard.appendChild(cardInfo);

                    return mdcard;
                  }
                }
            ],
            edge: [{
              show: 'clickEdge',
              cssClass: 'sigma-tooltip',
              position: 'right',
              autoadjust: true,
              renderer: function(edge) {

                var mdcard = document.createElement('md-card');
                mdcard.className = 'entity';
                mdcard.innerHTML = '<div class="arrow"></div>';

                var cardInfo = document.createElement('div');
                cardInfo.id = 'neo4j-card-info';
                cardInfo.className = 'card-info';
                cardInfo.innerHTML = '<h2 class="card-header border-color-accent1" title="' + edge.label + '"><span class="text-color-accent2">' + edge.label + '</span></h2>';


                var queryParams = [];
                var listInfo = '';

                angular.forEach(currentSchema['relationships'][edge.neo4j_type], function(value, key){
                  var KeyVal = edge.neo4j_data[key];
                  if(key !== '_appliesTo' && key !== '_default'  && !angular.isUndefined(KeyVal)) {
                    if(neo4jSrv.getMicaEdgeKey(edge.neo4j_type, key) != false) {
                       queryParams.push('entity.' + neo4jSrv.getMicaEdgeKey(edge.neo4j_type, key) + ':' + encodeURI(KeyVal));
                    }
                    listInfo += '<li><span class="li-title">' + key + '</span><span title="' + KeyVal + '" class="li-value">' + KeyVal + '</span></li>';
                  }

                });
                var missingProps = _.difference(Object.keys(edge.neo4j_data), Object.keys(currentSchema['relationships'][edge.neo4j_type]));
                angular.forEach(missingProps, function(value){
                  var KeyVal = edge.neo4j_data[value];
                  listInfo += '<li><span class="li-title">' + value + '</span><span title="' + KeyVal + '" class="li-value">' + KeyVal + '</span></li>';
                });
                var micaUrl = neo4jSrv.getMicaUrl();
                var queryStr =  micaUrl + '?filters_must=' + queryParams.join('&');

                var cardInfoList = document.createElement('ul');
                cardInfoList.innerHTML = listInfo;

                cardInfo.appendChild(cardInfoList);


                var footerElm = document.createElement('div');
                footerElm.className = 'card-footer border-color-accent1';

                var dropDownElm = document.createElement('div');
                dropDownElm.className = 'dropdown';

                dropDownElm.innerHTML = '<a class="text-color-accent2 cursor-pointer" data-toggle="dropdown">Actions<span class="caret"></span></a>';
                dropDownElm.onclick = function () {
                    jQuery(".dropdown-menu").toggle();
                };

                var dropDownListWrapper = document.createElement('ul');
                dropDownListWrapper.className = 'dropdown-menu';

                var dropDownList1 = document.createElement('li');

                dropDownList1.onclick = function () {
                    jQuery(".dropdown-menu").toggle();
                };
                var dropDownSearch = document.createElement('a');
                dropDownSearch.className = 'cursor-pointer';
                dropDownSearch.onclick = function () {
                    window.top.location.href = queryStr;
                };
                dropDownSearch.innerHTML = 'Search';

                dropDownList1.appendChild(dropDownSearch);
                //dropDownList1.innerHTML = '<a href="' + queryStr + '">Search</a>';
                dropDownListWrapper.appendChild(dropDownList1);
                if(scope.graphMode == 'editor') {
                  var dropDownList2 = document.createElement('li');

                  dropDownList2.onclick = function () {
                      var sourceNode = {};
                      var targetNode = {};
                      sigmaInstance.graph.nodes().forEach(function (node) {
                          if(edge.source == node.id) {
                            sourceNode = node;
                          }
                          else if(edge.target == node.id) {
                            targetNode = node;
                          }
                      });
                      updateEdge(edge, sourceNode, targetNode);
                  };
                  dropDownList2.innerHTML = '<a href="#">Edit</a>';

                  var dropDownList3 = document.createElement('li');

                  dropDownList3.onclick = function () {
                      var sourceNode = {};
                      var targetNode = {};
                      sigmaInstance.graph.nodes().forEach(function (node) {
                          if(edge.source == node.id) {
                            sourceNode = node;
                          }
                          else if(edge.target == node.id) {
                            targetNode = node;
                          }
                      });
                      deleteEdge(edge,sourceNode, targetNode);
                  };
                  dropDownList3.innerHTML = '<a href="#">Delete</a>';
                  dropDownListWrapper.appendChild(dropDownList2);
                  dropDownListWrapper.appendChild(dropDownList3);
                }


                dropDownElm.appendChild(dropDownListWrapper);
                footerElm.appendChild(dropDownElm);

                cardInfo.appendChild(footerElm);
                mdcard.appendChild(cardInfo);

                return mdcard;
              }
            }]
          };

          // Instanciate the tooltips plugin with a Mustache renderer for node tooltips:
          var tooltips = sigma.plugins.tooltips(sigmaInstance, sigmaInstance.renderers[0], config_tooltip);
          //make nodes draggable
          var activeState = sigma.plugins.activeState(sigmaInstance);
          var renderer = sigmaInstance.renderers[0];
          var dragListener = new sigma.plugins.dragNodes(sigmaInstance, renderer, activeState);
          dragListener.bind('drop', function(event) {
            $timeout(function () {
                tooltips.close();
            });
          });
          startColaLayout(graph);
          return sigmaInstance;
        }
      }
    };
  });

})(angular)

