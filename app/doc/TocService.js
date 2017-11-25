/**
 * Created by kalel on 9/3/16.
 */
angular
    .module ('vmturbo.doc.TocService', [])
    .factory ('TocService', ['$window', '$rootScope', function($window, $rootScope) {

        var _tocTree = undefined;
        var currentNode;

        return{
            getCurrentNode : function() {
                return currentNode;
            },

            getCurrentNodeKey : function() {
                if(undefined === currentNode || null === currentNode) {
                    return undefined;
                }
                return currentNode.key;
            },

            initToc : function(div) {
                var tocResponse = function(node) {
                    currentNode = node;
                    node.setExpanded();
                    $rootScope.$broadcast('tocResponse', {
                        data: "#!"+node.key.replace('../','') // Strip leading ../
                    });
                };

                var activatedItem = function(event, data) {
                    if(undefined === data) {
                        console.error("UNDEFINED DATA TO HANDLE TOC EVENT!");
                    } else {

                        currentNode = data.node;
                        tocResponse(data.node);
                    }
                };

                div.fancytree(
                    {source: []}, // Make an empty tree...
                    {activate: activatedItem},
                    {minExpandLevel:1},
                    {icons: false}
                );
                _tocTree = div.fancytree("getTree");
            },

            buildMainToc : function(cleanedStr, rootDocName, topTopicDir) {
                var rootNode = _tocTree.getRootNode();
                var rootKey = rootNode.key;

                currentNode = rootNode;
                var vmtLinkStart = rootDocName+"#!"+topTopicDir;
                var vmtLinkEnd = "";

                var theKey = "";
                var theNode;
                var itemsList = cleanedStr.split('|');
                var item = [];
                for(var i=0; i<itemsList.length; i++) {
                    item = itemsList[i].split('+');
                    if(item.length === 3) {
                        if(item[1] === "root") {
                            theKey = rootKey;
                        } else {
                            theKey = item[1];
                        }
                        theNode = _tocTree.getNodeByKey(theKey);
                        theNode.addChildren({
                            title: item[2],
                            tooltip: item[2],
                            key: item[0],
                            //key: item[0].replace('../',''),
                            isFolder: true
                        });
                    }
                }
            },

            getChildrenOfNodeByKey : function(keyStr) {
                var keyNode = _tocTree.getNodeByKey(keyStr);
                if(null === keyNode) {
                    return(null);
                }
                var children = keyNode.getChildren();
                return(children);
            },

            getChildrenOfCurrentNode : function() {
                if(null === currentNode || undefined === currentNode) {
                    return(null);
                }
                var children = currentNode.getChildren();
                return(children);
            },

            getTocNodeByKey : function(keyStr) {
                return _tocTree.getNodeByKey(keyStr);
            },

            expandAll : function() {
                _tocTree.getRootNode().visit(function(node){
                    node.setExpanded(true);
                });
            },

            collapseAll : function() {
                _tocTree.getRootNode().visit(function(node){
                    node.setExpanded(false);
                });
            },

            highlightNodeForDefaultTopic : function(url) {
                if(undefined === _tocTree) {
                    //console.log("highlightNodeForDefaultTopic has undefined tocTree -- could be initial topic: "+url);
                    return;
                }
                // First clear current selection
                _tocTree.getRootNode().visit(function(node){
                    node.setActive(false);
                    node.setSelected(false);
                });
                var keyStr = url;
                var node = _tocTree.getNodeByKey(keyStr);

                // Now select the current one
                if(null !== node && undefined !== node) {
                    node.makeVisible();
                    node.scrollIntoView();
                    node.setSelected();
                    currentNode = node;
                }
            }

        };
    }
]);
