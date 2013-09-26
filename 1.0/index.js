/**
 * @fileoverview
 * @author muyun<muyun.my@taobao.com>
 * @module mapLocator
 **/
KISSY.add(function (S, Node, Base) {
        var MARKER_EVENT_HANDLERS = {
            dragstart: function (latLng, mapLocator) {
                var map = mapLocator.get('map');
                var infoWindow = mapLocator.get('infoWindow');

                map.removeOverlay(infoWindow);
            },
            dragend: function (latLng, mapLocator) {
                var map = mapLocator.get('map');
                var infoWindow = mapLocator.get('infoWindow');

                infoWindow.setLatLng(latLng);

                mapLocator.set('latLng', MapLocator.latLngCTO(latLng));

                map.addOverlay(infoWindow);
            },
            click: function (latLng, mapLocator) {
                var map = mapLocator.get('map');
                var infoWindow = mapLocator.get('infoWindow');

                map.addOverlay(infoWindow);
            }
        };

        /**
         *
         * @class MapLocator
         * @constructor
         * @extends Base
         * @param {Node | DOMNode | string} config.mapContainer 地图容器
         * @param {object} config 参数对象
         * @param {object} config.mapConfig 地图实例化参数
         * @param {object} config.markerConfig 标注实例化参数
         * @param {object} config.infoWindowConfig 信息浮窗实例化参数
         */
        function MapLocator (mapContainer, config) {
            MapLocator.superclass.constructor.call(this, config);

            if (!mapContainer) {
                throw new Error('缺少地图容器！');
            } else {
                this.set('mapContainer', Node.one(mapContainer));
            }
            if (S.isPlainObject(config)) {
                this.set('config', S.merge({}, S.mix(this.get('config'), config, undefined, undefined, true)));
            }

            this.on('afterLatLngChange', function (ev) {
                var marker = this.get('marker');
                var infoWindow = this.get('infoWindow');
                var map = this.get('map');
                var latLng;

                latLng = MapLocator.latLngOTC(ev.newVal);
                marker.setLatLng(latLng);
                infoWindow.setLatLng(latLng);

                map.centerAndZoom(latLng, 10);

                map.addOverlay(marker);
                map.addOverlay(infoWindow);
            });
        }

        S.extend(MapLocator, Base, /** @lends MapLocator.prototype*/{
                /**
                 * 渲染地图wrap
                 * @param {object} config
                 * @param {object} config.latLng 经纬度
                 * @param {number} config.latLng.lat 纬度
                 * @param {number} config.latLng.lng 经度
                 * @param {string} config.address 地址
                 * @param {boolean} config.cleanCache 是否强制重新请求阿里云地图脚本
                 */
                render: function (config) {
                    var mapLocator = this;

                    if (config && config.cleanCache || !window.AliMap) {
                        S.getScript('http://api.ditu.aliyun.com/map.js', function () {
                            mapLocator._init(config);
                        });
                    } else {
                        mapLocator._init(config);
                    }
                },
                /**
                 * 初始化
                 * @param {object} config
                 * @param {object} config.address 地址
                 * @param {object} config.latLng 经纬度
                 * @param {number} config.latLng.lat 纬度
                 * @param {number} config.latLng.lng 经度
                 * @private
                 */
                _init: function (config) {
                    var mapLocator = this;
                    var map = this.get('map');
                    var mapLocatorConfig = mapLocator.get('config');

                    if (map && map.depose) {
                        mapLocator._clear();
                    }

                    map = new AliMap(mapLocator.get('mapContainer').getDOMNode(), S.mix({
                        initControls: [
                            AliMapScaleControl,
                            AliMapOverviewControl,
                            AliMapKeyboardControl,
                            AliMapMouseWheelControl
                        ]
                    }, mapLocatorConfig.mapConfig, undefined, undefined, true));

                    mapLocator.set('map', map);

                    mapLocator._initMarker(mapLocatorConfig.markerConfig);
                    mapLocator._initInfoWindow(mapLocatorConfig.infoWindowConfig);

                    if (config && config.latLng && config.latLng.lat && config.latLng.lng) {
                        // 使用经纬度初始化地图中心位置
                        mapLocator.set('latLng', config.latLng);
                        mapLocator.fire('ready');
                    } else if (config && config.address) {
                        // 使用地址初始化地图中心位置
                        mapLocator.locateByAddress(config.address);
                        mapLocator.fire('ready');
                    } else {
                        // 使用IP定位初始化地图中心位置
                        Jla.require('Ali.Map.Mod.IpView', 3, function () {}, [map, {
                            onChange: function (latLng) {
                                mapLocator.set('latLng', MapLocator.latLngCTO(latLng));
                                mapLocator.fire('ready');
                            }
                        }]);
                    }

                },
                /**
                 * 初始化标记
                 * @param {object} config 标记显示参数
                 * @param {AliIcon} config.icon 图标
                 * @param {string} config.title 标题
                 * @param {boolean} config.draggable 是否支持拖动
                 * @desc 标记的交互行为：信息浮窗默认不展示，点击以后展示。标记拖动开始时隐藏信息窗口，结束时展现。
                 * @private
                 */
                _initMarker: function (config) {
                    var mapLocator = this;
                    var marker;

                    if (this.get('marker')) {
                        return;
                    }

                    if (!config.icon) {
                        config.icon = AliIcon.getDefault();
                    }

                    marker = new AliMarker(new AliLatLng(0, 0), config);

                    this.set('marker', marker);

                    AliEvent.addListener(marker, 'dragstart', function (latLng) {
                        mapLocator.get('config').markerEventHandlers.dragstart(latLng, mapLocator);
                    });

                    AliEvent.addListener(marker, 'dragend', function (latLng) {
                        mapLocator.get('config').markerEventHandlers.dragend(latLng, mapLocator);
                    });

                    AliEvent.addListener(marker, 'click', function (latLng) {
                        mapLocator.get('config').markerEventHandlers.click(latLng, mapLocator);
                    });

                    AliEvent.addListener(marker, 'add', function (map) {
                        //mapLocator.set('latLng', MapLocator.latLngCTO(marker.getLatLng()));
                    });
                },
                /**
                 * 初始化信息浮窗
                 * @param {object} config 参数
                 * @param {string} config.prefixCls 信息浮窗样式类名
                 * @param {string} config.renderCls 预设的渲染类
                 * @param {string} config.title 标题
                 * @param {string} config.content 正文
                 * @param {Array.<number>} config.contentSize 正文区域大小
                 * @param {Array.<number>} config.offset 正文区域大小
                 * @private
                 */
                _initInfoWindow: function (config) {
                    var mapLocator = this;
                    var infoWindow;

                    if (mapLocator.get('infoWindow')) {
                        return;
                    }

                    infoWindow = new AliInfoWindow();
                    infoWindow.setRender(config.renderCls);
                    infoWindow.setContent(S.substitute('<div class="{prefixCls}-locator-infowindow-bd">{content}</div>', config));
                    infoWindow.setTitle(S.substitute('<div class="{prefixCls}-locator-infowindow-hd">{title}</div>', config));
                    infoWindow.setOffset(new AliPoint(config.offset[0], config.offset[1]));
                    infoWindow.setContentSize(new AliPoint(config.contentSize[0], config.contentSize[1]));

                    AliEvent.addListener(infoWindow, 'add', function (map) {
                        var infoWindow = mapLocator.get('infoWindow');

                        infoWindow.moveIntoView();
                    });

                    mapLocator.set('infoWindow', infoWindow);

                },
                /**
                 * 根据给定的地址进行定位
                 * @param {string} address 地址
                 * @param {Function} callback 回调
                 */
                locateByAddress: function (address, callback) {
                    var mapLocator = this;

                    if (S.isString(address) && address != '') {
                        mapLocator._addressToLatLng(address, function (result) {
                            mapLocator.set('latLng', MapLocator.latLngCTO(result.latlng), callback);
                        });
                    }
                },
                /**
                 * 根据给定的坐标进行定位
                 * @param {object} latLng 经纬度
                 * @param {number} latLng.lat 纬度
                 * @param {number} latLng.lng 经度
                 * @param {number} callback 回调
                 */
                /*
                locateByLatLng: function (latLng, callback) {
                    var marker = this.get('marker');
                    var infoWindow = this.get('infoWindow');
                    var map = this.get('map');
                    var latLng;

                    if (!latLng || !S.isNumber(latLng.lat) || !S.isNumber(latLng.lng)) {
                        return;
                    }

                    latLng = MapLocator.latLngOTC(latLng);
                    marker.setLatLng(latLng);
                    infoWindow.setLatLng(latLng);

                    map.centerAndZoom(latLng, 15);

                    S.isFunction(callback) && callback();

                    map.addOverlay(marker);
                    map.addOverlay(infoWindow);

                    this.set('latLng', latLng);
                },
                */
                /**
                 * 将地址转化位坐标
                 * @param {string} address 地址
                 * @param {Function} callback 回调
                 * @private
                 */
                _addressToLatLng: function (address, callback) {
                    var mapLocator = this;
                    var geocoder;

                    function __func (geocoder) {
                        geocoder.getLocation(address, function (result) {
                            S.isFunction(callback) && callback(result);
                        });
                    }

                    geocoder = mapLocator.get('geocoder');
                    if (!geocoder) {
                        Jla.require(['Ali.Map.Ajax.Geocoder'], 1, function (Geocoder) {
                            var geocoder = new Geocoder();

                            mapLocator.set('geocoder', geocoder);

                            __func(geocoder);
                        });
                    } else {
                        __func(geocoder);
                    }
                },
                /**
                 * 清除标记和信息浮窗
                 * @private
                 */
                _clear: function () {
                    this.get('map').depose();

                    this.set('marker', null);
                    this.set('infoWindow', null);
                    this.set('map', null);
                }
            },
            {
                ATTRS: /** @lends MapLocator*/{
                    /**
                     * 地图容器
                     * @type {Node}
                     */
                    mapContainer: {
                        value: null
                    },
                    /**
                     * 地图
                     * @type {AliMap}
                     */
                    map: {
                        value: null
                    },
                    /**
                     * 标记
                     * @type {AliMarker}
                     */
                    marker: {
                        value: null
                    },
                    /**
                     * 信息弹层
                     * @type {AliInfoWindow}
                     */
                    infoWindow: {
                        value: null
                    },
                    /**
                     * 经纬度
                     * @type {object}
                     */
                    latLng: {
                        value: null,
                        validator: function (value) {
                            return S.isPlainObject(value) && S.isNumber(value.lat) && S.isNumber(value.lng);
                        }
                    },
                    /**
                     * 配置参数
                     * @type {object} config
                     * @type {object} config.mapConfig 地图的配置参数
                     * @type {object} config.markerConfig 标记显示参数
                     * @type {object} config.infoWindowConfig 信息浮窗显示参数
                     */
                    config: {
                        value: {
                            mapConfig: {
                            },
                            markerConfig: {
                                title: '',
                                draggable: true
                            },
                            markerEventHandlers: MARKER_EVENT_HANDLERS,
                            infoWindowConfig: {
                                prefixCls: 'ks-maplocator-',
                                renderCls: 'Ali.Map.Panel.Pointer.RoundRect.Style4',
                                title: '',
                                content: '',
                                contentSize: [200, 50],
                                offset: [0, -30]
                            }
                        },
                        validator: function (value) {
                            return S.isPlainObject(value) && S.isPlainObject(value.mapConfig) && S.isPlainObject(value.markerConfig) && S.isPlainObject(value.markerConfig) && S.isPlainObject(value.infoWindowConfig);
                        }
                    },
                    /**
                     * 地址解析器实例
                     * @type {Ali.Map.Ajax.Geocoder}
                     */
                    geocoder: {
                        value: null
                    }
                },
                markerEventHandlers: MARKER_EVENT_HANDLERS,
                /**
                 * 将阿里云地图的经纬度对象转化为经纬度数据对象
                 * @param {AliLatLng} latLng
                 * @returns {{lat: number, lng: number}}
                 */
                latLngCTO: function (latLng) {
                    return {
                        lat: latLng.lat(),
                        lng: latLng.lng()
                    }
                },
                /**
                 * 将经纬度数据对象转化为阿里云地图的经纬度对象
                 * @param {object} latLng
                 * @param {number} latLng.lat
                 * @param {number} latLng.lng
                 * @desc 上下文中需要有AliLatLng类
                 * @returns {AliLngLng}
                 */
                latLngOTC: function (latLng) {
                    var re;

                    try {
                        re = new AliLatLng(latLng.lat, latLng.lng);
                    } catch (e) {
                        throw new Error('实例化AliLatLng对象失败：' + e.msg);
                    }

                    return re;
                }
            }
        );

        return MapLocator;

    },
    {
        requires: [
            'node',
            'base'
        ]
    }
);

