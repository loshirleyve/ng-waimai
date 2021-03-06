angular.module("mxs", ['ngRoute', 'ngResource', 'mxs.cart', 'mxs.services'])
    .constant("RESTAURANT_SECTIONS_HEIGHT", {
        header: {
            className: "eleme-header",
            height: 44
        }
    })
    .controller('rootCtrl', ['$scope', '$rootScope', "userFactory", "$window", function ($scope, $rootScope, userFactory, $window) {
        //init user
        userFactory.pullRemote();
        if (location.href.indexOf("list.html") !== -1) {
            $window.location.href = "#/list";
        }
        if (location.href.indexOf("member.html") !== -1) {
            $window.location.href = "#/member";
        }
    }])

    .directive('skateShoes', ['$timeout', function (timeout) {
        return {
            restrict: 'A',
            link: function (scope, ele, attr) {
                var scrollInstance, scrollConfig = {click: !0, mouseWheel: !0};
                scope.$watch(attr.skateShoes, function (data) {
                    data && timeout(function () {
                        scrollInstance && scrollInstance.destroy();
                        scrollInstance = new IScroll(ele[0], scrollConfig);
                    })
                })
            }
        }
    }])

    .directive("restaurantViewport", ['$timeout', 'RESTAURANT_SECTIONS_HEIGHT', function ($timeout, SECTIONS_HEIGHT) {
        return {
            restrict: "A",
            link: function (scope, element) {
                var clientH = window.document.documentElement.clientHeight;
                for (var prop in SECTIONS_HEIGHT) clientH -= SECTIONS_HEIGHT[prop].height;
                element.css("height", clientH + "px");
            }
        }
    }])

    .directive('goback', ['$location', function ($location) {
        return function (scope, ele, attrs) {
            ele.on('click', function () {
                alert("a" + attrs.goback);
                return function () {
                    return $location.url("#"+attrs.goback);
                }
            })
        }
    }])

    .controller('listCtrl', ['$scope', '$resource', 'dishes', 'Cart', function (scope, $resource, dishes, Cart) {
        var cacheDishes, cacheDishType, typeKeys, tempDishes;
        dishes.save({}, function (dishes) {
            scope.dishType = cacheDishType = dishes.data.dishesType;
            typeKeys = Object.keys(cacheDishType);
            cacheDishes = dishes.data.dishes;

            tempDishes = cacheDishes && cacheDishes.filter(function (item, index, arr) {
                    return item.typeId === parseInt(typeKeys[0]);
                });
            scope.dishes = tempDishes;
        });
        scope.currentIndex = 0;
        scope.selectMenu = function (index, type) {
            (scope.currentIndex !== index) && (scope.currentIndex = index);

            for (var t in cacheDishType) {
                if (type === cacheDishType[t]) {
                    tempDishes = cacheDishes && cacheDishes.filter(function (item, index, arr) {
                            return item.typeId === parseInt(t);
                        });
                    scope.dishes = tempDishes;
                }
            }
        }
    }])

    .controller("tradeCtrl", ['$scope', '$rootScope', '$q', '$http', 'userFactory', "$timeout", "$window", function ($scope, $rootScope, $q, $http, user, $timeout, $window) {
        $scope.selectOrderType = true;
        $scope.hasRecord = true;
        $scope.foodQuantity = function (order) {
            var count = 0;
            if (!order || !order.dishesType || !order.dishesType.length) return count;
            var dishes = order.dishesType;
            for (var dishIndex = 0, len = dishes.length; dishIndex < len; dishIndex++) {
                var dishItem = dishes[dishIndex];
                count += dishItem.count;
            }
            return count;
        };
        var allOrderList;
        var timeer;
        var init = function () {
            if (user.user.id) {
                $timeout.cancel(timeer);
            } else {
                timeer = $timeout(init, 100);
                return;
            }
            $http({
                url: $rootScope.RESTBASE + "/order/userorderlist",
                method: "post",
                params: {
                    sig: $rootScope.defaultSig.sig,
                    userId: user.user.id
                }
            }).success(function (res) {
                if (res.ret == 0) {
                    $scope.orders = res.data;
                    //var orderStatusEnum = ["处理中", "配送中", "已完成", "已取消"];
                    var orderStatusEnum = ["未支付", "已下单", "配送中", "已完成", "已取消"];
                    var orderTypeEnum = ["餐到付款", "微信支付"];
                    var len = res.data.length;
                    $scope.hasRecord = !!len;
                    $scope.currentOrders = [];
                    $scope.historyOrders = [];
                    for (var i = 0; i < len; i++) {
                        var item = res.data[i];
                        item.status_title = orderStatusEnum[item.status];
                        item.orderTypeCN = orderTypeEnum[item.orderType];
                        if(item.status == 2 || item.status == 3){
                            $scope.historyOrders.push(item);
                        }else{
                            $scope.currentOrders.push(item);
                        }
                    }
                    //alert("$scope.currentOrders = " + JSON.stringify($scope.currentOrders));
                    allOrderList = item;
                    

                } else {
                    alert("获取订单信息失败：" + res.msg);
                }
            }).error(function (res) {
                alert("获取订单信息失败：" + JSON.stringify(res));
            });
        };

        timeer = $timeout(init, 100);
    }])

    .controller("memberCtrl", ['$scope', '$rootScope', '$location', 'Cart', 'userFactory', "address", "$window",'$http', '$timeout', function (scope, rootScope, $location, Cart, User, address, $window, $http, $timeout) {

        // 获取用户的电话信息
        /*User.pullRemote();*/
        scope.showTel = false;
        var getUserTimeer;
        var init = function(){
            var userId = User.getProp("id");
            //alert("userId = " + userId);
            if(userId){ //存在
                scope.tel = "-" + User.getProp("tel") + "-";

                address.save({}, function (addrData) {
                    //获得用户的取餐点信息
                    var address = scope.address = addrData.data;
                    //alert("address= " + JSON.stringify(address));
                    //alert("user =" + JSON.stringify(User));
                    //alert("1-User.getProp(\"distributeId\") = " + User.getProp("distributeId"));
                    if (User.getProp("distributionId")) {
                        address.forEach(function (item, index, array) {
                            if (item.id == User.getProp("distributionId")) {
                                scope.crtAddress = item;
                            }
                        });
                    }
                })
                $timeout.cancel(getUserTimeer);
            }else{ //不存在
                getUserTimeer = $timeout(init, 100);
                return;
            }
        }
        getUserTimeer = $timeout(init, 100);
        /*alert("User2 = " + JSON.stringify(User.user));
        var telNum = User.getProp("tel");
        alert("telNum = " + telNum);
        if (telNum) {
            scope.tel = User.getProp("tel");
            alert("tel = " + scope.tel);
        }*/

        /*address.save({}, function (addrData) {
            //获得用户的取餐点信息
            var address = scope.address = addrData.data;
            alert("address= " + JSON.stringify(address));
            //alert("user =" + JSON.stringify(User));
            //alert("1-User.getProp(\"distributeId\") = " + User.getProp("distributeId"));
            if (User.getProp("distributionId")) {
                address.forEach(function (item, index, array) {
                    if (item.id == User.getProp("distributionId")) {
                        scope.crtAddress = item;
                    }
                });
            }

            // 获取用户的电话信息
            /*var telNum = User.getProp("tel");
            alert("telNum = " + telNum);
            if (telNum) {
                scope.tel = User.getProp("tel");
                alert("tel = " + scope.tel);
            }*/
            
        /*});*/

        scope.checkTel = function () {
            $window.location.href = "#/register";
        }

        scope.selectAddr = function (addr) {
            //alert("selectAddr");
            scope.crtAddress = addr;
            scope.showAddr = false;
            if (User.user.distributionId !== addr.id) {
                $http({
                        url: rootScope.RESTBASE + "/user/changedistribution",
                        method: "post",
                        params: {
                            sig: rootScope.defaultSig.sig,
                            userId: User.user.id,
                            distributionId: addr.id
                        }
                    }
                ).success(function (data) {
                        User.user.distributionId = addr.id;//update user distribution
                        //console.log("update distribute is success: " + JSON.stringify(data));
                        //alert("update distribute is success: " + JSON.stringify(data));
                    })
                .error(function (data) {
                    //console.log("update distribute is error: " + JSON.stringify(data));
                    //alert("update distribute is error: " + JSON.stringify(data));
                });
            }
        };

        // 绑定手机
        scope.user = {
            mobile: "",
            code: ""
        };
        scope.sendCode = function () {
            //alert("点击了发送验证码");
            $http({
                url: rootScope.RESTBASE + "/user/sendvalidatecode",
                method: "post",
                params: {
                    sig: rootScope.defaultSig.sig,
                    userId: User.user.id,
                    tel: scope.user.mobile
                }
            }).success(function (data) {
                alert("验证码发送成功.");
                scope.countdown = !0;
            }).error(function (data) {
                scope.countdown = !1;
            });
        };
        scope.updateTel = function () {
            //alert("点击了绑定");
            $http({
                url: rootScope.RESTBASE + "/user/updatetel",
                method: "post",
                params: {
                    sig: rootScope.defaultSig.sig,
                    userId: User.user.id,
                    tel: scope.user.mobile,
                    validateCode: scope.user.code
                }
            }).success(function (data) {
                alert("更新手机成功");
                scope.showTel = false;
                scope.tel = "-" + scope.user.mobile + "-";;
                //$window.location.href = "#/member";
                //$window.location.href = "https://open.weixin.qq.com/connect/oauth2/authorize?appid=wxba383cd56b8e9f2e&redirect_uri=http://www.bluerangers.cn/beehivefe/member.html&response_type=code&scope=snsapi_userinfo";
            }).error(function (data) {
                alert("更新手机号码失败：" + data.msg);
            })
        };

    }])

    .directive('addNote', [function () {
        return function (e, t) {
            e.note = e.note || "", e.noteClick = function (t) {
                var r = angular.element(t.target), o = r.text(), n = e.note;
                n.indexOf(o) > -1 ? (n = n.replace(o, ""), r.removeClass("ui-selected")) : (n = n + " " + o, r.addClass("ui-selected"));
                e.note = n.trim()
            }
        }
    }])

    .config(['$routeProvider', '$locationProvider', function (routeProvider, locationProvider) {
        //locationProvider.html5Mode(true);
        routeProvider.when('/index', {
            templateUrl: 'tpl/menuList.html',
            controller: 'listCtrl'
        }).when('/cart', {
            templateUrl: 'tpl/cartList.html',
            controller: 'cartCtrl'
        }).when('/order', {
            templateUrl: 'tpl/order.html',
            controller: 'cartCtrl'
        }).when('/register', {
            templateUrl: 'tpl/registertel.html',
            controller: 'registerCtrl'
        }).when('/detail/:id/:payType/:prepayId', {
            templateUrl: 'tpl/order_detail.html',
            controller: 'tradeOrderCtrl'
        }).when('/detail/:id', {
            templateUrl: 'tpl/order_detail.html',
            controller: 'tradeOrderFinCtrl'
        }).when('/list', {
            templateUrl: 'tpl/order_list.html',
            controller: 'tradeCtrl'
        }).when('/member', {
            templateUrl: 'tpl/member.html',
            controller: 'memberCtrl'
        }).otherwise({
            templateUrl: 'tpl/menuList.html',
            controller: 'listCtrl'
        })
    }]);
