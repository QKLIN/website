var SiteDocs = (function () {
    'use strict';

    var STORAGE_KEY = 'qkli_documents';

    var CATEGORIES = {
        sus_note:  { name: '迷思随记', group: '日志', protected: true },
        sentence:  { name: '谩语',     group: '日志', protected: true },
        novel:     { name: '小说',     group: '创作', protected: true },
        poem:      { name: '诗歌',     group: '创作', protected: true },
        message:   { name: '留言',     group: '留言', protected: false }
    };

    var AUTHOR_KEY = 'QKLEAF';

    function isProtectedCategory(key) {
        var info = CATEGORIES[key];
        return info ? info.protected : false;
    }

    function generateId() {
        return 'doc_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    }

    function loadAll() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    }

    function saveAll(docs) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
        } catch (e) {}
    }

    function addDoc(doc) {
        var docs = loadAll();
        doc.id = doc.id || generateId();
        doc.createdAt = doc.createdAt || new Date().toISOString();
        docs.push(doc);
        saveAll(docs);
        return doc;
    }

    function updateDoc(id, updates) {
        var docs = loadAll();
        for (var i = 0; i < docs.length; i++) {
            if (docs[i].id === id) {
                for (var key in updates) {
                    if (updates.hasOwnProperty(key)) {
                        docs[i][key] = updates[key];
                    }
                }
                saveAll(docs);
                return docs[i];
            }
        }
        return null;
    }

    function deleteDoc(id) {
        var docs = loadAll();
        var filtered = docs.filter(function (d) { return d.id !== id; });
        if (filtered.length !== docs.length) {
            saveAll(filtered);
            return true;
        }
        return false;
    }

    function getDoc(id) {
        var docs = loadAll();
        for (var i = 0; i < docs.length; i++) {
            if (docs[i].id === id) return docs[i];
        }
        return null;
    }

    function getDocsByCategory(category) {
        return loadAll().filter(function (d) { return d.category === category; });
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

    return {
        addDoc: addDoc,
        updateDoc: updateDoc,
        deleteDoc: deleteDoc,
        getDoc: getDoc,
        getDocsByCategory: getDocsByCategory,
        getNeighbors: getNeighbors,
        getCategoryInfo: getCategoryInfo,
        getAllCategories: getAllCategories,
        loadAll: loadAll,
        isProtectedCategory: isProtectedCategory,
        AUTHOR_KEY: AUTHOR_KEY
    };
})();
