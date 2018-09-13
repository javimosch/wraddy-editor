function beautifyAceEditor(editor, item) {
    var content = editor.session.getValue();
    if (item && item.type) {
        if (['css', 'style', 'scss'].includes(item.type)) {
            return editor.setValue(css_beautify(content, {
                indent_char: "\t",
                indent_size: 1,
                selector_separator_newline: false,
                space_around_selector_separator: true
            }));
        }
        if (['html'].includes(item.type)) {
            return editor.setValue(html_beautify(content, {
                indent_char: "\t",
                indent_size: 1
            }));
        }
    }
    editor.setValue(js_beautify(content, {
        indent_char: "\t",
        indent_size: 1
    }));
}

function httpPost(url, data, options = {}) {
    var withCredentials = options && options.withCredentials == false ? false : true
    return new Promise((resolve, reject) => {
        if (!data) {
            data = {};
        }
        data = JSON.stringify(data);
        try {
            var settings = {
                type: options.method || 'post',
                url: url,
                crossDomain: true,
                contentType: 'application/json; charset=utf-8',
                xhrFields: {
                    withCredentials: withCredentials
                }
            };
            if (options.method !== 'get') {
                settings.data = data;
            }
            $.ajax(settings).always(function(response, status, xhr) {
                if (status == 'error') {
                    reject({
                        message: "error",
                        detail: xhr
                    });
                }
                if (!response) {
                    return resolve(response)
                }
                if (response.err) {
                    reject(response.err);
                } else {
                    resolve(response.result || response)
                }
            });
        } catch (err) {
            reject(err)
        }
    });
}


function enableAutoResizeSidebar() {
    var i = 0;
    var dragging = false;
    if ($('#dragbar').length === 0) {
        return setTimeout(enableAutoResizeSidebar, 100)
    }

    var cache = window.localStorage.getItem('sidebar')
    if (cache) {
        $('#SidebarLayout').css("width", cache + "px");
        $('#MainLayout').css("width", "calc(100vw - " + cache + "px)");
    }

    $(document).on('mousedown', '#dragbar', function(e) {
        e.preventDefault();

        dragging = true;
        var main = $('#MainLayout');
        var ghostbar = $('<div>', {
            id: 'ghostbar',
            css: {
                height: main.outerHeight(),
                top: main.offset().top,
                left: main.offset().left
            }
        }).appendTo('body');

        $(document).mousemove(function(e) {
            ghostbar.css("left", e.pageX + 2);
        });

    });

    $(document).mouseup(function(e) {
        if (dragging) {
            var percentage = (e.pageX / window.innerWidth) * 100;
            let px = window.innerWidth * percentage / 100
            $('#SidebarLayout').css("width", px + "px");
            $('#MainLayout').css("width", "calc(100vw - " + px + "px)");
            window.localStorage.setItem('sidebar', px)
            $('#ghostbar').remove();
            $(document).unbind('mousemove');
            dragging = false;
        }
    });

}


function timeDifference(current, previous) {

    var msPerMinute = 60 * 1000;
    var msPerHour = msPerMinute * 60;
    var msPerDay = msPerHour * 24;
    var msPerMonth = msPerDay * 30;
    var msPerYear = msPerDay * 365;

    var elapsed = current - previous;

    if (elapsed < msPerMinute) {
        return Math.round(elapsed / 1000) + ' seconds ago';
    } else if (elapsed < msPerHour) {
        return Math.round(elapsed / msPerMinute) + ' minutes ago';
    } else if (elapsed < msPerDay) {
        return Math.round(elapsed / msPerHour) + ' hours ago';
    } else if (elapsed < msPerMonth) {
        return 'approximately ' + Math.round(elapsed / msPerDay) + ' days ago';
    } else if (elapsed < msPerYear) {
        return 'approximately ' + Math.round(elapsed / msPerMonth) + ' months ago';
    } else {
        return 'approximately ' + Math.round(elapsed / msPerYear) + ' years ago';
    }
}

function qs(key, value) {
    if (value) {
        if (history.pushState) {
            qsRemove(key);
            var currentUrl = window.location.href;
            var queryStart;
            if (currentUrl.indexOf('?') !== -1) {
                queryStart = '&';
            } else {
                queryStart = '?';
            }
            var newurl = currentUrl + queryStart + key + '=' + value
            window.history.pushState({
                path: newurl
            }, '', newurl);
        }
        return;
    }
    key = key.replace(/[*+?^$.\[\]{}()|\\\/]/g, "\\$&"); // escape RegEx meta chars
    var match = location.search.match(new RegExp("[?&]" + key + "=([^&]+)(&|$)"));
    return match && decodeURIComponent(match[1].replace(/\+/g, " "));
}

function qsRemove(key) {



    var urlValue = document.location.href;
    var searchUrl = location.search;
    if (key != "") {
        oldValue = qs(key);
        removeVal = key + "=" + oldValue;
        if (searchUrl.indexOf('?' + removeVal + '&') != "-1") {
            urlValue = urlValue.replace('?' + removeVal + '&', '?');
        } else if (searchUrl.indexOf('&' + removeVal + '&') != "-1") {
            urlValue = urlValue.replace('&' + removeVal + '&', '&');
        } else if (searchUrl.indexOf('?' + removeVal) != "-1") {
            urlValue = urlValue.replace('?' + removeVal, '');
        } else if (searchUrl.indexOf('&' + removeVal) != "-1") {
            urlValue = urlValue.replace('&' + removeVal, '');
        }
    } else {
        var searchUrl = location.search;
        urlValue = urlValue.replace(searchUrl, '');
    }
    history.pushState({
        state: 1,
        rand: Math.random()
    }, '', urlValue);
}


function objectDeepCompare(obj1, obj2) {
    //Loop through properties in object 1
    for (var p in obj1) {
        //Check property exists on both objects
        if (obj1.hasOwnProperty(p) !== obj2.hasOwnProperty(p)) return false;

        switch (typeof(obj1[p])) {
            //Deep compare objects
            case 'object':
                if (!Object.compare(obj1[p], obj2[p])) return false;
                break;
                //Compare function code
            case 'function':
                if (typeof(obj2[p]) == 'undefined' || (p != 'compare' && obj1[p].toString() != obj2[p].toString())) return false;
                break;
                //Compare values
            default:
                if (obj1[p] != obj2[p]) return false;
        }
    }

    //Check object 2 for any extra properties
    for (var p in obj2) {
        if (typeof(obj1[p]) == 'undefined') return false;
    }
    return true;
};