////////////////////module mxs////////////////////////////////////////////////////////////////////////////////////
angular.module("mxs")
    .controller("tradeOrderCtrl", ["$scope", "$window", "$location", "$rootScope", '$routeParams', 'orderFactory', function ($scope, $window, $location, $rootScope, $routeParams, order) {
        var orderDeferred = order.pullOrder($routeParams.id);
        //alert("$routeParams.id = " + $routeParams.id);
        //alert("orderDeferred = " + JSON.stringify(orderDeferred));
        var payType = $routeParams.payType;
        //alert("payType = " + payType);
        var prepayId = $routeParams.prepayId || "";
        //alert("prepayId = " + prepayId);
        $scope.wxPay = false;
        if(payType == "wx"){
            $scope.wxPay = true;
            var orderStatusEnum = ["未支付", "配送中", "已完成", "已取消", "已下单"];
        }else{
            var orderStatusEnum = ["已下单", "配送中", "已完成", "已取消"];
        }
        //var orderStatusEnum = ["未支付", "已下单", "配送中", "已完成", "已取消"];
        //var orderStatusEnum = ["未支付", "配送中", "已完成", "已取消", "已下单"];
        orderDeferred.then(function (data) {
            order.initOrder(data);
            var orderDetail = order.order;
            //alert("orderDetail = " + JSON.stringify(orderDetail));
            $scope.order = orderDetail;
            $scope.order.orderId = "-"+$scope.order.orderId+"-";
            $scope.order.tel = "-"+$scope.order.tel+"-";

            $scope.dishes = orderDetail.dishes;
            $scope.status = {
                "orderId": orderDetail.orderId,
                "title": orderStatusEnum[orderDetail.status],
                "description": ""
            };
            $scope.total = orderDetail.totalPrice;
            $scope.foodQuantity = function () {
                var totalCount = 0;
                for (var i = 0; i < orderDetail.dishes.length; i++) {
                    var dishItem = orderDetail.dishes[i];
                    totalCount += dishItem.count;
                }
                return totalCount;
            };
        });

        $scope.toContinueOrder = function(){
            localStorage.setItem("cartList", "{}");
            $window.location.href = "#/index.html";
        }

        $scope.toPay = function (){
            //alert("prepayId = " + prepayId);
            //获取随机字符串
            var randomStr = function(len){
                var len = len | 32;
                var _chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678'; 
                var maxPos = _chars.length;
            　　var pwd = '';
            　　for (i = 0; i < len; i++) {
            　　　　pwd += _chars.charAt(Math.floor(Math.random() * maxPos));
            　　}
            　　return pwd;
            }
            //获取paySign
            var getPaySign = function (appId, nonceStr, packages, timeStamp){
                var tempStr = "appId=" + appId + "&nonceStr=" + nonceStr + "&package=" + packages + "&signType=MD5&timeStamp=" + timeStamp,
                    stringSignTemp = tempStr + "&key=bc40604e68cea8c45db1c8b0e900ac7b",
                    sign = hex_md5(stringSignTemp).toUpperCase();
                    //alert(stringSignTemp);
                return sign;
            }

            var appId = "wxba383cd56b8e9f2e";
            var timeStamp = (Date.parse(new Date())+"").substr(0,10);
            var nonceStr = randomStr(32);
            var packages = "prepay_id=" + prepayId;
            var paySign = getPaySign(appId, nonceStr, packages, timeStamp);
            var onBridgeReady = function(){
                WeixinJSBridge.invoke(
                    'getBrandWCPayRequest', {
                        "appId" :  appId,
                        "timeStamp":timeStamp,              
                        "nonceStr" : nonceStr, 
                        "package" : packages,     
                        "signType" : 'MD5',            
                        "paySign" : paySign
                    },
                    function(res){
                        //alert("res.err_msg = " + res.err_msg +" res=" + JSON.stringify(res));     
                        if(res.err_msg == "get_brand_wcpay_request:ok" ) {
                            //alert("支付成功1");
                            //alert("$routeParams.id1 =" + $routeParams.id);
                            localStorage.setItem("cartList", "{}");
                            $window.location.href = "#/detail/" + $routeParams.id;
                            //alert("跳转了");
                        }     // 使用以上方式判断前端返回,微信团队郑重提示：res.err_msg将在用户支付成功后返回    ok，但并不保证它绝对可靠。 
                        else{
                            alert("支付失败,请重试");
                        }
                    }
                ); 
            }

            if (typeof WeixinJSBridge == "undefined"){
                //alert("undefined");
                if( document.addEventListener ){
                    document.addEventListener('WeixinJSBridgeReady', onBridgeReady, false);
                }else if (document.attachEvent){
                    document.attachEvent('WeixinJSBridgeReady', onBridgeReady); 
                    document.attachEvent('onWeixinJSBridgeReady', onBridgeReady);
                }
            }else{
                onBridgeReady();
            }
        }

        
    }])
    .controller("tradeOrderFinCtrl", ["$scope", "$window", "$location", "$rootScope", '$routeParams', 'orderFactory', function ($scope, $window, $location, $rootScope, $routeParams, order) {
        //alert("tradeOrderFinCtrl");
        var orderDeferred = order.pullOrder($routeParams.id);
        //alert("$routeParams.id = " + $routeParams.id);
        //alert("orderDeferred = " + JSON.stringify(orderDeferred));
        var payType = $routeParams.payType;
        //alert("payType = " + payType);
        var prepayId = $routeParams.prepayId || "";
        //alert("prepayId = " + prepayId);
        $scope.wxPay = false;
        if(payType == "wx"){
            $scope.wxPay = true;
        }
        var orderStatusEnum = ["未支付", "配送中", "已完成", "已取消", "已下单"];
        orderDeferred.then(function (data) {
            order.initOrder(data);
            var orderDetail = order.order;
            //alert("orderDetail1 = " + JSON.stringify(orderDetail));
            $scope.order = orderDetail;
            $scope.dishes = orderDetail.dishes;
            $scope.status = {
                "orderId": orderDetail.orderId,
                "title": orderStatusEnum[orderDetail.status],
                "description": ""
            };
            //alert("orderDetail.status = " + orderDetail.status);
            //alert("hasPaid = " + orderDetail.hasPaid);
            if((orderDetail.status == 0) && (orderDetail.hasPaid)){
                //alert("判断支付成功");
                $scope.status.title = orderStatusEnum[4];
                $scope.wxPay = false;
            }else{                //alert("判断支付失败");
                alert("支付失败，请重新尝试，或联系客服");

            }
            $scope.order.orderId = "-"+$scope.order.orderId+"-";
            $scope.order.tel = "-"+$scope.order.tel+"-";
            
            $scope.total = orderDetail.totalPrice;
            $scope.foodQuantity = function () {
                var totalCount = 0;
                for (var i = 0; i < orderDetail.dishes.length; i++) {
                    var dishItem = orderDetail.dishes[i];
                    totalCount += dishItem.count;
                }
                return totalCount;
            };
        });

        $scope.toContinueOrder = function(){
            localStorage.setItem("cartList", "{}");
            $window.location.href = "#/index.html";
        }
        
    }])
    .factory("orderFactory", ['$q', '$rootScope', '$q', '$http', function ($scope, $rootScope, $q, $http) {
        var orderFactory = {};

        orderFactory.order = {
            orderId: "",
            status: "",
            takeNo: "",
            createTime: "",
            updateTime: "",
            orderType: "",
            distribution: "",
            tel: "",
            operator: "",
            totalPrice: "",
            dishes: "",
            hasPaid: ""
        };

        orderFactory.initOrder = function (order) {
            if (!order) return;
            for (var prop in order) {
                if (this.order.hasOwnProperty(prop)) {
                    this.order[prop] = order[prop];
                }
            }
        };

        orderFactory.pullOrder = function (orderId) {
            var deferred = $q.defer();
            if (!orderId) deferred.reject("orderId is null.");
            $http({
                url: $rootScope.RESTBASE + "/order/orderdetail",
                method: "POST",
                params: {
                    sig: $rootScope.defaultSig.sig,
                    orderId: orderId
                }
            }).success(function (data) {
                if (data.ret === 0) {
                    //alert("orderData1 = " + JSON.stringify(data));
                    deferred.resolve(data.data);
                } else {
                    deferred.reject(data);
                }
            }).error(function (data) {
                deferred.reject(data);
            });

            return deferred.promise;
        };

        return orderFactory;
    }]);
