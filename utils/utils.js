var utils = {
    pool: {
        buoyUID: 0,
        readyInit: false,
        isReady: false
    },
    getUID: function () {
        return '' + (new Date()).getMilliseconds() + utils.pool.buoyUID++;
    },
    url: {
        getParam: function (name) {
            var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
            var r = window.location.search.substr(1).match(reg);
            if (r !== null) {
                return decodeURI(r[2]);
            }
            return null;
        },
        getParamKeys: function () {
            return utils.map.keys(this.getParamMap());
        },
        getParamVals: function () {
            return utils.map.vals(this.getParamMap());
        },
        getParamMap: function () {
            return this.paramStringToMap(window.location.search);
        },
        paramStringToMap: function (str) {
            var url = (str || '').split('?');
            str = url[url.length - 1];
            if (utils.string.isBlank(str)) {
                return {};
            }
            var entrys = str.replace(/\+/g, ' ').split('&'), entry, map = {}, k, v;
            for (var i in entrys) {
                if (!entrys.hasOwnProperty(i)) continue;
                entry = entrys[i].split('=');
                k = decodeURIComponent(entry[0]);
                v = entry[1];
                v && (v = decodeURIComponent(v));
                map[k] = v;
            }
            return map;
        },
        mapToParamString: function (m) {
            if (utils.map.isEmpty(m)) {
                return '';
            }
            var keys = utils.map.keys(m), url = '';
            for (var i = 0, len = keys.length, key, val; i < len; i++) {
                key = keys[i];
                val = m[key];
                if (i !== 0) {
                    url += '&';
                }
                url += encodeURIComponent(key);
                if (typeof val !== 'undefined') {
                    url += '=' + encodeURIComponent(val);
                }
            }
            return url;
        }
    },
    object: {
        isObject: function (obj) {
            return typeof obj === 'object';
        },
        isFunction: function (obj) {
            return typeof obj === 'function';
        },
        isArray: function (obj) {
            return this.isNotNull(obj) && obj.constructor === Array;
        },
        isNull: function (obj) {
            return typeof obj === "undefined" || obj === null;
        },
        isNotNull: function (obj) {
            return !this.isNull(obj);
        },
        getChildrenPath: function (obj, c, k) {
            if (this.isNull(obj)) {
                return null;
            }
            if (obj === c) {
                return k;
            }
            if (this.isObject(obj)) {
                var v;
                for (var key in obj) {
                    if (!obj.hasOwnProperty(key)) continue;
                    v = this.getChildrenPath(obj[key], c, key);
                    if (utils.string.isNotBlank(v)) {
                        return (utils.string.isNotBlank(k) ? k + '.' : '') + v;
                    }
                }
            }
            return null;
        }
    },
    string: {
        /**
         * 转义HTML为&的形式
         * @param str
         * @returns {string}
         */
        escapeHtml: function (str) {
            if (!str) {
                return null;
            }
            str = str + '';
            str = str.replace(/&/ig, "&amp;");
            str = str.replace(/</ig, "&lt;");
            str = str.replace(/>/ig, "&gt;");
            str = str.replace(/"/ig, "&quot;");
            str = str.replace(/ /ig, "&nbsp;");
            return str;
        },
        trim: function (str) {
            return utils.object.isNull(str) ? '' : (str + "").replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, "")
        },
        isBlank: function (str) {
            return utils.object.isNull(str) || this.trim(str).length === 0;
        },
        isNotBlank: function (str) {
            return !this.isBlank(str);
        },
        isEmpty: function (str) {
            return utils.object.isNull(str) || ("" + str).length === 0;
        },
        isNotEmpty: function (str) {
            return !this.isEmpty(str)
        },
        buildTpl: function (tpl, data) {
            var re = /\{%=?((?!%}).|\r|\n)*%}/g,
                code = "var r = [];",
                cursor = 0,
                match;

            function add(str, mode) {
                if (utils.string.isEmpty(str)) {
                    return add;
                }

                if (mode === 1) {
                    code += str+'\r';
                } else if (mode === 2) {
                    code += "r.push(" + str + ");"
                } else {
                    code += "r.push('" + str.replace(/'/g, "\\'").replace(/\s*([\r\n])\s*/g, ' ') + "');"
                }
                return add;
            }

            while (match = re.exec(tpl)) {
                add(tpl.slice(cursor, match.index))(match[0].replace(/(^\{%=|^\{%|%}$)/g, ""), /^(\t| )*\{%=/g.test(match[0]) ? 2 : 1);
                cursor = match.index + match[0].length;
            }
            add(tpl.substr(cursor));
            code += 'return r.join("");';

            var runFn = function(d){
                return (new Function(utils.map.keys(d).join(","), code)).apply(null, utils.map.vals(d))
            };
            if(utils.object.isNotNull(data)){
                return runFn(data);
            }else{
                return runFn;
            }
        }
    },
    list: {
        isEmpty: function (l) {
            return utils.object.isNull(l) || l.length < 1;
        },
        isNotEmpty: function (l) {
            return !utils.list.isEmpty(l);
        },
        stringToList: function (s) {
            return s && s.length > 0 ? (typeof s === 'string' ? s.split(',') : s) : [];
        },
        find: function (l, k, v, j) {
            var n = [];
            if (utils.list.isNotEmpty(l)) {
                for (var i = 0, len = l.length, r; r = l[i], i < len; i++) {
                    if (j ? r[k] === v : '' + r[k] === '' + v) n.push(r);
                }
            }
            return n;
        },
        indexOf: function (l, k, v, b, j) {
            var n = -1;
            if (utils.list.isNotEmpty(l)) {
                for (var i = b || 0, len = l.length, r; r = l[i], i < len; i++) {
                    if (j ? r[k] === v : '' + r[k] === '' + v) {
                        n = i;
                        break;
                    }
                }
            }
            return n;
        }
    },
    map: {
        mapsExtVal: function (maps, key) {
            var list = [];
            for (var i = 0, len = maps.length; i < len; i++) {
                list.push(maps[i][key]);
            }
            return list;
        },
        listToMap: function (list, key) {
            if (utils.object.isNull(list) || utils.string.isEmpty(key)) {
                return null;
            }
            var map = {}, row;
            for (var i = 0, len = list.length; i < len; i++) {
                row = list[i];
                map[row[key]] = row;
            }
            return map;
        },
        isEqualForString: function (a, b) {
            return utils.map.isEqual(a, b, null, true);
        },
        isEmpty: function (m) {
            return utils.object.isNull(m) || this.keys(m).length < 1;
        },
        isNotEmpty: function (m) {
            return !this.isEmpty(m);
        },
        isEqual: function (a, b, isWeak, isString) {
            if (utils.object.isNull(a) && utils.object.isNull(b)) {
                return true;
            }
            if (utils.object.isNull(a) || utils.object.isNull(b)) {
                return false;
            }
            var aks = this.keys(a), bks = this.keys(b)
                , aksl = aks.length, bksl = bks.length;
            if (aksl !== bksl) {
                return false;
            }
            for (var i = 0; i < aksl; i++) {
                if (isWeak || isString ? '' + a[aks[i]] !== '' + b[aks[i]] : a[aks[i]] !== b[aks[i]]) {
                    return false;
                }
            }
            return true;

        },
        keys: function (m) {
            var keys = [];
            for (var key in m) {
                if (m.hasOwnProperty(key)) {
                    keys.push(key);
                }
            }
            return keys;
        },
        vals: function (m) {
            var l = [], keys = utils.map.keys(m);
            for (var i = 0, len = keys.length; i < len; i++) {
                l.push(m[keys[i]])
            }
            return l;
        }
    },
    color: {
        RGBToHex: function (r, g, b) {
            if (utils.object.isNull(g) || utils.object.isNull(b)) {
                r = r.replace(/[^\d,]/g, '').split(',');
                b = r[2];
                g = r[1];
                r = r[0];
            }
            return '#' + toHex(r) + toHex(g) + toHex(b);
            function toHex(s) {
                return parseInt(s,10).toString(16).replace(/^(.)$/, '0$1')
            }
        },
        HexToRGB: function (hex) {
            hex = hex.replace(/[^0-9a-fA-F]/g, '');
            if (hex.length === 3) {
                hex = hex.charAt(0) + hex.charAt(0) + hex.charAt(1) + hex.charAt(1) + hex.charAt(2) + hex.charAt(2);
            }
            var r = parseInt(hex.substring(0, 2), 16),
                g = parseInt(hex.substring(2, 4), 16),
                b = parseInt(hex.substring(4, 6), 16);
            return ['rgb(' + r + ', ' + g + ', ' + b + ')', {r: r, g: g, b: b}];
        }
    },
    json: {
        toString: function (j) {
            return j ? (typeof j === 'string' ? j : JSON.stringify(j)) : '';
        },
        parse: function (s) {
            return s ? (typeof s === 'string' ? JSON.parse(s) : s) : null;
        },
        cloneObject: function (obj) {
            if (utils.object.isNull(obj)) {
                return null;
            }
            return JSON.parse(JSON.stringify(obj));
        }
    },
    cookie: {
        get: function (name) {
            var arr, reg = new RegExp("(^| )" + name + "=([^;]*)(;|$)");
            if (arr = document.cookie.match(reg))
                return decodeURIComponent(arr[2]);
            else
                return null;
        },
        set: function (name, val, ex) {
            document.cookie = name + '=' + encodeURIComponent(val) + ';' + (ex ? ex : '');
        }
    },
    form: {
        get: function (f) {
            function filterAttr(ele, attr, val) {
                var e = [], ve = utils.object.isNotNull(val), ist = val === 'text';
                for (var i = 0, len = ele ? ele.length : 0, v; i < len; i++) {
                    v = ele[i].getAttribute(attr);
                    if (ist && (v === '' || v === null)) v = 'text';
                    if (ve ? val === v : utils.object.isNotNull(v)) {
                        e.push(ele[i]);
                    }
                }
                return e;
            }

            function filterChecked(ele) {
                var e = [];
                for (var i = 0, len = ele.length; i < len; i++) {
                    if (ele[i].checked) {
                        e.push(ele[i]);
                    }
                }
                return e;
            }

            function filter(ele, type) {
                return filterChecked(filterAttr(ele, 'type', type))
            }

            var $input = f.getElementsByTagName('input')
                , $select = f.getElementsByTagName('select')
                , $radios = filter($input, 'radio')
                , $checkboxs = filter($input, 'checkbox')
                , $texts = filterAttr($input, 'type', 'text')
                , params = {}
                , name;

            function getData($ele, allowEmpty) {
                for (var i = 0, len = $ele.length, $e, val; i < len; i++) {
                    $e = $ele[i];
                    name = $e.getAttribute('name');
                    val = $e.value;
                    params[name] = !allowEmpty && utils.string.isEmpty(val) ? '' : val;
                }
            }

            getData($select, false);
            getData($radios, false);
            getData($texts, true);
            var names = {};
            for (var j = 0, size = $checkboxs.length; j < size; j++) {
                name = $checkboxs[j].getAttribute('name');
                if (utils.object.isNotNull(name)) {
                    names[name] = "";
                }
            }
            names = utils.map.keys(names);
            for (var k = 0, leng = names.length, vals, $checkbox; k < leng; k++) {
                name = names[k];
                $checkbox = filterAttr($checkboxs, 'name', name);
                vals = [];
                for (var n = 0, lengt = $checkbox.length; n < lengt; n++) {
                    vals.push($checkbox[n].value)
                }
                params[name] = vals;
            }
            return params;
        }
    },
    fnQueue: {
        queue: {default: []},
        getQueue: function (queue) {
            var that = this;
            return typeof queue === 'string' ? (that.queue[queue] || (that.queue[queue] = [])) : queue || that.queue.default;
        },
        add: function (fn, queue, i) {
            var that = this;
            typeof fn === 'function' && that.getQueue(queue).push({fn: fn, i: i || 999999});
            that.getQueue(queue).sort(function (a, b) {
                return a.i - b.i;
            })
        },
        run: function (queue) {
            for (var q = this.getQueue(queue), i = 0, fn; fn = (q[i] || {}).fn, i < q.length || (q.length = 0, false); i++) {
                fn();
            }
        }
    },
    ready: function (fn, i) {
        if (!utils.object.isFunction(fn) || utils.pool.isReady) {
            return;
        }
        var queue = 'document_ready';
        utils.fnQueue.add(fn, queue, i);
        if (!utils.pool.readyInit) {
            utils.pool.readyInit = true;
            if (typeof jQuery === 'undefined') {
                if (document.addEventListener) {
                    document.addEventListener("DOMContentLoaded", run, false);
                    window.addEventListener("load", run, false);
                } else {
                    document.attachEvent("onreadystatechange", run);
                    window.attachEvent("onload", run);
                }
            } else {
                $(function () {
                    run();
                })
            }
        }

        function run() {
            if (utils.pool.isReady) {
                return;
            }
            utils.pool.isReady = true;
            utils.fnQueue.run(queue);
        }
    },
    date: {
        msToDHMS: function (m,neg) {
            if (m < 1 && !neg) {m=0;}
            var d = {};
            m = parseInt(m, 10);
            d.milliseconds = m % 1000;
            m = parseInt(m / 1000, 10);
            d.seconds = m % 60;
            m = parseInt(m / 60, 10);
            d.minutes = m % 60;
            m = parseInt(m / 60, 10);
            d.hours = m % 24;
            d.day = parseInt(m / 24, 10);
            return d;
        }
    },
    css: {
        classStyle: function (className, style, val) {
            var cssRules = document.all ? 'rules' : 'cssRules', reg = className.constructor == RegExp, t, d;
            for (var i = 0, len = document.styleSheets.length; i < len; i++) {
                for (var k = 0, size = document.styleSheets[i][cssRules] ? document.styleSheets[i][cssRules].length : 0; k < size; k++) {
                    d = document.styleSheets[i]['rules'][k];
                    t = d.selectorText;
                    if (reg && className.test(t) || t === className) {
                        return utils.object.isNull(style) ? d : (utils.object.isNull(val) ? d.style[style] : d.style[style] = val);
                    }
                }
            }
            return null;
        },
        addClass: function (styleEle, selector, rules, index) {
            if(styleEle.constructor !== HTMLStyleElement){
                var style = document.createElement('style');
                style.type = 'text/css';
                (document.head || document.getElementsByTagName('head')[0]).appendChild(style);
                index = rules;
                rules = selector;
                selector = styleEle;
                styleEle = style;
            }
            var sheet = styleEle.sheet ||styleEle.styleSheet;
            index = utils.object.isNull(index)?(sheet.rules || sheet.cssRules).length : index;
            if (sheet.insertRule) {
                sheet.insertRule(selector + "{" + rules + "}", index);
            } else {
                sheet.addRule(selector, rules, index);
            }
            return styleEle;
        }
    },
    $: {
        ele: {
            switchTag: function (param) {
                !param && (param = {});
                var $tag = $(param.tag || '[role="switch-tag"]'),
                    $target = $(param.target || ''),
                    targetKey = param.targetKey || 'data-switch-target',
                    indexKey = param.indexKey || 'data-index',
                    indexKeyS = '[' + indexKey + ']',
                    activityClass = param.activityClass || 'activity';
                if ($target.size() === 0) {
                    $target = $($tag.attr(targetKey));
                    if ($target.size() === 0) {
                        return;
                    }
                }
                $tag.off('click.switchTag').on('click.switchTag', indexKeyS, function () {
                    var $e = $(this), index = $e.attr(indexKey);
                    $tag.find(indexKeyS).removeClass(activityClass);
                    $e.addClass(activityClass);
                    $target.find(indexKeyS).removeClass(activityClass).hide();
                    $target.find('[' + indexKey + '="' + index + '"]').addClass(activityClass).show();
                    param.callback && param.callback($tag, $target, index);
                })
            }
        }
    }
};