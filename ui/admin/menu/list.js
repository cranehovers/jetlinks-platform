importResource("/admin/css/common.css");

importMiniui(function () {
    mini.parse();
    require(["miniui-tools"], function (tools) {
        window.tools = tools;
        var grid = window.grid = mini.get("menu-grid");
        tools.initGrid(grid);
        grid.setDataField("result");
        grid.setUrl(API_BASE_PATH + "menu/_query/no-paging?paging=false");
        $(".search-button").on("click", function () {
            var keyword = mini.getbyName("keyword").getValue();
            var param = {};
            if (keyword && keyword.length > 0) {
                require(["request"], function (request) {
                    param = request.createQuery().where()
                        .like("name", "%" + keyword + "%")
                        .or().like("permissionId", "%" + keyword + "%")
                        .or().like("url", "%" + keyword + "%")
                        .getParams();
                    grid.load(param);
                });
            } else {
                grid.load(param);
            }
        });

        var control = {};
        var inited = false;
        var currentNode;
        grid.on("update", function (e) {
            if (currentNode) {

                // grid.addNode(node);
                grid.selectNode(currentNode);
                grid.scrollIntoView(currentNode);
            }
        });
        grid.on("load", function (e) {

            var all = e.result.data;
            if (window.onInit) {
                window.onInit({
                    addDefaultNode: function (node, index, parentNode) {
                        var old;
                        $(all).each(function () {
                            if (this.url === node.url) {
                                old = this;
                            }
                        });
                        console.log(!old, node);
                        if (!old) {
                            all.push(currentNode = node);
                            grid.addNode(node);
                        } else {
                            currentNode = old;
                        }
                    }
                });
            }
        });


    });

});

window.renderAction = function (e) {
    return tools.createActionButton("删除", "icon-remove", function () {
        e.sender.removeRow(e.record);
    });
};
window.selectIcon = function (e) {
    require(["pages/selector/icon"], function (iconSelector) {
        iconSelector(function (icon) {
            e.sender.setValue(icon);
            e.sender.setText(icon);
        });
    })
};
window.renderAction = function (e) {
    var html = [];
    var row = e.record;
    html.push(tools.createActionButton("添加子菜单", "fa fa-plus-circle text-success", function () {
        var sortIndex = row.sortIndex ? (row.sortIndex + "0" + (row.chidren ? row.chidren.length + 1 : 1)) : 1;
        grid.addNode({sortIndex: sortIndex}, row.chidren ? row.chidren.length : 0, row);
    }));

    if (row._state === "added" || row._state === "modified") {
        html.push(tools.createActionButton("保存", "fa fa-check text-success", function () {

            var api = "menu/";
            require(["request", "message"], function (request, message) {
                var func = request.post;
                if (row.id) {
                    func = request.put;
                    api += row.id;
                }

                var loading = message.loading("保存中...");
                row.status = 1;
                func(api, row, function (res) {
                    loading.close();
                    if (res.status === 200) {
                        var id = res.result.id ? res.result.id : row.id;
                        request.get("menu/" + id, function (data) {
                            grid.updateNode(row, data.result);
                            grid.acceptRecord(row);
                            message.showTips("保存成功!");
                            console.log(data.result);
                        });
                    } else {
                        message.showTips("保存失败:" + res.message, "danger");
                    }
                })
            });
        }));
    }

    html.push(tools.createActionButton("删除菜单", "fa fa-times text-danger", function () {
        console.log(row);
        if (row._state === "added") {
            e.sender.removeNode(row);
        } else {
            require(["request", "message"], function (request, message) {
                message.confirm("确定删除该菜单?", function () {
                    var loading = message.loading("删除中...");
                    request["delete"]("menu/" + row.id, {}, function (res) {
                        loading.close();
                        if (res.status === 200) {
                            message.showTips("删除成功")
                            e.sender.removeNode(row);
                        } else {
                            message.showTips("删除失败:" + res.message);
                        }
                    })
                });
            })
        }
    }));
    return html.join("");
}