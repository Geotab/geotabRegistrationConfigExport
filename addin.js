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
// import {UserBuilder} from "./userBuilder";
var zoneBuilder_1 = require("./zoneBuilder");
var Addin = /** @class */ (function () {
    //initialize addin 
    function Addin(api) {
        var _this = this;
        this.exportBtn = document.getElementById("exportButton");
        this.saveBtn = document.getElementById("saveButton");
        this.exportAllAddinsCheckbox = document.getElementById("export_all_addins_checkbox");
        this.exportAllZonesCheckbox = document.getElementById("export_all_zones_checkbox");
        this.exportSystemSettingsCheckbox = document.getElementById("export_system_settings_checkbox");
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
        //Brett: exports the data
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
        this.saveChanges = function () {
            _this.render();
            _this.exportBtn.disabled = false;
        };
        this.checkBoxValueChanged = function () {
            _this.exportBtn.disabled = true;
        };
        this.api = api;
        this.groupsBuilder = new groupsBuilder_1["default"](api);
        this.securityClearancesBuilder = new securityClearancesBuilder_1["default"](api);
        this.reportsBuilder = new reportsBuilder_1["default"](api);
        this.rulesBuilder = new rulesBuilder_1["default"](api);
        this.distributionListsBuilder = new distributionListsBuilder_1["default"](api);
        this.miscBuilder = new miscBuilder_1.MiscBuilder(api);
        //TODO: Brett - left here as I will be introducing the user fetch soon
        // this.userBuilder = new UserBuilder(api);
        this.zoneBuilder = new zoneBuilder_1.ZoneBuilder(api);
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
    //Brett - displays the output on the page
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
    Addin.prototype.showSystemSettingsMessage = function (block, isIncluded) {
        var blockEl = block.querySelector(".description");
        if (isIncluded) {
            blockEl.innerHTML = "You have chosen <span class='bold'>to include</span> system settings.";
        }
        else {
            blockEl.innerHTML = "You have chosen <span class='bold'>not to include</span> system settings.";
        }
    };
    Addin.prototype.setAddinsToNull = function () {
        if ((this.data.misc != null) || (this.data.misc != undefined)) {
            this.data.misc.addins = [];
        }
    };
    Addin.prototype.addEventHandlers = function () {
        this.exportBtn.addEventListener("click", this.exportData, false);
        this.saveBtn.addEventListener("click", this.saveChanges, false);
        this.exportAllAddinsCheckbox.addEventListener("change", this.checkBoxValueChanged, false);
        this.exportAllZonesCheckbox.addEventListener("change", this.checkBoxValueChanged, false);
        this.exportSystemSettingsCheckbox.addEventListener("change", this.checkBoxValueChanged, false);
    };
    Addin.prototype.render = function () {
        var _this = this;
        //TODO: Brett - left here as I will be introducing the user fetch soon
        // this.data.users = [];
        this.data.zones = [];
        //wire up the dom
        var mapMessageTemplate = document.getElementById("mapMessageTemplate").innerHTML, groupsBlock = document.getElementById("exportedGroups"), securityClearancesBlock = document.getElementById("exportedSecurityClearances"), rulesBlock = document.getElementById("exportedRules"), reportsBlock = document.getElementById("exportedReports"), dashboardsBlock = document.getElementById("exportedDashboards"), addinsBlock = document.getElementById("exportedAddins"), mapBlockDescription = document.querySelector("#exportedMap > .description"), 
        // usersBlock: HTMLElement = document.getElementById("exportedUsers"),
        zonesBlock = document.getElementById("exportedZones"), systemSettingsBlock = document.getElementById("exportSystemSettings");
        this.toggleWaiting(true);
        return utils_1.together([
            //loads the groups. This is where users are added if they are linked to a group
            this.groupsBuilder.fetch(),
            //loads the security groups (security clearance in user admin in MyG)
            this.securityClearancesBuilder.fetch(),
            //report loader...seems obsolete to me
            this.reportsBuilder.fetch(),
            this.rulesBuilder.fetch(),
            this.distributionListsBuilder.fetch(),
            //misc = system settings
            this.miscBuilder.fetch(this.exportSystemSettingsCheckbox.checked),
            //TODO: Brett - left here as I will be introducing the user fetch soon
            // this.userBuilder.fetch(),
            this.zoneBuilder.fetch()
        ]).then(function (results) {
            var reportsDependencies, rulesDependencies, distributionListsDependencies, dependencies, customMap;
            _this.data.groups = results[0];
            _this.data.securityGroups = results[1];
            _this.data.reports = results[2];
            _this.data.rules = results[3];
            _this.data.distributionLists = _this.distributionListsBuilder.getRulesDistributionLists(_this.data.rules.map(function (rule) { return rule.id; }));
            _this.data.misc = results[5];
            var getDependencies = function (entities, entityType) {
                return entities.reduce(function (res, entity) {
                    var entityDep = _this.getEntityDependencies(entity, entityType);
                    return _this.combineDependencies(res, entityDep);
                }, {});
            };
            var zoneDependencies = {};
            if (_this.exportAllZonesCheckbox.checked == true) {
                if (results[6]) {
                    //sets exported zones to all database zones
                    _this.data.zones = results[6];
                    zoneDependencies = getDependencies(results[6], "Zone");
                }
            }
            if (_this.exportAllAddinsCheckbox.checked == false) {
                //sets exported addins equal to none/empty array
                _this.setAddinsToNull();
            }
            customMap = _this.miscBuilder.getMapProviderData(_this.data.misc.mapProvider.value);
            customMap && _this.data.customMaps.push(customMap);
            reportsDependencies = _this.reportsBuilder.getDependencies(_this.data.reports);
            rulesDependencies = _this.rulesBuilder.getDependencies(_this.data.rules);
            distributionListsDependencies = _this.distributionListsBuilder.getDependencies(_this.data.distributionLists);
            dependencies = _this.combineDependencies(zoneDependencies, reportsDependencies, rulesDependencies, distributionListsDependencies);
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
            // this.showEntityMessage(usersBlock, this.data.users.length, "user");
            _this.showEntityMessage(zonesBlock, _this.data.zones.length, "zone");
            _this.showSystemSettingsMessage(systemSettingsBlock, _this.exportSystemSettingsCheckbox.checked);
            //this displays all the data/objects in the console
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
        this.saveBtn.removeEventListener("click", this.saveChanges, false);
        this.exportAllAddinsCheckbox.removeEventListener("change", this.checkBoxValueChanged, false);
        this.exportAllZonesCheckbox.removeEventListener("change", this.checkBoxValueChanged, false);
        this.exportSystemSettingsCheckbox.removeEventListener("change", this.checkBoxValueChanged, false);
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
            addin.addEventHandlers();
        },
        blur: function () {
            addin.unload();
        }
    };
};
},{"./distributionListsBuilder":2,"./groupsBuilder":3,"./miscBuilder":4,"./reportsBuilder":5,"./rulesBuilder":6,"./securityClearancesBuilder":7,"./utils":8,"./waiting":9,"./zoneBuilder":10}],2:[function(require,module,exports){
"use strict";
exports.__esModule = true;
/// <reference path="../bluebird.d.ts"/>
var utils_1 = require("./utils");
var DistributionListsBuilder = /** @class */ (function () {
    function DistributionListsBuilder(api) {
        this.api = api;
    }
    //A distribution list links a set of Rule(s) to a set of Recipient(s). When a Rule is violated each related Recipient will receive a notification of the kind defined by its RecipientType.
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
    //gets the groups associated with the current user
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
    //fills the group builder with the relevant information
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
        var _this = this;
        return allAddins.filter(function (addin) {
            //removes the current addin - registration config
            if (_this.isCurrentAddin(addin)) {
                return false;
            }
            var addinConfig = JSON.parse(addin);
            if (addinConfig.items) {
                //Multi line addin structure check
                return addinConfig && Array.isArray(addinConfig.items) && addinConfig.items.every(function (item) {
                    var url = item.url;
                    return _this.isValidUrl(url);
                });
            }
            else {
                //Single line addin structure check
                return _this.isValidUrl(addinConfig.url);
            }
        });
    };
    //Tests a URL for double slash. Accepts a url as a string as a argument.
    //Returns true if the url contains a double slash //
    //Returns false if the url does not contain a double slash.
    MiscBuilder.prototype.isValidUrl = function (url) {
        if (url && url.indexOf("\/\/") > -1) {
            return true;
        }
        return false;
    };
    MiscBuilder.prototype.isCurrentAddin = function (addin) {
        return ((addin.indexOf("Registration config") > -1) ||
            (addin.toLowerCase().indexOf("registrationConfig".toLowerCase()) > -1));
    };
    //fills the Misc builder (system settings) with the relevant information
    MiscBuilder.prototype.fetch = function (includeSysSettings) {
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
            var output = {
                mapProvider: {
                    value: mapProviderId,
                    type: _this.getMapProviderType(mapProviderId)
                },
                currentUser: _this.currentUser,
                isUnsignedAddinsAllowed: _this.isUnsignedAddinsAllowed,
                addins: _this.addins
            };
            if (includeSysSettings) {
                output.purgeSettings = systemSettings.purgeSettings;
                output.emailSenderFrom = systemSettings.emailSenderFrom;
                output.customerClassification = systemSettings.customerClassification;
                output.isMarketplacePurchasesAllowed = systemSettings.allowMarketplacePurchases;
                output.isResellerAutoLoginAllowed = systemSettings.allowResellerAutoLogin;
                output.isThirdPartyMarketplaceAppsAllowed = systemSettings.allowThirdPartyMarketplaceApps;
            }
            return output;
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
    MiscBuilder.prototype.getAddinsData = function (includeThisAddin) {
        var _this = this;
        if (includeThisAddin === void 0) { includeThisAddin = false; }
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
    //GetReportSchedules is obsolete
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
            if (rule.condition) {
                dependencies = checkConditions(rule.condition, dependencies);
            }
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
},{}],10:[function(require,module,exports){
"use strict";
//added by Brett to manage adding all zones to the export as an option
exports.__esModule = true;
var ZoneBuilder = /** @class */ (function () {
    function ZoneBuilder(api) {
        this.api = api;
    }
    ZoneBuilder.prototype.abortCurrentTask = function () {
        this.currentTask && this.currentTask.abort && this.currentTask.abort();
        this.currentTask = null;
    };
    //fills the user builder with all users
    ZoneBuilder.prototype.fetch = function () {
        this.abortCurrentTask();
        this.currentTask = this.getZones();
        return this.currentTask;
    };
    ZoneBuilder.prototype.getZones = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.api.call("Get", {
                "typeName": "Zone"
            }, resolve, reject);
        });
    };
    ZoneBuilder.prototype.unload = function () {
        this.abortCurrentTask();
    };
    return ZoneBuilder;
}());
exports.ZoneBuilder = ZoneBuilder;
},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzb3VyY2VzL2FkZGluLnRzIiwic291cmNlcy9kaXN0cmlidXRpb25MaXN0c0J1aWxkZXIudHMiLCJzb3VyY2VzL2dyb3Vwc0J1aWxkZXIudHMiLCJzb3VyY2VzL21pc2NCdWlsZGVyLnRzIiwic291cmNlcy9yZXBvcnRzQnVpbGRlci50cyIsInNvdXJjZXMvcnVsZXNCdWlsZGVyLnRzIiwic291cmNlcy9zZWN1cml0eUNsZWFyYW5jZXNCdWlsZGVyLnRzIiwic291cmNlcy91dGlscy50cyIsInNvdXJjZXMvd2FpdGluZy50cyIsInNvdXJjZXMvem9uZUJ1aWxkZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztBQ0FBLGlEQUE0QztBQUM1Qyx5RUFBb0U7QUFDcEUsbURBQThDO0FBQzlDLCtDQUEwQztBQUMxQyx1RUFBa0U7QUFDbEUsNkNBQXFEO0FBQ3JELGlDQUFvSjtBQUNwSixxQ0FBZ0M7QUFDaEMsNkNBQTZDO0FBQzdDLDZDQUEwQztBQTRDMUM7SUFrVEksbUJBQW1CO0lBQ25CLGVBQWEsR0FBRztRQUFoQixpQkFZQztRQXJUZ0IsY0FBUyxHQUFnQixRQUFRLENBQUMsY0FBYyxDQUFDLGNBQWMsQ0FBQyxDQUFDO1FBQ2pFLFlBQU8sR0FBZ0IsUUFBUSxDQUFDLGNBQWMsQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUM3RCw0QkFBdUIsR0FBcUIsUUFBUSxDQUFDLGNBQWMsQ0FBQyw0QkFBNEIsQ0FBcUIsQ0FBQztRQUN0SCwyQkFBc0IsR0FBcUIsUUFBUSxDQUFDLGNBQWMsQ0FBQywyQkFBMkIsQ0FBcUIsQ0FBQztRQUNwSCxpQ0FBNEIsR0FBcUIsUUFBUSxDQUFDLGNBQWMsQ0FBQyxpQ0FBaUMsQ0FBcUIsQ0FBQztRQUdoSSxTQUFJLEdBQWdCO1lBQ2pDLE1BQU0sRUFBRSxFQUFFO1lBQ1YsT0FBTyxFQUFFLEVBQUU7WUFDWCxLQUFLLEVBQUUsRUFBRTtZQUNULGlC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LENBQUMsQ0FBQztTQUN2RTtJQUNMLENBQUM7SUFBQSxDQUFDO0lBQ04sY0FBQztBQUFELENBNUJBLEFBNEJDLElBQUE7Ozs7QUM1QkQsc0VBQXNFOztBQUV0RTtJQUlJLHFCQUFZLEdBQUc7UUFDWCxJQUFJLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQztJQUNuQixDQUFDO0lBRU8sc0NBQWdCLEdBQXhCO1FBQ0ksSUFBSSxDQUFDLFdBQVcsSUFBSSxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssSUFBSSxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ3ZFLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDO0lBQzVCLENBQUM7SUFFRCx1Q0FBdUM7SUFDdkMsMkJBQUssR0FBTDtRQUNJLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO1FBQ3hCLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFBO1FBQ2xDLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQztJQUM1QixDQUFDO0lBRU8sOEJBQVEsR0FBaEI7UUFBQSxpQkFNQztRQUxHLE9BQU8sSUFBSSxPQUFPLENBQUMsVUFBQyxPQUFPLEVBQUUsTUFBTTtZQUMvQixLQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUU7Z0JBQ2pCLFVBQVUsRUFBRSxNQUFNO2FBQ3JCLEVBQUUsT0FBTyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQ3hCLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUVELDRCQUFNLEdBQU47UUFDSSxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztJQUM1QixDQUFDO0lBQ0wsa0JBQUM7QUFBRCxDQS9CQSxBQStCQyxJQUFBO0FBL0JZLGtDQUFXIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiaW1wb3J0IEdyb3Vwc0J1aWxkZXIgZnJvbSBcIi4vZ3JvdXBzQnVpbGRlclwiO1xyXG5pbXBvcnQgU2VjdXJpdHlDbGVhcmFuY2VzQnVpbGRlciBmcm9tIFwiLi9zZWN1cml0eUNsZWFyYW5jZXNCdWlsZGVyXCI7XHJcbmltcG9ydCBSZXBvcnRzQnVpbGRlciBmcm9tIFwiLi9yZXBvcnRzQnVpbGRlclwiO1xyXG5pbXBvcnQgUnVsZXNCdWlsZGVyIGZyb20gXCIuL3J1bGVzQnVpbGRlclwiO1xyXG5pbXBvcnQgRGlzdHJpYnV0aW9uTGlzdHNCdWlsZGVyIGZyb20gXCIuL2Rpc3RyaWJ1dGlvbkxpc3RzQnVpbGRlclwiO1xyXG5pbXBvcnQge0lNaXNjRGF0YSwgTWlzY0J1aWxkZXJ9IGZyb20gXCIuL21pc2NCdWlsZGVyXCI7XHJcbmltcG9ydCB7ZG93bmxvYWREYXRhQXNGaWxlLCBtZXJnZVVuaXF1ZSwgSUVudGl0eSwgbWVyZ2VVbmlxdWVFbnRpdGllcywgZ2V0VW5pcXVlRW50aXRpZXMsIGdldEVudGl0aWVzSWRzLCB0b2dldGhlciwgcmVzb2x2ZWRQcm9taXNlfSBmcm9tIFwiLi91dGlsc1wiO1xyXG5pbXBvcnQgV2FpdGluZyBmcm9tIFwiLi93YWl0aW5nXCI7XHJcbi8vIGltcG9ydCB7VXNlckJ1aWxkZXJ9IGZyb20gXCIuL3VzZXJCdWlsZGVyXCI7XHJcbmltcG9ydCB7Wm9uZUJ1aWxkZXJ9IGZyb20gXCIuL3pvbmVCdWlsZGVyXCI7XHJcblxyXG5pbnRlcmZhY2UgR2VvdGFiIHtcclxuICAgIGFkZGluOiB7XHJcbiAgICAgICAgcmVnaXN0cmF0aW9uQ29uZmlnOiBGdW5jdGlvblxyXG4gICAgfTtcclxufVxyXG5cclxuaW50ZXJmYWNlIElJbXBvcnREYXRhIHtcclxuICAgIGdyb3VwczogYW55W107XHJcbiAgICByZXBvcnRzOiBhbnlbXTtcclxuICAgIHJ1bGVzOiBhbnlbXTtcclxuICAgIGRpc3RyaWJ1dGlvbkxpc3RzOiBhbnlbXTtcclxuICAgIGRldmljZXM6IGFueVtdO1xyXG4gICAgdXNlcnM6IGFueVtdO1xyXG4gICAgem9uZVR5cGVzOiBhbnlbXTtcclxuICAgIHpvbmVzOiBhbnlbXTtcclxuICAgIHdvcmtUaW1lczogYW55W107XHJcbiAgICB3b3JrSG9saWRheXM6IGFueVtdO1xyXG4gICAgc2VjdXJpdHlHcm91cHM6IGFueVtdO1xyXG4gICAgZGlhZ25vc3RpY3M6IGFueVtdO1xyXG4gICAgY3VzdG9tTWFwczogYW55W107XHJcbiAgICBtaXNjOiBJTWlzY0RhdGE7XHJcbiAgICBub3RpZmljYXRpb25UZW1wbGF0ZXM6IGFueVtdO1xyXG59XHJcbmludGVyZmFjZSBJRGVwZW5kZW5jaWVzIHtcclxuICAgIGdyb3Vwcz86IHN0cmluZ1tdO1xyXG4gICAgcmVwb3J0cz86IHN0cmluZ1tdO1xyXG4gICAgcnVsZXM/OiBzdHJpbmdbXTtcclxuICAgIGRpc3RyaWJ1dGlvbkxpc3RzPzogc3RyaW5nW107XHJcbiAgICBkZXZpY2VzPzogc3RyaW5nW107XHJcbiAgICB1c2Vycz86IHN0cmluZ1tdO1xyXG4gICAgem9uZVR5cGVzPzogc3RyaW5nW107XHJcbiAgICB6b25lcz86IHN0cmluZ1tdO1xyXG4gICAgd29ya1RpbWVzPzogc3RyaW5nW107XHJcbiAgICB3b3JrSG9saWRheXM/OiBzdHJpbmdbXTtcclxuICAgIHNlY3VyaXR5R3JvdXBzPzogc3RyaW5nW107XHJcbiAgICBkaWFnbm9zdGljcz86IHN0cmluZ1tdO1xyXG4gICAgY3VzdG9tTWFwcz86IHN0cmluZ1tdO1xyXG4gICAgbm90aWZpY2F0aW9uVGVtcGxhdGVzPzogc3RyaW5nW107XHJcbn1cclxuXHJcbmRlY2xhcmUgY29uc3QgZ2VvdGFiOiBHZW90YWI7XHJcblxyXG5jbGFzcyBBZGRpbiB7XHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IGFwaTtcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgZ3JvdXBzQnVpbGRlcjogR3JvdXBzQnVpbGRlcjtcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgc2VjdXJpdHlDbGVhcmFuY2VzQnVpbGRlcjogU2VjdXJpdHlDbGVhcmFuY2VzQnVpbGRlcjtcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgcmVwb3J0c0J1aWxkZXI6IFJlcG9ydHNCdWlsZGVyO1xyXG4gICAgcHJpdmF0ZSByZWFkb25seSBydWxlc0J1aWxkZXI6IFJ1bGVzQnVpbGRlcjtcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgZGlzdHJpYnV0aW9uTGlzdHNCdWlsZGVyOiBEaXN0cmlidXRpb25MaXN0c0J1aWxkZXI7XHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IG1pc2NCdWlsZGVyOiBNaXNjQnVpbGRlcjtcclxuICAgIC8vIHByaXZhdGUgcmVhZG9ubHkgdXNlckJ1aWxkZXI6IFVzZXJCdWlsZGVyO1xyXG4gICAgcHJpdmF0ZSByZWFkb25seSB6b25lQnVpbGRlcjogWm9uZUJ1aWxkZXI7XHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IGV4cG9ydEJ0bjogSFRNTEVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImV4cG9ydEJ1dHRvblwiKTtcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgc2F2ZUJ0bjogSFRNTEVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNhdmVCdXR0b25cIik7XHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IGV4cG9ydEFsbEFkZGluc0NoZWNrYm94OiBIVE1MSW5wdXRFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJleHBvcnRfYWxsX2FkZGluc19jaGVja2JveFwiKSBhcyBIVE1MSW5wdXRFbGVtZW50O1xyXG4gICAgcHJpdmF0ZSByZWFkb25seSBleHBvcnRBbGxab25lc0NoZWNrYm94OiBIVE1MSW5wdXRFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJleHBvcnRfYWxsX3pvbmVzX2NoZWNrYm94XCIpIGFzIEhUTUxJbnB1dEVsZW1lbnQ7XHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IGV4cG9ydFN5c3RlbVNldHRpbmdzQ2hlY2tib3g6IEhUTUxJbnB1dEVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImV4cG9ydF9zeXN0ZW1fc2V0dGluZ3NfY2hlY2tib3hcIikgYXMgSFRNTElucHV0RWxlbWVudDtcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgd2FpdGluZzogV2FpdGluZztcclxuICAgIHByaXZhdGUgY3VycmVudFRhc2s7XHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IGRhdGE6IElJbXBvcnREYXRhID0ge1xyXG4gICAgICAgIGdyb3VwczogW10sXHJcbiAgICAgICAgcmVwb3J0czogW10sXHJcbiAgICAgICAgcnVsZXM6IFtdLFxyXG4gICAgICAgIGRpc3RyaWJ1dGlvbkxpc3RzOiBbXSxcclxuICAgICAgICBkZXZpY2VzOiBbXSxcclxuICAgICAgICB1c2VyczogW10sXHJcbiAgICAgICAgem9uZVR5cGVzOiBbXSxcclxuICAgICAgICB6b25lczogW10sXHJcbiAgICAgICAgd29ya1RpbWVzOiBbXSxcclxuICAgICAgICB3b3JrSG9saWRheXM6IFtdLFxyXG4gICAgICAgIHNlY3VyaXR5R3JvdXBzOiBbXSxcclxuICAgICAgICBjdXN0b21NYXBzOiBbXSxcclxuICAgICAgICBkaWFnbm9zdGljczogW10sXHJcbiAgICAgICAgbWlzYzogbnVsbCxcclxuICAgICAgICBub3RpZmljYXRpb25UZW1wbGF0ZXM6IFtdXHJcbiAgICB9O1xyXG5cclxuICAgIHByaXZhdGUgY29tYmluZURlcGVuZGVuY2llcyAoLi4uYWxsRGVwZW5kZW5jaWVzOiBJRGVwZW5kZW5jaWVzW10pOiBJRGVwZW5kZW5jaWVzIHtcclxuICAgICAgICBsZXQgdG90YWwgPSB7XHJcbiAgICAgICAgICAgIGdyb3VwczogW10sXHJcbiAgICAgICAgICAgIHJlcG9ydHM6IFtdLFxyXG4gICAgICAgICAgICBydWxlczogW10sXHJcbiAgICAgICAgICAgIGRldmljZXM6IFtdLFxyXG4gICAgICAgICAgICB1c2VyczogW10sXHJcbiAgICAgICAgICAgIHpvbmVUeXBlczogW10sXHJcbiAgICAgICAgICAgIHpvbmVzOiBbXSxcclxuICAgICAgICAgICAgd29ya1RpbWVzOiBbXSxcclxuICAgICAgICAgICAgd29ya0hvbGlkYXlzOiBbXSxcclxuICAgICAgICAgICAgc2VjdXJpdHlHcm91cHM6IFtdLFxyXG4gICAgICAgICAgICBkaWFnbm9zdGljczogW10sXHJcbiAgICAgICAgICAgIGN1c3RvbU1hcHM6IFtdLFxyXG4gICAgICAgICAgICBub3RpZmljYXRpb25UZW1wbGF0ZXM6IFtdXHJcbiAgICAgICAgfTtcclxuICAgICAgICByZXR1cm4gT2JqZWN0LmtleXModG90YWwpLnJlZHVjZSgoZGVwZW5kZW5jaWVzLCBkZXBlbmRlbmN5TmFtZTogc3RyaW5nKSA9PiB7XHJcbiAgICAgICAgICAgIGRlcGVuZGVuY2llc1tkZXBlbmRlbmN5TmFtZV0gPSBtZXJnZVVuaXF1ZShkZXBlbmRlbmNpZXNbZGVwZW5kZW5jeU5hbWVdLCAuLi5hbGxEZXBlbmRlbmNpZXMubWFwKChlbnRpdHlEZXBlbmRlbmNpZXMpID0+IGVudGl0eURlcGVuZGVuY2llc1tkZXBlbmRlbmN5TmFtZV0pKTtcclxuICAgICAgICAgICAgcmV0dXJuIGRlcGVuZGVuY2llcztcclxuICAgICAgICB9LCB0b3RhbCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhZGROZXdHcm91cHMgKGdyb3Vwczogc3RyaW5nW10sIGRhdGE6IElJbXBvcnREYXRhKTogUHJvbWlzZTxhbnk+IHtcclxuICAgICAgICBpZiAoIWdyb3VwcyB8fCAhZ3JvdXBzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICByZXR1cm4gcmVzb2x2ZWRQcm9taXNlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGxldCBncm91cHNEYXRhID0gdGhpcy5ncm91cHNCdWlsZGVyLmdldEdyb3Vwc0RhdGEoZ3JvdXBzLCB0cnVlKSxcclxuICAgICAgICAgICAgbmV3R3JvdXBzVXNlcnMgPSBnZXRVbmlxdWVFbnRpdGllcyh0aGlzLmdyb3Vwc0J1aWxkZXIuZ2V0UHJpdmF0ZUdyb3Vwc1VzZXJzKGdyb3Vwc0RhdGEpLCBkYXRhLnVzZXJzKTtcclxuICAgICAgICBkYXRhLmdyb3VwcyA9IG1lcmdlVW5pcXVlRW50aXRpZXMoZGF0YS5ncm91cHMsIGdyb3Vwc0RhdGEpO1xyXG4gICAgICAgIGRhdGEudXNlcnMgPSBtZXJnZVVuaXF1ZUVudGl0aWVzKGRhdGEudXNlcnMsIG5ld0dyb3Vwc1VzZXJzKTtcclxuICAgICAgICByZXR1cm4gdGhpcy5yZXNvbHZlRGVwZW5kZW5jaWVzKHt1c2VyczogZ2V0RW50aXRpZXNJZHMobmV3R3JvdXBzVXNlcnMpfSwgZGF0YSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhZGROZXdDdXN0b21NYXBzIChjdXN0b21NYXBzSWRzOiBzdHJpbmdbXSwgZGF0YTogSUltcG9ydERhdGEpIHtcclxuICAgICAgICBpZiAoIWN1c3RvbU1hcHNJZHMgfHwgIWN1c3RvbU1hcHNJZHMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgbGV0IGN1c3RvbU1hcHNEYXRhID0gY3VzdG9tTWFwc0lkcy5yZWR1Y2UoKGRhdGEsIGN1c3RvbU1hcElkOiBzdHJpbmcpID0+IHtcclxuICAgICAgICAgICAgbGV0IGN1c3RvbU1hcERhdGEgPSB0aGlzLm1pc2NCdWlsZGVyLmdldE1hcFByb3ZpZGVyRGF0YShjdXN0b21NYXBJZCk7XHJcbiAgICAgICAgICAgIGN1c3RvbU1hcERhdGEgJiYgZGF0YS5wdXNoKGN1c3RvbU1hcERhdGEpO1xyXG4gICAgICAgICAgICByZXR1cm4gZGF0YTtcclxuICAgICAgICB9LCBbXSk7XHJcbiAgICAgICAgZGF0YS5jdXN0b21NYXBzID0gbWVyZ2VVbmlxdWVFbnRpdGllcyhkYXRhLmN1c3RvbU1hcHMsIGN1c3RvbU1hcHNEYXRhKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFkZE5ld05vdGlmaWNhdGlvblRlbXBsYXRlcyAobm90aWZpY2F0aW9uVGVtcGxhdGVzSWRzOiBzdHJpbmdbXSwgZGF0YTogSUltcG9ydERhdGEpIHtcclxuICAgICAgICBpZiAoIW5vdGlmaWNhdGlvblRlbXBsYXRlc0lkcyB8fCAhbm90aWZpY2F0aW9uVGVtcGxhdGVzSWRzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGxldCBub3RpZmljYXRpb25UZW1wbGF0ZXNEYXRhID0gbm90aWZpY2F0aW9uVGVtcGxhdGVzSWRzLnJlZHVjZSgoZGF0YSwgdGVtcGxhdGVJZDogc3RyaW5nKSA9PiB7XHJcbiAgICAgICAgICAgIGxldCB0ZW1wbGF0ZURhdGEgPSB0aGlzLmRpc3RyaWJ1dGlvbkxpc3RzQnVpbGRlci5nZXROb3RpZmljYXRpb25UZW1wbGF0ZURhdGEodGVtcGxhdGVJZCk7XHJcbiAgICAgICAgICAgIHRlbXBsYXRlRGF0YSAmJiBkYXRhLnB1c2godGVtcGxhdGVEYXRhKTtcclxuICAgICAgICAgICAgcmV0dXJuIGRhdGE7XHJcbiAgICAgICAgfSwgW10pO1xyXG4gICAgICAgIGRhdGEubm90aWZpY2F0aW9uVGVtcGxhdGVzID0gbWVyZ2VVbmlxdWVFbnRpdGllcyhkYXRhLm5vdGlmaWNhdGlvblRlbXBsYXRlcywgbm90aWZpY2F0aW9uVGVtcGxhdGVzRGF0YSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBnZXRFbnR5dGllc0lkcyAoZW50aXRpZXM6IElFbnRpdHlbXSk6IHN0cmluZ1tdIHtcclxuICAgICAgICByZXR1cm4gZW50aXRpZXMucmVkdWNlKChyZXMsIGVudGl0eSkgPT4ge1xyXG4gICAgICAgICAgICBlbnRpdHkgJiYgZW50aXR5LmlkICYmIHJlcy5wdXNoKGVudGl0eS5pZCk7XHJcbiAgICAgICAgICAgIHJldHVybiByZXM7XHJcbiAgICAgICAgfSwgW10pO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgZ2V0RW50aXR5RGVwZW5kZW5jaWVzIChlbnRpdHk6IElFbnRpdHksIGVudGl0eVR5cGUpIHtcclxuICAgICAgICBsZXQgZW50aXR5RGVwZW5kZW5jaWVzOiBJRGVwZW5kZW5jaWVzID0ge307XHJcbiAgICAgICAgc3dpdGNoIChlbnRpdHlUeXBlKSB7XHJcbiAgICAgICAgICAgIGNhc2UgXCJkZXZpY2VzXCI6XHJcbiAgICAgICAgICAgICAgICBlbnRpdHlEZXBlbmRlbmNpZXMuZ3JvdXBzID0gdGhpcy5nZXRFbnR5dGllc0lkcyhlbnRpdHlbXCJncm91cHNcIl0uY29uY2F0KGVudGl0eVtcImF1dG9Hcm91cHNcIl0pKTtcclxuICAgICAgICAgICAgICAgIGVudGl0eVtcIndvcmtUaW1lXCJdLmlkICYmIChlbnRpdHlEZXBlbmRlbmNpZXMud29ya1RpbWVzID0gW2VudGl0eVtcIndvcmtUaW1lXCJdLmlkXSk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBcInVzZXJzXCI6XHJcbiAgICAgICAgICAgICAgICBlbnRpdHlEZXBlbmRlbmNpZXMuZ3JvdXBzID0gdGhpcy5nZXRFbnR5dGllc0lkcyhlbnRpdHlbXCJjb21wYW55R3JvdXBzXCJdLmNvbmNhdChlbnRpdHlbXCJkcml2ZXJHcm91cHNcIl0pLmNvbmNhdChlbnRpdHlbXCJwcml2YXRlVXNlckdyb3Vwc1wiXSkuY29uY2F0KGVudGl0eVtcInJlcG9ydEdyb3Vwc1wiXSkpO1xyXG4gICAgICAgICAgICAgICAgZW50aXR5RGVwZW5kZW5jaWVzLnNlY3VyaXR5R3JvdXBzID0gdGhpcy5nZXRFbnR5dGllc0lkcyhlbnRpdHlbXCJzZWN1cml0eUdyb3Vwc1wiXSk7XHJcbiAgICAgICAgICAgICAgICBlbnRpdHlEZXBlbmRlbmNpZXMuY3VzdG9tTWFwcyA9IFtlbnRpdHlbXCJkZWZhdWx0TWFwRW5naW5lXCJdXTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFwiem9uZXNcIjpcclxuICAgICAgICAgICAgICAgIGxldCB6b25lVHlwZXMgPSB0aGlzLmdldEVudHl0aWVzSWRzKGVudGl0eVtcInpvbmVUeXBlc1wiXSk7XHJcbiAgICAgICAgICAgICAgICB6b25lVHlwZXMubGVuZ3RoICYmIChlbnRpdHlEZXBlbmRlbmNpZXMuem9uZVR5cGVzID0gem9uZVR5cGVzKTtcclxuICAgICAgICAgICAgICAgIGVudGl0eURlcGVuZGVuY2llcy5ncm91cHMgPSB0aGlzLmdldEVudHl0aWVzSWRzKGVudGl0eVtcImdyb3Vwc1wiXSk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBcIndvcmtUaW1lc1wiOlxyXG4gICAgICAgICAgICAgICAgZW50aXR5W1wiaG9saWRheUdyb3VwXCJdLmdyb3VwSWQgJiYgKGVudGl0eURlcGVuZGVuY2llcy53b3JrSG9saWRheXMgPSBbZW50aXR5W1wiaG9saWRheUdyb3VwXCJdLmdyb3VwSWRdKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBlbnRpdHlEZXBlbmRlbmNpZXM7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhcHBseVRvRW50aXRpZXMgKGVudGl0aWVzTGlzdDogSURlcGVuZGVuY2llcywgaW5pdGlhbFZhbHVlLCBmdW5jOiAocmVzdWx0LCBlbnRpdHksIGVudGl0eVR5cGU6IHN0cmluZywgZW50aXR5SW5kZXg6IG51bWJlciwgZW50aXR5VHlwZUluZGV4OiBudW1iZXIsIG92ZXJhbGxJbmRleDogbnVtYmVyKSA9PiBhbnkpIHtcclxuICAgICAgICBsZXQgb3ZlcmFsbEluZGV4ID0gMDtcclxuICAgICAgICByZXR1cm4gT2JqZWN0LmtleXMoZW50aXRpZXNMaXN0KS5yZWR1Y2UoKHJlc3VsdCwgZW50aXR5VHlwZSwgdHlwZUluZGV4KSA9PiB7XHJcbiAgICAgICAgICAgIHJldHVybiBlbnRpdGllc0xpc3RbZW50aXR5VHlwZV0ucmVkdWNlKChyZXMsIGVudGl0eSwgaW5kZXgpID0+IHtcclxuICAgICAgICAgICAgICAgIG92ZXJhbGxJbmRleCsrO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZ1bmMocmVzLCBlbnRpdHksIGVudGl0eVR5cGUsIGluZGV4LCB0eXBlSW5kZXgsIG92ZXJhbGxJbmRleCAtIDEpO1xyXG4gICAgICAgICAgICB9LCByZXN1bHQpO1xyXG4gICAgICAgIH0sIGluaXRpYWxWYWx1ZSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSByZXNvbHZlRGVwZW5kZW5jaWVzIChkZXBlbmRlbmNpZXM6IElEZXBlbmRlbmNpZXMsIGRhdGE6IElJbXBvcnREYXRhKSB7XHJcbiAgICAgICAgbGV0IGdldERhdGEgPSAoZW50aXRpZXNMaXN0OiBJRGVwZW5kZW5jaWVzKTogUHJvbWlzZTxJSW1wb3J0RGF0YT4gPT4ge1xyXG4gICAgICAgICAgICAgICAgbGV0IGVudGl0eVJlcXVlc3RUeXBlcyA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGV2aWNlczogXCJEZXZpY2VcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgdXNlcnM6IFwiVXNlclwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB6b25lVHlwZXM6IFwiWm9uZVR5cGVcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgem9uZXM6IFwiWm9uZVwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB3b3JrVGltZXM6IFwiV29ya1RpbWVcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgd29ya0hvbGlkYXlzOiBcIldvcmtIb2xpZGF5XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlY3VyaXR5R3JvdXBzOiBcIkdyb3VwXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpYWdub3N0aWNzOiBcIkRpYWdub3N0aWNcIixcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVlc3RzOiBhbnkgPSB0aGlzLmFwcGx5VG9FbnRpdGllcyhlbnRpdGllc0xpc3QsIHt9LCAocmVzdWx0LCBlbnRpdHlJZCwgZW50aXR5VHlwZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgcmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGVOYW1lOiBlbnRpdHlSZXF1ZXN0VHlwZXNbZW50aXR5VHlwZV0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWFyY2g6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZDogZW50aXR5SWRcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVudGl0eVJlcXVlc3RUeXBlc1tlbnRpdHlUeXBlXSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVudGl0eVR5cGUgPT09IFwid29ya0hvbGlkYXlzXCIgfHwgZW50aXR5VHlwZSA9PT0gXCJzZWN1cml0eUdyb3Vwc1wiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICFyZXN1bHRbZW50aXR5VHlwZV0gJiYgKHJlc3VsdFtlbnRpdHlUeXBlXSA9IFtdKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdFtlbnRpdHlUeXBlXS5wdXNoKFtcIkdldFwiLCByZXF1ZXN0XSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoZW50aXRpZXNMaXN0LnNlY3VyaXR5R3JvdXBzICYmIGVudGl0aWVzTGlzdC5zZWN1cml0eUdyb3Vwcy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXF1ZXN0cy5zZWN1cml0eUdyb3VwcyA9IFtbXCJHZXRcIiwge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlTmFtZTogZW50aXR5UmVxdWVzdFR5cGVzLnNlY3VyaXR5R3JvdXBzLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWFyY2g6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkOiBcIkdyb3VwU2VjdXJpdHlJZFwiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XV07XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAoZW50aXRpZXNMaXN0LndvcmtIb2xpZGF5cyAmJiBlbnRpdGllc0xpc3Qud29ya0hvbGlkYXlzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVlc3RzLndvcmtIb2xpZGF5cyA9IFtbXCJHZXRcIiwge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlTmFtZTogZW50aXR5UmVxdWVzdFR5cGVzLndvcmtIb2xpZGF5c1xyXG4gICAgICAgICAgICAgICAgICAgIH1dXTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5hZGROZXdHcm91cHMoZW50aXRpZXNMaXN0Lmdyb3VwcywgZGF0YSkudGhlbigoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGROZXdDdXN0b21NYXBzKGVudGl0aWVzTGlzdC5jdXN0b21NYXBzLCBkYXRhKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZE5ld05vdGlmaWNhdGlvblRlbXBsYXRlcyhlbnRpdGllc0xpc3Qubm90aWZpY2F0aW9uVGVtcGxhdGVzLCBkYXRhKTtcclxuICAgICAgICAgICAgICAgICAgICBkZWxldGUgZW50aXRpZXNMaXN0Lmdyb3VwcztcclxuICAgICAgICAgICAgICAgICAgICBkZWxldGUgZW50aXRpZXNMaXN0LmN1c3RvbU1hcHM7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPElJbXBvcnREYXRhPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCByZXF1ZXN0RW50aXRpZXMgPSBPYmplY3Qua2V5cyhyZXF1ZXN0cyksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXF1ZXN0c0FycmF5ID0gcmVxdWVzdEVudGl0aWVzLnJlZHVjZSgobGlzdCwgdHlwZSkgPT4gbGlzdC5jb25jYXQocmVxdWVzdHNbdHlwZV0pLCBbXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghcmVxdWVzdEVudGl0aWVzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmUoZGF0YSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5hcGkubXVsdGlDYWxsKHJlcXVlc3RzQXJyYXksIChyZXNwb25zZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBuZXdHcm91cHMgPSBbXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3Q3VzdG9tTWFwcyA9IFtdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdEZXBlbmRlbmNpZXM6IElEZXBlbmRlbmNpZXMgPSB7fSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXhwb3J0ZWREYXRhOiBhbnkgPSB0aGlzLmFwcGx5VG9FbnRpdGllcyhyZXF1ZXN0cywge30sIChyZXN1bHQsIHJlcXVlc3QsIGVudGl0eVR5cGUsIGVudGl0eUluZGV4LCBlbnRpdHlUeXBlSW5kZXgsIG92ZXJhbGxJbmRleCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGl0ZW1zID0gcmVxdWVzdHNBcnJheS5sZW5ndGggPiAxID8gcmVzcG9uc2Vbb3ZlcmFsbEluZGV4XSA6IHJlc3BvbnNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbXMuZm9yRWFjaCgoaXRlbSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0gPSBpdGVtWzBdIHx8IGl0ZW07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIXJlc3VsdFtlbnRpdHlUeXBlXSAmJiAocmVzdWx0W2VudGl0eVR5cGVdID0gW10pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlbnRpdHlUeXBlID09PSBcIndvcmtIb2xpZGF5c1wiICYmICghaXRlbS5ob2xpZGF5R3JvdXAgfHwgZW50aXRpZXNMaXN0LndvcmtIb2xpZGF5cy5pbmRleE9mKGl0ZW0uaG9saWRheUdyb3VwLmdyb3VwSWQpID09PSAtMSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZW50aXR5VHlwZSA9PT0gXCJzZWN1cml0eUdyb3Vwc1wiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlbnRpdGllc0xpc3Quc2VjdXJpdHlHcm91cHMuaW5kZXhPZihpdGVtLmlkKSA+IC0xKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHRbZW50aXR5VHlwZV0gPSByZXN1bHRbZW50aXR5VHlwZV0uY29uY2F0KHRoaXMuZ3JvdXBzQnVpbGRlci5nZXRDdXN0b21Hcm91cHNEYXRhKGVudGl0aWVzTGlzdC5zZWN1cml0eUdyb3VwcywgaXRlbXMpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZW50aXR5VHlwZSA9PT0gXCJ1c2Vyc1wiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0udXNlckF1dGhlbnRpY2F0aW9uVHlwZSA9IFwiQmFzaWNBdXRoZW50aWNhdGlvblwiO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgZW50aXR5RGVwZW5kZW5jaWVzID0gdGhpcy5nZXRFbnRpdHlEZXBlbmRlbmNpZXMoaXRlbSwgZW50aXR5VHlwZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3RGVwZW5kZW5jaWVzID0gdGhpcy5hcHBseVRvRW50aXRpZXMoZW50aXR5RGVwZW5kZW5jaWVzLCBuZXdEZXBlbmRlbmNpZXMsIChyZXN1bHQsIGVudGl0eUlkLCBlbnRpdHlUeXBlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICFyZXN1bHRbZW50aXR5VHlwZV0gJiYgKHJlc3VsdFtlbnRpdHlUeXBlXSA9IFtdKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0W2VudGl0eVR5cGVdID0gbWVyZ2VVbmlxdWUocmVzdWx0W2VudGl0eVR5cGVdLCBbZW50aXR5SWRdKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdHcm91cHMgPSBuZXdHcm91cHMuY29uY2F0KG5ld0RlcGVuZGVuY2llcy5ncm91cHMgfHwgW10pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld0N1c3RvbU1hcHMgPSBuZXdDdXN0b21NYXBzLmNvbmNhdChuZXdEZXBlbmRlbmNpZXMuY3VzdG9tTWFwcyB8fCBbXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIG5ld0RlcGVuZGVuY2llcy5ncm91cHM7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIG5ld0RlcGVuZGVuY2llcy5jdXN0b21NYXBzO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdFtlbnRpdHlUeXBlXS5wdXNoKGl0ZW0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdEZXBlbmRlbmNpZXMgPSBPYmplY3Qua2V5cyhuZXdEZXBlbmRlbmNpZXMpLnJlZHVjZSgocmVzdWx0LCBkZXBlbmRlbmN5TmFtZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgZW50aXRpZXMgPSBuZXdEZXBlbmRlbmNpZXNbZGVwZW5kZW5jeU5hbWVdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXhwb3J0ZWQgPSAoZXhwb3J0ZWREYXRhW2RlcGVuZGVuY3lOYW1lXSB8fCBbXSkubWFwKGVudGl0eSA9PiBlbnRpdHkuaWQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbnRpdGllcy5mb3JFYWNoKGVudGl0eUlkID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChleHBvcnRlZC5pbmRleE9mKGVudGl0eUlkKSA9PT0gLTEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAhcmVzdWx0W2RlcGVuZGVuY3lOYW1lXSAmJiAocmVzdWx0W2RlcGVuZGVuY3lOYW1lXSA9IFtdKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHRbZGVwZW5kZW5jeU5hbWVdLnB1c2goZW50aXR5SWQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LCB7fSBhcyBJSW1wb3J0RGF0YSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gUmVtb3ZlIGJ1aWx0LWluIHNlY3VyaXR5IGdyb3Vwc1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4cG9ydGVkRGF0YS5zZWN1cml0eUdyb3VwcyAmJiAoZXhwb3J0ZWREYXRhLnNlY3VyaXR5R3JvdXBzID0gZXhwb3J0ZWREYXRhLnNlY3VyaXR5R3JvdXBzLnJlZHVjZSgocmVzdWx0LCBncm91cCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBncm91cC5pZC5pbmRleE9mKFwiR3JvdXBcIikgPT09IC0xICYmIHJlc3VsdC5wdXNoKGdyb3VwKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LCBbXSkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkTmV3R3JvdXBzKG5ld0dyb3VwcywgZGF0YSkudGhlbigoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkTmV3Q3VzdG9tTWFwcyhuZXdDdXN0b21NYXBzLCBkYXRhKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgT2JqZWN0LmtleXMoZXhwb3J0ZWREYXRhKS5mb3JFYWNoKChlbnRpdHlUeXBlOiBzdHJpbmcpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGFbZW50aXR5VHlwZV0gPSBtZXJnZVVuaXF1ZUVudGl0aWVzKGRhdGFbZW50aXR5VHlwZV0sIGV4cG9ydGVkRGF0YVtlbnRpdHlUeXBlXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoT2JqZWN0LmtleXMobmV3RGVwZW5kZW5jaWVzKS5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUodGhpcy5yZXNvbHZlRGVwZW5kZW5jaWVzKG5ld0RlcGVuZGVuY2llcywgZGF0YSkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShkYXRhKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sIHJlamVjdCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LCByZWplY3QpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPElJbXBvcnREYXRhPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgICAgIHJldHVybiBnZXREYXRhKGRlcGVuZGVuY2llcykudGhlbihyZXNvbHZlKS5jYXRjaChyZWplY3QpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYWJvcnRDdXJyZW50VGFzayAoKSB7XHJcbiAgICAgICAgdGhpcy50b2dnbGVXYWl0aW5nKCk7XHJcbiAgICAgICAgdGhpcy5jdXJyZW50VGFzayAmJiB0aGlzLmN1cnJlbnRUYXNrLmFib3J0ICYmIHRoaXMuY3VycmVudFRhc2suYWJvcnQoKTtcclxuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrID0gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHRvZ2dsZUV4cG9ydEJ1dHRvbiAoaXNEaXNhYmxlZDogYm9vbGVhbikge1xyXG4gICAgICAgICg8SFRNTElucHV0RWxlbWVudD50aGlzLmV4cG9ydEJ0bikuZGlzYWJsZWQgPSBpc0Rpc2FibGVkO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgcmVhZG9ubHkgdG9nZ2xlV2FpdGluZyA9IChpc1N0YXJ0ID0gZmFsc2UpID0+IHtcclxuICAgICAgICBpZiAoaXNTdGFydCkge1xyXG4gICAgICAgICAgICB0aGlzLnRvZ2dsZUV4cG9ydEJ1dHRvbih0cnVlKTtcclxuICAgICAgICAgICAgdGhpcy53YWl0aW5nLnN0YXJ0KGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYWRkaW5Db250YWluZXJcIikucGFyZW50RWxlbWVudCwgOTk5OSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy50b2dnbGVFeHBvcnRCdXR0b24oZmFsc2UpO1xyXG4gICAgICAgICAgICB0aGlzLndhaXRpbmcuc3RvcCgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvL0JyZXR0IC0gZGlzcGxheXMgdGhlIG91dHB1dCBvbiB0aGUgcGFnZVxyXG4gICAgcHJpdmF0ZSBzaG93RW50aXR5TWVzc2FnZSAoYmxvY2s6IEhUTUxFbGVtZW50LCBxdHk6IG51bWJlciwgZW50aXR5TmFtZTogc3RyaW5nKSB7XHJcbiAgICAgICAgbGV0IGJsb2NrRWwgPSBibG9jay5xdWVyeVNlbGVjdG9yKFwiLmRlc2NyaXB0aW9uXCIpO1xyXG4gICAgICAgIGlmIChxdHkpIHtcclxuICAgICAgICAgICAgcXR5ID4gMSAmJiAoZW50aXR5TmFtZSArPSBcInNcIik7XHJcbiAgICAgICAgICAgIGxldCBoYXNJdGVtc01lc3NhZ2VUZW1wbGF0ZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiaGFzSXRlbXNNZXNzYWdlVGVtcGxhdGVcIikuaW5uZXJIVE1MO1xyXG4gICAgICAgICAgICBibG9ja0VsLmlubmVySFRNTCA9IGhhc0l0ZW1zTWVzc2FnZVRlbXBsYXRlLnJlcGxhY2UoXCJ7cXVhbnRpdHl9XCIsIHF0eS50b1N0cmluZygpKS5yZXBsYWNlKFwie2VudGl0eX1cIiwgZW50aXR5TmFtZSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgYmxvY2tFbC5pbm5lckhUTUwgPSBgWW91IGhhdmUgPHNwYW4gY2xhc3M9XCJib2xkXCI+bm90IGNvbmZpZ3VyZWQgYW55ICR7IGVudGl0eU5hbWUgfXM8L3NwYW4+LmA7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgc2hvd1N5c3RlbVNldHRpbmdzTWVzc2FnZSAoYmxvY2s6IEhUTUxFbGVtZW50LCBpc0luY2x1ZGVkOiBib29sZWFuKSB7XHJcbiAgICAgICAgbGV0IGJsb2NrRWwgPSBibG9jay5xdWVyeVNlbGVjdG9yKFwiLmRlc2NyaXB0aW9uXCIpO1xyXG4gICAgICAgIGlmIChpc0luY2x1ZGVkKSB7XHJcbiAgICAgICAgICAgIGJsb2NrRWwuaW5uZXJIVE1MID0gXCJZb3UgaGF2ZSBjaG9zZW4gPHNwYW4gY2xhc3M9J2JvbGQnPnRvIGluY2x1ZGU8L3NwYW4+IHN5c3RlbSBzZXR0aW5ncy5cIjtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBibG9ja0VsLmlubmVySFRNTCA9IFwiWW91IGhhdmUgY2hvc2VuIDxzcGFuIGNsYXNzPSdib2xkJz5ub3QgdG8gaW5jbHVkZTwvc3Bhbj4gc3lzdGVtIHNldHRpbmdzLlwiO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHNldEFkZGluc1RvTnVsbCgpIHtcclxuICAgICAgICBpZiAoKHRoaXMuZGF0YS5taXNjICE9IG51bGwpIHx8ICh0aGlzLmRhdGEubWlzYyAhPSB1bmRlZmluZWQpKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZGF0YS5taXNjLmFkZGlucyA9IFtdO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvL2luaXRpYWxpemUgYWRkaW4gXHJcbiAgICBjb25zdHJ1Y3RvciAoYXBpKSB7XHJcbiAgICAgICAgdGhpcy5hcGkgPSBhcGk7XHJcbiAgICAgICAgdGhpcy5ncm91cHNCdWlsZGVyID0gbmV3IEdyb3Vwc0J1aWxkZXIoYXBpKTtcclxuICAgICAgICB0aGlzLnNlY3VyaXR5Q2xlYXJhbmNlc0J1aWxkZXIgPSBuZXcgU2VjdXJpdHlDbGVhcmFuY2VzQnVpbGRlcihhcGkpO1xyXG4gICAgICAgIHRoaXMucmVwb3J0c0J1aWxkZXIgPSBuZXcgUmVwb3J0c0J1aWxkZXIoYXBpKTtcclxuICAgICAgICB0aGlzLnJ1bGVzQnVpbGRlciA9IG5ldyBSdWxlc0J1aWxkZXIoYXBpKTtcclxuICAgICAgICB0aGlzLmRpc3RyaWJ1dGlvbkxpc3RzQnVpbGRlciA9IG5ldyBEaXN0cmlidXRpb25MaXN0c0J1aWxkZXIoYXBpKTtcclxuICAgICAgICB0aGlzLm1pc2NCdWlsZGVyID0gbmV3IE1pc2NCdWlsZGVyKGFwaSk7XHJcbiAgICAgICAgLy9UT0RPOiBCcmV0dCAtIGxlZnQgaGVyZSBhcyBJIHdpbGwgYmUgaW50cm9kdWNpbmcgdGhlIHVzZXIgZmV0Y2ggc29vblxyXG4gICAgICAgIC8vIHRoaXMudXNlckJ1aWxkZXIgPSBuZXcgVXNlckJ1aWxkZXIoYXBpKTtcclxuICAgICAgICB0aGlzLnpvbmVCdWlsZGVyID0gbmV3IFpvbmVCdWlsZGVyKGFwaSk7XHJcbiAgICAgICAgdGhpcy53YWl0aW5nID0gbmV3IFdhaXRpbmcoKTtcclxuICAgIH1cclxuXHJcbiAgICAvL0JyZXR0OiBleHBvcnRzIHRoZSBkYXRhXHJcbiAgICBleHBvcnREYXRhID0gKCkgPT4ge1xyXG4gICAgICAgIHRoaXMudG9nZ2xlV2FpdGluZyh0cnVlKTtcclxuICAgICAgICByZXR1cm4gdGhpcy5yZXBvcnRzQnVpbGRlci5nZXREYXRhKCkudGhlbigocmVwb3J0c0RhdGEpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5kYXRhLnJlcG9ydHMgPSByZXBvcnRzRGF0YTtcclxuICAgICAgICAgICAgY29uc29sZS5sb2codGhpcy5kYXRhKTtcclxuICAgICAgICAgICAgZG93bmxvYWREYXRhQXNGaWxlKEpTT04uc3RyaW5naWZ5KHRoaXMuZGF0YSksIFwiZXhwb3J0Lmpzb25cIik7XHJcbiAgICAgICAgfSkuY2F0Y2goKGUpID0+IHtcclxuICAgICAgICAgICAgYWxlcnQoXCJDYW4ndCBleHBvcnQgZGF0YS5cXG5QbGVhc2UgdHJ5IGFnYWluIGxhdGVyLlwiKTtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlKTtcclxuICAgICAgICB9KS5maW5hbGx5KCgpID0+IHRoaXMudG9nZ2xlV2FpdGluZygpKTtcclxuICAgIH1cclxuXHJcbiAgICBzYXZlQ2hhbmdlcyA9ICgpID0+IHtcclxuICAgICAgICB0aGlzLnJlbmRlcigpO1xyXG4gICAgICAgICg8SFRNTElucHV0RWxlbWVudD50aGlzLmV4cG9ydEJ0bikuZGlzYWJsZWQgPSBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICBjaGVja0JveFZhbHVlQ2hhbmdlZCA9ICgpID0+IHtcclxuICAgICAgICAoPEhUTUxJbnB1dEVsZW1lbnQ+dGhpcy5leHBvcnRCdG4pLmRpc2FibGVkID0gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICBhZGRFdmVudEhhbmRsZXJzKCkge1xyXG4gICAgICAgIHRoaXMuZXhwb3J0QnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLmV4cG9ydERhdGEsIGZhbHNlKTtcclxuICAgICAgICB0aGlzLnNhdmVCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMuc2F2ZUNoYW5nZXMsIGZhbHNlKTtcclxuICAgICAgICB0aGlzLmV4cG9ydEFsbEFkZGluc0NoZWNrYm94LmFkZEV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgdGhpcy5jaGVja0JveFZhbHVlQ2hhbmdlZCwgZmFsc2UpO1xyXG4gICAgICAgIHRoaXMuZXhwb3J0QWxsWm9uZXNDaGVja2JveC5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsIHRoaXMuY2hlY2tCb3hWYWx1ZUNoYW5nZWQsIGZhbHNlKTtcclxuICAgICAgICB0aGlzLmV4cG9ydFN5c3RlbVNldHRpbmdzQ2hlY2tib3guYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCB0aGlzLmNoZWNrQm94VmFsdWVDaGFuZ2VkLCBmYWxzZSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmVuZGVyICgpIHtcclxuICAgICAgICAvL1RPRE86IEJyZXR0IC0gbGVmdCBoZXJlIGFzIEkgd2lsbCBiZSBpbnRyb2R1Y2luZyB0aGUgdXNlciBmZXRjaCBzb29uXHJcbiAgICAgICAgLy8gdGhpcy5kYXRhLnVzZXJzID0gW107XHJcbiAgICAgICAgdGhpcy5kYXRhLnpvbmVzID0gW107XHJcbiAgICAgICAgLy93aXJlIHVwIHRoZSBkb21cclxuICAgICAgICBsZXQgbWFwTWVzc2FnZVRlbXBsYXRlOiBzdHJpbmcgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm1hcE1lc3NhZ2VUZW1wbGF0ZVwiKS5pbm5lckhUTUwsXHJcbiAgICAgICAgICAgIGdyb3Vwc0Jsb2NrOiBIVE1MRWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZXhwb3J0ZWRHcm91cHNcIiksXHJcbiAgICAgICAgICAgIHNlY3VyaXR5Q2xlYXJhbmNlc0Jsb2NrOiBIVE1MRWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZXhwb3J0ZWRTZWN1cml0eUNsZWFyYW5jZXNcIiksXHJcbiAgICAgICAgICAgIHJ1bGVzQmxvY2s6IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJleHBvcnRlZFJ1bGVzXCIpLFxyXG4gICAgICAgICAgICByZXBvcnRzQmxvY2s6IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJleHBvcnRlZFJlcG9ydHNcIiksXHJcbiAgICAgICAgICAgIGRhc2hib2FyZHNCbG9jazogSFRNTEVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImV4cG9ydGVkRGFzaGJvYXJkc1wiKSxcclxuICAgICAgICAgICAgYWRkaW5zQmxvY2s6IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJleHBvcnRlZEFkZGluc1wiKSxcclxuICAgICAgICAgICAgbWFwQmxvY2tEZXNjcmlwdGlvbjogSFRNTEVsZW1lbnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI2V4cG9ydGVkTWFwID4gLmRlc2NyaXB0aW9uXCIpLFxyXG4gICAgICAgICAgICAvLyB1c2Vyc0Jsb2NrOiBIVE1MRWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZXhwb3J0ZWRVc2Vyc1wiKSxcclxuICAgICAgICAgICAgem9uZXNCbG9jazogSFRNTEVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImV4cG9ydGVkWm9uZXNcIiksXHJcbiAgICAgICAgICAgIHN5c3RlbVNldHRpbmdzQmxvY2s6IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJleHBvcnRTeXN0ZW1TZXR0aW5nc1wiKTtcclxuICAgICAgICB0aGlzLnRvZ2dsZVdhaXRpbmcodHJ1ZSk7XHJcbiAgICAgICAgcmV0dXJuIHRvZ2V0aGVyKFtcclxuICAgICAgICAgICAgLy9sb2FkcyB0aGUgZ3JvdXBzLiBUaGlzIGlzIHdoZXJlIHVzZXJzIGFyZSBhZGRlZCBpZiB0aGV5IGFyZSBsaW5rZWQgdG8gYSBncm91cFxyXG4gICAgICAgICAgICB0aGlzLmdyb3Vwc0J1aWxkZXIuZmV0Y2goKSxcclxuICAgICAgICAgICAgLy9sb2FkcyB0aGUgc2VjdXJpdHkgZ3JvdXBzIChzZWN1cml0eSBjbGVhcmFuY2UgaW4gdXNlciBhZG1pbiBpbiBNeUcpXHJcbiAgICAgICAgICAgIHRoaXMuc2VjdXJpdHlDbGVhcmFuY2VzQnVpbGRlci5mZXRjaCgpLFxyXG4gICAgICAgICAgICAvL3JlcG9ydCBsb2FkZXIuLi5zZWVtcyBvYnNvbGV0ZSB0byBtZVxyXG4gICAgICAgICAgICB0aGlzLnJlcG9ydHNCdWlsZGVyLmZldGNoKCksXHJcbiAgICAgICAgICAgIHRoaXMucnVsZXNCdWlsZGVyLmZldGNoKCksXHJcbiAgICAgICAgICAgIHRoaXMuZGlzdHJpYnV0aW9uTGlzdHNCdWlsZGVyLmZldGNoKCksXHJcbiAgICAgICAgICAgIC8vbWlzYyA9IHN5c3RlbSBzZXR0aW5nc1xyXG4gICAgICAgICAgICB0aGlzLm1pc2NCdWlsZGVyLmZldGNoKHRoaXMuZXhwb3J0U3lzdGVtU2V0dGluZ3NDaGVja2JveC5jaGVja2VkKSxcclxuICAgICAgICAgICAgLy9UT0RPOiBCcmV0dCAtIGxlZnQgaGVyZSBhcyBJIHdpbGwgYmUgaW50cm9kdWNpbmcgdGhlIHVzZXIgZmV0Y2ggc29vblxyXG4gICAgICAgICAgICAvLyB0aGlzLnVzZXJCdWlsZGVyLmZldGNoKCksXHJcbiAgICAgICAgICAgIHRoaXMuem9uZUJ1aWxkZXIuZmV0Y2goKVxyXG4gICAgICAgIF0pLnRoZW4oKHJlc3VsdHMpID0+IHtcclxuICAgICAgICAgICAgbGV0IHJlcG9ydHNEZXBlbmRlbmNpZXM6IElEZXBlbmRlbmNpZXMsXHJcbiAgICAgICAgICAgICAgICBydWxlc0RlcGVuZGVuY2llczogSURlcGVuZGVuY2llcyxcclxuICAgICAgICAgICAgICAgIGRpc3RyaWJ1dGlvbkxpc3RzRGVwZW5kZW5jaWVzOiBJRGVwZW5kZW5jaWVzLFxyXG4gICAgICAgICAgICAgICAgZGVwZW5kZW5jaWVzOiBJRGVwZW5kZW5jaWVzLFxyXG4gICAgICAgICAgICAgICAgY3VzdG9tTWFwO1xyXG4gICAgICAgICAgICB0aGlzLmRhdGEuZ3JvdXBzID0gcmVzdWx0c1swXTtcclxuICAgICAgICAgICAgdGhpcy5kYXRhLnNlY3VyaXR5R3JvdXBzID0gcmVzdWx0c1sxXTtcclxuICAgICAgICAgICAgdGhpcy5kYXRhLnJlcG9ydHMgPSByZXN1bHRzWzJdO1xyXG4gICAgICAgICAgICB0aGlzLmRhdGEucnVsZXMgPSByZXN1bHRzWzNdO1xyXG4gICAgICAgICAgICB0aGlzLmRhdGEuZGlzdHJpYnV0aW9uTGlzdHMgPSB0aGlzLmRpc3RyaWJ1dGlvbkxpc3RzQnVpbGRlci5nZXRSdWxlc0Rpc3RyaWJ1dGlvbkxpc3RzKHRoaXMuZGF0YS5ydWxlcy5tYXAocnVsZSA9PiBydWxlLmlkKSk7XHJcbiAgICAgICAgICAgIHRoaXMuZGF0YS5taXNjID0gcmVzdWx0c1s1XTtcclxuICAgICAgICAgICAgbGV0IGdldERlcGVuZGVuY2llcyA9IChlbnRpdGllczogYW55W10sIGVudGl0eVR5cGU6IHN0cmluZykgPT4ge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGVudGl0aWVzLnJlZHVjZSgocmVzLCBlbnRpdHkpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgZW50aXR5RGVwID0gdGhpcy5nZXRFbnRpdHlEZXBlbmRlbmNpZXMoZW50aXR5LCBlbnRpdHlUeXBlKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5jb21iaW5lRGVwZW5kZW5jaWVzKHJlcywgZW50aXR5RGVwKTtcclxuICAgICAgICAgICAgICAgIH0sIHt9KTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgbGV0IHpvbmVEZXBlbmRlbmNpZXMgPSB7fTtcclxuICAgICAgICAgICAgaWYodGhpcy5leHBvcnRBbGxab25lc0NoZWNrYm94LmNoZWNrZWQ9PXRydWUpe1xyXG4gICAgICAgICAgICAgICAgaWYocmVzdWx0c1s2XSl7XHJcbiAgICAgICAgICAgICAgICAgICAgLy9zZXRzIGV4cG9ydGVkIHpvbmVzIHRvIGFsbCBkYXRhYmFzZSB6b25lc1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZGF0YS56b25lcyA9IHJlc3VsdHNbNl07XHJcbiAgICAgICAgICAgICAgICAgICAgem9uZURlcGVuZGVuY2llcyA9IGdldERlcGVuZGVuY2llcyhyZXN1bHRzWzZdLCBcIlpvbmVcIik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYodGhpcy5leHBvcnRBbGxBZGRpbnNDaGVja2JveC5jaGVja2VkPT1mYWxzZSl7XHJcbiAgICAgICAgICAgICAgICAvL3NldHMgZXhwb3J0ZWQgYWRkaW5zIGVxdWFsIHRvIG5vbmUvZW1wdHkgYXJyYXlcclxuICAgICAgICAgICAgICAgIHRoaXMuc2V0QWRkaW5zVG9OdWxsKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY3VzdG9tTWFwID0gdGhpcy5taXNjQnVpbGRlci5nZXRNYXBQcm92aWRlckRhdGEodGhpcy5kYXRhLm1pc2MubWFwUHJvdmlkZXIudmFsdWUpO1xyXG4gICAgICAgICAgICBjdXN0b21NYXAgJiYgdGhpcy5kYXRhLmN1c3RvbU1hcHMucHVzaChjdXN0b21NYXApO1xyXG4gICAgICAgICAgICByZXBvcnRzRGVwZW5kZW5jaWVzID0gdGhpcy5yZXBvcnRzQnVpbGRlci5nZXREZXBlbmRlbmNpZXModGhpcy5kYXRhLnJlcG9ydHMpO1xyXG4gICAgICAgICAgICBydWxlc0RlcGVuZGVuY2llcyA9IHRoaXMucnVsZXNCdWlsZGVyLmdldERlcGVuZGVuY2llcyh0aGlzLmRhdGEucnVsZXMpO1xyXG4gICAgICAgICAgICBkaXN0cmlidXRpb25MaXN0c0RlcGVuZGVuY2llcyA9IHRoaXMuZGlzdHJpYnV0aW9uTGlzdHNCdWlsZGVyLmdldERlcGVuZGVuY2llcyh0aGlzLmRhdGEuZGlzdHJpYnV0aW9uTGlzdHMpO1xyXG4gICAgICAgICAgICBkZXBlbmRlbmNpZXMgPSB0aGlzLmNvbWJpbmVEZXBlbmRlbmNpZXMoem9uZURlcGVuZGVuY2llcywgcmVwb3J0c0RlcGVuZGVuY2llcywgcnVsZXNEZXBlbmRlbmNpZXMsIGRpc3RyaWJ1dGlvbkxpc3RzRGVwZW5kZW5jaWVzKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMucmVzb2x2ZURlcGVuZGVuY2llcyhkZXBlbmRlbmNpZXMsIHRoaXMuZGF0YSk7XHJcbiAgICAgICAgfSkudGhlbigoKSA9PiB7XHJcbiAgICAgICAgICAgIGxldCBtYXBQcm92aWRlciA9IHRoaXMubWlzY0J1aWxkZXIuZ2V0TWFwUHJvdmlkZXJOYW1lKHRoaXMuZGF0YS5taXNjLm1hcFByb3ZpZGVyLnZhbHVlKTtcclxuICAgICAgICAgICAgdGhpcy5zaG93RW50aXR5TWVzc2FnZShncm91cHNCbG9jaywgdGhpcy5kYXRhLmdyb3Vwcy5sZW5ndGggLSAxLCBcImdyb3VwXCIpO1xyXG4gICAgICAgICAgICB0aGlzLnNob3dFbnRpdHlNZXNzYWdlKHNlY3VyaXR5Q2xlYXJhbmNlc0Jsb2NrLCB0aGlzLmRhdGEuc2VjdXJpdHlHcm91cHMubGVuZ3RoLCBcInNlY3VyaXR5IGNsZWFyYW5jZVwiKTtcclxuICAgICAgICAgICAgdGhpcy5zaG93RW50aXR5TWVzc2FnZShydWxlc0Jsb2NrLCB0aGlzLmRhdGEucnVsZXMubGVuZ3RoLCBcInJ1bGVcIik7XHJcbiAgICAgICAgICAgIHRoaXMuc2hvd0VudGl0eU1lc3NhZ2UocmVwb3J0c0Jsb2NrLCB0aGlzLnJlcG9ydHNCdWlsZGVyLmdldEN1c3RvbWl6ZWRSZXBvcnRzUXR5KCksIFwicmVwb3J0XCIpO1xyXG4gICAgICAgICAgICB0aGlzLnNob3dFbnRpdHlNZXNzYWdlKGRhc2hib2FyZHNCbG9jaywgdGhpcy5yZXBvcnRzQnVpbGRlci5nZXREYXNoYm9hcmRzUXR5KCksIFwiZGFzaGJvYXJkXCIpO1xyXG4gICAgICAgICAgICBtYXBQcm92aWRlciAmJiAobWFwQmxvY2tEZXNjcmlwdGlvbi5pbm5lckhUTUwgPSBtYXBNZXNzYWdlVGVtcGxhdGUucmVwbGFjZShcInttYXBQcm92aWRlcn1cIiwgbWFwUHJvdmlkZXIpKTtcclxuICAgICAgICAgICAgdGhpcy5zaG93RW50aXR5TWVzc2FnZShhZGRpbnNCbG9jaywgdGhpcy5kYXRhLm1pc2MuYWRkaW5zLmxlbmd0aCwgXCJhZGRpblwiKTtcclxuICAgICAgICAgICAgLy8gdGhpcy5zaG93RW50aXR5TWVzc2FnZSh1c2Vyc0Jsb2NrLCB0aGlzLmRhdGEudXNlcnMubGVuZ3RoLCBcInVzZXJcIik7XHJcbiAgICAgICAgICAgIHRoaXMuc2hvd0VudGl0eU1lc3NhZ2Uoem9uZXNCbG9jaywgdGhpcy5kYXRhLnpvbmVzLmxlbmd0aCwgXCJ6b25lXCIpO1xyXG4gICAgICAgICAgICB0aGlzLnNob3dTeXN0ZW1TZXR0aW5nc01lc3NhZ2Uoc3lzdGVtU2V0dGluZ3NCbG9jaywgdGhpcy5leHBvcnRTeXN0ZW1TZXR0aW5nc0NoZWNrYm94LmNoZWNrZWQpO1xyXG4gICAgICAgICAgICAvL3RoaXMgZGlzcGxheXMgYWxsIHRoZSBkYXRhL29iamVjdHMgaW4gdGhlIGNvbnNvbGVcclxuICAgICAgICAgICAgY29uc29sZS5sb2codGhpcy5kYXRhKTtcclxuICAgICAgICB9KS5jYXRjaCgoZSkgPT4ge1xyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGUpO1xyXG4gICAgICAgICAgICBhbGVydChcIkNhbid0IGdldCBjb25maWcgdG8gZXhwb3J0XCIpO1xyXG4gICAgICAgIH0pLmZpbmFsbHkoKCkgPT4gdGhpcy50b2dnbGVXYWl0aW5nKCkpO1xyXG4gICAgfVxyXG5cclxuICAgIHVubG9hZCAoKSB7XHJcbiAgICAgICAgdGhpcy5hYm9ydEN1cnJlbnRUYXNrKCk7XHJcbiAgICAgICAgdGhpcy5ncm91cHNCdWlsZGVyLnVubG9hZCgpO1xyXG4gICAgICAgIHRoaXMuc2VjdXJpdHlDbGVhcmFuY2VzQnVpbGRlci51bmxvYWQoKTtcclxuICAgICAgICB0aGlzLnJlcG9ydHNCdWlsZGVyLnVubG9hZCgpO1xyXG4gICAgICAgIHRoaXMucnVsZXNCdWlsZGVyLnVubG9hZCgpO1xyXG4gICAgICAgIHRoaXMuZGlzdHJpYnV0aW9uTGlzdHNCdWlsZGVyLnVubG9hZCgpO1xyXG4gICAgICAgIHRoaXMubWlzY0J1aWxkZXIudW5sb2FkKCk7XHJcbiAgICAgICAgdGhpcy5leHBvcnRCdG4ucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMuZXhwb3J0RGF0YSwgZmFsc2UpO1xyXG4gICAgICAgIHRoaXMuc2F2ZUJ0bi5yZW1vdmVFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5zYXZlQ2hhbmdlcywgZmFsc2UpO1xyXG4gICAgICAgIHRoaXMuZXhwb3J0QWxsQWRkaW5zQ2hlY2tib3gucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCB0aGlzLmNoZWNrQm94VmFsdWVDaGFuZ2VkLCBmYWxzZSk7XHJcbiAgICAgICAgdGhpcy5leHBvcnRBbGxab25lc0NoZWNrYm94LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgdGhpcy5jaGVja0JveFZhbHVlQ2hhbmdlZCwgZmFsc2UpO1xyXG4gICAgICAgIHRoaXMuZXhwb3J0U3lzdGVtU2V0dGluZ3NDaGVja2JveC5yZW1vdmVFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsIHRoaXMuY2hlY2tCb3hWYWx1ZUNoYW5nZWQsIGZhbHNlKTtcclxuICAgIH1cclxufVxyXG5cclxuZ2VvdGFiLmFkZGluLnJlZ2lzdHJhdGlvbkNvbmZpZyA9IGZ1bmN0aW9uICgpIHtcclxuICAgIGxldCBhZGRpbjogQWRkaW47XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBpbml0aWFsaXplOiAoYXBpLCBzdGF0ZSwgY2FsbGJhY2spID0+IHtcclxuICAgICAgICAgICAgYWRkaW4gPSBuZXcgQWRkaW4oYXBpKTtcclxuICAgICAgICAgICAgY2FsbGJhY2soKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIGZvY3VzOiAoKSA9PiB7XHJcbiAgICAgICAgICAgIGFkZGluLnJlbmRlcigpO1xyXG4gICAgICAgICAgICBhZGRpbi5hZGRFdmVudEhhbmRsZXJzKCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBibHVyOiAoKSA9PiB7XHJcbiAgICAgICAgICAgIGFkZGluLnVubG9hZCgpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbn07IiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uL2JsdWViaXJkLmQudHNcIi8+XHJcbmltcG9ydCB7ZW50aXR5VG9EaWN0aW9uYXJ5LCBtZXJnZVVuaXF1ZX0gZnJvbSBcIi4vdXRpbHNcIjtcclxuXHJcbi8vQSBkaXN0cmlidXRpb24gbGlzdCBsaW5rcyBhIHNldCBvZiBSdWxlKHMpIHRvIGEgc2V0IG9mIFJlY2lwaWVudChzKS4gV2hlbiBhIFJ1bGUgaXMgdmlvbGF0ZWQgZWFjaCByZWxhdGVkIFJlY2lwaWVudCB3aWxsIHJlY2VpdmUgYSBub3RpZmljYXRpb24gb2YgdGhlIGtpbmQgZGVmaW5lZCBieSBpdHMgUmVjaXBpZW50VHlwZS5cclxuaW50ZXJmYWNlIElEaXN0cmlidXRpb25MaXN0IHtcclxuICAgIGlkOiBzdHJpbmc7XHJcbiAgICBuYW1lOiBzdHJpbmc7XHJcbiAgICByZWNpcGllbnRzOiBhbnlbXTtcclxuICAgIHJ1bGVzOiBhbnlbXTtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBJRGlzdHJpYnV0aW9uTGlzdERlcGVuZGVuY2llcyB7XHJcbiAgICBydWxlcz86IGFueVtdO1xyXG4gICAgdXNlcnM/OiBhbnlbXTtcclxuICAgIG5vdGlmaWNhdGlvblRlbXBsYXRlcz86IGFueVtdO1xyXG4gICAgZ3JvdXBzPzogYW55W107XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIERpc3RyaWJ1dGlvbkxpc3RzQnVpbGRlciB7XHJcbiAgICBwcml2YXRlIGFwaTtcclxuICAgIHByaXZhdGUgY3VycmVudFRhc2s7XHJcbiAgICBwcml2YXRlIGRpc3RyaWJ1dGlvbkxpc3RzO1xyXG4gICAgcHJpdmF0ZSBub3RpZmljYXRpb25UZW1wbGF0ZXM7XHJcblxyXG4gICAgY29uc3RydWN0b3IoYXBpKSB7XHJcbiAgICAgICAgdGhpcy5hcGkgPSBhcGk7XHJcbiAgICB9XHJcblxyXG4gICAgLy9BIGRpc3RyaWJ1dGlvbiBsaXN0IGxpbmtzIGEgc2V0IG9mIFJ1bGUocykgdG8gYSBzZXQgb2YgUmVjaXBpZW50KHMpLiBXaGVuIGEgUnVsZSBpcyB2aW9sYXRlZCBlYWNoIHJlbGF0ZWQgUmVjaXBpZW50IHdpbGwgcmVjZWl2ZSBhIG5vdGlmaWNhdGlvbiBvZiB0aGUga2luZCBkZWZpbmVkIGJ5IGl0cyBSZWNpcGllbnRUeXBlLlxyXG4gICAgcHJpdmF0ZSBnZXREaXN0cmlidXRpb25MaXN0c0RhdGEgKCk6IFByb21pc2U8YW55PiB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5hcGkubXVsdGlDYWxsKFtcclxuICAgICAgICAgICAgICAgIFtcIkdldFwiLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgXCJ0eXBlTmFtZVwiOiBcIkRpc3RyaWJ1dGlvbkxpc3RcIixcclxuICAgICAgICAgICAgICAgIH1dLFxyXG4gICAgICAgICAgICAgICAgW1wiR2V0Tm90aWZpY2F0aW9uV2ViUmVxdWVzdFRlbXBsYXRlc1wiLCB7fV0sXHJcbiAgICAgICAgICAgICAgICBbXCJHZXROb3RpZmljYXRpb25FbWFpbFRlbXBsYXRlc1wiLCB7fV0sXHJcbiAgICAgICAgICAgICAgICBbXCJHZXROb3RpZmljYXRpb25UZXh0VGVtcGxhdGVzXCIsIHt9XVxyXG4gICAgICAgICAgICBdLCByZXNvbHZlLCByZWplY3QpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICBwcml2YXRlIGFib3J0Q3VycmVudFRhc2sgKCk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgJiYgdGhpcy5jdXJyZW50VGFzay5hYm9ydCAmJiB0aGlzLmN1cnJlbnRUYXNrLmFib3J0KCk7XHJcbiAgICAgICAgdGhpcy5jdXJyZW50VGFzayA9IG51bGw7XHJcbiAgICB9O1xyXG5cclxuICAgIHB1YmxpYyBnZXREZXBlbmRlbmNpZXMgKGRpc3RyaWJ1dGlvbkxpc3RzKTogSURpc3RyaWJ1dGlvbkxpc3REZXBlbmRlbmNpZXMge1xyXG4gICAgICAgIGxldCBkZXBlbmRlbmNpZXM6IElEaXN0cmlidXRpb25MaXN0RGVwZW5kZW5jaWVzID0ge1xyXG4gICAgICAgICAgICAgICAgcnVsZXM6IFtdLFxyXG4gICAgICAgICAgICAgICAgdXNlcnM6IFtdLFxyXG4gICAgICAgICAgICAgICAgZ3JvdXBzOiBbXSxcclxuICAgICAgICAgICAgICAgIG5vdGlmaWNhdGlvblRlbXBsYXRlczogW11cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgcHJvY2Vzc0RlcGVuZGVuY2llcyA9IChyZWNpcGllbnQpID0+IHtcclxuICAgICAgICAgICAgICAgIGxldCBpZCwgdHlwZTogc3RyaW5nLFxyXG4gICAgICAgICAgICAgICAgICAgIHVzZXJJZCA9IHJlY2lwaWVudC51c2VyLmlkO1xyXG4gICAgICAgICAgICAgICAgdXNlcklkICYmIGRlcGVuZGVuY2llcy51c2Vycy5pbmRleE9mKHVzZXJJZCkgPT09IC0xICYmIGRlcGVuZGVuY2llcy51c2Vycy5wdXNoKHVzZXJJZCk7XHJcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKHJlY2lwaWVudC5yZWNpcGllbnRUeXBlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIkVtYWlsXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIkxvZ1BvcHVwXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIkxvZ1VyZ2VudFBvcHVwXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIkxvZ09ubHlcIjpcclxuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiVGV4dE1lc3NhZ2VcIjpcclxuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiVGV4dFRvU3BlZWNoQWxsb3dEZWxheVwiOlxyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJXZWJSZXF1ZXN0XCI6XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIlRleHRUb1NwZWVjaFwiOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZCA9IHJlY2lwaWVudC5ub3RpZmljYXRpb25CaW5hcnlGaWxlICYmIHJlY2lwaWVudC5ub3RpZmljYXRpb25CaW5hcnlGaWxlLmlkO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlID0gXCJub3RpZmljYXRpb25UZW1wbGF0ZXNcIjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIkFzc2lnblRvR3JvdXBcIjpcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWQgPSByZWNpcGllbnQuZ3JvdXAgJiYgcmVjaXBpZW50Lmdyb3VwLmlkO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlID0gXCJncm91cHNcIjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZCAmJiB0eXBlICYmIGRlcGVuZGVuY2llc1t0eXBlXS5pbmRleE9mKGlkKSA9PT0gLTEgJiYgZGVwZW5kZW5jaWVzW3R5cGVdLnB1c2goaWQpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBjaGVja1JlY2lwaWVudHMgPSAocmVjaXBpZW50cywgZGVwZW5kZW5jaWVzOiBJRGlzdHJpYnV0aW9uTGlzdERlcGVuZGVuY2llcyk6IElEaXN0cmlidXRpb25MaXN0RGVwZW5kZW5jaWVzID0+IHtcclxuICAgICAgICAgICAgICAgIHJldHVybiByZWNpcGllbnRzLnJlZHVjZSgoZGVwZW5kZW5jaWVzLCByZWNpcGllbnQpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBwcm9jZXNzRGVwZW5kZW5jaWVzKHJlY2lwaWVudCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGRlcGVuZGVuY2llcztcclxuICAgICAgICAgICAgICAgIH0sIGRlcGVuZGVuY2llcyk7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgcmV0dXJuIGRpc3RyaWJ1dGlvbkxpc3RzLnJlZHVjZSgoZGVwZW5kZW5jaWVzOiBJRGlzdHJpYnV0aW9uTGlzdERlcGVuZGVuY2llcywgZGlzdHJpYnV0aW9uTGlzdDogSURpc3RyaWJ1dGlvbkxpc3QpID0+IHtcclxuICAgICAgICAgICAgZGVwZW5kZW5jaWVzLnJ1bGVzID0gbWVyZ2VVbmlxdWUoZGVwZW5kZW5jaWVzLnJ1bGVzLCBkaXN0cmlidXRpb25MaXN0LnJ1bGVzLm1hcChydWxlID0+IHJ1bGUuaWQpKTtcclxuICAgICAgICAgICAgZGVwZW5kZW5jaWVzID0gY2hlY2tSZWNpcGllbnRzKGRpc3RyaWJ1dGlvbkxpc3QucmVjaXBpZW50cywgZGVwZW5kZW5jaWVzKTtcclxuICAgICAgICAgICAgcmV0dXJuIGRlcGVuZGVuY2llcztcclxuICAgICAgICB9LCBkZXBlbmRlbmNpZXMpO1xyXG4gICAgfTtcclxuXHJcbiAgICBwdWJsaWMgZmV0Y2goKTogUHJvbWlzZTxhbnk+IHtcclxuICAgICAgICB0aGlzLmFib3J0Q3VycmVudFRhc2soKTtcclxuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrID0gdGhpcy5nZXREaXN0cmlidXRpb25MaXN0c0RhdGEoKVxyXG4gICAgICAgICAgICAudGhlbigoW2Rpc3RyaWJ1dGlvbkxpc3RzLCB3ZWJUZW1wbGF0ZXMsIGVtYWlsVGVtcGxhdGVzLCB0ZXh0VGVtcGxhdGVzXSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5kaXN0cmlidXRpb25MaXN0cyA9IGVudGl0eVRvRGljdGlvbmFyeShkaXN0cmlidXRpb25MaXN0cyk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm5vdGlmaWNhdGlvblRlbXBsYXRlcyA9IGVudGl0eVRvRGljdGlvbmFyeSh3ZWJUZW1wbGF0ZXMuY29uY2F0KGVtYWlsVGVtcGxhdGVzKS5jb25jYXQodGV4dFRlbXBsYXRlcykpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZGlzdHJpYnV0aW9uTGlzdHM7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIC5jYXRjaChjb25zb2xlLmVycm9yKVxyXG4gICAgICAgICAgICAuZmluYWxseSgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRUYXNrID0gbnVsbDtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY3VycmVudFRhc2s7XHJcbiAgICB9O1xyXG5cclxuICAgIHB1YmxpYyBnZXROb3RpZmljYXRpb25UZW1wbGF0ZURhdGEgKHRlbXBsYXRlSWQ6IHN0cmluZyk6IGFueSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubm90aWZpY2F0aW9uVGVtcGxhdGVzW3RlbXBsYXRlSWRdO1xyXG4gICAgfTtcclxuXHJcbiAgICBwdWJsaWMgZ2V0UnVsZXNEaXN0cmlidXRpb25MaXN0cyAocnVsZXNJZHM6IHN0cmluZ1tdKTogSURpc3RyaWJ1dGlvbkxpc3RbXSB7XHJcbiAgICAgICAgcmV0dXJuIE9iamVjdC5rZXlzKHRoaXMuZGlzdHJpYnV0aW9uTGlzdHMpLnJlZHVjZSgocmVzLCBpZCkgPT4ge1xyXG4gICAgICAgICAgICBsZXQgbGlzdCA9IHRoaXMuZGlzdHJpYnV0aW9uTGlzdHNbaWRdO1xyXG4gICAgICAgICAgICBsaXN0LnJ1bGVzLnNvbWUobGlzdFJ1bGUgPT4gcnVsZXNJZHMuaW5kZXhPZihsaXN0UnVsZS5pZCkgPiAtMSkgJiYgcmVzLnB1c2gobGlzdCk7XHJcbiAgICAgICAgICAgIHJldHVybiByZXM7XHJcbiAgICAgICAgfSwgW10pO1xyXG4gICAgfTtcclxuXHJcbiAgICBwdWJsaWMgdW5sb2FkICgpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLmFib3J0Q3VycmVudFRhc2soKTtcclxuICAgIH07XHJcbn0iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vYmx1ZWJpcmQuZC50c1wiLz5cclxuaW1wb3J0ICogYXMgVXRpbHMgZnJvbSBcIi4vdXRpbHNcIjtcclxuXHJcbmludGVyZmFjZSBDb2xvciB7XHJcbiAgICByOiBudW1iZXI7XHJcbiAgICBnOiBudW1iZXI7XHJcbiAgICBiOiBudW1iZXI7XHJcbiAgICBhOiBudW1iZXI7XHJcbn1cclxuXHJcbmludGVyZmFjZSBJR3JvdXAge1xyXG4gICAgaWQ6IHN0cmluZztcclxuICAgIG5hbWU/OiBzdHJpbmc7XHJcbiAgICBjb2xvcj86IENvbG9yO1xyXG4gICAgcGFyZW50PzogSUdyb3VwO1xyXG4gICAgY2hpbGRyZW4/OiBJR3JvdXBbXTtcclxuICAgIHVzZXI/OiBhbnk7XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEdyb3Vwc0J1aWxkZXIge1xyXG4gICAgcHJvdGVjdGVkIGFwaTtcclxuICAgIHByb3RlY3RlZCBjdXJyZW50VGFzaztcclxuICAgIHByb3RlY3RlZCBncm91cHM6IElHcm91cFtdO1xyXG4gICAgcHJvdGVjdGVkIHRyZWU6IElHcm91cFtdO1xyXG4gICAgcHJvdGVjdGVkIGN1cnJlbnRUcmVlO1xyXG5cclxuICAgIHByaXZhdGUgdXNlcnM6IGFueTtcclxuICAgIHByaXZhdGUgY3VycmVudFVzZXJOYW1lOiBzdHJpbmc7XHJcblxyXG4gICAgY29uc3RydWN0b3IoYXBpOiBhbnkpIHtcclxuICAgICAgICB0aGlzLmFwaSA9IGFwaTtcclxuICAgIH1cclxuXHJcbiAgICAvL2dldHMgdGhlIGdyb3VwcyBhc3NvY2lhdGVkIHdpdGggdGhlIGN1cnJlbnQgdXNlclxyXG4gICAgcHJpdmF0ZSBnZXRHcm91cHMgKCk6IFByb21pc2U8YW55PiB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5hcGkuZ2V0U2Vzc2lvbigoc2Vzc2lvbkRhdGEpID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudFVzZXJOYW1lID0gc2Vzc2lvbkRhdGEudXNlck5hbWU7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmFwaS5tdWx0aUNhbGwoW1xyXG4gICAgICAgICAgICAgICAgICAgIFtcIkdldFwiLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGVOYW1lOiBcIkdyb3VwXCJcclxuICAgICAgICAgICAgICAgICAgICB9XSxcclxuICAgICAgICAgICAgICAgICAgICBbXCJHZXRcIiwge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlTmFtZTogXCJVc2VyXCJcclxuICAgICAgICAgICAgICAgICAgICB9XVxyXG4gICAgICAgICAgICAgICAgXSwgcmVzb2x2ZSwgcmVqZWN0KTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIHByaXZhdGUgZmluZENoaWxkIChjaGlsZElkOiBzdHJpbmcsIGN1cnJlbnRJdGVtOiBJR3JvdXAsIG9uQWxsTGV2ZWxzOiBib29sZWFuID0gZmFsc2UpOiBJR3JvdXAge1xyXG4gICAgICAgIGxldCBmb3VuZENoaWxkID0gbnVsbCxcclxuICAgICAgICAgICAgY2hpbGRyZW4gPSBjdXJyZW50SXRlbS5jaGlsZHJlbjtcclxuICAgICAgICBpZiAoIWNoaWxkSWQgfHwgIWNoaWxkcmVuIHx8ICFjaGlsZHJlbi5sZW5ndGgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjaGlsZHJlbi5zb21lKGNoaWxkID0+IHtcclxuICAgICAgICAgICAgaWYgKGNoaWxkLmlkID09PSBjaGlsZElkKSB7XHJcbiAgICAgICAgICAgICAgICBmb3VuZENoaWxkID0gY2hpbGQ7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZm91bmRDaGlsZDtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGlmIChvbkFsbExldmVscykge1xyXG4gICAgICAgICAgICAgICAgICAgIGZvdW5kQ2hpbGQgPSB0aGlzLmZpbmRDaGlsZChjaGlsZElkLCBjaGlsZCwgb25BbGxMZXZlbHMpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmb3VuZENoaWxkO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGZvdW5kQ2hpbGQ7XHJcbiAgICB9O1xyXG5cclxuICAgIHByaXZhdGUgZ2V0VXNlckJ5UHJpdmF0ZUdyb3VwSWQgKGdyb3VwSWQ6IHN0cmluZyk6IGFueSB7XHJcbiAgICAgICAgbGV0IG91dHB1dFVzZXIgPSBudWxsLFxyXG4gICAgICAgICAgICB1c2VySGFzUHJpdmF0ZUdyb3VwID0gKHVzZXIsIGdyb3VwSWQpOiBib29sZWFuID0+IHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB1c2VyLnByaXZhdGVVc2VyR3JvdXBzLnNvbWUoZ3JvdXAgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChncm91cC5pZCA9PT0gZ3JvdXBJZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB0aGlzLnVzZXJzLnNvbWUodXNlciA9PiB7XHJcbiAgICAgICAgICAgIGlmICh1c2VySGFzUHJpdmF0ZUdyb3VwKHVzZXIsIGdyb3VwSWQpKSB7XHJcbiAgICAgICAgICAgICAgICBvdXRwdXRVc2VyID0gdXNlcjtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIG91dHB1dFVzZXI7XHJcbiAgICB9O1xyXG5cclxuICAgIHByaXZhdGUgZ2V0UHJpdmF0ZUdyb3VwRGF0YSAoZ3JvdXBJZDogc3RyaW5nKSB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgaWQ6IGdyb3VwSWQsXHJcbiAgICAgICAgICAgIHVzZXI6IHRoaXMuZ2V0VXNlckJ5UHJpdmF0ZUdyb3VwSWQoZ3JvdXBJZCksXHJcbiAgICAgICAgICAgIGNoaWxkcmVuOiBbXSxcclxuICAgICAgICAgICAgbmFtZTogXCJQcml2YXRlVXNlckdyb3VwTmFtZVwiLFxyXG4gICAgICAgICAgICBwYXJlbnQ6IHtcclxuICAgICAgICAgICAgICAgIGlkOiBcIkdyb3VwUHJpdmF0ZVVzZXJJZFwiLFxyXG4gICAgICAgICAgICAgICAgY2hpbGRyZW46IFt7IGlkOiBncm91cElkIH1dXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgfTtcclxuXHJcbiAgICBwcm90ZWN0ZWQgY3JlYXRlR3JvdXBzVHJlZSAoZ3JvdXBzOiBJR3JvdXBbXSk6IGFueVtdIHtcclxuICAgICAgICBsZXQgbm9kZUxvb2t1cCxcclxuICAgICAgICAgICAgdHJhdmVyc2VDaGlsZHJlbiA9IGZ1bmN0aW9uIChub2RlKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgY2hpbGRyZW46IElHcm91cFtdLFxyXG4gICAgICAgICAgICAgICAgICAgIGlkOiBzdHJpbmc7XHJcblxyXG4gICAgICAgICAgICAgICAgY2hpbGRyZW4gPSBub2RlLmNoaWxkcmVuO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChjaGlsZHJlbikge1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwLCBpaSA9IGNoaWxkcmVuLmxlbmd0aDsgaSA8IGlpOyBpICs9IDEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWQgPSBjaGlsZHJlbltpXS5pZDtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChub2RlTG9va3VwW2lkXSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZS5jaGlsZHJlbltpXSA9IG5vZGVMb29rdXBbaWRdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZS5jaGlsZHJlbltpXS5wYXJlbnQgPSBub2RlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIG5vZGVMb29rdXBbaWRdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyYXZlcnNlQ2hpbGRyZW4obm9kZS5jaGlsZHJlbltpXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICBub2RlTG9va3VwID0gVXRpbHMuZW50aXR5VG9EaWN0aW9uYXJ5KGdyb3VwcywgZW50aXR5ID0+IHtcclxuICAgICAgICAgICAgbGV0IG5ld0VudGl0eSA9IFV0aWxzLmV4dGVuZCh7fSwgZW50aXR5KTtcclxuICAgICAgICAgICAgaWYgKG5ld0VudGl0eS5jaGlsZHJlbikge1xyXG4gICAgICAgICAgICAgICAgbmV3RW50aXR5LmNoaWxkcmVuID0gbmV3RW50aXR5LmNoaWxkcmVuLnNsaWNlKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIG5ld0VudGl0eTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgT2JqZWN0LmtleXMobm9kZUxvb2t1cCkuZm9yRWFjaChrZXkgPT4ge1xyXG4gICAgICAgICAgICBub2RlTG9va3VwW2tleV0gJiYgdHJhdmVyc2VDaGlsZHJlbihub2RlTG9va3VwW2tleV0pO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICByZXR1cm4gT2JqZWN0LmtleXMobm9kZUxvb2t1cCkubWFwKGtleSA9PiB7XHJcbiAgICAgICAgICAgIHJldHVybiBub2RlTG9va3VwW2tleV07XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIHByb3RlY3RlZCBhYm9ydEN1cnJlbnRUYXNrICgpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrICYmIHRoaXMuY3VycmVudFRhc2suYWJvcnQgJiYgdGhpcy5jdXJyZW50VGFzay5hYm9ydCgpO1xyXG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgPSBudWxsO1xyXG4gICAgfTtcclxuXHJcbiAgICAvL2ZpbGxzIHRoZSBncm91cCBidWlsZGVyIHdpdGggdGhlIHJlbGV2YW50IGluZm9ybWF0aW9uXHJcbiAgICBwdWJsaWMgZmV0Y2ggKCk6IFByb21pc2U8YW55PiB7XHJcbiAgICAgICAgdGhpcy5hYm9ydEN1cnJlbnRUYXNrKCk7XHJcbiAgICAgICAgdGhpcy5jdXJyZW50VGFzayA9IHRoaXMuZ2V0R3JvdXBzKClcclxuICAgICAgICAgICAgLnRoZW4oKFtncm91cHMsIHVzZXJzXSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5ncm91cHMgPSBncm91cHM7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnVzZXJzID0gdXNlcnM7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnRyZWUgPSB0aGlzLmNyZWF0ZUdyb3Vwc1RyZWUoZ3JvdXBzKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudFRyZWUgPSBVdGlscy5leHRlbmQoe30sIHRoaXMudHJlZSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVGbGF0R3JvdXBzTGlzdCh0aGlzLnRyZWUpO1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAuY2F0Y2goY29uc29sZS5lcnJvcilcclxuICAgICAgICAgICAgLmZpbmFsbHkoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50VGFzayA9IG51bGw7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiB0aGlzLmN1cnJlbnRUYXNrO1xyXG4gICAgfTtcclxuXHJcbiAgICBwdWJsaWMgY3JlYXRlRmxhdEdyb3Vwc0xpc3QgKGdyb3VwczogSUdyb3VwW10sIG5vdEluY2x1ZGVDaGlsZHJlbjogYm9vbGVhbiA9IGZhbHNlKTogSUdyb3VwW10ge1xyXG4gICAgICAgIGxldCBmb3VuZElkcyA9IFtdLFxyXG4gICAgICAgICAgICBncm91cHNUb0FkZCA9IFtdLFxyXG4gICAgICAgICAgICBtYWtlRmxhdFBhcmVudHMgPSAoaXRlbSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgbGV0IGl0ZW1Db3B5ID0gVXRpbHMuZXh0ZW5kKHt9LCBpdGVtKTtcclxuICAgICAgICAgICAgICAgIGlmIChpdGVtICYmIGl0ZW0ucGFyZW50KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbWFrZUZsYXRQYXJlbnRzKGl0ZW0ucGFyZW50KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGl0ZW1Db3B5LmNoaWxkcmVuID0gaXRlbUNvcHkuY2hpbGRyZW4ubWFwKGNoaWxkID0+IGNoaWxkLmlkKTtcclxuICAgICAgICAgICAgICAgIGl0ZW1Db3B5LnBhcmVudCA9IGl0ZW0ucGFyZW50ID8ge2lkOiBpdGVtLnBhcmVudC5pZCwgbmFtZTogaXRlbS5wYXJlbnQubmFtZX0gOiBudWxsO1xyXG4gICAgICAgICAgICAgICAgaWYgKGZvdW5kSWRzLmluZGV4T2YoaXRlbS5pZCkgPT09IC0xKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZ3JvdXBzVG9BZGQucHVzaChpdGVtQ29weSk7XHJcbiAgICAgICAgICAgICAgICAgICAgZm91bmRJZHMucHVzaChpdGVtLmlkKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgbWFrZUZsYXRDaGlsZHJlbiA9IChpdGVtKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAoaXRlbSAmJiBpdGVtLmNoaWxkcmVuICYmIGl0ZW0uY2hpbGRyZW4ubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaXRlbS5jaGlsZHJlbi5mb3JFYWNoKChjaGlsZCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgY2hpbGRDb3B5O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZm91bmRJZHMuaW5kZXhPZihjaGlsZC5pZCkgPT09IC0xKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYWtlRmxhdENoaWxkcmVuKGNoaWxkKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjaGlsZENvcHkgPSBVdGlscy5leHRlbmQoe30sIGNoaWxkKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGRDb3B5LmNoaWxkcmVuID0gY2hpbGRDb3B5LmNoaWxkcmVuLm1hcChjaGlsZElubmVyID0+IGNoaWxkSW5uZXIuaWQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjaGlsZENvcHkucGFyZW50ID0gY2hpbGRDb3B5LnBhcmVudCA/IHtpZDogY2hpbGRDb3B5LnBhcmVudC5pZCwgbmFtZTogY2hpbGRDb3B5LnBhcmVudC5uYW1lfSA6IG51bGw7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmb3VuZElkcy5pbmRleE9mKGNoaWxkLmlkKSA9PT0gLTEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdyb3Vwc1RvQWRkLnB1c2goY2hpbGRDb3B5KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvdW5kSWRzLnB1c2goY2hpbGQuaWQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgIGdyb3Vwcy5mb3JFYWNoKG1ha2VGbGF0UGFyZW50cyk7XHJcbiAgICAgICAgIW5vdEluY2x1ZGVDaGlsZHJlbiAmJiBncm91cHMuZm9yRWFjaChtYWtlRmxhdENoaWxkcmVuKTtcclxuICAgICAgICByZXR1cm4gZ3JvdXBzVG9BZGQ7XHJcbiAgICB9O1xyXG5cclxuICAgIHB1YmxpYyBnZXRHcm91cHNEYXRhIChncm91cElkczogc3RyaW5nW10sIG5vdEluY2x1ZGVDaGlsZHJlbjogYm9vbGVhbiA9IGZhbHNlKTogSUdyb3VwW10ge1xyXG4gICAgICAgIGxldCB0cmVlR3JvdXBzID0gZ3JvdXBJZHMubWFwKGdyb3VwSWQgPT5cclxuICAgICAgICAgICAgdGhpcy5maW5kQ2hpbGQoZ3JvdXBJZCwge2lkOiBudWxsLCBjaGlsZHJlbjogdGhpcy50cmVlfSwgdHJ1ZSkgfHwgdGhpcy5nZXRQcml2YXRlR3JvdXBEYXRhKGdyb3VwSWQpXHJcbiAgICAgICAgKTtcclxuICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVGbGF0R3JvdXBzTGlzdCh0cmVlR3JvdXBzLCBub3RJbmNsdWRlQ2hpbGRyZW4pO1xyXG4gICAgfTtcclxuXHJcbiAgICBwdWJsaWMgZ2V0Q3VzdG9tR3JvdXBzRGF0YSAoZ3JvdXBJZHM6IHN0cmluZ1tdLCBhbGxHcm91cHM6IElHcm91cFtdKTogSUdyb3VwW10ge1xyXG4gICAgICAgIGxldCBncm91cHNUcmVlID0gdGhpcy5jcmVhdGVHcm91cHNUcmVlKGFsbEdyb3VwcyksXHJcbiAgICAgICAgICAgIHRyZWVHcm91cHMgPSBncm91cElkcy5tYXAoZ3JvdXBJZCA9PiBcclxuICAgICAgICAgICAgICAgIHRoaXMuZmluZENoaWxkKGdyb3VwSWQsIHtpZDogbnVsbCwgY2hpbGRyZW46IGdyb3Vwc1RyZWV9LCB0cnVlKSB8fCB0aGlzLmdldFByaXZhdGVHcm91cERhdGEoZ3JvdXBJZClcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVGbGF0R3JvdXBzTGlzdCh0cmVlR3JvdXBzLCB0cnVlKTtcclxuICAgIH07XHJcblxyXG4gICAgcHVibGljIGdldFByaXZhdGVHcm91cHNVc2Vycyhncm91cHM6IElHcm91cFtdKSB7XHJcbiAgICAgICAgcmV0dXJuIGdyb3Vwcy5yZWR1Y2UoKHVzZXJzLCBncm91cCkgPT4ge1xyXG4gICAgICAgICAgICBncm91cC51c2VyICYmIGdyb3VwLnVzZXIubmFtZSAhPT0gdGhpcy5jdXJyZW50VXNlck5hbWUgJiYgdXNlcnMucHVzaChncm91cC51c2VyKTtcclxuICAgICAgICAgICAgcmV0dXJuIHVzZXJzO1xyXG4gICAgICAgIH0sIFtdKTtcclxuICAgIH07XHJcblxyXG4gICAgcHVibGljIHVubG9hZCAoKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5hYm9ydEN1cnJlbnRUYXNrKCk7XHJcbiAgICB9O1xyXG59IiwiaW1wb3J0IHsgZW50aXR5VG9EaWN0aW9uYXJ5IH0gZnJvbSBcIi4vdXRpbHNcIjtcclxuXHJcbnR5cGUgVE1hcFByb3ZpZGVyVHlwZSA9IFwiZGVmYXVsdFwiIHwgXCJhZGRpdGlvbmFsXCIgfCBcImN1c3RvbVwiO1xyXG5cclxuZXhwb3J0IGludGVyZmFjZSBJTWlzY0RhdGEge1xyXG4gICAgbWFwUHJvdmlkZXI6IHtcclxuICAgICAgICB2YWx1ZTogc3RyaW5nO1xyXG4gICAgICAgIHR5cGU6IFRNYXBQcm92aWRlclR5cGU7XHJcbiAgICB9O1xyXG4gICAgY3VycmVudFVzZXI6IGFueTtcclxuICAgIGlzVW5zaWduZWRBZGRpbnNBbGxvd2VkOiBib29sZWFuO1xyXG4gICAgYWRkaW5zOiBzdHJpbmdbXTtcclxuICAgIHB1cmdlU2V0dGluZ3M/OiBhbnk7XHJcbiAgICBlbWFpbFNlbmRlckZyb20/OiBzdHJpbmc7XHJcbiAgICBjdXN0b21lckNsYXNzaWZpY2F0aW9uPzogc3RyaW5nO1xyXG4gICAgaXNNYXJrZXRwbGFjZVB1cmNoYXNlc0FsbG93ZWQ/OiBib29sZWFuO1xyXG4gICAgaXNSZXNlbGxlckF1dG9Mb2dpbkFsbG93ZWQ/OiBib29sZWFuO1xyXG4gICAgaXNUaGlyZFBhcnR5TWFya2V0cGxhY2VBcHBzQWxsb3dlZD86IGJvb2xlYW47XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBNaXNjQnVpbGRlciB7XHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IGFwaTtcclxuICAgIHByaXZhdGUgY3VzdG9tTWFwUHJvdmlkZXJzO1xyXG4gICAgcHJpdmF0ZSBjdXJyZW50VGFzaztcclxuICAgIHByaXZhdGUgY3VycmVudFVzZXI7XHJcbiAgICBwcml2YXRlIGlzVW5zaWduZWRBZGRpbnNBbGxvd2VkO1xyXG4gICAgcHJpdmF0ZSBhZGRpbnM6IHN0cmluZ1tdO1xyXG4gICAgcHJpdmF0ZSByZWFkb25seSBkZWZhdWx0TWFwUHJvdmlkZXJzID0ge1xyXG4gICAgICAgIEdvb2dsZU1hcHM6IFwiR29vZ2xlIE1hcHNcIixcclxuICAgICAgICBIZXJlOiBcIkhFUkUgTWFwc1wiLFxyXG4gICAgICAgIE1hcEJveDogXCJNYXBCb3hcIlxyXG4gICAgfTtcclxuXHJcbiAgICBwcml2YXRlIGFib3J0Q3VycmVudFRhc2sgKCkge1xyXG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgJiYgdGhpcy5jdXJyZW50VGFzay5hYm9ydCAmJiB0aGlzLmN1cnJlbnRUYXNrLmFib3J0KCk7XHJcbiAgICAgICAgdGhpcy5jdXJyZW50VGFzayA9IG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBnZXRBbGxvd2VkQWRkaW5zIChhbGxBZGRpbnM6IHN0cmluZ1tdKSB7XHJcbiAgICAgICAgcmV0dXJuIGFsbEFkZGlucy5maWx0ZXIoYWRkaW4gPT4ge1xyXG4gICAgICAgICAgICAvL3JlbW92ZXMgdGhlIGN1cnJlbnQgYWRkaW4gLSByZWdpc3RyYXRpb24gY29uZmlnXHJcbiAgICAgICAgICAgIGlmKHRoaXMuaXNDdXJyZW50QWRkaW4oYWRkaW4pKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgbGV0IGFkZGluQ29uZmlnID0gSlNPTi5wYXJzZShhZGRpbik7XHJcbiAgICAgICAgICAgIGlmKGFkZGluQ29uZmlnLml0ZW1zKSB7XHJcbiAgICAgICAgICAgICAgICAvL011bHRpIGxpbmUgYWRkaW4gc3RydWN0dXJlIGNoZWNrXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYWRkaW5Db25maWcgJiYgQXJyYXkuaXNBcnJheShhZGRpbkNvbmZpZy5pdGVtcykgJiYgYWRkaW5Db25maWcuaXRlbXMuZXZlcnkoaXRlbSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHVybCA9IGl0ZW0udXJsO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmlzVmFsaWRVcmwodXJsKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgLy9TaW5nbGUgbGluZSBhZGRpbiBzdHJ1Y3R1cmUgY2hlY2tcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmlzVmFsaWRVcmwoYWRkaW5Db25maWcudXJsKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8vVGVzdHMgYSBVUkwgZm9yIGRvdWJsZSBzbGFzaC4gQWNjZXB0cyBhIHVybCBhcyBhIHN0cmluZyBhcyBhIGFyZ3VtZW50LlxyXG4gICAgLy9SZXR1cm5zIHRydWUgaWYgdGhlIHVybCBjb250YWlucyBhIGRvdWJsZSBzbGFzaCAvL1xyXG4gICAgLy9SZXR1cm5zIGZhbHNlIGlmIHRoZSB1cmwgZG9lcyBub3QgY29udGFpbiBhIGRvdWJsZSBzbGFzaC5cclxuICAgIHByaXZhdGUgaXNWYWxpZFVybCh1cmw6IHN0cmluZyk6IGJvb2xlYW4ge1xyXG4gICAgICAgIGlmICh1cmwgJiYgdXJsLmluZGV4T2YoXCJcXC9cXC9cIikgPiAtMSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBpc0N1cnJlbnRBZGRpbiAoYWRkaW46IHN0cmluZykge1xyXG4gICAgICAgIHJldHVybiAoKGFkZGluLmluZGV4T2YoXCJSZWdpc3RyYXRpb24gY29uZmlnXCIpID4gLTEpfHxcclxuICAgICAgICAoYWRkaW4udG9Mb3dlckNhc2UoKS5pbmRleE9mKFwicmVnaXN0cmF0aW9uQ29uZmlnXCIudG9Mb3dlckNhc2UoKSkgPiAtMSkpO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0cnVjdG9yKGFwaSkge1xyXG4gICAgICAgIHRoaXMuYXBpID0gYXBpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vZmlsbHMgdGhlIE1pc2MgYnVpbGRlciAoc3lzdGVtIHNldHRpbmdzKSB3aXRoIHRoZSByZWxldmFudCBpbmZvcm1hdGlvblxyXG4gICAgZmV0Y2ggKGluY2x1ZGVTeXNTZXR0aW5nczogYm9vbGVhbik6IFByb21pc2U8SU1pc2NEYXRhPiB7XHJcbiAgICAgICAgdGhpcy5hYm9ydEN1cnJlbnRUYXNrKCk7XHJcbiAgICAgICAgdGhpcy5jdXJyZW50VGFzayA9IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5hcGkuZ2V0U2Vzc2lvbigoc2Vzc2lvbkRhdGEpID0+IHtcclxuICAgICAgICAgICAgICAgIGxldCB1c2VyTmFtZSA9IHNlc3Npb25EYXRhLnVzZXJOYW1lO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hcGkubXVsdGlDYWxsKFtcclxuICAgICAgICAgICAgICAgICAgICAgICAgW1wiR2V0XCIsIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGVOYW1lOiBcIlVzZXJcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlYXJjaDoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IHVzZXJOYW1lXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1dLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBbXCJHZXRcIiwge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZU5hbWU6IFwiU3lzdGVtU2V0dGluZ3NcIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XVxyXG4gICAgICAgICAgICAgICAgICAgIF0sIHJlc29sdmUsIHJlamVjdCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pLnRoZW4oKHJlc3VsdCkgPT4ge1xyXG4gICAgICAgICAgICBsZXQgY3VycmVudFVzZXIgPSByZXN1bHRbMF1bMF0gfHwgcmVzdWx0WzBdLFxyXG4gICAgICAgICAgICAgICAgc3lzdGVtU2V0dGluZ3MgPSByZXN1bHRbMV1bMF0gfHwgcmVzdWx0WzFdLFxyXG4gICAgICAgICAgICAgICAgdXNlck1hcFByb3ZpZGVySWQgPSBjdXJyZW50VXNlci5kZWZhdWx0TWFwRW5naW5lLFxyXG4gICAgICAgICAgICAgICAgZGVmYXVsdE1hcFByb3ZpZGVySWQgPSBzeXN0ZW1TZXR0aW5ncy5tYXBQcm92aWRlcixcclxuICAgICAgICAgICAgICAgIG1hcFByb3ZpZGVySWQgPSB0aGlzLmdldE1hcFByb3ZpZGVyVHlwZSh1c2VyTWFwUHJvdmlkZXJJZCkgPT09IFwiY3VzdG9tXCIgPyB1c2VyTWFwUHJvdmlkZXJJZCA6IGRlZmF1bHRNYXBQcm92aWRlcklkO1xyXG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRVc2VyID0gY3VycmVudFVzZXI7XHJcbiAgICAgICAgICAgIHRoaXMuY3VzdG9tTWFwUHJvdmlkZXJzID0gZW50aXR5VG9EaWN0aW9uYXJ5KHN5c3RlbVNldHRpbmdzLmN1c3RvbVdlYk1hcFByb3ZpZGVyTGlzdCk7XHJcbiAgICAgICAgICAgIHRoaXMuaXNVbnNpZ25lZEFkZGluc0FsbG93ZWQgPSBzeXN0ZW1TZXR0aW5ncy5hbGxvd1Vuc2lnbmVkQWRkSW47XHJcbiAgICAgICAgICAgIHRoaXMuYWRkaW5zID0gdGhpcy5nZXRBbGxvd2VkQWRkaW5zKHN5c3RlbVNldHRpbmdzLmN1c3RvbWVyUGFnZXMpO1xyXG4gICAgICAgICAgICBsZXQgb3V0cHV0OiBJTWlzY0RhdGEgPSB7XHJcbiAgICAgICAgICAgICAgICBtYXBQcm92aWRlcjoge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBtYXBQcm92aWRlcklkLFxyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IHRoaXMuZ2V0TWFwUHJvdmlkZXJUeXBlKG1hcFByb3ZpZGVySWQpXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgY3VycmVudFVzZXI6IHRoaXMuY3VycmVudFVzZXIsXHJcbiAgICAgICAgICAgICAgICBpc1Vuc2lnbmVkQWRkaW5zQWxsb3dlZDogdGhpcy5pc1Vuc2lnbmVkQWRkaW5zQWxsb3dlZCxcclxuICAgICAgICAgICAgICAgIGFkZGluczogdGhpcy5hZGRpbnNcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgaWYgKGluY2x1ZGVTeXNTZXR0aW5ncykge1xyXG4gICAgICAgICAgICAgICAgb3V0cHV0LnB1cmdlU2V0dGluZ3MgPSBzeXN0ZW1TZXR0aW5ncy5wdXJnZVNldHRpbmdzO1xyXG4gICAgICAgICAgICAgICAgb3V0cHV0LmVtYWlsU2VuZGVyRnJvbSA9IHN5c3RlbVNldHRpbmdzLmVtYWlsU2VuZGVyRnJvbTtcclxuICAgICAgICAgICAgICAgIG91dHB1dC5jdXN0b21lckNsYXNzaWZpY2F0aW9uID0gc3lzdGVtU2V0dGluZ3MuY3VzdG9tZXJDbGFzc2lmaWNhdGlvbjtcclxuICAgICAgICAgICAgICAgIG91dHB1dC5pc01hcmtldHBsYWNlUHVyY2hhc2VzQWxsb3dlZCA9IHN5c3RlbVNldHRpbmdzLmFsbG93TWFya2V0cGxhY2VQdXJjaGFzZXM7XHJcbiAgICAgICAgICAgICAgICBvdXRwdXQuaXNSZXNlbGxlckF1dG9Mb2dpbkFsbG93ZWQgPSBzeXN0ZW1TZXR0aW5ncy5hbGxvd1Jlc2VsbGVyQXV0b0xvZ2luO1xyXG4gICAgICAgICAgICAgICAgb3V0cHV0LmlzVGhpcmRQYXJ0eU1hcmtldHBsYWNlQXBwc0FsbG93ZWQgPSBzeXN0ZW1TZXR0aW5ncy5hbGxvd1RoaXJkUGFydHlNYXJrZXRwbGFjZUFwcHM7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIG91dHB1dDtcclxuICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4gdGhpcy5jdXJyZW50VGFzaztcclxuICAgIH1cclxuXHJcbiAgICBnZXRNYXBQcm92aWRlclR5cGUgKG1hcFByb3ZpZGVySWQ6IHN0cmluZyk6IFRNYXBQcm92aWRlclR5cGUge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmRlZmF1bHRNYXBQcm92aWRlcnNbbWFwUHJvdmlkZXJJZF0gPyBcImRlZmF1bHRcIiA6IFwiY3VzdG9tXCI7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0TWFwUHJvdmlkZXJOYW1lIChtYXBQcm92aWRlcklkOiBzdHJpbmcpOiBzdHJpbmcge1xyXG4gICAgICAgIHJldHVybiBtYXBQcm92aWRlcklkICYmICh0aGlzLmRlZmF1bHRNYXBQcm92aWRlcnNbbWFwUHJvdmlkZXJJZF0gfHwgKHRoaXMuY3VzdG9tTWFwUHJvdmlkZXJzW21hcFByb3ZpZGVySWRdICYmIHRoaXMuY3VzdG9tTWFwUHJvdmlkZXJzW21hcFByb3ZpZGVySWRdLm5hbWUpIHx8IG1hcFByb3ZpZGVySWQpO1xyXG4gICAgfVxyXG5cclxuICAgIGdldE1hcFByb3ZpZGVyRGF0YSAobWFwUHJvdmlkZXJJZDogc3RyaW5nKSB7XHJcbiAgICAgICAgcmV0dXJuIG1hcFByb3ZpZGVySWQgJiYgdGhpcy5jdXN0b21NYXBQcm92aWRlcnNbbWFwUHJvdmlkZXJJZF07XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0QWRkaW5zRGF0YSAoaW5jbHVkZVRoaXNBZGRpbiA9IGZhbHNlKSB7XHJcbiAgICAgICAgcmV0dXJuICFpbmNsdWRlVGhpc0FkZGluID8gdGhpcy5hZGRpbnMuZmlsdGVyKGFkZGluID0+ICF0aGlzLmlzQ3VycmVudEFkZGluKGFkZGluKSkgOiB0aGlzLmFkZGlucztcclxuICAgIH1cclxuXHJcbiAgICB1bmxvYWQgKCk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMuYWJvcnRDdXJyZW50VGFzaygpO1xyXG4gICAgfVxyXG59IiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uL2JsdWViaXJkLmQudHNcIi8+XHJcbmltcG9ydCAqIGFzIFV0aWxzIGZyb20gXCIuL3V0aWxzXCI7XHJcblxyXG5jb25zdCBSRVBPUlRfVFlQRV9EQVNIQk9BRCA9IFwiRGFzaGJvYXJkXCI7XHJcblxyXG5pbnRlcmZhY2UgSVJlcG9ydCB7XHJcbiAgICBpZDogc3RyaW5nO1xyXG4gICAgZ3JvdXBzOiBJR3JvdXBbXTtcclxuICAgIGluY2x1ZGVBbGxDaGlsZHJlbkdyb3VwczogSUdyb3VwW107XHJcbiAgICBpbmNsdWRlRGlyZWN0Q2hpbGRyZW5Pbmx5R3JvdXBzOiBJR3JvdXBbXTtcclxuICAgIHNjb3BlR3JvdXBzOiBJR3JvdXBbXTtcclxuICAgIGRlc3RpbmF0aW9uPzogc3RyaW5nO1xyXG4gICAgdGVtcGxhdGU6IElSZXBvcnRUZW1wbGF0ZTtcclxuICAgIGxhc3RNb2RpZmllZFVzZXI7XHJcbiAgICBhcmd1bWVudHM6IHtcclxuICAgICAgICBydWxlcz86IGFueVtdO1xyXG4gICAgICAgIGRldmljZXM/OiBhbnlbXTtcclxuICAgICAgICB6b25lVHlwZUxpc3Q/OiBhbnlbXTtcclxuICAgICAgICBbcHJvcE5hbWU6IHN0cmluZ106IGFueTtcclxuICAgIH07XHJcbiAgICBbcHJvcE5hbWU6IHN0cmluZ106IGFueTtcclxufVxyXG5cclxuaW50ZXJmYWNlIElHcm91cCB7XHJcbiAgICBpZDogc3RyaW5nO1xyXG4gICAgY2hpbGRyZW46IElHcm91cFtdO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIElSZXBvcnREZXBlbmRlbmNpZXMge1xyXG4gICAgZGV2aWNlcz86IHN0cmluZ1tdO1xyXG4gICAgcnVsZXM/OiBzdHJpbmdbXTtcclxuICAgIHpvbmVUeXBlcz86IHN0cmluZ1tdO1xyXG4gICAgZ3JvdXBzPzogc3RyaW5nW107XHJcbn1cclxuXHJcbmludGVyZmFjZSBJUmVwb3J0VGVtcGxhdGUge1xyXG4gICAgaWQ6IHN0cmluZztcclxuICAgIG5hbWU6IHN0cmluZztcclxuICAgIGlzU3lzdGVtOiBib29sZWFuO1xyXG4gICAgcmVwb3J0RGF0YVNvdXJjZTogc3RyaW5nO1xyXG4gICAgcmVwb3J0VGVtcGxhdGVUeXBlOiBzdHJpbmc7XHJcbiAgICByZXBvcnRzOiBJUmVwb3J0W107XHJcbiAgICBiaW5hcnlEYXRhPzogc3RyaW5nO1xyXG4gICAgW3Byb3BOYW1lOiBzdHJpbmddOiBhbnk7XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFJlcG9ydHNCdWlsZGVyIHtcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgYXBpO1xyXG4gICAgcHJpdmF0ZSBjdXJyZW50VGFzaztcclxuICAgIHByaXZhdGUgYWxsUmVwb3J0czogSVJlcG9ydFtdO1xyXG4gICAgcHJpdmF0ZSBzdHJ1Y3R1cmVkUmVwb3J0cztcclxuICAgIHByaXZhdGUgZGFzaGJvYXJkc0xlbmd0aDogbnVtYmVyO1xyXG4gICAgcHJpdmF0ZSBhbGxUZW1wbGF0ZXM6IElSZXBvcnRUZW1wbGF0ZVtdO1xyXG5cclxuICAgIC8vR2V0UmVwb3J0U2NoZWR1bGVzIGlzIG9ic29sZXRlXHJcbiAgICBwcml2YXRlIGdldFJlcG9ydHMgKCk6IFByb21pc2U8YW55PiB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5hcGkubXVsdGlDYWxsKFtcclxuICAgICAgICAgICAgICAgIFtcIkdldFJlcG9ydFNjaGVkdWxlc1wiLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgXCJpbmNsdWRlVGVtcGxhdGVEZXRhaWxzXCI6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJhcHBseVVzZXJGaWx0ZXJcIjogZmFsc2VcclxuICAgICAgICAgICAgICAgIH1dLFxyXG4gICAgICAgICAgICAgICAgW1wiR2V0XCIsIHtcclxuICAgICAgICAgICAgICAgICAgICBcInR5cGVOYW1lXCI6IFwiUmVwb3J0VGVtcGxhdGVcIixcclxuICAgICAgICAgICAgICAgICAgICBcInNlYXJjaFwiOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGluY2x1ZGVCaW5hcnlEYXRhOiBmYWxzZVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1dLFxyXG4gICAgICAgICAgICAgICAgW1wiR2V0RGFzaGJvYXJkSXRlbXNcIiwge31dXHJcbiAgICAgICAgICAgIF0sIHJlc29sdmUsIHJlamVjdCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBzdHJ1Y3R1cmVSZXBvcnRzIChyZXBvcnRzLCB0ZW1wbGF0ZXMpIHtcclxuICAgICAgICBsZXQgZmluZFRlbXBsYXRlUmVwb3J0cyA9ICh0ZW1wbGF0ZUlkKSA9PiB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVwb3J0cy5maWx0ZXIocmVwb3J0ID0+IHJlcG9ydC50ZW1wbGF0ZS5pZCA9PT0gdGVtcGxhdGVJZCk7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgcmV0dXJuIHRlbXBsYXRlcy5yZWR1Y2UoKHJlcywgdGVtcGxhdGUpID0+IHtcclxuICAgICAgICAgICAgbGV0IHRlbXBsYXRlSWQgPSB0ZW1wbGF0ZS5pZCxcclxuICAgICAgICAgICAgICAgIHRlbXBsYXRlUmVwb3J0cyA9IGZpbmRUZW1wbGF0ZVJlcG9ydHModGVtcGxhdGVJZCk7XHJcbiAgICAgICAgICAgIGlmICh0ZW1wbGF0ZVJlcG9ydHMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZS5yZXBvcnRzID0gdGVtcGxhdGVSZXBvcnRzO1xyXG4gICAgICAgICAgICAgICAgcmVzLnB1c2godGVtcGxhdGUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiByZXM7XHJcbiAgICAgICAgfSwgW10pO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYWJvcnRDdXJyZW50VGFzayAoKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5jdXJyZW50VGFzayAmJiB0aGlzLmN1cnJlbnRUYXNrLmFib3J0ICYmIHRoaXMuY3VycmVudFRhc2suYWJvcnQoKTtcclxuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrID0gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHVwZGF0ZVRlbXBsYXRlIChuZXdUZW1wbGF0ZURhdGE6IElSZXBvcnRUZW1wbGF0ZSkge1xyXG4gICAgICAgIHRoaXMuYWxsVGVtcGxhdGVzLnNvbWUoKHRlbXBsYXRlRGF0YTogSVJlcG9ydFRlbXBsYXRlLCBpbmRleDogbnVtYmVyKSA9PiB7XHJcbiAgICAgICAgICAgIGlmICh0ZW1wbGF0ZURhdGEuaWQgPT09IG5ld1RlbXBsYXRlRGF0YS5pZCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hbGxUZW1wbGF0ZXNbaW5kZXhdID0gbmV3VGVtcGxhdGVEYXRhO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0cnVjdG9yKGFwaSkge1xyXG4gICAgICAgIHRoaXMuYXBpID0gYXBpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBmZXRjaCAoKTogUHJvbWlzZTxhbnk+IHtcclxuICAgICAgICB0aGlzLmFib3J0Q3VycmVudFRhc2soKTtcclxuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrID0gdGhpcy5nZXRSZXBvcnRzKClcclxuICAgICAgICAgICAgLnRoZW4oKFtyZXBvcnRzLCB0ZW1wbGF0ZXMsIGRhc2hib2FyZEl0ZW1zXSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hbGxSZXBvcnRzID0gcmVwb3J0cztcclxuICAgICAgICAgICAgICAgIHRoaXMuYWxsVGVtcGxhdGVzID0gdGVtcGxhdGVzO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5kYXNoYm9hcmRzTGVuZ3RoID0gZGFzaGJvYXJkSXRlbXMgJiYgZGFzaGJvYXJkSXRlbXMubGVuZ3RoID8gZGFzaGJvYXJkSXRlbXMubGVuZ3RoIDogMDtcclxuICAgICAgICAgICAgICAgIHRoaXMuc3RydWN0dXJlZFJlcG9ydHMgPSB0aGlzLnN0cnVjdHVyZVJlcG9ydHMocmVwb3J0cywgdGVtcGxhdGVzKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnN0cnVjdHVyZWRSZXBvcnRzO1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAuY2F0Y2goY29uc29sZS5lcnJvcilcclxuICAgICAgICAgICAgLmZpbmFsbHkoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50VGFzayA9IG51bGw7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiB0aGlzLmN1cnJlbnRUYXNrO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXREZXBlbmRlbmNpZXMgKHJlcG9ydHM6IElSZXBvcnRUZW1wbGF0ZVtdKTogSVJlcG9ydERlcGVuZGVuY2llcyB7XHJcbiAgICAgICAgbGV0IGFsbERlcGVuZGVuY2llczogSVJlcG9ydERlcGVuZGVuY2llcyA9IHtcclxuICAgICAgICAgICAgICAgIGRldmljZXM6IFtdLFxyXG4gICAgICAgICAgICAgICAgcnVsZXM6IFtdLFxyXG4gICAgICAgICAgICAgICAgem9uZVR5cGVzOiBbXSxcclxuICAgICAgICAgICAgICAgIGdyb3VwczogW11cclxuICAgICAgICAgICAgfTtcclxuICAgICAgICByZXR1cm4gcmVwb3J0cy5yZWR1Y2UoKHJlcG9ydHNEZXBlbmRlbmNpZXM6IElSZXBvcnREZXBlbmRlbmNpZXMsIHRlbXBsYXRlOiBJUmVwb3J0VGVtcGxhdGUpID0+IHtcclxuICAgICAgICAgICAgcmV0dXJuIHRlbXBsYXRlLnJlcG9ydHMucmVkdWNlKCh0ZW1wbGF0ZURlcGVuZGVjaWVzLCByZXBvcnQpID0+IHtcclxuICAgICAgICAgICAgICAgIHRlbXBsYXRlRGVwZW5kZWNpZXMuZ3JvdXBzID0gVXRpbHMubWVyZ2VVbmlxdWUodGVtcGxhdGVEZXBlbmRlY2llcy5ncm91cHMsIFV0aWxzLmdldEVudGl0aWVzSWRzKHJlcG9ydC5ncm91cHMpLFxyXG4gICAgICAgICAgICAgICAgICAgIFV0aWxzLmdldEVudGl0aWVzSWRzKHJlcG9ydC5pbmNsdWRlQWxsQ2hpbGRyZW5Hcm91cHMpLCBVdGlscy5nZXRFbnRpdGllc0lkcyhyZXBvcnQuaW5jbHVkZURpcmVjdENoaWxkcmVuT25seUdyb3VwcyksXHJcbiAgICAgICAgICAgICAgICAgICAgVXRpbHMuZ2V0RW50aXRpZXNJZHMocmVwb3J0LnNjb3BlR3JvdXBzKSk7XHJcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZURlcGVuZGVjaWVzLmRldmljZXMgPSBVdGlscy5tZXJnZVVuaXF1ZSh0ZW1wbGF0ZURlcGVuZGVjaWVzLmRldmljZXMsIHJlcG9ydC5hcmd1bWVudHMgJiYgcmVwb3J0LmFyZ3VtZW50cy5kZXZpY2VzICYmIFV0aWxzLmdldEVudGl0aWVzSWRzKHJlcG9ydC5hcmd1bWVudHMuZGV2aWNlcykgfHwgW10pO1xyXG4gICAgICAgICAgICAgICAgdGVtcGxhdGVEZXBlbmRlY2llcy5ydWxlcyA9IFV0aWxzLm1lcmdlVW5pcXVlKHRlbXBsYXRlRGVwZW5kZWNpZXMucnVsZXMsIHJlcG9ydC5hcmd1bWVudHMgJiYgcmVwb3J0LmFyZ3VtZW50cy5ydWxlcyAmJiBVdGlscy5nZXRFbnRpdGllc0lkcyhyZXBvcnQuYXJndW1lbnRzLnJ1bGVzKSB8fCBbXSk7XHJcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZURlcGVuZGVjaWVzLnpvbmVUeXBlcyA9IFV0aWxzLm1lcmdlVW5pcXVlKFxyXG4gICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlRGVwZW5kZWNpZXMuem9uZVR5cGVzLCByZXBvcnQuYXJndW1lbnRzICYmIHJlcG9ydC5hcmd1bWVudHMuem9uZVR5cGVMaXN0ICYmIFV0aWxzLmdldEVudGl0aWVzSWRzKHJlcG9ydC5hcmd1bWVudHMuem9uZVR5cGVMaXN0KSB8fCBbXSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGVtcGxhdGVEZXBlbmRlY2llcztcclxuICAgICAgICAgICAgfSwgcmVwb3J0c0RlcGVuZGVuY2llcyk7XHJcbiAgICAgICAgfSwgYWxsRGVwZW5kZW5jaWVzKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0RGF0YSAoKTogUHJvbWlzZTxJUmVwb3J0VGVtcGxhdGVbXT4ge1xyXG4gICAgICAgIGxldCBwb3J0aW9uU2l6ZSA9IDE1LFxyXG4gICAgICAgICAgICBwb3J0aW9ucyA9IHRoaXMuYWxsVGVtcGxhdGVzLnJlZHVjZSgocmVxdWVzdHMsIHRlbXBsYXRlOiBJUmVwb3J0VGVtcGxhdGUpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmICghdGVtcGxhdGUuaXNTeXN0ZW0gJiYgIXRlbXBsYXRlLmJpbmFyeURhdGEpIHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgcG9ydGlvbkluZGV4OiBudW1iZXIgPSByZXF1ZXN0cy5sZW5ndGggLSAxO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghcmVxdWVzdHNbcG9ydGlvbkluZGV4XSB8fCByZXF1ZXN0c1twb3J0aW9uSW5kZXhdLmxlbmd0aCA+PSBwb3J0aW9uU2l6ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgIHJlcXVlc3RzLnB1c2goW10pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgIHBvcnRpb25JbmRleCArKztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWVzdHNbcG9ydGlvbkluZGV4XS5wdXNoKFtcIkdldFwiLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwidHlwZU5hbWVcIjogXCJSZXBvcnRUZW1wbGF0ZVwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBcInNlYXJjaFwiOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZDogdGVtcGxhdGUuaWQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmNsdWRlQmluYXJ5RGF0YTogdHJ1ZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfV0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlcXVlc3RzO1xyXG4gICAgICAgICAgICB9LCBbXSksXHJcbiAgICAgICAgICAgIHRvdGFsUmVzdWx0czogYW55W11bXSA9IFtdLFxyXG4gICAgICAgICAgICBnZXRQb3J0aW9uRGF0YSA9IHBvcnRpb24gPT4ge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPGFueT4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYXBpLm11bHRpQ2FsbChwb3J0aW9uLCByZXNvbHZlLCByZWplY3QpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGVycm9yUG9ydGlvbnMgPSBbXTtcclxuXHJcbiAgICAgICAgdGhpcy5hYm9ydEN1cnJlbnRUYXNrKCk7XHJcbiAgICAgICAgdGhpcy5jdXJyZW50VGFzayA9IHBvcnRpb25zLnJlZHVjZSgocHJvbWlzZXMsIHBvcnRpb24pID0+IHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBwcm9taXNlc1xyXG4gICAgICAgICAgICAgICAgICAgIC50aGVuKCgpID0+IGdldFBvcnRpb25EYXRhKHBvcnRpb24pKVxyXG4gICAgICAgICAgICAgICAgICAgIC50aGVuKHJlc3VsdCA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b3RhbFJlc3VsdHMgPSB0b3RhbFJlc3VsdHMuY29uY2F0KHJlc3VsdCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sIGUgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3JQb3J0aW9ucyA9IGVycm9yUG9ydGlvbnMuY29uY2F0KHBvcnRpb24pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIH0sIFV0aWxzLnJlc29sdmVkUHJvbWlzZShbXSkpXHJcbiAgICAgICAgICAgIC50aGVuKCgpID0+IHtcclxuICAgICAgICAgICAgICAgIGVycm9yUG9ydGlvbnMubGVuZ3RoICYmIGNvbnNvbGUud2FybihlcnJvclBvcnRpb25zKTtcclxuICAgICAgICAgICAgICAgIHRvdGFsUmVzdWx0cy5mb3JFYWNoKHRlbXBsYXRlRGF0YSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHRlbXBsYXRlOiBJUmVwb3J0VGVtcGxhdGUgPSB0ZW1wbGF0ZURhdGEubGVuZ3RoID8gdGVtcGxhdGVEYXRhWzBdIDogdGVtcGxhdGVEYXRhO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlVGVtcGxhdGUodGVtcGxhdGUpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnN0cnVjdHVyZWRSZXBvcnRzID0gdGhpcy5zdHJ1Y3R1cmVSZXBvcnRzKHRoaXMuYWxsUmVwb3J0cywgdGhpcy5hbGxUZW1wbGF0ZXMpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuc3RydWN0dXJlZFJlcG9ydHM7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIC5jYXRjaChjb25zb2xlLmVycm9yKVxyXG4gICAgICAgICAgICAuZmluYWxseSgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRUYXNrID0gbnVsbDtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY3VycmVudFRhc2s7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldERhc2hib2FyZHNRdHkgKCk6IG51bWJlciB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZGFzaGJvYXJkc0xlbmd0aDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0Q3VzdG9taXplZFJlcG9ydHNRdHkgKCk6IG51bWJlciB7XHJcbiAgICAgICAgbGV0IHRlbXBsYXRlcyA9IFtdO1xyXG4gICAgICAgIHJldHVybiAodGhpcy5hbGxSZXBvcnRzLmZpbHRlcigocmVwb3J0OiBJUmVwb3J0KSA9PiB7XHJcbiAgICAgICAgICAgIGxldCB0ZW1wbGF0ZUlkID0gcmVwb3J0LnRlbXBsYXRlLmlkLFxyXG4gICAgICAgICAgICAgICAgdGVtcGxhdGVFeGlzdHM6IGJvb2xlYW4gPSB0ZW1wbGF0ZXMuaW5kZXhPZih0ZW1wbGF0ZUlkKSA+IC0xLFxyXG4gICAgICAgICAgICAgICAgaXNDb3VudDogYm9vbGVhbiA9ICF0ZW1wbGF0ZUV4aXN0cyAmJiByZXBvcnQubGFzdE1vZGlmaWVkVXNlciAhPT0gXCJOb1VzZXJJZFwiO1xyXG4gICAgICAgICAgICBpc0NvdW50ICYmIHRlbXBsYXRlcy5wdXNoKHRlbXBsYXRlSWQpO1xyXG4gICAgICAgICAgICByZXR1cm4gaXNDb3VudDtcclxuICAgICAgICB9KSkubGVuZ3RoO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyB1bmxvYWQgKCk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMuYWJvcnRDdXJyZW50VGFzaygpO1xyXG4gICAgfVxyXG59IiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uL2JsdWViaXJkLmQudHNcIi8+XHJcbmltcG9ydCB7IHNvcnRBcnJheU9mRW50aXRpZXMsIGVudGl0eVRvRGljdGlvbmFyeSwgbWVyZ2VVbmlxdWUgfSBmcm9tIFwiLi91dGlsc1wiO1xyXG5cclxuaW50ZXJmYWNlIElSdWxlIHtcclxuICAgIGlkOiBzdHJpbmc7XHJcbiAgICBncm91cHM6IGFueVtdO1xyXG4gICAgY29uZGl0aW9uOiBhbnk7XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgSVJ1bGVEZXBlbmRlbmNpZXMge1xyXG4gICAgZGV2aWNlcz86IGFueVtdO1xyXG4gICAgdXNlcnM/OiBhbnlbXTtcclxuICAgIHpvbmVzPzogYW55W107XHJcbiAgICB6b25lVHlwZXM/OiBhbnlbXTtcclxuICAgIHdvcmtUaW1lcz86IGFueVtdO1xyXG4gICAgd29ya0hvbGlkYXlzPzogYW55W107XHJcbiAgICBncm91cHM/OiBhbnlbXTtcclxuICAgIHNlY3VyaXR5R3JvdXBzPzogYW55W107XHJcbiAgICBkaWFnbm9zdGljcz86IGFueVtdO1xyXG59XHJcblxyXG5jb25zdCBBUFBMSUNBVElPTl9SVUxFX0lEID0gXCJSdWxlQXBwbGljYXRpb25FeGNlcHRpb25JZFwiO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgUnVsZXNCdWlsZGVyIHtcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgYXBpO1xyXG4gICAgcHJpdmF0ZSBjdXJyZW50VGFzaztcclxuICAgIHByaXZhdGUgY29tYmluZWRSdWxlcztcclxuICAgIHByaXZhdGUgc3RydWN0dXJlZFJ1bGVzO1xyXG5cclxuICAgIHByaXZhdGUgZ2V0UnVsZXMgKCk6IFByb21pc2U8YW55PiB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5hcGkuY2FsbChcIkdldFwiLCB7XHJcbiAgICAgICAgICAgICAgICBcInR5cGVOYW1lXCI6IFwiUnVsZVwiXHJcbiAgICAgICAgICAgIH0sIHJlc29sdmUsIHJlamVjdCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBzdHJ1Y3R1cmVSdWxlcyAocnVsZXMpIHtcclxuICAgICAgICByZXR1cm4gc29ydEFycmF5T2ZFbnRpdGllcyhydWxlcywgW1tcImJhc2VUeXBlXCIsIFwiZGVzY1wiXSwgXCJuYW1lXCJdKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFib3J0Q3VycmVudFRhc2sgKCk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgJiYgdGhpcy5jdXJyZW50VGFzay5hYm9ydCAmJiB0aGlzLmN1cnJlbnRUYXNrLmFib3J0KCk7XHJcbiAgICAgICAgdGhpcy5jdXJyZW50VGFzayA9IG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3RydWN0b3IoYXBpKSB7XHJcbiAgICAgICAgdGhpcy5hcGkgPSBhcGk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldERlcGVuZGVuY2llcyAocnVsZXMpOiBJUnVsZURlcGVuZGVuY2llcyB7XHJcbiAgICAgICAgbGV0IGRlcGVuZGVuY2llcyA9IHtcclxuICAgICAgICAgICAgICAgIGRldmljZXM6IFtdLFxyXG4gICAgICAgICAgICAgICAgdXNlcnM6IFtdLFxyXG4gICAgICAgICAgICAgICAgem9uZXM6IFtdLFxyXG4gICAgICAgICAgICAgICAgem9uZVR5cGVzOiBbXSxcclxuICAgICAgICAgICAgICAgIHdvcmtUaW1lczogW10sXHJcbiAgICAgICAgICAgICAgICBncm91cHM6IFtdLFxyXG4gICAgICAgICAgICAgICAgZGlhZ25vc3RpY3M6IFtdXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHByb2Nlc3NEZXBlbmRlbmNpZXMgPSAoY29uZGl0aW9uKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBsZXQgaWQsIHR5cGU6IHN0cmluZztcclxuICAgICAgICAgICAgICAgIHN3aXRjaCAoY29uZGl0aW9uLmNvbmRpdGlvblR5cGUpIHtcclxuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiUnVsZVdvcmtIb3Vyc1wiOlxyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJBZnRlclJ1bGVXb3JrSG91cnNcIjpcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWQgPSAoY29uZGl0aW9uLndvcmtUaW1lICYmIGNvbmRpdGlvbi53b3JrVGltZS5pZCkgfHwgY29uZGl0aW9uLndvcmtUaW1lO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlID0gXCJ3b3JrVGltZXNcIjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIkRyaXZlclwiOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZCA9IGNvbmRpdGlvbi5kcml2ZXIgJiYgY29uZGl0aW9uLmRyaXZlci5pZDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZSA9IFwidXNlcnNcIjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIkRldmljZVwiOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZCA9IGNvbmRpdGlvbi5kZXZpY2UgJiYgY29uZGl0aW9uLmRldmljZS5pZDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZSA9IFwiZGV2aWNlc1wiO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiRW50ZXJpbmdBcmVhXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIkV4aXRpbmdBcmVhXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIk91dHNpZGVBcmVhXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIkluc2lkZUFyZWFcIjpcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNvbmRpdGlvbi56b25lKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZCA9IGNvbmRpdGlvbi56b25lLmlkIHx8IGNvbmRpdGlvbi56b25lO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZSA9IFwiem9uZXNcIjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkID0gY29uZGl0aW9uLnpvbmVUeXBlLmlkO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZSA9IFwiem9uZVR5cGVzXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIkZpbHRlclN0YXR1c0RhdGFCeURpYWdub3N0aWNcIjpcclxuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiQWN0aXZlT3JJbmFjdGl2ZUZhdWx0XCI6XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIkZhdWx0XCI6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjb25kaXRpb24uZGlhZ25vc3RpYykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWQgPSBjb25kaXRpb24uZGlhZ25vc3RpYy5pZCB8fCBjb25kaXRpb24uZGlhZ25vc3RpYztcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGUgPSBcImRpYWdub3N0aWNzXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZCAmJiB0eXBlICYmIGRlcGVuZGVuY2llc1t0eXBlXS5pbmRleE9mKGlkKSA9PT0gLTEgJiYgZGVwZW5kZW5jaWVzW3R5cGVdLnB1c2goaWQpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBjaGVja0NvbmRpdGlvbnMgPSAocGFyZW50Q29uZGl0aW9uLCBkZXBlbmRlbmNpZXM6IElSdWxlRGVwZW5kZW5jaWVzKTogSVJ1bGVEZXBlbmRlbmNpZXMgPT4ge1xyXG4gICAgICAgICAgICAgICAgbGV0IGNvbmRpdGlvbnMgPSBwYXJlbnRDb25kaXRpb24uY2hpbGRyZW4gfHwgW107XHJcbiAgICAgICAgICAgICAgICBwcm9jZXNzRGVwZW5kZW5jaWVzKHBhcmVudENvbmRpdGlvbik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY29uZGl0aW9ucy5yZWR1Y2UoKGRlcGVuZGVuY2llcywgY29uZGl0aW9uKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNvbmRpdGlvbi5jaGlsZHJlbikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkZXBlbmRlbmNpZXMgPSBjaGVja0NvbmRpdGlvbnMoY29uZGl0aW9uLCBkZXBlbmRlbmNpZXMpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBwcm9jZXNzRGVwZW5kZW5jaWVzKGNvbmRpdGlvbik7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGRlcGVuZGVuY2llcztcclxuICAgICAgICAgICAgICAgIH0sIGRlcGVuZGVuY2llcyk7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgcmV0dXJuIHJ1bGVzLnJlZHVjZSgoZGVwZW5kZW5jaWVzOiBJUnVsZURlcGVuZGVuY2llcywgcnVsZTogSVJ1bGUpID0+IHtcclxuICAgICAgICAgICAgZGVwZW5kZW5jaWVzLmdyb3VwcyA9IG1lcmdlVW5pcXVlKGRlcGVuZGVuY2llcy5ncm91cHMsIHJ1bGUuZ3JvdXBzLm1hcChncm91cCA9PiBncm91cC5pZCkpO1xyXG4gICAgICAgICAgICBpZiAocnVsZS5jb25kaXRpb24pIHtcclxuICAgICAgICAgICAgICAgIGRlcGVuZGVuY2llcyA9IGNoZWNrQ29uZGl0aW9ucyhydWxlLmNvbmRpdGlvbiwgZGVwZW5kZW5jaWVzKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gZGVwZW5kZW5jaWVzO1xyXG4gICAgICAgIH0sIGRlcGVuZGVuY2llcyk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGZldGNoKCk6IFByb21pc2U8YW55PiB7XHJcbiAgICAgICAgdGhpcy5hYm9ydEN1cnJlbnRUYXNrKCk7XHJcbiAgICAgICAgdGhpcy5jdXJyZW50VGFzayA9IHRoaXMuZ2V0UnVsZXMoKVxyXG4gICAgICAgICAgICAudGhlbigoc3dpdGNoZWRPblJ1bGVzKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNvbWJpbmVkUnVsZXMgPSBlbnRpdHlUb0RpY3Rpb25hcnkoc3dpdGNoZWRPblJ1bGVzKTtcclxuICAgICAgICAgICAgICAgIGRlbGV0ZSh0aGlzLmNvbWJpbmVkUnVsZXNbQVBQTElDQVRJT05fUlVMRV9JRF0pO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zdHJ1Y3R1cmVkUnVsZXMgPSB0aGlzLnN0cnVjdHVyZVJ1bGVzKE9iamVjdC5rZXlzKHRoaXMuY29tYmluZWRSdWxlcykubWFwKGtleSA9PiB0aGlzLmNvbWJpbmVkUnVsZXNba2V5XSkpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIE9iamVjdC5rZXlzKHRoaXMuY29tYmluZWRSdWxlcykubWFwKHJ1bGVJZCA9PiB0aGlzLmNvbWJpbmVkUnVsZXNbcnVsZUlkXSk7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIC5jYXRjaChjb25zb2xlLmVycm9yKVxyXG4gICAgICAgICAgICAuZmluYWxseSgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRUYXNrID0gbnVsbDtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY3VycmVudFRhc2s7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldFJ1bGVzRGF0YSAocnVsZXNJZHM6IHN0cmluZ1tdKTogSVJ1bGVbXSB7XHJcbiAgICAgICAgcmV0dXJuIHJ1bGVzSWRzLm1hcChydWxlSWQgPT4gdGhpcy5jb21iaW5lZFJ1bGVzW3J1bGVJZF0pO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyB1bmxvYWQgKCk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMuYWJvcnRDdXJyZW50VGFzaygpO1xyXG4gICAgfVxyXG59IiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uL2JsdWViaXJkLmQudHNcIi8+XHJcbmltcG9ydCBHcm91cHNCdWlsZGVyIGZyb20gXCIuL2dyb3Vwc0J1aWxkZXJcIjtcclxuaW1wb3J0ICogYXMgVXRpbHMgZnJvbSBcIi4vdXRpbHNcIjtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFNlY3VyaXR5Q2xlYXJhbmNlc0J1aWxkZXIgZXh0ZW5kcyBHcm91cHNCdWlsZGVyIHtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihhcGk6IGFueSkge1xyXG4gICAgICAgIHN1cGVyKGFwaSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBnZXRTZWN1cml0eUdyb3VwcyAoKTogUHJvbWlzZTxhbnk+IHtcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLmFwaS5nZXRTZXNzaW9uKChzZXNzaW9uRGF0YSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hcGkuY2FsbChcIkdldFwiLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGVOYW1lOiBcIkdyb3VwXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlYXJjaDoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IFwiR3JvdXBTZWN1cml0eUlkXCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0sIHJlc29sdmUsIHJlamVjdCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICBwdWJsaWMgZmV0Y2ggKCk6IFByb21pc2U8YW55PiB7XHJcbiAgICAgICAgdGhpcy5hYm9ydEN1cnJlbnRUYXNrKCk7XHJcbiAgICAgICAgdGhpcy5jdXJyZW50VGFzayA9IHRoaXMuZ2V0U2VjdXJpdHlHcm91cHMoKVxyXG4gICAgICAgICAgICAudGhlbihncm91cHMgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5ncm91cHMgPSBncm91cHM7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnRyZWUgPSB0aGlzLmNyZWF0ZUdyb3Vwc1RyZWUoZ3JvdXBzKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudFRyZWUgPSBVdGlscy5leHRlbmQoe30sIHRoaXMudHJlZSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVGbGF0R3JvdXBzTGlzdCh0aGlzLnRyZWUpLmZpbHRlcihncm91cCA9PiAhIWdyb3VwLm5hbWUpO1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAuY2F0Y2goY29uc29sZS5lcnJvcilcclxuICAgICAgICAgICAgLmZpbmFsbHkoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50VGFzayA9IG51bGw7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiB0aGlzLmN1cnJlbnRUYXNrO1xyXG4gICAgfTtcclxufSIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi9ibHVlYmlyZC5kLnRzXCIvPlxyXG5pbnRlcmZhY2UgSUNsYXNzQ29udHJvbCB7XHJcbiAgICBnZXQ6ICgpID0+IHN0cmluZztcclxuICAgIHNldDogKG5hbWU6IHN0cmluZykgPT4gdm9pZDtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBJRW50aXR5IHtcclxuICAgIGlkOiBzdHJpbmc7XHJcbiAgICBbcHJvcE5hbWU6IHN0cmluZ106IGFueTtcclxufVxyXG5cclxudHlwZSBJU29ydFByb3BlcnR5ID0gc3RyaW5nIHwgW3N0cmluZywgXCJhc2NcIiB8IFwiZGVzY1wiXTtcclxuXHJcbmxldCBjbGFzc05hbWVDdHJsID0gZnVuY3Rpb24gKGVsOiBFbGVtZW50KTogSUNsYXNzQ29udHJvbCB7XHJcbiAgICAgICAgdmFyIHBhcmFtID0gdHlwZW9mIGVsLmNsYXNzTmFtZSA9PT0gXCJzdHJpbmdcIiA/IFwiY2xhc3NOYW1lXCIgOiBcImJhc2VWYWxcIjtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBlbFtwYXJhbV0gfHwgXCJcIjtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgc2V0OiBmdW5jdGlvbiAodGV4dCkge1xyXG4gICAgICAgICAgICAgICAgZWxbcGFyYW1dID0gdGV4dDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICB9LFxyXG4gICAgaXNVc3VhbE9iamVjdCA9IGZ1bmN0aW9uIChvYmopIHtcclxuICAgICAgICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9iaikuaW5kZXhPZihcIk9iamVjdFwiKSAhPT0gLTE7XHJcbiAgICB9O1xyXG5cclxuZXhwb3J0IGludGVyZmFjZSBJSGFzaCB7XHJcbiAgICBbaWQ6IHN0cmluZ106IGFueTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHJlbW92ZUNsYXNzKGVsOiBFbGVtZW50LCBuYW1lOiBzdHJpbmcpOiB2b2lkIHtcclxuICAgIGlmICghZWwpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICBsZXQgY2xhc3Nlc1N0ciA9IGNsYXNzTmFtZUN0cmwoZWwpLmdldCgpLFxyXG4gICAgICAgIGNsYXNzZXMgPSBjbGFzc2VzU3RyLnNwbGl0KFwiIFwiKSxcclxuICAgICAgICBuZXdDbGFzc2VzID0gY2xhc3Nlcy5maWx0ZXIoY2xhc3NJdGVtID0+IGNsYXNzSXRlbSAhPT0gbmFtZSk7XHJcbiAgICBjbGFzc05hbWVDdHJsKGVsKS5zZXQobmV3Q2xhc3Nlcy5qb2luKFwiIFwiKSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBhZGRDbGFzcyhlbCwgbmFtZSk6IHZvaWQge1xyXG4gICAgaWYgKCFlbCkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIGxldCBjbGFzc2VzU3RyID0gY2xhc3NOYW1lQ3RybChlbCkuZ2V0KCksXHJcbiAgICAgICAgY2xhc3NlcyA9IGNsYXNzZXNTdHIuc3BsaXQoXCIgXCIpO1xyXG4gICAgaWYgKGNsYXNzZXMuaW5kZXhPZihuYW1lKSA9PT0gLTEpIHtcclxuICAgICAgICBjbGFzc05hbWVDdHJsKGVsKS5zZXQoY2xhc3Nlc1N0ciArIFwiIFwiICsgbmFtZSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBoYXNDbGFzcyhlbDogRWxlbWVudCwgY2xhc3NOYW1lOiBzdHJpbmcpOiBib29sZWFuIHtcclxuICAgIHJldHVybiBlbCAmJiBjbGFzc05hbWVDdHJsKGVsKS5nZXQoKS5pbmRleE9mKGNsYXNzTmFtZSkgIT09IC0xO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZXh0ZW5kKC4uLmFyZ3M6IGFueVtdKSB7XHJcbiAgICB2YXIgbGVuZ3RoID0gYXJncy5sZW5ndGgsXHJcbiAgICAgICAgc3JjLCBzcmNLZXlzLCBzcmNBdHRyLFxyXG4gICAgICAgIGZ1bGxDb3B5ID0gZmFsc2UsXHJcbiAgICAgICAgcmVzQXR0cixcclxuICAgICAgICByZXMgPSBhcmdzWzBdLCBpID0gMSwgajtcclxuXHJcbiAgICBpZiAodHlwZW9mIHJlcyA9PT0gXCJib29sZWFuXCIpIHtcclxuICAgICAgICBmdWxsQ29weSA9IHJlcztcclxuICAgICAgICByZXMgPSBhcmdzWzFdO1xyXG4gICAgICAgIGkrKztcclxuICAgIH1cclxuICAgIHdoaWxlIChpICE9PSBsZW5ndGgpIHtcclxuICAgICAgICBzcmMgPSBhcmdzW2ldO1xyXG4gICAgICAgIHNyY0tleXMgPSBPYmplY3Qua2V5cyhzcmMpO1xyXG4gICAgICAgIGZvciAoaiA9IDA7IGogPCBzcmNLZXlzLmxlbmd0aDsgaisrKSB7XHJcbiAgICAgICAgICAgIHNyY0F0dHIgPSBzcmNbc3JjS2V5c1tqXV07XHJcbiAgICAgICAgICAgIGlmIChmdWxsQ29weSAmJiAoaXNVc3VhbE9iamVjdChzcmNBdHRyKSB8fCBBcnJheS5pc0FycmF5KHNyY0F0dHIpKSkge1xyXG4gICAgICAgICAgICAgICAgcmVzQXR0ciA9IHJlc1tzcmNLZXlzW2pdXTtcclxuICAgICAgICAgICAgICAgIHJlc0F0dHIgPSByZXNbc3JjS2V5c1tqXV0gPSAoaXNVc3VhbE9iamVjdChyZXNBdHRyKSB8fCBBcnJheS5pc0FycmF5KHJlc0F0dHIpKSA/IHJlc0F0dHIgOiAoQXJyYXkuaXNBcnJheShzcmNBdHRyKSA/IFtdIDoge30pO1xyXG4gICAgICAgICAgICAgICAgZXh0ZW5kKGZ1bGxDb3B5LCByZXNBdHRyLCBzcmNBdHRyKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHJlc1tzcmNLZXlzW2pdXSA9IHNyY1tzcmNLZXlzW2pdXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBpKys7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcmVzO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZW50aXR5VG9EaWN0aW9uYXJ5KGVudGl0aWVzOiBhbnlbXSwgZW50aXR5Q2FsbGJhY2s/OiAoZW50aXR5OiBhbnkpID0+IGFueSk6IElIYXNoIHtcclxuICAgIHZhciBlbnRpdHksIG8gPSB7fSwgaSxcclxuICAgICAgICBsID0gZW50aXRpZXMubGVuZ3RoO1xyXG5cclxuICAgIGZvciAoaSA9IDA7IGkgPCBsOyBpKyspIHtcclxuICAgICAgICBpZiAoZW50aXRpZXNbaV0pIHtcclxuICAgICAgICAgICAgZW50aXR5ID0gZW50aXRpZXNbaV0uaWQgPyBlbnRpdGllc1tpXSA6IHtpZDogZW50aXRpZXNbaV19O1xyXG4gICAgICAgICAgICBvW2VudGl0eS5pZF0gPSBlbnRpdHlDYWxsYmFjayA/IGVudGl0eUNhbGxiYWNrKGVudGl0eSkgOiBlbnRpdHk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIG87XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBzb3J0QXJyYXlPZkVudGl0aWVzKGVudGl0aWVzOiBhbnlbXSwgc29ydGluZ0ZpZWxkczogSVNvcnRQcm9wZXJ0eVtdKTogYW55W10ge1xyXG4gICAgbGV0IGNvbXBhcmF0b3IgPSAocHJldkl0ZW0sIG5leHRJdGVtLCBwcm9wZXJ0aWVzOiBhbnlbXSwgaW5kZXggPSAwKSA9PiB7XHJcbiAgICAgICAgaWYgKHByb3BlcnRpZXMubGVuZ3RoIDw9IGluZGV4KSB7XHJcbiAgICAgICAgICAgIHJldHVybiAwO1xyXG4gICAgICAgIH1cclxuICAgICAgICBsZXQgb3B0aW9ucyA9IHByb3BlcnRpZXNbaW5kZXhdLFxyXG4gICAgICAgICAgICBbcHJvcGVydHksIGRpciA9IFwiYXNjXCJdID0gQXJyYXkuaXNBcnJheShvcHRpb25zKSA/IG9wdGlvbnMgOiBbb3B0aW9uc10sXHJcbiAgICAgICAgICAgIGRpck11bHRpcGxpZXI6IG51bWJlcjtcclxuICAgICAgICBkaXJNdWx0aXBsaWVyID0gZGlyID09PSBcImFzY1wiID8gMSA6IC0xO1xyXG4gICAgICAgIGlmIChwcmV2SXRlbVtwcm9wZXJ0eV0gPiBuZXh0SXRlbVtwcm9wZXJ0eV0pIHtcclxuICAgICAgICAgICAgcmV0dXJuIDEgKiBkaXJNdWx0aXBsaWVyO1xyXG4gICAgICAgIH0gZWxzZSBpZiAocHJldkl0ZW1bcHJvcGVydHldIDwgbmV4dEl0ZW1bcHJvcGVydHldKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAtMSAqIGRpck11bHRpcGxpZXI7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcmV0dXJuIGNvbXBhcmF0b3IocHJldkl0ZW0sIG5leHRJdGVtLCBwcm9wZXJ0aWVzLCBpbmRleCArIDEpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbiAgICByZXR1cm4gZW50aXRpZXMuc29ydCgocHJldlRlbXBsYXRlLCBuZXh0VGVtcGxhdGUpID0+IHtcclxuICAgICAgICByZXR1cm4gY29tcGFyYXRvcihwcmV2VGVtcGxhdGUsIG5leHRUZW1wbGF0ZSwgc29ydGluZ0ZpZWxkcyk7XHJcbiAgICB9KTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGRvd25sb2FkRGF0YUFzRmlsZShkYXRhOiBzdHJpbmcsIGZpbGVuYW1lOiBzdHJpbmcsIG1pbWVUeXBlID0gXCJ0ZXh0L2pzb25cIikge1xyXG4gICAgbGV0IGJsb2IgPSBuZXcgQmxvYihbZGF0YV0sIHt0eXBlOiBtaW1lVHlwZX0pLFxyXG4gICAgICAgIGVsZW07XHJcbiAgICBpZiAod2luZG93Lm5hdmlnYXRvci5tc1NhdmVPck9wZW5CbG9iKSB7XHJcbiAgICAgICAgd2luZG93Lm5hdmlnYXRvci5tc1NhdmVCbG9iKGJsb2IsIGZpbGVuYW1lKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgZWxlbSA9IHdpbmRvdy5kb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYVwiKTtcclxuICAgICAgICBlbGVtLmhyZWYgPSB3aW5kb3cuVVJMLmNyZWF0ZU9iamVjdFVSTChibG9iKTtcclxuICAgICAgICBlbGVtLmRvd25sb2FkID0gZmlsZW5hbWU7XHJcbiAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChlbGVtKTtcclxuICAgICAgICBlbGVtLmNsaWNrKCk7XHJcbiAgICAgICAgZG9jdW1lbnQuYm9keS5yZW1vdmVDaGlsZChlbGVtKTtcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIG1lcmdlVW5pcXVlRW50aXRpZXMgKC4uLnNvdXJjZXM6IElFbnRpdHlbXVtdKTogSUVudGl0eVtdIHtcclxuICAgIGxldCBhZGRlZElkczogc3RyaW5nW10gPSBbXSxcclxuICAgICAgICBtZXJnZWRJdGVtczogSUVudGl0eVtdID0gW107XHJcbiAgICBzb3VyY2VzLmZvckVhY2goc291cmNlID0+IHNvdXJjZS5mb3JFYWNoKGl0ZW0gPT4ge1xyXG4gICAgICAgIGlmIChpdGVtICYmIGl0ZW0uaWQgJiYgYWRkZWRJZHMuaW5kZXhPZihpdGVtLmlkKSA9PT0gLTEpIHtcclxuICAgICAgICAgICAgYWRkZWRJZHMucHVzaChpdGVtLmlkKTtcclxuICAgICAgICAgICAgbWVyZ2VkSXRlbXMucHVzaChpdGVtKTtcclxuICAgICAgICB9XHJcbiAgICB9KSk7XHJcbiAgICByZXR1cm4gbWVyZ2VkSXRlbXM7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRFbnRpdGllc0lkcyAoZW50aXRpZXNMaXN0OiBJRW50aXR5W10pOiBzdHJpbmdbXSB7XHJcbiAgICByZXR1cm4gQXJyYXkuaXNBcnJheShlbnRpdGllc0xpc3QpICYmIGVudGl0aWVzTGlzdC5yZWR1Y2UoKHJlc3VsdCwgZW50aXR5KSA9PiB7XHJcbiAgICAgICAgZW50aXR5ICYmIGVudGl0eS5pZCAmJiByZXN1bHQucHVzaChlbnRpdHkuaWQpO1xyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9LCBbXSkgfHwgW107XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBtZXJnZVVuaXF1ZSAoLi4uc291cmNlczogc3RyaW5nW11bXSk6IHN0cmluZ1tdIHtcclxuICAgIGxldCBtZXJnZWRJdGVtczogc3RyaW5nW10gPSBbXTtcclxuICAgIHNvdXJjZXMuZm9yRWFjaChzb3VyY2UgPT4ge1xyXG4gICAgICAgIEFycmF5LmlzQXJyYXkoc291cmNlKSAmJiBzb3VyY2UuZm9yRWFjaChpdGVtID0+IHtcclxuICAgICAgICAgICAgaXRlbSAmJiBtZXJnZWRJdGVtcy5pbmRleE9mKGl0ZW0pID09PSAtMSAmJiBtZXJnZWRJdGVtcy5wdXNoKGl0ZW0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfSk7XHJcbiAgICByZXR1cm4gbWVyZ2VkSXRlbXM7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRVbmlxdWVFbnRpdGllcyAobmV3RW50aXRpZXM6IElFbnRpdHlbXSwgZXhpc3RlZEVudGl0aWVzOiBJRW50aXR5W10pOiBJRW50aXR5W10ge1xyXG4gICAgbGV0IHNlbGVjdGVkRW50aXRpZXNIYXNoID0gZW50aXR5VG9EaWN0aW9uYXJ5KGV4aXN0ZWRFbnRpdGllcyk7XHJcbiAgICByZXR1cm4gbmV3RW50aXRpZXMucmVkdWNlKChyZXMsIGVudGl0eSkgPT4ge1xyXG4gICAgICAgICFzZWxlY3RlZEVudGl0aWVzSGFzaFtlbnRpdHkuaWRdICYmIHJlcy5wdXNoKGVudGl0eSk7XHJcbiAgICAgICAgcmV0dXJuIHJlcztcclxuICAgIH0sIFtdKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHRvZ2V0aGVyKHByb21pc2VzOiBQcm9taXNlPGFueT5bXSk6IFByb21pc2U8YW55PiB7XHJcbiAgICBsZXQgcmVzdWx0cyA9IFtdLFxyXG4gICAgICAgIHJlc3VsdHNDb3VudCA9IDA7XHJcbiAgICByZXN1bHRzLmxlbmd0aCA9IHByb21pc2VzLmxlbmd0aDtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgbGV0IHJlc29sdmVBbGwgPSAoKSA9PiB7XHJcbiAgICAgICAgICAgIHJldHVybiByZXNvbHZlKHJlc3VsdHMpO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgcHJvbWlzZXMubGVuZ3RoID8gcHJvbWlzZXMuZm9yRWFjaCgocHJvbWlzZSwgaW5kZXgpID0+IHtcclxuICAgICAgICAgICAgcHJvbWlzZS50aGVuKChyZXN1bHQpID0+IHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdHNDb3VudCsrO1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0c1tpbmRleF0gPSByZXN1bHQ7XHJcbiAgICAgICAgICAgICAgICByZXN1bHRzQ291bnQgPT09IHByb21pc2VzLmxlbmd0aCAmJiByZXNvbHZlQWxsKCk7XHJcbiAgICAgICAgICAgIH0pLmNhdGNoKChlcnJvcikgPT4ge1xyXG4gICAgICAgICAgICAgICAgcmVqZWN0KHtcclxuICAgICAgICAgICAgICAgICAgICBlcnJvcjogZXJyb3IsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvbWlzZUluZGV4OiBpbmRleFxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pIDogcmVzb2x2ZUFsbCgpO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiByZXNvbHZlZFByb21pc2U8VD4gKHZhbD86IFQpOiBQcm9taXNlPFQ+IHtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZTxUPihyZXNvbHZlID0+IHJlc29sdmUodmFsKSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB0b0FycmF5IChkYXRhKSB7XHJcbiAgICByZXR1cm4gQXJyYXkuaXNBcnJheShkYXRhKSA/IGRhdGEgOiBbZGF0YV07XHJcbn0iLCJleHBvcnQgZGVmYXVsdCBjbGFzcyBXYWl0aW5nIHtcclxuXHJcbiAgICBwcml2YXRlIHdhaXRpbmdDb250YWluZXI6IEhUTUxFbGVtZW50O1xyXG4gICAgcHJpdmF0ZSBib2R5RWw6IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQuYm9keTtcclxuXHJcbiAgICBwdWJsaWMgc3RhcnQoZWw6IEhUTUxFbGVtZW50ID0gdGhpcy5ib2R5RWwsIHpJbmRleD86IG51bWJlcikge1xyXG4gICAgICAgIGlmIChlbC5vZmZzZXRQYXJlbnQgPT09IG51bGwpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLndhaXRpbmdDb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG4gICAgICAgIHRoaXMud2FpdGluZ0NvbnRhaW5lci5jbGFzc05hbWUgPSBcIndhaXRpbmdcIjtcclxuICAgICAgICB0aGlzLndhaXRpbmdDb250YWluZXIuaW5uZXJIVE1MID0gXCI8ZGl2IGNsYXNzPSdmYWRlcic+PC9kaXY+PGRpdiBjbGFzcz0nc3Bpbm5lcic+PC9kaXY+XCI7XHJcbiAgICAgICAgZWwucGFyZW50Tm9kZS5hcHBlbmRDaGlsZCh0aGlzLndhaXRpbmdDb250YWluZXIpO1xyXG5cclxuICAgICAgICB0aGlzLndhaXRpbmdDb250YWluZXIuc3R5bGUucG9zaXRpb24gPSBcImFic29sdXRlXCI7XHJcbiAgICAgICAgdGhpcy53YWl0aW5nQ29udGFpbmVyLnN0eWxlLndpZHRoID0gZWwub2Zmc2V0V2lkdGggKyBcInB4XCI7XHJcbiAgICAgICAgdGhpcy53YWl0aW5nQ29udGFpbmVyLnN0eWxlLmhlaWdodCA9IGVsLm9mZnNldEhlaWdodCArIFwicHhcIjtcclxuICAgICAgICB0aGlzLndhaXRpbmdDb250YWluZXIuc3R5bGUudG9wID0gZWwub2Zmc2V0VG9wICsgXCJweFwiO1xyXG4gICAgICAgIHRoaXMud2FpdGluZ0NvbnRhaW5lci5zdHlsZS5sZWZ0ID0gZWwub2Zmc2V0TGVmdCArIFwicHhcIjtcclxuICAgICAgICB0aGlzLndhaXRpbmdDb250YWluZXIuc3R5bGUuZGlzcGxheSA9IFwiYmxvY2tcIjtcclxuICAgICAgICB0eXBlb2YgekluZGV4ID09PSBcIm51bWJlclwiICYmICh0aGlzLndhaXRpbmdDb250YWluZXIuc3R5bGUuekluZGV4ID0gekluZGV4LnRvU3RyaW5nKCkpO1xyXG4gICAgfTtcclxuXHJcbiAgICBwdWJsaWMgc3RvcCAoKSB7XHJcbiAgICAgICAgaWYgKHRoaXMud2FpdGluZ0NvbnRhaW5lciAmJiB0aGlzLndhaXRpbmdDb250YWluZXIucGFyZW50Tm9kZSkge1xyXG4gICAgICAgICAgICB0aGlzLndhaXRpbmdDb250YWluZXIucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0aGlzLndhaXRpbmdDb250YWluZXIpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbn0iLCIvL2FkZGVkIGJ5IEJyZXR0IHRvIG1hbmFnZSBhZGRpbmcgYWxsIHpvbmVzIHRvIHRoZSBleHBvcnQgYXMgYW4gb3B0aW9uXHJcblxyXG5leHBvcnQgY2xhc3MgWm9uZUJ1aWxkZXIge1xyXG4gICAgcHJpdmF0ZSByZWFkb25seSBhcGk7XHJcbiAgICBwcml2YXRlIGN1cnJlbnRUYXNrO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKGFwaSkge1xyXG4gICAgICAgIHRoaXMuYXBpID0gYXBpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYWJvcnRDdXJyZW50VGFzayAoKSB7XHJcbiAgICAgICAgdGhpcy5jdXJyZW50VGFzayAmJiB0aGlzLmN1cnJlbnRUYXNrLmFib3J0ICYmIHRoaXMuY3VycmVudFRhc2suYWJvcnQoKTtcclxuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrID0gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICAvL2ZpbGxzIHRoZSB1c2VyIGJ1aWxkZXIgd2l0aCBhbGwgdXNlcnNcclxuICAgIGZldGNoICgpOiBQcm9taXNlPGFueT4ge1xyXG4gICAgICAgIHRoaXMuYWJvcnRDdXJyZW50VGFzaygpO1xyXG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgPSB0aGlzLmdldFpvbmVzKClcclxuICAgICAgICByZXR1cm4gdGhpcy5jdXJyZW50VGFzaztcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGdldFpvbmVzICgpOiBQcm9taXNlPGFueT4ge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuYXBpLmNhbGwoXCJHZXRcIiwge1xyXG4gICAgICAgICAgICAgICAgXCJ0eXBlTmFtZVwiOiBcIlpvbmVcIlxyXG4gICAgICAgICAgICB9LCByZXNvbHZlLCByZWplY3QpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHVubG9hZCAoKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5hYm9ydEN1cnJlbnRUYXNrKCk7XHJcbiAgICB9XHJcbn0iXX0=
