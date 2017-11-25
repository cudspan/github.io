/**
 * Sets up a promise chain to transform XML via an XSL stylesheet.
 */
angular
    .module ('vmturbo.doc.TransformService', [])
    .factory ('TransformService', ['$http', '$q', '$window', 'ConrefService', 'KeyrefProcessService',
        function($http, $q, $window, ConrefService, KeyrefProcessService) {

        const _baseUrl = "assets/Doc/"; // To Do: Put into a config file
        const _walkthroughXsl = "xsl/walkthroughBasic.xsl";

        /**
         * Cache of XSLT files -- don't hit the server if we have a file in the cache
         * @type {{}}
         * @private
         */
        let _xslList = {};

        /**
         * Test for IE...  If it has ActiveX then it's IE.
         * @type {boolean}
         */
        let hasActiveX = false;
        if (Object.hasOwnProperty.call(window, "ActiveXObject") || window.ActiveXObject) {
            hasActiveX = true;
        }

        /**
         * Test for IE version before 10
         * @type {boolean}
         */
        let isLessThan10 = false;
        if(document.all && !window.atob) {
            isLessThan10 = true;
        }

        /**
         * Get a string version of a DOM node.  Uses the browser.
         * @param xmlNode
         * @returns {*}
         */
        const xml2Str = function(xmlNode) {
            try { // Gecko-based browsers, Safari, Opera.
                return (new XMLSerializer()).serializeToString(xmlNode);
            }
            catch (e) {
                try { // Internet Explorer.
                    if(undefined === xmlNode.xml) {
                        return xmlNode;
                    }
                    return xmlNode.xml;
                }
                catch (e) { //Strange Browser ??
                    console.warn('Xmlserializer - Browser not supported: '+e);
                }
            }
            return false;
        };


        /**
         * Call the appropriate XSLT Transform for the given browser. Then return the result as a string.
         * @param xml
         * @param xsl
         * @returns {string}
         */
        const runTransform = function(xml, xsl, topicPath, shortFilename, relTopicStr, xmlDocName, xslDoc, transformParams, isJson) {
            let ret;

            // code for IE
            if (hasActiveX)
            {
                let resultDocument = processXmlMS(xml, xsl, topicPath, shortFilename, relTopicStr, xmlDocName, xslDoc, transformParams);
                if(isJson === true) {
                    ret = ConrefService.processConrefsInJson(resultDocument, topicPath, xsl, true, xslDoc, isLessThan10); // true for is MS IE...
                    ret = KeyrefProcessService.doKeyWordsInJson(ret);
                } else {
                    ret = ConrefService.processConrefs(resultDocument, topicPath, xsl, true, xslDoc, isLessThan10); // true for is MS IE...
                    ret = KeyrefProcessService.doKeyWordsInHtml(ret);
                }
                return ret;
            }

            // code for Mozilla, Firefox, Opera, etc.
            else if (document.implementation && document.implementation.createDocument)
            {
                let resultDocument = processXmlMoz(xml, xsl, "", "", "", transformParams);
                //
                // Process CONREFs...
                //
                if(isJson === true) {
                    ret = ConrefService.processConrefsInJson(resultDocument, topicPath, xsl, false, '', false);
                    ret = KeyrefProcessService.doKeyWordsInJson(ret);
                    return ret;
                } else {
                    ret = ConrefService.processConrefs(resultDocument, topicPath, xsl, false, '', false);
                    ret = KeyrefProcessService.doKeyWordsInHtml(ret);
                    return xml2Str(ret);
                }
            }

        };


        /**
         * Run XSLT through a mozilla browser.
         * @param xmlDoc Doc object for the XML to transform
         * @param xsl Doc object for the XSLT stylesheet
         * @param topicPath Optional Property String for the path to the xml file
         * @param shortFilename Optional Property  String for a property to set in the transform
         * @param relTopicStr Optional Property String for a property to set in the trans
         * @returns {DocumentFragment}
         */
        const processXmlMoz = function(xmlDoc, xsl, topicPath, shortFilename, relTopicStr, transformParams) {
            let xsltProcessor = new XSLTProcessor();
            let paramsList = transformParams;
            xsltProcessor.importStylesheet(xsl);

            if(undefined === transformParams || transformParams.length < 1) {
                paramsList = [];
            }

            // Set some passed params if they exist...
            if(undefined !== topicPath && "" !== topicPath)
                paramsList.push({name: "topicPath", val: topicPath});
            if(undefined !== shortFilename && "" !== shortFilename)
                paramsList.push({name: "shortFilename", val: shortFilename});
            if(undefined !== relTopicStr && "" !== relTopicStr)
                paramsList.push({name: "topicNameParam", val: relTopicStr});

            if(undefined !== paramsList && paramsList.length > 0) {
                for(var i=0; i < paramsList.length; i++) {
                    console.log("Setting xsl param "+paramsList[i].name +":"+ paramsList[i].value);
                    xsltProcessor.setParameter(null, paramsList[i].name, paramsList[i].value);
                }
            }

            let ret = xsltProcessor.transformToFragment(xmlDoc, document);
            return(ret);
        };

        /**
         * Run XSLT through an IE browser.  Checks for versions less than v10, and treats them
         * differently...  Passes paths to xml and xslt rather than passing nodes.
         * @param xmlDoc Doc object for the XML to transform
         * @param xsl Doc object for the XSLT stylesheet
         * @param topicPath Optional Property String for the path to the xml file
         * @param shortFilename Optional Property  String for a property to set in the transform
         * @param relTopicStr Optional Property String for a property to set in the transform
         * @param xmlDocName String for the XML doc, to use in pre-10 IE
         * @param xslDocName String for the XSLT to use in pre-10 IE
         * @returns {DocumentFragment}
         */
        const processXmlMS = function(xmlDoc, xsl, topicPath, shortFilename, relTopicStr, xmlDocName, xslDocName, transformParams) {
            let paramsList = transformParams;
            let objSrcTree = new ActiveXObject('MSXML2.FreeThreadedDOMDocument.6.0');
            objSrcTree.async = false;
            objSrcTree.setProperty("ProhibitDTD", false);
            objSrcTree.setProperty("AllowXsltScript", true);
            objSrcTree.validateOnParse=false;
            if(isLessThan10) { // Cannot pass DOM - must pass filename for IE lower than v10
                objSrcTree.load(xmlDocName);
            } else {
                objSrcTree.load(xmlDoc);
            }
            if (objSrcTree.parseError.errorCode != 0) {
                let myErr = objSrcTree.parseError;
                console.log("Error loading XML file: "+shortFilename+":\n" + myErr.reason);
            }

            let objXSLT=new ActiveXObject('MSXML2.FreeThreadedDOMDocument.6.0');
            objXSLT.async = false;
            objSrcTree.setProperty("ProhibitDTD", false);
            objXSLT.setProperty("AllowXsltScript", true);
            objXSLT.validateOnParse=false;
            if(isLessThan10) { // Cannot pass DOM - must pass filename
                objXSLT.load(xslDocName);
            } else {
                objXSLT.load(xsl);
            }
            if (objXSLT.parseError.errorCode != 0) {
                var myErr = objXSLT.parseError;
                alert("Error loading XSLT file: " +xsl+":\n" + myErr.reason);
            }

            let xslMachine = new ActiveXObject("Msxml2.XSLTemplate.6.0");
            xslMachine.stylesheet = objXSLT;
            var xslproc = xslMachine.createProcessor();
            xslproc.input = objSrcTree;


            if(undefined === transformParams || transformParams.length < 1) {
                paramsList = [];
            }
            // Set some passed params if they exist...
            if(undefined !== topicPath && "" !== topicPath)
                paramsList.push({name: "topicPath", val: topicPath});
            if(undefined !== shortFilename && "" !== shortFilename)
                paramsList.push({name: "shortFilename", val: shortFilename});
            if(undefined !== relTopicStr && "" !== relTopicStr)
                paramsList.push({name: "topicNameParam", val: relTopicStr});

            if(undefined !== paramsList && paramsList.length > 0) {
                for(let i=0; i < paramsList.length; i++) {
                    // Don't set an undefined or null val as an XSLT param -- might confuse the browser
                    if(paramsList[i].val === undefined || paramsList[i].val === null) {
                        paramsList[i].val = "NULL_VAL";
                    }
                    console.log("Setting xsl param "+paramsList[i].name+":"+ paramsList[i].val);
                    xslproc.addParameter(paramsList[i].name, paramsList[i].val);
                }
            }

            xslproc.transform();
            return(xslproc.output);
        };


        const getLastPathTok = function(s) {
            const toks = s.split('/');
            const len = toks.length;
            let ret = "";
            for(let i=0; i<len-1; i++) {
                ret = toks[i]+'/';
            }
            return(ret);
        };

        const getShortFilename = function(s) {
            const toks = s.split('/');
            const len = toks.length;
            let ret = "";
            for(let i=0; i<len; i++) {
                ret = toks[i]+'/';
            }
            return(ret);
        };


        const getTransformParamOfName = function(s, p) {
            if(undefined === p || undefined === s) {
                return undefined;
            }
            for(let i=0; i< p.length; i++) {
                if(p[i].name === s) {
                    return p[i];
                }
            }
            return undefined;
        };

        /**
         * Debug Purposes -- To Remove...
         * @param obj
         */
        const inspectObject = function (obj) {
            let str = "";
            for(let k in obj)
                //if (obj.hasOwnProperty(k)) //omit this test if you want to see built-in properties
                str +="PROPERTY: " + k + " = " + obj[k] + "\n\n";
            alert("INSPECTING OBJECT: \n"+str);
        };


        return{

            inspectObj : function(object) {
                inspectObject(object);
            },

            /**
             * Set up a returnObj that can be passed through the promise chain.
             * @param xslPath
             * @param xmlPath
             */
            initTransformChain : function (xslPath, xmlPath, transformParams, isJson) {
                const deferred = $q.defer();
                let returnObj = {};
                returnObj.resp = "initTransformChain: ";
                returnObj.params = {};
                returnObj.params.xslPath = xslPath;
                returnObj.params.xmlPath = xmlPath;
                returnObj.params.topicParent = getLastPathTok(xmlPath);
                returnObj.params.shortFilename = getShortFilename(xmlPath);
                returnObj.params.relTopicStr = getLastPathTok(xmlPath);
                returnObj.params.transformParams = transformParams;
                if(undefined !== isJson) {
                    returnObj.params.isJson = isJson;
                } else {
                    returnObj.params.isJson = false;
                }

                deferred.resolve(returnObj);

                return deferred.promise;
            },
            /**
             * Get an an XSLT file to use in a promise chain that transforms an XML file. The
             * params object must incude the paths to the XSLT file and the XML file.
             * @param res Object with params and resp properties. The params prop is any set of
             * params that need to be ferried along the promise chain.  The response prop is the
             * native promise response (what $http would give you, for example).
             * @returns {*}
             */
            loadXslDoc : function(res) {
                //alert("LOAD XSL PROMISED OBJ: "+res.params);
                const deferred = $q.defer();
                let returnObj = {};
                returnObj.resp = "LoadXslDoc: ";
                returnObj.params = res.params;

                const xslError = function(response) {
                    returnObj.resp = res.resp+response.data;
                    $q.reject(returnObj);
                    console.error("ERROR GETTING XSLT FILE: "+returnObj.resp);
                    console.error("XSLT FILE PATH: "+res.params.xslPath);
                    deferred.reject(returnObj);
                };
                //If the stylesheet is not already cached, put the GET result into the cache.
                const cacheXsl = function(result) {
                    _xslList[res.params.xslPath] = jQuery.parseXML(result.data);
                    returnObj.res = _xslList[res.params.xslPath];
                    deferred.resolve(returnObj);
                };

                if(undefined !== _xslList[res.params] && undefined !== _xslList[res.params.xslPath]) { // Just use the cache...
                    returnObj.res = _xslList[res.params.xslPath];
                    deferred.resolve(returnObj);
                } else {
                    $http({
                        method: 'GET',
                        url: res.params.xslPath
                    }).then(cacheXsl,xslError);
                }
                return deferred.promise;
            },

            /**
             * A simple wrapper to chain into a transform process.
             * @param res
             * @returns {*}
             */
            getTopic : function(res) {
                const deferred = $q.defer();
                let returnObj = {};
                returnObj.params = res.params;
                returnObj.resp = "getTopic: ";

                const xmlError = function(response) {
                    returnObj.resp = res.resp+response;
                    $q.reject(returnObj);
                    console.error("ERROR GETTING TOPIC FILE: "+returnObj.resp);
                    console.error("TOPIC FILE PATH: "+res.params.xmlPath);
                    deferred.reject(returnObj);
                };

                const setRespObj = function(result) {
                    returnObj.resp = result;
                    deferred.resolve(returnObj);
                };

                $http({method: 'GET', url: res.params.xmlPath}).then(setRespObj, xmlError);
                return deferred.promise;
            },

            /**
             * Wrapper to call the transform process.  The promise returns the transformed data
             * as a string...  Usually either HTML or JSON.
             * @param res
             * @returns {deferred.promise|{then}}
             */
            doTransform : function(res) {
                const deferred = $q.defer();
                let returnObj = {};
                let xslDoc;

                /**
                 * Set the attribute name and value to filter out of the transformed content.
                 * So far, only supports a single filtering parameter.
                 * @param attrName
                 * @param attrVal
                 */
                const addDitaVal = function(attrName, attrVal) {
                    if(undefined === attrName || undefined === attrVal) {
                        console.error("addDitaVal got an undefined attr name or attrval!");
                        return;
                    }
                    let elems = xslDoc.getElementsByTagName("xsl:template");
                    let rootElems = xslDoc.getElementsByTagName("xsl:stylesheet");
                    let root = rootElems[0];
                    let dvTemplate;
                    dvTemplate=xslDoc.createElement("xsl:template");
                    dvTemplate.setAttribute("match","*[@"+attrName+"='"+attrVal+"']");
                    if(undefined === root) {
                        // For some reason, Chrome doesn't get anything via getElementsByTagName...
                        // Inserting the element works, but getting the root doesn't.
                        root=xslDoc.documentElement;
                    }
                    root.insertBefore(dvTemplate, elems[0]);
                    // Convert xsl to string, then back to a doc again.
                    // Hack necessary for Mozilla, for some reason.
                    xslDoc = jQuery.parseXML(xml2Str(xslDoc));
                };


                returnObj.params = res.params;
                let dv_valsObj = getTransformParamOfName("dv_vals", res.params.transformParams);

                if(undefined === dv_valsObj) {
                    xslDoc = _xslList[res.params.xslPath];
                } else {
                    let dv_attrObj = getTransformParamOfName("dv_attr", res.params.transformParams);
                    let tmp = xml2Str(_xslList[res.params.xslPath]);
                    xslDoc = jQuery.parseXML(tmp);
                    addDitaVal(dv_attrObj.value, dv_valsObj.value);
                }

                returnObj.resp = runTransform(jQuery.parseXML(res.resp.data),
                    xslDoc,
                    //_xslList[res.params.xslPath],
                    res.params.topicParent,
                    res.params.shortFilename,
                    res.params.relTopicStr, "", "",
                    res.params.transformParams,
                    res.params.isJson);
                deferred.resolve(returnObj);
                return(deferred.promise);
            },

            /**
             * Transform the identified XML via the identified XSLT stylesheet.
             * Ultimately passes the transform through the given callback.  Note that
             * for a conversion to JSON, you must set isJson to true.  That enables
             * processing of conrefs in the JSON string.
             * @param content
             * @param xsl
             * @param callback
             * @param transformParams An array of {name: value: } objects with params to pass to the XSLT process.
             * @param isJson A boolean -- set to true if this is a conversion to JSON
             */
            transformFile : function(content, xsl, callback, transformParams, isJson) {
                let xmlFile = null;
                let xslPath = "";
                let xmlPath = "";
                let i=0;

                // Set the number of steps up to start into the base url.
                // Enables using the same base url no matter where index.html lives.
                let depth = $window.location.pathname.split('/').length;
                for(i=3; i<depth; i++) {
                    xmlPath = xmlPath+"../";
                }
                xslPath = xmlPath+_baseUrl+xsl;
                xmlPath = xmlPath+_baseUrl+content;

                const superDeferred = $q.defer();

                const errorCallback = function(response) {
                    console.error("ERROR TRANSFORMING FILE!!!");
                };
                //
                // Perform the transform in a promise chain.
                //
                this.initTransformChain(xslPath, xmlPath, transformParams, isJson)
                    .then(this.loadXslDoc, errorCallback)
                    .then(this.getTopic, errorCallback)
                    .then(this.doTransform, errorCallback)
                    .then(callback, errorCallback)
                ;
                superDeferred.resolve("success");
                return(superDeferred.promise);
            },

            cleanJsonStr : function(s) {
                let jStr = s.replace(/(\r\n|\n|\r)/gm," ");
                jStr = jStr.replace(/\s\s+/g, ' ');
                jStr = jStr.replace(/"/g, '\\"');
                jStr = jStr.replace(/&lt;/g, '<');
                jStr = jStr.replace(/&gt;/g, '>');
                jStr = jStr.replace(/CUD_OPENQUOTE/g, '"');
                jStr = jStr.replace(/CUD_CLOSEQUOTE/g, '"');

                return(jStr);
            },

            getWalkthroughXsl: function() {
                return _walkthroughXsl;
            },

            getBaseUrl : function() {
                return _baseUrl;
            }
        };
    }

]);
