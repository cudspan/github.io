/**
 * Expands conrefs in HTML content.
 */
angular
    .module ('vmturbo.doc.ConrefService', [])
    .factory ('ConrefService', ['$http', '$q', 'ExtensionService', 'DomUtilService',
        function($http, $q, ExtensionService, DomUtilService) {

            const _baseUrl = "../assets/Doc/"; // To Do: Put into a config file

            /**
             * Flag to handle IE differently
             * @type {boolean}
             */
            let isMsExplorer = false;

            const getPathOnly = function(s) {
                var toks = s.split('/');
                var len = toks.length;
                var ret = "";
                for(var i=0; i<len-1; i++) {
                    ret = ret+toks[i]+"/";
                }
                return(ret);
            };

            /**
             * Cache of conref files, with its oen calls to load and get a file.
             * @type {{curFile: undefined, list: Array, getFile: conrefFiles.getFile, loadXMLDocForConref: conrefFiles.loadXMLDocForConref}}
             */
            let conrefFiles = {
                curFile : undefined,
                list : new Array(),
                getFile : function(fname) {
                    this.curFile = this.list[fname];
                    if(undefined === this.curFile) {
                        this.loadXMLDocForConref(fname);
                    }
                },
                //
                // Asynchronously load the data file.
                //
                loadXMLDocForConref : function(dname) {
                    let that = this;

                    jQuery.ajax({
                        url: dname,
                        success: function (result) {
                            that.list[dname] = result;
                            that.curFile = that.list[dname];
                            if (undefined === that.curFile) {
                                alert("CURFIlE FAIlED...");
                            }
                        },
                        async: false
                    });
                }
            };

            /**
             * Some conrefs don't have a filename in them. This adds in a filename based on the parent reference.
             * @param node
             * @param parentRef
             */
            const resolveConrefAttrs = function(node, parentRef) {
                if (undefined === node || null === node) return;
                //var cRefList = node.querySelectorAll('[conref]');
                let cRefList = DomUtilService.getNodeElemsByAttr(node,'conref');
                let listLen = cRefList.length;
                let i;
                let currentElem;
                let currRef;
                let refToks;
                let refFile, hash;

                for (i=0; i<listLen; i++) {
                    currentElem = cRefList[i];
                    currRef = currentElem.getAttribute("conref");
                    refToks = currRef.split('#');
                    refFile = refToks[0];
                    hash = refToks[1];
                    if(null === refFile || '' === refFile) {
                        currentElem.setAttribute("conref", parentRef+"#"+hash);
                    }
                }
            };

            //
            // Currently a placeholder.  Need to implement a JSON resolution of a conref.
            //
            const jsonConRefs = function(node, topicFullPath, xslDoc, isMsExplorer, xslDocName) {
                return(node);
            };
            /**
             * Actually perform the conref expansion.
             * Gets a list of conrefs in the node, and expands them. Then tries to get get the list
             * again.  If there are nested conrefs, the list will have a len, otherwise return.
             * @param node
             * @param topicFullPath
             * @param xslDoc
             * @param isMsExplorer
             * @param xslDocName
             * @returns {*}
             */
            const innerDoConRefs = function(node, topicFullPath, xslDoc, isMsExplorer, xslDocName) {
                let i=0;
                let currentElem;
                let cRefList;
                let listLen = 0;
                let count = 0;

                cRefList = DomUtilService.getNodeElems(node,'conrefwrapper');

                listLen = cRefList.length;
                while(listLen && listLen > 0) {
                    for(i=0; i<listLen; i++) {
                        currentElem = cRefList[i];
                        if(null === currentElem) {
                            console.error("NULL CURRENT ELEM");
                            return(node);
                        }
                        var frag = getConrefContent(currentElem.getAttribute("reference"), topicFullPath, xslDoc, xslDocName);
                        if(null !== frag && null !== currentElem.parentNode) {
                            var parent = currentElem.parentNode;
                            parent.replaceChild(frag, currentElem);
                        } else {
                            return(node);
                        }
                    }
                    listLen = 0;
                    cRefList = DomUtilService.getNodeElems(node,'conrefwrapper');
                    listLen = cRefList.length;
                    count++;
                    if (count === 100) {
                        console.error("COUNT EXCEEDED!!!!!!!!!!");
                        return(node);
                    }
                }
                return(node);
            };

            /**
             * Get the content from a single conref. Either execute a function from the
             * ExtensionService, or get the conref data file and then get the conref fragment from that.
             * @param ref
             * @param topicFullPath
             * @param xslDoc
             * @param xslDocName
             * @returns {null}
             */
            const getConrefContent = function(ref, topicFullPath, xslDoc, xslDocName) {

                //
                // Used for JS conrefs...
                //
                const makeFragFromString = function(str) {
                    let frag = document.createDocumentFragment();
                    let retElem = document.createElement('span');
                    retElem.innerHTML = str;
                    frag.appendChild(retElem);
                    return(frag);
                };

                //
                // Test for Javascript Function magic conref...
                //
                if(-1 !== ref.indexOf("jsFunction")) {
                    let div = document.createElement("div");
                    let fParams = ref.split(":");
                    let pLen = fParams.length;
                    if(0 === pLen) return(null);
                    let arg = '';
                    if(3 === pLen) {
                        arg = fParams[2];
                    }
                    let funcName = fParams[1];
                    console.log("EXECUTING EXTENSION FUNCTION: "+funcName);
                    let reply = ExtensionService[funcName](arg);
                    if(reply) {
                        return(makeFragFromString(reply));
                    }
                    return(null);
                }

                let refToks = ref.split('#');
                let refFile = refToks[0];
                if(null === refFile || '' === refFile) {
                    console.error("NO FILE IN CONREF: "+ref);
                    return(null);
                }
                let refHash = refToks[1];
                //
                // Open the file... Append the base url so we can get to the correct file.
                conrefFiles.getFile(_baseUrl+topicFullPath+refFile);

                let refDoc = conrefFiles.curFile;
                if(undefined === refDoc || null === refDoc) {
                    console.warn("NULL REPLY FROM loadXMLDocForConref! "+_baseUrl+refFile);
                    return(null);
                }
                return(getConrefFragmentFromDoc(refDoc, refHash, xslDoc, refFile, xslDocName));
            };

            /**
             * For a given conref data file and an ID, get and transform the actual conref fragment.
             * @param xmlDoc
             * @param idStr
             * @param xslDoc
             * @param parentRefFile
             * @param xslDocName
             * @returns {*}
             */
            const getConrefFragmentFromDoc = function(xmlDoc, idStr, xslDoc, parentRefFile, xslDocName) {
                if(null === xmlDoc) {
                    return(null);
                }
                let idToks = idStr.split('/');
                let tLen = idToks.length;
                let conrefFrag = xmlDoc;
                let fragArray;
                if(null === conrefFrag) {
                    return(null);
                }
                for(let i=0; i<tLen; i++) { // Loop down to the last ref id...
                    if(undefined === conrefFrag || null === conrefFrag) {
                        break;
                    }
                    fragArray = DomUtilService.getNodeElemsByAttr(conrefFrag, 'id', idToks[i]);
                    conrefFrag = fragArray[0];
                }
                //
                // Before transforming this, need to check all conref attrs for a filename in the reference.
                // If no filename, add the parent filename...
                //
                resolveConrefAttrs(conrefFrag, parentRefFile);
                //
                // Now transform this to HTML...
                //
                if (isMsExplorer) {
                    let input = DomUtilService.nodeToMarkupText(conrefFrag);
                    let ex = VMT_Help_App.processXmlStringMS(input, xslDoc, "", "", "", xslDocName);
                    let frag = document.createDocumentFragment();
                    let retElem = document.createElement('span');
                    retElem.innerHTML = ex;
                    frag.appendChild(retElem);
                    return(frag);
                } else {
                    let xsltProcessor=new XSLTProcessor();
                    xsltProcessor.importStylesheet(xslDoc);
                    let resultDocument = xsltProcessor.transformToFragment(conrefFrag,document);
                    return(resultDocument);
                }
            };

            return {

                /**
                 * Wrapper to call the whole process.
                 * @param node
                 * @param topicFillPath
                 * @param xslDoc
                 * @param fromMsExplorer
                 * @param xslDocName
                 * @returns Document Node Object for Mozilla, and markup text for IE
                 */
                processConrefs : function(node, topicFillPath, xslDoc, fromMsExplorer, xslDocName, isLessThan10) {

                    isMsExplorer = fromMsExplorer;

                    let nodeToPass;
                    if(isMsExplorer) { // TO DO: Convert MS node into text...
                        nodeToPass = document.createDocumentFragment();
                        let retElem = document.createElement('div');
                        retElem.innerHTML = node;
                        nodeToPass.appendChild(retElem);
                    } else {
                        nodeToPass = node;
                    }
                    let result = innerDoConRefs(nodeToPass, topicFillPath, xslDoc, isMsExplorer, xslDocName);

                    if(isMsExplorer) {
                        // Must return a string with the node changes...
                        return DomUtilService.nodeToMarkupText(result);
                    } else {
                        return result;
                    }
                },

                /**
                 * Wrapper to call the whole process.
                 * @param node
                 * @param topicFillPath
                 * @param xslDoc
                 * @param fromMsExplorer
                 * @param xslDocName
                 * @returns String
                 */
                processConrefsInJson : function(node, topicFillPath, xslDoc, fromMsExplorer, xslDocName, isLessThan10) {

                    let nodeToPass;
                    if(fromMsExplorer) { // MS node is already text...
                        nodeToPass = node;
                    } else {
                        nodeToPass = DomUtilService.xml2Str(node);
                    }
                    //
                    // Just return the JSON string that comes out of this.
                    // For JSON, there's no need for IE to process into markup text.
                    //
                    let ret = jsonConRefs(nodeToPass, topicFillPath, xslDoc, fromMsExplorer, xslDocName);
                    return ret;
                }

            };
        }
    ]);