//////////////////////////////////cart模块//////////////////////////////////////////////////
angular.module('mxs.cart', [])
    .controller('cartCtrl', ['$scope', '$rootScope', '$location', 'Cart', 'userFactory', 'address', '$window', '$http', function (scope, rootScope, $location, Cart, User, address, $window, $http) {

        Cart.init();
        scope.list = Cart.list;
        scope.totalAmount = Cart.totalAmount;
        scope.totalPrice = Cart.totalPrice;
        scope.removeFood = Cart.remove;
        scope.decrease = Cart.decrease;
        scope.add = Cart.add;
        scope.wxPay = scope.wxPay || true;
        scope.facePay = scope.facePay || false;
        //alert($location.absUrl());

        address.save({}, function (addrData) {
            //获得用户的取餐点信息
            var address = scope.address = addrData.data;
            if (User.getProp("distributionId")) {
                address.forEach(function (item, index, array) {
                    if (item.id == User.getProp("distributionId")) {
                        scope.crtAddress = item;
                    }
                });
            }
            // 获取用户的电话信息
            if (User.getProp("tel")) {
                scope.tel = "-" + User.getProp("tel") + "-";
            }
        });

        //改变支付方式
        scope.changePayStyle = function (){
            scope.wxPay = !scope.wxPay;
            scope.facePay = !scope.facePay;
            if(scope.wxPay){
                Cart.cartPayType = 'wx';
            }else{
                Cart.cartPayType = 'face';
            }
        }
        scope.checkTel = function () {
            $window.location.href = "#/register";
        }

        scope.selectAddr = function (addr) {
            scope.crtAddress = addr;
            scope.showAddr = false;
            if (User.user.distributionId !== addr.id) {
                $http({
                        url: rootScope.RESTBASE + "/user/changedistribution",
                        method: "post",
                        params: {
                            sig: rootScope.defaultSig.sig,
                            userId: User.user.id,
                            distributionId: addr.id
                        }
                    }
                ).success(function (data) {
                        User.user.distributionId = addr.id;//update user distribution
                        console.log("update distribute is success: " + JSON.stringify(data));
                    })
                .error(function (data) {
                    console.log("update distribute is error: " + JSON.stringify(data));
                });
            }
        };

        scope.checkStatus = function () {
            var orderList = Cart.getOrder();
            if (orderList === null) {
                alert("请选择菜品。");
            } else {
                $window.location.href = "#/cart";
            }
        };

        scope.checkCart = function () {
            //alert("Cart.cartPayType = " + Cart.cartPayType);
            var orderList = Cart.getOrder();
            if (orderList === null) {
                alert("请选择菜品");
                return;
            } else if (!scope.crtAddress) {
                alert("请选择取餐地址");
                return;
            } else if (!User.user.tel) {
                $window.location.href = "#/register";
                return;
            }
            //alert(" alert(scope.wxPay);" + scope.wxPay);
            //alert(" alert(scope.facePay);"+scope.facePay);

            var payType = Cart.cartPayType == 'wx' ? 1 : 0;
            
            $.ajax({
                url: rootScope.RESTBASE + "/order/commitorder",
                type: "post",
                dataType: 'JSON',
                data: {
                    sig: rootScope.defaultSig.sig,
                    userId: User.user.id || -1,
                    voucherId: 0,
                    orderType: payType,
                    remark: scope.note + "" || "",
                    totalPrice: Cart.totalPrice(),
                    dishes: JSON.stringify(orderList)
                },
                success: function (res) {
                    //alert("res="+JSON.stringify(res));
                    if (res.ret == 0) {
                        //localStorage.setItem("cartList", "{}");
                        if(payType==1){
                            //如果选择微信支付
                            //alert(JSON.parse(res.data.resp).prepay_id);
                            var prepay_id = JSON.parse(res.data.resp).prepay_id;
                            $window.location.href = "#/detail/" + res.data.orderId + "/wx/" + prepay_id;
                        }else{
                            $window.location.href = "#/detail/" + res.data.orderId + "/face/null";
                        }
                    } else {
                        alert("订单提交失败：" + res.msg);
                    }
                },
                error: function (data) {
                    alert("fail: " + JSON.stringify(data));
                }
            })
        }
    }])
    .factory('Cart', ['$q', '$rootScope', '$location', function ($q, $rootScope, $location) {
        var n = {
            cartPayType: "wx",
            list: {},
            add: function (e) {
                var t = {
                    id: e.id,
                    name: e.name,
                    price: e.price,
                    quantity: 1,
                    typeId: e.typeId
                };
                return this.list[e.id] ? this.list[e.id].quantity++ : this.list[e.id] = t, localStorage.setItem("cartList", JSON.stringify(this.list)), this.list
            },
            decrease: function (e) {
                var t;
                return this.list[e.id] && this.list[e.id].quantity > 1 ? t = --this.list[e.id].quantity : 1 === this.list[e.id].quantity && (this.list[e.id] && delete this.list[e.id], t = 0), localStorage.setItem("cartList", JSON.stringify(this.list)), this.list
            },
            setList: function (e) {
                for (var t in this.list) delete this.list[t];
                for (var r in e) {
                    var o = e[r],
                        n = {
                            id: o.id,
                            name: o.name,
                            price: o.price,
                            quantity: o.quantity,
                            typeId: o.typeId,
                            remark: o.remark
                        };
                    if (parseInt(o.id) > 6)//take out demo data.
                        this.list[r] = n
                }
                localStorage.setItem("cartList", JSON.stringify(this.list))
            },
            totalAmount: function () {
                var e = 0;
                for (var t in this.list) e += this.list[t].quantity;
                return e
            },
            totalPrice: function () {
                var e = 0;
                for (var t in this.list) e += this.list[t].quantity * this.list[t].price;
                return e
            },
            menuAmount: function (crtMenu, menuObj) {
                var t = 0, crtKey;
                for (var menuKey in menuObj) {
                    if (menuObj[menuKey] === crtMenu) crtKey = menuKey;
                }
                for (var dishKey in this.list) {
                    this.list[dishKey].typeId === parseInt(crtKey) && (t += this.list[dishKey].quantity);
                }
                return t;
            },
            getOrder: function () {
                var temp = {};
                if (this.isEmpty()) return null;
                for (var key in this.list) {
                    temp[key] = this.list[key].quantity;
                }

                return temp;
            },
            find: function (e) {
                return this.list[e.id]
            },
            isEmpty: function () {
                return !Object.keys(this.list).length
            },
            remove: function (e) {
                delete this.list[e.id];
                localStorage.setItem("cartList", JSON.stringify(this.list))
            },
            clear: function () {
                for (var e in this.list) delete this.list[e];
                for (var t in a.restaurant) delete a.restaurant[t];
                localStorage.setItem("cartList", "{}");
            }
        };
        n.init = function () {
            var cartList;
            try {
                cartList = JSON.parse(localStorage.getItem('cartList'));
            } catch (e) {
                localStorage.setItem('cartList', '{}');
            }

            n.setList(cartList);
        };

        return n;
    }])
    .directive('cartAdd', ['Cart', function (cart) {
        return {
            restrict: "A", link: function (scope) {
                var r = scope.dish;
                scope.cart = cart;
                scope.add = function () {
                    cart.add(r);
                }
            }
        };
    }])
    .directive('cartDecrease', ['Cart', function (cart) {
        return {
            restrict: "A", link: function (scope) {
                var r = scope.dish;
                scope.cart = cart;
                scope.decrease = function () {
                    cart.decrease(r);
                }
            }
        }
    }])
    .directive('menuAmount', ['Cart', function (cart) {
        return {
            restrict: "EA", link: function (scope) {
                scope.list = cart.list;
                scope.$watch('list', function () {
                    scope.amount = cart.menuAmount(scope.type, scope.dishType);
                }, !0);
            }
        }
    }]);
