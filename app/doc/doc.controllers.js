

var TopicCtrl = function($scope, $rootScope, $sce, $window, $location, $q, TransformService, TocService, SearchService) {

	that = this;

	this.conf = {};
	this.help_app_spec = {};
	this.topiccontent = "";
	this.toccontent = "";
	this.searchcontent = "";
	this.xslLoc = "xsl/topicToWeb.xsl";

    /**
     * Initial load of window. Set default topic and build TOC and Search.
     * @param e
     */
	$window.onload = function(e) {

        //
        // For initial load of the window, get the default topic property and set that location.
        //
		if(undefined !== that.conf.winStr && "" !== that.conf.winStr) {
			$window.location=that.conf.winStr;
		}
		//console.log("ONLOAD!!!! "+history.length);

        that.showDiv('toc');
		that.buildToc();
        that.loadSearch();
	};

	$rootScope.$on('$locationChangeSuccess',function(event, inUrl ) {
		//console.log("\n\nLocation Change Success Event START!!!");

		var toks = inUrl.split('?');
		if(undefined === toks || 0 === toks.length) {
			console.error("Location change but no URL to parse.");
			return;
		}
		var url = toks[0];
		var params = toks[1];

		var pObj;
		if(undefined !== params) {
			pObj = that.getParamsObj(params);
		}

        // Leaving open the option to load conf from an external file
		that.conf = $window.conf;


        /*/////////
        var relUrl = that.showSetUrlRelativeRoot(url);
        if(undefined !== relUrl) {
            alert("URL TO MAKE RELATIVE: "+url+"\nREL URL: "+relUrl);
            $location.replace();
            $location.path("!"+relUrl);
            url = relUrl;
        } else {
            alert("REL URL IS UNDEFINED!");
        }
        //*//////////////


        that.showTopicFromUrl(url, pObj);
        // Using a TOC url or an url from xref or history
         if(undefined !== that.conf.tocUrl) {
			TocService.highlightNodeForDefaultTopic(that.conf.tocUrl);
		} else {
			TocService.highlightNodeForDefaultTopic(url);
		}

		//console.log("CHANGE SUCCESS END!!!!\n\n"+history.length);
	});

	$rootScope.$on('tocResponse', function(event, response) {
		$location.replace();
		$window.location = response.data;
	});

    /**
     * Cache the dir for the current topic. Support multiple
     * topic locations.
     * @param path
     */
	this.setRootTopicDir = function(path){
		var toks = path.split('/');
		var len = toks.length;
		for(var i = 0; i<len; i++) {
			if(toks[i] === "..") {
				that.conf.rootTopicDir = toks[i + 1];
				console.log("SETTING ROOT TOPIC DIR TO: "+that.conf.rootTopicDir);
				return;
			}
		}
		//console.log("NOT DOTDOT ROOT TOPIC URL!!!"+ path);
		toks = path.split('/');
		if(toks.length === 2){
			that.conf.rootTopicDir = toks[0];
			//console.log("SETTING ROOT TOPIC DIR TO: "+that.conf.rootTopicDir);
		} else if(toks.length > 2){
			that.conf.rootTopicDir = "";
			for(var i = 0; i<toks.length - 1; i++) {
				that.conf.rootTopicDir += toks[i];
				if(i < toks.length - 2) {
					that.conf.rootTopicDir += "/";
				}
			}
			//console.log("SETTING ROOT TOPIC DIR TO: "+that.conf.rootTopicDir);
		}else if(toks.length === 1) {
			that.conf.rootTopicDir = $window.conf.rootTopicDir;
			//console.log("SETTING ROOT TOPIC DIR TO: "+$window.conf.rootTopicDir);
		}else {
			console.warn("NO VALID ROOT TOPIC DIR FOR: "+path);
		}
	};

    /**
     * Parse url params.
     * @param params
     * @returns {{}}
     */
	this.getParamsObj = function(params) {
		toks = params.split("&");
        //var paramsObj = {"BOGUS":"BOGUS"}; // Keep until tested!
        var paramsObj = {};
		for(var i=0; i<toks.length; i++) {
			subToks = toks[i].split("=");
			console.log("PARAMS SETTING -- "+subToks[0]+":"+subToks[1]);
			paramsObj[subToks[0]] = subToks[1];
		}
		return(paramsObj);
	};

    /**
     * Show the passed DIV
     * @param divName
     */
	this.showDiv = function(divName) {
		//
		// TO DO: Set divs to show in the parameters
		//
		var divs = ['search', 'toc'];
		for(var x=0; x<divs.length; x++) {
			jQuery('#'+divs[x]).css('display', 'none');
		}
		jQuery('#'+divName).css('display', 'block');
	};

	this.expandToc = function() {
		TocService.expandAll();
	};

	this.collapseToc = function() {
		TocService.collapseAll();
	};

	this.goBack = function() {
		history.back();
	};
	this.goForward = function() {
		history.forward();
	};
	this.showTopic = function() {
		alert(that.topiccontent);
	};
	this.showToc = function() {
		alert(that.toccontent);
	};

	this.loadSearch = function() {

		var deferred = $q.defer();

		var searchCallback = function(response) {
			SearchService.loadSearch(response.resp);
			SearchService.setRootDocName(that.conf.rootDocName);
		};

		var errorCallback = function(response) {
			console.error("ERROR TRANSFORMING SEARCH!!!\n"+response.resp.data);
			deferred.reject("FAILURE");
		};

		TransformService.initTransformChain(that.conf.searchTransform, that.conf.searchFile)
			.then(TransformService.loadXslDoc)
			.then(TransformService.getTopic)
			.then(TransformService.doTransform)
			.then(searchCallback, errorCallback)
		;

		deferred.resolve("SUCESS");
		return deferred.promise;
	};

	this.buildToc = function() {

		var deferred = $q.defer();

		var tocCallback = function(response) {
			TocService.initToc(jQuery("#tocresult"));
			TocService.buildMainToc(response.resp,"index.html",that.rootTopicDir);
		};

		var errorCallback = function(response) {
			console.error("ERROR TRANSFORMING TOC!!!\n"+response.resp.data);
			deferred.reject("FAILURE");
		};

		TransformService.initTransformChain(that.conf.mapTransform, that.conf.defaultMap)
			.then(TransformService.loadXslDoc)
			.then(TransformService.getTopic)
			.then(TransformService.doTransform)
			.then(tocCallback, errorCallback)
		;

		deferred.resolve("SUCESS");
		return deferred.promise;
	};



    this.showSetUrlRelativeRoot = function(inUrl) {
        console.log("SETTING ROOT FOR URL: " + inUrl);
        console.log("CACHED ROOT TOPIC DIR: "+that.conf.rootTopicDir);
        console.log("CACHED MAPPED URL PREFIX: "+that.conf.mapUrlPrefix);

        alert("SETTING ROOT FOR URL: " + inUrl+
            "\nCACHED ROOT TOPIC DIR: "+that.conf.rootTopicDir+
            "\nCACHED MAPPED URL PREFIX: "+that.conf.mapUrlPrefix);

        if(undefined === inUrl || "" === inUrl) {
            return;
        }
        var toks = inUrl.split('#/!');
        if(undefined === toks[1] || "" === toks[1]) {
            return;
        }

        var topicPath = toks[1];

        /*///////
        if('/' === topicPath.charAt(0)) { // needed hack...
            topicPath = topicPath.substr(1);
        }
        if('!' === topicPath.charAt(0)) { // needed hack...
            topicPath = topicPath.substr(1);
        }
        //*////////////
        if(topicPath.substring(0,6) === 'MAPPED') { // Look up in the list of mapped topics.
            toks = topicPath.split('&');
            //topicPath = getMapEntry(toks[1]).topic;
            topicPath = undefined;
        } else { // Normal URL
            toks = topicPath.split('/');
            if(undefined !== that.conf.mapUrlPrefix && "" !== that.conf.mapUrlPrefix) {
                //topicPath = that.conf.mapUrlPrefix+topicPath;
                topicPath = undefined;
            } else if(toks[0] !== that.conf.rootTopicDir && toks.length === 1) { // Make this relative to the root topic dir.
                topicPath = that.conf.rootTopicDir+"/"+topicPath;
                //topicPath = undefined;
            }
            that.setRootTopicDir(topicPath);
        }
        return topicPath;
    };







    /**
     * Use the url to show the topic
     * @param inUrl
     * @param pObj
     */
    //
    // TO DO: Fix relative URLs in the Location Change handler, and reset the location
    // to the corrected path... Use $location.replace() for that cycle.
    //
	this.showTopicFromUrl = function(inUrl, pObj) {
		//console.log("SHOWING TOPIC FROM URL: " + inUrl);

		if(undefined === inUrl || "" === inUrl) {
			return;
		}
		var toks = inUrl.split('#');
		if(undefined === toks[1] || "" === toks[1]) {
			return;
		}

		var topicPath = toks[1];

		if('/' === topicPath.charAt(0)) { // needed hack...
			topicPath = topicPath.substr(1);
		}
		if('!' === topicPath.charAt(0)) { // needed hack...
			topicPath = topicPath.substr(1);
		}
		if(topicPath.substring(0,6) === 'MAPPED') { // Look up in the list of mapped topics.
			toks = topicPath.split('&');
			topicPath = getMapEntry(toks[1]).topic;
		} else
		if(topicPath.substring(0,6) === 'topic=') { // Old-school xref
			toks = topicPath.split('=');
			var sub = toks[1];
			var subToks = sub.split('/');
			var subLen = subToks.length;
			if(subToks[0] === '..') {
				topicPath = that.conf.rootTopicDir+"/"+sub; // This is relative to a root topic dir
				that.setRootTopicDir(topicPath);
			} else if(subToks[0] !== that.conf.rootTopicDir && subLen === 1) { // Make this relative to the root topic dir.
				topicPath = that.conf.rootTopicDir+"/"+sub;
			} else if(subToks[0] !== that.conf.rootTopicDir) { // Make this relative to the root topic dir.
				topicPath = that.conf.rootTopicDir+"/"+sub;
			} else {
				topicPath = sub;
			}
		} else { // Normal URL
            toks = topicPath.split('/');
			if(undefined !== that.conf.mapUrlPrefix && "" !== that.conf.mapUrlPrefix) {
				topicPath = that.conf.mapUrlPrefix+topicPath;
			} else if(toks[0] !== that.conf.rootTopicDir && toks.length === 1) { // Make this relative to the root topic dir.
                topicPath = that.conf.rootTopicDir+"/"+topicPath;
            }
			that.setRootTopicDir(topicPath);
		}
		//console.log("FINAL TOPIC PATH: "+topicPath);
		that.populateTopicContent(topicPath, that.conf.topicTransform, pObj);
	};

    /**
     * Cache the url that serves as akey into the TOC.
     * @param url
     */
	this.setTocUrl = function(url) {
		var toks = url.split("../");
		if(toks.length > 1) {
			that.conf.tocUrl = "../"+toks[1];
		} else {
			that.conf.tocUrl = "../"+url;
		}
        TocService.highlightNodeForDefaultTopic(that.conf.tocUrl);
	};

    /**
     * Show a topic.
     * @param xmlFilePath
     * @param xslFilePath
     * @param pObj
     */
	this.populateTopicContent = function(xmlFilePath, xslFilePath, pObj){

		that.setTocUrl(xmlFilePath);

		var topicCallback = function(response) {
			that.topiccontent = $sce.trustAsHtml(response.resp);
			if(undefined !== pObj) {
				console.log("Location Change Success Event -- setting highlight for pObj: "+pObj);
				SearchService.setHighlightForUrl(pObj);
			}
		};

		var errorCallback = function(response) {
			console.error("populateTopicContent: ERROR TRANSFORMING FILE!!!\n"+response.resp.data);
			console.error("XML FILE PATH: "+xmlFilePath);
			console.error("XSL FILE PATH "+xslFilePath);
		};

        TransformService.transformFile(xmlFilePath, xslFilePath, topicCallback, undefined, false);
	};

};

/**
 * Set up a controller that loads swagger.
 */

/*////////
function ApiDocController ($scope) {
	// init form
	$scope.isLoading = false;
	$scope.url = $scope.swaggerUrl = 'v2/api-docs';
	// error management
	$scope.myErrorHandler = function (data, status) {
		alert('failed to load swagger: ' + status + '   ' + data);
	};

	$scope.infos = false;
}
//*//////////



//*///////////////
angular
	.module ('vmturbo.doc')
	.controller ('TopicCtrl', TopicCtrl);
//*///////////

/*//////////////
 angular
 .module ('vmturbo.doc')
 .controller ('TopicCtrl', 'ApiDocController', TopicCtrl, ApiDocController);
//*//////////////
