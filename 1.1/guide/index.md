## 综述

mapLocator基于[阿里云js组件](http://ditu.aliyun.com/jsdoc/)，让用户通过拖拽标注到合适的位置，并将该位置转化成对应的经纬度数据。

* 版本：1.0
* 作者：muyun
* demo：[http://gallery.kissyui.com/mapLocator/1.0/demo/index.html](http://gallery.kissyui.com/mapLocator/1.0/demo/index.html)

## 初始化组件

    S.use('gallery/mapLocator/1.0/index', function (S, MapLocator) {
         // 创建实例
         var mapLocator = new MapLocator('#mapContainer', {
                infoWindowConfig: {
                    title: '楼盘A', // 信息浮窗标题
                    content: '可以拖动标注调整~' // 信息浮窗内容
                }
         });

         mapLocator.on('ready', function () {
                // 组件初始化后的回调
         });

         mapLocator.on('afterLatLngChange', function () {
                // 标注位置改变后的回调
         });

         // 初始化，如果有提供参数，按照参数定位标注。优先级从高到底为经纬度，地址（自动将地址转化成经纬度）。若没有参数，根据客户端当前ip初始化。
         mapLocator.render({
                /* 经纬度
                latLng: {
                    lat: 30,
                    lng: 120
                }
                */
                /*
                address: '杭州市西湖区华星路99号'
                */
         });
    })

## API说明

### MapLocator(mapContainer, config)

继承于KISSY.BASE

#### mapContainer

{string | DOMNode | Node} 地图容器

#### config

{object} 参数

config.mapConfig {object} [地图实例化参数](http://ditu.aliyun.com/jsdoc/map/classes/AliMap.html#constructor)

config.markerConfig {object} [标注实例化参数](http://ditu.aliyun.com/jsdoc/map/classes/AliMarker.html#constructor)

config.infoWindowConfig {object} [信息浮窗实例化参数](http://ditu.aliyun.com/jsdoc/map/classes/AliInfoWindow.html#constructor)

### 属性

#### mapContainer

{Node} 地图容器

#### map

{AliMap} [地图实例](http://ditu.aliyun.com/jsdoc/map/classes/AliMap.html)

#### marker

{AliMarker} [标注实例](http://ditu.aliyun.com/jsdoc/map/classes/AliMarker.html)

#### infoWindow

{AliInfoWindow} [信息浮窗实例](http://ditu.aliyun.com/jsdoc/map/classes/AliInfoWindow.html)

#### latLng

{object} 经纬度数据对象

### 方法

#### render(config)

初始化地图，如果有提供参数，按照参数定位标注。

优先级从高到底为经纬度，地址（自动将地址转化成经纬度），否则按客户端当前ip初始化。

可以执行多次，每次会先销毁旧数据，重新初始化。

config {object}

config.latLng {object} 经纬度数据

config.address {string}

config.cleanCache {boolean} 是否强制重新请求阿里云地图脚本

#### locateByAddress(address)

根据地址定位

address {string}


### 事件

#### ready

初始化结束

### 静态成员

#### markerEventHandlers

预订义的标注事件回调

#### latLngCTO(latLng)

将阿里云地图的经纬度对象转化为经纬度数据对象

latLng {AliLatLng}

#### latLngOTC(latLng)

将经纬度数据对象转化为阿里云地图的经纬度对象

latLng {object}

## todo

* 添加搜索功能
* 丰富配置
* 补充demo与文档
