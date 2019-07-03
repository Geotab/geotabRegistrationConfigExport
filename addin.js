(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
exports.__esModule = true;
var groupsBuilder_1 = require("./groupsBuilder");
var securityClearancesBuilder_1 = require("./securityClearancesBuilder");
var reportsBuilder_1 = require("./reportsBuilder");
var rulesBuilder_1 = require("./rulesBuilder");
var distributionListsBuilder_1 = require("./distributionListsBuilder");
var miscBuilder_1 = require("./miscBuilder");
var utils_1 = require("./utils");
var waiting_1 = require("./waiting");
var Addin = /** @class */ (function () {
    function Addin(api) {
        var _this = this;
        this.exportBtn = document.getElementById("exportButton");
        this.data = {
            groups: [],
            reports: [],
            rules: [],
            distributionLists: [],
            devices: [],
            users: [],
            zoneTypes: [],
            zones: [],
            workTimes: [],
            workHolidays: [],
            securityGroups: [],
            customMaps: [],
            diagnostics: [],
            misc: null,
            notificationTemplates: []
        };
        this.toggleWaiting = function (isStart) {
            if (isStart === void 0) { isStart = false; }
            if (isStart) {
                _this.toggleExportButton(true);
                _this.waiting.start(document.getElementById("addinContainer").parentElement, 9999);
            }
            else {
                _this.toggleExportButton(false);
                _this.waiting.stop();
            }
        };
        this.toggleThisAddinIncluded = function (e) {
            var isChecked = !!e.target && !!e.target.checked;
            var addinsBlock = document.getElementById("exportedAddins");
            var addinsData = _this.miscBuilder.getAddinsData(!isChecked);
            _this.showEntityMessage(addinsBlock, addinsData.length, "addin");
            _this.data.misc.addins = addinsData;
        };
        this.exportData = function () {
            _this.toggleWaiting(true);
            return _this.reportsBuilder.getData().then(function (reportsData) {
                _this.data.reports = reportsData;
                console.log(_this.data);
                utils_1.downloadDataAsFile(JSON.stringify(_this.data), "export.json");
            })["catch"](function (e) {
                alert("Can't export data.\nPlease try again later.");
                console.error(e);
            })["finally"](function () { return _this.toggleWaiting(); });
        };
        this.api = api;
        this.groupsBuilder = new groupsBuilder_1["default"](api);
        this.securityClearancesBuilder = new securityClearancesBuilder_1["default"](api);
        this.reportsBuilder = new reportsBuilder_1["default"](api);
        this.rulesBuilder = new rulesBuilder_1["default"](api);
        this.distributionListsBuilder = new distributionListsBuilder_1["default"](api);
        this.miscBuilder = new miscBuilder_1.MiscBuilder(api);
        this.waiting = new waiting_1["default"]();
    }
    Addin.prototype.combineDependencies = function () {
        var allDependencies = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            allDependencies[_i] = arguments[_i];
        }
        var total = {
            groups: [],
            reports: [],
            rules: [],
            devices: [],
            users: [],
            zoneTypes: [],
            zones: [],
            workTimes: [],
            workHolidays: [],
            securityGroups: [],
            diagnostics: [],
            customMaps: [],
            notificationTemplates: []
        };
        return Object.keys(total).reduce(function (dependencies, dependencyName) {
            dependencies[dependencyName] = utils_1.mergeUnique.apply(void 0, [dependencies[dependencyName]].concat(allDependencies.map(function (entityDependencies) { return entityDependencies[dependencyName]; })));
            return dependencies;
        }, total);
    };
    Addin.prototype.addNewGroups = function (groups, data) {
        if (!groups || !groups.length) {
            return utils_1.resolvedPromise();
        }
        var groupsData = this.groupsBuilder.getGroupsData(groups, true), newGroupsUsers = utils_1.getUniqueEntities(this.groupsBuilder.getPrivateGroupsUsers(groupsData), data.users);
        data.groups = utils_1.mergeUniqueEntities(data.groups, groupsData);
        data.users = utils_1.mergeUniqueEntities(data.users, newGroupsUsers);
        return this.resolveDependencies({ users: utils_1.getEntitiesIds(newGroupsUsers) }, data);
    };
    Addin.prototype.addNewCustomMaps = function (customMapsIds, data) {
        var _this = this;
        if (!customMapsIds || !customMapsIds.length) {
            return false;
        }
        var customMapsData = customMapsIds.reduce(function (data, customMapId) {
            var customMapData = _this.miscBuilder.getMapProviderData(customMapId);
            customMapData && data.push(customMapData);
            return data;
        }, []);
        data.customMaps = utils_1.mergeUniqueEntities(data.customMaps, customMapsData);
    };
    Addin.prototype.addNewNotificationTemplates = function (notificationTemplatesIds, data) {
        var _this = this;
        if (!notificationTemplatesIds || !notificationTemplatesIds.length) {
            return false;
        }
        var notificationTemplatesData = notificationTemplatesIds.reduce(function (data, templateId) {
            var templateData = _this.distributionListsBuilder.getNotificationTemplateData(templateId);
            templateData && data.push(templateData);
            return data;
        }, []);
        data.notificationTemplates = utils_1.mergeUniqueEntities(data.notificationTemplates, notificationTemplatesData);
    };
    Addin.prototype.getEntytiesIds = function (entities) {
        return entities.reduce(function (res, entity) {
            entity && entity.id && res.push(entity.id);
            return res;
        }, []);
    };
    Addin.prototype.getEntityDependencies = function (entity, entityType) {
        var entityDependencies = {};
        switch (entityType) {
            case "devices":
                entityDependencies.groups = this.getEntytiesIds(entity["groups"].concat(entity["autoGroups"]));
                entity["workTime"].id && (entityDependencies.workTimes = [entity["workTime"].id]);
                break;
            case "users":
                entityDependencies.groups = this.getEntytiesIds(entity["companyGroups"].concat(entity["driverGroups"]).concat(entity["privateUserGroups"]).concat(entity["reportGroups"]));
                entityDependencies.securityGroups = this.getEntytiesIds(entity["securityGroups"]);
                entityDependencies.customMaps = [entity["defaultMapEngine"]];
                break;
            case "zones":
                var zoneTypes = this.getEntytiesIds(entity["zoneTypes"]);
                zoneTypes.length && (entityDependencies.zoneTypes = zoneTypes);
                entityDependencies.groups = this.getEntytiesIds(entity["groups"]);
                break;
            case "workTimes":
                entity["holidayGroup"].groupId && (entityDependencies.workHolidays = [entity["holidayGroup"].groupId]);
                break;
            default:
                break;
        }
        return entityDependencies;
    };
    Addin.prototype.applyToEntities = function (entitiesList, initialValue, func) {
        var overallIndex = 0;
        return Object.keys(entitiesList).reduce(function (result, entityType, typeIndex) {
            return entitiesList[entityType].reduce(function (res, entity, index) {
                overallIndex++;
                return func(res, entity, entityType, index, typeIndex, overallIndex - 1);
            }, result);
        }, initialValue);
    };
    Addin.prototype.resolveDependencies = function (dependencies, data) {
        var _this = this;
        var getData = function (entitiesList) {
            var entityRequestTypes = {
                devices: "Device",
                users: "User",
                zoneTypes: "ZoneType",
                zones: "Zone",
                workTimes: "WorkTime",
                workHolidays: "WorkHoliday",
                securityGroups: "Group",
                diagnostics: "Diagnostic"
            }, requests = _this.applyToEntities(entitiesList, {}, function (result, entityId, entityType) {
                var request = {
                    typeName: entityRequestTypes[entityType],
                    search: {
                        id: entityId
                    }
                };
                if (entityRequestTypes[entityType]) {
                    if (entityType === "workHolidays" || entityType === "securityGroups") {
                        return result;
                    }
                    !result[entityType] && (result[entityType] = []);
                    result[entityType].push(["Get", request]);
                }
                return result;
            });
            if (entitiesList.securityGroups && entitiesList.securityGroups.length) {
                requests.securityGroups = [["Get", {
                            typeName: entityRequestTypes.securityGroups,
                            search: {
                                id: "GroupSecurityId"
                            }
                        }]];
            }
            if (entitiesList.workHolidays && entitiesList.workHolidays.length) {
                requests.workHolidays = [["Get", {
                            typeName: entityRequestTypes.workHolidays
                        }]];
            }
            return _this.addNewGroups(entitiesList.groups, data).then(function () {
                _this.addNewCustomMaps(entitiesList.customMaps, data);
                _this.addNewNotificationTemplates(entitiesList.notificationTemplates, data);
                delete entitiesList.groups;
                delete entitiesList.customMaps;
                return new Promise(function (resolve, reject) {
                    var requestEntities = Object.keys(requests), requestsArray = requestEntities.reduce(function (list, type) { return list.concat(requests[type]); }, []);
                    if (!requestEntities.length) {
                        return resolve(data);
                    }
                    _this.api.multiCall(requestsArray, function (response) {
                        var newGroups = [], newCustomMaps = [], newDependencies = {}, exportedData = _this.applyToEntities(requests, {}, function (result, request, entityType, entityIndex, entityTypeIndex, overallIndex) {
                            var items = requestsArray.length > 1 ? response[overallIndex] : response;
                            items.forEach(function (item) {
                                item = item[0] || item;
                                !result[entityType] && (result[entityType] = []);
                                if (entityType === "workHolidays" && (!item.holidayGroup || entitiesList.workHolidays.indexOf(item.holidayGroup.groupId) === -1)) {
                                    return false;
                                }
                                else if (entityType === "securityGroups") {
                                    if (entitiesList.securityGroups.indexOf(item.id) > -1) {
                                        result[entityType] = result[entityType].concat(_this.groupsBuilder.getCustomGroupsData(entitiesList.securityGroups, items));
                                        return result;
                                    }
                                    return false;
                                }
                                else if (entityType === "users") {
                                    item.userAuthenticationType = "BasicAuthentication";
                                }
                                var entityDependencies = _this.getEntityDependencies(item, entityType);
                                newDependencies = _this.applyToEntities(entityDependencies, newDependencies, function (result, entityId, entityType) {
                                    !result[entityType] && (result[entityType] = []);
                                    result[entityType] = utils_1.mergeUnique(result[entityType], [entityId]);
                                    return result;
                                });
                                newGroups = newGroups.concat(newDependencies.groups || []);
                                newCustomMaps = newCustomMaps.concat(newDependencies.customMaps || []);
                                delete newDependencies.groups;
                                delete newDependencies.customMaps;
                                result[entityType].push(item);
                            });
                            return result;
                        });
                        newDependencies = Object.keys(newDependencies).reduce(function (result, dependencyName) {
                            var entities = newDependencies[dependencyName], exported = (exportedData[dependencyName] || []).map(function (entity) { return entity.id; });
                            entities.forEach(function (entityId) {
                                if (exported.indexOf(entityId) === -1) {
                                    !result[dependencyName] && (result[dependencyName] = []);
                                    result[dependencyName].push(entityId);
                                }
                            });
                            return result;
                        }, {});
                        // Remove built-in security groups
                        exportedData.securityGroups && (exportedData.securityGroups = exportedData.securityGroups.reduce(function (result, group) {
                            group.id.indexOf("Group") === -1 && result.push(group);
                            return result;
                        }, []));
                        _this.addNewGroups(newGroups, data).then(function () {
                            _this.addNewCustomMaps(newCustomMaps, data);
                            Object.keys(exportedData).forEach(function (entityType) {
                                data[entityType] = utils_1.mergeUniqueEntities(data[entityType], exportedData[entityType]);
                            });
                            if (Object.keys(newDependencies).length) {
                                resolve(_this.resolveDependencies(newDependencies, data));
                            }
                            else {
                                resolve(data);
                            }
                        }, reject);
                    }, reject);
                });
            });
        };
        return new Promise(function (resolve, reject) {
            return getData(dependencies).then(resolve)["catch"](reject);
        });
    };
    Addin.prototype.abortCurrentTask = function () {
        this.toggleWaiting();
        this.currentTask && this.currentTask.abort && this.currentTask.abort();
        this.currentTask = null;
    };
    Addin.prototype.toggleExportButton = function (isDisabled) {
        this.exportBtn.disabled = isDisabled;
    };
    Addin.prototype.showEntityMessage = function (block, qty, entityName) {
        var blockEl = block.querySelector(".description");
        if (qty) {
            qty > 1 && (entityName += "s");
            var hasItemsMessageTemplate = document.getElementById("hasItemsMessageTemplate").innerHTML;
            blockEl.innerHTML = hasItemsMessageTemplate.replace("{quantity}", qty.toString()).replace("{entity}", entityName);
        }
        else {
            blockEl.innerHTML = "You have <span class=\"bold\">not configured any " + entityName + "s</span>.";
        }
    };
    Addin.prototype.render = function () {
        var _this = this;
        var mapMessageTemplate = document.getElementById("mapMessageTemplate").innerHTML, groupsBlock = document.getElementById("exportedGroups"), securityClearancesBlock = document.getElementById("exportedSecurityClearances"), rulesBlock = document.getElementById("exportedRules"), reportsBlock = document.getElementById("exportedReports"), dashboardsBlock = document.getElementById("exportedDashboards"), addinsBlock = document.getElementById("exportedAddins"), thisAddinBlock = document.getElementById("includeThisAddin"), thisAddinIncludedCheckbox = document.querySelector("#includeThisAddin > input"), mapBlockDescription = document.querySelector("#exportedMap > .description");
        this.exportBtn.addEventListener("click", this.exportData, false);
        thisAddinIncludedCheckbox.addEventListener("change", this.toggleThisAddinIncluded, false);
        this.toggleWaiting(true);
        return utils_1.together([
            this.groupsBuilder.fetch(),
            this.securityClearancesBuilder.fetch(),
            this.reportsBuilder.fetch(),
            this.rulesBuilder.fetch(),
            this.distributionListsBuilder.fetch(),
            this.miscBuilder.fetch()
        ]).then(function (results) {
            var reportsDependencies, rulesDependencies, distributionListsDependencies, dependencies, customMap;
            _this.data.groups = results[0];
            _this.data.securityGroups = results[1];
            _this.data.reports = results[2];
            _this.data.rules = results[3];
            _this.data.distributionLists = _this.distributionListsBuilder.getRulesDistributionLists(_this.data.rules.map(function (rule) { return rule.id; }));
            _this.data.misc = results[5];
            customMap = _this.miscBuilder.getMapProviderData(_this.data.misc.mapProvider.value);
            customMap && _this.data.customMaps.push(customMap);
            reportsDependencies = _this.reportsBuilder.getDependencies(_this.data.reports);
            rulesDependencies = _this.rulesBuilder.getDependencies(_this.data.rules);
            distributionListsDependencies = _this.distributionListsBuilder.getDependencies(_this.data.distributionLists);
            dependencies = _this.combineDependencies(reportsDependencies, rulesDependencies, distributionListsDependencies);
            return _this.resolveDependencies(dependencies, _this.data);
        }).then(function () {
            var mapProvider = _this.miscBuilder.getMapProviderName(_this.data.misc.mapProvider.value);
            _this.showEntityMessage(groupsBlock, _this.data.groups.length - 1, "group");
            _this.showEntityMessage(securityClearancesBlock, _this.data.securityGroups.length, "security clearance");
            _this.showEntityMessage(rulesBlock, _this.data.rules.length, "rule");
            _this.showEntityMessage(reportsBlock, _this.reportsBuilder.getCustomizedReportsQty(), "report");
            _this.showEntityMessage(dashboardsBlock, _this.reportsBuilder.getDashboardsQty(), "dashboard");
            mapProvider && (mapBlockDescription.innerHTML = mapMessageTemplate.replace("{mapProvider}", mapProvider));
            _this.showEntityMessage(addinsBlock, _this.data.misc.addins.length, "addin");
            _this.miscBuilder.isThisAddinIncluded() && thisAddinBlock.classList.remove("hidden");
            console.log(_this.data);
        })["catch"](function (e) {
            console.error(e);
            alert("Can't get config to export");
        })["finally"](function () { return _this.toggleWaiting(); });
    };
    Addin.prototype.unload = function () {
        this.abortCurrentTask();
        this.groupsBuilder.unload();
        this.securityClearancesBuilder.unload();
        this.reportsBuilder.unload();
        this.rulesBuilder.unload();
        this.distributionListsBuilder.unload();
        this.miscBuilder.unload();
        this.exportBtn.removeEventListener("click", this.exportData, false);
    };
    return Addin;
}());
geotab.addin.registrationConfig = function () {
    var addin;
    return {
        initialize: function (api, state, callback) {
            addin = new Addin(api);
            callback();
        },
        focus: function () {
            addin.render();
        },
        blur: function () {
            addin.unload();
        }
    };
};
},{"./distributionListsBuilder":2,"./groupsBuilder":3,"./miscBuilder":4,"./reportsBuilder":5,"./rulesBuilder":6,"./securityClearancesBuilder":7,"./utils":8,"./waiting":9}],2:[function(require,module,exports){
"use strict";
exports.__esModule = true;
/// <reference path="../bluebird.d.ts"/>
var utils_1 = require("./utils");
var DistributionListsBuilder = /** @class */ (function () {
    function DistributionListsBuilder(api) {
        this.api = api;
    }
    DistributionListsBuilder.prototype.getDistributionListsData = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.api.multiCall([
                ["Get", {
                        "typeName": "DistributionList"
                    }],
                ["GetNotificationWebRequestTemplates", {}],
                ["GetNotificationEmailTemplates", {}],
                ["GetNotificationTextTemplates", {}]
            ], resolve, reject);
        });
    };
    ;
    DistributionListsBuilder.prototype.abortCurrentTask = function () {
        this.currentTask && this.currentTask.abort && this.currentTask.abort();
        this.currentTask = null;
    };
    ;
    DistributionListsBuilder.prototype.getDependencies = function (distributionLists) {
        var dependencies = {
            rules: [],
            users: [],
            groups: [],
            notificationTemplates: []
        }, processDependencies = function (recipient) {
            var id, type, userId = recipient.user.id;
            userId && dependencies.users.indexOf(userId) === -1 && dependencies.users.push(userId);
            switch (recipient.recipientType) {
                case "Email":
                case "LogPopup":
                case "LogUrgentPopup":
                case "LogOnly":
                case "TextMessage":
                case "TextToSpeechAllowDelay":
                case "WebRequest":
                case "TextToSpeech":
                    id = recipient.notificationBinaryFile && recipient.notificationBinaryFile.id;
                    type = "notificationTemplates";
                    break;
                case "AssignToGroup":
                    id = recipient.group && recipient.group.id;
                    type = "groups";
                    break;
            }
            id && type && dependencies[type].indexOf(id) === -1 && dependencies[type].push(id);
        }, checkRecipients = function (recipients, dependencies) {
            return recipients.reduce(function (dependencies, recipient) {
                processDependencies(recipient);
                return dependencies;
            }, dependencies);
        };
        return distributionLists.reduce(function (dependencies, distributionList) {
            dependencies.rules = utils_1.mergeUnique(dependencies.rules, distributionList.rules.map(function (rule) { return rule.id; }));
            dependencies = checkRecipients(distributionList.recipients, dependencies);
            return dependencies;
        }, dependencies);
    };
    ;
    DistributionListsBuilder.prototype.fetch = function () {
        var _this = this;
        this.abortCurrentTask();
        this.currentTask = this.getDistributionListsData()
            .then(function (_a) {
            var distributionLists = _a[0], webTemplates = _a[1], emailTemplates = _a[2], textTemplates = _a[3];
            _this.distributionLists = utils_1.entityToDictionary(distributionLists);
            _this.notificationTemplates = utils_1.entityToDictionary(webTemplates.concat(emailTemplates).concat(textTemplates));
            return _this.distributionLists;
        })["catch"](console.error)["finally"](function () {
            _this.currentTask = null;
        });
        return this.currentTask;
    };
    ;
    DistributionListsBuilder.prototype.getNotificationTemplateData = function (templateId) {
        return this.notificationTemplates[templateId];
    };
    ;
    DistributionListsBuilder.prototype.getRulesDistributionLists = function (rulesIds) {
        var _this = this;
        return Object.keys(this.distributionLists).reduce(function (res, id) {
            var list = _this.distributionLists[id];
            list.rules.some(function (listRule) { return rulesIds.indexOf(listRule.id) > -1; }) && res.push(list);
            return res;
        }, []);
    };
    ;
    DistributionListsBuilder.prototype.unload = function () {
        this.abortCurrentTask();
    };
    ;
    return DistributionListsBuilder;
}());
exports["default"] = DistributionListsBuilder;
},{"./utils":8}],3:[function(require,module,exports){
"use strict";
exports.__esModule = true;
/// <reference path="../bluebird.d.ts"/>
var Utils = require("./utils");
var GroupsBuilder = /** @class */ (function () {
    function GroupsBuilder(api) {
        this.api = api;
    }
    GroupsBuilder.prototype.getGroups = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.api.getSession(function (sessionData) {
                _this.currentUserName = sessionData.userName;
                _this.api.multiCall([
                    ["Get", {
                            typeName: "Group"
                        }],
                    ["Get", {
                            typeName: "User"
                        }]
                ], resolve, reject);
            });
        });
    };
    ;
    GroupsBuilder.prototype.findChild = function (childId, currentItem, onAllLevels) {
        var _this = this;
        if (onAllLevels === void 0) { onAllLevels = false; }
        var foundChild = null, children = currentItem.children;
        if (!childId || !children || !children.length) {
            return null;
        }
        children.some(function (child) {
            if (child.id === childId) {
                foundChild = child;
                return foundChild;
            }
            else {
                if (onAllLevels) {
                    foundChild = _this.findChild(childId, child, onAllLevels);
                    return foundChild;
                }
                else {
                    return false;
                }
            }
        });
        return foundChild;
    };
    ;
    GroupsBuilder.prototype.getUserByPrivateGroupId = function (groupId) {
        var outputUser = null, userHasPrivateGroup = function (user, groupId) {
            return user.privateUserGroups.some(function (group) {
                if (group.id === groupId) {
                    return true;
                }
            });
        };
        this.users.some(function (user) {
            if (userHasPrivateGroup(user, groupId)) {
                outputUser = user;
                return true;
            }
        });
        return outputUser;
    };
    ;
    GroupsBuilder.prototype.getPrivateGroupData = function (groupId) {
        return {
            id: groupId,
            user: this.getUserByPrivateGroupId(groupId),
            children: [],
            name: "PrivateUserGroupName",
            parent: {
                id: "GroupPrivateUserId",
                children: [{ id: groupId }]
            }
        };
    };
    ;
    GroupsBuilder.prototype.createGroupsTree = function (groups) {
        var nodeLookup, traverseChildren = function (node) {
            var children, id;
            children = node.children;
            if (children) {
                for (var i = 0, ii = children.length; i < ii; i += 1) {
                    id = children[i].id;
                    if (nodeLookup[id]) {
                        node.children[i] = nodeLookup[id];
                        node.children[i].parent = node;
                        delete nodeLookup[id];
                    }
                    traverseChildren(node.children[i]);
                }
            }
        };
        nodeLookup = Utils.entityToDictionary(groups, function (entity) {
            var newEntity = Utils.extend({}, entity);
            if (newEntity.children) {
                newEntity.children = newEntity.children.slice();
            }
            return newEntity;
        });
        Object.keys(nodeLookup).forEach(function (key) {
            nodeLookup[key] && traverseChildren(nodeLookup[key]);
        });
        return Object.keys(nodeLookup).map(function (key) {
            return nodeLookup[key];
        });
    };
    ;
    GroupsBuilder.prototype.abortCurrentTask = function () {
        this.currentTask && this.currentTask.abort && this.currentTask.abort();
        this.currentTask = null;
    };
    ;
    GroupsBuilder.prototype.fetch = function () {
        var _this = this;
        this.abortCurrentTask();
        this.currentTask = this.getGroups()
            .then(function (_a) {
            var groups = _a[0], users = _a[1];
            _this.groups = groups;
            _this.users = users;
            _this.tree = _this.createGroupsTree(groups);
            _this.currentTree = Utils.extend({}, _this.tree);
            return _this.createFlatGroupsList(_this.tree);
        })["catch"](console.error)["finally"](function () {
            _this.currentTask = null;
        });
        return this.currentTask;
    };
    ;
    GroupsBuilder.prototype.createFlatGroupsList = function (groups, notIncludeChildren) {
        if (notIncludeChildren === void 0) { notIncludeChildren = false; }
        var foundIds = [], groupsToAdd = [], makeFlatParents = function (item) {
            var itemCopy = Utils.extend({}, item);
            if (item && item.parent) {
                makeFlatParents(item.parent);
            }
            itemCopy.children = itemCopy.children.map(function (child) { return child.id; });
            itemCopy.parent = item.parent ? { id: item.parent.id, name: item.parent.name } : null;
            if (foundIds.indexOf(item.id) === -1) {
                groupsToAdd.push(itemCopy);
                foundIds.push(item.id);
            }
        }, makeFlatChildren = function (item) {
            if (item && item.children && item.children.length) {
                item.children.forEach(function (child) {
                    var childCopy;
                    if (foundIds.indexOf(child.id) === -1) {
                        makeFlatChildren(child);
                    }
                    childCopy = Utils.extend({}, child);
                    childCopy.children = childCopy.children.map(function (childInner) { return childInner.id; });
                    childCopy.parent = childCopy.parent ? { id: childCopy.parent.id, name: childCopy.parent.name } : null;
                    if (foundIds.indexOf(child.id) === -1) {
                        groupsToAdd.push(childCopy);
                        foundIds.push(child.id);
                    }
                });
            }
        };
        groups.forEach(makeFlatParents);
        !notIncludeChildren && groups.forEach(makeFlatChildren);
        return groupsToAdd;
    };
    ;
    GroupsBuilder.prototype.getGroupsData = function (groupIds, notIncludeChildren) {
        var _this = this;
        if (notIncludeChildren === void 0) { notIncludeChildren = false; }
        var treeGroups = groupIds.map(function (groupId) {
            return _this.findChild(groupId, { id: null, children: _this.tree }, true) || _this.getPrivateGroupData(groupId);
        });
        return this.createFlatGroupsList(treeGroups, notIncludeChildren);
    };
    ;
    GroupsBuilder.prototype.getCustomGroupsData = function (groupIds, allGroups) {
        var _this = this;
        var groupsTree = this.createGroupsTree(allGroups), treeGroups = groupIds.map(function (groupId) {
            return _this.findChild(groupId, { id: null, children: groupsTree }, true) || _this.getPrivateGroupData(groupId);
        });
        return this.createFlatGroupsList(treeGroups, true);
    };
    ;
    GroupsBuilder.prototype.getPrivateGroupsUsers = function (groups) {
        var _this = this;
        return groups.reduce(function (users, group) {
            group.user && group.user.name !== _this.currentUserName && users.push(group.user);
            return users;
        }, []);
    };
    ;
    GroupsBuilder.prototype.unload = function () {
        this.abortCurrentTask();
    };
    ;
    return GroupsBuilder;
}());
exports["default"] = GroupsBuilder;
},{"./utils":8}],4:[function(require,module,exports){
"use strict";
exports.__esModule = true;
var utils_1 = require("./utils");
var MiscBuilder = /** @class */ (function () {
    function MiscBuilder(api) {
        this.defaultMapProviders = {
            GoogleMaps: "Google Maps",
            Here: "HERE Maps",
            MapBox: "MapBox"
        };
        this.api = api;
    }
    MiscBuilder.prototype.abortCurrentTask = function () {
        this.currentTask && this.currentTask.abort && this.currentTask.abort();
        this.currentTask = null;
    };
    MiscBuilder.prototype.getAllowedAddins = function (allAddins) {
        return allAddins.filter(function (addin) {
            var addinConfig = JSON.parse(addin);
            return addinConfig && Array.isArray(addinConfig.items) && addinConfig.items.every(function (item) {
                var url = item.url;
                return url && url.indexOf("\/\/") > -1;
            });
        });
    };
    MiscBuilder.prototype.isCurrentAddin = function (addin) {
        return addin.indexOf("Registration config") > -1;
    };
    MiscBuilder.prototype.fetch = function () {
        var _this = this;
        this.abortCurrentTask();
        this.currentTask = new Promise(function (resolve, reject) {
            _this.api.getSession(function (sessionData) {
                var userName = sessionData.userName;
                _this.api.multiCall([
                    ["Get", {
                            typeName: "User",
                            search: {
                                name: userName
                            }
                        }],
                    ["Get", {
                            typeName: "SystemSettings"
                        }]
                ], resolve, reject);
            });
        }).then(function (result) {
            var currentUser = result[0][0] || result[0], systemSettings = result[1][0] || result[1], userMapProviderId = currentUser.defaultMapEngine, defaultMapProviderId = systemSettings.mapProvider, mapProviderId = _this.getMapProviderType(userMapProviderId) === "custom" ? userMapProviderId : defaultMapProviderId;
            _this.currentUser = currentUser;
            _this.customMapProviders = utils_1.entityToDictionary(systemSettings.customWebMapProviderList);
            _this.isUnsignedAddinsAllowed = systemSettings.allowUnsignedAddIn;
            _this.addins = _this.getAllowedAddins(systemSettings.customerPages);
            return {
                mapProvider: {
                    value: mapProviderId,
                    type: _this.getMapProviderType(mapProviderId)
                },
                currentUser: _this.currentUser,
                isUnsignedAddinsAllowed: _this.isUnsignedAddinsAllowed,
                addins: _this.addins
            };
        });
        return this.currentTask;
    };
    MiscBuilder.prototype.getMapProviderType = function (mapProviderId) {
        return this.defaultMapProviders[mapProviderId] ? "default" : "custom";
    };
    MiscBuilder.prototype.getMapProviderName = function (mapProviderId) {
        return mapProviderId && (this.defaultMapProviders[mapProviderId] || (this.customMapProviders[mapProviderId] && this.customMapProviders[mapProviderId].name) || mapProviderId);
    };
    MiscBuilder.prototype.getMapProviderData = function (mapProviderId) {
        return mapProviderId && this.customMapProviders[mapProviderId];
    };
    MiscBuilder.prototype.isThisAddinIncluded = function () {
        return this.addins.some(this.isCurrentAddin);
    };
    MiscBuilder.prototype.getAddinsData = function (includeThisAddin) {
        var _this = this;
        if (includeThisAddin === void 0) { includeThisAddin = true; }
        return !includeThisAddin ? this.addins.filter(function (addin) { return !_this.isCurrentAddin(addin); }) : this.addins;
    };
    MiscBuilder.prototype.unload = function () {
        this.abortCurrentTask();
    };
    return MiscBuilder;
}());
exports.MiscBuilder = MiscBuilder;
},{"./utils":8}],5:[function(require,module,exports){
"use strict";
exports.__esModule = true;
/// <reference path="../bluebird.d.ts"/>
var Utils = require("./utils");
var REPORT_TYPE_DASHBOAD = "Dashboard";
var ReportsBuilder = /** @class */ (function () {
    function ReportsBuilder(api) {
        this.api = api;
    }
    ReportsBuilder.prototype.getReports = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.api.multiCall([
                ["GetReportSchedules", {
                        "includeTemplateDetails": true,
                        "applyUserFilter": false
                    }],
                ["Get", {
                        "typeName": "ReportTemplate",
                        "search": {
                            includeBinaryData: false
                        }
                    }],
                ["GetDashboardItems", {}]
            ], resolve, reject);
        });
    };
    ReportsBuilder.prototype.structureReports = function (reports, templates) {
        var findTemplateReports = function (templateId) {
            return reports.filter(function (report) { return report.template.id === templateId; });
        };
        return templates.reduce(function (res, template) {
            var templateId = template.id, templateReports = findTemplateReports(templateId);
            if (templateReports.length) {
                template.reports = templateReports;
                res.push(template);
            }
            return res;
        }, []);
    };
    ReportsBuilder.prototype.abortCurrentTask = function () {
        this.currentTask && this.currentTask.abort && this.currentTask.abort();
        this.currentTask = null;
    };
    ReportsBuilder.prototype.updateTemplate = function (newTemplateData) {
        var _this = this;
        this.allTemplates.some(function (templateData, index) {
            if (templateData.id === newTemplateData.id) {
                _this.allTemplates[index] = newTemplateData;
                return true;
            }
            return false;
        });
    };
    ReportsBuilder.prototype.fetch = function () {
        var _this = this;
        this.abortCurrentTask();
        this.currentTask = this.getReports()
            .then(function (_a) {
            var reports = _a[0], templates = _a[1], dashboardItems = _a[2];
            _this.allReports = reports;
            _this.allTemplates = templates;
            _this.dashboardsLength = dashboardItems && dashboardItems.length ? dashboardItems.length : 0;
            _this.structuredReports = _this.structureReports(reports, templates);
            return _this.structuredReports;
        })["catch"](console.error)["finally"](function () {
            _this.currentTask = null;
        });
        return this.currentTask;
    };
    ReportsBuilder.prototype.getDependencies = function (reports) {
        var allDependencies = {
            devices: [],
            rules: [],
            zoneTypes: [],
            groups: []
        };
        return reports.reduce(function (reportsDependencies, template) {
            return template.reports.reduce(function (templateDependecies, report) {
                templateDependecies.groups = Utils.mergeUnique(templateDependecies.groups, Utils.getEntitiesIds(report.groups), Utils.getEntitiesIds(report.includeAllChildrenGroups), Utils.getEntitiesIds(report.includeDirectChildrenOnlyGroups), Utils.getEntitiesIds(report.scopeGroups));
                templateDependecies.devices = Utils.mergeUnique(templateDependecies.devices, report.arguments && report.arguments.devices && Utils.getEntitiesIds(report.arguments.devices) || []);
                templateDependecies.rules = Utils.mergeUnique(templateDependecies.rules, report.arguments && report.arguments.rules && Utils.getEntitiesIds(report.arguments.rules) || []);
                templateDependecies.zoneTypes = Utils.mergeUnique(templateDependecies.zoneTypes, report.arguments && report.arguments.zoneTypeList && Utils.getEntitiesIds(report.arguments.zoneTypeList) || []);
                return templateDependecies;
            }, reportsDependencies);
        }, allDependencies);
    };
    ReportsBuilder.prototype.getData = function () {
        var _this = this;
        var portionSize = 15, portions = this.allTemplates.reduce(function (requests, template) {
            if (!template.isSystem && !template.binaryData) {
                var portionIndex = requests.length - 1;
                if (!requests[portionIndex] || requests[portionIndex].length >= portionSize) {
                    requests.push([]);
                    portionIndex++;
                }
                requests[portionIndex].push(["Get", {
                        "typeName": "ReportTemplate",
                        "search": {
                            id: template.id,
                            includeBinaryData: true
                        }
                    }]);
            }
            return requests;
        }, []), totalResults = [], getPortionData = function (portion) {
            return new Promise(function (resolve, reject) {
                _this.api.multiCall(portion, resolve, reject);
            });
        }, errorPortions = [];
        this.abortCurrentTask();
        this.currentTask = portions.reduce(function (promises, portion) {
            return promises
                .then(function () { return getPortionData(portion); })
                .then(function (result) {
                totalResults = totalResults.concat(result);
            }, function (e) {
                errorPortions = errorPortions.concat(portion);
                console.error(e);
            });
        }, Utils.resolvedPromise([]))
            .then(function () {
            errorPortions.length && console.warn(errorPortions);
            totalResults.forEach(function (templateData) {
                var template = templateData.length ? templateData[0] : templateData;
                _this.updateTemplate(template);
            });
            _this.structuredReports = _this.structureReports(_this.allReports, _this.allTemplates);
            return _this.structuredReports;
        })["catch"](console.error)["finally"](function () {
            _this.currentTask = null;
        });
        return this.currentTask;
    };
    ReportsBuilder.prototype.getDashboardsQty = function () {
        return this.dashboardsLength;
    };
    ReportsBuilder.prototype.getCustomizedReportsQty = function () {
        var templates = [];
        return (this.allReports.filter(function (report) {
            var templateId = report.template.id, templateExists = templates.indexOf(templateId) > -1, isCount = !templateExists && report.lastModifiedUser !== "NoUserId";
            isCount && templates.push(templateId);
            return isCount;
        })).length;
    };
    ReportsBuilder.prototype.unload = function () {
        this.abortCurrentTask();
    };
    return ReportsBuilder;
}());
exports["default"] = ReportsBuilder;
},{"./utils":8}],6:[function(require,module,exports){
"use strict";
exports.__esModule = true;
/// <reference path="../bluebird.d.ts"/>
var utils_1 = require("./utils");
var APPLICATION_RULE_ID = "RuleApplicationExceptionId";
var RulesBuilder = /** @class */ (function () {
    function RulesBuilder(api) {
        this.api = api;
    }
    RulesBuilder.prototype.getRules = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.api.call("Get", {
                "typeName": "Rule"
            }, resolve, reject);
        });
    };
    RulesBuilder.prototype.structureRules = function (rules) {
        return utils_1.sortArrayOfEntities(rules, [["baseType", "desc"], "name"]);
    };
    RulesBuilder.prototype.abortCurrentTask = function () {
        this.currentTask && this.currentTask.abort && this.currentTask.abort();
        this.currentTask = null;
    };
    RulesBuilder.prototype.getDependencies = function (rules) {
        var dependencies = {
            devices: [],
            users: [],
            zones: [],
            zoneTypes: [],
            workTimes: [],
            groups: [],
            diagnostics: []
        }, processDependencies = function (condition) {
            var id, type;
            switch (condition.conditionType) {
                case "RuleWorkHours":
                case "AfterRuleWorkHours":
                    id = (condition.workTime && condition.workTime.id) || condition.workTime;
                    type = "workTimes";
                    break;
                case "Driver":
                    id = condition.driver && condition.driver.id;
                    type = "users";
                    break;
                case "Device":
                    id = condition.device && condition.device.id;
                    type = "devices";
                    break;
                case "EnteringArea":
                case "ExitingArea":
                case "OutsideArea":
                case "InsideArea":
                    if (condition.zone) {
                        id = condition.zone.id || condition.zone;
                        type = "zones";
                    }
                    else {
                        id = condition.zoneType.id;
                        type = "zoneTypes";
                    }
                    break;
                case "FilterStatusDataByDiagnostic":
                case "ActiveOrInactiveFault":
                case "Fault":
                    if (condition.diagnostic) {
                        id = condition.diagnostic.id || condition.diagnostic;
                        type = "diagnostics";
                    }
                    break;
                default:
                    break;
            }
            id && type && dependencies[type].indexOf(id) === -1 && dependencies[type].push(id);
        }, checkConditions = function (parentCondition, dependencies) {
            var conditions = parentCondition.children || [];
            processDependencies(parentCondition);
            return conditions.reduce(function (dependencies, condition) {
                if (condition.children) {
                    dependencies = checkConditions(condition, dependencies);
                }
                processDependencies(condition);
                return dependencies;
            }, dependencies);
        };
        return rules.reduce(function (dependencies, rule) {
            dependencies.groups = utils_1.mergeUnique(dependencies.groups, rule.groups.map(function (group) { return group.id; }));
            dependencies = checkConditions(rule.condition, dependencies);
            return dependencies;
        }, dependencies);
    };
    RulesBuilder.prototype.fetch = function () {
        var _this = this;
        this.abortCurrentTask();
        this.currentTask = this.getRules()
            .then(function (switchedOnRules) {
            _this.combinedRules = utils_1.entityToDictionary(switchedOnRules);
            delete (_this.combinedRules[APPLICATION_RULE_ID]);
            _this.structuredRules = _this.structureRules(Object.keys(_this.combinedRules).map(function (key) { return _this.combinedRules[key]; }));
            return Object.keys(_this.combinedRules).map(function (ruleId) { return _this.combinedRules[ruleId]; });
        })["catch"](console.error)["finally"](function () {
            _this.currentTask = null;
        });
        return this.currentTask;
    };
    RulesBuilder.prototype.getRulesData = function (rulesIds) {
        var _this = this;
        return rulesIds.map(function (ruleId) { return _this.combinedRules[ruleId]; });
    };
    RulesBuilder.prototype.unload = function () {
        this.abortCurrentTask();
    };
    return RulesBuilder;
}());
exports["default"] = RulesBuilder;
},{"./utils":8}],7:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
/// <reference path="../bluebird.d.ts"/>
var groupsBuilder_1 = require("./groupsBuilder");
var Utils = require("./utils");
var SecurityClearancesBuilder = /** @class */ (function (_super) {
    __extends(SecurityClearancesBuilder, _super);
    function SecurityClearancesBuilder(api) {
        return _super.call(this, api) || this;
    }
    SecurityClearancesBuilder.prototype.getSecurityGroups = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.api.getSession(function (sessionData) {
                _this.api.call("Get", {
                    typeName: "Group",
                    search: {
                        id: "GroupSecurityId"
                    }
                }, resolve, reject);
            });
        });
    };
    ;
    SecurityClearancesBuilder.prototype.fetch = function () {
        var _this = this;
        this.abortCurrentTask();
        this.currentTask = this.getSecurityGroups()
            .then(function (groups) {
            _this.groups = groups;
            _this.tree = _this.createGroupsTree(groups);
            _this.currentTree = Utils.extend({}, _this.tree);
            return _this.createFlatGroupsList(_this.tree).filter(function (group) { return !!group.name; });
        })["catch"](console.error)["finally"](function () {
            _this.currentTask = null;
        });
        return this.currentTask;
    };
    ;
    return SecurityClearancesBuilder;
}(groupsBuilder_1["default"]));
exports["default"] = SecurityClearancesBuilder;
},{"./groupsBuilder":3,"./utils":8}],8:[function(require,module,exports){
"use strict";
exports.__esModule = true;
/// <reference path="../bluebird.d.ts"/>
var classNameCtrl = function (el) {
    var param = typeof el.className === "string" ? "className" : "baseVal";
    return {
        get: function () {
            return el[param] || "";
        },
        set: function (text) {
            el[param] = text;
        }
    };
}, isUsualObject = function (obj) {
    return Object.prototype.toString.call(obj).indexOf("Object") !== -1;
};
function removeClass(el, name) {
    if (!el) {
        return;
    }
    var classesStr = classNameCtrl(el).get(), classes = classesStr.split(" "), newClasses = classes.filter(function (classItem) { return classItem !== name; });
    classNameCtrl(el).set(newClasses.join(" "));
}
exports.removeClass = removeClass;
function addClass(el, name) {
    if (!el) {
        return;
    }
    var classesStr = classNameCtrl(el).get(), classes = classesStr.split(" ");
    if (classes.indexOf(name) === -1) {
        classNameCtrl(el).set(classesStr + " " + name);
    }
}
exports.addClass = addClass;
function hasClass(el, className) {
    return el && classNameCtrl(el).get().indexOf(className) !== -1;
}
exports.hasClass = hasClass;
function extend() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    var length = args.length, src, srcKeys, srcAttr, fullCopy = false, resAttr, res = args[0], i = 1, j;
    if (typeof res === "boolean") {
        fullCopy = res;
        res = args[1];
        i++;
    }
    while (i !== length) {
        src = args[i];
        srcKeys = Object.keys(src);
        for (j = 0; j < srcKeys.length; j++) {
            srcAttr = src[srcKeys[j]];
            if (fullCopy && (isUsualObject(srcAttr) || Array.isArray(srcAttr))) {
                resAttr = res[srcKeys[j]];
                resAttr = res[srcKeys[j]] = (isUsualObject(resAttr) || Array.isArray(resAttr)) ? resAttr : (Array.isArray(srcAttr) ? [] : {});
                extend(fullCopy, resAttr, srcAttr);
            }
            else {
                res[srcKeys[j]] = src[srcKeys[j]];
            }
        }
        i++;
    }
    return res;
}
exports.extend = extend;
function entityToDictionary(entities, entityCallback) {
    var entity, o = {}, i, l = entities.length;
    for (i = 0; i < l; i++) {
        if (entities[i]) {
            entity = entities[i].id ? entities[i] : { id: entities[i] };
            o[entity.id] = entityCallback ? entityCallback(entity) : entity;
        }
    }
    return o;
}
exports.entityToDictionary = entityToDictionary;
function sortArrayOfEntities(entities, sortingFields) {
    var comparator = function (prevItem, nextItem, properties, index) {
        if (index === void 0) { index = 0; }
        if (properties.length <= index) {
            return 0;
        }
        var options = properties[index], _a = Array.isArray(options) ? options : [options], property = _a[0], _b = _a[1], dir = _b === void 0 ? "asc" : _b, dirMultiplier;
        dirMultiplier = dir === "asc" ? 1 : -1;
        if (prevItem[property] > nextItem[property]) {
            return 1 * dirMultiplier;
        }
        else if (prevItem[property] < nextItem[property]) {
            return -1 * dirMultiplier;
        }
        else {
            return comparator(prevItem, nextItem, properties, index + 1);
        }
    };
    return entities.sort(function (prevTemplate, nextTemplate) {
        return comparator(prevTemplate, nextTemplate, sortingFields);
    });
}
exports.sortArrayOfEntities = sortArrayOfEntities;
function downloadDataAsFile(data, filename, mimeType) {
    if (mimeType === void 0) { mimeType = "text/json"; }
    var blob = new Blob([data], { type: mimeType }), elem;
    if (window.navigator.msSaveOrOpenBlob) {
        window.navigator.msSaveBlob(blob, filename);
    }
    else {
        elem = window.document.createElement("a");
        elem.href = window.URL.createObjectURL(blob);
        elem.download = filename;
        document.body.appendChild(elem);
        elem.click();
        document.body.removeChild(elem);
    }
}
exports.downloadDataAsFile = downloadDataAsFile;
function mergeUniqueEntities() {
    var sources = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        sources[_i] = arguments[_i];
    }
    var addedIds = [], mergedItems = [];
    sources.forEach(function (source) { return source.forEach(function (item) {
        if (item && item.id && addedIds.indexOf(item.id) === -1) {
            addedIds.push(item.id);
            mergedItems.push(item);
        }
    }); });
    return mergedItems;
}
exports.mergeUniqueEntities = mergeUniqueEntities;
function getEntitiesIds(entitiesList) {
    return Array.isArray(entitiesList) && entitiesList.reduce(function (result, entity) {
        entity && entity.id && result.push(entity.id);
        return result;
    }, []) || [];
}
exports.getEntitiesIds = getEntitiesIds;
function mergeUnique() {
    var sources = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        sources[_i] = arguments[_i];
    }
    var mergedItems = [];
    sources.forEach(function (source) {
        Array.isArray(source) && source.forEach(function (item) {
            item && mergedItems.indexOf(item) === -1 && mergedItems.push(item);
        });
    });
    return mergedItems;
}
exports.mergeUnique = mergeUnique;
function getUniqueEntities(newEntities, existedEntities) {
    var selectedEntitiesHash = entityToDictionary(existedEntities);
    return newEntities.reduce(function (res, entity) {
        !selectedEntitiesHash[entity.id] && res.push(entity);
        return res;
    }, []);
}
exports.getUniqueEntities = getUniqueEntities;
function together(promises) {
    var results = [], resultsCount = 0;
    results.length = promises.length;
    return new Promise(function (resolve, reject) {
        var resolveAll = function () {
            return resolve(results);
        };
        promises.length ? promises.forEach(function (promise, index) {
            promise.then(function (result) {
                resultsCount++;
                results[index] = result;
                resultsCount === promises.length && resolveAll();
            })["catch"](function (error) {
                reject({
                    error: error,
                    promiseIndex: index
                });
            });
        }) : resolveAll();
    });
}
exports.together = together;
function resolvedPromise(val) {
    return new Promise(function (resolve) { return resolve(val); });
}
exports.resolvedPromise = resolvedPromise;
function toArray(data) {
    return Array.isArray(data) ? data : [data];
}
exports.toArray = toArray;
},{}],9:[function(require,module,exports){
"use strict";
exports.__esModule = true;
var Waiting = /** @class */ (function () {
    function Waiting() {
        this.bodyEl = document.body;
    }
    Waiting.prototype.start = function (el, zIndex) {
        if (el === void 0) { el = this.bodyEl; }
        if (el.offsetParent === null) {
            return false;
        }
        this.waitingContainer = document.createElement("div");
        this.waitingContainer.className = "waiting";
        this.waitingContainer.innerHTML = "<div class='fader'></div><div class='spinner'></div>";
        el.parentNode.appendChild(this.waitingContainer);
        this.waitingContainer.style.position = "absolute";
        this.waitingContainer.style.width = el.offsetWidth + "px";
        this.waitingContainer.style.height = el.offsetHeight + "px";
        this.waitingContainer.style.top = el.offsetTop + "px";
        this.waitingContainer.style.left = el.offsetLeft + "px";
        this.waitingContainer.style.display = "block";
        typeof zIndex === "number" && (this.waitingContainer.style.zIndex = zIndex.toString());
    };
    ;
    Waiting.prototype.stop = function () {
        if (this.waitingContainer && this.waitingContainer.parentNode) {
            this.waitingContainer.parentNode.removeChild(this.waitingContainer);
        }
    };
    ;
    return Waiting;
}());
exports["default"] = Waiting;
},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzb3VyY2VzL2FkZGluLnRzIiwic291cmNlcy9kaXN0cmlidXRpb25MaXN0c0J1aWxkZXIudHMiLCJzb3VyY2VzL2dyb3Vwc0J1aWxkZXIudHMiLCJzb3VyY2VzL21pc2NCdWlsZGVyLnRzIiwic291cmNlcy9yZXBvcnRzQnVpbGRlci50cyIsInNvdXJjZXMvcnVsZXNCdWlsZGVyLnRzIiwic291cmNlcy9zZWN1cml0eUNsZWFyYW5jZXNCdWlsZGVyLnRzIiwic291cmNlcy91dGlscy50cyIsInNvdXJjZXMvd2FpdGluZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O0FDQUEsaURBQTRDO0FBQzVDLHlFQUFvRTtBQUNwRSxtREFBOEM7QUFDOUMsK0NBQTBDO0FBQzFDLHVFQUFrRTtBQUNsRSw2Q0FBcUQ7QUFDckQsaUNBQW9KO0FBQ3BKLHFDQUFnQztBQTRDaEM7SUFvU0ksZUFBYSxHQUFHO1FBQWhCLGlCQVNDO1FBclNnQixjQUFTLEdBQWdCLFFBQVEsQ0FBQyxjQUFjLENBQUMsY0FBYyxDQUFDLENBQUM7UUFHakUsU0FBSSxHQUFnQjtZQUNqQyxNQUFNLEVBQUUsRUFBRTtZQUNWLE9BQU8sRUFBRSxFQUFFO1lBQ1gsS0FBSyxFQUFFLEVBQUU7WUFDVCxpQkFBaUIsRUFBRSxFQUFFO1lBQ3JCLE9BQU8sRUFBRSxFQUFFO1lBQ1gsS0FBSyxFQUFFLEVBQUU7WUFDVCxTQUFTLEVBQUUsRUFBRTtZQUNiLEtBQUssRUFBRSxFQUFFO1lBQ1QsU0FBUyxFQUFFLEVBQUU7WUFDYixZQUFZLEVBQUUsRUFBRTtZQUNoQixjQUFjLEVBQUUsRUFBRTtZQUNsQixVQUFVLEVBQUUsRUFBRTtZQUNkLFdBQVcsRUFBRSxFQUFFO1lBQ2YsSUFBSSxFQUFFLElBQUk7WUFDVixxQkFBcUIsRUFBRSxFQUFFO1NBQzVCLENBQUM7UUE0T2Usa0JBQWEsR0FBRyxVQUFDLE9BQWU7WUFBZix3QkFB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Q0FBQztRQUN0RCxJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLElBQUksR0FBRyxFQUFFLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQztRQUN4RCxJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7UUFDOUMsT0FBTyxNQUFNLEtBQUssUUFBUSxJQUFJLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7SUFDM0YsQ0FBQztJQUFBLENBQUM7SUFFSyxzQkFBSSxHQUFYO1FBQ0ksSUFBSSxJQUFJLENBQUMsZ0JBQWdCLElBQUksSUFBSSxDQUFDLGdCQUFnQixDQUFDLFVBQVUsRUFBRTtZQUMzRCxJQUFJLENBQUMsZ0JBQWdCLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztTQUN2RTtJQUNMLENBQUM7SUFBQSxDQUFDO0lBQ04sY0FBQztBQUFELENBNUJBLEFBNEJDLElBQUEiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCJpbXBvcnQgR3JvdXBzQnVpbGRlciBmcm9tIFwiLi9ncm91cHNCdWlsZGVyXCI7XHJcbmltcG9ydCBTZWN1cml0eUNsZWFyYW5jZXNCdWlsZGVyIGZyb20gXCIuL3NlY3VyaXR5Q2xlYXJhbmNlc0J1aWxkZXJcIjtcclxuaW1wb3J0IFJlcG9ydHNCdWlsZGVyIGZyb20gXCIuL3JlcG9ydHNCdWlsZGVyXCI7XHJcbmltcG9ydCBSdWxlc0J1aWxkZXIgZnJvbSBcIi4vcnVsZXNCdWlsZGVyXCI7XHJcbmltcG9ydCBEaXN0cmlidXRpb25MaXN0c0J1aWxkZXIgZnJvbSBcIi4vZGlzdHJpYnV0aW9uTGlzdHNCdWlsZGVyXCI7XHJcbmltcG9ydCB7SU1pc2NEYXRhLCBNaXNjQnVpbGRlcn0gZnJvbSBcIi4vbWlzY0J1aWxkZXJcIjtcclxuaW1wb3J0IHtkb3dubG9hZERhdGFBc0ZpbGUsIG1lcmdlVW5pcXVlLCBJRW50aXR5LCBtZXJnZVVuaXF1ZUVudGl0aWVzLCBnZXRVbmlxdWVFbnRpdGllcywgZ2V0RW50aXRpZXNJZHMsIHRvZ2V0aGVyLCByZXNvbHZlZFByb21pc2V9IGZyb20gXCIuL3V0aWxzXCI7XHJcbmltcG9ydCBXYWl0aW5nIGZyb20gXCIuL3dhaXRpbmdcIjtcclxuXHJcbmludGVyZmFjZSBHZW90YWIge1xyXG4gICAgYWRkaW46IHtcclxuICAgICAgICByZWdpc3RyYXRpb25Db25maWc6IEZ1bmN0aW9uXHJcbiAgICB9O1xyXG59XHJcblxyXG5pbnRlcmZhY2UgSUltcG9ydERhdGEge1xyXG4gICAgZ3JvdXBzOiBhbnlbXTtcclxuICAgIHJlcG9ydHM6IGFueVtdO1xyXG4gICAgcnVsZXM6IGFueVtdO1xyXG4gICAgZGlzdHJpYnV0aW9uTGlzdHM6IGFueVtdO1xyXG4gICAgZGV2aWNlczogYW55W107XHJcbiAgICB1c2VyczogYW55W107XHJcbiAgICB6b25lVHlwZXM6IGFueVtdO1xyXG4gICAgem9uZXM6IGFueVtdO1xyXG4gICAgd29ya1RpbWVzOiBhbnlbXTtcclxuICAgIHdvcmtIb2xpZGF5czogYW55W107XHJcbiAgICBzZWN1cml0eUdyb3VwczogYW55W107XHJcbiAgICBkaWFnbm9zdGljczogYW55W107XHJcbiAgICBjdXN0b21NYXBzOiBhbnlbXTtcclxuICAgIG1pc2M6IElNaXNjRGF0YTtcclxuICAgIG5vdGlmaWNhdGlvblRlbXBsYXRlczogYW55W107XHJcbn1cclxuaW50ZXJmYWNlIElEZXBlbmRlbmNpZXMge1xyXG4gICAgZ3JvdXBzPzogc3RyaW5nW107XHJcbiAgICByZXBvcnRzPzogc3RyaW5nW107XHJcbiAgICBydWxlcz86IHN0cmluZ1tdO1xyXG4gICAgZGlzdHJpYnV0aW9uTGlzdHM/OiBzdHJpbmdbXTtcclxuICAgIGRldmljZXM/OiBzdHJpbmdbXTtcclxuICAgIHVzZXJzPzogc3RyaW5nW107XHJcbiAgICB6b25lVHlwZXM/OiBzdHJpbmdbXTtcclxuICAgIHpvbmVzPzogc3RyaW5nW107XHJcbiAgICB3b3JrVGltZXM/OiBzdHJpbmdbXTtcclxuICAgIHdvcmtIb2xpZGF5cz86IHN0cmluZ1tdO1xyXG4gICAgc2VjdXJpdHlHcm91cHM/OiBzdHJpbmdbXTtcclxuICAgIGRpYWdub3N0aWNzPzogc3RyaW5nW107XHJcbiAgICBjdXN0b21NYXBzPzogc3RyaW5nW107XHJcbiAgICBub3RpZmljYXRpb25UZW1wbGF0ZXM/OiBzdHJpbmdbXTtcclxufVxyXG5cclxuZGVjbGFyZSBjb25zdCBnZW90YWI6IEdlb3RhYjtcclxuXHJcbmNsYXNzIEFkZGluIHtcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgYXBpO1xyXG4gICAgcHJpdmF0ZSByZWFkb25seSBncm91cHNCdWlsZGVyOiBHcm91cHNCdWlsZGVyO1xyXG4gICAgcHJpdmF0ZSByZWFkb25seSBzZWN1cml0eUNsZWFyYW5jZXNCdWlsZGVyOiBTZWN1cml0eUNsZWFyYW5jZXNCdWlsZGVyO1xyXG4gICAgcHJpdmF0ZSByZWFkb25seSByZXBvcnRzQnVpbGRlcjogUmVwb3J0c0J1aWxkZXI7XHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IHJ1bGVzQnVpbGRlcjogUnVsZXNCdWlsZGVyO1xyXG4gICAgcHJpdmF0ZSByZWFkb25seSBkaXN0cmlidXRpb25MaXN0c0J1aWxkZXI6IERpc3RyaWJ1dGlvbkxpc3RzQnVpbGRlcjtcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgbWlzY0J1aWxkZXI6IE1pc2NCdWlsZGVyO1xyXG4gICAgcHJpdmF0ZSByZWFkb25seSBleHBvcnRCdG46IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJleHBvcnRCdXR0b25cIik7XHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IHdhaXRpbmc6IFdhaXRpbmc7XHJcbiAgICBwcml2YXRlIGN1cnJlbnRUYXNrO1xyXG4gICAgcHJpdmF0ZSByZWFkb25seSBkYXRhOiBJSW1wb3J0RGF0YSA9IHtcclxuICAgICAgICBncm91cHM6IFtdLFxyXG4gICAgICAgIHJlcG9ydHM6IFtdLFxyXG4gICAgICAgIHJ1bGVzOiBbXSxcclxuICAgICAgICBkaXN0cmlidXRpb25MaXN0czogW10sXHJcbiAgICAgICAgZGV2aWNlczogW10sXHJcbiAgICAgICAgdXNlcnM6IFtdLFxyXG4gICAgICAgIHpvbmVUeXBlczogW10sXHJcbiAgICAgICAgem9uZXM6IFtdLFxyXG4gICAgICAgIHdvcmtUaW1lczogW10sXHJcbiAgICAgICAgd29ya0hvbGlkYXlzOiBbXSxcclxuICAgICAgICBzZWN1cml0eUdyb3VwczogW10sXHJcbiAgICAgICAgY3VzdG9tTWFwczogW10sXHJcbiAgICAgICAgZGlhZ25vc3RpY3M6IFtdLFxyXG4gICAgICAgIG1pc2M6IG51bGwsXHJcbiAgICAgICAgbm90aWZpY2F0aW9uVGVtcGxhdGVzOiBbXVxyXG4gICAgfTtcclxuXHJcbiAgICBwcml2YXRlIGNvbWJpbmVEZXBlbmRlbmNpZXMgKC4uLmFsbERlcGVuZGVuY2llczogSURlcGVuZGVuY2llc1tdKTogSURlcGVuZGVuY2llcyB7XHJcbiAgICAgICAgbGV0IHRvdGFsID0ge1xyXG4gICAgICAgICAgICBncm91cHM6IFtdLFxyXG4gICAgICAgICAgICByZXBvcnRzOiBbXSxcclxuICAgICAgICAgICAgcnVsZXM6IFtdLFxyXG4gICAgICAgICAgICBkZXZpY2VzOiBbXSxcclxuICAgICAgICAgICAgdXNlcnM6IFtdLFxyXG4gICAgICAgICAgICB6b25lVHlwZXM6IFtdLFxyXG4gICAgICAgICAgICB6b25lczogW10sXHJcbiAgICAgICAgICAgIHdvcmtUaW1lczogW10sXHJcbiAgICAgICAgICAgIHdvcmtIb2xpZGF5czogW10sXHJcbiAgICAgICAgICAgIHNlY3VyaXR5R3JvdXBzOiBbXSxcclxuICAgICAgICAgICAgZGlhZ25vc3RpY3M6IFtdLFxyXG4gICAgICAgICAgICBjdXN0b21NYXBzOiBbXSxcclxuICAgICAgICAgICAgbm90aWZpY2F0aW9uVGVtcGxhdGVzOiBbXVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgcmV0dXJuIE9iamVjdC5rZXlzKHRvdGFsKS5yZWR1Y2UoKGRlcGVuZGVuY2llcywgZGVwZW5kZW5jeU5hbWU6IHN0cmluZykgPT4ge1xyXG4gICAgICAgICAgICBkZXBlbmRlbmNpZXNbZGVwZW5kZW5jeU5hbWVdID0gbWVyZ2VVbmlxdWUoZGVwZW5kZW5jaWVzW2RlcGVuZGVuY3lOYW1lXSwgLi4uYWxsRGVwZW5kZW5jaWVzLm1hcCgoZW50aXR5RGVwZW5kZW5jaWVzKSA9PiBlbnRpdHlEZXBlbmRlbmNpZXNbZGVwZW5kZW5jeU5hbWVdKSk7XHJcbiAgICAgICAgICAgIHJldHVybiBkZXBlbmRlbmNpZXM7XHJcbiAgICAgICAgfSwgdG90YWwpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYWRkTmV3R3JvdXBzIChncm91cHM6IHN0cmluZ1tdLCBkYXRhOiBJSW1wb3J0RGF0YSk6IFByb21pc2U8YW55PiB7XHJcbiAgICAgICAgaWYgKCFncm91cHMgfHwgIWdyb3Vwcy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVkUHJvbWlzZSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBsZXQgZ3JvdXBzRGF0YSA9IHRoaXMuZ3JvdXBzQnVpbGRlci5nZXRHcm91cHNEYXRhKGdyb3VwcywgdHJ1ZSksXHJcbiAgICAgICAgICAgIG5ld0dyb3Vwc1VzZXJzID0gZ2V0VW5pcXVlRW50aXRpZXModGhpcy5ncm91cHNCdWlsZGVyLmdldFByaXZhdGVHcm91cHNVc2Vycyhncm91cHNEYXRhKSwgZGF0YS51c2Vycyk7XHJcbiAgICAgICAgZGF0YS5ncm91cHMgPSBtZXJnZVVuaXF1ZUVudGl0aWVzKGRhdGEuZ3JvdXBzLCBncm91cHNEYXRhKTtcclxuICAgICAgICBkYXRhLnVzZXJzID0gbWVyZ2VVbmlxdWVFbnRpdGllcyhkYXRhLnVzZXJzLCBuZXdHcm91cHNVc2Vycyk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMucmVzb2x2ZURlcGVuZGVuY2llcyh7dXNlcnM6IGdldEVudGl0aWVzSWRzKG5ld0dyb3Vwc1VzZXJzKX0sIGRhdGEpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYWRkTmV3Q3VzdG9tTWFwcyAoY3VzdG9tTWFwc0lkczogc3RyaW5nW10sIGRhdGE6IElJbXBvcnREYXRhKSB7XHJcbiAgICAgICAgaWYgKCFjdXN0b21NYXBzSWRzIHx8ICFjdXN0b21NYXBzSWRzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGxldCBjdXN0b21NYXBzRGF0YSA9IGN1c3RvbU1hcHNJZHMucmVkdWNlKChkYXRhLCBjdXN0b21NYXBJZDogc3RyaW5nKSA9PiB7XHJcbiAgICAgICAgICAgIGxldCBjdXN0b21NYXBEYXRhID0gdGhpcy5taXNjQnVpbGRlci5nZXRNYXBQcm92aWRlckRhdGEoY3VzdG9tTWFwSWQpO1xyXG4gICAgICAgICAgICBjdXN0b21NYXBEYXRhICYmIGRhdGEucHVzaChjdXN0b21NYXBEYXRhKTtcclxuICAgICAgICAgICAgcmV0dXJuIGRhdGE7XHJcbiAgICAgICAgfSwgW10pO1xyXG4gICAgICAgIGRhdGEuY3VzdG9tTWFwcyA9IG1lcmdlVW5pcXVlRW50aXRpZXMoZGF0YS5jdXN0b21NYXBzLCBjdXN0b21NYXBzRGF0YSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhZGROZXdOb3RpZmljYXRpb25UZW1wbGF0ZXMgKG5vdGlmaWNhdGlvblRlbXBsYXRlc0lkczogc3RyaW5nW10sIGRhdGE6IElJbXBvcnREYXRhKSB7XHJcbiAgICAgICAgaWYgKCFub3RpZmljYXRpb25UZW1wbGF0ZXNJZHMgfHwgIW5vdGlmaWNhdGlvblRlbXBsYXRlc0lkcy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBsZXQgbm90aWZpY2F0aW9uVGVtcGxhdGVzRGF0YSA9IG5vdGlmaWNhdGlvblRlbXBsYXRlc0lkcy5yZWR1Y2UoKGRhdGEsIHRlbXBsYXRlSWQ6IHN0cmluZykgPT4ge1xyXG4gICAgICAgICAgICBsZXQgdGVtcGxhdGVEYXRhID0gdGhpcy5kaXN0cmlidXRpb25MaXN0c0J1aWxkZXIuZ2V0Tm90aWZpY2F0aW9uVGVtcGxhdGVEYXRhKHRlbXBsYXRlSWQpO1xyXG4gICAgICAgICAgICB0ZW1wbGF0ZURhdGEgJiYgZGF0YS5wdXNoKHRlbXBsYXRlRGF0YSk7XHJcbiAgICAgICAgICAgIHJldHVybiBkYXRhO1xyXG4gICAgICAgIH0sIFtdKTtcclxuICAgICAgICBkYXRhLm5vdGlmaWNhdGlvblRlbXBsYXRlcyA9IG1lcmdlVW5pcXVlRW50aXRpZXMoZGF0YS5ub3RpZmljYXRpb25UZW1wbGF0ZXMsIG5vdGlmaWNhdGlvblRlbXBsYXRlc0RhdGEpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgZ2V0RW50eXRpZXNJZHMgKGVudGl0aWVzOiBJRW50aXR5W10pOiBzdHJpbmdbXSB7XHJcbiAgICAgICAgcmV0dXJuIGVudGl0aWVzLnJlZHVjZSgocmVzLCBlbnRpdHkpID0+IHtcclxuICAgICAgICAgICAgZW50aXR5ICYmIGVudGl0eS5pZCAmJiByZXMucHVzaChlbnRpdHkuaWQpO1xyXG4gICAgICAgICAgICByZXR1cm4gcmVzO1xyXG4gICAgICAgIH0sIFtdKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGdldEVudGl0eURlcGVuZGVuY2llcyAoZW50aXR5OiBJRW50aXR5LCBlbnRpdHlUeXBlKSB7XHJcbiAgICAgICAgbGV0IGVudGl0eURlcGVuZGVuY2llczogSURlcGVuZGVuY2llcyA9IHt9O1xyXG4gICAgICAgIHN3aXRjaCAoZW50aXR5VHlwZSkge1xyXG4gICAgICAgICAgICBjYXNlIFwiZGV2aWNlc1wiOlxyXG4gICAgICAgICAgICAgICAgZW50aXR5RGVwZW5kZW5jaWVzLmdyb3VwcyA9IHRoaXMuZ2V0RW50eXRpZXNJZHMoZW50aXR5W1wiZ3JvdXBzXCJdLmNvbmNhdChlbnRpdHlbXCJhdXRvR3JvdXBzXCJdKSk7XHJcbiAgICAgICAgICAgICAgICBlbnRpdHlbXCJ3b3JrVGltZVwiXS5pZCAmJiAoZW50aXR5RGVwZW5kZW5jaWVzLndvcmtUaW1lcyA9IFtlbnRpdHlbXCJ3b3JrVGltZVwiXS5pZF0pO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgXCJ1c2Vyc1wiOlxyXG4gICAgICAgICAgICAgICAgZW50aXR5RGVwZW5kZW5jaWVzLmdyb3VwcyA9IHRoaXMuZ2V0RW50eXRpZXNJZHMoZW50aXR5W1wiY29tcGFueUdyb3Vwc1wiXS5jb25jYXQoZW50aXR5W1wiZHJpdmVyR3JvdXBzXCJdKS5jb25jYXQoZW50aXR5W1wicHJpdmF0ZVVzZXJHcm91cHNcIl0pLmNvbmNhdChlbnRpdHlbXCJyZXBvcnRHcm91cHNcIl0pKTtcclxuICAgICAgICAgICAgICAgIGVudGl0eURlcGVuZGVuY2llcy5zZWN1cml0eUdyb3VwcyA9IHRoaXMuZ2V0RW50eXRpZXNJZHMoZW50aXR5W1wic2VjdXJpdHlHcm91cHNcIl0pO1xyXG4gICAgICAgICAgICAgICAgZW50aXR5RGVwZW5kZW5jaWVzLmN1c3RvbU1hcHMgPSBbZW50aXR5W1wiZGVmYXVsdE1hcEVuZ2luZVwiXV07XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBcInpvbmVzXCI6XHJcbiAgICAgICAgICAgICAgICBsZXQgem9uZVR5cGVzID0gdGhpcy5nZXRFbnR5dGllc0lkcyhlbnRpdHlbXCJ6b25lVHlwZXNcIl0pO1xyXG4gICAgICAgICAgICAgICAgem9uZVR5cGVzLmxlbmd0aCAmJiAoZW50aXR5RGVwZW5kZW5jaWVzLnpvbmVUeXBlcyA9IHpvbmVUeXBlcyk7XHJcbiAgICAgICAgICAgICAgICBlbnRpdHlEZXBlbmRlbmNpZXMuZ3JvdXBzID0gdGhpcy5nZXRFbnR5dGllc0lkcyhlbnRpdHlbXCJncm91cHNcIl0pO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgXCJ3b3JrVGltZXNcIjpcclxuICAgICAgICAgICAgICAgIGVudGl0eVtcImhvbGlkYXlHcm91cFwiXS5ncm91cElkICYmIChlbnRpdHlEZXBlbmRlbmNpZXMud29ya0hvbGlkYXlzID0gW2VudGl0eVtcImhvbGlkYXlHcm91cFwiXS5ncm91cElkXSk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZW50aXR5RGVwZW5kZW5jaWVzO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXBwbHlUb0VudGl0aWVzIChlbnRpdGllc0xpc3Q6IElEZXBlbmRlbmNpZXMsIGluaXRpYWxWYWx1ZSwgZnVuYzogKHJlc3VsdCwgZW50aXR5LCBlbnRpdHlUeXBlOiBzdHJpbmcsIGVudGl0eUluZGV4OiBudW1iZXIsIGVudGl0eVR5cGVJbmRleDogbnVtYmVyLCBvdmVyYWxsSW5kZXg6IG51bWJlcikgPT4gYW55KSB7XHJcbiAgICAgICAgbGV0IG92ZXJhbGxJbmRleCA9IDA7XHJcbiAgICAgICAgcmV0dXJuIE9iamVjdC5rZXlzKGVudGl0aWVzTGlzdCkucmVkdWNlKChyZXN1bHQsIGVudGl0eVR5cGUsIHR5cGVJbmRleCkgPT4ge1xyXG4gICAgICAgICAgICByZXR1cm4gZW50aXRpZXNMaXN0W2VudGl0eVR5cGVdLnJlZHVjZSgocmVzLCBlbnRpdHksIGluZGV4KSA9PiB7XHJcbiAgICAgICAgICAgICAgICBvdmVyYWxsSW5kZXgrKztcclxuICAgICAgICAgICAgICAgIHJldHVybiBmdW5jKHJlcywgZW50aXR5LCBlbnRpdHlUeXBlLCBpbmRleCwgdHlwZUluZGV4LCBvdmVyYWxsSW5kZXggLSAxKTtcclxuICAgICAgICAgICAgfSwgcmVzdWx0KTtcclxuICAgICAgICB9LCBpbml0aWFsVmFsdWUpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgcmVzb2x2ZURlcGVuZGVuY2llcyAoZGVwZW5kZW5jaWVzOiBJRGVwZW5kZW5jaWVzLCBkYXRhOiBJSW1wb3J0RGF0YSkge1xyXG4gICAgICAgIGxldCBnZXREYXRhID0gKGVudGl0aWVzTGlzdDogSURlcGVuZGVuY2llcyk6IFByb21pc2U8SUltcG9ydERhdGE+ID0+IHtcclxuICAgICAgICAgICAgICAgIGxldCBlbnRpdHlSZXF1ZXN0VHlwZXMgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRldmljZXM6IFwiRGV2aWNlXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHVzZXJzOiBcIlVzZXJcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgem9uZVR5cGVzOiBcIlpvbmVUeXBlXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHpvbmVzOiBcIlpvbmVcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgd29ya1RpbWVzOiBcIldvcmtUaW1lXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHdvcmtIb2xpZGF5czogXCJXb3JrSG9saWRheVwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWN1cml0eUdyb3VwczogXCJHcm91cFwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBkaWFnbm9zdGljczogXCJEaWFnbm9zdGljXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICByZXF1ZXN0czogYW55ID0gdGhpcy5hcHBseVRvRW50aXRpZXMoZW50aXRpZXNMaXN0LCB7fSwgKHJlc3VsdCwgZW50aXR5SWQsIGVudGl0eVR5cGUpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHJlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlTmFtZTogZW50aXR5UmVxdWVzdFR5cGVzW2VudGl0eVR5cGVdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VhcmNoOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IGVudGl0eUlkXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlbnRpdHlSZXF1ZXN0VHlwZXNbZW50aXR5VHlwZV0pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlbnRpdHlUeXBlID09PSBcIndvcmtIb2xpZGF5c1wiIHx8IGVudGl0eVR5cGUgPT09IFwic2VjdXJpdHlHcm91cHNcIikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAhcmVzdWx0W2VudGl0eVR5cGVdICYmIChyZXN1bHRbZW50aXR5VHlwZV0gPSBbXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHRbZW50aXR5VHlwZV0ucHVzaChbXCJHZXRcIiwgcmVxdWVzdF0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGVudGl0aWVzTGlzdC5zZWN1cml0eUdyb3VwcyAmJiBlbnRpdGllc0xpc3Quc2VjdXJpdHlHcm91cHMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWVzdHMuc2VjdXJpdHlHcm91cHMgPSBbW1wiR2V0XCIsIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZU5hbWU6IGVudGl0eVJlcXVlc3RUeXBlcy5zZWN1cml0eUdyb3VwcyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VhcmNoOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZDogXCJHcm91cFNlY3VyaXR5SWRcIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfV1dO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKGVudGl0aWVzTGlzdC53b3JrSG9saWRheXMgJiYgZW50aXRpZXNMaXN0LndvcmtIb2xpZGF5cy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXF1ZXN0cy53b3JrSG9saWRheXMgPSBbW1wiR2V0XCIsIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZU5hbWU6IGVudGl0eVJlcXVlc3RUeXBlcy53b3JrSG9saWRheXNcclxuICAgICAgICAgICAgICAgICAgICB9XV07XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuYWRkTmV3R3JvdXBzKGVudGl0aWVzTGlzdC5ncm91cHMsIGRhdGEpLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkTmV3Q3VzdG9tTWFwcyhlbnRpdGllc0xpc3QuY3VzdG9tTWFwcywgZGF0YSk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGROZXdOb3RpZmljYXRpb25UZW1wbGF0ZXMoZW50aXRpZXNMaXN0Lm5vdGlmaWNhdGlvblRlbXBsYXRlcywgZGF0YSk7XHJcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIGVudGl0aWVzTGlzdC5ncm91cHM7XHJcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIGVudGl0aWVzTGlzdC5jdXN0b21NYXBzO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZTxJSW1wb3J0RGF0YT4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgcmVxdWVzdEVudGl0aWVzID0gT2JqZWN0LmtleXMocmVxdWVzdHMpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVxdWVzdHNBcnJheSA9IHJlcXVlc3RFbnRpdGllcy5yZWR1Y2UoKGxpc3QsIHR5cGUpID0+IGxpc3QuY29uY2F0KHJlcXVlc3RzW3R5cGVdKSwgW10pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXJlcXVlc3RFbnRpdGllcy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlKGRhdGEpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYXBpLm11bHRpQ2FsbChyZXF1ZXN0c0FycmF5LCAocmVzcG9uc2UpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgbmV3R3JvdXBzID0gW10sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld0N1c3RvbU1hcHMgPSBbXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3RGVwZW5kZW5jaWVzOiBJRGVwZW5kZW5jaWVzID0ge30sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4cG9ydGVkRGF0YTogYW55ID0gdGhpcy5hcHBseVRvRW50aXRpZXMocmVxdWVzdHMsIHt9LCAocmVzdWx0LCByZXF1ZXN0LCBlbnRpdHlUeXBlLCBlbnRpdHlJbmRleCwgZW50aXR5VHlwZUluZGV4LCBvdmVyYWxsSW5kZXgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBpdGVtcyA9IHJlcXVlc3RzQXJyYXkubGVuZ3RoID4gMSA/IHJlc3BvbnNlW292ZXJhbGxJbmRleF0gOiByZXNwb25zZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW1zLmZvckVhY2goKGl0ZW0pID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtID0gaXRlbVswXSB8fCBpdGVtO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICFyZXN1bHRbZW50aXR5VHlwZV0gJiYgKHJlc3VsdFtlbnRpdHlUeXBlXSA9IFtdKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZW50aXR5VHlwZSA9PT0gXCJ3b3JrSG9saWRheXNcIiAmJiAoIWl0ZW0uaG9saWRheUdyb3VwIHx8IGVudGl0aWVzTGlzdC53b3JrSG9saWRheXMuaW5kZXhPZihpdGVtLmhvbGlkYXlHcm91cC5ncm91cElkKSA9PT0gLTEpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGVudGl0eVR5cGUgPT09IFwic2VjdXJpdHlHcm91cHNcIikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZW50aXRpZXNMaXN0LnNlY3VyaXR5R3JvdXBzLmluZGV4T2YoaXRlbS5pZCkgPiAtMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0W2VudGl0eVR5cGVdID0gcmVzdWx0W2VudGl0eVR5cGVdLmNvbmNhdCh0aGlzLmdyb3Vwc0J1aWxkZXIuZ2V0Q3VzdG9tR3JvdXBzRGF0YShlbnRpdGllc0xpc3Quc2VjdXJpdHlHcm91cHMsIGl0ZW1zKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGVudGl0eVR5cGUgPT09IFwidXNlcnNcIikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtLnVzZXJBdXRoZW50aWNhdGlvblR5cGUgPSBcIkJhc2ljQXV0aGVudGljYXRpb25cIjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGVudGl0eURlcGVuZGVuY2llcyA9IHRoaXMuZ2V0RW50aXR5RGVwZW5kZW5jaWVzKGl0ZW0sIGVudGl0eVR5cGUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld0RlcGVuZGVuY2llcyA9IHRoaXMuYXBwbHlUb0VudGl0aWVzKGVudGl0eURlcGVuZGVuY2llcywgbmV3RGVwZW5kZW5jaWVzLCAocmVzdWx0LCBlbnRpdHlJZCwgZW50aXR5VHlwZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAhcmVzdWx0W2VudGl0eVR5cGVdICYmIChyZXN1bHRbZW50aXR5VHlwZV0gPSBbXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdFtlbnRpdHlUeXBlXSA9IG1lcmdlVW5pcXVlKHJlc3VsdFtlbnRpdHlUeXBlXSwgW2VudGl0eUlkXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3R3JvdXBzID0gbmV3R3JvdXBzLmNvbmNhdChuZXdEZXBlbmRlbmNpZXMuZ3JvdXBzIHx8IFtdKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdDdXN0b21NYXBzID0gbmV3Q3VzdG9tTWFwcy5jb25jYXQobmV3RGVwZW5kZW5jaWVzLmN1c3RvbU1hcHMgfHwgW10pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBuZXdEZXBlbmRlbmNpZXMuZ3JvdXBzO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBuZXdEZXBlbmRlbmNpZXMuY3VzdG9tTWFwcztcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHRbZW50aXR5VHlwZV0ucHVzaChpdGVtKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3RGVwZW5kZW5jaWVzID0gT2JqZWN0LmtleXMobmV3RGVwZW5kZW5jaWVzKS5yZWR1Y2UoKHJlc3VsdCwgZGVwZW5kZW5jeU5hbWUpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGVudGl0aWVzID0gbmV3RGVwZW5kZW5jaWVzW2RlcGVuZGVuY3lOYW1lXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4cG9ydGVkID0gKGV4cG9ydGVkRGF0YVtkZXBlbmRlbmN5TmFtZV0gfHwgW10pLm1hcChlbnRpdHkgPT4gZW50aXR5LmlkKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZW50aXRpZXMuZm9yRWFjaChlbnRpdHlJZCA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXhwb3J0ZWQuaW5kZXhPZihlbnRpdHlJZCkgPT09IC0xKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIXJlc3VsdFtkZXBlbmRlbmN5TmFtZV0gJiYgKHJlc3VsdFtkZXBlbmRlbmN5TmFtZV0gPSBbXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0W2RlcGVuZGVuY3lOYW1lXS5wdXNoKGVudGl0eUlkKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwge30gYXMgSUltcG9ydERhdGEpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFJlbW92ZSBidWlsdC1pbiBzZWN1cml0eSBncm91cHNcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBleHBvcnRlZERhdGEuc2VjdXJpdHlHcm91cHMgJiYgKGV4cG9ydGVkRGF0YS5zZWN1cml0eUdyb3VwcyA9IGV4cG9ydGVkRGF0YS5zZWN1cml0eUdyb3Vwcy5yZWR1Y2UoKHJlc3VsdCwgZ3JvdXApID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ3JvdXAuaWQuaW5kZXhPZihcIkdyb3VwXCIpID09PSAtMSAmJiByZXN1bHQucHVzaChncm91cCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwgW10pKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZE5ld0dyb3VwcyhuZXdHcm91cHMsIGRhdGEpLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZE5ld0N1c3RvbU1hcHMobmV3Q3VzdG9tTWFwcywgZGF0YSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIE9iamVjdC5rZXlzKGV4cG9ydGVkRGF0YSkuZm9yRWFjaCgoZW50aXR5VHlwZTogc3RyaW5nKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhW2VudGl0eVR5cGVdID0gbWVyZ2VVbmlxdWVFbnRpdGllcyhkYXRhW2VudGl0eVR5cGVdLCBleHBvcnRlZERhdGFbZW50aXR5VHlwZV0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKE9iamVjdC5rZXlzKG5ld0RlcGVuZGVuY2llcykubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHRoaXMucmVzb2x2ZURlcGVuZGVuY2llcyhuZXdEZXBlbmRlbmNpZXMsIGRhdGEpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoZGF0YSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LCByZWplY3QpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwgcmVqZWN0KTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZTxJSW1wb3J0RGF0YT4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgICAgICByZXR1cm4gZ2V0RGF0YShkZXBlbmRlbmNpZXMpLnRoZW4ocmVzb2x2ZSkuY2F0Y2gocmVqZWN0KTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFib3J0Q3VycmVudFRhc2sgKCkge1xyXG4gICAgICAgIHRoaXMudG9nZ2xlV2FpdGluZygpO1xyXG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgJiYgdGhpcy5jdXJyZW50VGFzay5hYm9ydCAmJiB0aGlzLmN1cnJlbnRUYXNrLmFib3J0KCk7XHJcbiAgICAgICAgdGhpcy5jdXJyZW50VGFzayA9IG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSB0b2dnbGVFeHBvcnRCdXR0b24gKGlzRGlzYWJsZWQ6IGJvb2xlYW4pIHtcclxuICAgICAgICAoPEhUTUxJbnB1dEVsZW1lbnQ+dGhpcy5leHBvcnRCdG4pLmRpc2FibGVkID0gaXNEaXNhYmxlZDtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IHRvZ2dsZVdhaXRpbmcgPSAoaXNTdGFydCA9IGZhbHNlKSA9PiB7XHJcbiAgICAgICAgaWYgKGlzU3RhcnQpIHtcclxuICAgICAgICAgICAgdGhpcy50b2dnbGVFeHBvcnRCdXR0b24odHJ1ZSk7XHJcbiAgICAgICAgICAgIHRoaXMud2FpdGluZy5zdGFydChkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImFkZGluQ29udGFpbmVyXCIpLnBhcmVudEVsZW1lbnQsIDk5OTkpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMudG9nZ2xlRXhwb3J0QnV0dG9uKGZhbHNlKTtcclxuICAgICAgICAgICAgdGhpcy53YWl0aW5nLnN0b3AoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBzaG93RW50aXR5TWVzc2FnZSAoYmxvY2s6IEhUTUxFbGVtZW50LCBxdHk6IG51bWJlciwgZW50aXR5TmFtZTogc3RyaW5nKSB7XHJcbiAgICAgICAgbGV0IGJsb2NrRWwgPSBibG9jay5xdWVyeVNlbGVjdG9yKFwiLmRlc2NyaXB0aW9uXCIpO1xyXG4gICAgICAgIGlmIChxdHkpIHtcclxuICAgICAgICAgICAgcXR5ID4gMSAmJiAoZW50aXR5TmFtZSArPSBcInNcIik7XHJcbiAgICAgICAgICAgIGxldCBoYXNJdGVtc01lc3NhZ2VUZW1wbGF0ZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiaGFzSXRlbXNNZXNzYWdlVGVtcGxhdGVcIikuaW5uZXJIVE1MO1xyXG4gICAgICAgICAgICBibG9ja0VsLmlubmVySFRNTCA9IGhhc0l0ZW1zTWVzc2FnZVRlbXBsYXRlLnJlcGxhY2UoXCJ7cXVhbnRpdHl9XCIsIHF0eS50b1N0cmluZygpKS5yZXBsYWNlKFwie2VudGl0eX1cIiwgZW50aXR5TmFtZSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgYmxvY2tFbC5pbm5lckhUTUwgPSBgWW91IGhhdmUgPHNwYW4gY2xhc3M9XCJib2xkXCI+bm90IGNvbmZpZ3VyZWQgYW55ICR7IGVudGl0eU5hbWUgfXM8L3NwYW4+LmA7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgcmVhZG9ubHkgdG9nZ2xlVGhpc0FkZGluSW5jbHVkZWQgPSAoZTogRXZlbnQpID0+IHtcclxuICAgICAgICBsZXQgaXNDaGVja2VkID0gISFlLnRhcmdldCAmJiAhISg8SFRNTElucHV0RWxlbWVudD5lLnRhcmdldCkuY2hlY2tlZDtcclxuICAgICAgICBsZXQgYWRkaW5zQmxvY2s6IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJleHBvcnRlZEFkZGluc1wiKTtcclxuICAgICAgICBsZXQgYWRkaW5zRGF0YSA9IHRoaXMubWlzY0J1aWxkZXIuZ2V0QWRkaW5zRGF0YSghaXNDaGVja2VkKTtcclxuICAgICAgICB0aGlzLnNob3dFbnRpdHlNZXNzYWdlKGFkZGluc0Jsb2NrLCBhZGRpbnNEYXRhLmxlbmd0aCwgXCJhZGRpblwiKTtcclxuICAgICAgICB0aGlzLmRhdGEubWlzYy5hZGRpbnMgPSBhZGRpbnNEYXRhO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0cnVjdG9yIChhcGkpIHtcclxuICAgICAgICB0aGlzLmFwaSA9IGFwaTtcclxuICAgICAgICB0aGlzLmdyb3Vwc0J1aWxkZXIgPSBuZXcgR3JvdXBzQnVpbGRlcihhcGkpO1xyXG4gICAgICAgIHRoaXMuc2VjdXJpdHlDbGVhcmFuY2VzQnVpbGRlciA9IG5ldyBTZWN1cml0eUNsZWFyYW5jZXNCdWlsZGVyKGFwaSk7XHJcbiAgICAgICAgdGhpcy5yZXBvcnRzQnVpbGRlciA9IG5ldyBSZXBvcnRzQnVpbGRlcihhcGkpO1xyXG4gICAgICAgIHRoaXMucnVsZXNCdWlsZGVyID0gbmV3IFJ1bGVzQnVpbGRlcihhcGkpO1xyXG4gICAgICAgIHRoaXMuZGlzdHJpYnV0aW9uTGlzdHNCdWlsZGVyID0gbmV3IERpc3RyaWJ1dGlvbkxpc3RzQnVpbGRlcihhcGkpO1xyXG4gICAgICAgIHRoaXMubWlzY0J1aWxkZXIgPSBuZXcgTWlzY0J1aWxkZXIoYXBpKTtcclxuICAgICAgICB0aGlzLndhaXRpbmcgPSBuZXcgV2FpdGluZygpO1xyXG4gICAgfVxyXG5cclxuICAgIGV4cG9ydERhdGEgPSAoKSA9PiB7XHJcbiAgICAgICAgdGhpcy50b2dnbGVXYWl0aW5nKHRydWUpO1xyXG4gICAgICAgIHJldHVybiB0aGlzLnJlcG9ydHNCdWlsZGVyLmdldERhdGEoKS50aGVuKChyZXBvcnRzRGF0YSkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLmRhdGEucmVwb3J0cyA9IHJlcG9ydHNEYXRhO1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyh0aGlzLmRhdGEpO1xyXG4gICAgICAgICAgICBkb3dubG9hZERhdGFBc0ZpbGUoSlNPTi5zdHJpbmdpZnkodGhpcy5kYXRhKSwgXCJleHBvcnQuanNvblwiKTtcclxuICAgICAgICB9KS5jYXRjaCgoZSkgPT4ge1xyXG4gICAgICAgICAgICBhbGVydChcIkNhbid0IGV4cG9ydCBkYXRhLlxcblBsZWFzZSB0cnkgYWdhaW4gbGF0ZXIuXCIpO1xyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGUpO1xyXG4gICAgICAgIH0pLmZpbmFsbHkoKCkgPT4gdGhpcy50b2dnbGVXYWl0aW5nKCkpO1xyXG4gICAgfVxyXG5cclxuICAgIHJlbmRlciAoKSB7XHJcbiAgICAgICAgbGV0IG1hcE1lc3NhZ2VUZW1wbGF0ZTogc3RyaW5nID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJtYXBNZXNzYWdlVGVtcGxhdGVcIikuaW5uZXJIVE1MLFxyXG4gICAgICAgICAgICBncm91cHNCbG9jazogSFRNTEVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImV4cG9ydGVkR3JvdXBzXCIpLFxyXG4gICAgICAgICAgICBzZWN1cml0eUNsZWFyYW5jZXNCbG9jazogSFRNTEVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImV4cG9ydGVkU2VjdXJpdHlDbGVhcmFuY2VzXCIpLFxyXG4gICAgICAgICAgICBydWxlc0Jsb2NrOiBIVE1MRWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZXhwb3J0ZWRSdWxlc1wiKSxcclxuICAgICAgICAgICAgcmVwb3J0c0Jsb2NrOiBIVE1MRWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZXhwb3J0ZWRSZXBvcnRzXCIpLFxyXG4gICAgICAgICAgICBkYXNoYm9hcmRzQmxvY2s6IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJleHBvcnRlZERhc2hib2FyZHNcIiksXHJcbiAgICAgICAgICAgIGFkZGluc0Jsb2NrOiBIVE1MRWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZXhwb3J0ZWRBZGRpbnNcIiksXHJcbiAgICAgICAgICAgIHRoaXNBZGRpbkJsb2NrOiBIVE1MRWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiaW5jbHVkZVRoaXNBZGRpblwiKSxcclxuICAgICAgICAgICAgdGhpc0FkZGluSW5jbHVkZWRDaGVja2JveDogSFRNTEVsZW1lbnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI2luY2x1ZGVUaGlzQWRkaW4gPiBpbnB1dFwiKSxcclxuICAgICAgICAgICAgbWFwQmxvY2tEZXNjcmlwdGlvbjogSFRNTEVsZW1lbnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI2V4cG9ydGVkTWFwID4gLmRlc2NyaXB0aW9uXCIpO1xyXG4gICAgICAgIHRoaXMuZXhwb3J0QnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLmV4cG9ydERhdGEsIGZhbHNlKTtcclxuICAgICAgICB0aGlzQWRkaW5JbmNsdWRlZENoZWNrYm94LmFkZEV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgdGhpcy50b2dnbGVUaGlzQWRkaW5JbmNsdWRlZCwgZmFsc2UpO1xyXG4gICAgICAgIHRoaXMudG9nZ2xlV2FpdGluZyh0cnVlKTtcclxuICAgICAgICByZXR1cm4gdG9nZXRoZXIoW1xyXG4gICAgICAgICAgICB0aGlzLmdyb3Vwc0J1aWxkZXIuZmV0Y2goKSxcclxuICAgICAgICAgICAgdGhpcy5zZWN1cml0eUNsZWFyYW5jZXNCdWlsZGVyLmZldGNoKCksXHJcbiAgICAgICAgICAgIHRoaXMucmVwb3J0c0J1aWxkZXIuZmV0Y2goKSxcclxuICAgICAgICAgICAgdGhpcy5ydWxlc0J1aWxkZXIuZmV0Y2goKSxcclxuICAgICAgICAgICAgdGhpcy5kaXN0cmlidXRpb25MaXN0c0J1aWxkZXIuZmV0Y2goKSxcclxuICAgICAgICAgICAgdGhpcy5taXNjQnVpbGRlci5mZXRjaCgpXHJcbiAgICAgICAgXSkudGhlbigocmVzdWx0cykgPT4ge1xyXG4gICAgICAgICAgICBsZXQgcmVwb3J0c0RlcGVuZGVuY2llczogSURlcGVuZGVuY2llcyxcclxuICAgICAgICAgICAgICAgIHJ1bGVzRGVwZW5kZW5jaWVzOiBJRGVwZW5kZW5jaWVzLFxyXG4gICAgICAgICAgICAgICAgZGlzdHJpYnV0aW9uTGlzdHNEZXBlbmRlbmNpZXM6IElEZXBlbmRlbmNpZXMsXHJcbiAgICAgICAgICAgICAgICBkZXBlbmRlbmNpZXM6IElEZXBlbmRlbmNpZXMsXHJcbiAgICAgICAgICAgICAgICBjdXN0b21NYXA7XHJcbiAgICAgICAgICAgIHRoaXMuZGF0YS5ncm91cHMgPSByZXN1bHRzWzBdO1xyXG4gICAgICAgICAgICB0aGlzLmRhdGEuc2VjdXJpdHlHcm91cHMgPSByZXN1bHRzWzFdO1xyXG4gICAgICAgICAgICB0aGlzLmRhdGEucmVwb3J0cyA9IHJlc3VsdHNbMl07XHJcbiAgICAgICAgICAgIHRoaXMuZGF0YS5ydWxlcyA9IHJlc3VsdHNbM107XHJcbiAgICAgICAgICAgIHRoaXMuZGF0YS5kaXN0cmlidXRpb25MaXN0cyA9IHRoaXMuZGlzdHJpYnV0aW9uTGlzdHNCdWlsZGVyLmdldFJ1bGVzRGlzdHJpYnV0aW9uTGlzdHModGhpcy5kYXRhLnJ1bGVzLm1hcChydWxlID0+IHJ1bGUuaWQpKTtcclxuICAgICAgICAgICAgdGhpcy5kYXRhLm1pc2MgPSByZXN1bHRzWzVdO1xyXG4gICAgICAgICAgICBjdXN0b21NYXAgPSB0aGlzLm1pc2NCdWlsZGVyLmdldE1hcFByb3ZpZGVyRGF0YSh0aGlzLmRhdGEubWlzYy5tYXBQcm92aWRlci52YWx1ZSk7XHJcbiAgICAgICAgICAgIGN1c3RvbU1hcCAmJiB0aGlzLmRhdGEuY3VzdG9tTWFwcy5wdXNoKGN1c3RvbU1hcCk7XHJcbiAgICAgICAgICAgIHJlcG9ydHNEZXBlbmRlbmNpZXMgPSB0aGlzLnJlcG9ydHNCdWlsZGVyLmdldERlcGVuZGVuY2llcyh0aGlzLmRhdGEucmVwb3J0cyk7XHJcbiAgICAgICAgICAgIHJ1bGVzRGVwZW5kZW5jaWVzID0gdGhpcy5ydWxlc0J1aWxkZXIuZ2V0RGVwZW5kZW5jaWVzKHRoaXMuZGF0YS5ydWxlcyk7XHJcbiAgICAgICAgICAgIGRpc3RyaWJ1dGlvbkxpc3RzRGVwZW5kZW5jaWVzID0gdGhpcy5kaXN0cmlidXRpb25MaXN0c0J1aWxkZXIuZ2V0RGVwZW5kZW5jaWVzKHRoaXMuZGF0YS5kaXN0cmlidXRpb25MaXN0cyk7XHJcbiAgICAgICAgICAgIGRlcGVuZGVuY2llcyA9IHRoaXMuY29tYmluZURlcGVuZGVuY2llcyhyZXBvcnRzRGVwZW5kZW5jaWVzLCBydWxlc0RlcGVuZGVuY2llcywgZGlzdHJpYnV0aW9uTGlzdHNEZXBlbmRlbmNpZXMpO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5yZXNvbHZlRGVwZW5kZW5jaWVzKGRlcGVuZGVuY2llcywgdGhpcy5kYXRhKTtcclxuICAgICAgICB9KS50aGVuKCgpID0+IHtcclxuICAgICAgICAgICAgbGV0IG1hcFByb3ZpZGVyID0gdGhpcy5taXNjQnVpbGRlci5nZXRNYXBQcm92aWRlck5hbWUodGhpcy5kYXRhLm1pc2MubWFwUHJvdmlkZXIudmFsdWUpO1xyXG4gICAgICAgICAgICB0aGlzLnNob3dFbnRpdHlNZXNzYWdlKGdyb3Vwc0Jsb2NrLCB0aGlzLmRhdGEuZ3JvdXBzLmxlbmd0aCAtIDEsIFwiZ3JvdXBcIik7XHJcbiAgICAgICAgICAgIHRoaXMuc2hvd0VudGl0eU1lc3NhZ2Uoc2VjdXJpdHlDbGVhcmFuY2VzQmxvY2ssIHRoaXMuZGF0YS5zZWN1cml0eUdyb3Vwcy5sZW5ndGgsIFwic2VjdXJpdHkgY2xlYXJhbmNlXCIpO1xyXG4gICAgICAgICAgICB0aGlzLnNob3dFbnRpdHlNZXNzYWdlKHJ1bGVzQmxvY2ssIHRoaXMuZGF0YS5ydWxlcy5sZW5ndGgsIFwicnVsZVwiKTtcclxuICAgICAgICAgICAgdGhpcy5zaG93RW50aXR5TWVzc2FnZShyZXBvcnRzQmxvY2ssIHRoaXMucmVwb3J0c0J1aWxkZXIuZ2V0Q3VzdG9taXplZFJlcG9ydHNRdHkoKSwgXCJyZXBvcnRcIik7XHJcbiAgICAgICAgICAgIHRoaXMuc2hvd0VudGl0eU1lc3NhZ2UoZGFzaGJvYXJkc0Jsb2NrLCB0aGlzLnJlcG9ydHNCdWlsZGVyLmdldERhc2hib2FyZHNRdHkoKSwgXCJkYXNoYm9hcmRcIik7XHJcbiAgICAgICAgICAgIG1hcFByb3ZpZGVyICYmIChtYXBCbG9ja0Rlc2NyaXB0aW9uLmlubmVySFRNTCA9IG1hcE1lc3NhZ2VUZW1wbGF0ZS5yZXBsYWNlKFwie21hcFByb3ZpZGVyfVwiLCBtYXBQcm92aWRlcikpO1xyXG4gICAgICAgICAgICB0aGlzLnNob3dFbnRpdHlNZXNzYWdlKGFkZGluc0Jsb2NrLCB0aGlzLmRhdGEubWlzYy5hZGRpbnMubGVuZ3RoLCBcImFkZGluXCIpO1xyXG4gICAgICAgICAgICB0aGlzLm1pc2NCdWlsZGVyLmlzVGhpc0FkZGluSW5jbHVkZWQoKSAmJiB0aGlzQWRkaW5CbG9jay5jbGFzc0xpc3QucmVtb3ZlKFwiaGlkZGVuXCIpO1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyh0aGlzLmRhdGEpO1xyXG4gICAgICAgIH0pLmNhdGNoKChlKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XHJcbiAgICAgICAgICAgIGFsZXJ0KFwiQ2FuJ3QgZ2V0IGNvbmZpZyB0byBleHBvcnRcIik7XHJcbiAgICAgICAgfSkuZmluYWxseSgoKSA9PiB0aGlzLnRvZ2dsZVdhaXRpbmcoKSk7XHJcbiAgICB9XHJcblxyXG4gICAgdW5sb2FkICgpIHtcclxuICAgICAgICB0aGlzLmFib3J0Q3VycmVudFRhc2soKTtcclxuICAgICAgICB0aGlzLmdyb3Vwc0J1aWxkZXIudW5sb2FkKCk7XHJcbiAgICAgICAgdGhpcy5zZWN1cml0eUNsZWFyYW5jZXNCdWlsZGVyLnVubG9hZCgpO1xyXG4gICAgICAgIHRoaXMucmVwb3J0c0J1aWxkZXIudW5sb2FkKCk7XHJcbiAgICAgICAgdGhpcy5ydWxlc0J1aWxkZXIudW5sb2FkKCk7XHJcbiAgICAgICAgdGhpcy5kaXN0cmlidXRpb25MaXN0c0J1aWxkZXIudW5sb2FkKCk7XHJcbiAgICAgICAgdGhpcy5taXNjQnVpbGRlci51bmxvYWQoKTtcclxuICAgICAgICB0aGlzLmV4cG9ydEJ0bi5yZW1vdmVFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5leHBvcnREYXRhLCBmYWxzZSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmdlb3RhYi5hZGRpbi5yZWdpc3RyYXRpb25Db25maWcgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICBsZXQgYWRkaW46IEFkZGluO1xyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgaW5pdGlhbGl6ZTogKGFwaSwgc3RhdGUsIGNhbGxiYWNrKSA9PiB7XHJcbiAgICAgICAgICAgIGFkZGluID0gbmV3IEFkZGluKGFwaSk7XHJcbiAgICAgICAgICAgIGNhbGxiYWNrKCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBmb2N1czogKCkgPT4ge1xyXG4gICAgICAgICAgICBhZGRpbi5yZW5kZXIoKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIGJsdXI6ICgpID0+IHtcclxuICAgICAgICAgICAgYWRkaW4udW5sb2FkKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxufTsiLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vYmx1ZWJpcmQuZC50c1wiLz5cclxuaW1wb3J0IHtlbnRpdHlUb0RpY3Rpb25hcnksIG1lcmdlVW5pcXVlfSBmcm9tIFwiLi91dGlsc1wiO1xyXG5cclxuaW50ZXJmYWNlIElEaXN0cmlidXRpb25MaXN0IHtcclxuICAgIGlkOiBzdHJpbmc7XHJcbiAgICBuYW1lOiBzdHJpbmc7XHJcbiAgICByZWNpcGllbnRzOiBhbnlbXTtcclxuICAgIHJ1bGVzOiBhbnlbXTtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBJRGlzdHJpYnV0aW9uTGlzdERlcGVuZGVuY2llcyB7XHJcbiAgICBydWxlcz86IGFueVtdO1xyXG4gICAgdXNlcnM/OiBhbnlbXTtcclxuICAgIG5vdGlmaWNhdGlvblRlbXBsYXRlcz86IGFueVtdO1xyXG4gICAgZ3JvdXBzPzogYW55W107XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIERpc3RyaWJ1dGlvbkxpc3RzQnVpbGRlciB7XHJcbiAgICBwcml2YXRlIGFwaTtcclxuICAgIHByaXZhdGUgY3VycmVudFRhc2s7XHJcbiAgICBwcml2YXRlIGRpc3RyaWJ1dGlvbkxpc3RzO1xyXG4gICAgcHJpdmF0ZSBub3RpZmljYXRpb25UZW1wbGF0ZXM7XHJcblxyXG4gICAgY29uc3RydWN0b3IoYXBpKSB7XHJcbiAgICAgICAgdGhpcy5hcGkgPSBhcGk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBnZXREaXN0cmlidXRpb25MaXN0c0RhdGEgKCk6IFByb21pc2U8YW55PiB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5hcGkubXVsdGlDYWxsKFtcclxuICAgICAgICAgICAgICAgIFtcIkdldFwiLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgXCJ0eXBlTmFtZVwiOiBcIkRpc3RyaWJ1dGlvbkxpc3RcIixcclxuICAgICAgICAgICAgICAgIH1dLFxyXG4gICAgICAgICAgICAgICAgW1wiR2V0Tm90aWZpY2F0aW9uV2ViUmVxdWVzdFRlbXBsYXRlc1wiLCB7fV0sXHJcbiAgICAgICAgICAgICAgICBbXCJHZXROb3RpZmljYXRpb25FbWFpbFRlbXBsYXRlc1wiLCB7fV0sXHJcbiAgICAgICAgICAgICAgICBbXCJHZXROb3RpZmljYXRpb25UZXh0VGVtcGxhdGVzXCIsIHt9XVxyXG4gICAgICAgICAgICBdLCByZXNvbHZlLCByZWplY3QpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICBwcml2YXRlIGFib3J0Q3VycmVudFRhc2sgKCk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgJiYgdGhpcy5jdXJyZW50VGFzay5hYm9ydCAmJiB0aGlzLmN1cnJlbnRUYXNrLmFib3J0KCk7XHJcbiAgICAgICAgdGhpcy5jdXJyZW50VGFzayA9IG51bGw7XHJcbiAgICB9O1xyXG5cclxuICAgIHB1YmxpYyBnZXREZXBlbmRlbmNpZXMgKGRpc3RyaWJ1dGlvbkxpc3RzKTogSURpc3RyaWJ1dGlvbkxpc3REZXBlbmRlbmNpZXMge1xyXG4gICAgICAgIGxldCBkZXBlbmRlbmNpZXM6IElEaXN0cmlidXRpb25MaXN0RGVwZW5kZW5jaWVzID0ge1xyXG4gICAgICAgICAgICAgICAgcnVsZXM6IFtdLFxyXG4gICAgICAgICAgICAgICAgdXNlcnM6IFtdLFxyXG4gICAgICAgICAgICAgICAgZ3JvdXBzOiBbXSxcclxuICAgICAgICAgICAgICAgIG5vdGlmaWNhdGlvblRlbXBsYXRlczogW11cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgcHJvY2Vzc0RlcGVuZGVuY2llcyA9IChyZWNpcGllbnQpID0+IHtcclxuICAgICAgICAgICAgICAgIGxldCBpZCwgdHlwZTogc3RyaW5nLFxyXG4gICAgICAgICAgICAgICAgICAgIHVzZXJJZCA9IHJlY2lwaWVudC51c2VyLmlkO1xyXG4gICAgICAgICAgICAgICAgdXNlcklkICYmIGRlcGVuZGVuY2llcy51c2Vycy5pbmRleE9mKHVzZXJJZCkgPT09IC0xICYmIGRlcGVuZGVuY2llcy51c2Vycy5wdXNoKHVzZXJJZCk7XHJcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKHJlY2lwaWVudC5yZWNpcGllbnRUeXBlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIkVtYWlsXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIkxvZ1BvcHVwXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIkxvZ1VyZ2VudFBvcHVwXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIkxvZ09ubHlcIjpcclxuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiVGV4dE1lc3NhZ2VcIjpcclxuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiVGV4dFRvU3BlZWNoQWxsb3dEZWxheVwiOlxyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJXZWJSZXF1ZXN0XCI6XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIlRleHRUb1NwZWVjaFwiOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZCA9IHJlY2lwaWVudC5ub3RpZmljYXRpb25CaW5hcnlGaWxlICYmIHJlY2lwaWVudC5ub3RpZmljYXRpb25CaW5hcnlGaWxlLmlkO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlID0gXCJub3RpZmljYXRpb25UZW1wbGF0ZXNcIjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIkFzc2lnblRvR3JvdXBcIjpcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWQgPSByZWNpcGllbnQuZ3JvdXAgJiYgcmVjaXBpZW50Lmdyb3VwLmlkO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlID0gXCJncm91cHNcIjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZCAmJiB0eXBlICYmIGRlcGVuZGVuY2llc1t0eXBlXS5pbmRleE9mKGlkKSA9PT0gLTEgJiYgZGVwZW5kZW5jaWVzW3R5cGVdLnB1c2goaWQpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBjaGVja1JlY2lwaWVudHMgPSAocmVjaXBpZW50cywgZGVwZW5kZW5jaWVzOiBJRGlzdHJpYnV0aW9uTGlzdERlcGVuZGVuY2llcyk6IElEaXN0cmlidXRpb25MaXN0RGVwZW5kZW5jaWVzID0+IHtcclxuICAgICAgICAgICAgICAgIHJldHVybiByZWNpcGllbnRzLnJlZHVjZSgoZGVwZW5kZW5jaWVzLCByZWNpcGllbnQpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBwcm9jZXNzRGVwZW5kZW5jaWVzKHJlY2lwaWVudCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGRlcGVuZGVuY2llcztcclxuICAgICAgICAgICAgICAgIH0sIGRlcGVuZGVuY2llcyk7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgcmV0dXJuIGRpc3RyaWJ1dGlvbkxpc3RzLnJlZHVjZSgoZGVwZW5kZW5jaWVzOiBJRGlzdHJpYnV0aW9uTGlzdERlcGVuZGVuY2llcywgZGlzdHJpYnV0aW9uTGlzdDogSURpc3RyaWJ1dGlvbkxpc3QpID0+IHtcclxuICAgICAgICAgICAgZGVwZW5kZW5jaWVzLnJ1bGVzID0gbWVyZ2VVbmlxdWUoZGVwZW5kZW5jaWVzLnJ1bGVzLCBkaXN0cmlidXRpb25MaXN0LnJ1bGVzLm1hcChydWxlID0+IHJ1bGUuaWQpKTtcclxuICAgICAgICAgICAgZGVwZW5kZW5jaWVzID0gY2hlY2tSZWNpcGllbnRzKGRpc3RyaWJ1dGlvbkxpc3QucmVjaXBpZW50cywgZGVwZW5kZW5jaWVzKTtcclxuICAgICAgICAgICAgcmV0dXJuIGRlcGVuZGVuY2llcztcclxuICAgICAgICB9LCBkZXBlbmRlbmNpZXMpO1xyXG4gICAgfTtcclxuXHJcbiAgICBwdWJsaWMgZmV0Y2goKTogUHJvbWlzZTxhbnk+IHtcclxuICAgICAgICB0aGlzLmFib3J0Q3VycmVudFRhc2soKTtcclxuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrID0gdGhpcy5nZXREaXN0cmlidXRpb25MaXN0c0RhdGEoKVxyXG4gICAgICAgICAgICAudGhlbigoW2Rpc3RyaWJ1dGlvbkxpc3RzLCB3ZWJUZW1wbGF0ZXMsIGVtYWlsVGVtcGxhdGVzLCB0ZXh0VGVtcGxhdGVzXSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5kaXN0cmlidXRpb25MaXN0cyA9IGVudGl0eVRvRGljdGlvbmFyeShkaXN0cmlidXRpb25MaXN0cyk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm5vdGlmaWNhdGlvblRlbXBsYXRlcyA9IGVudGl0eVRvRGljdGlvbmFyeSh3ZWJUZW1wbGF0ZXMuY29uY2F0KGVtYWlsVGVtcGxhdGVzKS5jb25jYXQodGV4dFRlbXBsYXRlcykpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZGlzdHJpYnV0aW9uTGlzdHM7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIC5jYXRjaChjb25zb2xlLmVycm9yKVxyXG4gICAgICAgICAgICAuZmluYWxseSgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRUYXNrID0gbnVsbDtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY3VycmVudFRhc2s7XHJcbiAgICB9O1xyXG5cclxuICAgIHB1YmxpYyBnZXROb3RpZmljYXRpb25UZW1wbGF0ZURhdGEgKHRlbXBsYXRlSWQ6IHN0cmluZyk6IGFueSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubm90aWZpY2F0aW9uVGVtcGxhdGVzW3RlbXBsYXRlSWRdO1xyXG4gICAgfTtcclxuXHJcbiAgICBwdWJsaWMgZ2V0UnVsZXNEaXN0cmlidXRpb25MaXN0cyAocnVsZXNJZHM6IHN0cmluZ1tdKTogSURpc3RyaWJ1dGlvbkxpc3RbXSB7XHJcbiAgICAgICAgcmV0dXJuIE9iamVjdC5rZXlzKHRoaXMuZGlzdHJpYnV0aW9uTGlzdHMpLnJlZHVjZSgocmVzLCBpZCkgPT4ge1xyXG4gICAgICAgICAgICBsZXQgbGlzdCA9IHRoaXMuZGlzdHJpYnV0aW9uTGlzdHNbaWRdO1xyXG4gICAgICAgICAgICBsaXN0LnJ1bGVzLnNvbWUobGlzdFJ1bGUgPT4gcnVsZXNJZHMuaW5kZXhPZihsaXN0UnVsZS5pZCkgPiAtMSkgJiYgcmVzLnB1c2gobGlzdCk7XHJcbiAgICAgICAgICAgIHJldHVybiByZXM7XHJcbiAgICAgICAgfSwgW10pO1xyXG4gICAgfTtcclxuXHJcbiAgICBwdWJsaWMgdW5sb2FkICgpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLmFib3J0Q3VycmVudFRhc2soKTtcclxuICAgIH07XHJcbn0iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vYmx1ZWJpcmQuZC50c1wiLz5cclxuaW1wb3J0ICogYXMgVXRpbHMgZnJvbSBcIi4vdXRpbHNcIjtcclxuXHJcbmludGVyZmFjZSBDb2xvciB7XHJcbiAgICByOiBudW1iZXI7XHJcbiAgICBnOiBudW1iZXI7XHJcbiAgICBiOiBudW1iZXI7XHJcbiAgICBhOiBudW1iZXI7XHJcbn1cclxuXHJcbmludGVyZmFjZSBJR3JvdXAge1xyXG4gICAgaWQ6IHN0cmluZztcclxuICAgIG5hbWU/OiBzdHJpbmc7XHJcbiAgICBjb2xvcj86IENvbG9yO1xyXG4gICAgcGFyZW50PzogSUdyb3VwO1xyXG4gICAgY2hpbGRyZW4/OiBJR3JvdXBbXTtcclxuICAgIHVzZXI/OiBhbnk7XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEdyb3Vwc0J1aWxkZXIge1xyXG4gICAgcHJvdGVjdGVkIGFwaTtcclxuICAgIHByb3RlY3RlZCBjdXJyZW50VGFzaztcclxuICAgIHByb3RlY3RlZCBncm91cHM6IElHcm91cFtdO1xyXG4gICAgcHJvdGVjdGVkIHRyZWU6IElHcm91cFtdO1xyXG4gICAgcHJvdGVjdGVkIGN1cnJlbnRUcmVlO1xyXG5cclxuICAgIHByaXZhdGUgdXNlcnM6IGFueTtcclxuICAgIHByaXZhdGUgY3VycmVudFVzZXJOYW1lOiBzdHJpbmc7XHJcblxyXG4gICAgY29uc3RydWN0b3IoYXBpOiBhbnkpIHtcclxuICAgICAgICB0aGlzLmFwaSA9IGFwaTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGdldEdyb3VwcyAoKTogUHJvbWlzZTxhbnk+IHtcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLmFwaS5nZXRTZXNzaW9uKChzZXNzaW9uRGF0YSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50VXNlck5hbWUgPSBzZXNzaW9uRGF0YS51c2VyTmFtZTtcclxuICAgICAgICAgICAgICAgIHRoaXMuYXBpLm11bHRpQ2FsbChbXHJcbiAgICAgICAgICAgICAgICAgICAgW1wiR2V0XCIsIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZU5hbWU6IFwiR3JvdXBcIlxyXG4gICAgICAgICAgICAgICAgICAgIH1dLFxyXG4gICAgICAgICAgICAgICAgICAgIFtcIkdldFwiLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGVOYW1lOiBcIlVzZXJcIlxyXG4gICAgICAgICAgICAgICAgICAgIH1dXHJcbiAgICAgICAgICAgICAgICBdLCByZXNvbHZlLCByZWplY3QpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgcHJpdmF0ZSBmaW5kQ2hpbGQgKGNoaWxkSWQ6IHN0cmluZywgY3VycmVudEl0ZW06IElHcm91cCwgb25BbGxMZXZlbHM6IGJvb2xlYW4gPSBmYWxzZSk6IElHcm91cCB7XHJcbiAgICAgICAgbGV0IGZvdW5kQ2hpbGQgPSBudWxsLFxyXG4gICAgICAgICAgICBjaGlsZHJlbiA9IGN1cnJlbnRJdGVtLmNoaWxkcmVuO1xyXG4gICAgICAgIGlmICghY2hpbGRJZCB8fCAhY2hpbGRyZW4gfHwgIWNoaWxkcmVuLmxlbmd0aCkge1xyXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNoaWxkcmVuLnNvbWUoY2hpbGQgPT4ge1xyXG4gICAgICAgICAgICBpZiAoY2hpbGQuaWQgPT09IGNoaWxkSWQpIHtcclxuICAgICAgICAgICAgICAgIGZvdW5kQ2hpbGQgPSBjaGlsZDtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmb3VuZENoaWxkO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgaWYgKG9uQWxsTGV2ZWxzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZm91bmRDaGlsZCA9IHRoaXMuZmluZENoaWxkKGNoaWxkSWQsIGNoaWxkLCBvbkFsbExldmVscyk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZvdW5kQ2hpbGQ7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICByZXR1cm4gZm91bmRDaGlsZDtcclxuICAgIH07XHJcblxyXG4gICAgcHJpdmF0ZSBnZXRVc2VyQnlQcml2YXRlR3JvdXBJZCAoZ3JvdXBJZDogc3RyaW5nKTogYW55IHtcclxuICAgICAgICBsZXQgb3V0cHV0VXNlciA9IG51bGwsXHJcbiAgICAgICAgICAgIHVzZXJIYXNQcml2YXRlR3JvdXAgPSAodXNlciwgZ3JvdXBJZCk6IGJvb2xlYW4gPT4ge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHVzZXIucHJpdmF0ZVVzZXJHcm91cHMuc29tZShncm91cCA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGdyb3VwLmlkID09PSBncm91cElkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIHRoaXMudXNlcnMuc29tZSh1c2VyID0+IHtcclxuICAgICAgICAgICAgaWYgKHVzZXJIYXNQcml2YXRlR3JvdXAodXNlciwgZ3JvdXBJZCkpIHtcclxuICAgICAgICAgICAgICAgIG91dHB1dFVzZXIgPSB1c2VyO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4gb3V0cHV0VXNlcjtcclxuICAgIH07XHJcblxyXG4gICAgcHJpdmF0ZSBnZXRQcml2YXRlR3JvdXBEYXRhIChncm91cElkOiBzdHJpbmcpIHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBpZDogZ3JvdXBJZCxcclxuICAgICAgICAgICAgdXNlcjogdGhpcy5nZXRVc2VyQnlQcml2YXRlR3JvdXBJZChncm91cElkKSxcclxuICAgICAgICAgICAgY2hpbGRyZW46IFtdLFxyXG4gICAgICAgICAgICBuYW1lOiBcIlByaXZhdGVVc2VyR3JvdXBOYW1lXCIsXHJcbiAgICAgICAgICAgIHBhcmVudDoge1xyXG4gICAgICAgICAgICAgICAgaWQ6IFwiR3JvdXBQcml2YXRlVXNlcklkXCIsXHJcbiAgICAgICAgICAgICAgICBjaGlsZHJlbjogW3sgaWQ6IGdyb3VwSWQgfV1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICB9O1xyXG5cclxuICAgIHByb3RlY3RlZCBjcmVhdGVHcm91cHNUcmVlIChncm91cHM6IElHcm91cFtdKTogYW55W10ge1xyXG4gICAgICAgIGxldCBub2RlTG9va3VwLFxyXG4gICAgICAgICAgICB0cmF2ZXJzZUNoaWxkcmVuID0gZnVuY3Rpb24gKG5vZGUpIHtcclxuICAgICAgICAgICAgICAgIGxldCBjaGlsZHJlbjogSUdyb3VwW10sXHJcbiAgICAgICAgICAgICAgICAgICAgaWQ6IHN0cmluZztcclxuXHJcbiAgICAgICAgICAgICAgICBjaGlsZHJlbiA9IG5vZGUuY2hpbGRyZW47XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGNoaWxkcmVuKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDAsIGlpID0gY2hpbGRyZW4ubGVuZ3RoOyBpIDwgaWk7IGkgKz0gMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZCA9IGNoaWxkcmVuW2ldLmlkO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG5vZGVMb29rdXBbaWRdKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlLmNoaWxkcmVuW2ldID0gbm9kZUxvb2t1cFtpZF07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlLmNoaWxkcmVuW2ldLnBhcmVudCA9IG5vZGU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgbm9kZUxvb2t1cFtpZF07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgdHJhdmVyc2VDaGlsZHJlbihub2RlLmNoaWxkcmVuW2ldKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgIG5vZGVMb29rdXAgPSBVdGlscy5lbnRpdHlUb0RpY3Rpb25hcnkoZ3JvdXBzLCBlbnRpdHkgPT4ge1xyXG4gICAgICAgICAgICBsZXQgbmV3RW50aXR5ID0gVXRpbHMuZXh0ZW5kKHt9LCBlbnRpdHkpO1xyXG4gICAgICAgICAgICBpZiAobmV3RW50aXR5LmNoaWxkcmVuKSB7XHJcbiAgICAgICAgICAgICAgICBuZXdFbnRpdHkuY2hpbGRyZW4gPSBuZXdFbnRpdHkuY2hpbGRyZW4uc2xpY2UoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gbmV3RW50aXR5O1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBPYmplY3Qua2V5cyhub2RlTG9va3VwKS5mb3JFYWNoKGtleSA9PiB7XHJcbiAgICAgICAgICAgIG5vZGVMb29rdXBba2V5XSAmJiB0cmF2ZXJzZUNoaWxkcmVuKG5vZGVMb29rdXBba2V5XSk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHJldHVybiBPYmplY3Qua2V5cyhub2RlTG9va3VwKS5tYXAoa2V5ID0+IHtcclxuICAgICAgICAgICAgcmV0dXJuIG5vZGVMb29rdXBba2V5XTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgcHJvdGVjdGVkIGFib3J0Q3VycmVudFRhc2sgKCk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgJiYgdGhpcy5jdXJyZW50VGFzay5hYm9ydCAmJiB0aGlzLmN1cnJlbnRUYXNrLmFib3J0KCk7XHJcbiAgICAgICAgdGhpcy5jdXJyZW50VGFzayA9IG51bGw7XHJcbiAgICB9O1xyXG5cclxuICAgIHB1YmxpYyBmZXRjaCAoKTogUHJvbWlzZTxhbnk+IHtcclxuICAgICAgICB0aGlzLmFib3J0Q3VycmVudFRhc2soKTtcclxuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrID0gdGhpcy5nZXRHcm91cHMoKVxyXG4gICAgICAgICAgICAudGhlbigoW2dyb3VwcywgdXNlcnNdKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmdyb3VwcyA9IGdyb3VwcztcclxuICAgICAgICAgICAgICAgIHRoaXMudXNlcnMgPSB1c2VycztcclxuICAgICAgICAgICAgICAgIHRoaXMudHJlZSA9IHRoaXMuY3JlYXRlR3JvdXBzVHJlZShncm91cHMpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50VHJlZSA9IFV0aWxzLmV4dGVuZCh7fSwgdGhpcy50cmVlKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZUZsYXRHcm91cHNMaXN0KHRoaXMudHJlZSk7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIC5jYXRjaChjb25zb2xlLmVycm9yKVxyXG4gICAgICAgICAgICAuZmluYWxseSgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRUYXNrID0gbnVsbDtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY3VycmVudFRhc2s7XHJcbiAgICB9O1xyXG5cclxuICAgIHB1YmxpYyBjcmVhdGVGbGF0R3JvdXBzTGlzdCAoZ3JvdXBzOiBJR3JvdXBbXSwgbm90SW5jbHVkZUNoaWxkcmVuOiBib29sZWFuID0gZmFsc2UpOiBJR3JvdXBbXSB7XHJcbiAgICAgICAgbGV0IGZvdW5kSWRzID0gW10sXHJcbiAgICAgICAgICAgIGdyb3Vwc1RvQWRkID0gW10sXHJcbiAgICAgICAgICAgIG1ha2VGbGF0UGFyZW50cyA9IChpdGVtKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBsZXQgaXRlbUNvcHkgPSBVdGlscy5leHRlbmQoe30sIGl0ZW0pO1xyXG4gICAgICAgICAgICAgICAgaWYgKGl0ZW0gJiYgaXRlbS5wYXJlbnQpIHtcclxuICAgICAgICAgICAgICAgICAgICBtYWtlRmxhdFBhcmVudHMoaXRlbS5wYXJlbnQpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaXRlbUNvcHkuY2hpbGRyZW4gPSBpdGVtQ29weS5jaGlsZHJlbi5tYXAoY2hpbGQgPT4gY2hpbGQuaWQpO1xyXG4gICAgICAgICAgICAgICAgaXRlbUNvcHkucGFyZW50ID0gaXRlbS5wYXJlbnQgPyB7aWQ6IGl0ZW0ucGFyZW50LmlkLCBuYW1lOiBpdGVtLnBhcmVudC5uYW1lfSA6IG51bGw7XHJcbiAgICAgICAgICAgICAgICBpZiAoZm91bmRJZHMuaW5kZXhPZihpdGVtLmlkKSA9PT0gLTEpIHtcclxuICAgICAgICAgICAgICAgICAgICBncm91cHNUb0FkZC5wdXNoKGl0ZW1Db3B5KTtcclxuICAgICAgICAgICAgICAgICAgICBmb3VuZElkcy5wdXNoKGl0ZW0uaWQpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBtYWtlRmxhdENoaWxkcmVuID0gKGl0ZW0pID0+IHtcclxuICAgICAgICAgICAgICAgIGlmIChpdGVtICYmIGl0ZW0uY2hpbGRyZW4gJiYgaXRlbS5jaGlsZHJlbi5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgICAgICBpdGVtLmNoaWxkcmVuLmZvckVhY2goKGNoaWxkKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBjaGlsZENvcHk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmb3VuZElkcy5pbmRleE9mKGNoaWxkLmlkKSA9PT0gLTEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1ha2VGbGF0Q2hpbGRyZW4oY2hpbGQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkQ29weSA9IFV0aWxzLmV4dGVuZCh7fSwgY2hpbGQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjaGlsZENvcHkuY2hpbGRyZW4gPSBjaGlsZENvcHkuY2hpbGRyZW4ubWFwKGNoaWxkSW5uZXIgPT4gY2hpbGRJbm5lci5pZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkQ29weS5wYXJlbnQgPSBjaGlsZENvcHkucGFyZW50ID8ge2lkOiBjaGlsZENvcHkucGFyZW50LmlkLCBuYW1lOiBjaGlsZENvcHkucGFyZW50Lm5hbWV9IDogbnVsbDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGZvdW5kSWRzLmluZGV4T2YoY2hpbGQuaWQpID09PSAtMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZ3JvdXBzVG9BZGQucHVzaChjaGlsZENvcHkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm91bmRJZHMucHVzaChjaGlsZC5pZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgZ3JvdXBzLmZvckVhY2gobWFrZUZsYXRQYXJlbnRzKTtcclxuICAgICAgICAhbm90SW5jbHVkZUNoaWxkcmVuICYmIGdyb3Vwcy5mb3JFYWNoKG1ha2VGbGF0Q2hpbGRyZW4pO1xyXG4gICAgICAgIHJldHVybiBncm91cHNUb0FkZDtcclxuICAgIH07XHJcblxyXG4gICAgcHVibGljIGdldEdyb3Vwc0RhdGEgKGdyb3VwSWRzOiBzdHJpbmdbXSwgbm90SW5jbHVkZUNoaWxkcmVuOiBib29sZWFuID0gZmFsc2UpOiBJR3JvdXBbXSB7XHJcbiAgICAgICAgbGV0IHRyZWVHcm91cHMgPSBncm91cElkcy5tYXAoZ3JvdXBJZCA9PlxyXG4gICAgICAgICAgICB0aGlzLmZpbmRDaGlsZChncm91cElkLCB7aWQ6IG51bGwsIGNoaWxkcmVuOiB0aGlzLnRyZWV9LCB0cnVlKSB8fCB0aGlzLmdldFByaXZhdGVHcm91cERhdGEoZ3JvdXBJZClcclxuICAgICAgICApO1xyXG4gICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZUZsYXRHcm91cHNMaXN0KHRyZWVHcm91cHMsIG5vdEluY2x1ZGVDaGlsZHJlbik7XHJcbiAgICB9O1xyXG5cclxuICAgIHB1YmxpYyBnZXRDdXN0b21Hcm91cHNEYXRhIChncm91cElkczogc3RyaW5nW10sIGFsbEdyb3VwczogSUdyb3VwW10pOiBJR3JvdXBbXSB7XHJcbiAgICAgICAgbGV0IGdyb3Vwc1RyZWUgPSB0aGlzLmNyZWF0ZUdyb3Vwc1RyZWUoYWxsR3JvdXBzKSxcclxuICAgICAgICAgICAgdHJlZUdyb3VwcyA9IGdyb3VwSWRzLm1hcChncm91cElkID0+IFxyXG4gICAgICAgICAgICAgICAgdGhpcy5maW5kQ2hpbGQoZ3JvdXBJZCwge2lkOiBudWxsLCBjaGlsZHJlbjogZ3JvdXBzVHJlZX0sIHRydWUpIHx8IHRoaXMuZ2V0UHJpdmF0ZUdyb3VwRGF0YShncm91cElkKVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZUZsYXRHcm91cHNMaXN0KHRyZWVHcm91cHMsIHRydWUpO1xyXG4gICAgfTtcclxuXHJcbiAgICBwdWJsaWMgZ2V0UHJpdmF0ZUdyb3Vwc1VzZXJzKGdyb3VwczogSUdyb3VwW10pIHtcclxuICAgICAgICByZXR1cm4gZ3JvdXBzLnJlZHVjZSgodXNlcnMsIGdyb3VwKSA9PiB7XHJcbiAgICAgICAgICAgIGdyb3VwLnVzZXIgJiYgZ3JvdXAudXNlci5uYW1lICE9PSB0aGlzLmN1cnJlbnRVc2VyTmFtZSAmJiB1c2Vycy5wdXNoKGdyb3VwLnVzZXIpO1xyXG4gICAgICAgICAgICByZXR1cm4gdXNlcnM7XHJcbiAgICAgICAgfSwgW10pO1xyXG4gICAgfTtcclxuXHJcbiAgICBwdWJsaWMgdW5sb2FkICgpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLmFib3J0Q3VycmVudFRhc2soKTtcclxuICAgIH07XHJcbn0iLCJpbXBvcnQgeyBlbnRpdHlUb0RpY3Rpb25hcnkgfSBmcm9tIFwiLi91dGlsc1wiO1xyXG5cclxudHlwZSBUTWFwUHJvdmlkZXJUeXBlID0gXCJkZWZhdWx0XCIgfCBcImFkZGl0aW9uYWxcIiB8IFwiY3VzdG9tXCI7XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIElNaXNjRGF0YSB7XHJcbiAgICBtYXBQcm92aWRlcjoge1xyXG4gICAgICAgIHZhbHVlOiBzdHJpbmc7XHJcbiAgICAgICAgdHlwZTogVE1hcFByb3ZpZGVyVHlwZTtcclxuICAgIH07XHJcbiAgICBjdXJyZW50VXNlcjogYW55O1xyXG4gICAgaXNVbnNpZ25lZEFkZGluc0FsbG93ZWQ6IGJvb2xlYW47XHJcbiAgICBhZGRpbnM6IHN0cmluZ1tdO1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgTWlzY0J1aWxkZXIge1xyXG4gICAgcHJpdmF0ZSByZWFkb25seSBhcGk7XHJcbiAgICBwcml2YXRlIGN1c3RvbU1hcFByb3ZpZGVycztcclxuICAgIHByaXZhdGUgY3VycmVudFRhc2s7XHJcbiAgICBwcml2YXRlIGN1cnJlbnRVc2VyO1xyXG4gICAgcHJpdmF0ZSBpc1Vuc2lnbmVkQWRkaW5zQWxsb3dlZDtcclxuICAgIHByaXZhdGUgYWRkaW5zOiBzdHJpbmdbXTtcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgZGVmYXVsdE1hcFByb3ZpZGVycyA9IHtcclxuICAgICAgICBHb29nbGVNYXBzOiBcIkdvb2dsZSBNYXBzXCIsXHJcbiAgICAgICAgSGVyZTogXCJIRVJFIE1hcHNcIixcclxuICAgICAgICBNYXBCb3g6IFwiTWFwQm94XCJcclxuICAgIH07XHJcblxyXG4gICAgcHJpdmF0ZSBhYm9ydEN1cnJlbnRUYXNrICgpIHtcclxuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrICYmIHRoaXMuY3VycmVudFRhc2suYWJvcnQgJiYgdGhpcy5jdXJyZW50VGFzay5hYm9ydCgpO1xyXG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgPSBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgZ2V0QWxsb3dlZEFkZGlucyAoYWxsQWRkaW5zOiBzdHJpbmdbXSkge1xyXG4gICAgICAgIHJldHVybiBhbGxBZGRpbnMuZmlsdGVyKGFkZGluID0+IHtcclxuICAgICAgICAgICAgbGV0IGFkZGluQ29uZmlnID0gSlNPTi5wYXJzZShhZGRpbik7XHJcbiAgICAgICAgICAgIHJldHVybiBhZGRpbkNvbmZpZyAmJiBBcnJheS5pc0FycmF5KGFkZGluQ29uZmlnLml0ZW1zKSAmJiBhZGRpbkNvbmZpZy5pdGVtcy5ldmVyeShpdGVtID0+IHtcclxuICAgICAgICAgICAgICAgIGxldCB1cmwgPSBpdGVtLnVybDtcclxuICAgICAgICAgICAgICAgIHJldHVybiB1cmwgJiYgdXJsLmluZGV4T2YoXCJcXC9cXC9cIikgPiAtMTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBpc0N1cnJlbnRBZGRpbiAoYWRkaW46IHN0cmluZykge1xyXG4gICAgICAgIHJldHVybiBhZGRpbi5pbmRleE9mKFwiUmVnaXN0cmF0aW9uIGNvbmZpZ1wiKSA+IC0xO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0cnVjdG9yKGFwaSkge1xyXG4gICAgICAgIHRoaXMuYXBpID0gYXBpO1xyXG4gICAgfVxyXG5cclxuICAgIGZldGNoICgpOiBQcm9taXNlPElNaXNjRGF0YT4ge1xyXG4gICAgICAgIHRoaXMuYWJvcnRDdXJyZW50VGFzaygpO1xyXG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuYXBpLmdldFNlc3Npb24oKHNlc3Npb25EYXRhKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBsZXQgdXNlck5hbWUgPSBzZXNzaW9uRGF0YS51c2VyTmFtZTtcclxuICAgICAgICAgICAgICAgIHRoaXMuYXBpLm11bHRpQ2FsbChbXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFtcIkdldFwiLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlTmFtZTogXCJVc2VyXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWFyY2g6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiB1c2VyTmFtZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgW1wiR2V0XCIsIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGVOYW1lOiBcIlN5c3RlbVNldHRpbmdzXCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgfV1cclxuICAgICAgICAgICAgICAgICAgICBdLCByZXNvbHZlLCByZWplY3QpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KS50aGVuKChyZXN1bHQpID0+IHtcclxuICAgICAgICAgICAgbGV0IGN1cnJlbnRVc2VyID0gcmVzdWx0WzBdWzBdIHx8IHJlc3VsdFswXSxcclxuICAgICAgICAgICAgICAgIHN5c3RlbVNldHRpbmdzID0gcmVzdWx0WzFdWzBdIHx8IHJlc3VsdFsxXSxcclxuICAgICAgICAgICAgICAgIHVzZXJNYXBQcm92aWRlcklkID0gY3VycmVudFVzZXIuZGVmYXVsdE1hcEVuZ2luZSxcclxuICAgICAgICAgICAgICAgIGRlZmF1bHRNYXBQcm92aWRlcklkID0gc3lzdGVtU2V0dGluZ3MubWFwUHJvdmlkZXIsXHJcbiAgICAgICAgICAgICAgICBtYXBQcm92aWRlcklkID0gdGhpcy5nZXRNYXBQcm92aWRlclR5cGUodXNlck1hcFByb3ZpZGVySWQpID09PSBcImN1c3RvbVwiID8gdXNlck1hcFByb3ZpZGVySWQgOiBkZWZhdWx0TWFwUHJvdmlkZXJJZDtcclxuICAgICAgICAgICAgdGhpcy5jdXJyZW50VXNlciA9IGN1cnJlbnRVc2VyO1xyXG4gICAgICAgICAgICB0aGlzLmN1c3RvbU1hcFByb3ZpZGVycyA9IGVudGl0eVRvRGljdGlvbmFyeShzeXN0ZW1TZXR0aW5ncy5jdXN0b21XZWJNYXBQcm92aWRlckxpc3QpO1xyXG4gICAgICAgICAgICB0aGlzLmlzVW5zaWduZWRBZGRpbnNBbGxvd2VkID0gc3lzdGVtU2V0dGluZ3MuYWxsb3dVbnNpZ25lZEFkZEluO1xyXG4gICAgICAgICAgICB0aGlzLmFkZGlucyA9IHRoaXMuZ2V0QWxsb3dlZEFkZGlucyhzeXN0ZW1TZXR0aW5ncy5jdXN0b21lclBhZ2VzKTtcclxuICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgIG1hcFByb3ZpZGVyOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IG1hcFByb3ZpZGVySWQsXHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogdGhpcy5nZXRNYXBQcm92aWRlclR5cGUobWFwUHJvdmlkZXJJZClcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBjdXJyZW50VXNlcjogdGhpcy5jdXJyZW50VXNlcixcclxuICAgICAgICAgICAgICAgIGlzVW5zaWduZWRBZGRpbnNBbGxvd2VkOiB0aGlzLmlzVW5zaWduZWRBZGRpbnNBbGxvd2VkLFxyXG4gICAgICAgICAgICAgICAgYWRkaW5zOiB0aGlzLmFkZGluc1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiB0aGlzLmN1cnJlbnRUYXNrO1xyXG4gICAgfVxyXG5cclxuICAgIGdldE1hcFByb3ZpZGVyVHlwZSAobWFwUHJvdmlkZXJJZDogc3RyaW5nKTogVE1hcFByb3ZpZGVyVHlwZSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZGVmYXVsdE1hcFByb3ZpZGVyc1ttYXBQcm92aWRlcklkXSA/IFwiZGVmYXVsdFwiIDogXCJjdXN0b21cIjtcclxuICAgIH1cclxuXHJcbiAgICBnZXRNYXBQcm92aWRlck5hbWUgKG1hcFByb3ZpZGVySWQ6IHN0cmluZyk6IHN0cmluZyB7XHJcbiAgICAgICAgcmV0dXJuIG1hcFByb3ZpZGVySWQgJiYgKHRoaXMuZGVmYXVsdE1hcFByb3ZpZGVyc1ttYXBQcm92aWRlcklkXSB8fCAodGhpcy5jdXN0b21NYXBQcm92aWRlcnNbbWFwUHJvdmlkZXJJZF0gJiYgdGhpcy5jdXN0b21NYXBQcm92aWRlcnNbbWFwUHJvdmlkZXJJZF0ubmFtZSkgfHwgbWFwUHJvdmlkZXJJZCk7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0TWFwUHJvdmlkZXJEYXRhIChtYXBQcm92aWRlcklkOiBzdHJpbmcpIHtcclxuICAgICAgICByZXR1cm4gbWFwUHJvdmlkZXJJZCAmJiB0aGlzLmN1c3RvbU1hcFByb3ZpZGVyc1ttYXBQcm92aWRlcklkXTtcclxuICAgIH1cclxuXHJcbiAgICBpc1RoaXNBZGRpbkluY2x1ZGVkICgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5hZGRpbnMuc29tZSh0aGlzLmlzQ3VycmVudEFkZGluKTtcclxuICAgIH1cclxuXHJcbiAgICBnZXRBZGRpbnNEYXRhIChpbmNsdWRlVGhpc0FkZGluID0gdHJ1ZSkge1xyXG4gICAgICAgIHJldHVybiAhaW5jbHVkZVRoaXNBZGRpbiA/IHRoaXMuYWRkaW5zLmZpbHRlcihhZGRpbiA9PiAhdGhpcy5pc0N1cnJlbnRBZGRpbihhZGRpbikpIDogdGhpcy5hZGRpbnM7XHJcbiAgICB9XHJcblxyXG4gICAgdW5sb2FkICgpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLmFib3J0Q3VycmVudFRhc2soKTtcclxuICAgIH1cclxufSIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi9ibHVlYmlyZC5kLnRzXCIvPlxyXG5pbXBvcnQgKiBhcyBVdGlscyBmcm9tIFwiLi91dGlsc1wiO1xyXG5cclxuY29uc3QgUkVQT1JUX1RZUEVfREFTSEJPQUQgPSBcIkRhc2hib2FyZFwiO1xyXG5cclxuaW50ZXJmYWNlIElSZXBvcnQge1xyXG4gICAgaWQ6IHN0cmluZztcclxuICAgIGdyb3VwczogSUdyb3VwW107XHJcbiAgICBpbmNsdWRlQWxsQ2hpbGRyZW5Hcm91cHM6IElHcm91cFtdO1xyXG4gICAgaW5jbHVkZURpcmVjdENoaWxkcmVuT25seUdyb3VwczogSUdyb3VwW107XHJcbiAgICBzY29wZUdyb3VwczogSUdyb3VwW107XHJcbiAgICBkZXN0aW5hdGlvbj86IHN0cmluZztcclxuICAgIHRlbXBsYXRlOiBJUmVwb3J0VGVtcGxhdGU7XHJcbiAgICBsYXN0TW9kaWZpZWRVc2VyO1xyXG4gICAgYXJndW1lbnRzOiB7XHJcbiAgICAgICAgcnVsZXM/OiBhbnlbXTtcclxuICAgICAgICBkZXZpY2VzPzogYW55W107XHJcbiAgICAgICAgem9uZVR5cGVMaXN0PzogYW55W107XHJcbiAgICAgICAgW3Byb3BOYW1lOiBzdHJpbmddOiBhbnk7XHJcbiAgICB9O1xyXG4gICAgW3Byb3BOYW1lOiBzdHJpbmddOiBhbnk7XHJcbn1cclxuXHJcbmludGVyZmFjZSBJR3JvdXAge1xyXG4gICAgaWQ6IHN0cmluZztcclxuICAgIGNoaWxkcmVuOiBJR3JvdXBbXTtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBJUmVwb3J0RGVwZW5kZW5jaWVzIHtcclxuICAgIGRldmljZXM/OiBzdHJpbmdbXTtcclxuICAgIHJ1bGVzPzogc3RyaW5nW107XHJcbiAgICB6b25lVHlwZXM/OiBzdHJpbmdbXTtcclxuICAgIGdyb3Vwcz86IHN0cmluZ1tdO1xyXG59XHJcblxyXG5pbnRlcmZhY2UgSVJlcG9ydFRlbXBsYXRlIHtcclxuICAgIGlkOiBzdHJpbmc7XHJcbiAgICBuYW1lOiBzdHJpbmc7XHJcbiAgICBpc1N5c3RlbTogYm9vbGVhbjtcclxuICAgIHJlcG9ydERhdGFTb3VyY2U6IHN0cmluZztcclxuICAgIHJlcG9ydFRlbXBsYXRlVHlwZTogc3RyaW5nO1xyXG4gICAgcmVwb3J0czogSVJlcG9ydFtdO1xyXG4gICAgYmluYXJ5RGF0YT86IHN0cmluZztcclxuICAgIFtwcm9wTmFtZTogc3RyaW5nXTogYW55O1xyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBSZXBvcnRzQnVpbGRlciB7XHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IGFwaTtcclxuICAgIHByaXZhdGUgY3VycmVudFRhc2s7XHJcbiAgICBwcml2YXRlIGFsbFJlcG9ydHM6IElSZXBvcnRbXTtcclxuICAgIHByaXZhdGUgc3RydWN0dXJlZFJlcG9ydHM7XHJcbiAgICBwcml2YXRlIGRhc2hib2FyZHNMZW5ndGg6IG51bWJlcjtcclxuICAgIHByaXZhdGUgYWxsVGVtcGxhdGVzOiBJUmVwb3J0VGVtcGxhdGVbXTtcclxuXHJcbiAgICBwcml2YXRlIGdldFJlcG9ydHMgKCk6IFByb21pc2U8YW55PiB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5hcGkubXVsdGlDYWxsKFtcclxuICAgICAgICAgICAgICAgIFtcIkdldFJlcG9ydFNjaGVkdWxlc1wiLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgXCJpbmNsdWRlVGVtcGxhdGVEZXRhaWxzXCI6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJhcHBseVVzZXJGaWx0ZXJcIjogZmFsc2VcclxuICAgICAgICAgICAgICAgIH1dLFxyXG4gICAgICAgICAgICAgICAgW1wiR2V0XCIsIHtcclxuICAgICAgICAgICAgICAgICAgICBcInR5cGVOYW1lXCI6IFwiUmVwb3J0VGVtcGxhdGVcIixcclxuICAgICAgICAgICAgICAgICAgICBcInNlYXJjaFwiOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGluY2x1ZGVCaW5hcnlEYXRhOiBmYWxzZVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1dLFxyXG4gICAgICAgICAgICAgICAgW1wiR2V0RGFzaGJvYXJkSXRlbXNcIiwge31dXHJcbiAgICAgICAgICAgIF0sIHJlc29sdmUsIHJlamVjdCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBzdHJ1Y3R1cmVSZXBvcnRzIChyZXBvcnRzLCB0ZW1wbGF0ZXMpIHtcclxuICAgICAgICBsZXQgZmluZFRlbXBsYXRlUmVwb3J0cyA9ICh0ZW1wbGF0ZUlkKSA9PiB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVwb3J0cy5maWx0ZXIocmVwb3J0ID0+IHJlcG9ydC50ZW1wbGF0ZS5pZCA9PT0gdGVtcGxhdGVJZCk7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgcmV0dXJuIHRlbXBsYXRlcy5yZWR1Y2UoKHJlcywgdGVtcGxhdGUpID0+IHtcclxuICAgICAgICAgICAgbGV0IHRlbXBsYXRlSWQgPSB0ZW1wbGF0ZS5pZCxcclxuICAgICAgICAgICAgICAgIHRlbXBsYXRlUmVwb3J0cyA9IGZpbmRUZW1wbGF0ZVJlcG9ydHModGVtcGxhdGVJZCk7XHJcbiAgICAgICAgICAgIGlmICh0ZW1wbGF0ZVJlcG9ydHMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZS5yZXBvcnRzID0gdGVtcGxhdGVSZXBvcnRzO1xyXG4gICAgICAgICAgICAgICAgcmVzLnB1c2godGVtcGxhdGUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiByZXM7XHJcbiAgICAgICAgfSwgW10pO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYWJvcnRDdXJyZW50VGFzayAoKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5jdXJyZW50VGFzayAmJiB0aGlzLmN1cnJlbnRUYXNrLmFib3J0ICYmIHRoaXMuY3VycmVudFRhc2suYWJvcnQoKTtcclxuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrID0gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHVwZGF0ZVRlbXBsYXRlIChuZXdUZW1wbGF0ZURhdGE6IElSZXBvcnRUZW1wbGF0ZSkge1xyXG4gICAgICAgIHRoaXMuYWxsVGVtcGxhdGVzLnNvbWUoKHRlbXBsYXRlRGF0YTogSVJlcG9ydFRlbXBsYXRlLCBpbmRleDogbnVtYmVyKSA9PiB7XHJcbiAgICAgICAgICAgIGlmICh0ZW1wbGF0ZURhdGEuaWQgPT09IG5ld1RlbXBsYXRlRGF0YS5pZCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hbGxUZW1wbGF0ZXNbaW5kZXhdID0gbmV3VGVtcGxhdGVEYXRhO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0cnVjdG9yKGFwaSkge1xyXG4gICAgICAgIHRoaXMuYXBpID0gYXBpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBmZXRjaCAoKTogUHJvbWlzZTxhbnk+IHtcclxuICAgICAgICB0aGlzLmFib3J0Q3VycmVudFRhc2soKTtcclxuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrID0gdGhpcy5nZXRSZXBvcnRzKClcclxuICAgICAgICAgICAgLnRoZW4oKFtyZXBvcnRzLCB0ZW1wbGF0ZXMsIGRhc2hib2FyZEl0ZW1zXSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hbGxSZXBvcnRzID0gcmVwb3J0cztcclxuICAgICAgICAgICAgICAgIHRoaXMuYWxsVGVtcGxhdGVzID0gdGVtcGxhdGVzO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5kYXNoYm9hcmRzTGVuZ3RoID0gZGFzaGJvYXJkSXRlbXMgJiYgZGFzaGJvYXJkSXRlbXMubGVuZ3RoID8gZGFzaGJvYXJkSXRlbXMubGVuZ3RoIDogMDtcclxuICAgICAgICAgICAgICAgIHRoaXMuc3RydWN0dXJlZFJlcG9ydHMgPSB0aGlzLnN0cnVjdHVyZVJlcG9ydHMocmVwb3J0cywgdGVtcGxhdGVzKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnN0cnVjdHVyZWRSZXBvcnRzO1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAuY2F0Y2goY29uc29sZS5lcnJvcilcclxuICAgICAgICAgICAgLmZpbmFsbHkoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50VGFzayA9IG51bGw7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiB0aGlzLmN1cnJlbnRUYXNrO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXREZXBlbmRlbmNpZXMgKHJlcG9ydHM6IElSZXBvcnRUZW1wbGF0ZVtdKTogSVJlcG9ydERlcGVuZGVuY2llcyB7XHJcbiAgICAgICAgbGV0IGFsbERlcGVuZGVuY2llczogSVJlcG9ydERlcGVuZGVuY2llcyA9IHtcclxuICAgICAgICAgICAgICAgIGRldmljZXM6IFtdLFxyXG4gICAgICAgICAgICAgICAgcnVsZXM6IFtdLFxyXG4gICAgICAgICAgICAgICAgem9uZVR5cGVzOiBbXSxcclxuICAgICAgICAgICAgICAgIGdyb3VwczogW11cclxuICAgICAgICAgICAgfTtcclxuICAgICAgICByZXR1cm4gcmVwb3J0cy5yZWR1Y2UoKHJlcG9ydHNEZXBlbmRlbmNpZXM6IElSZXBvcnREZXBlbmRlbmNpZXMsIHRlbXBsYXRlOiBJUmVwb3J0VGVtcGxhdGUpID0+IHtcclxuICAgICAgICAgICAgcmV0dXJuIHRlbXBsYXRlLnJlcG9ydHMucmVkdWNlKCh0ZW1wbGF0ZURlcGVuZGVjaWVzLCByZXBvcnQpID0+IHtcclxuICAgICAgICAgICAgICAgIHRlbXBsYXRlRGVwZW5kZWNpZXMuZ3JvdXBzID0gVXRpbHMubWVyZ2VVbmlxdWUodGVtcGxhdGVEZXBlbmRlY2llcy5ncm91cHMsIFV0aWxzLmdldEVudGl0aWVzSWRzKHJlcG9ydC5ncm91cHMpLFxyXG4gICAgICAgICAgICAgICAgICAgIFV0aWxzLmdldEVudGl0aWVzSWRzKHJlcG9ydC5pbmNsdWRlQWxsQ2hpbGRyZW5Hcm91cHMpLCBVdGlscy5nZXRFbnRpdGllc0lkcyhyZXBvcnQuaW5jbHVkZURpcmVjdENoaWxkcmVuT25seUdyb3VwcyksXHJcbiAgICAgICAgICAgICAgICAgICAgVXRpbHMuZ2V0RW50aXRpZXNJZHMocmVwb3J0LnNjb3BlR3JvdXBzKSk7XHJcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZURlcGVuZGVjaWVzLmRldmljZXMgPSBVdGlscy5tZXJnZVVuaXF1ZSh0ZW1wbGF0ZURlcGVuZGVjaWVzLmRldmljZXMsIHJlcG9ydC5hcmd1bWVudHMgJiYgcmVwb3J0LmFyZ3VtZW50cy5kZXZpY2VzICYmIFV0aWxzLmdldEVudGl0aWVzSWRzKHJlcG9ydC5hcmd1bWVudHMuZGV2aWNlcykgfHwgW10pO1xyXG4gICAgICAgICAgICAgICAgdGVtcGxhdGVEZXBlbmRlY2llcy5ydWxlcyA9IFV0aWxzLm1lcmdlVW5pcXVlKHRlbXBsYXRlRGVwZW5kZWNpZXMucnVsZXMsIHJlcG9ydC5hcmd1bWVudHMgJiYgcmVwb3J0LmFyZ3VtZW50cy5ydWxlcyAmJiBVdGlscy5nZXRFbnRpdGllc0lkcyhyZXBvcnQuYXJndW1lbnRzLnJ1bGVzKSB8fCBbXSk7XHJcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZURlcGVuZGVjaWVzLnpvbmVUeXBlcyA9IFV0aWxzLm1lcmdlVW5pcXVlKFxyXG4gICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlRGVwZW5kZWNpZXMuem9uZVR5cGVzLCByZXBvcnQuYXJndW1lbnRzICYmIHJlcG9ydC5hcmd1bWVudHMuem9uZVR5cGVMaXN0ICYmIFV0aWxzLmdldEVudGl0aWVzSWRzKHJlcG9ydC5hcmd1bWVudHMuem9uZVR5cGVMaXN0KSB8fCBbXSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGVtcGxhdGVEZXBlbmRlY2llcztcclxuICAgICAgICAgICAgfSwgcmVwb3J0c0RlcGVuZGVuY2llcyk7XHJcbiAgICAgICAgfSwgYWxsRGVwZW5kZW5jaWVzKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0RGF0YSAoKTogUHJvbWlzZTxJUmVwb3J0VGVtcGxhdGVbXT4ge1xyXG4gICAgICAgIGxldCBwb3J0aW9uU2l6ZSA9IDE1LFxyXG4gICAgICAgICAgICBwb3J0aW9ucyA9IHRoaXMuYWxsVGVtcGxhdGVzLnJlZHVjZSgocmVxdWVzdHMsIHRlbXBsYXRlOiBJUmVwb3J0VGVtcGxhdGUpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmICghdGVtcGxhdGUuaXNTeXN0ZW0gJiYgIXRlbXBsYXRlLmJpbmFyeURhdGEpIHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgcG9ydGlvbkluZGV4OiBudW1iZXIgPSByZXF1ZXN0cy5sZW5ndGggLSAxO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghcmVxdWVzdHNbcG9ydGlvbkluZGV4XSB8fCByZXF1ZXN0c1twb3J0aW9uSW5kZXhdLmxlbmd0aCA+PSBwb3J0aW9uU2l6ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgIHJlcXVlc3RzLnB1c2goW10pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgIHBvcnRpb25JbmRleCArKztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWVzdHNbcG9ydGlvbkluZGV4XS5wdXNoKFtcIkdldFwiLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwidHlwZU5hbWVcIjogXCJSZXBvcnRUZW1wbGF0ZVwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBcInNlYXJjaFwiOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZDogdGVtcGxhdGUuaWQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmNsdWRlQmluYXJ5RGF0YTogdHJ1ZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfV0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlcXVlc3RzO1xyXG4gICAgICAgICAgICB9LCBbXSksXHJcbiAgICAgICAgICAgIHRvdGFsUmVzdWx0czogYW55W11bXSA9IFtdLFxyXG4gICAgICAgICAgICBnZXRQb3J0aW9uRGF0YSA9IHBvcnRpb24gPT4ge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPGFueT4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYXBpLm11bHRpQ2FsbChwb3J0aW9uLCByZXNvbHZlLCByZWplY3QpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGVycm9yUG9ydGlvbnMgPSBbXTtcclxuXHJcbiAgICAgICAgdGhpcy5hYm9ydEN1cnJlbnRUYXNrKCk7XHJcbiAgICAgICAgdGhpcy5jdXJyZW50VGFzayA9IHBvcnRpb25zLnJlZHVjZSgocHJvbWlzZXMsIHBvcnRpb24pID0+IHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBwcm9taXNlc1xyXG4gICAgICAgICAgICAgICAgICAgIC50aGVuKCgpID0+IGdldFBvcnRpb25EYXRhKHBvcnRpb24pKVxyXG4gICAgICAgICAgICAgICAgICAgIC50aGVuKHJlc3VsdCA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b3RhbFJlc3VsdHMgPSB0b3RhbFJlc3VsdHMuY29uY2F0KHJlc3VsdCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sIGUgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3JQb3J0aW9ucyA9IGVycm9yUG9ydGlvbnMuY29uY2F0KHBvcnRpb24pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIH0sIFV0aWxzLnJlc29sdmVkUHJvbWlzZShbXSkpXHJcbiAgICAgICAgICAgIC50aGVuKCgpID0+IHtcclxuICAgICAgICAgICAgICAgIGVycm9yUG9ydGlvbnMubGVuZ3RoICYmIGNvbnNvbGUud2FybihlcnJvclBvcnRpb25zKTtcclxuICAgICAgICAgICAgICAgIHRvdGFsUmVzdWx0cy5mb3JFYWNoKHRlbXBsYXRlRGF0YSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHRlbXBsYXRlOiBJUmVwb3J0VGVtcGxhdGUgPSB0ZW1wbGF0ZURhdGEubGVuZ3RoID8gdGVtcGxhdGVEYXRhWzBdIDogdGVtcGxhdGVEYXRhO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlVGVtcGxhdGUodGVtcGxhdGUpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnN0cnVjdHVyZWRSZXBvcnRzID0gdGhpcy5zdHJ1Y3R1cmVSZXBvcnRzKHRoaXMuYWxsUmVwb3J0cywgdGhpcy5hbGxUZW1wbGF0ZXMpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuc3RydWN0dXJlZFJlcG9ydHM7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIC5jYXRjaChjb25zb2xlLmVycm9yKVxyXG4gICAgICAgICAgICAuZmluYWxseSgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRUYXNrID0gbnVsbDtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY3VycmVudFRhc2s7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldERhc2hib2FyZHNRdHkgKCk6IG51bWJlciB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZGFzaGJvYXJkc0xlbmd0aDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0Q3VzdG9taXplZFJlcG9ydHNRdHkgKCk6IG51bWJlciB7XHJcbiAgICAgICAgbGV0IHRlbXBsYXRlcyA9IFtdO1xyXG4gICAgICAgIHJldHVybiAodGhpcy5hbGxSZXBvcnRzLmZpbHRlcigocmVwb3J0OiBJUmVwb3J0KSA9PiB7XHJcbiAgICAgICAgICAgIGxldCB0ZW1wbGF0ZUlkID0gcmVwb3J0LnRlbXBsYXRlLmlkLFxyXG4gICAgICAgICAgICAgICAgdGVtcGxhdGVFeGlzdHM6IGJvb2xlYW4gPSB0ZW1wbGF0ZXMuaW5kZXhPZih0ZW1wbGF0ZUlkKSA+IC0xLFxyXG4gICAgICAgICAgICAgICAgaXNDb3VudDogYm9vbGVhbiA9ICF0ZW1wbGF0ZUV4aXN0cyAmJiByZXBvcnQubGFzdE1vZGlmaWVkVXNlciAhPT0gXCJOb1VzZXJJZFwiO1xyXG4gICAgICAgICAgICBpc0NvdW50ICYmIHRlbXBsYXRlcy5wdXNoKHRlbXBsYXRlSWQpO1xyXG4gICAgICAgICAgICByZXR1cm4gaXNDb3VudDtcclxuICAgICAgICB9KSkubGVuZ3RoO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyB1bmxvYWQgKCk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMuYWJvcnRDdXJyZW50VGFzaygpO1xyXG4gICAgfVxyXG59IiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uL2JsdWViaXJkLmQudHNcIi8+XHJcbmltcG9ydCB7IHNvcnRBcnJheU9mRW50aXRpZXMsIGVudGl0eVRvRGljdGlvbmFyeSwgbWVyZ2VVbmlxdWUgfSBmcm9tIFwiLi91dGlsc1wiO1xyXG5cclxuaW50ZXJmYWNlIElSdWxlIHtcclxuICAgIGlkOiBzdHJpbmc7XHJcbiAgICBncm91cHM6IGFueVtdO1xyXG4gICAgY29uZGl0aW9uOiBhbnk7XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgSVJ1bGVEZXBlbmRlbmNpZXMge1xyXG4gICAgZGV2aWNlcz86IGFueVtdO1xyXG4gICAgdXNlcnM/OiBhbnlbXTtcclxuICAgIHpvbmVzPzogYW55W107XHJcbiAgICB6b25lVHlwZXM/OiBhbnlbXTtcclxuICAgIHdvcmtUaW1lcz86IGFueVtdO1xyXG4gICAgd29ya0hvbGlkYXlzPzogYW55W107XHJcbiAgICBncm91cHM/OiBhbnlbXTtcclxuICAgIHNlY3VyaXR5R3JvdXBzPzogYW55W107XHJcbiAgICBkaWFnbm9zdGljcz86IGFueVtdO1xyXG59XHJcblxyXG5jb25zdCBBUFBMSUNBVElPTl9SVUxFX0lEID0gXCJSdWxlQXBwbGljYXRpb25FeGNlcHRpb25JZFwiO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgUnVsZXNCdWlsZGVyIHtcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgYXBpO1xyXG4gICAgcHJpdmF0ZSBjdXJyZW50VGFzaztcclxuICAgIHByaXZhdGUgY29tYmluZWRSdWxlcztcclxuICAgIHByaXZhdGUgc3RydWN0dXJlZFJ1bGVzO1xyXG5cclxuICAgIHByaXZhdGUgZ2V0UnVsZXMgKCk6IFByb21pc2U8YW55PiB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5hcGkuY2FsbChcIkdldFwiLCB7XHJcbiAgICAgICAgICAgICAgICBcInR5cGVOYW1lXCI6IFwiUnVsZVwiXHJcbiAgICAgICAgICAgIH0sIHJlc29sdmUsIHJlamVjdCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBzdHJ1Y3R1cmVSdWxlcyAocnVsZXMpIHtcclxuICAgICAgICByZXR1cm4gc29ydEFycmF5T2ZFbnRpdGllcyhydWxlcywgW1tcImJhc2VUeXBlXCIsIFwiZGVzY1wiXSwgXCJuYW1lXCJdKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFib3J0Q3VycmVudFRhc2sgKCk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgJiYgdGhpcy5jdXJyZW50VGFzay5hYm9ydCAmJiB0aGlzLmN1cnJlbnRUYXNrLmFib3J0KCk7XHJcbiAgICAgICAgdGhpcy5jdXJyZW50VGFzayA9IG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3RydWN0b3IoYXBpKSB7XHJcbiAgICAgICAgdGhpcy5hcGkgPSBhcGk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldERlcGVuZGVuY2llcyAocnVsZXMpOiBJUnVsZURlcGVuZGVuY2llcyB7XHJcbiAgICAgICAgbGV0IGRlcGVuZGVuY2llcyA9IHtcclxuICAgICAgICAgICAgICAgIGRldmljZXM6IFtdLFxyXG4gICAgICAgICAgICAgICAgdXNlcnM6IFtdLFxyXG4gICAgICAgICAgICAgICAgem9uZXM6IFtdLFxyXG4gICAgICAgICAgICAgICAgem9uZVR5cGVzOiBbXSxcclxuICAgICAgICAgICAgICAgIHdvcmtUaW1lczogW10sXHJcbiAgICAgICAgICAgICAgICBncm91cHM6IFtdLFxyXG4gICAgICAgICAgICAgICAgZGlhZ25vc3RpY3M6IFtdXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHByb2Nlc3NEZXBlbmRlbmNpZXMgPSAoY29uZGl0aW9uKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBsZXQgaWQsIHR5cGU6IHN0cmluZztcclxuICAgICAgICAgICAgICAgIHN3aXRjaCAoY29uZGl0aW9uLmNvbmRpdGlvblR5cGUpIHtcclxuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiUnVsZVdvcmtIb3Vyc1wiOlxyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJBZnRlclJ1bGVXb3JrSG91cnNcIjpcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWQgPSAoY29uZGl0aW9uLndvcmtUaW1lICYmIGNvbmRpdGlvbi53b3JrVGltZS5pZCkgfHwgY29uZGl0aW9uLndvcmtUaW1lO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlID0gXCJ3b3JrVGltZXNcIjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIkRyaXZlclwiOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZCA9IGNvbmRpdGlvbi5kcml2ZXIgJiYgY29uZGl0aW9uLmRyaXZlci5pZDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZSA9IFwidXNlcnNcIjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIkRldmljZVwiOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZCA9IGNvbmRpdGlvbi5kZXZpY2UgJiYgY29uZGl0aW9uLmRldmljZS5pZDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZSA9IFwiZGV2aWNlc1wiO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiRW50ZXJpbmdBcmVhXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIkV4aXRpbmdBcmVhXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIk91dHNpZGVBcmVhXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIkluc2lkZUFyZWFcIjpcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNvbmRpdGlvbi56b25lKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZCA9IGNvbmRpdGlvbi56b25lLmlkIHx8IGNvbmRpdGlvbi56b25lO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZSA9IFwiem9uZXNcIjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkID0gY29uZGl0aW9uLnpvbmVUeXBlLmlkO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZSA9IFwiem9uZVR5cGVzXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIkZpbHRlclN0YXR1c0RhdGFCeURpYWdub3N0aWNcIjpcclxuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiQWN0aXZlT3JJbmFjdGl2ZUZhdWx0XCI6XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIkZhdWx0XCI6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjb25kaXRpb24uZGlhZ25vc3RpYykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWQgPSBjb25kaXRpb24uZGlhZ25vc3RpYy5pZCB8fCBjb25kaXRpb24uZGlhZ25vc3RpYztcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGUgPSBcImRpYWdub3N0aWNzXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZCAmJiB0eXBlICYmIGRlcGVuZGVuY2llc1t0eXBlXS5pbmRleE9mKGlkKSA9PT0gLTEgJiYgZGVwZW5kZW5jaWVzW3R5cGVdLnB1c2goaWQpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBjaGVja0NvbmRpdGlvbnMgPSAocGFyZW50Q29uZGl0aW9uLCBkZXBlbmRlbmNpZXM6IElSdWxlRGVwZW5kZW5jaWVzKTogSVJ1bGVEZXBlbmRlbmNpZXMgPT4ge1xyXG4gICAgICAgICAgICAgICAgbGV0IGNvbmRpdGlvbnMgPSBwYXJlbnRDb25kaXRpb24uY2hpbGRyZW4gfHwgW107XHJcbiAgICAgICAgICAgICAgICBwcm9jZXNzRGVwZW5kZW5jaWVzKHBhcmVudENvbmRpdGlvbik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY29uZGl0aW9ucy5yZWR1Y2UoKGRlcGVuZGVuY2llcywgY29uZGl0aW9uKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNvbmRpdGlvbi5jaGlsZHJlbikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkZXBlbmRlbmNpZXMgPSBjaGVja0NvbmRpdGlvbnMoY29uZGl0aW9uLCBkZXBlbmRlbmNpZXMpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBwcm9jZXNzRGVwZW5kZW5jaWVzKGNvbmRpdGlvbik7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGRlcGVuZGVuY2llcztcclxuICAgICAgICAgICAgICAgIH0sIGRlcGVuZGVuY2llcyk7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgcmV0dXJuIHJ1bGVzLnJlZHVjZSgoZGVwZW5kZW5jaWVzOiBJUnVsZURlcGVuZGVuY2llcywgcnVsZTogSVJ1bGUpID0+IHtcclxuICAgICAgICAgICAgZGVwZW5kZW5jaWVzLmdyb3VwcyA9IG1lcmdlVW5pcXVlKGRlcGVuZGVuY2llcy5ncm91cHMsIHJ1bGUuZ3JvdXBzLm1hcChncm91cCA9PiBncm91cC5pZCkpO1xyXG4gICAgICAgICAgICBkZXBlbmRlbmNpZXMgPSBjaGVja0NvbmRpdGlvbnMocnVsZS5jb25kaXRpb24sIGRlcGVuZGVuY2llcyk7XHJcbiAgICAgICAgICAgIHJldHVybiBkZXBlbmRlbmNpZXM7XHJcbiAgICAgICAgfSwgZGVwZW5kZW5jaWVzKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZmV0Y2goKTogUHJvbWlzZTxhbnk+IHtcclxuICAgICAgICB0aGlzLmFib3J0Q3VycmVudFRhc2soKTtcclxuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrID0gdGhpcy5nZXRSdWxlcygpXHJcbiAgICAgICAgICAgIC50aGVuKChzd2l0Y2hlZE9uUnVsZXMpID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMuY29tYmluZWRSdWxlcyA9IGVudGl0eVRvRGljdGlvbmFyeShzd2l0Y2hlZE9uUnVsZXMpO1xyXG4gICAgICAgICAgICAgICAgZGVsZXRlKHRoaXMuY29tYmluZWRSdWxlc1tBUFBMSUNBVElPTl9SVUxFX0lEXSk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnN0cnVjdHVyZWRSdWxlcyA9IHRoaXMuc3RydWN0dXJlUnVsZXMoT2JqZWN0LmtleXModGhpcy5jb21iaW5lZFJ1bGVzKS5tYXAoa2V5ID0+IHRoaXMuY29tYmluZWRSdWxlc1trZXldKSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gT2JqZWN0LmtleXModGhpcy5jb21iaW5lZFJ1bGVzKS5tYXAocnVsZUlkID0+IHRoaXMuY29tYmluZWRSdWxlc1tydWxlSWRdKTtcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgLmNhdGNoKGNvbnNvbGUuZXJyb3IpXHJcbiAgICAgICAgICAgIC5maW5hbGx5KCgpID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudFRhc2sgPSBudWxsO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4gdGhpcy5jdXJyZW50VGFzaztcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0UnVsZXNEYXRhIChydWxlc0lkczogc3RyaW5nW10pOiBJUnVsZVtdIHtcclxuICAgICAgICByZXR1cm4gcnVsZXNJZHMubWFwKHJ1bGVJZCA9PiB0aGlzLmNvbWJpbmVkUnVsZXNbcnVsZUlkXSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHVubG9hZCAoKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5hYm9ydEN1cnJlbnRUYXNrKCk7XHJcbiAgICB9XHJcbn0iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vYmx1ZWJpcmQuZC50c1wiLz5cclxuaW1wb3J0IEdyb3Vwc0J1aWxkZXIgZnJvbSBcIi4vZ3JvdXBzQnVpbGRlclwiO1xyXG5pbXBvcnQgKiBhcyBVdGlscyBmcm9tIFwiLi91dGlsc1wiO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgU2VjdXJpdHlDbGVhcmFuY2VzQnVpbGRlciBleHRlbmRzIEdyb3Vwc0J1aWxkZXIge1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKGFwaTogYW55KSB7XHJcbiAgICAgICAgc3VwZXIoYXBpKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGdldFNlY3VyaXR5R3JvdXBzICgpOiBQcm9taXNlPGFueT4ge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuYXBpLmdldFNlc3Npb24oKHNlc3Npb25EYXRhKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmFwaS5jYWxsKFwiR2V0XCIsIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZU5hbWU6IFwiR3JvdXBcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VhcmNoOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZDogXCJHcm91cFNlY3VyaXR5SWRcIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSwgcmVzb2x2ZSwgcmVqZWN0KTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIHB1YmxpYyBmZXRjaCAoKTogUHJvbWlzZTxhbnk+IHtcclxuICAgICAgICB0aGlzLmFib3J0Q3VycmVudFRhc2soKTtcclxuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrID0gdGhpcy5nZXRTZWN1cml0eUdyb3VwcygpXHJcbiAgICAgICAgICAgIC50aGVuKGdyb3VwcyA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmdyb3VwcyA9IGdyb3VwcztcclxuICAgICAgICAgICAgICAgIHRoaXMudHJlZSA9IHRoaXMuY3JlYXRlR3JvdXBzVHJlZShncm91cHMpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50VHJlZSA9IFV0aWxzLmV4dGVuZCh7fSwgdGhpcy50cmVlKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZUZsYXRHcm91cHNMaXN0KHRoaXMudHJlZSkuZmlsdGVyKGdyb3VwID0+ICEhZ3JvdXAubmFtZSk7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIC5jYXRjaChjb25zb2xlLmVycm9yKVxyXG4gICAgICAgICAgICAuZmluYWxseSgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRUYXNrID0gbnVsbDtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY3VycmVudFRhc2s7XHJcbiAgICB9O1xyXG59IiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uL2JsdWViaXJkLmQudHNcIi8+XHJcbmludGVyZmFjZSBJQ2xhc3NDb250cm9sIHtcclxuICAgIGdldDogKCkgPT4gc3RyaW5nO1xyXG4gICAgc2V0OiAobmFtZTogc3RyaW5nKSA9PiB2b2lkO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIElFbnRpdHkge1xyXG4gICAgaWQ6IHN0cmluZztcclxuICAgIFtwcm9wTmFtZTogc3RyaW5nXTogYW55O1xyXG59XHJcblxyXG50eXBlIElTb3J0UHJvcGVydHkgPSBzdHJpbmcgfCBbc3RyaW5nLCBcImFzY1wiIHwgXCJkZXNjXCJdO1xyXG5cclxubGV0IGNsYXNzTmFtZUN0cmwgPSBmdW5jdGlvbiAoZWw6IEVsZW1lbnQpOiBJQ2xhc3NDb250cm9sIHtcclxuICAgICAgICB2YXIgcGFyYW0gPSB0eXBlb2YgZWwuY2xhc3NOYW1lID09PSBcInN0cmluZ1wiID8gXCJjbGFzc05hbWVcIiA6IFwiYmFzZVZhbFwiO1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGVsW3BhcmFtXSB8fCBcIlwiO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBzZXQ6IGZ1bmN0aW9uICh0ZXh0KSB7XHJcbiAgICAgICAgICAgICAgICBlbFtwYXJhbV0gPSB0ZXh0O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgIH0sXHJcbiAgICBpc1VzdWFsT2JqZWN0ID0gZnVuY3Rpb24gKG9iaikge1xyXG4gICAgICAgIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqKS5pbmRleE9mKFwiT2JqZWN0XCIpICE9PSAtMTtcclxuICAgIH07XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIElIYXNoIHtcclxuICAgIFtpZDogc3RyaW5nXTogYW55O1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcmVtb3ZlQ2xhc3MoZWw6IEVsZW1lbnQsIG5hbWU6IHN0cmluZyk6IHZvaWQge1xyXG4gICAgaWYgKCFlbCkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIGxldCBjbGFzc2VzU3RyID0gY2xhc3NOYW1lQ3RybChlbCkuZ2V0KCksXHJcbiAgICAgICAgY2xhc3NlcyA9IGNsYXNzZXNTdHIuc3BsaXQoXCIgXCIpLFxyXG4gICAgICAgIG5ld0NsYXNzZXMgPSBjbGFzc2VzLmZpbHRlcihjbGFzc0l0ZW0gPT4gY2xhc3NJdGVtICE9PSBuYW1lKTtcclxuICAgIGNsYXNzTmFtZUN0cmwoZWwpLnNldChuZXdDbGFzc2VzLmpvaW4oXCIgXCIpKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGFkZENsYXNzKGVsLCBuYW1lKTogdm9pZCB7XHJcbiAgICBpZiAoIWVsKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgbGV0IGNsYXNzZXNTdHIgPSBjbGFzc05hbWVDdHJsKGVsKS5nZXQoKSxcclxuICAgICAgICBjbGFzc2VzID0gY2xhc3Nlc1N0ci5zcGxpdChcIiBcIik7XHJcbiAgICBpZiAoY2xhc3Nlcy5pbmRleE9mKG5hbWUpID09PSAtMSkge1xyXG4gICAgICAgIGNsYXNzTmFtZUN0cmwoZWwpLnNldChjbGFzc2VzU3RyICsgXCIgXCIgKyBuYW1lKTtcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGhhc0NsYXNzKGVsOiBFbGVtZW50LCBjbGFzc05hbWU6IHN0cmluZyk6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuIGVsICYmIGNsYXNzTmFtZUN0cmwoZWwpLmdldCgpLmluZGV4T2YoY2xhc3NOYW1lKSAhPT0gLTE7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBleHRlbmQoLi4uYXJnczogYW55W10pIHtcclxuICAgIHZhciBsZW5ndGggPSBhcmdzLmxlbmd0aCxcclxuICAgICAgICBzcmMsIHNyY0tleXMsIHNyY0F0dHIsXHJcbiAgICAgICAgZnVsbENvcHkgPSBmYWxzZSxcclxuICAgICAgICByZXNBdHRyLFxyXG4gICAgICAgIHJlcyA9IGFyZ3NbMF0sIGkgPSAxLCBqO1xyXG5cclxuICAgIGlmICh0eXBlb2YgcmVzID09PSBcImJvb2xlYW5cIikge1xyXG4gICAgICAgIGZ1bGxDb3B5ID0gcmVzO1xyXG4gICAgICAgIHJlcyA9IGFyZ3NbMV07XHJcbiAgICAgICAgaSsrO1xyXG4gICAgfVxyXG4gICAgd2hpbGUgKGkgIT09IGxlbmd0aCkge1xyXG4gICAgICAgIHNyYyA9IGFyZ3NbaV07XHJcbiAgICAgICAgc3JjS2V5cyA9IE9iamVjdC5rZXlzKHNyYyk7XHJcbiAgICAgICAgZm9yIChqID0gMDsgaiA8IHNyY0tleXMubGVuZ3RoOyBqKyspIHtcclxuICAgICAgICAgICAgc3JjQXR0ciA9IHNyY1tzcmNLZXlzW2pdXTtcclxuICAgICAgICAgICAgaWYgKGZ1bGxDb3B5ICYmIChpc1VzdWFsT2JqZWN0KHNyY0F0dHIpIHx8IEFycmF5LmlzQXJyYXkoc3JjQXR0cikpKSB7XHJcbiAgICAgICAgICAgICAgICByZXNBdHRyID0gcmVzW3NyY0tleXNbal1dO1xyXG4gICAgICAgICAgICAgICAgcmVzQXR0ciA9IHJlc1tzcmNLZXlzW2pdXSA9IChpc1VzdWFsT2JqZWN0KHJlc0F0dHIpIHx8IEFycmF5LmlzQXJyYXkocmVzQXR0cikpID8gcmVzQXR0ciA6IChBcnJheS5pc0FycmF5KHNyY0F0dHIpID8gW10gOiB7fSk7XHJcbiAgICAgICAgICAgICAgICBleHRlbmQoZnVsbENvcHksIHJlc0F0dHIsIHNyY0F0dHIpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcmVzW3NyY0tleXNbal1dID0gc3JjW3NyY0tleXNbal1dO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGkrKztcclxuICAgIH1cclxuICAgIHJldHVybiByZXM7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBlbnRpdHlUb0RpY3Rpb25hcnkoZW50aXRpZXM6IGFueVtdLCBlbnRpdHlDYWxsYmFjaz86IChlbnRpdHk6IGFueSkgPT4gYW55KTogSUhhc2gge1xyXG4gICAgdmFyIGVudGl0eSwgbyA9IHt9LCBpLFxyXG4gICAgICAgIGwgPSBlbnRpdGllcy5sZW5ndGg7XHJcblxyXG4gICAgZm9yIChpID0gMDsgaSA8IGw7IGkrKykge1xyXG4gICAgICAgIGlmIChlbnRpdGllc1tpXSkge1xyXG4gICAgICAgICAgICBlbnRpdHkgPSBlbnRpdGllc1tpXS5pZCA/IGVudGl0aWVzW2ldIDoge2lkOiBlbnRpdGllc1tpXX07XHJcbiAgICAgICAgICAgIG9bZW50aXR5LmlkXSA9IGVudGl0eUNhbGxiYWNrID8gZW50aXR5Q2FsbGJhY2soZW50aXR5KSA6IGVudGl0eTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gbztcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHNvcnRBcnJheU9mRW50aXRpZXMoZW50aXRpZXM6IGFueVtdLCBzb3J0aW5nRmllbGRzOiBJU29ydFByb3BlcnR5W10pOiBhbnlbXSB7XHJcbiAgICBsZXQgY29tcGFyYXRvciA9IChwcmV2SXRlbSwgbmV4dEl0ZW0sIHByb3BlcnRpZXM6IGFueVtdLCBpbmRleCA9IDApID0+IHtcclxuICAgICAgICBpZiAocHJvcGVydGllcy5sZW5ndGggPD0gaW5kZXgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIDA7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGxldCBvcHRpb25zID0gcHJvcGVydGllc1tpbmRleF0sXHJcbiAgICAgICAgICAgIFtwcm9wZXJ0eSwgZGlyID0gXCJhc2NcIl0gPSBBcnJheS5pc0FycmF5KG9wdGlvbnMpID8gb3B0aW9ucyA6IFtvcHRpb25zXSxcclxuICAgICAgICAgICAgZGlyTXVsdGlwbGllcjogbnVtYmVyO1xyXG4gICAgICAgIGRpck11bHRpcGxpZXIgPSBkaXIgPT09IFwiYXNjXCIgPyAxIDogLTE7XHJcbiAgICAgICAgaWYgKHByZXZJdGVtW3Byb3BlcnR5XSA+IG5leHRJdGVtW3Byb3BlcnR5XSkge1xyXG4gICAgICAgICAgICByZXR1cm4gMSAqIGRpck11bHRpcGxpZXI7XHJcbiAgICAgICAgfSBlbHNlIGlmIChwcmV2SXRlbVtwcm9wZXJ0eV0gPCBuZXh0SXRlbVtwcm9wZXJ0eV0pIHtcclxuICAgICAgICAgICAgcmV0dXJuIC0xICogZGlyTXVsdGlwbGllcjtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICByZXR1cm4gY29tcGFyYXRvcihwcmV2SXRlbSwgbmV4dEl0ZW0sIHByb3BlcnRpZXMsIGluZGV4ICsgMSk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuICAgIHJldHVybiBlbnRpdGllcy5zb3J0KChwcmV2VGVtcGxhdGUsIG5leHRUZW1wbGF0ZSkgPT4ge1xyXG4gICAgICAgIHJldHVybiBjb21wYXJhdG9yKHByZXZUZW1wbGF0ZSwgbmV4dFRlbXBsYXRlLCBzb3J0aW5nRmllbGRzKTtcclxuICAgIH0pO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZG93bmxvYWREYXRhQXNGaWxlKGRhdGE6IHN0cmluZywgZmlsZW5hbWU6IHN0cmluZywgbWltZVR5cGUgPSBcInRleHQvanNvblwiKSB7XHJcbiAgICBsZXQgYmxvYiA9IG5ldyBCbG9iKFtkYXRhXSwge3R5cGU6IG1pbWVUeXBlfSksXHJcbiAgICAgICAgZWxlbTtcclxuICAgIGlmICh3aW5kb3cubmF2aWdhdG9yLm1zU2F2ZU9yT3BlbkJsb2IpIHtcclxuICAgICAgICB3aW5kb3cubmF2aWdhdG9yLm1zU2F2ZUJsb2IoYmxvYiwgZmlsZW5hbWUpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBlbGVtID0gd2luZG93LmRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJhXCIpO1xyXG4gICAgICAgIGVsZW0uaHJlZiA9IHdpbmRvdy5VUkwuY3JlYXRlT2JqZWN0VVJMKGJsb2IpO1xyXG4gICAgICAgIGVsZW0uZG93bmxvYWQgPSBmaWxlbmFtZTtcclxuICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGVsZW0pO1xyXG4gICAgICAgIGVsZW0uY2xpY2soKTtcclxuICAgICAgICBkb2N1bWVudC5ib2R5LnJlbW92ZUNoaWxkKGVsZW0pO1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbWVyZ2VVbmlxdWVFbnRpdGllcyAoLi4uc291cmNlczogSUVudGl0eVtdW10pOiBJRW50aXR5W10ge1xyXG4gICAgbGV0IGFkZGVkSWRzOiBzdHJpbmdbXSA9IFtdLFxyXG4gICAgICAgIG1lcmdlZEl0ZW1zOiBJRW50aXR5W10gPSBbXTtcclxuICAgIHNvdXJjZXMuZm9yRWFjaChzb3VyY2UgPT4gc291cmNlLmZvckVhY2goaXRlbSA9PiB7XHJcbiAgICAgICAgaWYgKGl0ZW0gJiYgaXRlbS5pZCAmJiBhZGRlZElkcy5pbmRleE9mKGl0ZW0uaWQpID09PSAtMSkge1xyXG4gICAgICAgICAgICBhZGRlZElkcy5wdXNoKGl0ZW0uaWQpO1xyXG4gICAgICAgICAgICBtZXJnZWRJdGVtcy5wdXNoKGl0ZW0pO1xyXG4gICAgICAgIH1cclxuICAgIH0pKTtcclxuICAgIHJldHVybiBtZXJnZWRJdGVtcztcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldEVudGl0aWVzSWRzIChlbnRpdGllc0xpc3Q6IElFbnRpdHlbXSk6IHN0cmluZ1tdIHtcclxuICAgIHJldHVybiBBcnJheS5pc0FycmF5KGVudGl0aWVzTGlzdCkgJiYgZW50aXRpZXNMaXN0LnJlZHVjZSgocmVzdWx0LCBlbnRpdHkpID0+IHtcclxuICAgICAgICBlbnRpdHkgJiYgZW50aXR5LmlkICYmIHJlc3VsdC5wdXNoKGVudGl0eS5pZCk7XHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH0sIFtdKSB8fCBbXTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIG1lcmdlVW5pcXVlICguLi5zb3VyY2VzOiBzdHJpbmdbXVtdKTogc3RyaW5nW10ge1xyXG4gICAgbGV0IG1lcmdlZEl0ZW1zOiBzdHJpbmdbXSA9IFtdO1xyXG4gICAgc291cmNlcy5mb3JFYWNoKHNvdXJjZSA9PiB7XHJcbiAgICAgICAgQXJyYXkuaXNBcnJheShzb3VyY2UpICYmIHNvdXJjZS5mb3JFYWNoKGl0ZW0gPT4ge1xyXG4gICAgICAgICAgICBpdGVtICYmIG1lcmdlZEl0ZW1zLmluZGV4T2YoaXRlbSkgPT09IC0xICYmIG1lcmdlZEl0ZW1zLnB1c2goaXRlbSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9KTtcclxuICAgIHJldHVybiBtZXJnZWRJdGVtcztcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldFVuaXF1ZUVudGl0aWVzIChuZXdFbnRpdGllczogSUVudGl0eVtdLCBleGlzdGVkRW50aXRpZXM6IElFbnRpdHlbXSk6IElFbnRpdHlbXSB7XHJcbiAgICBsZXQgc2VsZWN0ZWRFbnRpdGllc0hhc2ggPSBlbnRpdHlUb0RpY3Rpb25hcnkoZXhpc3RlZEVudGl0aWVzKTtcclxuICAgIHJldHVybiBuZXdFbnRpdGllcy5yZWR1Y2UoKHJlcywgZW50aXR5KSA9PiB7XHJcbiAgICAgICAgIXNlbGVjdGVkRW50aXRpZXNIYXNoW2VudGl0eS5pZF0gJiYgcmVzLnB1c2goZW50aXR5KTtcclxuICAgICAgICByZXR1cm4gcmVzO1xyXG4gICAgfSwgW10pO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gdG9nZXRoZXIocHJvbWlzZXM6IFByb21pc2U8YW55PltdKTogUHJvbWlzZTxhbnk+IHtcclxuICAgIGxldCByZXN1bHRzID0gW10sXHJcbiAgICAgICAgcmVzdWx0c0NvdW50ID0gMDtcclxuICAgIHJlc3VsdHMubGVuZ3RoID0gcHJvbWlzZXMubGVuZ3RoO1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICBsZXQgcmVzb2x2ZUFsbCA9ICgpID0+IHtcclxuICAgICAgICAgICAgcmV0dXJuIHJlc29sdmUocmVzdWx0cyk7XHJcbiAgICAgICAgfTtcclxuICAgICAgICBwcm9taXNlcy5sZW5ndGggPyBwcm9taXNlcy5mb3JFYWNoKChwcm9taXNlLCBpbmRleCkgPT4ge1xyXG4gICAgICAgICAgICBwcm9taXNlLnRoZW4oKHJlc3VsdCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0c0NvdW50Kys7XHJcbiAgICAgICAgICAgICAgICByZXN1bHRzW2luZGV4XSA9IHJlc3VsdDtcclxuICAgICAgICAgICAgICAgIHJlc3VsdHNDb3VudCA9PT0gcHJvbWlzZXMubGVuZ3RoICYmIHJlc29sdmVBbGwoKTtcclxuICAgICAgICAgICAgfSkuY2F0Y2goKGVycm9yKSA9PiB7XHJcbiAgICAgICAgICAgICAgICByZWplY3Qoe1xyXG4gICAgICAgICAgICAgICAgICAgIGVycm9yOiBlcnJvcixcclxuICAgICAgICAgICAgICAgICAgICBwcm9taXNlSW5kZXg6IGluZGV4XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSkgOiByZXNvbHZlQWxsKCk7XHJcbiAgICB9KTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHJlc29sdmVkUHJvbWlzZTxUPiAodmFsPzogVCk6IFByb21pc2U8VD4ge1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlPFQ+KHJlc29sdmUgPT4gcmVzb2x2ZSh2YWwpKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHRvQXJyYXkgKGRhdGEpIHtcclxuICAgIHJldHVybiBBcnJheS5pc0FycmF5KGRhdGEpID8gZGF0YSA6IFtkYXRhXTtcclxufSIsImV4cG9ydCBkZWZhdWx0IGNsYXNzIFdhaXRpbmcge1xyXG5cclxuICAgIHByaXZhdGUgd2FpdGluZ0NvbnRhaW5lcjogSFRNTEVsZW1lbnQ7XHJcbiAgICBwcml2YXRlIGJvZHlFbDogSFRNTEVsZW1lbnQgPSBkb2N1bWVudC5ib2R5O1xyXG5cclxuICAgIHB1YmxpYyBzdGFydChlbDogSFRNTEVsZW1lbnQgPSB0aGlzLmJvZHlFbCwgekluZGV4PzogbnVtYmVyKSB7XHJcbiAgICAgICAgaWYgKGVsLm9mZnNldFBhcmVudCA9PT0gbnVsbCkge1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMud2FpdGluZ0NvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcbiAgICAgICAgdGhpcy53YWl0aW5nQ29udGFpbmVyLmNsYXNzTmFtZSA9IFwid2FpdGluZ1wiO1xyXG4gICAgICAgIHRoaXMud2FpdGluZ0NvbnRhaW5lci5pbm5lckhUTUwgPSBcIjxkaXYgY2xhc3M9J2ZhZGVyJz48L2Rpdj48ZGl2IGNsYXNzPSdzcGlubmVyJz48L2Rpdj5cIjtcclxuICAgICAgICBlbC5wYXJlbnROb2RlLmFwcGVuZENoaWxkKHRoaXMud2FpdGluZ0NvbnRhaW5lcik7XHJcblxyXG4gICAgICAgIHRoaXMud2FpdGluZ0NvbnRhaW5lci5zdHlsZS5wb3NpdGlvbiA9IFwiYWJzb2x1dGVcIjtcclxuICAgICAgICB0aGlzLndhaXRpbmdDb250YWluZXIuc3R5bGUud2lkdGggPSBlbC5vZmZzZXRXaWR0aCArIFwicHhcIjtcclxuICAgICAgICB0aGlzLndhaXRpbmdDb250YWluZXIuc3R5bGUuaGVpZ2h0ID0gZWwub2Zmc2V0SGVpZ2h0ICsgXCJweFwiO1xyXG4gICAgICAgIHRoaXMud2FpdGluZ0NvbnRhaW5lci5zdHlsZS50b3AgPSBlbC5vZmZzZXRUb3AgKyBcInB4XCI7XHJcbiAgICAgICAgdGhpcy53YWl0aW5nQ29udGFpbmVyLnN0eWxlLmxlZnQgPSBlbC5vZmZzZXRMZWZ0ICsgXCJweFwiO1xyXG4gICAgICAgIHRoaXMud2FpdGluZ0NvbnRhaW5lci5zdHlsZS5kaXNwbGF5ID0gXCJibG9ja1wiO1xyXG4gICAgICAgIHR5cGVvZiB6SW5kZXggPT09IFwibnVtYmVyXCIgJiYgKHRoaXMud2FpdGluZ0NvbnRhaW5lci5zdHlsZS56SW5kZXggPSB6SW5kZXgudG9TdHJpbmcoKSk7XHJcbiAgICB9O1xyXG5cclxuICAgIHB1YmxpYyBzdG9wICgpIHtcclxuICAgICAgICBpZiAodGhpcy53YWl0aW5nQ29udGFpbmVyICYmIHRoaXMud2FpdGluZ0NvbnRhaW5lci5wYXJlbnROb2RlKSB7XHJcbiAgICAgICAgICAgIHRoaXMud2FpdGluZ0NvbnRhaW5lci5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHRoaXMud2FpdGluZ0NvbnRhaW5lcik7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxufSJdfQ==
