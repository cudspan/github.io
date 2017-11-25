/**
 * Replaces keywords in a JSON string with the appropriate value.
 */
angular
    .module ('vmturbo.doc.KeyrefProcessService', [])
    .factory ('KeyrefProcessService', ['$window', '$rootScope', 'DomUtilService', function($window, $rootScope, DomUtilService) {


        let kDat;

        return {
            setData : function(dat) {
                kDat = dat;
            },

            getVal : function(name) {

                if(null === kDat || undefined === kDat) {
                    console.error("KeyRefProcessService was not initialized");
                    return "";
                }
                for (let i = 0; i < kDat.len; i++) {
                    if (kDat.kDataArray[i].name === name) {
                        return kDat.kDataArray[i].val;
                    }
                }
                return "";
            },

            /**
             * Since the JSON is just a string, this looks for a magic
             * conref token and replaces it with the key val.
             * @param str
             * @returns {*}
             */
            doKeyWordsInHtml : function(node) {

                let cRefList = DomUtilService.getNodeElems(node,'keyword');
                let listLen = cRefList.length;

                for(var i = 0; i < listLen; i++) {
                    let currentElem = cRefList[i];
                    if(null === currentElem) {
                        console.warn("NULL CURRENT ELEM IN KEYREF RESOLVER");
                        return(node);
                    }
                    let term = this.getVal(currentElem.getAttribute("keyref"));
                    if(null !== term && null !== currentElem.parentNode) {
                        currentElem.innerHTML = term;
                    } else {
                        return(node);
                    }
                }
                return(node);
            },

            /**
             * Since the JSON is just a string, this looks for a magic
             * conref token and replaces it with the key val.
             * @param str
             * @returns {*}
             */
            doKeyWordsInJson : function(str) {

                let ret = str;

                if(null === kDat || undefined === kDat) {
                    console.log("KeyRefProcessService was not initialized - Happens once when loading the keyref map.");
                    return ret;
                }

                for (var i = 0; i < kDat.len; i++) {
                    let name = kDat.kDataArray[i].name;
                    let regExp = `#KEY_WORD:${name}#`;
                    ret = ret.split(regExp).join(this.getVal(name));
                }
                return(ret);
            }
        };

    }
    ]);
