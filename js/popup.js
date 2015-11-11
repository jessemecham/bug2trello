function closeOnSuccess() {
    setTimeout(function() {
        window.close();
    }, 100);
}

var addCard = function(num, title, bdesc, link) {
    var list = '55a6adf27cdcb83158723ffe';
    if (num == ''){
        var name = title;
    }
    else {
        var name = num + " - " + title;
    }
    var desc = link + '\n\n' + bdesc;
    Trello.post("cards", {
        name: name,
        desc: desc,
        idList: list,
        success: closeOnSuccess
    });
}

var getBoards = function(){
    Trello.get("/members/me/boards?filter=open", function(boards) {
        $.each(boards, function(ix, boards) {
            $(new Option(boards.name, boards.id)).appendTo("#board_list");
        });
    });
}

function boardSelected(){
    var board = $('#board_list :selected').val();
    var boardLink = "https://trello.com/board/" + board
    $('#trello-link a').prop('href', boardLink)
    $('#lists_list').find('option').remove();
    if (board == "Select a board") {
        $('#lists_list').append('<option>Select a list</option>');
        $("#add-bug").removeClass("btn-primary");
        $("#add-bug").addClass("disabled");
        $("i").removeClass("icon-white");
    } else {
        Trello.get("boards/" + board + "/lists", function(lists) {
            $.each(lists, function(ix, lists) {
                $(new Option(lists.name, lists.id)).appendTo("#lists_list");
            });
        });
        $("#lists_list").val($("#lists_list option:first").val());
        $("#add-bug").addClass("btn-primary");
        $("#add-bug").removeClass("disabled");
        $("i").addClass("icon-white");
    }
}

function onAuthorize() {
    Trello.members.get("me", function(member) {
        $("#fullName").text(member.fullName);
    });
    $('#loggedout').hide();
    $('#loggedin').show();
    getBoards();
}

var logout = function() {
    Trello.deauthorize();
    $('#loggedin').hide();
    $('#loggedout').show();
    $('#lists_list').find('option').remove();
    $('#lists_list').append('<option>Select a list</option>');
    $('#board_list').find('option').remove();
    $('#board_list').append('<option>Select a board</option>');
    $("#add-bug").removeClass("btn-primary");
    $("#add-bug").addClass("disabled");
}

function addGithub(url) {
    var path = url.pathname.split('/');
    var bugNum = path[path.length - 1];
    var bugOwner = path[1];
    var bugRepo = path[2];
    var type = 'Unkown'
    if (url.pathname.indexOf('issues') > -1) {
        type = 'Issue';
    }
    else if (url.pathname.indexOf('pull') > -1) {
        type = 'Pull';
    }
    var bugJson = $.ajax({
        type: "Get",
        url: url,
        dataType: "html",
        success: function (data) {
            var prefix = bugRepo + ": #" + bugNum
            var body = $(data).filter('meta[name="description"]').attr("content");
            var title = $(data).find('.js-issue-title').text();
            title = title + " (" + type + ")"
            addCard(prefix, title, body, url)
        },
        error: function () {
            $('#error').show();
        }
    });
}

function parseLink(tablink) {
    var parser = document.createElement('a');
    parser.href = tablink;
    if(parser.hostname == 'github.com') {
        if (parser.pathname.indexOf('issues') > -1) {
            addGithub(parser, 'Issue');
        }
        else if (parser.pathname.indexOf('pull') > -1) {
            addGithub(parser, 'Pull');
        }
    }
    else {
        $.ajax({
            type: "Get",
            url: tablink,
            dataType: "html",
            success: function (data) {
                var og_site_name = $(data).filter('meta[property="og:site_name"]').attr("content");
                if(og_site_name == 'GitHub Enterprise') {
                    addGithub(parser);
                } else {
                    $('#error').show();
                }
            },
            error: function () {
                $('#error').show();
            }
        });
    }
}

function addClicked() {
    chrome.tabs.getSelected(null,function(tab) {
        var tablink = tab.url;
        parseLink(tablink)
    });
}

function closePopup() {
    // Close popup and open auth tab
    setTimeout(function() {
        window.close();
        chrome.tabs.create({url: chrome.extension.getURL('settings.html')});
    }, 100);
}

function init() {
    if(!localStorage.trello_token) {
        closePopup();
        return;
    }
    else {
        Trello.authorize({
            interactive:false,
            success: onAuthorize
        });
    }
}

window.addEventListener('load', init);

document.addEventListener('DOMContentLoaded', function () {
    $("#disconnect").click(logout);
    $("#connect").click(init);
    $("#board_list").change(boardSelected);
    $("#add-bug").click(addClicked);
});

// trello board id 55a44498b1c038e829b5815a
// inbox list id 55a6adf27cdcb83158723ffe
