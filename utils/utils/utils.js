var utils = {
    pool: {
        buoyUID: 0
    },
    getUID: function () {
        return '' + (new Date()).getMilliseconds() + utils.pool.buoyUID++;
    },
    url: {
        getParam: function (name) {
            var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
            var r = window.location.search.substr(1).match(reg);
            if (r != null)return decodeURI(r[2]);
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
            str = (str || '').replace(/^\?/, '');
            if (utils.string.isBlank(str)) return {};
            var entrys = str.split('&'), entry, map = {}, k, v;
            for (var i in entrys) {
                entry = entrys[i].split('=');
                k = decodeURI(entry[0]);
                v = entry[1];
                v && (v = decodeURI(v));
                map[k] = v;
            }
            return map;
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
            return this.isNotNull(obj) && obj.constructor == Array;
        },
        isNull: function (obj) {
            return typeof obj === "undefined" || obj === null;
        },
        isNotNull: function (obj) {
            return !this.isNull(obj);
        },
        getChildrenPath: function (obj, c, k) {
            if (this.isNull(obj)) return null;
            if (obj === c) {
                return k;
            }
            if (this.isObject(obj)) {
                var v;
                for (var key in obj) {
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
            //str = str.replace(/\r\n/ig, "<br/>");
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
            var re = /\{%=?((?!%}).)*%}/g,
                code = "var r = [];",
                cursor = 0,
                match;

            function add(str, mode) {
                if (utils.string.isEmpty(str)) {
                    return add;
                }

                if (mode === 1) {
                    code += str;
                } else if (mode === 2) {
                    code += "r.push(" + str + ");"
                } else {
                    code += "r.push('" + str.replace(/'/g, "\\'") + "');"
                }
                return add;
            }

            while (match = re.exec(tpl)) {
                add(tpl.slice(cursor, match.index))(match[0].replace(/(^\{%=|^\{%|%}$)/g, ""), /^(\t| )*\{%=/g.test(match[0]) ? 2 : 1);
                cursor = match.index + match[0].length;
            }
            add(tpl.substr(cursor));
            code += 'return r.join("");';
            var keys = [], param = [];
            for (var key in data) {
                if (typeof data[key] === "function") {
                    continue;
                }
                keys.push(key);
                param.push(data[key]);
            }
            return (new Function(keys.join(","), code.replace(/[\r\t\n]/g, ''))).apply(null, param);
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
                    (j ? r[k] === v : r[k] == v) && n.push(r);
                }
            }
            return n;
        },
        indexOf: function (l, k, v, b, j) {
            var n = -1;
            if (utils.list.isNotEmpty(l)) {
                for (var i = b || 0, len = l.length, r; r = l[i], i < len; i++) {
                    if (j ? r[k] === v : r[k] == v) {
                        n = i;
                        break;
                    }
                }
            }
            return n;
        }
    },
    map: {
        listToMap: function (list, key) {
            if (utils.object.isNull(list) || utils.string.isEmpty(key)) return null;
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
        isEqual: function (a, b, isWeak, isString) {
            if (utils.object.isNull(a) && utils.object.isNull(b)) return true;
            if (utils.object.isNull(a) || utils.object.isNull(b)) return false;
            var aks = this.keys(a), bks = this.keys(b)
                , aksl = aks.length, bksl = bks.length;
            if (aksl != bksl) return false;
            for (var i = 0; i < aksl; i++) {
                if (isString ? a[aks[i]] + '' !== b[aks[i]] + '' : isWeak ? a[aks[i]] != b[aks[i]] : a[aks[i]] !== b[aks[i]]) {
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
            var $container = $(f)
                , $radios = $container.find(':radio:checked,select')
                , $checkboxs = $container.find(':checkbox:checked')
                , $texts = $container.find(':text')
                , $checkbox
                , $radio
                , $text
                , params = {}
                , name
                , names = {}
                , vals
                , val
                , i, len;
            for (i = 0, len = $radios.size(); i < len; i++) {
                $radio = $radios.eq(i);
                name = $radio.attr('name');
                val = $radio.val();
                params[name] = utils.string.isEmpty(val) ? '' : val;
            }
            for (i = 0, len = $texts.size(); i < len; i++) {
                $text = $texts.eq(i);
                name = $text.attr('name');
                val = $text.val();
                params[name] = val;
            }
            for (var j = 0, size = $checkboxs.size(); j < size; j++) {
                name = $checkboxs.eq(j).attr('name');
                if (utils.object.isNotNull(name)) names[name] = "";
            }
            names = utils.map.keys(names);
            for (var k = 0, leng = names.length; k < leng; k++) {
                name = names[k];
                $checkbox = $checkboxs.filter('[name="' + name + '"]');
                vals = [];
                for (var n = 0, lengt = $checkbox.size(); n < lengt; n++) {
                    vals.push($checkbox.eq(n).val())
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
            for (var q = this.getQueue(queue), i = 0, l = q.length, fn; fn = (q[i] || {}).fn, i < l || (q.length = 0, false); i++) fn();
        }
    }
};