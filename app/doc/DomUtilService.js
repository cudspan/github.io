/**
 * Utility methods to walk a dom tree and get collections of elements.
 */(function () {

    class DomUtilService {

        /**
         * Recursively walk the dom tree
         *
         * @param node
         * @param func
         */
        walk_the_DOM (node, func) {
            func(node);
            node = node.firstChild;
            while(node) {
                this.walk_the_DOM(node, func);
                node = node.nextSibling;
            }
        }

        /**
         * Walk the dom to convert it into a string. Use func1 and func2 to
         * create the opening and closing parts of each node string.
         * @param node
         * @param func1
         * @param func2
         */
        walk_the_DOM_Serialize (node, func1, func2) {
            let nodeName = undefined;
            if(node.nodeType === 1) {
                nodeName = node.nodeName;
            } else {
                nodeName = undefined;
            }
            func1(node);
            node = node.firstChild;
            while(node) {
                this.walk_the_DOM_Serialize(node, func1, func2);
                node = node.nextSibling;
            }
            func2(nodeName);
        }

        /**
         * Walk the dom starting from node, and get a list of elems of a given name.
         * @param node
         * @param elemName
         * @returns {Array}
         */
        getNodeElems (node, elemName) {
            let results = [];
            let getElem = function(node) {
                if(node.nodeType === 1 && node.nodeName.toUpperCase() === elemName.toUpperCase())
                    results.push(node);
            };
            this.walk_the_DOM(node, getElem);
            return(results);
        }

        /**
         * When serializing a node, convert the tree to text. Calls walk_the_DOM_Serialize...
         * @param node
         * @returns {string}
         */
        nodeToMarkupText (node) {
            let ret = "";
            let i;
            let len;
            const openElem = function(node) {
                switch(node.nodeType) {
                    case 1:
                        ret = ret+'<'+node.nodeName;
                        for (i=0, attrs=node.attributes, len=attrs.length; i<len; i++){
                            ret = ret+' '+attrs.item(i).nodeName+'="'+attrs.item(i).nodeValue+'"';
                        }
                        ret = ret+'>';
                        break;
                    case 3:
                        ret=ret+node.nodeValue;
                        break;
                    case 4:
                        ret=ret+'<![CDATA['+node.nodeValue+']]';
                        break;
                    case 5:
                        ret=ret+node.nodeName;
                        break;
                    case 6:
                        ret=ret+node.nodeName;
                        break;
                    case 12:
                        ret=ret+node.nodeName;
                        break;
                    default:
                        break;
                }
            };

            const closeElem = function(nodeName) {
                if(undefined !== nodeName) {
                    ret = ret+'</'+nodeName+'>';
                }
            };

            this.walk_the_DOM_Serialize(node, openElem, closeElem);
            return(ret);
        }

        /**
         * Return an array of nodes with the given attr/val
         * @param node
         * @param attr
         * @param val
         * @returns {Array}
         */
        getNodeElemsByAttr (node, attr, val) {
            let results = [];
            const getElem = function(node) {
                var act = node.nodeType === 1 && node.getAttribute(attr);
                if(typeof act === 'string' && (act === val || typeof val !== 'string'))
                    results.push(node);
            };
            this.walk_the_DOM(node, getElem);
            return(results);
        }

        /**
         * For the passed in XML node, return the XML as text.
         * @param xmlNode
         * @returns {*}
         */
        xml2Str (xmlNode) {
            try { // Gecko-based browsers, Safari, Opera.
                return (new XMLSerializer()).serializeToString(xmlNode);
            }
            catch (e) {
                try { // Internet Explorer.
                    return xmlNode.xml;
                }
                catch (e) { //Strange Browser ??
                    console.warn('Xmlserializer - Browser not supported');
                }
            }
            return false;
        }

    }


    angular
        .module('vmturbo.doc.DomUtilService', [])
        .service('DomUtilService', DomUtilService);
}());

