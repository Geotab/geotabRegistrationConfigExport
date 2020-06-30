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
            notificationTemplates: [],
            certificates: []
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
                if (entity.issuerCertificate) {
                    entityDependencies.certificates = [entity.issuerCertificate.id];
                }
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
                diagnostics: "Diagnostic",
                certificates: "Certificate"
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
                    zoneDependencies = getDependencies(results[6], "zones");
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
            if (mapProvider) {
                mapBlockDescription.innerHTML = mapMessageTemplate.replace("{mapProvider}", mapProvider);
            }
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
        return !mapProviderId || this.defaultMapProviders[mapProviderId] ? "default" : "custom";
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzb3VyY2VzL2FkZGluLnRzIiwic291cmNlcy9kaXN0cmlidXRpb25MaXN0c0J1aWxkZXIudHMiLCJzb3VyY2VzL2dyb3Vwc0J1aWxkZXIudHMiLCJzb3VyY2VzL21pc2NCdWlsZGVyLnRzIiwic291cmNlcy9yZXBvcnRzQnVpbGRlci50cyIsInNvdXJjZXMvcnVsZXNCdWlsZGVyLnRzIiwic291cmNlcy9zZWN1cml0eUNsZWFyYW5jZXNCdWlsZGVyLnRzIiwic291cmNlcy91dGlscy50cyIsInNvdXJjZXMvd2FpdGluZy50cyIsInNvdXJjZXMvem9uZUJ1aWxkZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztBQ0FBLGlEQUE0QztBQUM1Qyx5RUFBb0U7QUFDcEUsbURBQThDO0FBQzlDLCtDQUEwQztBQUMxQyx1RUFBa0U7QUFDbEUsNkNBQXFEO0FBQ3JELGlDQUFvSjtBQUNwSixxQ0FBZ0M7QUFDaEMsNkNBQTZDO0FBQzdDLDZDQUEwQztBQWdEMUM7SUF1VEksbUJBQW1CO0lBQ25CLGVBQWEsR0FBRztRQUFoQixpQkFZQztRQTFUZ0IsY0FBUyxHQUFnQixRQUFRLENBQUMsY0FBYyxDQUFDLGNBQWMsQ0FBQyxDQUFDO1FBQ2pFLFlBQU8sR0FBZ0IsUUFBUSxDQUFDLGNBQWMsQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUM3RCw0QkFBdUIsR0FBcUIsUUFBUSxDQUFDLGNBQWMsQ0FBQyw0QkFBNEIsQ0FBcUIsQ0FBQztRQUN0SCwyQkFBc0IsR0FBcUIsUUFBUSxDQUFDLGNBQWMsQ0FBQywyQkFBMkIsQ0FBcUIsQ0FBQztRQUNwSCxpQ0FBNEIsR0FBcUIsUUFBUSxDQUFDLGNBQWMsQ0FBQyxpQ0FBaUMsQ0FBcUIsQ0FBQztRQUdoSSxTQUFJLEdBQWdCO1lBQ2pDLE1BQU0sRUFBRSxFQUFFO1lBQ1YsT0FBTyxFQUFFLEVBQUU7WUFDWCxLQUFLLEVBQUUsRUFBRTtZQUNULGlC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QixDQUFDO0lBQ0wsa0JBQUM7QUFBRCxDQS9CQSxBQStCQyxJQUFBO0FBL0JZLGtDQUFXIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiaW1wb3J0IEdyb3Vwc0J1aWxkZXIgZnJvbSBcIi4vZ3JvdXBzQnVpbGRlclwiO1xyXG5pbXBvcnQgU2VjdXJpdHlDbGVhcmFuY2VzQnVpbGRlciBmcm9tIFwiLi9zZWN1cml0eUNsZWFyYW5jZXNCdWlsZGVyXCI7XHJcbmltcG9ydCBSZXBvcnRzQnVpbGRlciBmcm9tIFwiLi9yZXBvcnRzQnVpbGRlclwiO1xyXG5pbXBvcnQgUnVsZXNCdWlsZGVyIGZyb20gXCIuL3J1bGVzQnVpbGRlclwiO1xyXG5pbXBvcnQgRGlzdHJpYnV0aW9uTGlzdHNCdWlsZGVyIGZyb20gXCIuL2Rpc3RyaWJ1dGlvbkxpc3RzQnVpbGRlclwiO1xyXG5pbXBvcnQge0lNaXNjRGF0YSwgTWlzY0J1aWxkZXJ9IGZyb20gXCIuL21pc2NCdWlsZGVyXCI7XHJcbmltcG9ydCB7ZG93bmxvYWREYXRhQXNGaWxlLCBtZXJnZVVuaXF1ZSwgSUVudGl0eSwgbWVyZ2VVbmlxdWVFbnRpdGllcywgZ2V0VW5pcXVlRW50aXRpZXMsIGdldEVudGl0aWVzSWRzLCB0b2dldGhlciwgcmVzb2x2ZWRQcm9taXNlfSBmcm9tIFwiLi91dGlsc1wiO1xyXG5pbXBvcnQgV2FpdGluZyBmcm9tIFwiLi93YWl0aW5nXCI7XHJcbi8vIGltcG9ydCB7VXNlckJ1aWxkZXJ9IGZyb20gXCIuL3VzZXJCdWlsZGVyXCI7XHJcbmltcG9ydCB7Wm9uZUJ1aWxkZXJ9IGZyb20gXCIuL3pvbmVCdWlsZGVyXCI7XHJcblxyXG5pbnRlcmZhY2UgR2VvdGFiIHtcclxuICAgIGFkZGluOiB7XHJcbiAgICAgICAgcmVnaXN0cmF0aW9uQ29uZmlnOiBGdW5jdGlvblxyXG4gICAgfTtcclxufVxyXG5cclxuaW50ZXJmYWNlIElJbXBvcnREYXRhIHtcclxuICAgIGdyb3VwczogYW55W107XHJcbiAgICByZXBvcnRzOiBhbnlbXTtcclxuICAgIHJ1bGVzOiBhbnlbXTtcclxuICAgIGRpc3RyaWJ1dGlvbkxpc3RzOiBhbnlbXTtcclxuICAgIGRldmljZXM6IGFueVtdO1xyXG4gICAgdXNlcnM6IGFueVtdO1xyXG4gICAgem9uZVR5cGVzOiBhbnlbXTtcclxuICAgIHpvbmVzOiBhbnlbXTtcclxuICAgIHdvcmtUaW1lczogYW55W107XHJcbiAgICB3b3JrSG9saWRheXM6IGFueVtdO1xyXG4gICAgc2VjdXJpdHlHcm91cHM6IGFueVtdO1xyXG4gICAgZGlhZ25vc3RpY3M6IGFueVtdO1xyXG4gICAgY3VzdG9tTWFwczogYW55W107XHJcbiAgICBtaXNjOiBJTWlzY0RhdGE7XHJcbiAgICBub3RpZmljYXRpb25UZW1wbGF0ZXM6IGFueVtdO1xyXG4gICAgY2VydGlmaWNhdGVzOiBhbnlbXTtcclxufVxyXG5pbnRlcmZhY2UgSURlcGVuZGVuY2llcyB7XHJcbiAgICBncm91cHM/OiBzdHJpbmdbXTtcclxuICAgIHJlcG9ydHM/OiBzdHJpbmdbXTtcclxuICAgIHJ1bGVzPzogc3RyaW5nW107XHJcbiAgICBkaXN0cmlidXRpb25MaXN0cz86IHN0cmluZ1tdO1xyXG4gICAgZGV2aWNlcz86IHN0cmluZ1tdO1xyXG4gICAgdXNlcnM/OiBzdHJpbmdbXTtcclxuICAgIHpvbmVUeXBlcz86IHN0cmluZ1tdO1xyXG4gICAgem9uZXM/OiBzdHJpbmdbXTtcclxuICAgIHdvcmtUaW1lcz86IHN0cmluZ1tdO1xyXG4gICAgd29ya0hvbGlkYXlzPzogc3RyaW5nW107XHJcbiAgICBzZWN1cml0eUdyb3Vwcz86IHN0cmluZ1tdO1xyXG4gICAgZGlhZ25vc3RpY3M/OiBzdHJpbmdbXTtcclxuICAgIGN1c3RvbU1hcHM/OiBzdHJpbmdbXTtcclxuICAgIG5vdGlmaWNhdGlvblRlbXBsYXRlcz86IHN0cmluZ1tdO1xyXG4gICAgY2VydGlmaWNhdGVzPzogc3RyaW5nW107XHJcbn1cclxuXHJcbnR5cGUgVEVudGl0eVR5cGUgPSBrZXlvZiBJSW1wb3J0RGF0YTtcclxuXHJcbmRlY2xhcmUgY29uc3QgZ2VvdGFiOiBHZW90YWI7XHJcblxyXG5jbGFzcyBBZGRpbiB7XHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IGFwaTtcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgZ3JvdXBzQnVpbGRlcjogR3JvdXBzQnVpbGRlcjtcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgc2VjdXJpdHlDbGVhcmFuY2VzQnVpbGRlcjogU2VjdXJpdHlDbGVhcmFuY2VzQnVpbGRlcjtcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgcmVwb3J0c0J1aWxkZXI6IFJlcG9ydHNCdWlsZGVyO1xyXG4gICAgcHJpdmF0ZSByZWFkb25seSBydWxlc0J1aWxkZXI6IFJ1bGVzQnVpbGRlcjtcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgZGlzdHJpYnV0aW9uTGlzdHNCdWlsZGVyOiBEaXN0cmlidXRpb25MaXN0c0J1aWxkZXI7XHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IG1pc2NCdWlsZGVyOiBNaXNjQnVpbGRlcjtcclxuICAgIC8vIHByaXZhdGUgcmVhZG9ubHkgdXNlckJ1aWxkZXI6IFVzZXJCdWlsZGVyO1xyXG4gICAgcHJpdmF0ZSByZWFkb25seSB6b25lQnVpbGRlcjogWm9uZUJ1aWxkZXI7XHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IGV4cG9ydEJ0bjogSFRNTEVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImV4cG9ydEJ1dHRvblwiKTtcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgc2F2ZUJ0bjogSFRNTEVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNhdmVCdXR0b25cIik7XHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IGV4cG9ydEFsbEFkZGluc0NoZWNrYm94OiBIVE1MSW5wdXRFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJleHBvcnRfYWxsX2FkZGluc19jaGVja2JveFwiKSBhcyBIVE1MSW5wdXRFbGVtZW50O1xyXG4gICAgcHJpdmF0ZSByZWFkb25seSBleHBvcnRBbGxab25lc0NoZWNrYm94OiBIVE1MSW5wdXRFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJleHBvcnRfYWxsX3pvbmVzX2NoZWNrYm94XCIpIGFzIEhUTUxJbnB1dEVsZW1lbnQ7XHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IGV4cG9ydFN5c3RlbVNldHRpbmdzQ2hlY2tib3g6IEhUTUxJbnB1dEVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImV4cG9ydF9zeXN0ZW1fc2V0dGluZ3NfY2hlY2tib3hcIikgYXMgSFRNTElucHV0RWxlbWVudDtcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgd2FpdGluZzogV2FpdGluZztcclxuICAgIHByaXZhdGUgY3VycmVudFRhc2s7XHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IGRhdGE6IElJbXBvcnREYXRhID0ge1xyXG4gICAgICAgIGdyb3VwczogW10sXHJcbiAgICAgICAgcmVwb3J0czogW10sXHJcbiAgICAgICAgcnVsZXM6IFtdLFxyXG4gICAgICAgIGRpc3RyaWJ1dGlvbkxpc3RzOiBbXSxcclxuICAgICAgICBkZXZpY2VzOiBbXSxcclxuICAgICAgICB1c2VyczogW10sXHJcbiAgICAgICAgem9uZVR5cGVzOiBbXSxcclxuICAgICAgICB6b25lczogW10sXHJcbiAgICAgICAgd29ya1RpbWVzOiBbXSxcclxuICAgICAgICB3b3JrSG9saWRheXM6IFtdLFxyXG4gICAgICAgIHNlY3VyaXR5R3JvdXBzOiBbXSxcclxuICAgICAgICBjdXN0b21NYXBzOiBbXSxcclxuICAgICAgICBkaWFnbm9zdGljczogW10sXHJcbiAgICAgICAgbWlzYzogbnVsbCxcclxuICAgICAgICBub3RpZmljYXRpb25UZW1wbGF0ZXM6IFtdLFxyXG4gICAgICAgIGNlcnRpZmljYXRlczogW11cclxuICAgIH07XHJcblxyXG4gICAgcHJpdmF0ZSBjb21iaW5lRGVwZW5kZW5jaWVzICguLi5hbGxEZXBlbmRlbmNpZXM6IElEZXBlbmRlbmNpZXNbXSk6IElEZXBlbmRlbmNpZXMge1xyXG4gICAgICAgIGxldCB0b3RhbCA9IHtcclxuICAgICAgICAgICAgZ3JvdXBzOiBbXSxcclxuICAgICAgICAgICAgcmVwb3J0czogW10sXHJcbiAgICAgICAgICAgIHJ1bGVzOiBbXSxcclxuICAgICAgICAgICAgZGV2aWNlczogW10sXHJcbiAgICAgICAgICAgIHVzZXJzOiBbXSxcclxuICAgICAgICAgICAgem9uZVR5cGVzOiBbXSxcclxuICAgICAgICAgICAgem9uZXM6IFtdLFxyXG4gICAgICAgICAgICB3b3JrVGltZXM6IFtdLFxyXG4gICAgICAgICAgICB3b3JrSG9saWRheXM6IFtdLFxyXG4gICAgICAgICAgICBzZWN1cml0eUdyb3VwczogW10sXHJcbiAgICAgICAgICAgIGRpYWdub3N0aWNzOiBbXSxcclxuICAgICAgICAgICAgY3VzdG9tTWFwczogW10sXHJcbiAgICAgICAgICAgIG5vdGlmaWNhdGlvblRlbXBsYXRlczogW11cclxuICAgICAgICB9O1xyXG4gICAgICAgIHJldHVybiBPYmplY3Qua2V5cyh0b3RhbCkucmVkdWNlKChkZXBlbmRlbmNpZXMsIGRlcGVuZGVuY3lOYW1lOiBzdHJpbmcpID0+IHtcclxuICAgICAgICAgICAgZGVwZW5kZW5jaWVzW2RlcGVuZGVuY3lOYW1lXSA9IG1lcmdlVW5pcXVlKGRlcGVuZGVuY2llc1tkZXBlbmRlbmN5TmFtZV0sIC4uLmFsbERlcGVuZGVuY2llcy5tYXAoKGVudGl0eURlcGVuZGVuY2llcykgPT4gZW50aXR5RGVwZW5kZW5jaWVzW2RlcGVuZGVuY3lOYW1lXSkpO1xyXG4gICAgICAgICAgICByZXR1cm4gZGVwZW5kZW5jaWVzO1xyXG4gICAgICAgIH0sIHRvdGFsKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFkZE5ld0dyb3VwcyAoZ3JvdXBzOiBzdHJpbmdbXSwgZGF0YTogSUltcG9ydERhdGEpOiBQcm9taXNlPGFueT4ge1xyXG4gICAgICAgIGlmICghZ3JvdXBzIHx8ICFncm91cHMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiByZXNvbHZlZFByb21pc2UoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgbGV0IGdyb3Vwc0RhdGEgPSB0aGlzLmdyb3Vwc0J1aWxkZXIuZ2V0R3JvdXBzRGF0YShncm91cHMsIHRydWUpLFxyXG4gICAgICAgICAgICBuZXdHcm91cHNVc2VycyA9IGdldFVuaXF1ZUVudGl0aWVzKHRoaXMuZ3JvdXBzQnVpbGRlci5nZXRQcml2YXRlR3JvdXBzVXNlcnMoZ3JvdXBzRGF0YSksIGRhdGEudXNlcnMpO1xyXG4gICAgICAgIGRhdGEuZ3JvdXBzID0gbWVyZ2VVbmlxdWVFbnRpdGllcyhkYXRhLmdyb3VwcywgZ3JvdXBzRGF0YSk7XHJcbiAgICAgICAgZGF0YS51c2VycyA9IG1lcmdlVW5pcXVlRW50aXRpZXMoZGF0YS51c2VycywgbmV3R3JvdXBzVXNlcnMpO1xyXG4gICAgICAgIHJldHVybiB0aGlzLnJlc29sdmVEZXBlbmRlbmNpZXMoe3VzZXJzOiBnZXRFbnRpdGllc0lkcyhuZXdHcm91cHNVc2Vycyl9LCBkYXRhKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFkZE5ld0N1c3RvbU1hcHMgKGN1c3RvbU1hcHNJZHM6IHN0cmluZ1tdLCBkYXRhOiBJSW1wb3J0RGF0YSkge1xyXG4gICAgICAgIGlmICghY3VzdG9tTWFwc0lkcyB8fCAhY3VzdG9tTWFwc0lkcy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBsZXQgY3VzdG9tTWFwc0RhdGEgPSBjdXN0b21NYXBzSWRzLnJlZHVjZSgoZGF0YSwgY3VzdG9tTWFwSWQ6IHN0cmluZykgPT4ge1xyXG4gICAgICAgICAgICBsZXQgY3VzdG9tTWFwRGF0YSA9IHRoaXMubWlzY0J1aWxkZXIuZ2V0TWFwUHJvdmlkZXJEYXRhKGN1c3RvbU1hcElkKTtcclxuICAgICAgICAgICAgY3VzdG9tTWFwRGF0YSAmJiBkYXRhLnB1c2goY3VzdG9tTWFwRGF0YSk7XHJcbiAgICAgICAgICAgIHJldHVybiBkYXRhO1xyXG4gICAgICAgIH0sIFtdKTtcclxuICAgICAgICBkYXRhLmN1c3RvbU1hcHMgPSBtZXJnZVVuaXF1ZUVudGl0aWVzKGRhdGEuY3VzdG9tTWFwcywgY3VzdG9tTWFwc0RhdGEpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYWRkTmV3Tm90aWZpY2F0aW9uVGVtcGxhdGVzIChub3RpZmljYXRpb25UZW1wbGF0ZXNJZHM6IHN0cmluZ1tdLCBkYXRhOiBJSW1wb3J0RGF0YSkge1xyXG4gICAgICAgIGlmICghbm90aWZpY2F0aW9uVGVtcGxhdGVzSWRzIHx8ICFub3RpZmljYXRpb25UZW1wbGF0ZXNJZHMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgbGV0IG5vdGlmaWNhdGlvblRlbXBsYXRlc0RhdGEgPSBub3RpZmljYXRpb25UZW1wbGF0ZXNJZHMucmVkdWNlKChkYXRhLCB0ZW1wbGF0ZUlkOiBzdHJpbmcpID0+IHtcclxuICAgICAgICAgICAgbGV0IHRlbXBsYXRlRGF0YSA9IHRoaXMuZGlzdHJpYnV0aW9uTGlzdHNCdWlsZGVyLmdldE5vdGlmaWNhdGlvblRlbXBsYXRlRGF0YSh0ZW1wbGF0ZUlkKTtcclxuICAgICAgICAgICAgdGVtcGxhdGVEYXRhICYmIGRhdGEucHVzaCh0ZW1wbGF0ZURhdGEpO1xyXG4gICAgICAgICAgICByZXR1cm4gZGF0YTtcclxuICAgICAgICB9LCBbXSk7XHJcbiAgICAgICAgZGF0YS5ub3RpZmljYXRpb25UZW1wbGF0ZXMgPSBtZXJnZVVuaXF1ZUVudGl0aWVzKGRhdGEubm90aWZpY2F0aW9uVGVtcGxhdGVzLCBub3RpZmljYXRpb25UZW1wbGF0ZXNEYXRhKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGdldEVudHl0aWVzSWRzIChlbnRpdGllczogSUVudGl0eVtdKTogc3RyaW5nW10ge1xyXG4gICAgICAgIHJldHVybiBlbnRpdGllcy5yZWR1Y2UoKHJlcywgZW50aXR5KSA9PiB7XHJcbiAgICAgICAgICAgIGVudGl0eSAmJiBlbnRpdHkuaWQgJiYgcmVzLnB1c2goZW50aXR5LmlkKTtcclxuICAgICAgICAgICAgcmV0dXJuIHJlcztcclxuICAgICAgICB9LCBbXSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBnZXRFbnRpdHlEZXBlbmRlbmNpZXMgKGVudGl0eTogSUVudGl0eSwgZW50aXR5VHlwZTogVEVudGl0eVR5cGUpIHtcclxuICAgICAgICBsZXQgZW50aXR5RGVwZW5kZW5jaWVzOiBJRGVwZW5kZW5jaWVzID0ge307XHJcbiAgICAgICAgc3dpdGNoIChlbnRpdHlUeXBlKSB7XHJcbiAgICAgICAgICAgIGNhc2UgXCJkZXZpY2VzXCI6XHJcbiAgICAgICAgICAgICAgICBlbnRpdHlEZXBlbmRlbmNpZXMuZ3JvdXBzID0gdGhpcy5nZXRFbnR5dGllc0lkcyhlbnRpdHlbXCJncm91cHNcIl0uY29uY2F0KGVudGl0eVtcImF1dG9Hcm91cHNcIl0pKTtcclxuICAgICAgICAgICAgICAgIGVudGl0eVtcIndvcmtUaW1lXCJdLmlkICYmIChlbnRpdHlEZXBlbmRlbmNpZXMud29ya1RpbWVzID0gW2VudGl0eVtcIndvcmtUaW1lXCJdLmlkXSk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBcInVzZXJzXCI6XHJcbiAgICAgICAgICAgICAgICBlbnRpdHlEZXBlbmRlbmNpZXMuZ3JvdXBzID0gdGhpcy5nZXRFbnR5dGllc0lkcyhlbnRpdHlbXCJjb21wYW55R3JvdXBzXCJdLmNvbmNhdChlbnRpdHlbXCJkcml2ZXJHcm91cHNcIl0pLmNvbmNhdChlbnRpdHlbXCJwcml2YXRlVXNlckdyb3Vwc1wiXSkuY29uY2F0KGVudGl0eVtcInJlcG9ydEdyb3Vwc1wiXSkpO1xyXG4gICAgICAgICAgICAgICAgZW50aXR5RGVwZW5kZW5jaWVzLnNlY3VyaXR5R3JvdXBzID0gdGhpcy5nZXRFbnR5dGllc0lkcyhlbnRpdHlbXCJzZWN1cml0eUdyb3Vwc1wiXSk7XHJcbiAgICAgICAgICAgICAgICBlbnRpdHlEZXBlbmRlbmNpZXMuY3VzdG9tTWFwcyA9IFtlbnRpdHlbXCJkZWZhdWx0TWFwRW5naW5lXCJdXTtcclxuICAgICAgICAgICAgICAgIGlmIChlbnRpdHkuaXNzdWVyQ2VydGlmaWNhdGUpIHtcclxuICAgICAgICAgICAgICAgICAgICBlbnRpdHlEZXBlbmRlbmNpZXMuY2VydGlmaWNhdGVzID0gWyBlbnRpdHkuaXNzdWVyQ2VydGlmaWNhdGUuaWQgXVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgXCJ6b25lc1wiOlxyXG4gICAgICAgICAgICAgICAgbGV0IHpvbmVUeXBlcyA9IHRoaXMuZ2V0RW50eXRpZXNJZHMoZW50aXR5W1wiem9uZVR5cGVzXCJdKTtcclxuICAgICAgICAgICAgICAgIHpvbmVUeXBlcy5sZW5ndGggJiYgKGVudGl0eURlcGVuZGVuY2llcy56b25lVHlwZXMgPSB6b25lVHlwZXMpO1xyXG4gICAgICAgICAgICAgICAgZW50aXR5RGVwZW5kZW5jaWVzLmdyb3VwcyA9IHRoaXMuZ2V0RW50eXRpZXNJZHMoZW50aXR5W1wiZ3JvdXBzXCJdKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFwid29ya1RpbWVzXCI6XHJcbiAgICAgICAgICAgICAgICBlbnRpdHlbXCJob2xpZGF5R3JvdXBcIl0uZ3JvdXBJZCAmJiAoZW50aXR5RGVwZW5kZW5jaWVzLndvcmtIb2xpZGF5cyA9IFtlbnRpdHlbXCJob2xpZGF5R3JvdXBcIl0uZ3JvdXBJZF0pO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGVudGl0eURlcGVuZGVuY2llcztcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFwcGx5VG9FbnRpdGllcyAoZW50aXRpZXNMaXN0OiBJRGVwZW5kZW5jaWVzLCBpbml0aWFsVmFsdWUsIGZ1bmM6IChyZXN1bHQsIGVudGl0eSwgZW50aXR5VHlwZTogVEVudGl0eVR5cGUsIGVudGl0eUluZGV4OiBudW1iZXIsIGVudGl0eVR5cGVJbmRleDogbnVtYmVyLCBvdmVyYWxsSW5kZXg6IG51bWJlcikgPT4gYW55KSB7XHJcbiAgICAgICAgbGV0IG92ZXJhbGxJbmRleCA9IDA7XHJcbiAgICAgICAgcmV0dXJuIE9iamVjdC5rZXlzKGVudGl0aWVzTGlzdCkucmVkdWNlKChyZXN1bHQsIGVudGl0eVR5cGU6IFRFbnRpdHlUeXBlLCB0eXBlSW5kZXgpID0+IHtcclxuICAgICAgICAgICAgcmV0dXJuIGVudGl0aWVzTGlzdFtlbnRpdHlUeXBlXS5yZWR1Y2UoKHJlcywgZW50aXR5LCBpbmRleCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgb3ZlcmFsbEluZGV4Kys7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZnVuYyhyZXMsIGVudGl0eSwgZW50aXR5VHlwZSwgaW5kZXgsIHR5cGVJbmRleCwgb3ZlcmFsbEluZGV4IC0gMSk7XHJcbiAgICAgICAgICAgIH0sIHJlc3VsdCk7XHJcbiAgICAgICAgfSwgaW5pdGlhbFZhbHVlKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHJlc29sdmVEZXBlbmRlbmNpZXMgKGRlcGVuZGVuY2llczogSURlcGVuZGVuY2llcywgZGF0YTogSUltcG9ydERhdGEpIHtcclxuICAgICAgICBsZXQgZ2V0RGF0YSA9IChlbnRpdGllc0xpc3Q6IElEZXBlbmRlbmNpZXMpOiBQcm9taXNlPElJbXBvcnREYXRhPiA9PiB7XHJcbiAgICAgICAgICAgICAgICBsZXQgZW50aXR5UmVxdWVzdFR5cGVzID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkZXZpY2VzOiBcIkRldmljZVwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB1c2VyczogXCJVc2VyXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHpvbmVUeXBlczogXCJab25lVHlwZVwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB6b25lczogXCJab25lXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHdvcmtUaW1lczogXCJXb3JrVGltZVwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB3b3JrSG9saWRheXM6IFwiV29ya0hvbGlkYXlcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VjdXJpdHlHcm91cHM6IFwiR3JvdXBcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGlhZ25vc3RpY3M6IFwiRGlhZ25vc3RpY1wiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjZXJ0aWZpY2F0ZXM6IFwiQ2VydGlmaWNhdGVcIlxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWVzdHM6IGFueSA9IHRoaXMuYXBwbHlUb0VudGl0aWVzKGVudGl0aWVzTGlzdCwge30sIChyZXN1bHQsIGVudGl0eUlkLCBlbnRpdHlUeXBlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCByZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZU5hbWU6IGVudGl0eVJlcXVlc3RUeXBlc1tlbnRpdHlUeXBlXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlYXJjaDoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkOiBlbnRpdHlJZFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZW50aXR5UmVxdWVzdFR5cGVzW2VudGl0eVR5cGVdKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZW50aXR5VHlwZSA9PT0gXCJ3b3JrSG9saWRheXNcIiB8fCBlbnRpdHlUeXBlID09PSBcInNlY3VyaXR5R3JvdXBzXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIXJlc3VsdFtlbnRpdHlUeXBlXSAmJiAocmVzdWx0W2VudGl0eVR5cGVdID0gW10pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0W2VudGl0eVR5cGVdLnB1c2goW1wiR2V0XCIsIHJlcXVlc3RdKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChlbnRpdGllc0xpc3Quc2VjdXJpdHlHcm91cHMgJiYgZW50aXRpZXNMaXN0LnNlY3VyaXR5R3JvdXBzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVlc3RzLnNlY3VyaXR5R3JvdXBzID0gW1tcIkdldFwiLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGVOYW1lOiBlbnRpdHlSZXF1ZXN0VHlwZXMuc2VjdXJpdHlHcm91cHMsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlYXJjaDoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IFwiR3JvdXBTZWN1cml0eUlkXCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1dXTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChlbnRpdGllc0xpc3Qud29ya0hvbGlkYXlzICYmIGVudGl0aWVzTGlzdC53b3JrSG9saWRheXMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWVzdHMud29ya0hvbGlkYXlzID0gW1tcIkdldFwiLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGVOYW1lOiBlbnRpdHlSZXF1ZXN0VHlwZXMud29ya0hvbGlkYXlzXHJcbiAgICAgICAgICAgICAgICAgICAgfV1dO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmFkZE5ld0dyb3VwcyhlbnRpdGllc0xpc3QuZ3JvdXBzLCBkYXRhKS50aGVuKCgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZE5ld0N1c3RvbU1hcHMoZW50aXRpZXNMaXN0LmN1c3RvbU1hcHMsIGRhdGEpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkTmV3Tm90aWZpY2F0aW9uVGVtcGxhdGVzKGVudGl0aWVzTGlzdC5ub3RpZmljYXRpb25UZW1wbGF0ZXMsIGRhdGEpO1xyXG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBlbnRpdGllc0xpc3QuZ3JvdXBzO1xyXG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBlbnRpdGllc0xpc3QuY3VzdG9tTWFwcztcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFByb21pc2U8SUltcG9ydERhdGE+KChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHJlcXVlc3RFbnRpdGllcyA9IE9iamVjdC5rZXlzKHJlcXVlc3RzKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcXVlc3RzQXJyYXkgPSByZXF1ZXN0RW50aXRpZXMucmVkdWNlKChsaXN0LCB0eXBlKSA9PiBsaXN0LmNvbmNhdChyZXF1ZXN0c1t0eXBlXSksIFtdKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFyZXF1ZXN0RW50aXRpZXMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZShkYXRhKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFwaS5tdWx0aUNhbGwocmVxdWVzdHNBcnJheSwgKHJlc3BvbnNlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IG5ld0dyb3VwcyA9IFtdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdDdXN0b21NYXBzID0gW10sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld0RlcGVuZGVuY2llczogSURlcGVuZGVuY2llcyA9IHt9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBleHBvcnRlZERhdGE6IGFueSA9IHRoaXMuYXBwbHlUb0VudGl0aWVzKHJlcXVlc3RzLCB7fSwgKHJlc3VsdCwgcmVxdWVzdCwgZW50aXR5VHlwZSwgZW50aXR5SW5kZXgsIGVudGl0eVR5cGVJbmRleCwgb3ZlcmFsbEluZGV4KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgaXRlbXMgPSByZXF1ZXN0c0FycmF5Lmxlbmd0aCA+IDEgPyByZXNwb25zZVtvdmVyYWxsSW5kZXhdIDogcmVzcG9uc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtcy5mb3JFYWNoKChpdGVtKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbSA9IGl0ZW1bMF0gfHwgaXRlbTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAhcmVzdWx0W2VudGl0eVR5cGVdICYmIChyZXN1bHRbZW50aXR5VHlwZV0gPSBbXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVudGl0eVR5cGUgPT09IFwid29ya0hvbGlkYXlzXCIgJiYgKCFpdGVtLmhvbGlkYXlHcm91cCB8fCBlbnRpdGllc0xpc3Qud29ya0hvbGlkYXlzLmluZGV4T2YoaXRlbS5ob2xpZGF5R3JvdXAuZ3JvdXBJZCkgPT09IC0xKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChlbnRpdHlUeXBlID09PSBcInNlY3VyaXR5R3JvdXBzXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVudGl0aWVzTGlzdC5zZWN1cml0eUdyb3Vwcy5pbmRleE9mKGl0ZW0uaWQpID4gLTEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdFtlbnRpdHlUeXBlXSA9IHJlc3VsdFtlbnRpdHlUeXBlXS5jb25jYXQodGhpcy5ncm91cHNCdWlsZGVyLmdldEN1c3RvbUdyb3Vwc0RhdGEoZW50aXRpZXNMaXN0LnNlY3VyaXR5R3JvdXBzLCBpdGVtcykpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChlbnRpdHlUeXBlID09PSBcInVzZXJzXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS51c2VyQXV0aGVudGljYXRpb25UeXBlID0gXCJCYXNpY0F1dGhlbnRpY2F0aW9uXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBlbnRpdHlEZXBlbmRlbmNpZXMgPSB0aGlzLmdldEVudGl0eURlcGVuZGVuY2llcyhpdGVtLCBlbnRpdHlUeXBlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdEZXBlbmRlbmNpZXMgPSB0aGlzLmFwcGx5VG9FbnRpdGllcyhlbnRpdHlEZXBlbmRlbmNpZXMsIG5ld0RlcGVuZGVuY2llcywgKHJlc3VsdCwgZW50aXR5SWQsIGVudGl0eVR5cGUpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIXJlc3VsdFtlbnRpdHlUeXBlXSAmJiAocmVzdWx0W2VudGl0eVR5cGVdID0gW10pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHRbZW50aXR5VHlwZV0gPSBtZXJnZVVuaXF1ZShyZXN1bHRbZW50aXR5VHlwZV0sIFtlbnRpdHlJZF0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld0dyb3VwcyA9IG5ld0dyb3Vwcy5jb25jYXQobmV3RGVwZW5kZW5jaWVzLmdyb3VwcyB8fCBbXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3Q3VzdG9tTWFwcyA9IG5ld0N1c3RvbU1hcHMuY29uY2F0KG5ld0RlcGVuZGVuY2llcy5jdXN0b21NYXBzIHx8IFtdKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgbmV3RGVwZW5kZW5jaWVzLmdyb3VwcztcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgbmV3RGVwZW5kZW5jaWVzLmN1c3RvbU1hcHM7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0W2VudGl0eVR5cGVdLnB1c2goaXRlbSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld0RlcGVuZGVuY2llcyA9IE9iamVjdC5rZXlzKG5ld0RlcGVuZGVuY2llcykucmVkdWNlKChyZXN1bHQsIGRlcGVuZGVuY3lOYW1lKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBlbnRpdGllcyA9IG5ld0RlcGVuZGVuY2llc1tkZXBlbmRlbmN5TmFtZV0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBleHBvcnRlZCA9IChleHBvcnRlZERhdGFbZGVwZW5kZW5jeU5hbWVdIHx8IFtdKS5tYXAoZW50aXR5ID0+IGVudGl0eS5pZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVudGl0aWVzLmZvckVhY2goZW50aXR5SWQgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGV4cG9ydGVkLmluZGV4T2YoZW50aXR5SWQpID09PSAtMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICFyZXN1bHRbZGVwZW5kZW5jeU5hbWVdICYmIChyZXN1bHRbZGVwZW5kZW5jeU5hbWVdID0gW10pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdFtkZXBlbmRlbmN5TmFtZV0ucHVzaChlbnRpdHlJZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sIHt9IGFzIElJbXBvcnREYXRhKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBSZW1vdmUgYnVpbHQtaW4gc2VjdXJpdHkgZ3JvdXBzXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXhwb3J0ZWREYXRhLnNlY3VyaXR5R3JvdXBzICYmIChleHBvcnRlZERhdGEuc2VjdXJpdHlHcm91cHMgPSBleHBvcnRlZERhdGEuc2VjdXJpdHlHcm91cHMucmVkdWNlKChyZXN1bHQsIGdyb3VwKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdyb3VwLmlkLmluZGV4T2YoXCJHcm91cFwiKSA9PT0gLTEgJiYgcmVzdWx0LnB1c2goZ3JvdXApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sIFtdKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGROZXdHcm91cHMobmV3R3JvdXBzLCBkYXRhKS50aGVuKCgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGROZXdDdXN0b21NYXBzKG5ld0N1c3RvbU1hcHMsIGRhdGEpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBPYmplY3Qua2V5cyhleHBvcnRlZERhdGEpLmZvckVhY2goKGVudGl0eVR5cGU6IHN0cmluZykgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YVtlbnRpdHlUeXBlXSA9IG1lcmdlVW5pcXVlRW50aXRpZXMoZGF0YVtlbnRpdHlUeXBlXSwgZXhwb3J0ZWREYXRhW2VudGl0eVR5cGVdKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChPYmplY3Qua2V5cyhuZXdEZXBlbmRlbmNpZXMpLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh0aGlzLnJlc29sdmVEZXBlbmRlbmNpZXMobmV3RGVwZW5kZW5jaWVzLCBkYXRhKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGRhdGEpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwgcmVqZWN0KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sIHJlamVjdCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2U8SUltcG9ydERhdGE+KChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICAgICAgcmV0dXJuIGdldERhdGEoZGVwZW5kZW5jaWVzKS50aGVuKHJlc29sdmUpLmNhdGNoKHJlamVjdCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhYm9ydEN1cnJlbnRUYXNrICgpIHtcclxuICAgICAgICB0aGlzLnRvZ2dsZVdhaXRpbmcoKTtcclxuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrICYmIHRoaXMuY3VycmVudFRhc2suYWJvcnQgJiYgdGhpcy5jdXJyZW50VGFzay5hYm9ydCgpO1xyXG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgPSBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgdG9nZ2xlRXhwb3J0QnV0dG9uIChpc0Rpc2FibGVkOiBib29sZWFuKSB7XHJcbiAgICAgICAgKDxIVE1MSW5wdXRFbGVtZW50PnRoaXMuZXhwb3J0QnRuKS5kaXNhYmxlZCA9IGlzRGlzYWJsZWQ7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSByZWFkb25seSB0b2dnbGVXYWl0aW5nID0gKGlzU3RhcnQgPSBmYWxzZSkgPT4ge1xyXG4gICAgICAgIGlmIChpc1N0YXJ0KSB7XHJcbiAgICAgICAgICAgIHRoaXMudG9nZ2xlRXhwb3J0QnV0dG9uKHRydWUpO1xyXG4gICAgICAgICAgICB0aGlzLndhaXRpbmcuc3RhcnQoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJhZGRpbkNvbnRhaW5lclwiKS5wYXJlbnRFbGVtZW50LCA5OTk5KTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLnRvZ2dsZUV4cG9ydEJ1dHRvbihmYWxzZSk7XHJcbiAgICAgICAgICAgIHRoaXMud2FpdGluZy5zdG9wKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vQnJldHQgLSBkaXNwbGF5cyB0aGUgb3V0cHV0IG9uIHRoZSBwYWdlXHJcbiAgICBwcml2YXRlIHNob3dFbnRpdHlNZXNzYWdlIChibG9jazogSFRNTEVsZW1lbnQsIHF0eTogbnVtYmVyLCBlbnRpdHlOYW1lOiBzdHJpbmcpIHtcclxuICAgICAgICBsZXQgYmxvY2tFbCA9IGJsb2NrLnF1ZXJ5U2VsZWN0b3IoXCIuZGVzY3JpcHRpb25cIik7XHJcbiAgICAgICAgaWYgKHF0eSkge1xyXG4gICAgICAgICAgICBxdHkgPiAxICYmIChlbnRpdHlOYW1lICs9IFwic1wiKTtcclxuICAgICAgICAgICAgbGV0IGhhc0l0ZW1zTWVzc2FnZVRlbXBsYXRlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJoYXNJdGVtc01lc3NhZ2VUZW1wbGF0ZVwiKS5pbm5lckhUTUw7XHJcbiAgICAgICAgICAgIGJsb2NrRWwuaW5uZXJIVE1MID0gaGFzSXRlbXNNZXNzYWdlVGVtcGxhdGUucmVwbGFjZShcIntxdWFudGl0eX1cIiwgcXR5LnRvU3RyaW5nKCkpLnJlcGxhY2UoXCJ7ZW50aXR5fVwiLCBlbnRpdHlOYW1lKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBibG9ja0VsLmlubmVySFRNTCA9IGBZb3UgaGF2ZSA8c3BhbiBjbGFzcz1cImJvbGRcIj5ub3QgY29uZmlndXJlZCBhbnkgJHsgZW50aXR5TmFtZSB9czwvc3Bhbj4uYDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBzaG93U3lzdGVtU2V0dGluZ3NNZXNzYWdlIChibG9jazogSFRNTEVsZW1lbnQsIGlzSW5jbHVkZWQ6IGJvb2xlYW4pIHtcclxuICAgICAgICBsZXQgYmxvY2tFbCA9IGJsb2NrLnF1ZXJ5U2VsZWN0b3IoXCIuZGVzY3JpcHRpb25cIik7XHJcbiAgICAgICAgaWYgKGlzSW5jbHVkZWQpIHtcclxuICAgICAgICAgICAgYmxvY2tFbC5pbm5lckhUTUwgPSBcIllvdSBoYXZlIGNob3NlbiA8c3BhbiBjbGFzcz0nYm9sZCc+dG8gaW5jbHVkZTwvc3Bhbj4gc3lzdGVtIHNldHRpbmdzLlwiO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGJsb2NrRWwuaW5uZXJIVE1MID0gXCJZb3UgaGF2ZSBjaG9zZW4gPHNwYW4gY2xhc3M9J2JvbGQnPm5vdCB0byBpbmNsdWRlPC9zcGFuPiBzeXN0ZW0gc2V0dGluZ3MuXCI7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgc2V0QWRkaW5zVG9OdWxsKCkge1xyXG4gICAgICAgIGlmICgodGhpcy5kYXRhLm1pc2MgIT0gbnVsbCkgfHwgKHRoaXMuZGF0YS5taXNjICE9IHVuZGVmaW5lZCkpIHtcclxuICAgICAgICAgICAgdGhpcy5kYXRhLm1pc2MuYWRkaW5zID0gW107XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vaW5pdGlhbGl6ZSBhZGRpbiBcclxuICAgIGNvbnN0cnVjdG9yIChhcGkpIHtcclxuICAgICAgICB0aGlzLmFwaSA9IGFwaTtcclxuICAgICAgICB0aGlzLmdyb3Vwc0J1aWxkZXIgPSBuZXcgR3JvdXBzQnVpbGRlcihhcGkpO1xyXG4gICAgICAgIHRoaXMuc2VjdXJpdHlDbGVhcmFuY2VzQnVpbGRlciA9IG5ldyBTZWN1cml0eUNsZWFyYW5jZXNCdWlsZGVyKGFwaSk7XHJcbiAgICAgICAgdGhpcy5yZXBvcnRzQnVpbGRlciA9IG5ldyBSZXBvcnRzQnVpbGRlcihhcGkpO1xyXG4gICAgICAgIHRoaXMucnVsZXNCdWlsZGVyID0gbmV3IFJ1bGVzQnVpbGRlcihhcGkpO1xyXG4gICAgICAgIHRoaXMuZGlzdHJpYnV0aW9uTGlzdHNCdWlsZGVyID0gbmV3IERpc3RyaWJ1dGlvbkxpc3RzQnVpbGRlcihhcGkpO1xyXG4gICAgICAgIHRoaXMubWlzY0J1aWxkZXIgPSBuZXcgTWlzY0J1aWxkZXIoYXBpKTtcclxuICAgICAgICAvL1RPRE86IEJyZXR0IC0gbGVmdCBoZXJlIGFzIEkgd2lsbCBiZSBpbnRyb2R1Y2luZyB0aGUgdXNlciBmZXRjaCBzb29uXHJcbiAgICAgICAgLy8gdGhpcy51c2VyQnVpbGRlciA9IG5ldyBVc2VyQnVpbGRlcihhcGkpO1xyXG4gICAgICAgIHRoaXMuem9uZUJ1aWxkZXIgPSBuZXcgWm9uZUJ1aWxkZXIoYXBpKTtcclxuICAgICAgICB0aGlzLndhaXRpbmcgPSBuZXcgV2FpdGluZygpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vQnJldHQ6IGV4cG9ydHMgdGhlIGRhdGFcclxuICAgIGV4cG9ydERhdGEgPSAoKSA9PiB7XHJcbiAgICAgICAgdGhpcy50b2dnbGVXYWl0aW5nKHRydWUpO1xyXG4gICAgICAgIHJldHVybiB0aGlzLnJlcG9ydHNCdWlsZGVyLmdldERhdGEoKS50aGVuKChyZXBvcnRzRGF0YSkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLmRhdGEucmVwb3J0cyA9IHJlcG9ydHNEYXRhO1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyh0aGlzLmRhdGEpO1xyXG4gICAgICAgICAgICBkb3dubG9hZERhdGFBc0ZpbGUoSlNPTi5zdHJpbmdpZnkodGhpcy5kYXRhKSwgXCJleHBvcnQuanNvblwiKTtcclxuICAgICAgICB9KS5jYXRjaCgoZSkgPT4ge1xyXG4gICAgICAgICAgICBhbGVydChcIkNhbid0IGV4cG9ydCBkYXRhLlxcblBsZWFzZSB0cnkgYWdhaW4gbGF0ZXIuXCIpO1xyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGUpO1xyXG4gICAgICAgIH0pLmZpbmFsbHkoKCkgPT4gdGhpcy50b2dnbGVXYWl0aW5nKCkpO1xyXG4gICAgfVxyXG5cclxuICAgIHNhdmVDaGFuZ2VzID0gKCkgPT4ge1xyXG4gICAgICAgIHRoaXMucmVuZGVyKCk7XHJcbiAgICAgICAgKDxIVE1MSW5wdXRFbGVtZW50PnRoaXMuZXhwb3J0QnRuKS5kaXNhYmxlZCA9IGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIGNoZWNrQm94VmFsdWVDaGFuZ2VkID0gKCkgPT4ge1xyXG4gICAgICAgICg8SFRNTElucHV0RWxlbWVudD50aGlzLmV4cG9ydEJ0bikuZGlzYWJsZWQgPSB0cnVlO1xyXG4gICAgfVxyXG5cclxuICAgIGFkZEV2ZW50SGFuZGxlcnMoKSB7XHJcbiAgICAgICAgdGhpcy5leHBvcnRCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMuZXhwb3J0RGF0YSwgZmFsc2UpO1xyXG4gICAgICAgIHRoaXMuc2F2ZUJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5zYXZlQ2hhbmdlcywgZmFsc2UpO1xyXG4gICAgICAgIHRoaXMuZXhwb3J0QWxsQWRkaW5zQ2hlY2tib3guYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCB0aGlzLmNoZWNrQm94VmFsdWVDaGFuZ2VkLCBmYWxzZSk7XHJcbiAgICAgICAgdGhpcy5leHBvcnRBbGxab25lc0NoZWNrYm94LmFkZEV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgdGhpcy5jaGVja0JveFZhbHVlQ2hhbmdlZCwgZmFsc2UpO1xyXG4gICAgICAgIHRoaXMuZXhwb3J0U3lzdGVtU2V0dGluZ3NDaGVja2JveC5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsIHRoaXMuY2hlY2tCb3hWYWx1ZUNoYW5nZWQsIGZhbHNlKTtcclxuICAgIH1cclxuXHJcbiAgICByZW5kZXIgKCkge1xyXG4gICAgICAgIC8vVE9ETzogQnJldHQgLSBsZWZ0IGhlcmUgYXMgSSB3aWxsIGJlIGludHJvZHVjaW5nIHRoZSB1c2VyIGZldGNoIHNvb25cclxuICAgICAgICAvLyB0aGlzLmRhdGEudXNlcnMgPSBbXTtcclxuICAgICAgICB0aGlzLmRhdGEuem9uZXMgPSBbXTtcclxuICAgICAgICAvL3dpcmUgdXAgdGhlIGRvbVxyXG4gICAgICAgIGxldCBtYXBNZXNzYWdlVGVtcGxhdGU6IHN0cmluZyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibWFwTWVzc2FnZVRlbXBsYXRlXCIpLmlubmVySFRNTCxcclxuICAgICAgICAgICAgZ3JvdXBzQmxvY2s6IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJleHBvcnRlZEdyb3Vwc1wiKSxcclxuICAgICAgICAgICAgc2VjdXJpdHlDbGVhcmFuY2VzQmxvY2s6IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJleHBvcnRlZFNlY3VyaXR5Q2xlYXJhbmNlc1wiKSxcclxuICAgICAgICAgICAgcnVsZXNCbG9jazogSFRNTEVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImV4cG9ydGVkUnVsZXNcIiksXHJcbiAgICAgICAgICAgIHJlcG9ydHNCbG9jazogSFRNTEVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImV4cG9ydGVkUmVwb3J0c1wiKSxcclxuICAgICAgICAgICAgZGFzaGJvYXJkc0Jsb2NrOiBIVE1MRWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZXhwb3J0ZWREYXNoYm9hcmRzXCIpLFxyXG4gICAgICAgICAgICBhZGRpbnNCbG9jazogSFRNTEVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImV4cG9ydGVkQWRkaW5zXCIpLFxyXG4gICAgICAgICAgICBtYXBCbG9ja0Rlc2NyaXB0aW9uOiBIVE1MRWxlbWVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjZXhwb3J0ZWRNYXAgPiAuZGVzY3JpcHRpb25cIiksXHJcbiAgICAgICAgICAgIC8vIHVzZXJzQmxvY2s6IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJleHBvcnRlZFVzZXJzXCIpLFxyXG4gICAgICAgICAgICB6b25lc0Jsb2NrOiBIVE1MRWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZXhwb3J0ZWRab25lc1wiKSxcclxuICAgICAgICAgICAgc3lzdGVtU2V0dGluZ3NCbG9jazogSFRNTEVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImV4cG9ydFN5c3RlbVNldHRpbmdzXCIpO1xyXG4gICAgICAgIHRoaXMudG9nZ2xlV2FpdGluZyh0cnVlKTtcclxuICAgICAgICByZXR1cm4gdG9nZXRoZXIoW1xyXG4gICAgICAgICAgICAvL2xvYWRzIHRoZSBncm91cHMuIFRoaXMgaXMgd2hlcmUgdXNlcnMgYXJlIGFkZGVkIGlmIHRoZXkgYXJlIGxpbmtlZCB0byBhIGdyb3VwXHJcbiAgICAgICAgICAgIHRoaXMuZ3JvdXBzQnVpbGRlci5mZXRjaCgpLFxyXG4gICAgICAgICAgICAvL2xvYWRzIHRoZSBzZWN1cml0eSBncm91cHMgKHNlY3VyaXR5IGNsZWFyYW5jZSBpbiB1c2VyIGFkbWluIGluIE15RylcclxuICAgICAgICAgICAgdGhpcy5zZWN1cml0eUNsZWFyYW5jZXNCdWlsZGVyLmZldGNoKCksXHJcbiAgICAgICAgICAgIC8vcmVwb3J0IGxvYWRlci4uLnNlZW1zIG9ic29sZXRlIHRvIG1lXHJcbiAgICAgICAgICAgIHRoaXMucmVwb3J0c0J1aWxkZXIuZmV0Y2goKSxcclxuICAgICAgICAgICAgdGhpcy5ydWxlc0J1aWxkZXIuZmV0Y2goKSxcclxuICAgICAgICAgICAgdGhpcy5kaXN0cmlidXRpb25MaXN0c0J1aWxkZXIuZmV0Y2goKSxcclxuICAgICAgICAgICAgLy9taXNjID0gc3lzdGVtIHNldHRpbmdzXHJcbiAgICAgICAgICAgIHRoaXMubWlzY0J1aWxkZXIuZmV0Y2godGhpcy5leHBvcnRTeXN0ZW1TZXR0aW5nc0NoZWNrYm94LmNoZWNrZWQpLFxyXG4gICAgICAgICAgICAvL1RPRE86IEJyZXR0IC0gbGVmdCBoZXJlIGFzIEkgd2lsbCBiZSBpbnRyb2R1Y2luZyB0aGUgdXNlciBmZXRjaCBzb29uXHJcbiAgICAgICAgICAgIC8vIHRoaXMudXNlckJ1aWxkZXIuZmV0Y2goKSxcclxuICAgICAgICAgICAgdGhpcy56b25lQnVpbGRlci5mZXRjaCgpXHJcbiAgICAgICAgXSkudGhlbigocmVzdWx0cykgPT4ge1xyXG4gICAgICAgICAgICBsZXQgcmVwb3J0c0RlcGVuZGVuY2llczogSURlcGVuZGVuY2llcyxcclxuICAgICAgICAgICAgICAgIHJ1bGVzRGVwZW5kZW5jaWVzOiBJRGVwZW5kZW5jaWVzLFxyXG4gICAgICAgICAgICAgICAgZGlzdHJpYnV0aW9uTGlzdHNEZXBlbmRlbmNpZXM6IElEZXBlbmRlbmNpZXMsXHJcbiAgICAgICAgICAgICAgICBkZXBlbmRlbmNpZXM6IElEZXBlbmRlbmNpZXMsXHJcbiAgICAgICAgICAgICAgICBjdXN0b21NYXA7XHJcbiAgICAgICAgICAgIHRoaXMuZGF0YS5ncm91cHMgPSByZXN1bHRzWzBdO1xyXG4gICAgICAgICAgICB0aGlzLmRhdGEuc2VjdXJpdHlHcm91cHMgPSByZXN1bHRzWzFdO1xyXG4gICAgICAgICAgICB0aGlzLmRhdGEucmVwb3J0cyA9IHJlc3VsdHNbMl07XHJcbiAgICAgICAgICAgIHRoaXMuZGF0YS5ydWxlcyA9IHJlc3VsdHNbM107XHJcbiAgICAgICAgICAgIHRoaXMuZGF0YS5kaXN0cmlidXRpb25MaXN0cyA9IHRoaXMuZGlzdHJpYnV0aW9uTGlzdHNCdWlsZGVyLmdldFJ1bGVzRGlzdHJpYnV0aW9uTGlzdHModGhpcy5kYXRhLnJ1bGVzLm1hcChydWxlID0+IHJ1bGUuaWQpKTtcclxuICAgICAgICAgICAgdGhpcy5kYXRhLm1pc2MgPSByZXN1bHRzWzVdO1xyXG4gICAgICAgICAgICBsZXQgZ2V0RGVwZW5kZW5jaWVzID0gKGVudGl0aWVzOiBhbnlbXSwgZW50aXR5VHlwZTogVEVudGl0eVR5cGUpID0+IHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBlbnRpdGllcy5yZWR1Y2UoKHJlcywgZW50aXR5KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IGVudGl0eURlcCA9IHRoaXMuZ2V0RW50aXR5RGVwZW5kZW5jaWVzKGVudGl0eSwgZW50aXR5VHlwZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuY29tYmluZURlcGVuZGVuY2llcyhyZXMsIGVudGl0eURlcCk7XHJcbiAgICAgICAgICAgICAgICB9LCB7fSk7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIGxldCB6b25lRGVwZW5kZW5jaWVzID0ge307XHJcbiAgICAgICAgICAgIGlmKHRoaXMuZXhwb3J0QWxsWm9uZXNDaGVja2JveC5jaGVja2VkPT10cnVlKXtcclxuICAgICAgICAgICAgICAgIGlmKHJlc3VsdHNbNl0pe1xyXG4gICAgICAgICAgICAgICAgICAgIC8vc2V0cyBleHBvcnRlZCB6b25lcyB0byBhbGwgZGF0YWJhc2Ugem9uZXNcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmRhdGEuem9uZXMgPSByZXN1bHRzWzZdO1xyXG4gICAgICAgICAgICAgICAgICAgIHpvbmVEZXBlbmRlbmNpZXMgPSBnZXREZXBlbmRlbmNpZXMocmVzdWx0c1s2XSwgXCJ6b25lc1wiKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZih0aGlzLmV4cG9ydEFsbEFkZGluc0NoZWNrYm94LmNoZWNrZWQ9PWZhbHNlKXtcclxuICAgICAgICAgICAgICAgIC8vc2V0cyBleHBvcnRlZCBhZGRpbnMgZXF1YWwgdG8gbm9uZS9lbXB0eSBhcnJheVxyXG4gICAgICAgICAgICAgICAgdGhpcy5zZXRBZGRpbnNUb051bGwoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjdXN0b21NYXAgPSB0aGlzLm1pc2NCdWlsZGVyLmdldE1hcFByb3ZpZGVyRGF0YSh0aGlzLmRhdGEubWlzYy5tYXBQcm92aWRlci52YWx1ZSk7XHJcbiAgICAgICAgICAgIGN1c3RvbU1hcCAmJiB0aGlzLmRhdGEuY3VzdG9tTWFwcy5wdXNoKGN1c3RvbU1hcCk7XHJcbiAgICAgICAgICAgIHJlcG9ydHNEZXBlbmRlbmNpZXMgPSB0aGlzLnJlcG9ydHNCdWlsZGVyLmdldERlcGVuZGVuY2llcyh0aGlzLmRhdGEucmVwb3J0cyk7XHJcbiAgICAgICAgICAgIHJ1bGVzRGVwZW5kZW5jaWVzID0gdGhpcy5ydWxlc0J1aWxkZXIuZ2V0RGVwZW5kZW5jaWVzKHRoaXMuZGF0YS5ydWxlcyk7XHJcbiAgICAgICAgICAgIGRpc3RyaWJ1dGlvbkxpc3RzRGVwZW5kZW5jaWVzID0gdGhpcy5kaXN0cmlidXRpb25MaXN0c0J1aWxkZXIuZ2V0RGVwZW5kZW5jaWVzKHRoaXMuZGF0YS5kaXN0cmlidXRpb25MaXN0cyk7XHJcbiAgICAgICAgICAgIGRlcGVuZGVuY2llcyA9IHRoaXMuY29tYmluZURlcGVuZGVuY2llcyh6b25lRGVwZW5kZW5jaWVzLCByZXBvcnRzRGVwZW5kZW5jaWVzLCBydWxlc0RlcGVuZGVuY2llcywgZGlzdHJpYnV0aW9uTGlzdHNEZXBlbmRlbmNpZXMpO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5yZXNvbHZlRGVwZW5kZW5jaWVzKGRlcGVuZGVuY2llcywgdGhpcy5kYXRhKTtcclxuICAgICAgICB9KS50aGVuKCgpID0+IHtcclxuICAgICAgICAgICAgbGV0IG1hcFByb3ZpZGVyID0gdGhpcy5taXNjQnVpbGRlci5nZXRNYXBQcm92aWRlck5hbWUodGhpcy5kYXRhLm1pc2MubWFwUHJvdmlkZXIudmFsdWUpO1xyXG4gICAgICAgICAgICB0aGlzLnNob3dFbnRpdHlNZXNzYWdlKGdyb3Vwc0Jsb2NrLCB0aGlzLmRhdGEuZ3JvdXBzLmxlbmd0aCAtIDEsIFwiZ3JvdXBcIik7XHJcbiAgICAgICAgICAgIHRoaXMuc2hvd0VudGl0eU1lc3NhZ2Uoc2VjdXJpdHlDbGVhcmFuY2VzQmxvY2ssIHRoaXMuZGF0YS5zZWN1cml0eUdyb3Vwcy5sZW5ndGgsIFwic2VjdXJpdHkgY2xlYXJhbmNlXCIpO1xyXG4gICAgICAgICAgICB0aGlzLnNob3dFbnRpdHlNZXNzYWdlKHJ1bGVzQmxvY2ssIHRoaXMuZGF0YS5ydWxlcy5sZW5ndGgsIFwicnVsZVwiKTtcclxuICAgICAgICAgICAgdGhpcy5zaG93RW50aXR5TWVzc2FnZShyZXBvcnRzQmxvY2ssIHRoaXMucmVwb3J0c0J1aWxkZXIuZ2V0Q3VzdG9taXplZFJlcG9ydHNRdHkoKSwgXCJyZXBvcnRcIik7XHJcbiAgICAgICAgICAgIHRoaXMuc2hvd0VudGl0eU1lc3NhZ2UoZGFzaGJvYXJkc0Jsb2NrLCB0aGlzLnJlcG9ydHNCdWlsZGVyLmdldERhc2hib2FyZHNRdHkoKSwgXCJkYXNoYm9hcmRcIik7XHJcbiAgICAgICAgICAgIGlmIChtYXBQcm92aWRlcikge1xyXG4gICAgICAgICAgICAgICAgbWFwQmxvY2tEZXNjcmlwdGlvbi5pbm5lckhUTUwgPSBtYXBNZXNzYWdlVGVtcGxhdGUucmVwbGFjZShcInttYXBQcm92aWRlcn1cIiwgbWFwUHJvdmlkZXIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuc2hvd0VudGl0eU1lc3NhZ2UoYWRkaW5zQmxvY2ssIHRoaXMuZGF0YS5taXNjLmFkZGlucy5sZW5ndGgsIFwiYWRkaW5cIik7XHJcbiAgICAgICAgICAgIC8vIHRoaXMuc2hvd0VudGl0eU1lc3NhZ2UodXNlcnNCbG9jaywgdGhpcy5kYXRhLnVzZXJzLmxlbmd0aCwgXCJ1c2VyXCIpO1xyXG4gICAgICAgICAgICB0aGlzLnNob3dFbnRpdHlNZXNzYWdlKHpvbmVzQmxvY2ssIHRoaXMuZGF0YS56b25lcy5sZW5ndGgsIFwiem9uZVwiKTtcclxuICAgICAgICAgICAgdGhpcy5zaG93U3lzdGVtU2V0dGluZ3NNZXNzYWdlKHN5c3RlbVNldHRpbmdzQmxvY2ssIHRoaXMuZXhwb3J0U3lzdGVtU2V0dGluZ3NDaGVja2JveC5jaGVja2VkKTtcclxuICAgICAgICAgICAgLy90aGlzIGRpc3BsYXlzIGFsbCB0aGUgZGF0YS9vYmplY3RzIGluIHRoZSBjb25zb2xlXHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHRoaXMuZGF0YSk7XHJcbiAgICAgICAgfSkuY2F0Y2goKGUpID0+IHtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlKTtcclxuICAgICAgICAgICAgYWxlcnQoXCJDYW4ndCBnZXQgY29uZmlnIHRvIGV4cG9ydFwiKTtcclxuICAgICAgICB9KS5maW5hbGx5KCgpID0+IHRoaXMudG9nZ2xlV2FpdGluZygpKTtcclxuICAgIH1cclxuXHJcbiAgICB1bmxvYWQgKCkge1xyXG4gICAgICAgIHRoaXMuYWJvcnRDdXJyZW50VGFzaygpO1xyXG4gICAgICAgIHRoaXMuZ3JvdXBzQnVpbGRlci51bmxvYWQoKTtcclxuICAgICAgICB0aGlzLnNlY3VyaXR5Q2xlYXJhbmNlc0J1aWxkZXIudW5sb2FkKCk7XHJcbiAgICAgICAgdGhpcy5yZXBvcnRzQnVpbGRlci51bmxvYWQoKTtcclxuICAgICAgICB0aGlzLnJ1bGVzQnVpbGRlci51bmxvYWQoKTtcclxuICAgICAgICB0aGlzLmRpc3RyaWJ1dGlvbkxpc3RzQnVpbGRlci51bmxvYWQoKTtcclxuICAgICAgICB0aGlzLm1pc2NCdWlsZGVyLnVubG9hZCgpO1xyXG4gICAgICAgIHRoaXMuZXhwb3J0QnRuLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLmV4cG9ydERhdGEsIGZhbHNlKTtcclxuICAgICAgICB0aGlzLnNhdmVCdG4ucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMuc2F2ZUNoYW5nZXMsIGZhbHNlKTtcclxuICAgICAgICB0aGlzLmV4cG9ydEFsbEFkZGluc0NoZWNrYm94LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgdGhpcy5jaGVja0JveFZhbHVlQ2hhbmdlZCwgZmFsc2UpO1xyXG4gICAgICAgIHRoaXMuZXhwb3J0QWxsWm9uZXNDaGVja2JveC5yZW1vdmVFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsIHRoaXMuY2hlY2tCb3hWYWx1ZUNoYW5nZWQsIGZhbHNlKTtcclxuICAgICAgICB0aGlzLmV4cG9ydFN5c3RlbVNldHRpbmdzQ2hlY2tib3gucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCB0aGlzLmNoZWNrQm94VmFsdWVDaGFuZ2VkLCBmYWxzZSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmdlb3RhYi5hZGRpbi5yZWdpc3RyYXRpb25Db25maWcgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICBsZXQgYWRkaW46IEFkZGluO1xyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgaW5pdGlhbGl6ZTogKGFwaSwgc3RhdGUsIGNhbGxiYWNrKSA9PiB7XHJcbiAgICAgICAgICAgIGFkZGluID0gbmV3IEFkZGluKGFwaSk7XHJcbiAgICAgICAgICAgIGNhbGxiYWNrKCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBmb2N1czogKCkgPT4ge1xyXG4gICAgICAgICAgICBhZGRpbi5yZW5kZXIoKTtcclxuICAgICAgICAgICAgYWRkaW4uYWRkRXZlbnRIYW5kbGVycygpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgYmx1cjogKCkgPT4ge1xyXG4gICAgICAgICAgICBhZGRpbi51bmxvYWQoKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG59OyIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi9ibHVlYmlyZC5kLnRzXCIvPlxyXG5pbXBvcnQge2VudGl0eVRvRGljdGlvbmFyeSwgbWVyZ2VVbmlxdWV9IGZyb20gXCIuL3V0aWxzXCI7XHJcblxyXG4vL0EgZGlzdHJpYnV0aW9uIGxpc3QgbGlua3MgYSBzZXQgb2YgUnVsZShzKSB0byBhIHNldCBvZiBSZWNpcGllbnQocykuIFdoZW4gYSBSdWxlIGlzIHZpb2xhdGVkIGVhY2ggcmVsYXRlZCBSZWNpcGllbnQgd2lsbCByZWNlaXZlIGEgbm90aWZpY2F0aW9uIG9mIHRoZSBraW5kIGRlZmluZWQgYnkgaXRzIFJlY2lwaWVudFR5cGUuXHJcbmludGVyZmFjZSBJRGlzdHJpYnV0aW9uTGlzdCB7XHJcbiAgICBpZDogc3RyaW5nO1xyXG4gICAgbmFtZTogc3RyaW5nO1xyXG4gICAgcmVjaXBpZW50czogYW55W107XHJcbiAgICBydWxlczogYW55W107XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgSURpc3RyaWJ1dGlvbkxpc3REZXBlbmRlbmNpZXMge1xyXG4gICAgcnVsZXM/OiBhbnlbXTtcclxuICAgIHVzZXJzPzogYW55W107XHJcbiAgICBub3RpZmljYXRpb25UZW1wbGF0ZXM/OiBhbnlbXTtcclxuICAgIGdyb3Vwcz86IGFueVtdO1xyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBEaXN0cmlidXRpb25MaXN0c0J1aWxkZXIge1xyXG4gICAgcHJpdmF0ZSBhcGk7XHJcbiAgICBwcml2YXRlIGN1cnJlbnRUYXNrO1xyXG4gICAgcHJpdmF0ZSBkaXN0cmlidXRpb25MaXN0cztcclxuICAgIHByaXZhdGUgbm90aWZpY2F0aW9uVGVtcGxhdGVzO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKGFwaSkge1xyXG4gICAgICAgIHRoaXMuYXBpID0gYXBpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vQSBkaXN0cmlidXRpb24gbGlzdCBsaW5rcyBhIHNldCBvZiBSdWxlKHMpIHRvIGEgc2V0IG9mIFJlY2lwaWVudChzKS4gV2hlbiBhIFJ1bGUgaXMgdmlvbGF0ZWQgZWFjaCByZWxhdGVkIFJlY2lwaWVudCB3aWxsIHJlY2VpdmUgYSBub3RpZmljYXRpb24gb2YgdGhlIGtpbmQgZGVmaW5lZCBieSBpdHMgUmVjaXBpZW50VHlwZS5cclxuICAgIHByaXZhdGUgZ2V0RGlzdHJpYnV0aW9uTGlzdHNEYXRhICgpOiBQcm9taXNlPGFueT4ge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuYXBpLm11bHRpQ2FsbChbXHJcbiAgICAgICAgICAgICAgICBbXCJHZXRcIiwge1xyXG4gICAgICAgICAgICAgICAgICAgIFwidHlwZU5hbWVcIjogXCJEaXN0cmlidXRpb25MaXN0XCIsXHJcbiAgICAgICAgICAgICAgICB9XSxcclxuICAgICAgICAgICAgICAgIFtcIkdldE5vdGlmaWNhdGlvbldlYlJlcXVlc3RUZW1wbGF0ZXNcIiwge31dLFxyXG4gICAgICAgICAgICAgICAgW1wiR2V0Tm90aWZpY2F0aW9uRW1haWxUZW1wbGF0ZXNcIiwge31dLFxyXG4gICAgICAgICAgICAgICAgW1wiR2V0Tm90aWZpY2F0aW9uVGV4dFRlbXBsYXRlc1wiLCB7fV1cclxuICAgICAgICAgICAgXSwgcmVzb2x2ZSwgcmVqZWN0KTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgcHJpdmF0ZSBhYm9ydEN1cnJlbnRUYXNrICgpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrICYmIHRoaXMuY3VycmVudFRhc2suYWJvcnQgJiYgdGhpcy5jdXJyZW50VGFzay5hYm9ydCgpO1xyXG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgPSBudWxsO1xyXG4gICAgfTtcclxuXHJcbiAgICBwdWJsaWMgZ2V0RGVwZW5kZW5jaWVzIChkaXN0cmlidXRpb25MaXN0cyk6IElEaXN0cmlidXRpb25MaXN0RGVwZW5kZW5jaWVzIHtcclxuICAgICAgICBsZXQgZGVwZW5kZW5jaWVzOiBJRGlzdHJpYnV0aW9uTGlzdERlcGVuZGVuY2llcyA9IHtcclxuICAgICAgICAgICAgICAgIHJ1bGVzOiBbXSxcclxuICAgICAgICAgICAgICAgIHVzZXJzOiBbXSxcclxuICAgICAgICAgICAgICAgIGdyb3VwczogW10sXHJcbiAgICAgICAgICAgICAgICBub3RpZmljYXRpb25UZW1wbGF0ZXM6IFtdXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHByb2Nlc3NEZXBlbmRlbmNpZXMgPSAocmVjaXBpZW50KSA9PiB7XHJcbiAgICAgICAgICAgICAgICBsZXQgaWQsIHR5cGU6IHN0cmluZyxcclxuICAgICAgICAgICAgICAgICAgICB1c2VySWQgPSByZWNpcGllbnQudXNlci5pZDtcclxuICAgICAgICAgICAgICAgIHVzZXJJZCAmJiBkZXBlbmRlbmNpZXMudXNlcnMuaW5kZXhPZih1c2VySWQpID09PSAtMSAmJiBkZXBlbmRlbmNpZXMudXNlcnMucHVzaCh1c2VySWQpO1xyXG4gICAgICAgICAgICAgICAgc3dpdGNoIChyZWNpcGllbnQucmVjaXBpZW50VHlwZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJFbWFpbFwiOlxyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJMb2dQb3B1cFwiOlxyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJMb2dVcmdlbnRQb3B1cFwiOlxyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJMb2dPbmx5XCI6XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIlRleHRNZXNzYWdlXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIlRleHRUb1NwZWVjaEFsbG93RGVsYXlcIjpcclxuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiV2ViUmVxdWVzdFwiOlxyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJUZXh0VG9TcGVlY2hcIjpcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWQgPSByZWNpcGllbnQubm90aWZpY2F0aW9uQmluYXJ5RmlsZSAmJiByZWNpcGllbnQubm90aWZpY2F0aW9uQmluYXJ5RmlsZS5pZDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZSA9IFwibm90aWZpY2F0aW9uVGVtcGxhdGVzXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJBc3NpZ25Ub0dyb3VwXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkID0gcmVjaXBpZW50Lmdyb3VwICYmIHJlY2lwaWVudC5ncm91cC5pZDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZSA9IFwiZ3JvdXBzXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWQgJiYgdHlwZSAmJiBkZXBlbmRlbmNpZXNbdHlwZV0uaW5kZXhPZihpZCkgPT09IC0xICYmIGRlcGVuZGVuY2llc1t0eXBlXS5wdXNoKGlkKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgY2hlY2tSZWNpcGllbnRzID0gKHJlY2lwaWVudHMsIGRlcGVuZGVuY2llczogSURpc3RyaWJ1dGlvbkxpc3REZXBlbmRlbmNpZXMpOiBJRGlzdHJpYnV0aW9uTGlzdERlcGVuZGVuY2llcyA9PiB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVjaXBpZW50cy5yZWR1Y2UoKGRlcGVuZGVuY2llcywgcmVjaXBpZW50KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgcHJvY2Vzc0RlcGVuZGVuY2llcyhyZWNpcGllbnQpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBkZXBlbmRlbmNpZXM7XHJcbiAgICAgICAgICAgICAgICB9LCBkZXBlbmRlbmNpZXMpO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIHJldHVybiBkaXN0cmlidXRpb25MaXN0cy5yZWR1Y2UoKGRlcGVuZGVuY2llczogSURpc3RyaWJ1dGlvbkxpc3REZXBlbmRlbmNpZXMsIGRpc3RyaWJ1dGlvbkxpc3Q6IElEaXN0cmlidXRpb25MaXN0KSA9PiB7XHJcbiAgICAgICAgICAgIGRlcGVuZGVuY2llcy5ydWxlcyA9IG1lcmdlVW5pcXVlKGRlcGVuZGVuY2llcy5ydWxlcywgZGlzdHJpYnV0aW9uTGlzdC5ydWxlcy5tYXAocnVsZSA9PiBydWxlLmlkKSk7XHJcbiAgICAgICAgICAgIGRlcGVuZGVuY2llcyA9IGNoZWNrUmVjaXBpZW50cyhkaXN0cmlidXRpb25MaXN0LnJlY2lwaWVudHMsIGRlcGVuZGVuY2llcyk7XHJcbiAgICAgICAgICAgIHJldHVybiBkZXBlbmRlbmNpZXM7XHJcbiAgICAgICAgfSwgZGVwZW5kZW5jaWVzKTtcclxuICAgIH07XHJcblxyXG4gICAgcHVibGljIGZldGNoKCk6IFByb21pc2U8YW55PiB7XHJcbiAgICAgICAgdGhpcy5hYm9ydEN1cnJlbnRUYXNrKCk7XHJcbiAgICAgICAgdGhpcy5jdXJyZW50VGFzayA9IHRoaXMuZ2V0RGlzdHJpYnV0aW9uTGlzdHNEYXRhKClcclxuICAgICAgICAgICAgLnRoZW4oKFtkaXN0cmlidXRpb25MaXN0cywgd2ViVGVtcGxhdGVzLCBlbWFpbFRlbXBsYXRlcywgdGV4dFRlbXBsYXRlc10pID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZGlzdHJpYnV0aW9uTGlzdHMgPSBlbnRpdHlUb0RpY3Rpb25hcnkoZGlzdHJpYnV0aW9uTGlzdHMpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5ub3RpZmljYXRpb25UZW1wbGF0ZXMgPSBlbnRpdHlUb0RpY3Rpb25hcnkod2ViVGVtcGxhdGVzLmNvbmNhdChlbWFpbFRlbXBsYXRlcykuY29uY2F0KHRleHRUZW1wbGF0ZXMpKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmRpc3RyaWJ1dGlvbkxpc3RzO1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAuY2F0Y2goY29uc29sZS5lcnJvcilcclxuICAgICAgICAgICAgLmZpbmFsbHkoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50VGFzayA9IG51bGw7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiB0aGlzLmN1cnJlbnRUYXNrO1xyXG4gICAgfTtcclxuXHJcbiAgICBwdWJsaWMgZ2V0Tm90aWZpY2F0aW9uVGVtcGxhdGVEYXRhICh0ZW1wbGF0ZUlkOiBzdHJpbmcpOiBhbnkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLm5vdGlmaWNhdGlvblRlbXBsYXRlc1t0ZW1wbGF0ZUlkXTtcclxuICAgIH07XHJcblxyXG4gICAgcHVibGljIGdldFJ1bGVzRGlzdHJpYnV0aW9uTGlzdHMgKHJ1bGVzSWRzOiBzdHJpbmdbXSk6IElEaXN0cmlidXRpb25MaXN0W10ge1xyXG4gICAgICAgIHJldHVybiBPYmplY3Qua2V5cyh0aGlzLmRpc3RyaWJ1dGlvbkxpc3RzKS5yZWR1Y2UoKHJlcywgaWQpID0+IHtcclxuICAgICAgICAgICAgbGV0IGxpc3QgPSB0aGlzLmRpc3RyaWJ1dGlvbkxpc3RzW2lkXTtcclxuICAgICAgICAgICAgbGlzdC5ydWxlcy5zb21lKGxpc3RSdWxlID0+IHJ1bGVzSWRzLmluZGV4T2YobGlzdFJ1bGUuaWQpID4gLTEpICYmIHJlcy5wdXNoKGxpc3QpO1xyXG4gICAgICAgICAgICByZXR1cm4gcmVzO1xyXG4gICAgICAgIH0sIFtdKTtcclxuICAgIH07XHJcblxyXG4gICAgcHVibGljIHVubG9hZCAoKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5hYm9ydEN1cnJlbnRUYXNrKCk7XHJcbiAgICB9O1xyXG59IiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uL2JsdWViaXJkLmQudHNcIi8+XHJcbmltcG9ydCAqIGFzIFV0aWxzIGZyb20gXCIuL3V0aWxzXCI7XHJcblxyXG5pbnRlcmZhY2UgQ29sb3Ige1xyXG4gICAgcjogbnVtYmVyO1xyXG4gICAgZzogbnVtYmVyO1xyXG4gICAgYjogbnVtYmVyO1xyXG4gICAgYTogbnVtYmVyO1xyXG59XHJcblxyXG5pbnRlcmZhY2UgSUdyb3VwIHtcclxuICAgIGlkOiBzdHJpbmc7XHJcbiAgICBuYW1lPzogc3RyaW5nO1xyXG4gICAgY29sb3I/OiBDb2xvcjtcclxuICAgIHBhcmVudD86IElHcm91cDtcclxuICAgIGNoaWxkcmVuPzogSUdyb3VwW107XHJcbiAgICB1c2VyPzogYW55O1xyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBHcm91cHNCdWlsZGVyIHtcclxuICAgIHByb3RlY3RlZCBhcGk7XHJcbiAgICBwcm90ZWN0ZWQgY3VycmVudFRhc2s7XHJcbiAgICBwcm90ZWN0ZWQgZ3JvdXBzOiBJR3JvdXBbXTtcclxuICAgIHByb3RlY3RlZCB0cmVlOiBJR3JvdXBbXTtcclxuICAgIHByb3RlY3RlZCBjdXJyZW50VHJlZTtcclxuXHJcbiAgICBwcml2YXRlIHVzZXJzOiBhbnk7XHJcbiAgICBwcml2YXRlIGN1cnJlbnRVc2VyTmFtZTogc3RyaW5nO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKGFwaTogYW55KSB7XHJcbiAgICAgICAgdGhpcy5hcGkgPSBhcGk7XHJcbiAgICB9XHJcblxyXG4gICAgLy9nZXRzIHRoZSBncm91cHMgYXNzb2NpYXRlZCB3aXRoIHRoZSBjdXJyZW50IHVzZXJcclxuICAgIHByaXZhdGUgZ2V0R3JvdXBzICgpOiBQcm9taXNlPGFueT4ge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuYXBpLmdldFNlc3Npb24oKHNlc3Npb25EYXRhKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRVc2VyTmFtZSA9IHNlc3Npb25EYXRhLnVzZXJOYW1lO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hcGkubXVsdGlDYWxsKFtcclxuICAgICAgICAgICAgICAgICAgICBbXCJHZXRcIiwge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlTmFtZTogXCJHcm91cFwiXHJcbiAgICAgICAgICAgICAgICAgICAgfV0sXHJcbiAgICAgICAgICAgICAgICAgICAgW1wiR2V0XCIsIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZU5hbWU6IFwiVXNlclwiXHJcbiAgICAgICAgICAgICAgICAgICAgfV1cclxuICAgICAgICAgICAgICAgIF0sIHJlc29sdmUsIHJlamVjdCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICBwcml2YXRlIGZpbmRDaGlsZCAoY2hpbGRJZDogc3RyaW5nLCBjdXJyZW50SXRlbTogSUdyb3VwLCBvbkFsbExldmVsczogYm9vbGVhbiA9IGZhbHNlKTogSUdyb3VwIHtcclxuICAgICAgICBsZXQgZm91bmRDaGlsZCA9IG51bGwsXHJcbiAgICAgICAgICAgIGNoaWxkcmVuID0gY3VycmVudEl0ZW0uY2hpbGRyZW47XHJcbiAgICAgICAgaWYgKCFjaGlsZElkIHx8ICFjaGlsZHJlbiB8fCAhY2hpbGRyZW4ubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY2hpbGRyZW4uc29tZShjaGlsZCA9PiB7XHJcbiAgICAgICAgICAgIGlmIChjaGlsZC5pZCA9PT0gY2hpbGRJZCkge1xyXG4gICAgICAgICAgICAgICAgZm91bmRDaGlsZCA9IGNoaWxkO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZvdW5kQ2hpbGQ7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBpZiAob25BbGxMZXZlbHMpIHtcclxuICAgICAgICAgICAgICAgICAgICBmb3VuZENoaWxkID0gdGhpcy5maW5kQ2hpbGQoY2hpbGRJZCwgY2hpbGQsIG9uQWxsTGV2ZWxzKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZm91bmRDaGlsZDtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHJldHVybiBmb3VuZENoaWxkO1xyXG4gICAgfTtcclxuXHJcbiAgICBwcml2YXRlIGdldFVzZXJCeVByaXZhdGVHcm91cElkIChncm91cElkOiBzdHJpbmcpOiBhbnkge1xyXG4gICAgICAgIGxldCBvdXRwdXRVc2VyID0gbnVsbCxcclxuICAgICAgICAgICAgdXNlckhhc1ByaXZhdGVHcm91cCA9ICh1c2VyLCBncm91cElkKTogYm9vbGVhbiA9PiB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdXNlci5wcml2YXRlVXNlckdyb3Vwcy5zb21lKGdyb3VwID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZ3JvdXAuaWQgPT09IGdyb3VwSWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgdGhpcy51c2Vycy5zb21lKHVzZXIgPT4ge1xyXG4gICAgICAgICAgICBpZiAodXNlckhhc1ByaXZhdGVHcm91cCh1c2VyLCBncm91cElkKSkge1xyXG4gICAgICAgICAgICAgICAgb3V0cHV0VXNlciA9IHVzZXI7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiBvdXRwdXRVc2VyO1xyXG4gICAgfTtcclxuXHJcbiAgICBwcml2YXRlIGdldFByaXZhdGVHcm91cERhdGEgKGdyb3VwSWQ6IHN0cmluZykge1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIGlkOiBncm91cElkLFxyXG4gICAgICAgICAgICB1c2VyOiB0aGlzLmdldFVzZXJCeVByaXZhdGVHcm91cElkKGdyb3VwSWQpLFxyXG4gICAgICAgICAgICBjaGlsZHJlbjogW10sXHJcbiAgICAgICAgICAgIG5hbWU6IFwiUHJpdmF0ZVVzZXJHcm91cE5hbWVcIixcclxuICAgICAgICAgICAgcGFyZW50OiB7XHJcbiAgICAgICAgICAgICAgICBpZDogXCJHcm91cFByaXZhdGVVc2VySWRcIixcclxuICAgICAgICAgICAgICAgIGNoaWxkcmVuOiBbeyBpZDogZ3JvdXBJZCB9XVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgIH07XHJcblxyXG4gICAgcHJvdGVjdGVkIGNyZWF0ZUdyb3Vwc1RyZWUgKGdyb3VwczogSUdyb3VwW10pOiBhbnlbXSB7XHJcbiAgICAgICAgbGV0IG5vZGVMb29rdXAsXHJcbiAgICAgICAgICAgIHRyYXZlcnNlQ2hpbGRyZW4gPSBmdW5jdGlvbiAobm9kZSkge1xyXG4gICAgICAgICAgICAgICAgbGV0IGNoaWxkcmVuOiBJR3JvdXBbXSxcclxuICAgICAgICAgICAgICAgICAgICBpZDogc3RyaW5nO1xyXG5cclxuICAgICAgICAgICAgICAgIGNoaWxkcmVuID0gbm9kZS5jaGlsZHJlbjtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoY2hpbGRyZW4pIHtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMCwgaWkgPSBjaGlsZHJlbi5sZW5ndGg7IGkgPCBpaTsgaSArPSAxKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkID0gY2hpbGRyZW5baV0uaWQ7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobm9kZUxvb2t1cFtpZF0pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGUuY2hpbGRyZW5baV0gPSBub2RlTG9va3VwW2lkXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGUuY2hpbGRyZW5baV0ucGFyZW50ID0gbm9kZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBub2RlTG9va3VwW2lkXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0cmF2ZXJzZUNoaWxkcmVuKG5vZGUuY2hpbGRyZW5baV0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgbm9kZUxvb2t1cCA9IFV0aWxzLmVudGl0eVRvRGljdGlvbmFyeShncm91cHMsIGVudGl0eSA9PiB7XHJcbiAgICAgICAgICAgIGxldCBuZXdFbnRpdHkgPSBVdGlscy5leHRlbmQoe30sIGVudGl0eSk7XHJcbiAgICAgICAgICAgIGlmIChuZXdFbnRpdHkuY2hpbGRyZW4pIHtcclxuICAgICAgICAgICAgICAgIG5ld0VudGl0eS5jaGlsZHJlbiA9IG5ld0VudGl0eS5jaGlsZHJlbi5zbGljZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBuZXdFbnRpdHk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIE9iamVjdC5rZXlzKG5vZGVMb29rdXApLmZvckVhY2goa2V5ID0+IHtcclxuICAgICAgICAgICAgbm9kZUxvb2t1cFtrZXldICYmIHRyYXZlcnNlQ2hpbGRyZW4obm9kZUxvb2t1cFtrZXldKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIE9iamVjdC5rZXlzKG5vZGVMb29rdXApLm1hcChrZXkgPT4ge1xyXG4gICAgICAgICAgICByZXR1cm4gbm9kZUxvb2t1cFtrZXldO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICBwcm90ZWN0ZWQgYWJvcnRDdXJyZW50VGFzayAoKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5jdXJyZW50VGFzayAmJiB0aGlzLmN1cnJlbnRUYXNrLmFib3J0ICYmIHRoaXMuY3VycmVudFRhc2suYWJvcnQoKTtcclxuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrID0gbnVsbDtcclxuICAgIH07XHJcblxyXG4gICAgLy9maWxscyB0aGUgZ3JvdXAgYnVpbGRlciB3aXRoIHRoZSByZWxldmFudCBpbmZvcm1hdGlvblxyXG4gICAgcHVibGljIGZldGNoICgpOiBQcm9taXNlPGFueT4ge1xyXG4gICAgICAgIHRoaXMuYWJvcnRDdXJyZW50VGFzaygpO1xyXG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgPSB0aGlzLmdldEdyb3VwcygpXHJcbiAgICAgICAgICAgIC50aGVuKChbZ3JvdXBzLCB1c2Vyc10pID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZ3JvdXBzID0gZ3JvdXBzO1xyXG4gICAgICAgICAgICAgICAgdGhpcy51c2VycyA9IHVzZXJzO1xyXG4gICAgICAgICAgICAgICAgdGhpcy50cmVlID0gdGhpcy5jcmVhdGVHcm91cHNUcmVlKGdyb3Vwcyk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRUcmVlID0gVXRpbHMuZXh0ZW5kKHt9LCB0aGlzLnRyZWUpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlRmxhdEdyb3Vwc0xpc3QodGhpcy50cmVlKTtcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgLmNhdGNoKGNvbnNvbGUuZXJyb3IpXHJcbiAgICAgICAgICAgIC5maW5hbGx5KCgpID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudFRhc2sgPSBudWxsO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4gdGhpcy5jdXJyZW50VGFzaztcclxuICAgIH07XHJcblxyXG4gICAgcHVibGljIGNyZWF0ZUZsYXRHcm91cHNMaXN0IChncm91cHM6IElHcm91cFtdLCBub3RJbmNsdWRlQ2hpbGRyZW46IGJvb2xlYW4gPSBmYWxzZSk6IElHcm91cFtdIHtcclxuICAgICAgICBsZXQgZm91bmRJZHMgPSBbXSxcclxuICAgICAgICAgICAgZ3JvdXBzVG9BZGQgPSBbXSxcclxuICAgICAgICAgICAgbWFrZUZsYXRQYXJlbnRzID0gKGl0ZW0pID0+IHtcclxuICAgICAgICAgICAgICAgIGxldCBpdGVtQ29weSA9IFV0aWxzLmV4dGVuZCh7fSwgaXRlbSk7XHJcbiAgICAgICAgICAgICAgICBpZiAoaXRlbSAmJiBpdGVtLnBhcmVudCkge1xyXG4gICAgICAgICAgICAgICAgICAgIG1ha2VGbGF0UGFyZW50cyhpdGVtLnBhcmVudCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpdGVtQ29weS5jaGlsZHJlbiA9IGl0ZW1Db3B5LmNoaWxkcmVuLm1hcChjaGlsZCA9PiBjaGlsZC5pZCk7XHJcbiAgICAgICAgICAgICAgICBpdGVtQ29weS5wYXJlbnQgPSBpdGVtLnBhcmVudCA/IHtpZDogaXRlbS5wYXJlbnQuaWQsIG5hbWU6IGl0ZW0ucGFyZW50Lm5hbWV9IDogbnVsbDtcclxuICAgICAgICAgICAgICAgIGlmIChmb3VuZElkcy5pbmRleE9mKGl0ZW0uaWQpID09PSAtMSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGdyb3Vwc1RvQWRkLnB1c2goaXRlbUNvcHkpO1xyXG4gICAgICAgICAgICAgICAgICAgIGZvdW5kSWRzLnB1c2goaXRlbS5pZCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIG1ha2VGbGF0Q2hpbGRyZW4gPSAoaXRlbSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKGl0ZW0gJiYgaXRlbS5jaGlsZHJlbiAmJiBpdGVtLmNoaWxkcmVuLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGl0ZW0uY2hpbGRyZW4uZm9yRWFjaCgoY2hpbGQpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGNoaWxkQ29weTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGZvdW5kSWRzLmluZGV4T2YoY2hpbGQuaWQpID09PSAtMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWFrZUZsYXRDaGlsZHJlbihjaGlsZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGRDb3B5ID0gVXRpbHMuZXh0ZW5kKHt9LCBjaGlsZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkQ29weS5jaGlsZHJlbiA9IGNoaWxkQ29weS5jaGlsZHJlbi5tYXAoY2hpbGRJbm5lciA9PiBjaGlsZElubmVyLmlkKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGRDb3B5LnBhcmVudCA9IGNoaWxkQ29weS5wYXJlbnQgPyB7aWQ6IGNoaWxkQ29weS5wYXJlbnQuaWQsIG5hbWU6IGNoaWxkQ29weS5wYXJlbnQubmFtZX0gOiBudWxsO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZm91bmRJZHMuaW5kZXhPZihjaGlsZC5pZCkgPT09IC0xKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBncm91cHNUb0FkZC5wdXNoKGNoaWxkQ29weSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3VuZElkcy5wdXNoKGNoaWxkLmlkKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICBncm91cHMuZm9yRWFjaChtYWtlRmxhdFBhcmVudHMpO1xyXG4gICAgICAgICFub3RJbmNsdWRlQ2hpbGRyZW4gJiYgZ3JvdXBzLmZvckVhY2gobWFrZUZsYXRDaGlsZHJlbik7XHJcbiAgICAgICAgcmV0dXJuIGdyb3Vwc1RvQWRkO1xyXG4gICAgfTtcclxuXHJcbiAgICBwdWJsaWMgZ2V0R3JvdXBzRGF0YSAoZ3JvdXBJZHM6IHN0cmluZ1tdLCBub3RJbmNsdWRlQ2hpbGRyZW46IGJvb2xlYW4gPSBmYWxzZSk6IElHcm91cFtdIHtcclxuICAgICAgICBsZXQgdHJlZUdyb3VwcyA9IGdyb3VwSWRzLm1hcChncm91cElkID0+XHJcbiAgICAgICAgICAgIHRoaXMuZmluZENoaWxkKGdyb3VwSWQsIHtpZDogbnVsbCwgY2hpbGRyZW46IHRoaXMudHJlZX0sIHRydWUpIHx8IHRoaXMuZ2V0UHJpdmF0ZUdyb3VwRGF0YShncm91cElkKVxyXG4gICAgICAgICk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlRmxhdEdyb3Vwc0xpc3QodHJlZUdyb3Vwcywgbm90SW5jbHVkZUNoaWxkcmVuKTtcclxuICAgIH07XHJcblxyXG4gICAgcHVibGljIGdldEN1c3RvbUdyb3Vwc0RhdGEgKGdyb3VwSWRzOiBzdHJpbmdbXSwgYWxsR3JvdXBzOiBJR3JvdXBbXSk6IElHcm91cFtdIHtcclxuICAgICAgICBsZXQgZ3JvdXBzVHJlZSA9IHRoaXMuY3JlYXRlR3JvdXBzVHJlZShhbGxHcm91cHMpLFxyXG4gICAgICAgICAgICB0cmVlR3JvdXBzID0gZ3JvdXBJZHMubWFwKGdyb3VwSWQgPT4gXHJcbiAgICAgICAgICAgICAgICB0aGlzLmZpbmRDaGlsZChncm91cElkLCB7aWQ6IG51bGwsIGNoaWxkcmVuOiBncm91cHNUcmVlfSwgdHJ1ZSkgfHwgdGhpcy5nZXRQcml2YXRlR3JvdXBEYXRhKGdyb3VwSWQpXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlRmxhdEdyb3Vwc0xpc3QodHJlZUdyb3VwcywgdHJ1ZSk7XHJcbiAgICB9O1xyXG5cclxuICAgIHB1YmxpYyBnZXRQcml2YXRlR3JvdXBzVXNlcnMoZ3JvdXBzOiBJR3JvdXBbXSkge1xyXG4gICAgICAgIHJldHVybiBncm91cHMucmVkdWNlKCh1c2VycywgZ3JvdXApID0+IHtcclxuICAgICAgICAgICAgZ3JvdXAudXNlciAmJiBncm91cC51c2VyLm5hbWUgIT09IHRoaXMuY3VycmVudFVzZXJOYW1lICYmIHVzZXJzLnB1c2goZ3JvdXAudXNlcik7XHJcbiAgICAgICAgICAgIHJldHVybiB1c2VycztcclxuICAgICAgICB9LCBbXSk7XHJcbiAgICB9O1xyXG5cclxuICAgIHB1YmxpYyB1bmxvYWQgKCk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMuYWJvcnRDdXJyZW50VGFzaygpO1xyXG4gICAgfTtcclxufSIsImltcG9ydCB7IGVudGl0eVRvRGljdGlvbmFyeSB9IGZyb20gXCIuL3V0aWxzXCI7XHJcblxyXG50eXBlIFRNYXBQcm92aWRlclR5cGUgPSBcImRlZmF1bHRcIiB8IFwiYWRkaXRpb25hbFwiIHwgXCJjdXN0b21cIjtcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgSU1pc2NEYXRhIHtcclxuICAgIG1hcFByb3ZpZGVyOiB7XHJcbiAgICAgICAgdmFsdWU6IHN0cmluZztcclxuICAgICAgICB0eXBlOiBUTWFwUHJvdmlkZXJUeXBlO1xyXG4gICAgfTtcclxuICAgIGN1cnJlbnRVc2VyOiBhbnk7XHJcbiAgICBpc1Vuc2lnbmVkQWRkaW5zQWxsb3dlZDogYm9vbGVhbjtcclxuICAgIGFkZGluczogc3RyaW5nW107XHJcbiAgICBwdXJnZVNldHRpbmdzPzogYW55O1xyXG4gICAgZW1haWxTZW5kZXJGcm9tPzogc3RyaW5nO1xyXG4gICAgY3VzdG9tZXJDbGFzc2lmaWNhdGlvbj86IHN0cmluZztcclxuICAgIGlzTWFya2V0cGxhY2VQdXJjaGFzZXNBbGxvd2VkPzogYm9vbGVhbjtcclxuICAgIGlzUmVzZWxsZXJBdXRvTG9naW5BbGxvd2VkPzogYm9vbGVhbjtcclxuICAgIGlzVGhpcmRQYXJ0eU1hcmtldHBsYWNlQXBwc0FsbG93ZWQ/OiBib29sZWFuO1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgTWlzY0J1aWxkZXIge1xyXG4gICAgcHJpdmF0ZSByZWFkb25seSBhcGk7XHJcbiAgICBwcml2YXRlIGN1c3RvbU1hcFByb3ZpZGVycztcclxuICAgIHByaXZhdGUgY3VycmVudFRhc2s7XHJcbiAgICBwcml2YXRlIGN1cnJlbnRVc2VyO1xyXG4gICAgcHJpdmF0ZSBpc1Vuc2lnbmVkQWRkaW5zQWxsb3dlZDtcclxuICAgIHByaXZhdGUgYWRkaW5zOiBzdHJpbmdbXTtcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgZGVmYXVsdE1hcFByb3ZpZGVycyA9IHtcclxuICAgICAgICBHb29nbGVNYXBzOiBcIkdvb2dsZSBNYXBzXCIsXHJcbiAgICAgICAgSGVyZTogXCJIRVJFIE1hcHNcIixcclxuICAgICAgICBNYXBCb3g6IFwiTWFwQm94XCJcclxuICAgIH07XHJcblxyXG4gICAgcHJpdmF0ZSBhYm9ydEN1cnJlbnRUYXNrICgpIHtcclxuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrICYmIHRoaXMuY3VycmVudFRhc2suYWJvcnQgJiYgdGhpcy5jdXJyZW50VGFzay5hYm9ydCgpO1xyXG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgPSBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgZ2V0QWxsb3dlZEFkZGlucyAoYWxsQWRkaW5zOiBzdHJpbmdbXSkge1xyXG4gICAgICAgIHJldHVybiBhbGxBZGRpbnMuZmlsdGVyKGFkZGluID0+IHtcclxuICAgICAgICAgICAgLy9yZW1vdmVzIHRoZSBjdXJyZW50IGFkZGluIC0gcmVnaXN0cmF0aW9uIGNvbmZpZ1xyXG4gICAgICAgICAgICBpZih0aGlzLmlzQ3VycmVudEFkZGluKGFkZGluKSlcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGxldCBhZGRpbkNvbmZpZyA9IEpTT04ucGFyc2UoYWRkaW4pO1xyXG4gICAgICAgICAgICBpZihhZGRpbkNvbmZpZy5pdGVtcykge1xyXG4gICAgICAgICAgICAgICAgLy9NdWx0aSBsaW5lIGFkZGluIHN0cnVjdHVyZSBjaGVja1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGFkZGluQ29uZmlnICYmIEFycmF5LmlzQXJyYXkoYWRkaW5Db25maWcuaXRlbXMpICYmIGFkZGluQ29uZmlnLml0ZW1zLmV2ZXJ5KGl0ZW0gPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCB1cmwgPSBpdGVtLnVybDtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5pc1ZhbGlkVXJsKHVybCk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIC8vU2luZ2xlIGxpbmUgYWRkaW4gc3RydWN0dXJlIGNoZWNrXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5pc1ZhbGlkVXJsKGFkZGluQ29uZmlnLnVybCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICAvL1Rlc3RzIGEgVVJMIGZvciBkb3VibGUgc2xhc2guIEFjY2VwdHMgYSB1cmwgYXMgYSBzdHJpbmcgYXMgYSBhcmd1bWVudC5cclxuICAgIC8vUmV0dXJucyB0cnVlIGlmIHRoZSB1cmwgY29udGFpbnMgYSBkb3VibGUgc2xhc2ggLy9cclxuICAgIC8vUmV0dXJucyBmYWxzZSBpZiB0aGUgdXJsIGRvZXMgbm90IGNvbnRhaW4gYSBkb3VibGUgc2xhc2guXHJcbiAgICBwcml2YXRlIGlzVmFsaWRVcmwodXJsOiBzdHJpbmcpOiBib29sZWFuIHtcclxuICAgICAgICBpZiAodXJsICYmIHVybC5pbmRleE9mKFwiXFwvXFwvXCIpID4gLTEpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgaXNDdXJyZW50QWRkaW4gKGFkZGluOiBzdHJpbmcpIHtcclxuICAgICAgICByZXR1cm4gKChhZGRpbi5pbmRleE9mKFwiUmVnaXN0cmF0aW9uIGNvbmZpZ1wiKSA+IC0xKXx8XHJcbiAgICAgICAgKGFkZGluLnRvTG93ZXJDYXNlKCkuaW5kZXhPZihcInJlZ2lzdHJhdGlvbkNvbmZpZ1wiLnRvTG93ZXJDYXNlKCkpID4gLTEpKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdHJ1Y3RvcihhcGkpIHtcclxuICAgICAgICB0aGlzLmFwaSA9IGFwaTtcclxuICAgIH1cclxuXHJcbiAgICAvL2ZpbGxzIHRoZSBNaXNjIGJ1aWxkZXIgKHN5c3RlbSBzZXR0aW5ncykgd2l0aCB0aGUgcmVsZXZhbnQgaW5mb3JtYXRpb25cclxuICAgIGZldGNoIChpbmNsdWRlU3lzU2V0dGluZ3M6IGJvb2xlYW4pOiBQcm9taXNlPElNaXNjRGF0YT4ge1xyXG4gICAgICAgIHRoaXMuYWJvcnRDdXJyZW50VGFzaygpO1xyXG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuYXBpLmdldFNlc3Npb24oKHNlc3Npb25EYXRhKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBsZXQgdXNlck5hbWUgPSBzZXNzaW9uRGF0YS51c2VyTmFtZTtcclxuICAgICAgICAgICAgICAgIHRoaXMuYXBpLm11bHRpQ2FsbChbXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFtcIkdldFwiLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlTmFtZTogXCJVc2VyXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWFyY2g6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiB1c2VyTmFtZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgW1wiR2V0XCIsIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGVOYW1lOiBcIlN5c3RlbVNldHRpbmdzXCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgfV1cclxuICAgICAgICAgICAgICAgICAgICBdLCByZXNvbHZlLCByZWplY3QpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KS50aGVuKChyZXN1bHQpID0+IHtcclxuICAgICAgICAgICAgbGV0IGN1cnJlbnRVc2VyID0gcmVzdWx0WzBdWzBdIHx8IHJlc3VsdFswXSxcclxuICAgICAgICAgICAgICAgIHN5c3RlbVNldHRpbmdzID0gcmVzdWx0WzFdWzBdIHx8IHJlc3VsdFsxXSxcclxuICAgICAgICAgICAgICAgIHVzZXJNYXBQcm92aWRlcklkID0gY3VycmVudFVzZXIuZGVmYXVsdE1hcEVuZ2luZSxcclxuICAgICAgICAgICAgICAgIGRlZmF1bHRNYXBQcm92aWRlcklkID0gc3lzdGVtU2V0dGluZ3MubWFwUHJvdmlkZXIsXHJcbiAgICAgICAgICAgICAgICBtYXBQcm92aWRlcklkID0gdGhpcy5nZXRNYXBQcm92aWRlclR5cGUodXNlck1hcFByb3ZpZGVySWQpID09PSBcImN1c3RvbVwiID8gdXNlck1hcFByb3ZpZGVySWQgOiBkZWZhdWx0TWFwUHJvdmlkZXJJZDtcclxuICAgICAgICAgICAgdGhpcy5jdXJyZW50VXNlciA9IGN1cnJlbnRVc2VyO1xyXG4gICAgICAgICAgICB0aGlzLmN1c3RvbU1hcFByb3ZpZGVycyA9IGVudGl0eVRvRGljdGlvbmFyeShzeXN0ZW1TZXR0aW5ncy5jdXN0b21XZWJNYXBQcm92aWRlckxpc3QpO1xyXG4gICAgICAgICAgICB0aGlzLmlzVW5zaWduZWRBZGRpbnNBbGxvd2VkID0gc3lzdGVtU2V0dGluZ3MuYWxsb3dVbnNpZ25lZEFkZEluO1xyXG4gICAgICAgICAgICB0aGlzLmFkZGlucyA9IHRoaXMuZ2V0QWxsb3dlZEFkZGlucyhzeXN0ZW1TZXR0aW5ncy5jdXN0b21lclBhZ2VzKTtcclxuICAgICAgICAgICAgbGV0IG91dHB1dDogSU1pc2NEYXRhID0ge1xyXG4gICAgICAgICAgICAgICAgbWFwUHJvdmlkZXI6IHtcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogbWFwUHJvdmlkZXJJZCxcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiB0aGlzLmdldE1hcFByb3ZpZGVyVHlwZShtYXBQcm92aWRlcklkKVxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIGN1cnJlbnRVc2VyOiB0aGlzLmN1cnJlbnRVc2VyLFxyXG4gICAgICAgICAgICAgICAgaXNVbnNpZ25lZEFkZGluc0FsbG93ZWQ6IHRoaXMuaXNVbnNpZ25lZEFkZGluc0FsbG93ZWQsXHJcbiAgICAgICAgICAgICAgICBhZGRpbnM6IHRoaXMuYWRkaW5zXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIGlmIChpbmNsdWRlU3lzU2V0dGluZ3MpIHtcclxuICAgICAgICAgICAgICAgIG91dHB1dC5wdXJnZVNldHRpbmdzID0gc3lzdGVtU2V0dGluZ3MucHVyZ2VTZXR0aW5ncztcclxuICAgICAgICAgICAgICAgIG91dHB1dC5lbWFpbFNlbmRlckZyb20gPSBzeXN0ZW1TZXR0aW5ncy5lbWFpbFNlbmRlckZyb207XHJcbiAgICAgICAgICAgICAgICBvdXRwdXQuY3VzdG9tZXJDbGFzc2lmaWNhdGlvbiA9IHN5c3RlbVNldHRpbmdzLmN1c3RvbWVyQ2xhc3NpZmljYXRpb247XHJcbiAgICAgICAgICAgICAgICBvdXRwdXQuaXNNYXJrZXRwbGFjZVB1cmNoYXNlc0FsbG93ZWQgPSBzeXN0ZW1TZXR0aW5ncy5hbGxvd01hcmtldHBsYWNlUHVyY2hhc2VzO1xyXG4gICAgICAgICAgICAgICAgb3V0cHV0LmlzUmVzZWxsZXJBdXRvTG9naW5BbGxvd2VkID0gc3lzdGVtU2V0dGluZ3MuYWxsb3dSZXNlbGxlckF1dG9Mb2dpbjtcclxuICAgICAgICAgICAgICAgIG91dHB1dC5pc1RoaXJkUGFydHlNYXJrZXRwbGFjZUFwcHNBbGxvd2VkID0gc3lzdGVtU2V0dGluZ3MuYWxsb3dUaGlyZFBhcnR5TWFya2V0cGxhY2VBcHBzO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBvdXRwdXQ7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY3VycmVudFRhc2s7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0TWFwUHJvdmlkZXJUeXBlIChtYXBQcm92aWRlcklkOiBzdHJpbmcpOiBUTWFwUHJvdmlkZXJUeXBlIHtcclxuICAgICAgICByZXR1cm4gIW1hcFByb3ZpZGVySWQgfHwgdGhpcy5kZWZhdWx0TWFwUHJvdmlkZXJzW21hcFByb3ZpZGVySWRdID8gXCJkZWZhdWx0XCIgOiBcImN1c3RvbVwiO1xyXG4gICAgfVxyXG5cclxuICAgIGdldE1hcFByb3ZpZGVyTmFtZSAobWFwUHJvdmlkZXJJZDogc3RyaW5nKTogc3RyaW5nIHtcclxuICAgICAgICByZXR1cm4gbWFwUHJvdmlkZXJJZCAmJiAodGhpcy5kZWZhdWx0TWFwUHJvdmlkZXJzW21hcFByb3ZpZGVySWRdIHx8ICh0aGlzLmN1c3RvbU1hcFByb3ZpZGVyc1ttYXBQcm92aWRlcklkXSAmJiB0aGlzLmN1c3RvbU1hcFByb3ZpZGVyc1ttYXBQcm92aWRlcklkXS5uYW1lKSB8fCBtYXBQcm92aWRlcklkKTtcclxuICAgIH1cclxuXHJcbiAgICBnZXRNYXBQcm92aWRlckRhdGEgKG1hcFByb3ZpZGVySWQ6IHN0cmluZykge1xyXG4gICAgICAgIHJldHVybiBtYXBQcm92aWRlcklkICYmIHRoaXMuY3VzdG9tTWFwUHJvdmlkZXJzW21hcFByb3ZpZGVySWRdO1xyXG4gICAgfVxyXG5cclxuICAgIGdldEFkZGluc0RhdGEgKGluY2x1ZGVUaGlzQWRkaW4gPSBmYWxzZSkge1xyXG4gICAgICAgIHJldHVybiAhaW5jbHVkZVRoaXNBZGRpbiA/IHRoaXMuYWRkaW5zLmZpbHRlcihhZGRpbiA9PiAhdGhpcy5pc0N1cnJlbnRBZGRpbihhZGRpbikpIDogdGhpcy5hZGRpbnM7XHJcbiAgICB9XHJcblxyXG4gICAgdW5sb2FkICgpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLmFib3J0Q3VycmVudFRhc2soKTtcclxuICAgIH1cclxufSIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi9ibHVlYmlyZC5kLnRzXCIvPlxyXG5pbXBvcnQgKiBhcyBVdGlscyBmcm9tIFwiLi91dGlsc1wiO1xyXG5cclxuY29uc3QgUkVQT1JUX1RZUEVfREFTSEJPQUQgPSBcIkRhc2hib2FyZFwiO1xyXG5cclxuaW50ZXJmYWNlIElSZXBvcnQge1xyXG4gICAgaWQ6IHN0cmluZztcclxuICAgIGdyb3VwczogSUdyb3VwW107XHJcbiAgICBpbmNsdWRlQWxsQ2hpbGRyZW5Hcm91cHM6IElHcm91cFtdO1xyXG4gICAgaW5jbHVkZURpcmVjdENoaWxkcmVuT25seUdyb3VwczogSUdyb3VwW107XHJcbiAgICBzY29wZUdyb3VwczogSUdyb3VwW107XHJcbiAgICBkZXN0aW5hdGlvbj86IHN0cmluZztcclxuICAgIHRlbXBsYXRlOiBJUmVwb3J0VGVtcGxhdGU7XHJcbiAgICBsYXN0TW9kaWZpZWRVc2VyO1xyXG4gICAgYXJndW1lbnRzOiB7XHJcbiAgICAgICAgcnVsZXM/OiBhbnlbXTtcclxuICAgICAgICBkZXZpY2VzPzogYW55W107XHJcbiAgICAgICAgem9uZVR5cGVMaXN0PzogYW55W107XHJcbiAgICAgICAgW3Byb3BOYW1lOiBzdHJpbmddOiBhbnk7XHJcbiAgICB9O1xyXG4gICAgW3Byb3BOYW1lOiBzdHJpbmddOiBhbnk7XHJcbn1cclxuXHJcbmludGVyZmFjZSBJR3JvdXAge1xyXG4gICAgaWQ6IHN0cmluZztcclxuICAgIGNoaWxkcmVuOiBJR3JvdXBbXTtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBJUmVwb3J0RGVwZW5kZW5jaWVzIHtcclxuICAgIGRldmljZXM/OiBzdHJpbmdbXTtcclxuICAgIHJ1bGVzPzogc3RyaW5nW107XHJcbiAgICB6b25lVHlwZXM/OiBzdHJpbmdbXTtcclxuICAgIGdyb3Vwcz86IHN0cmluZ1tdO1xyXG59XHJcblxyXG5pbnRlcmZhY2UgSVJlcG9ydFRlbXBsYXRlIHtcclxuICAgIGlkOiBzdHJpbmc7XHJcbiAgICBuYW1lOiBzdHJpbmc7XHJcbiAgICBpc1N5c3RlbTogYm9vbGVhbjtcclxuICAgIHJlcG9ydERhdGFTb3VyY2U6IHN0cmluZztcclxuICAgIHJlcG9ydFRlbXBsYXRlVHlwZTogc3RyaW5nO1xyXG4gICAgcmVwb3J0czogSVJlcG9ydFtdO1xyXG4gICAgYmluYXJ5RGF0YT86IHN0cmluZztcclxuICAgIFtwcm9wTmFtZTogc3RyaW5nXTogYW55O1xyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBSZXBvcnRzQnVpbGRlciB7XHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IGFwaTtcclxuICAgIHByaXZhdGUgY3VycmVudFRhc2s7XHJcbiAgICBwcml2YXRlIGFsbFJlcG9ydHM6IElSZXBvcnRbXTtcclxuICAgIHByaXZhdGUgc3RydWN0dXJlZFJlcG9ydHM7XHJcbiAgICBwcml2YXRlIGRhc2hib2FyZHNMZW5ndGg6IG51bWJlcjtcclxuICAgIHByaXZhdGUgYWxsVGVtcGxhdGVzOiBJUmVwb3J0VGVtcGxhdGVbXTtcclxuXHJcbiAgICAvL0dldFJlcG9ydFNjaGVkdWxlcyBpcyBvYnNvbGV0ZVxyXG4gICAgcHJpdmF0ZSBnZXRSZXBvcnRzICgpOiBQcm9taXNlPGFueT4ge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuYXBpLm11bHRpQ2FsbChbXHJcbiAgICAgICAgICAgICAgICBbXCJHZXRSZXBvcnRTY2hlZHVsZXNcIiwge1xyXG4gICAgICAgICAgICAgICAgICAgIFwiaW5jbHVkZVRlbXBsYXRlRGV0YWlsc1wiOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgIFwiYXBwbHlVc2VyRmlsdGVyXCI6IGZhbHNlXHJcbiAgICAgICAgICAgICAgICB9XSxcclxuICAgICAgICAgICAgICAgIFtcIkdldFwiLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgXCJ0eXBlTmFtZVwiOiBcIlJlcG9ydFRlbXBsYXRlXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJzZWFyY2hcIjoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpbmNsdWRlQmluYXJ5RGF0YTogZmFsc2VcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XSxcclxuICAgICAgICAgICAgICAgIFtcIkdldERhc2hib2FyZEl0ZW1zXCIsIHt9XVxyXG4gICAgICAgICAgICBdLCByZXNvbHZlLCByZWplY3QpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgc3RydWN0dXJlUmVwb3J0cyAocmVwb3J0cywgdGVtcGxhdGVzKSB7XHJcbiAgICAgICAgbGV0IGZpbmRUZW1wbGF0ZVJlcG9ydHMgPSAodGVtcGxhdGVJZCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlcG9ydHMuZmlsdGVyKHJlcG9ydCA9PiByZXBvcnQudGVtcGxhdGUuaWQgPT09IHRlbXBsYXRlSWQpO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIHJldHVybiB0ZW1wbGF0ZXMucmVkdWNlKChyZXMsIHRlbXBsYXRlKSA9PiB7XHJcbiAgICAgICAgICAgIGxldCB0ZW1wbGF0ZUlkID0gdGVtcGxhdGUuaWQsXHJcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVJlcG9ydHMgPSBmaW5kVGVtcGxhdGVSZXBvcnRzKHRlbXBsYXRlSWQpO1xyXG4gICAgICAgICAgICBpZiAodGVtcGxhdGVSZXBvcnRzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgdGVtcGxhdGUucmVwb3J0cyA9IHRlbXBsYXRlUmVwb3J0cztcclxuICAgICAgICAgICAgICAgIHJlcy5wdXNoKHRlbXBsYXRlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gcmVzO1xyXG4gICAgICAgIH0sIFtdKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFib3J0Q3VycmVudFRhc2sgKCk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgJiYgdGhpcy5jdXJyZW50VGFzay5hYm9ydCAmJiB0aGlzLmN1cnJlbnRUYXNrLmFib3J0KCk7XHJcbiAgICAgICAgdGhpcy5jdXJyZW50VGFzayA9IG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSB1cGRhdGVUZW1wbGF0ZSAobmV3VGVtcGxhdGVEYXRhOiBJUmVwb3J0VGVtcGxhdGUpIHtcclxuICAgICAgICB0aGlzLmFsbFRlbXBsYXRlcy5zb21lKCh0ZW1wbGF0ZURhdGE6IElSZXBvcnRUZW1wbGF0ZSwgaW5kZXg6IG51bWJlcikgPT4ge1xyXG4gICAgICAgICAgICBpZiAodGVtcGxhdGVEYXRhLmlkID09PSBuZXdUZW1wbGF0ZURhdGEuaWQpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuYWxsVGVtcGxhdGVzW2luZGV4XSA9IG5ld1RlbXBsYXRlRGF0YTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdHJ1Y3RvcihhcGkpIHtcclxuICAgICAgICB0aGlzLmFwaSA9IGFwaTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZmV0Y2ggKCk6IFByb21pc2U8YW55PiB7XHJcbiAgICAgICAgdGhpcy5hYm9ydEN1cnJlbnRUYXNrKCk7XHJcbiAgICAgICAgdGhpcy5jdXJyZW50VGFzayA9IHRoaXMuZ2V0UmVwb3J0cygpXHJcbiAgICAgICAgICAgIC50aGVuKChbcmVwb3J0cywgdGVtcGxhdGVzLCBkYXNoYm9hcmRJdGVtc10pID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMuYWxsUmVwb3J0cyA9IHJlcG9ydHM7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmFsbFRlbXBsYXRlcyA9IHRlbXBsYXRlcztcclxuICAgICAgICAgICAgICAgIHRoaXMuZGFzaGJvYXJkc0xlbmd0aCA9IGRhc2hib2FyZEl0ZW1zICYmIGRhc2hib2FyZEl0ZW1zLmxlbmd0aCA/IGRhc2hib2FyZEl0ZW1zLmxlbmd0aCA6IDA7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnN0cnVjdHVyZWRSZXBvcnRzID0gdGhpcy5zdHJ1Y3R1cmVSZXBvcnRzKHJlcG9ydHMsIHRlbXBsYXRlcyk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zdHJ1Y3R1cmVkUmVwb3J0cztcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgLmNhdGNoKGNvbnNvbGUuZXJyb3IpXHJcbiAgICAgICAgICAgIC5maW5hbGx5KCgpID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudFRhc2sgPSBudWxsO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4gdGhpcy5jdXJyZW50VGFzaztcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0RGVwZW5kZW5jaWVzIChyZXBvcnRzOiBJUmVwb3J0VGVtcGxhdGVbXSk6IElSZXBvcnREZXBlbmRlbmNpZXMge1xyXG4gICAgICAgIGxldCBhbGxEZXBlbmRlbmNpZXM6IElSZXBvcnREZXBlbmRlbmNpZXMgPSB7XHJcbiAgICAgICAgICAgICAgICBkZXZpY2VzOiBbXSxcclxuICAgICAgICAgICAgICAgIHJ1bGVzOiBbXSxcclxuICAgICAgICAgICAgICAgIHpvbmVUeXBlczogW10sXHJcbiAgICAgICAgICAgICAgICBncm91cHM6IFtdXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgcmV0dXJuIHJlcG9ydHMucmVkdWNlKChyZXBvcnRzRGVwZW5kZW5jaWVzOiBJUmVwb3J0RGVwZW5kZW5jaWVzLCB0ZW1wbGF0ZTogSVJlcG9ydFRlbXBsYXRlKSA9PiB7XHJcbiAgICAgICAgICAgIHJldHVybiB0ZW1wbGF0ZS5yZXBvcnRzLnJlZHVjZSgodGVtcGxhdGVEZXBlbmRlY2llcywgcmVwb3J0KSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZURlcGVuZGVjaWVzLmdyb3VwcyA9IFV0aWxzLm1lcmdlVW5pcXVlKHRlbXBsYXRlRGVwZW5kZWNpZXMuZ3JvdXBzLCBVdGlscy5nZXRFbnRpdGllc0lkcyhyZXBvcnQuZ3JvdXBzKSxcclxuICAgICAgICAgICAgICAgICAgICBVdGlscy5nZXRFbnRpdGllc0lkcyhyZXBvcnQuaW5jbHVkZUFsbENoaWxkcmVuR3JvdXBzKSwgVXRpbHMuZ2V0RW50aXRpZXNJZHMocmVwb3J0LmluY2x1ZGVEaXJlY3RDaGlsZHJlbk9ubHlHcm91cHMpLFxyXG4gICAgICAgICAgICAgICAgICAgIFV0aWxzLmdldEVudGl0aWVzSWRzKHJlcG9ydC5zY29wZUdyb3VwcykpO1xyXG4gICAgICAgICAgICAgICAgdGVtcGxhdGVEZXBlbmRlY2llcy5kZXZpY2VzID0gVXRpbHMubWVyZ2VVbmlxdWUodGVtcGxhdGVEZXBlbmRlY2llcy5kZXZpY2VzLCByZXBvcnQuYXJndW1lbnRzICYmIHJlcG9ydC5hcmd1bWVudHMuZGV2aWNlcyAmJiBVdGlscy5nZXRFbnRpdGllc0lkcyhyZXBvcnQuYXJndW1lbnRzLmRldmljZXMpIHx8IFtdKTtcclxuICAgICAgICAgICAgICAgIHRlbXBsYXRlRGVwZW5kZWNpZXMucnVsZXMgPSBVdGlscy5tZXJnZVVuaXF1ZSh0ZW1wbGF0ZURlcGVuZGVjaWVzLnJ1bGVzLCByZXBvcnQuYXJndW1lbnRzICYmIHJlcG9ydC5hcmd1bWVudHMucnVsZXMgJiYgVXRpbHMuZ2V0RW50aXRpZXNJZHMocmVwb3J0LmFyZ3VtZW50cy5ydWxlcykgfHwgW10pO1xyXG4gICAgICAgICAgICAgICAgdGVtcGxhdGVEZXBlbmRlY2llcy56b25lVHlwZXMgPSBVdGlscy5tZXJnZVVuaXF1ZShcclxuICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZURlcGVuZGVjaWVzLnpvbmVUeXBlcywgcmVwb3J0LmFyZ3VtZW50cyAmJiByZXBvcnQuYXJndW1lbnRzLnpvbmVUeXBlTGlzdCAmJiBVdGlscy5nZXRFbnRpdGllc0lkcyhyZXBvcnQuYXJndW1lbnRzLnpvbmVUeXBlTGlzdCkgfHwgW10pO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRlbXBsYXRlRGVwZW5kZWNpZXM7XHJcbiAgICAgICAgICAgIH0sIHJlcG9ydHNEZXBlbmRlbmNpZXMpO1xyXG4gICAgICAgIH0sIGFsbERlcGVuZGVuY2llcyk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldERhdGEgKCk6IFByb21pc2U8SVJlcG9ydFRlbXBsYXRlW10+IHtcclxuICAgICAgICBsZXQgcG9ydGlvblNpemUgPSAxNSxcclxuICAgICAgICAgICAgcG9ydGlvbnMgPSB0aGlzLmFsbFRlbXBsYXRlcy5yZWR1Y2UoKHJlcXVlc3RzLCB0ZW1wbGF0ZTogSVJlcG9ydFRlbXBsYXRlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIXRlbXBsYXRlLmlzU3lzdGVtICYmICF0ZW1wbGF0ZS5iaW5hcnlEYXRhKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHBvcnRpb25JbmRleDogbnVtYmVyID0gcmVxdWVzdHMubGVuZ3RoIC0gMTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIXJlcXVlc3RzW3BvcnRpb25JbmRleF0gfHwgcmVxdWVzdHNbcG9ydGlvbkluZGV4XS5sZW5ndGggPj0gcG9ydGlvblNpemUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICByZXF1ZXN0cy5wdXNoKFtdKTtcclxuICAgICAgICAgICAgICAgICAgICAgICBwb3J0aW9uSW5kZXggKys7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVlc3RzW3BvcnRpb25JbmRleF0ucHVzaChbXCJHZXRcIiwge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBcInR5cGVOYW1lXCI6IFwiUmVwb3J0VGVtcGxhdGVcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCJzZWFyY2hcIjoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IHRlbXBsYXRlLmlkLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5jbHVkZUJpbmFyeURhdGE6IHRydWVcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1dKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiByZXF1ZXN0cztcclxuICAgICAgICAgICAgfSwgW10pLFxyXG4gICAgICAgICAgICB0b3RhbFJlc3VsdHM6IGFueVtdW10gPSBbXSxcclxuICAgICAgICAgICAgZ2V0UG9ydGlvbkRhdGEgPSBwb3J0aW9uID0+IHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZTxhbnk+KChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmFwaS5tdWx0aUNhbGwocG9ydGlvbiwgcmVzb2x2ZSwgcmVqZWN0KTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBlcnJvclBvcnRpb25zID0gW107XHJcblxyXG4gICAgICAgIHRoaXMuYWJvcnRDdXJyZW50VGFzaygpO1xyXG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgPSBwb3J0aW9ucy5yZWR1Y2UoKHByb21pc2VzLCBwb3J0aW9uKSA9PiB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcHJvbWlzZXNcclxuICAgICAgICAgICAgICAgICAgICAudGhlbigoKSA9PiBnZXRQb3J0aW9uRGF0YShwb3J0aW9uKSlcclxuICAgICAgICAgICAgICAgICAgICAudGhlbihyZXN1bHQgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdG90YWxSZXN1bHRzID0gdG90YWxSZXN1bHRzLmNvbmNhdChyZXN1bHQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LCBlID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yUG9ydGlvbnMgPSBlcnJvclBvcnRpb25zLmNvbmNhdChwb3J0aW9uKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICB9LCBVdGlscy5yZXNvbHZlZFByb21pc2UoW10pKVxyXG4gICAgICAgICAgICAudGhlbigoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBlcnJvclBvcnRpb25zLmxlbmd0aCAmJiBjb25zb2xlLndhcm4oZXJyb3JQb3J0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICB0b3RhbFJlc3VsdHMuZm9yRWFjaCh0ZW1wbGF0ZURhdGEgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCB0ZW1wbGF0ZTogSVJlcG9ydFRlbXBsYXRlID0gdGVtcGxhdGVEYXRhLmxlbmd0aCA/IHRlbXBsYXRlRGF0YVswXSA6IHRlbXBsYXRlRGF0YTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZVRlbXBsYXRlKHRlbXBsYXRlKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zdHJ1Y3R1cmVkUmVwb3J0cyA9IHRoaXMuc3RydWN0dXJlUmVwb3J0cyh0aGlzLmFsbFJlcG9ydHMsIHRoaXMuYWxsVGVtcGxhdGVzKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnN0cnVjdHVyZWRSZXBvcnRzO1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAuY2F0Y2goY29uc29sZS5lcnJvcilcclxuICAgICAgICAgICAgLmZpbmFsbHkoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50VGFzayA9IG51bGw7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiB0aGlzLmN1cnJlbnRUYXNrO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXREYXNoYm9hcmRzUXR5ICgpOiBudW1iZXIge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmRhc2hib2FyZHNMZW5ndGg7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldEN1c3RvbWl6ZWRSZXBvcnRzUXR5ICgpOiBudW1iZXIge1xyXG4gICAgICAgIGxldCB0ZW1wbGF0ZXMgPSBbXTtcclxuICAgICAgICByZXR1cm4gKHRoaXMuYWxsUmVwb3J0cy5maWx0ZXIoKHJlcG9ydDogSVJlcG9ydCkgPT4ge1xyXG4gICAgICAgICAgICBsZXQgdGVtcGxhdGVJZCA9IHJlcG9ydC50ZW1wbGF0ZS5pZCxcclxuICAgICAgICAgICAgICAgIHRlbXBsYXRlRXhpc3RzOiBib29sZWFuID0gdGVtcGxhdGVzLmluZGV4T2YodGVtcGxhdGVJZCkgPiAtMSxcclxuICAgICAgICAgICAgICAgIGlzQ291bnQ6IGJvb2xlYW4gPSAhdGVtcGxhdGVFeGlzdHMgJiYgcmVwb3J0Lmxhc3RNb2RpZmllZFVzZXIgIT09IFwiTm9Vc2VySWRcIjtcclxuICAgICAgICAgICAgaXNDb3VudCAmJiB0ZW1wbGF0ZXMucHVzaCh0ZW1wbGF0ZUlkKTtcclxuICAgICAgICAgICAgcmV0dXJuIGlzQ291bnQ7XHJcbiAgICAgICAgfSkpLmxlbmd0aDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgdW5sb2FkICgpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLmFib3J0Q3VycmVudFRhc2soKTtcclxuICAgIH1cclxufSIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi9ibHVlYmlyZC5kLnRzXCIvPlxyXG5pbXBvcnQgeyBzb3J0QXJyYXlPZkVudGl0aWVzLCBlbnRpdHlUb0RpY3Rpb25hcnksIG1lcmdlVW5pcXVlIH0gZnJvbSBcIi4vdXRpbHNcIjtcclxuXHJcbmludGVyZmFjZSBJUnVsZSB7XHJcbiAgICBpZDogc3RyaW5nO1xyXG4gICAgZ3JvdXBzOiBhbnlbXTtcclxuICAgIGNvbmRpdGlvbjogYW55O1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIElSdWxlRGVwZW5kZW5jaWVzIHtcclxuICAgIGRldmljZXM/OiBhbnlbXTtcclxuICAgIHVzZXJzPzogYW55W107XHJcbiAgICB6b25lcz86IGFueVtdO1xyXG4gICAgem9uZVR5cGVzPzogYW55W107XHJcbiAgICB3b3JrVGltZXM/OiBhbnlbXTtcclxuICAgIHdvcmtIb2xpZGF5cz86IGFueVtdO1xyXG4gICAgZ3JvdXBzPzogYW55W107XHJcbiAgICBzZWN1cml0eUdyb3Vwcz86IGFueVtdO1xyXG4gICAgZGlhZ25vc3RpY3M/OiBhbnlbXTtcclxufVxyXG5cclxuY29uc3QgQVBQTElDQVRJT05fUlVMRV9JRCA9IFwiUnVsZUFwcGxpY2F0aW9uRXhjZXB0aW9uSWRcIjtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFJ1bGVzQnVpbGRlciB7XHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IGFwaTtcclxuICAgIHByaXZhdGUgY3VycmVudFRhc2s7XHJcbiAgICBwcml2YXRlIGNvbWJpbmVkUnVsZXM7XHJcbiAgICBwcml2YXRlIHN0cnVjdHVyZWRSdWxlcztcclxuXHJcbiAgICBwcml2YXRlIGdldFJ1bGVzICgpOiBQcm9taXNlPGFueT4ge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuYXBpLmNhbGwoXCJHZXRcIiwge1xyXG4gICAgICAgICAgICAgICAgXCJ0eXBlTmFtZVwiOiBcIlJ1bGVcIlxyXG4gICAgICAgICAgICB9LCByZXNvbHZlLCByZWplY3QpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgc3RydWN0dXJlUnVsZXMgKHJ1bGVzKSB7XHJcbiAgICAgICAgcmV0dXJuIHNvcnRBcnJheU9mRW50aXRpZXMocnVsZXMsIFtbXCJiYXNlVHlwZVwiLCBcImRlc2NcIl0sIFwibmFtZVwiXSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhYm9ydEN1cnJlbnRUYXNrICgpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrICYmIHRoaXMuY3VycmVudFRhc2suYWJvcnQgJiYgdGhpcy5jdXJyZW50VGFzay5hYm9ydCgpO1xyXG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgPSBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0cnVjdG9yKGFwaSkge1xyXG4gICAgICAgIHRoaXMuYXBpID0gYXBpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXREZXBlbmRlbmNpZXMgKHJ1bGVzKTogSVJ1bGVEZXBlbmRlbmNpZXMge1xyXG4gICAgICAgIGxldCBkZXBlbmRlbmNpZXMgPSB7XHJcbiAgICAgICAgICAgICAgICBkZXZpY2VzOiBbXSxcclxuICAgICAgICAgICAgICAgIHVzZXJzOiBbXSxcclxuICAgICAgICAgICAgICAgIHpvbmVzOiBbXSxcclxuICAgICAgICAgICAgICAgIHpvbmVUeXBlczogW10sXHJcbiAgICAgICAgICAgICAgICB3b3JrVGltZXM6IFtdLFxyXG4gICAgICAgICAgICAgICAgZ3JvdXBzOiBbXSxcclxuICAgICAgICAgICAgICAgIGRpYWdub3N0aWNzOiBbXVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBwcm9jZXNzRGVwZW5kZW5jaWVzID0gKGNvbmRpdGlvbikgPT4ge1xyXG4gICAgICAgICAgICAgICAgbGV0IGlkLCB0eXBlOiBzdHJpbmc7XHJcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKGNvbmRpdGlvbi5jb25kaXRpb25UeXBlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIlJ1bGVXb3JrSG91cnNcIjpcclxuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiQWZ0ZXJSdWxlV29ya0hvdXJzXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkID0gKGNvbmRpdGlvbi53b3JrVGltZSAmJiBjb25kaXRpb24ud29ya1RpbWUuaWQpIHx8IGNvbmRpdGlvbi53b3JrVGltZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZSA9IFwid29ya1RpbWVzXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJEcml2ZXJcIjpcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWQgPSBjb25kaXRpb24uZHJpdmVyICYmIGNvbmRpdGlvbi5kcml2ZXIuaWQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGUgPSBcInVzZXJzXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJEZXZpY2VcIjpcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWQgPSBjb25kaXRpb24uZGV2aWNlICYmIGNvbmRpdGlvbi5kZXZpY2UuaWQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGUgPSBcImRldmljZXNcIjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIkVudGVyaW5nQXJlYVwiOlxyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJFeGl0aW5nQXJlYVwiOlxyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJPdXRzaWRlQXJlYVwiOlxyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJJbnNpZGVBcmVhXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjb25kaXRpb24uem9uZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWQgPSBjb25kaXRpb24uem9uZS5pZCB8fCBjb25kaXRpb24uem9uZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGUgPSBcInpvbmVzXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZCA9IGNvbmRpdGlvbi56b25lVHlwZS5pZDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGUgPSBcInpvbmVUeXBlc1wiO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJGaWx0ZXJTdGF0dXNEYXRhQnlEaWFnbm9zdGljXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIkFjdGl2ZU9ySW5hY3RpdmVGYXVsdFwiOlxyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJGYXVsdFwiOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29uZGl0aW9uLmRpYWdub3N0aWMpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkID0gY29uZGl0aW9uLmRpYWdub3N0aWMuaWQgfHwgY29uZGl0aW9uLmRpYWdub3N0aWM7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlID0gXCJkaWFnbm9zdGljc1wiO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWQgJiYgdHlwZSAmJiBkZXBlbmRlbmNpZXNbdHlwZV0uaW5kZXhPZihpZCkgPT09IC0xICYmIGRlcGVuZGVuY2llc1t0eXBlXS5wdXNoKGlkKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgY2hlY2tDb25kaXRpb25zID0gKHBhcmVudENvbmRpdGlvbiwgZGVwZW5kZW5jaWVzOiBJUnVsZURlcGVuZGVuY2llcyk6IElSdWxlRGVwZW5kZW5jaWVzID0+IHtcclxuICAgICAgICAgICAgICAgIGxldCBjb25kaXRpb25zID0gcGFyZW50Q29uZGl0aW9uLmNoaWxkcmVuIHx8IFtdO1xyXG4gICAgICAgICAgICAgICAgcHJvY2Vzc0RlcGVuZGVuY2llcyhwYXJlbnRDb25kaXRpb24pO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbmRpdGlvbnMucmVkdWNlKChkZXBlbmRlbmNpZXMsIGNvbmRpdGlvbikgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChjb25kaXRpb24uY2hpbGRyZW4pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGVwZW5kZW5jaWVzID0gY2hlY2tDb25kaXRpb25zKGNvbmRpdGlvbiwgZGVwZW5kZW5jaWVzKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgcHJvY2Vzc0RlcGVuZGVuY2llcyhjb25kaXRpb24pO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBkZXBlbmRlbmNpZXM7XHJcbiAgICAgICAgICAgICAgICB9LCBkZXBlbmRlbmNpZXMpO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIHJldHVybiBydWxlcy5yZWR1Y2UoKGRlcGVuZGVuY2llczogSVJ1bGVEZXBlbmRlbmNpZXMsIHJ1bGU6IElSdWxlKSA9PiB7XHJcbiAgICAgICAgICAgIGRlcGVuZGVuY2llcy5ncm91cHMgPSBtZXJnZVVuaXF1ZShkZXBlbmRlbmNpZXMuZ3JvdXBzLCBydWxlLmdyb3Vwcy5tYXAoZ3JvdXAgPT4gZ3JvdXAuaWQpKTtcclxuICAgICAgICAgICAgaWYgKHJ1bGUuY29uZGl0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICBkZXBlbmRlbmNpZXMgPSBjaGVja0NvbmRpdGlvbnMocnVsZS5jb25kaXRpb24sIGRlcGVuZGVuY2llcyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIGRlcGVuZGVuY2llcztcclxuICAgICAgICB9LCBkZXBlbmRlbmNpZXMpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBmZXRjaCgpOiBQcm9taXNlPGFueT4ge1xyXG4gICAgICAgIHRoaXMuYWJvcnRDdXJyZW50VGFzaygpO1xyXG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgPSB0aGlzLmdldFJ1bGVzKClcclxuICAgICAgICAgICAgLnRoZW4oKHN3aXRjaGVkT25SdWxlcykgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jb21iaW5lZFJ1bGVzID0gZW50aXR5VG9EaWN0aW9uYXJ5KHN3aXRjaGVkT25SdWxlcyk7XHJcbiAgICAgICAgICAgICAgICBkZWxldGUodGhpcy5jb21iaW5lZFJ1bGVzW0FQUExJQ0FUSU9OX1JVTEVfSURdKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuc3RydWN0dXJlZFJ1bGVzID0gdGhpcy5zdHJ1Y3R1cmVSdWxlcyhPYmplY3Qua2V5cyh0aGlzLmNvbWJpbmVkUnVsZXMpLm1hcChrZXkgPT4gdGhpcy5jb21iaW5lZFJ1bGVzW2tleV0pKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBPYmplY3Qua2V5cyh0aGlzLmNvbWJpbmVkUnVsZXMpLm1hcChydWxlSWQgPT4gdGhpcy5jb21iaW5lZFJ1bGVzW3J1bGVJZF0pO1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAuY2F0Y2goY29uc29sZS5lcnJvcilcclxuICAgICAgICAgICAgLmZpbmFsbHkoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50VGFzayA9IG51bGw7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiB0aGlzLmN1cnJlbnRUYXNrO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXRSdWxlc0RhdGEgKHJ1bGVzSWRzOiBzdHJpbmdbXSk6IElSdWxlW10ge1xyXG4gICAgICAgIHJldHVybiBydWxlc0lkcy5tYXAocnVsZUlkID0+IHRoaXMuY29tYmluZWRSdWxlc1tydWxlSWRdKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgdW5sb2FkICgpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLmFib3J0Q3VycmVudFRhc2soKTtcclxuICAgIH1cclxufSIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi9ibHVlYmlyZC5kLnRzXCIvPlxyXG5pbXBvcnQgR3JvdXBzQnVpbGRlciBmcm9tIFwiLi9ncm91cHNCdWlsZGVyXCI7XHJcbmltcG9ydCAqIGFzIFV0aWxzIGZyb20gXCIuL3V0aWxzXCI7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBTZWN1cml0eUNsZWFyYW5jZXNCdWlsZGVyIGV4dGVuZHMgR3JvdXBzQnVpbGRlciB7XHJcblxyXG4gICAgY29uc3RydWN0b3IoYXBpOiBhbnkpIHtcclxuICAgICAgICBzdXBlcihhcGkpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgZ2V0U2VjdXJpdHlHcm91cHMgKCk6IFByb21pc2U8YW55PiB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5hcGkuZ2V0U2Vzc2lvbigoc2Vzc2lvbkRhdGEpID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMuYXBpLmNhbGwoXCJHZXRcIiwge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlTmFtZTogXCJHcm91cFwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWFyY2g6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkOiBcIkdyb3VwU2VjdXJpdHlJZFwiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9LCByZXNvbHZlLCByZWplY3QpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgcHVibGljIGZldGNoICgpOiBQcm9taXNlPGFueT4ge1xyXG4gICAgICAgIHRoaXMuYWJvcnRDdXJyZW50VGFzaygpO1xyXG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgPSB0aGlzLmdldFNlY3VyaXR5R3JvdXBzKClcclxuICAgICAgICAgICAgLnRoZW4oZ3JvdXBzID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZ3JvdXBzID0gZ3JvdXBzO1xyXG4gICAgICAgICAgICAgICAgdGhpcy50cmVlID0gdGhpcy5jcmVhdGVHcm91cHNUcmVlKGdyb3Vwcyk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRUcmVlID0gVXRpbHMuZXh0ZW5kKHt9LCB0aGlzLnRyZWUpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlRmxhdEdyb3Vwc0xpc3QodGhpcy50cmVlKS5maWx0ZXIoZ3JvdXAgPT4gISFncm91cC5uYW1lKTtcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgLmNhdGNoKGNvbnNvbGUuZXJyb3IpXHJcbiAgICAgICAgICAgIC5maW5hbGx5KCgpID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudFRhc2sgPSBudWxsO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4gdGhpcy5jdXJyZW50VGFzaztcclxuICAgIH07XHJcbn0iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vYmx1ZWJpcmQuZC50c1wiLz5cclxuaW50ZXJmYWNlIElDbGFzc0NvbnRyb2wge1xyXG4gICAgZ2V0OiAoKSA9PiBzdHJpbmc7XHJcbiAgICBzZXQ6IChuYW1lOiBzdHJpbmcpID0+IHZvaWQ7XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgSUVudGl0eSB7XHJcbiAgICBpZDogc3RyaW5nO1xyXG4gICAgW3Byb3BOYW1lOiBzdHJpbmddOiBhbnk7XHJcbn1cclxuXHJcbnR5cGUgSVNvcnRQcm9wZXJ0eSA9IHN0cmluZyB8IFtzdHJpbmcsIFwiYXNjXCIgfCBcImRlc2NcIl07XHJcblxyXG5sZXQgY2xhc3NOYW1lQ3RybCA9IGZ1bmN0aW9uIChlbDogRWxlbWVudCk6IElDbGFzc0NvbnRyb2wge1xyXG4gICAgICAgIHZhciBwYXJhbSA9IHR5cGVvZiBlbC5jbGFzc05hbWUgPT09IFwic3RyaW5nXCIgPyBcImNsYXNzTmFtZVwiIDogXCJiYXNlVmFsXCI7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZWxbcGFyYW1dIHx8IFwiXCI7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHNldDogZnVuY3Rpb24gKHRleHQpIHtcclxuICAgICAgICAgICAgICAgIGVsW3BhcmFtXSA9IHRleHQ7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgfSxcclxuICAgIGlzVXN1YWxPYmplY3QgPSBmdW5jdGlvbiAob2JqKSB7XHJcbiAgICAgICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmopLmluZGV4T2YoXCJPYmplY3RcIikgIT09IC0xO1xyXG4gICAgfTtcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgSUhhc2gge1xyXG4gICAgW2lkOiBzdHJpbmddOiBhbnk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiByZW1vdmVDbGFzcyhlbDogRWxlbWVudCwgbmFtZTogc3RyaW5nKTogdm9pZCB7XHJcbiAgICBpZiAoIWVsKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgbGV0IGNsYXNzZXNTdHIgPSBjbGFzc05hbWVDdHJsKGVsKS5nZXQoKSxcclxuICAgICAgICBjbGFzc2VzID0gY2xhc3Nlc1N0ci5zcGxpdChcIiBcIiksXHJcbiAgICAgICAgbmV3Q2xhc3NlcyA9IGNsYXNzZXMuZmlsdGVyKGNsYXNzSXRlbSA9PiBjbGFzc0l0ZW0gIT09IG5hbWUpO1xyXG4gICAgY2xhc3NOYW1lQ3RybChlbCkuc2V0KG5ld0NsYXNzZXMuam9pbihcIiBcIikpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gYWRkQ2xhc3MoZWwsIG5hbWUpOiB2b2lkIHtcclxuICAgIGlmICghZWwpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICBsZXQgY2xhc3Nlc1N0ciA9IGNsYXNzTmFtZUN0cmwoZWwpLmdldCgpLFxyXG4gICAgICAgIGNsYXNzZXMgPSBjbGFzc2VzU3RyLnNwbGl0KFwiIFwiKTtcclxuICAgIGlmIChjbGFzc2VzLmluZGV4T2YobmFtZSkgPT09IC0xKSB7XHJcbiAgICAgICAgY2xhc3NOYW1lQ3RybChlbCkuc2V0KGNsYXNzZXNTdHIgKyBcIiBcIiArIG5hbWUpO1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gaGFzQ2xhc3MoZWw6IEVsZW1lbnQsIGNsYXNzTmFtZTogc3RyaW5nKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gZWwgJiYgY2xhc3NOYW1lQ3RybChlbCkuZ2V0KCkuaW5kZXhPZihjbGFzc05hbWUpICE9PSAtMTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGV4dGVuZCguLi5hcmdzOiBhbnlbXSkge1xyXG4gICAgdmFyIGxlbmd0aCA9IGFyZ3MubGVuZ3RoLFxyXG4gICAgICAgIHNyYywgc3JjS2V5cywgc3JjQXR0cixcclxuICAgICAgICBmdWxsQ29weSA9IGZhbHNlLFxyXG4gICAgICAgIHJlc0F0dHIsXHJcbiAgICAgICAgcmVzID0gYXJnc1swXSwgaSA9IDEsIGo7XHJcblxyXG4gICAgaWYgKHR5cGVvZiByZXMgPT09IFwiYm9vbGVhblwiKSB7XHJcbiAgICAgICAgZnVsbENvcHkgPSByZXM7XHJcbiAgICAgICAgcmVzID0gYXJnc1sxXTtcclxuICAgICAgICBpKys7XHJcbiAgICB9XHJcbiAgICB3aGlsZSAoaSAhPT0gbGVuZ3RoKSB7XHJcbiAgICAgICAgc3JjID0gYXJnc1tpXTtcclxuICAgICAgICBzcmNLZXlzID0gT2JqZWN0LmtleXMoc3JjKTtcclxuICAgICAgICBmb3IgKGogPSAwOyBqIDwgc3JjS2V5cy5sZW5ndGg7IGorKykge1xyXG4gICAgICAgICAgICBzcmNBdHRyID0gc3JjW3NyY0tleXNbal1dO1xyXG4gICAgICAgICAgICBpZiAoZnVsbENvcHkgJiYgKGlzVXN1YWxPYmplY3Qoc3JjQXR0cikgfHwgQXJyYXkuaXNBcnJheShzcmNBdHRyKSkpIHtcclxuICAgICAgICAgICAgICAgIHJlc0F0dHIgPSByZXNbc3JjS2V5c1tqXV07XHJcbiAgICAgICAgICAgICAgICByZXNBdHRyID0gcmVzW3NyY0tleXNbal1dID0gKGlzVXN1YWxPYmplY3QocmVzQXR0cikgfHwgQXJyYXkuaXNBcnJheShyZXNBdHRyKSkgPyByZXNBdHRyIDogKEFycmF5LmlzQXJyYXkoc3JjQXR0cikgPyBbXSA6IHt9KTtcclxuICAgICAgICAgICAgICAgIGV4dGVuZChmdWxsQ29weSwgcmVzQXR0ciwgc3JjQXR0cik7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZXNbc3JjS2V5c1tqXV0gPSBzcmNbc3JjS2V5c1tqXV07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgaSsrO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHJlcztcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGVudGl0eVRvRGljdGlvbmFyeShlbnRpdGllczogYW55W10sIGVudGl0eUNhbGxiYWNrPzogKGVudGl0eTogYW55KSA9PiBhbnkpOiBJSGFzaCB7XHJcbiAgICB2YXIgZW50aXR5LCBvID0ge30sIGksXHJcbiAgICAgICAgbCA9IGVudGl0aWVzLmxlbmd0aDtcclxuXHJcbiAgICBmb3IgKGkgPSAwOyBpIDwgbDsgaSsrKSB7XHJcbiAgICAgICAgaWYgKGVudGl0aWVzW2ldKSB7XHJcbiAgICAgICAgICAgIGVudGl0eSA9IGVudGl0aWVzW2ldLmlkID8gZW50aXRpZXNbaV0gOiB7aWQ6IGVudGl0aWVzW2ldfTtcclxuICAgICAgICAgICAgb1tlbnRpdHkuaWRdID0gZW50aXR5Q2FsbGJhY2sgPyBlbnRpdHlDYWxsYmFjayhlbnRpdHkpIDogZW50aXR5O1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBvO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gc29ydEFycmF5T2ZFbnRpdGllcyhlbnRpdGllczogYW55W10sIHNvcnRpbmdGaWVsZHM6IElTb3J0UHJvcGVydHlbXSk6IGFueVtdIHtcclxuICAgIGxldCBjb21wYXJhdG9yID0gKHByZXZJdGVtLCBuZXh0SXRlbSwgcHJvcGVydGllczogYW55W10sIGluZGV4ID0gMCkgPT4ge1xyXG4gICAgICAgIGlmIChwcm9wZXJ0aWVzLmxlbmd0aCA8PSBpbmRleCkge1xyXG4gICAgICAgICAgICByZXR1cm4gMDtcclxuICAgICAgICB9XHJcbiAgICAgICAgbGV0IG9wdGlvbnMgPSBwcm9wZXJ0aWVzW2luZGV4XSxcclxuICAgICAgICAgICAgW3Byb3BlcnR5LCBkaXIgPSBcImFzY1wiXSA9IEFycmF5LmlzQXJyYXkob3B0aW9ucykgPyBvcHRpb25zIDogW29wdGlvbnNdLFxyXG4gICAgICAgICAgICBkaXJNdWx0aXBsaWVyOiBudW1iZXI7XHJcbiAgICAgICAgZGlyTXVsdGlwbGllciA9IGRpciA9PT0gXCJhc2NcIiA/IDEgOiAtMTtcclxuICAgICAgICBpZiAocHJldkl0ZW1bcHJvcGVydHldID4gbmV4dEl0ZW1bcHJvcGVydHldKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAxICogZGlyTXVsdGlwbGllcjtcclxuICAgICAgICB9IGVsc2UgaWYgKHByZXZJdGVtW3Byb3BlcnR5XSA8IG5leHRJdGVtW3Byb3BlcnR5XSkge1xyXG4gICAgICAgICAgICByZXR1cm4gLTEgKiBkaXJNdWx0aXBsaWVyO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHJldHVybiBjb21wYXJhdG9yKHByZXZJdGVtLCBuZXh0SXRlbSwgcHJvcGVydGllcywgaW5kZXggKyAxKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG4gICAgcmV0dXJuIGVudGl0aWVzLnNvcnQoKHByZXZUZW1wbGF0ZSwgbmV4dFRlbXBsYXRlKSA9PiB7XHJcbiAgICAgICAgcmV0dXJuIGNvbXBhcmF0b3IocHJldlRlbXBsYXRlLCBuZXh0VGVtcGxhdGUsIHNvcnRpbmdGaWVsZHMpO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBkb3dubG9hZERhdGFBc0ZpbGUoZGF0YTogc3RyaW5nLCBmaWxlbmFtZTogc3RyaW5nLCBtaW1lVHlwZSA9IFwidGV4dC9qc29uXCIpIHtcclxuICAgIGxldCBibG9iID0gbmV3IEJsb2IoW2RhdGFdLCB7dHlwZTogbWltZVR5cGV9KSxcclxuICAgICAgICBlbGVtO1xyXG4gICAgaWYgKHdpbmRvdy5uYXZpZ2F0b3IubXNTYXZlT3JPcGVuQmxvYikge1xyXG4gICAgICAgIHdpbmRvdy5uYXZpZ2F0b3IubXNTYXZlQmxvYihibG9iLCBmaWxlbmFtZSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIGVsZW0gPSB3aW5kb3cuZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImFcIik7XHJcbiAgICAgICAgZWxlbS5ocmVmID0gd2luZG93LlVSTC5jcmVhdGVPYmplY3RVUkwoYmxvYik7XHJcbiAgICAgICAgZWxlbS5kb3dubG9hZCA9IGZpbGVuYW1lO1xyXG4gICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoZWxlbSk7XHJcbiAgICAgICAgZWxlbS5jbGljaygpO1xyXG4gICAgICAgIGRvY3VtZW50LmJvZHkucmVtb3ZlQ2hpbGQoZWxlbSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBtZXJnZVVuaXF1ZUVudGl0aWVzICguLi5zb3VyY2VzOiBJRW50aXR5W11bXSk6IElFbnRpdHlbXSB7XHJcbiAgICBsZXQgYWRkZWRJZHM6IHN0cmluZ1tdID0gW10sXHJcbiAgICAgICAgbWVyZ2VkSXRlbXM6IElFbnRpdHlbXSA9IFtdO1xyXG4gICAgc291cmNlcy5mb3JFYWNoKHNvdXJjZSA9PiBzb3VyY2UuZm9yRWFjaChpdGVtID0+IHtcclxuICAgICAgICBpZiAoaXRlbSAmJiBpdGVtLmlkICYmIGFkZGVkSWRzLmluZGV4T2YoaXRlbS5pZCkgPT09IC0xKSB7XHJcbiAgICAgICAgICAgIGFkZGVkSWRzLnB1c2goaXRlbS5pZCk7XHJcbiAgICAgICAgICAgIG1lcmdlZEl0ZW1zLnB1c2goaXRlbSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSkpO1xyXG4gICAgcmV0dXJuIG1lcmdlZEl0ZW1zO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0RW50aXRpZXNJZHMgKGVudGl0aWVzTGlzdDogSUVudGl0eVtdKTogc3RyaW5nW10ge1xyXG4gICAgcmV0dXJuIEFycmF5LmlzQXJyYXkoZW50aXRpZXNMaXN0KSAmJiBlbnRpdGllc0xpc3QucmVkdWNlKChyZXN1bHQsIGVudGl0eSkgPT4ge1xyXG4gICAgICAgIGVudGl0eSAmJiBlbnRpdHkuaWQgJiYgcmVzdWx0LnB1c2goZW50aXR5LmlkKTtcclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfSwgW10pIHx8IFtdO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbWVyZ2VVbmlxdWUgKC4uLnNvdXJjZXM6IHN0cmluZ1tdW10pOiBzdHJpbmdbXSB7XHJcbiAgICBsZXQgbWVyZ2VkSXRlbXM6IHN0cmluZ1tdID0gW107XHJcbiAgICBzb3VyY2VzLmZvckVhY2goc291cmNlID0+IHtcclxuICAgICAgICBBcnJheS5pc0FycmF5KHNvdXJjZSkgJiYgc291cmNlLmZvckVhY2goaXRlbSA9PiB7XHJcbiAgICAgICAgICAgIGl0ZW0gJiYgbWVyZ2VkSXRlbXMuaW5kZXhPZihpdGVtKSA9PT0gLTEgJiYgbWVyZ2VkSXRlbXMucHVzaChpdGVtKTtcclxuICAgICAgICB9KTtcclxuICAgIH0pO1xyXG4gICAgcmV0dXJuIG1lcmdlZEl0ZW1zO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0VW5pcXVlRW50aXRpZXMgKG5ld0VudGl0aWVzOiBJRW50aXR5W10sIGV4aXN0ZWRFbnRpdGllczogSUVudGl0eVtdKTogSUVudGl0eVtdIHtcclxuICAgIGxldCBzZWxlY3RlZEVudGl0aWVzSGFzaCA9IGVudGl0eVRvRGljdGlvbmFyeShleGlzdGVkRW50aXRpZXMpO1xyXG4gICAgcmV0dXJuIG5ld0VudGl0aWVzLnJlZHVjZSgocmVzLCBlbnRpdHkpID0+IHtcclxuICAgICAgICAhc2VsZWN0ZWRFbnRpdGllc0hhc2hbZW50aXR5LmlkXSAmJiByZXMucHVzaChlbnRpdHkpO1xyXG4gICAgICAgIHJldHVybiByZXM7XHJcbiAgICB9LCBbXSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB0b2dldGhlcihwcm9taXNlczogUHJvbWlzZTxhbnk+W10pOiBQcm9taXNlPGFueT4ge1xyXG4gICAgbGV0IHJlc3VsdHMgPSBbXSxcclxuICAgICAgICByZXN1bHRzQ291bnQgPSAwO1xyXG4gICAgcmVzdWx0cy5sZW5ndGggPSBwcm9taXNlcy5sZW5ndGg7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgIGxldCByZXNvbHZlQWxsID0gKCkgPT4ge1xyXG4gICAgICAgICAgICByZXR1cm4gcmVzb2x2ZShyZXN1bHRzKTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIHByb21pc2VzLmxlbmd0aCA/IHByb21pc2VzLmZvckVhY2goKHByb21pc2UsIGluZGV4KSA9PiB7XHJcbiAgICAgICAgICAgIHByb21pc2UudGhlbigocmVzdWx0KSA9PiB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHRzQ291bnQrKztcclxuICAgICAgICAgICAgICAgIHJlc3VsdHNbaW5kZXhdID0gcmVzdWx0O1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0c0NvdW50ID09PSBwcm9taXNlcy5sZW5ndGggJiYgcmVzb2x2ZUFsbCgpO1xyXG4gICAgICAgICAgICB9KS5jYXRjaCgoZXJyb3IpID0+IHtcclxuICAgICAgICAgICAgICAgIHJlamVjdCh7XHJcbiAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGVycm9yLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb21pc2VJbmRleDogaW5kZXhcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KSA6IHJlc29sdmVBbGwoKTtcclxuICAgIH0pO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcmVzb2x2ZWRQcm9taXNlPFQ+ICh2YWw/OiBUKTogUHJvbWlzZTxUPiB7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2U8VD4ocmVzb2x2ZSA9PiByZXNvbHZlKHZhbCkpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gdG9BcnJheSAoZGF0YSkge1xyXG4gICAgcmV0dXJuIEFycmF5LmlzQXJyYXkoZGF0YSkgPyBkYXRhIDogW2RhdGFdO1xyXG59IiwiZXhwb3J0IGRlZmF1bHQgY2xhc3MgV2FpdGluZyB7XHJcblxyXG4gICAgcHJpdmF0ZSB3YWl0aW5nQ29udGFpbmVyOiBIVE1MRWxlbWVudDtcclxuICAgIHByaXZhdGUgYm9keUVsOiBIVE1MRWxlbWVudCA9IGRvY3VtZW50LmJvZHk7XHJcblxyXG4gICAgcHVibGljIHN0YXJ0KGVsOiBIVE1MRWxlbWVudCA9IHRoaXMuYm9keUVsLCB6SW5kZXg/OiBudW1iZXIpIHtcclxuICAgICAgICBpZiAoZWwub2Zmc2V0UGFyZW50ID09PSBudWxsKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy53YWl0aW5nQ29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcclxuICAgICAgICB0aGlzLndhaXRpbmdDb250YWluZXIuY2xhc3NOYW1lID0gXCJ3YWl0aW5nXCI7XHJcbiAgICAgICAgdGhpcy53YWl0aW5nQ29udGFpbmVyLmlubmVySFRNTCA9IFwiPGRpdiBjbGFzcz0nZmFkZXInPjwvZGl2PjxkaXYgY2xhc3M9J3NwaW5uZXInPjwvZGl2PlwiO1xyXG4gICAgICAgIGVsLnBhcmVudE5vZGUuYXBwZW5kQ2hpbGQodGhpcy53YWl0aW5nQ29udGFpbmVyKTtcclxuXHJcbiAgICAgICAgdGhpcy53YWl0aW5nQ29udGFpbmVyLnN0eWxlLnBvc2l0aW9uID0gXCJhYnNvbHV0ZVwiO1xyXG4gICAgICAgIHRoaXMud2FpdGluZ0NvbnRhaW5lci5zdHlsZS53aWR0aCA9IGVsLm9mZnNldFdpZHRoICsgXCJweFwiO1xyXG4gICAgICAgIHRoaXMud2FpdGluZ0NvbnRhaW5lci5zdHlsZS5oZWlnaHQgPSBlbC5vZmZzZXRIZWlnaHQgKyBcInB4XCI7XHJcbiAgICAgICAgdGhpcy53YWl0aW5nQ29udGFpbmVyLnN0eWxlLnRvcCA9IGVsLm9mZnNldFRvcCArIFwicHhcIjtcclxuICAgICAgICB0aGlzLndhaXRpbmdDb250YWluZXIuc3R5bGUubGVmdCA9IGVsLm9mZnNldExlZnQgKyBcInB4XCI7XHJcbiAgICAgICAgdGhpcy53YWl0aW5nQ29udGFpbmVyLnN0eWxlLmRpc3BsYXkgPSBcImJsb2NrXCI7XHJcbiAgICAgICAgdHlwZW9mIHpJbmRleCA9PT0gXCJudW1iZXJcIiAmJiAodGhpcy53YWl0aW5nQ29udGFpbmVyLnN0eWxlLnpJbmRleCA9IHpJbmRleC50b1N0cmluZygpKTtcclxuICAgIH07XHJcblxyXG4gICAgcHVibGljIHN0b3AgKCkge1xyXG4gICAgICAgIGlmICh0aGlzLndhaXRpbmdDb250YWluZXIgJiYgdGhpcy53YWl0aW5nQ29udGFpbmVyLnBhcmVudE5vZGUpIHtcclxuICAgICAgICAgICAgdGhpcy53YWl0aW5nQ29udGFpbmVyLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQodGhpcy53YWl0aW5nQ29udGFpbmVyKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG59IiwiLy9hZGRlZCBieSBCcmV0dCB0byBtYW5hZ2UgYWRkaW5nIGFsbCB6b25lcyB0byB0aGUgZXhwb3J0IGFzIGFuIG9wdGlvblxyXG5cclxuZXhwb3J0IGNsYXNzIFpvbmVCdWlsZGVyIHtcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgYXBpO1xyXG4gICAgcHJpdmF0ZSBjdXJyZW50VGFzaztcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihhcGkpIHtcclxuICAgICAgICB0aGlzLmFwaSA9IGFwaTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFib3J0Q3VycmVudFRhc2sgKCkge1xyXG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgJiYgdGhpcy5jdXJyZW50VGFzay5hYm9ydCAmJiB0aGlzLmN1cnJlbnRUYXNrLmFib3J0KCk7XHJcbiAgICAgICAgdGhpcy5jdXJyZW50VGFzayA9IG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgLy9maWxscyB0aGUgdXNlciBidWlsZGVyIHdpdGggYWxsIHVzZXJzXHJcbiAgICBmZXRjaCAoKTogUHJvbWlzZTxhbnk+IHtcclxuICAgICAgICB0aGlzLmFib3J0Q3VycmVudFRhc2soKTtcclxuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrID0gdGhpcy5nZXRab25lcygpXHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY3VycmVudFRhc2s7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBnZXRab25lcyAoKTogUHJvbWlzZTxhbnk+IHtcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLmFwaS5jYWxsKFwiR2V0XCIsIHtcclxuICAgICAgICAgICAgICAgIFwidHlwZU5hbWVcIjogXCJab25lXCJcclxuICAgICAgICAgICAgfSwgcmVzb2x2ZSwgcmVqZWN0KTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICB1bmxvYWQgKCk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMuYWJvcnRDdXJyZW50VGFzaygpO1xyXG4gICAgfVxyXG59Il19
