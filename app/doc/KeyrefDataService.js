(function () {

    /**
     * TODO: Get these from a config file...
     * Ultimately need to set up all the 4D parameters through this service.
     */
    const MAP_FILE = 'maps/keyDefMap.xml';
    const MAP_TRANSFORM_FILE = 'xsl/keys.xsl';

    /**
     * Load the passed keyref map and XSL stylesheet, and create an object.
     * Set that object into the KeyrefProcessService.
     */
    class KeyrefDataService {

        constructor ($rootScope, $q, TransformService, KeyrefProcessService) {
            'ngInject';
            this._$rootScope = $rootScope;
            this._TransformService = TransformService;
            this._KeyrefProcessService = KeyrefProcessService;
            this._kDat = null;
            this._isInitialized = false;
            this._whenInitializedDefer = $q.defer();
        }

        /**
         * @return {boolean}
         */
        get isInitialized () {
            return this._isInitialized;
        }

        /**
         * @Type {Promise}
         */
        get whenInitialized () {
            return this._whenInitializedDefer.promise;
        }

        /**
         *
         * @param keyFile {string}
         * @param keyTransform {string}
         */
        loadKeys (keyFile, keyTransform) {
            this._TransformService.transformFile(keyFile, keyTransform, this._keyDataCallback.bind(this), undefined, true);
        }

        /**
         * @param response {*}
         * @private
         */
        _keyDataCallback (response) {
            if (!response.resp) {
                console.error('KEY CALLBACK GOT UNDEFINED RESPONSE!');
                return;
            }

            this._kDat = JSON.parse(response.resp);
            this._kDat.len = this._kDat.kDataArray.length;
            this._KeyrefProcessService.setData(this._kDat);
            this._isInitialized = true;
            this._whenInitializedDefer.resolve(true);
        }

        static initialize (keyrefDataService) {
            if (!keyrefDataService.isInitialized) {
                keyrefDataService.loadKeys(MAP_FILE, MAP_TRANSFORM_FILE);
            }
        }
    }

    angular
        .module('vmturbo.doc.KeyrefDataService', [])
        .service('keyrefDataService', KeyrefDataService)
        .run(['keyrefDataService', KeyrefDataService.initialize]);
}());
