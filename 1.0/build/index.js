/*
combined files : 

gallery/mapLocator/1.0/index

*/
/**
 * @fileoverview
 * @author muyun<muyun.my@taobao.com>
 * @module mapLocator
 **/
KISSY.add('gallery/mapLocator/1.0/index',function (S, Node, Base) {
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

				mapLocator.set('latLng', latLng);

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
		 * @param {object} config 参数对象
		 * @param {Node | DOMNode | string} config.mapContainer 地图容器
		 * @param {Array.<number>} latLng 默认的经纬度，表示经纬度数值的数组，格式为[纬度,经度]
		 * @param {string} address 默认的地址
		 * @desc 默认值的受理优先级是，latLng > address > 客户端位置
		 */
		function MapLocator(config) {
			MapLocator.superclass.constructor.call(that, config);

			if (!S.isPlainObject(config)) {
				throw new Error('缺少参数对象！');
			} else {
				this.set('config', S.merge({}, S.mix(this.get('config'), config, undefined, true)));

				if (config.mapContainer) {
					this.set('mapContainer', Node.one(config.mapContainer));
				} else {
					throw new Error('缺少容器');
				}
			}
		}

		S.extend(MapLocator, Base, /** @lends MapLocator.prototype*/{
				/**
				 * 渲染地图wrap
				 * @param {boolean} cleanCache 是否强制重新请求阿里云地图脚本
				 */
				render: function (cleanCache) {
					var mapLocator = this;

					if (cleanCache || !window.AliMap) {
						S.getScript('http://api.ditu.aliyun.com/map.js', function () {
							mapLocator._init();
						});
					} else {
						mapLocator._init();
					}
				},
				/**
				 * 初始化
				 * @private
				 */
				_init: function () {
					var mapLocator = this;
					var map = this.get('map');
					var config = mapLocator.get('config');

					if (map && map.depose) {
						mapLocator._clear();
					}

					map = new AliMap(mapLocator.get('mapContainer').getDOMNode(), config.mapConfig);

					mapLocator.set('map', map);

					mapLocator._initMarker(config.markerConfig);
					mapLocator._initInfoWindow();

					mapLocator.fire('ready');
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
						map.set('latLng', this.getLatLng());
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
					infoWindow.setContent(S.substitue('<div class="{prefixCls}-locator-infowindow-bd">{content}</div>', config));
					infoWindow.setTitle(S.substitue('<div class="{prefixCls}-locator-infowindow-hd">{title}</div>', config));
					infoWindow.setOffset(new AliPoint(config.offset[0], config.offset[1]));
					infoWindow.setContentSize(new AliPoint(config.contentSize[0], config.contentSize[1]));

					AliEvent.addListener(infoWindow, 'add', function (map) {
						var infoWindow = mapLocator.get('infoWindow');

						infoWindow.moveIntoView();
					});

					mapLocator.set('infoWindow', infoWindow);

				},
				restore: function () {
					var address = this.get('defaultAddress');
					var that = this;

					this.get('geocoder').getLocation(address, function (result) {
						var marker = that.get('marker');
						var infoWindow = that.get('infoWindow');
						var map = that.get('map');

						that.locateByLatLng(result.latlng.lat(), result.latlng.lng(), address);

						map.removeOverlay(marker);
						map.removeOverlay(infoWindow);
					});
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
							mapLocator.locateByLatLng(result.latlng.lat(), result.latlng.lng(), callback);
						});
					}
				},
				/**
				 * 根据给定的坐标进行定位
				 * @param {number} lat 纬度
				 * @param {number} lng 经度
				 * @param {number} callback 回调
				 */
				locateByLatLng: function (lat, lng, callback) {
					var marker = this.get('marker');
					var infoWindow = this.get('infoWindow');
					var map = this.get('map');
					var latLng;

					if (!S.isNumber(lat) || !S.isNumber(lng)) {
						return;
					}

					latLng = new AliLatLng(lat, lng);
					marker.setLatLng(latLng);
					infoWindow.setLatLng(latLng);

					map.centerAndZoom(latLng, 15);

					S.isFunction(callback) && callback();

					map.addOverlay(marker);
					map.addOverlay(infoWindow);

					this.set('latLng', latLng);
				},
				/**
				 * 将地址转化位坐标
				 * @param {string} address 地址
				 * @param {Function} callback 回调
				 * @private
				 */
				_addressToLatLng: function (address, callback) {
					var mapLocator = this;
					var geocoder;

					function __func(geocoder) {
						geocoder._getLocation(address, function (result) {
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
					 * @type {AliLatLng}
					 */
					latLng: {
						value: null
					},
					/**
					 * 地址
					 * @type {string}
					 */
					address: {
						value: '',
						validator: function (value) {
							return S.isString(value)
						}
					},
					/**
					 * 配置参数
					 * @type {object} config
					 * @type {object} config.lntLng 经纬度
					 * @type {object} config.address 地址
					 * @type {object} config.mapConfig 地图的配置参数
					 * @type {Array.<object>} config.mapConfig.initControls 地图默认加载的控件列表
					 * @type {object} config.markerConfig 标记显示参数
					 * @type {AliIcon} config.markerConfig.icon 图标
					 * @type {string} config.markerConfig.title 标题
					 * @type {boolean} config.markerConfig.draggable 是否支持拖动
					 */
					config: {
						value: {
							lntLng: null,
							address: '',
							mapConfig: {
								initControls: [
									AliMapScaleControl,
									AliMapOverviewControl,
									AliMapKeyboardControl,
									AliMapMouseWheelControl
								]
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
				markerEventHandlers: MARKER_EVENT_HANDLERS
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