//////////////////////mxs/////////////////////////////////////////////////////////////////
angular.module("mxs")
    .factory("userFactory", ["$rootScope", "$http", "$location", function ($rootScope, $http, $location) {
        var getUserCode = function () {
            var tempCode = "";
            var searchArr = location.search.slice(1).split("&");
            for (var i = 0; i < searchArr.length; i++) {
                var itemArr = searchArr[i].split("=");
                if (itemArr[0] === "code") {
                    tempCode = itemArr[1];
                    break;
                }
            }
            return tempCode;
        };

        return userMod = {
            user: {
                id: void 0,
                tel: void 0,
                distributionId: void 0,
                money: void 0
            },
            setUser: function (data) {
                for (var prop in data) {
                    if (this.user.hasOwnProperty(prop)) {
                        this.user[prop] = data[prop];
                    }
                }
            },
            getProp: function (prop) {
                if (!prop) {return};
                return this.user[prop];
            },
            setProp: function (prop, value) {
                if (!prop || !value) return;
                return this.user[prop] = value;
            },
            pullRemote: function () {
                var _this = this;
                $http({
                    method: "post",
                    url: $rootScope.RESTBASE + "/user/userinfo",
                    params: {
                        sig: $rootScope.defaultSig.sig,
                        code: getUserCode() + ""
                    }
                }).success(function (data) {
                    //alert("User = " + JSON.stringify(data));
                    _this.setUser(data.data);
                })
            }
        };
    }]);

