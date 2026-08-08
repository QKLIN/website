var SiteDocs = (function () {
    'use strict';

    var STORAGE_KEY = 'qkli_documents';
    var JSON_PATH = '/data/documents.json';

    var CATEGORIES = {
        sus_note:  { name: '迷思随记', group: '日志', protected: true },
        sentence:  { name: '谩语',     group: '日志', protected: true },
        novel:     { name: '小说',     group: '创作', protected: true },
        poem:      { name: '诗歌',     group: '创作', protected: true },
        message:   { name: '留言',     group: '留言', protected: false }
    };

    var AUTHOR_KEY = 'QKLEAF';

    var _docs = [];
    var _ready = false;
    var _readyCallbacks = [];

    function isProtectedCategory(key) {
        var info = CATEGORIES[key];
        return info ? info.protected : false;
    }

    function generateId() {
        return 'doc_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    }

    function loadLocal() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    }

    function saveLocal(docs) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
        } catch (e) {}
    }

    function mergeRemoteLocal(remoteDocs, localDocs) {
        var map = {};
        var result = [];

        for (var i = 0; i < remoteDocs.length; i++) {
            var d = remoteDocs[i];
            if (d.id) {
                map[d.id] = d;
                result.push(d);
            }
        }

        for (var j = 0; j < localDocs.length; j++) {
            var ld = localDocs[j];
            if (ld.id && !map[ld.id]) {
                result.push(ld);
            } else if (ld.id && map[ld.id]) {
                var rd = map[ld.id];
                var rt = new Date(rd.updatedAt || rd.createdAt || '2000-01-01').getTime();
                var lt = new Date(ld.updatedAt || ld.createdAt || '2000-01-01').getTime();
                if (lt > rt) {
                    for (var k = 0; k < result.length; k++) {
                        if (result[k].id === ld.id) {
                            result[k] = ld;
                            break;
                        }
                    }
                }
            }
        }

        return result;
    }

    function init() {
        fetch(JSON_PATH + '?t=' + Date.now())
            .then(function (res) {
                if (!res.ok) throw new Error('fetch failed');
                return res.json();
            })
            .then(function (remote) {
                var local = loadLocal();
                _docs = mergeRemoteLocal(remote, local);
                saveLocal(_docs);
                _ready = true;
                fireReady();
            })
            .catch(function () {
                _docs = loadLocal();
                _ready = true;
                fireReady();
            });
    }

    function fireReady() {
        for (var i = 0; i < _readyCallbacks.length; i++) {
            _readyCallbacks[i]();
        }
        _readyCallbacks = [];
    }

    function ready(cb) {
        if (_ready) {
            cb();
        } else {
            _readyCallbacks.push(cb);
        }
    }

    function loadAll() {
        return _docs.slice();
    }

    function saveAll(docs) {
        _docs = docs.slice();
        saveLocal(_docs);
    }

    function exportJSON() {
        return JSON.stringify(_docs.map(function (d) {
            var copy = {};
            for (var key in d) {
                if (d.hasOwnProperty(key)) copy[key] = d[key];
            }
            return copy;
        }), null, 2);
    }

    function addDoc(doc) {
        var docs = _docs.slice();
        doc.id = doc.id || generateId();
        doc.createdAt = doc.createdAt || new Date().toISOString();
        doc.updatedAt = new Date().toISOString();
        docs.push(doc);
        saveAll(docs);
        return doc;
    }

    function updateDoc(id, updates) {
        var docs = _docs.slice();
        for (var i = 0; i < docs.length; i++) {
            if (docs[i].id === id) {
                for (var key in updates) {
                    if (updates.hasOwnProperty(key)) {
                        docs[i][key] = updates[key];
                    }
                }
                docs[i].updatedAt = new Date().toISOString();
                saveAll(docs);
                return docs[i];
            }
        }
        return null;
    }

    function deleteDoc(id) {
        var docs = _docs.slice();
        var filtered = docs.filter(function (d) { return d.id !== id; });
        if (filtered.length !== docs.length) {
            saveAll(filtered);
            return true;
        }
        return false;
    }

    function getDoc(id) {
        var docs = _docs;
        for (var i = 0; i < docs.length; i++) {
            if (docs[i].id === id) return docs[i];
        }
        return null;
    }

    function getDocsByCategory(category) {
        return _docs.filter(function (d) { return d.category === category; });
    }

    function getNeighbors(id) {
        var doc = getDoc(id);
        if (!doc) return { prev: null, next: null };

        var siblings = getDocsByCategory(doc.category);
        siblings.sort(function (a, b) {
            return new Date(a.createdAt) - new Date(b.createdAt);
        });

        var idx = -1;
        for (var i = 0; i < siblings.length; i++) {
            if (siblings[i].id === id) { idx = i; break; }
        }

        return {
            prev: idx > 0 ? siblings[idx - 1] : null,
            next: idx < siblings.length - 1 ? siblings[idx + 1] : null
        };
    }

    function getCategoryInfo(key) {
        return CATEGORIES[key] || null;
    }

    function getAllCategories() {
        return CATEGORIES;
    }

    init();

    return {
        ready: ready,
        addDoc: addDoc,
        updateDoc: updateDoc,
        deleteDoc: deleteDoc,
        getDoc: getDoc,
        getDocsByCategory: getDocsByCategory,
        getNeighbors: getNeighbors,
        getCategoryInfo: getCategoryInfo,
        getAllCategories: getAllCategories,
        loadAll: loadAll,
        exportJSON: exportJSON,
        isProtectedCategory: isProtectedCategory,
        AUTHOR_KEY: AUTHOR_KEY
    };
})();
