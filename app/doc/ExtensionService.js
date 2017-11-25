/**
 * A dictionary of JS functions that can be called when resolving references in
 * HTML.  The function results expand into the content.
 */




(function () {
    
    class ExtensionService {

        constructor (TocService) {
            'ngInject';
            this._TocService = TocService;
        }

        utcConverter () {
            let str = 'UTC time in ms: <input type="button" value="Calculate" onclick="vmtHelpCustom.doUTC(this.parentNode)" /> ';
            str += 'dd:<input name="dd" size="1"/> mm:<input name="mm" size="1"/> yyyy:<input name="yyyy" size="2"/> ';
            return(str);
        }

        buildRefList (s) {
            let str = "";
            let tmp = "";

            if(undefined !== s) {
                str = str+"<p><b>"+s.replace(/%20/g, " ")+":</b></p>";
            }
            let toks = window.location.href.split("#");
            let children = this._TocService.getChildrenOfCurrentNode();
            if(null === children || children.length === 0) {
                return;
            }
            str = str+"<ul>";
            for(var i=0; i<children.length; i++) {
                if(children[i].key.substring(0, 3) === '../') { // remove ../ from key.
                    tmp = children[i].key.substring(3);
                } else {
                    tmp = children[i].key;
                }
                str = str+"<li><a href="+toks[0]+"#/!"+tmp+">" + children[i].title+"</a></li>";
            }
            str = str+"</ul>";
            return(str);
        }
    }



    angular
        .module('vmturbo.doc.ExtensionService', [])
        .service('ExtensionService', ExtensionService);

}());


/*/////////////
angular
    .module ('vmturbo.doc.ExtensionService', [])
    .factory ('ExtensionService', ['TocService', function(TocService ) {

        return {

            utcConverter : function() {
                let str = 'UTC time in ms: <input type="button" value="Calculate" onclick="vmtHelpCustom.doUTC(this.parentNode)" /> ';
                str += 'dd:<input name="dd" size="1"/> mm:<input name="mm" size="1"/> yyyy:<input name="yyyy" size="2"/> ';
                return(str);
            },

            buildRefList : function(s) {
                var str = "";
                var tmp = "";

                if(undefined !== s) {
                    str = str+"<p><b>"+s.replace(/%20/g, " ")+":</b></p>";
                }
                var toks = window.location.href.split("#");
                var children = TocService.getChildrenOfCurrentNode();
                if(null === children || children.length === 0) {
                    return;
                }
                str = str+"<ul>";
                for(var i=0; i<children.length; i++) {
                    //str = str+"<li><a href="+toks[0]+"#topic="+children[i].key+">" + children[i].title+"</a></li>";
                    //alert("KEY IS: "+children[i].key.substring(0, 3));
                    if(children[i].key.substring(0, 3) === '../') { // remove ../ from key.
                        tmp = children[i].key.substring(3);
                    } else {
                        tmp = children[i].key;
                    }
                    str = str+"<li><a href="+toks[0]+"#/!"+tmp+">" + children[i].title+"</a></li>";
                }
                str = str+"</ul>";
                return(str);
            }


        }

    }
]);
//*////////////////