angular.module("mxs")
    .controller("registerCtrl", ['$scope', '$rootScope', '$http', '$window', 'userFactory', 'Cart', function (scope, rootScope, $http, $window, user, Cart) {
        scope.user = {
            mobile: "",
            code: ""
        };
        scope.sendCode = function () {
            $http({
                url: rootScope.RESTBASE + "/user/sendvalidatecode",
                method: "post",
                params: {
                    sig: rootScope.defaultSig.sig,
                    userId: user.user.id,
                    tel: scope.user.mobile
                }
            }).success(function (data) {
                alert("验证码发送成功.");
                scope.countdown = !0;
            }).error(function (data) {
                scope.countdown = !1;
            });
        };
        scope.updateTel = function () {
            $http({
                url: rootScope.RESTBASE + "/user/updatetel",
                method: "post",
                params: {
                    sig: rootScope.defaultSig.sig,
                    userId: user.user.id,
                    tel: scope.user.mobile,
                    validateCode: scope.user.code
                }
            }).success(function (data) {
                $window.location.href = "#/order";
                /*var orderList = Cart.getOrder();
                $.ajax({
                    url: rootScope.RESTBASE + "/order",
                    type: "post",
                    dataType: 'JSON',
                    data: {
                        sig: rootScope.defaultSig.sig,
                        userId: user.user.id || -1,
                        voucherId: 0,
                        orderType: 0,
                        remark: scope.note + "" || "",
                        totalPrice: Cart.totalPrice(),
                        dishes: JSON.stringify(orderList)
                    },
                    success: function (data) {
                        if (data.ret == 0) {
                            alert("订单提交成功: " + JSON.stringify(data));
                            localStorage.setItem("cartList", "{}");
                            $window.location.href = "#/detail";
                        } else {
                            alert("订单提交失败：" + data.msg);
                        }
                    }
                })*/
            }).error(function (data) {
                alert("更新手机号码失败：" + data.msg);
            })
        };
    }])
    .directive("countdown", function () {
        var e, t = function (t, r, o) {
            return o ? (o = +o, r.text(o), void(e = setInterval(function () {
                return 0 !== o ? r.text(--o) : void t.$apply(function () {
                    t.countdown = !1
                })
            }, 1e3))) : e && clearInterval(e)
        };
        return {
            restrict: "E",
            link: function (e, r, o) {
                e.$watch("countdown", function (n) {
                    return "stop" == n ? function () {
                        t(e, r);
                        e.countdown = !1
                    }() : n ? t(e, r, o.time) : t(e, r)
                })
            }
        }
    });