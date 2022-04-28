(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
/// <reference path="./addin.d.ts" />
/// <reference path="../bluebird.d.ts"/>
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
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
                (0, utils_1.downloadDataAsFile)(JSON.stringify(_this.data), "export.json");
            })["catch"](function (e) {
                alert("Can't export data.\nPlease try again later.");
                console.error(e);
            })["finally"](function () { return _this.toggleWaiting(); });
        };
        this.saveChanges = function () {
            _this.render();
        };
        this.checkBoxValueChanged = function () {
            _this.toggleExportButton(true);
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
            dependencies[dependencyName] = utils_1.mergeUnique.apply(void 0, __spreadArray([dependencies[dependencyName]], allDependencies.map(function (entityDependencies) { return entityDependencies[dependencyName]; }), false));
            return dependencies;
        }, total);
    };
    Addin.prototype.addNewGroups = function (groups, data) {
        if (!groups.length) {
            return (0, utils_1.resolvedPromise)();
        }
        var groupsData = this.groupsBuilder.getGroupsData(groups, true), newGroupsUsers = (0, utils_1.getUniqueEntities)(this.groupsBuilder.getPrivateGroupsUsers(groupsData), data.users);
        data.groups = (0, utils_1.mergeUniqueEntities)(data.groups, groupsData);
        data.users = (0, utils_1.mergeUniqueEntities)(data.users, newGroupsUsers);
        return this.resolveDependencies({ users: (0, utils_1.getEntitiesIds)(newGroupsUsers) }, data);
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
        data.customMaps = (0, utils_1.mergeUniqueEntities)(data.customMaps, customMapsData);
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
        data.notificationTemplates = (0, utils_1.mergeUniqueEntities)(data.notificationTemplates, notificationTemplatesData);
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
            return _this.addNewGroups(entitiesList.groups || [], data).then(function () {
                _this.addNewCustomMaps(entitiesList.customMaps || [], data);
                _this.addNewNotificationTemplates(entitiesList.notificationTemplates || [], data);
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
                                if (entityType === "workHolidays" && (!item.holidayGroup || (entitiesList.workHolidays || []).indexOf(item.holidayGroup.groupId) === -1)) {
                                    return false;
                                }
                                if (entityType === "workTimes" && !item.details) {
                                    return false;
                                }
                                if (entityType === "securityGroups") {
                                    if ((entitiesList.securityGroups || []).indexOf(item.id) > -1) {
                                        result[entityType] = result[entityType].concat(_this.groupsBuilder.getCustomGroupsData(entitiesList.securityGroups || [], items));
                                        return result;
                                    }
                                    return false;
                                }
                                var entityDependencies = _this.getEntityDependencies(item, entityType);
                                newDependencies = _this.applyToEntities(entityDependencies, newDependencies, function (result, entityId, entityType) {
                                    !result[entityType] && (result[entityType] = []);
                                    result[entityType] = (0, utils_1.mergeUnique)(result[entityType], [entityId]);
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
                                data[entityType] = (0, utils_1.mergeUniqueEntities)(data[entityType], exportedData[entityType]);
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
        var mapMessageTemplate = document.getElementById("mapMessageTemplate").innerHTML, groupsBlock = document.getElementById("exportedGroups"), securityClearancesBlock = document.getElementById("exportedSecurityClearances"), rulesBlock = document.getElementById("exportedRules"), reportsBlock = document.getElementById("exportedReports"), dashboardsBlock = document.getElementById("exportedDashboards"), addinsBlock = document.getElementById("exportedAddins"), mapBlockDescription = document.querySelector("#exportedMap .description"), 
        // usersBlock: HTMLElement = document.getElementById("exportedUsers"),
        zonesBlock = document.getElementById("exportedZones"), systemSettingsBlock = document.getElementById("exportSystemSettings");
        this.toggleWaiting(true);
        return (0, utils_1.together)([
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
            customMap = _this.data.misc && _this.miscBuilder.getMapProviderData(_this.data.misc.mapProvider.value);
            customMap && _this.data.customMaps.push(customMap);
            reportsDependencies = _this.reportsBuilder.getDependencies(_this.data.reports);
            rulesDependencies = _this.rulesBuilder.getDependencies(_this.data.rules);
            distributionListsDependencies = _this.distributionListsBuilder.getDependencies(_this.data.distributionLists);
            dependencies = _this.combineDependencies(zoneDependencies, reportsDependencies, rulesDependencies, distributionListsDependencies);
            return _this.resolveDependencies(dependencies, _this.data);
        }).then(function () {
            var _a, _b;
            var mapProvider = _this.data.misc && _this.miscBuilder.getMapProviderName(_this.data.misc.mapProvider.value);
            _this.showEntityMessage(groupsBlock, _this.data.groups.length - 1, "group");
            _this.showEntityMessage(securityClearancesBlock, _this.data.securityGroups.length, "security clearance");
            _this.showEntityMessage(rulesBlock, _this.data.rules.length, "rule");
            _this.showEntityMessage(reportsBlock, _this.reportsBuilder.getCustomizedReportsQty(), "report");
            _this.showEntityMessage(dashboardsBlock, _this.reportsBuilder.getDashboardsQty(), "dashboard");
            if (mapProvider) {
                mapBlockDescription.innerHTML = mapMessageTemplate.replace("{mapProvider}", mapProvider);
            }
            _this.showEntityMessage(addinsBlock, ((_b = (_a = _this.data.misc) === null || _a === void 0 ? void 0 : _a.addins) === null || _b === void 0 ? void 0 : _b.length) || 0, "addin");
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

},{"./distributionListsBuilder":2,"./groupsBuilder":3,"./miscBuilder":4,"./reportsBuilder":5,"./rulesBuilder":6,"./securityClearancesBuilder":8,"./utils":9,"./waiting":10,"./zoneBuilder":11}],2:[function(require,module,exports){
"use strict";
exports.__esModule = true;
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
            var id = undefined;
            var type = undefined;
            var userId = recipient.user.id;
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
            dependencies.rules = (0, utils_1.mergeUnique)(dependencies.rules, distributionList.rules.map(function (rule) { return rule.id; }));
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
            _this.distributionLists = (0, utils_1.entityToDictionary)(distributionLists);
            _this.notificationTemplates = (0, utils_1.entityToDictionary)(webTemplates.concat(emailTemplates).concat(textTemplates));
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

},{"./utils":9}],3:[function(require,module,exports){
"use strict";
exports.__esModule = true;
/// <reference path="../bluebird.d.ts"/>
var utils_1 = require("./utils");
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
        nodeLookup = (0, utils_1.entityToDictionary)(groups, function (entity) {
            var newEntity = (0, utils_1.extend)({}, entity);
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
            _this.currentTree = (0, utils_1.extend)({}, _this.tree);
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
            var itemCopy = (0, utils_1.extend)({}, item);
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
                    childCopy = (0, utils_1.extend)({}, child);
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

},{"./utils":9}],4:[function(require,module,exports){
"use strict";
exports.__esModule = true;
exports.MiscBuilder = void 0;
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
            _this.customMapProviders = (0, utils_1.entityToDictionary)(systemSettings.customWebMapProviderList);
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

},{"./utils":9}],5:[function(require,module,exports){
"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
exports.__esModule = true;
var scopeGroupFilter_1 = require("./scopeGroupFilter");
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
    ReportsBuilder.prototype.populateScopeGroupFilters = function (reports) {
        var _this = this;
        var requests = reports.reduce(function (res, report) {
            if (report.scopeGroupFilter && report.scopeGroupFilter.id) {
                res.push(["Get", {
                        "typeName": "GroupFilter",
                        "search": {
                            id: report.scopeGroupFilter.id
                        }
                    }]);
            }
            return res;
        }, []);
        return new Promise(function (resolve, reject) {
            _this.api.multiCall(requests, function (groupFilters) {
                var enpackedFilter = groupFilters.map(function (item) { return Array.isArray(item) ? item[0] : item; });
                var scopeGroupFilterHash = Utils.entityToDictionary(enpackedFilter);
                resolve(reports.map(function (report) {
                    return __assign(__assign({}, report), { scopeGroupFilter: report.scopeGroupFilter && scopeGroupFilterHash[report.scopeGroupFilter.id] });
                }));
            }, reject);
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
            var reports = _a[0], rest = _a.slice(1);
            return Promise.all(__spreadArray([_this.populateScopeGroupFilters(reports)], rest, true));
        })
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
            groups: [],
            users: []
        };
        return reports.reduce(function (reportsDependencies, template) {
            return template.reports.reduce(function (templateDependecies, report) {
                templateDependecies.groups =
                    Utils.mergeUnique(templateDependecies.groups, Utils.getEntitiesIds(report.groups), Utils.getEntitiesIds(report.includeAllChildrenGroups), Utils.getEntitiesIds(report.includeDirectChildrenOnlyGroups), Utils.getEntitiesIds(report.scopeGroups), Utils.getEntitiesIds(report.scopeGroupFilter && (0, scopeGroupFilter_1.getFilterStateUniqueGroups)(report.scopeGroupFilter.groupFilterCondition) || []));
                templateDependecies.users = Utils.mergeUnique(templateDependecies.users, report.individualRecipients && Utils.getEntitiesIds(report.individualRecipients) || []);
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

},{"./scopeGroupFilter":7,"./utils":9}],6:[function(require,module,exports){
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
        return (0, utils_1.sortArrayOfEntities)(rules, [["baseType", "desc"], "name"]);
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
            workHolidays: [],
            groups: [],
            diagnostics: [],
            securityGroups: []
        }, processDependencies = function (condition) {
            var id = undefined;
            var type = undefined;
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
            dependencies.groups = (0, utils_1.mergeUnique)(dependencies.groups, rule.groups.map(function (group) { return group.id; }));
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
            _this.combinedRules = (0, utils_1.entityToDictionary)(switchedOnRules);
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

},{"./utils":9}],7:[function(require,module,exports){
"use strict";
/// <reference path="../bluebird.d.ts"/>
exports.__esModule = true;
exports.getFilterStateUniqueGroups = exports.isFilterState = exports.getScopeGroupFilterById = void 0;
var getScopeGroupFilterById = function (id, api) {
    return new Promise(function (resolve, reject) {
        api.call("Get", {
            typeName: "GroupFilter",
            search: { id: id }
        }, resolve, reject);
    });
};
exports.getScopeGroupFilterById = getScopeGroupFilterById;
var isFilterState = function (item) { return item && item.relation !== undefined; };
exports.isFilterState = isFilterState;
var getFilterStateUniqueGroups = function (state) {
    var groupIds = [];
    var processItem = function (item, prevRes) {
        if (prevRes === void 0) { prevRes = []; }
        return item.groupFilterConditions.reduce(function (res, childItem) {
            if ((0, exports.isFilterState)(childItem)) {
                return processItem(childItem, res);
            }
            var id = childItem.groupId;
            groupIds.indexOf(id) === -1 && res.push({ id: id });
            groupIds.push(id);
            return res;
        }, prevRes);
    };
    return (0, exports.isFilterState)(state) ? processItem(state) : [{ id: state.groupId }];
};
exports.getFilterStateUniqueGroups = getFilterStateUniqueGroups;

},{}],8:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
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

},{"./groupsBuilder":3,"./utils":9}],9:[function(require,module,exports){
"use strict";
exports.__esModule = true;
exports.toArray = exports.resolvedPromise = exports.together = exports.getUniqueEntities = exports.mergeUnique = exports.getEntitiesIds = exports.mergeUniqueEntities = exports.downloadDataAsFile = exports.sortArrayOfEntities = exports.entityToDictionary = exports.extend = exports.hasClass = exports.addClass = exports.removeClass = void 0;
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
    elem = window.document.createElement("a");
    elem.href = window.URL.createObjectURL(blob);
    elem.download = filename;
    document.body.appendChild(elem);
    elem.click();
    document.body.removeChild(elem);
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

},{}],10:[function(require,module,exports){
"use strict";
exports.__esModule = true;
var Waiting = /** @class */ (function () {
    function Waiting() {
        this.bodyEl = document.body;
    }
    Waiting.prototype.start = function (el, zIndex) {
        var _a;
        if (el === void 0) { el = this.bodyEl; }
        if (el.offsetParent === null) {
            return false;
        }
        this.waitingContainer = document.createElement("div");
        this.waitingContainer.className = "waiting";
        this.waitingContainer.innerHTML = "<div class='fader'></div><div class='spinner'></div>";
        (_a = el.parentNode) === null || _a === void 0 ? void 0 : _a.appendChild(this.waitingContainer);
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

},{}],11:[function(require,module,exports){
"use strict";
//added by Brett to manage adding all zones to the export as an option
exports.__esModule = true;
exports.ZoneBuilder = void 0;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzb3VyY2VzL2FkZGluLnRzIiwic291cmNlcy9kaXN0cmlidXRpb25MaXN0c0J1aWxkZXIudHMiLCJzb3VyY2VzL2dyb3Vwc0J1aWxkZXIudHMiLCJzb3VyY2VzL21pc2NCdWlsZGVyLnRzIiwic291cmNlcy9yZXBvcnRzQnVpbGRlci50cyIsInNvdXJjZXMvcnVsZXNCdWlsZGVyLnRzIiwic291cmNlcy9zY29wZUdyb3VwRmlsdGVyLnRzIiwic291cmNlcy9zZWN1cml0eUNsZWFyYW5jZXNCdWlsZGVyLnRzIiwic291cmNlcy91dGlscy50cyIsInNvdXJjZXMvd2FpdGluZy50cyIsInNvdXJjZXMvem9uZUJ1aWxkZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7O0FDQUEscUNBQXFDO0FBQ3JDLHdDQUF3Qzs7Ozs7Ozs7Ozs7QUFFeEMsaURBQTRDO0FBQzVDLHlFQUFvRTtBQUNwRSxtREFBOEM7QUFDOUMsK0NBQTBDO0FBQzFDLHVFQUFrRTtBQUNsRSw2Q0FBcUQ7QUFDckQsaUNBQW9KO0FBQ3BKLHFDQUFnQztBQUNoQyw2Q0FBNkM7QUFDN0MsNkNBQTBDO0FBZ0QxQztJQXlUSSxrQkFBa0I7SUFDbEIsZUFBYSxHQUFHO1FBQWhCLGlCQVlDO1FBNVRnQixjQUFTLEdBQUcsUUFBUSxDQUFDLGNBQWMsQ0FBQyxjQUFjLENBQXNCLENBQUM7UUFDekUsWUFBTyxHQUFHLFFBQVEsQ0FBQyxjQUFjLENBQUMsWUFBWSxDQUFzQixDQUFDO1FBQ3JFLDRCQUF1QixHQUFxQixRQUFRLENBQUMsY0FBYyxDQUFDLDRCQUE0QixDQUFxQixDQUFDO1FBQ3RILDJCQUFzQixHQUFxQixRQUFRLENBQUMsY0FBYyxDQUFDLDJCQUEyQixDQUFxQixDQUFDO1FBQ3BILGlDQUE0QixHQUFxQixRQUFRLENBQUMsY0FBYyxDQUFDLGlDQUFpQyxDQUFxQixDQUFDO1FBR2hJLFNBQUksR0FBZ0I7WUFD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QUVPLDhCQUFRLEdBQWhCO1FBQUEsaUJBTUM7UUFMRyxPQUFPLElBQUksT0FBTyxDQUFDLFVBQUMsT0FBTyxFQUFFLE1BQU07WUFDL0IsS0FBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFO2dCQUNqQixVQUFVLEVBQUUsTUFBTTthQUNyQixFQUFFLE9BQU8sRUFBRSxNQUFNLENBQUMsQ0FBQztRQUN4QixDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7SUFFRCw0QkFBTSxHQUFOO1FBQ0ksSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7SUFDNUIsQ0FBQztJQUNMLGtCQUFDO0FBQUQsQ0EvQkEsQUErQkMsSUFBQTtBQS9CWSxrQ0FBVyIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuL2FkZGluLmQudHNcIiAvPlxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uL2JsdWViaXJkLmQudHNcIi8+XG5cbmltcG9ydCBHcm91cHNCdWlsZGVyIGZyb20gXCIuL2dyb3Vwc0J1aWxkZXJcIjtcbmltcG9ydCBTZWN1cml0eUNsZWFyYW5jZXNCdWlsZGVyIGZyb20gXCIuL3NlY3VyaXR5Q2xlYXJhbmNlc0J1aWxkZXJcIjtcbmltcG9ydCBSZXBvcnRzQnVpbGRlciBmcm9tIFwiLi9yZXBvcnRzQnVpbGRlclwiO1xuaW1wb3J0IFJ1bGVzQnVpbGRlciBmcm9tIFwiLi9ydWxlc0J1aWxkZXJcIjtcbmltcG9ydCBEaXN0cmlidXRpb25MaXN0c0J1aWxkZXIgZnJvbSBcIi4vZGlzdHJpYnV0aW9uTGlzdHNCdWlsZGVyXCI7XG5pbXBvcnQge0lNaXNjRGF0YSwgTWlzY0J1aWxkZXJ9IGZyb20gXCIuL21pc2NCdWlsZGVyXCI7XG5pbXBvcnQge2Rvd25sb2FkRGF0YUFzRmlsZSwgbWVyZ2VVbmlxdWUsIElFbnRpdHksIG1lcmdlVW5pcXVlRW50aXRpZXMsIGdldFVuaXF1ZUVudGl0aWVzLCBnZXRFbnRpdGllc0lkcywgdG9nZXRoZXIsIHJlc29sdmVkUHJvbWlzZX0gZnJvbSBcIi4vdXRpbHNcIjtcbmltcG9ydCBXYWl0aW5nIGZyb20gXCIuL3dhaXRpbmdcIjtcbi8vIGltcG9ydCB7VXNlckJ1aWxkZXJ9IGZyb20gXCIuL3VzZXJCdWlsZGVyXCI7XG5pbXBvcnQge1pvbmVCdWlsZGVyfSBmcm9tIFwiLi96b25lQnVpbGRlclwiO1xuXG5pbnRlcmZhY2UgR2VvdGFiIHtcbiAgICBhZGRpbjoge1xuICAgICAgICByZWdpc3RyYXRpb25Db25maWc6IEZ1bmN0aW9uXG4gICAgfTtcbn1cblxuaW50ZXJmYWNlIElJbXBvcnREYXRhIHtcbiAgICBncm91cHM6IGFueVtdO1xuICAgIHJlcG9ydHM6IGFueVtdO1xuICAgIHJ1bGVzOiBhbnlbXTtcbiAgICBkaXN0cmlidXRpb25MaXN0czogYW55W107XG4gICAgZGV2aWNlczogYW55W107XG4gICAgdXNlcnM6IGFueVtdO1xuICAgIHpvbmVUeXBlczogYW55W107XG4gICAgem9uZXM6IGFueVtdO1xuICAgIHdvcmtUaW1lczogYW55W107XG4gICAgd29ya0hvbGlkYXlzOiBhbnlbXTtcbiAgICBzZWN1cml0eUdyb3VwczogYW55W107XG4gICAgZGlhZ25vc3RpY3M6IGFueVtdO1xuICAgIGN1c3RvbU1hcHM6IGFueVtdO1xuICAgIG1pc2M6IElNaXNjRGF0YSB8IG51bGw7XG4gICAgbm90aWZpY2F0aW9uVGVtcGxhdGVzOiBhbnlbXTtcbiAgICBjZXJ0aWZpY2F0ZXM6IGFueVtdO1xufVxuaW50ZXJmYWNlIElEZXBlbmRlbmNpZXMge1xuICAgIGdyb3Vwcz86IHN0cmluZ1tdO1xuICAgIHJlcG9ydHM/OiBzdHJpbmdbXTtcbiAgICBydWxlcz86IHN0cmluZ1tdO1xuICAgIGRpc3RyaWJ1dGlvbkxpc3RzPzogc3RyaW5nW107XG4gICAgZGV2aWNlcz86IHN0cmluZ1tdO1xuICAgIHVzZXJzPzogc3RyaW5nW107XG4gICAgem9uZVR5cGVzPzogc3RyaW5nW107XG4gICAgem9uZXM/OiBzdHJpbmdbXTtcbiAgICB3b3JrVGltZXM/OiBzdHJpbmdbXTtcbiAgICB3b3JrSG9saWRheXM/OiBzdHJpbmdbXTtcbiAgICBzZWN1cml0eUdyb3Vwcz86IHN0cmluZ1tdO1xuICAgIGRpYWdub3N0aWNzPzogc3RyaW5nW107XG4gICAgY3VzdG9tTWFwcz86IHN0cmluZ1tdO1xuICAgIG5vdGlmaWNhdGlvblRlbXBsYXRlcz86IHN0cmluZ1tdO1xuICAgIGNlcnRpZmljYXRlcz86IHN0cmluZ1tdO1xufVxuXG50eXBlIFRFbnRpdHlUeXBlID0ga2V5b2YgSUltcG9ydERhdGE7XG5cbmRlY2xhcmUgY29uc3QgZ2VvdGFiOiBHZW90YWI7XG5cbmNsYXNzIEFkZGluIHtcbiAgICBwcml2YXRlIHJlYWRvbmx5IGFwaTtcbiAgICBwcml2YXRlIHJlYWRvbmx5IGdyb3Vwc0J1aWxkZXI6IEdyb3Vwc0J1aWxkZXI7XG4gICAgcHJpdmF0ZSByZWFkb25seSBzZWN1cml0eUNsZWFyYW5jZXNCdWlsZGVyOiBTZWN1cml0eUNsZWFyYW5jZXNCdWlsZGVyO1xuICAgIHByaXZhdGUgcmVhZG9ubHkgcmVwb3J0c0J1aWxkZXI6IFJlcG9ydHNCdWlsZGVyO1xuICAgIHByaXZhdGUgcmVhZG9ubHkgcnVsZXNCdWlsZGVyOiBSdWxlc0J1aWxkZXI7XG4gICAgcHJpdmF0ZSByZWFkb25seSBkaXN0cmlidXRpb25MaXN0c0J1aWxkZXI6IERpc3RyaWJ1dGlvbkxpc3RzQnVpbGRlcjtcbiAgICBwcml2YXRlIHJlYWRvbmx5IG1pc2NCdWlsZGVyOiBNaXNjQnVpbGRlcjtcbiAgICAvLyBwcml2YXRlIHJlYWRvbmx5IHVzZXJCdWlsZGVyOiBVc2VyQnVpbGRlcjtcbiAgICBwcml2YXRlIHJlYWRvbmx5IHpvbmVCdWlsZGVyOiBab25lQnVpbGRlcjtcbiAgICBwcml2YXRlIHJlYWRvbmx5IGV4cG9ydEJ0biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZXhwb3J0QnV0dG9uXCIpIGFzIEhUTUxCdXR0b25FbGVtZW50O1xuICAgIHByaXZhdGUgcmVhZG9ubHkgc2F2ZUJ0biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2F2ZUJ1dHRvblwiKSBhcyBIVE1MQnV0dG9uRWxlbWVudDtcbiAgICBwcml2YXRlIHJlYWRvbmx5IGV4cG9ydEFsbEFkZGluc0NoZWNrYm94OiBIVE1MSW5wdXRFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJleHBvcnRfYWxsX2FkZGluc19jaGVja2JveFwiKSBhcyBIVE1MSW5wdXRFbGVtZW50O1xuICAgIHByaXZhdGUgcmVhZG9ubHkgZXhwb3J0QWxsWm9uZXNDaGVja2JveDogSFRNTElucHV0RWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZXhwb3J0X2FsbF96b25lc19jaGVja2JveFwiKSBhcyBIVE1MSW5wdXRFbGVtZW50O1xuICAgIHByaXZhdGUgcmVhZG9ubHkgZXhwb3J0U3lzdGVtU2V0dGluZ3NDaGVja2JveDogSFRNTElucHV0RWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZXhwb3J0X3N5c3RlbV9zZXR0aW5nc19jaGVja2JveFwiKSBhcyBIVE1MSW5wdXRFbGVtZW50O1xuICAgIHByaXZhdGUgcmVhZG9ubHkgd2FpdGluZzogV2FpdGluZztcbiAgICBwcml2YXRlIGN1cnJlbnRUYXNrO1xuICAgIHByaXZhdGUgcmVhZG9ubHkgZGF0YTogSUltcG9ydERhdGEgPSB7XG4gICAgICAgIGdyb3VwczogW10sXG4gICAgICAgIHJlcG9ydHM6IFtdLFxuICAgICAgICBydWxlczogW10sXG4gICAgICAgIGRpc3RyaWJ1dGlvbkxpc3RzOiBbXSxcbiAgICAgICAgZGV2aWNlczogW10sXG4gICAgICAgIHVzZXJzOiBbXSxcbiAgICAgICAgem9uZVR5cGVzOiBbXSxcbiAgICAgICAgem9uZXM6IFtdLFxuICAgICAgICB3b3JrVGltZXM6IFtdLFxuICAgICAgICB3b3JrSG9saWRheXM6IFtdLFxuICAgICAgICBzZWN1cml0eUdyb3VwczogW10sXG4gICAgICAgIGN1c3RvbU1hcHM6IFtdLFxuICAgICAgICBkaWFnbm9zdGljczogW10sXG4gICAgICAgIG1pc2M6IG51bGwsXG4gICAgICAgIG5vdGlmaWNhdGlvblRlbXBsYXRlczogW10sXG4gICAgICAgIGNlcnRpZmljYXRlczogW11cbiAgICB9O1xuXG4gICAgcHJpdmF0ZSBjb21iaW5lRGVwZW5kZW5jaWVzICguLi5hbGxEZXBlbmRlbmNpZXM6IElEZXBlbmRlbmNpZXNbXSk6IElEZXBlbmRlbmNpZXMge1xuICAgICAgICBsZXQgdG90YWwgPSB7XG4gICAgICAgICAgICBncm91cHM6IFtdLFxuICAgICAgICAgICAgcmVwb3J0czogW10sXG4gICAgICAgICAgICBydWxlczogW10sXG4gICAgICAgICAgICBkZXZpY2VzOiBbXSxcbiAgICAgICAgICAgIHVzZXJzOiBbXSxcbiAgICAgICAgICAgIHpvbmVUeXBlczogW10sXG4gICAgICAgICAgICB6b25lczogW10sXG4gICAgICAgICAgICB3b3JrVGltZXM6IFtdLFxuICAgICAgICAgICAgd29ya0hvbGlkYXlzOiBbXSxcbiAgICAgICAgICAgIHNlY3VyaXR5R3JvdXBzOiBbXSxcbiAgICAgICAgICAgIGRpYWdub3N0aWNzOiBbXSxcbiAgICAgICAgICAgIGN1c3RvbU1hcHM6IFtdLFxuICAgICAgICAgICAgbm90aWZpY2F0aW9uVGVtcGxhdGVzOiBbXVxuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gT2JqZWN0LmtleXModG90YWwpLnJlZHVjZSgoZGVwZW5kZW5jaWVzLCBkZXBlbmRlbmN5TmFtZTogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICBkZXBlbmRlbmNpZXNbZGVwZW5kZW5jeU5hbWVdID0gbWVyZ2VVbmlxdWUoZGVwZW5kZW5jaWVzW2RlcGVuZGVuY3lOYW1lXSwgLi4uYWxsRGVwZW5kZW5jaWVzLm1hcCgoZW50aXR5RGVwZW5kZW5jaWVzKSA9PiBlbnRpdHlEZXBlbmRlbmNpZXNbZGVwZW5kZW5jeU5hbWVdKSk7XG4gICAgICAgICAgICByZXR1cm4gZGVwZW5kZW5jaWVzO1xuICAgICAgICB9LCB0b3RhbCk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhZGROZXdHcm91cHMgKGdyb3Vwczogc3RyaW5nW10sIGRhdGE6IElJbXBvcnREYXRhKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgaWYgKCFncm91cHMubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVzb2x2ZWRQcm9taXNlKCk7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGdyb3Vwc0RhdGEgPSB0aGlzLmdyb3Vwc0J1aWxkZXIuZ2V0R3JvdXBzRGF0YShncm91cHMsIHRydWUpLFxuICAgICAgICAgICAgbmV3R3JvdXBzVXNlcnMgPSBnZXRVbmlxdWVFbnRpdGllcyh0aGlzLmdyb3Vwc0J1aWxkZXIuZ2V0UHJpdmF0ZUdyb3Vwc1VzZXJzKGdyb3Vwc0RhdGEpLCBkYXRhLnVzZXJzKTtcbiAgICAgICAgZGF0YS5ncm91cHMgPSBtZXJnZVVuaXF1ZUVudGl0aWVzKGRhdGEuZ3JvdXBzLCBncm91cHNEYXRhKTtcbiAgICAgICAgZGF0YS51c2VycyA9IG1lcmdlVW5pcXVlRW50aXRpZXMoZGF0YS51c2VycywgbmV3R3JvdXBzVXNlcnMpO1xuICAgICAgICByZXR1cm4gdGhpcy5yZXNvbHZlRGVwZW5kZW5jaWVzKHt1c2VyczogZ2V0RW50aXRpZXNJZHMobmV3R3JvdXBzVXNlcnMpfSwgZGF0YSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhZGROZXdDdXN0b21NYXBzIChjdXN0b21NYXBzSWRzOiBzdHJpbmdbXSwgZGF0YTogSUltcG9ydERhdGEpIHtcbiAgICAgICAgaWYgKCFjdXN0b21NYXBzSWRzIHx8ICFjdXN0b21NYXBzSWRzLmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGxldCBjdXN0b21NYXBzRGF0YSA9IGN1c3RvbU1hcHNJZHMucmVkdWNlKChkYXRhOiBhbnlbXSwgY3VzdG9tTWFwSWQ6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgbGV0IGN1c3RvbU1hcERhdGEgPSB0aGlzLm1pc2NCdWlsZGVyLmdldE1hcFByb3ZpZGVyRGF0YShjdXN0b21NYXBJZCk7XG4gICAgICAgICAgICBjdXN0b21NYXBEYXRhICYmIGRhdGEucHVzaChjdXN0b21NYXBEYXRhKTtcbiAgICAgICAgICAgIHJldHVybiBkYXRhO1xuICAgICAgICB9LCBbXSk7XG4gICAgICAgIGRhdGEuY3VzdG9tTWFwcyA9IG1lcmdlVW5pcXVlRW50aXRpZXMoZGF0YS5jdXN0b21NYXBzLCBjdXN0b21NYXBzRGF0YSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhZGROZXdOb3RpZmljYXRpb25UZW1wbGF0ZXMgKG5vdGlmaWNhdGlvblRlbXBsYXRlc0lkczogc3RyaW5nW10sIGRhdGE6IElJbXBvcnREYXRhKSB7XG4gICAgICAgIGlmICghbm90aWZpY2F0aW9uVGVtcGxhdGVzSWRzIHx8ICFub3RpZmljYXRpb25UZW1wbGF0ZXNJZHMubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IG5vdGlmaWNhdGlvblRlbXBsYXRlc0RhdGEgPSBub3RpZmljYXRpb25UZW1wbGF0ZXNJZHMucmVkdWNlKChkYXRhOiBhbnlbXSwgdGVtcGxhdGVJZDogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICBsZXQgdGVtcGxhdGVEYXRhID0gdGhpcy5kaXN0cmlidXRpb25MaXN0c0J1aWxkZXIuZ2V0Tm90aWZpY2F0aW9uVGVtcGxhdGVEYXRhKHRlbXBsYXRlSWQpO1xuICAgICAgICAgICAgdGVtcGxhdGVEYXRhICYmIGRhdGEucHVzaCh0ZW1wbGF0ZURhdGEpO1xuICAgICAgICAgICAgcmV0dXJuIGRhdGE7XG4gICAgICAgIH0sIFtdKTtcbiAgICAgICAgZGF0YS5ub3RpZmljYXRpb25UZW1wbGF0ZXMgPSBtZXJnZVVuaXF1ZUVudGl0aWVzKGRhdGEubm90aWZpY2F0aW9uVGVtcGxhdGVzLCBub3RpZmljYXRpb25UZW1wbGF0ZXNEYXRhKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGdldEVudHl0aWVzSWRzIChlbnRpdGllczogSUVudGl0eVtdKTogc3RyaW5nW10ge1xuICAgICAgICByZXR1cm4gZW50aXRpZXMucmVkdWNlKChyZXM6IHN0cmluZ1tdLCBlbnRpdHkpID0+IHtcbiAgICAgICAgICAgIGVudGl0eSAmJiBlbnRpdHkuaWQgJiYgcmVzLnB1c2goZW50aXR5LmlkKTtcbiAgICAgICAgICAgIHJldHVybiByZXM7XG4gICAgICAgIH0sIFtdKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGdldEVudGl0eURlcGVuZGVuY2llcyAoZW50aXR5OiBJRW50aXR5LCBlbnRpdHlUeXBlOiBURW50aXR5VHlwZSkge1xuICAgICAgICBsZXQgZW50aXR5RGVwZW5kZW5jaWVzOiBJRGVwZW5kZW5jaWVzID0ge307XG4gICAgICAgIHN3aXRjaCAoZW50aXR5VHlwZSkge1xuICAgICAgICAgICAgY2FzZSBcImRldmljZXNcIjpcbiAgICAgICAgICAgICAgICBlbnRpdHlEZXBlbmRlbmNpZXMuZ3JvdXBzID0gdGhpcy5nZXRFbnR5dGllc0lkcyhlbnRpdHlbXCJncm91cHNcIl0uY29uY2F0KGVudGl0eVtcImF1dG9Hcm91cHNcIl0pKTtcbiAgICAgICAgICAgICAgICBlbnRpdHlbXCJ3b3JrVGltZVwiXS5pZCAmJiAoZW50aXR5RGVwZW5kZW5jaWVzLndvcmtUaW1lcyA9IFtlbnRpdHlbXCJ3b3JrVGltZVwiXS5pZF0pO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcInVzZXJzXCI6XG4gICAgICAgICAgICAgICAgZW50aXR5RGVwZW5kZW5jaWVzLmdyb3VwcyA9IHRoaXMuZ2V0RW50eXRpZXNJZHMoZW50aXR5W1wiY29tcGFueUdyb3Vwc1wiXS5jb25jYXQoZW50aXR5W1wiZHJpdmVyR3JvdXBzXCJdKS5jb25jYXQoZW50aXR5W1wicHJpdmF0ZVVzZXJHcm91cHNcIl0pLmNvbmNhdChlbnRpdHlbXCJyZXBvcnRHcm91cHNcIl0pKTtcbiAgICAgICAgICAgICAgICBlbnRpdHlEZXBlbmRlbmNpZXMuc2VjdXJpdHlHcm91cHMgPSB0aGlzLmdldEVudHl0aWVzSWRzKGVudGl0eVtcInNlY3VyaXR5R3JvdXBzXCJdKTtcbiAgICAgICAgICAgICAgICBlbnRpdHlEZXBlbmRlbmNpZXMuY3VzdG9tTWFwcyA9IFtlbnRpdHlbXCJkZWZhdWx0TWFwRW5naW5lXCJdXTtcbiAgICAgICAgICAgICAgICBpZiAoZW50aXR5Lmlzc3VlckNlcnRpZmljYXRlKSB7XG4gICAgICAgICAgICAgICAgICAgIGVudGl0eURlcGVuZGVuY2llcy5jZXJ0aWZpY2F0ZXMgPSBbIGVudGl0eS5pc3N1ZXJDZXJ0aWZpY2F0ZS5pZCBdXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcInpvbmVzXCI6XG4gICAgICAgICAgICAgICAgbGV0IHpvbmVUeXBlcyA9IHRoaXMuZ2V0RW50eXRpZXNJZHMoZW50aXR5W1wiem9uZVR5cGVzXCJdKTtcbiAgICAgICAgICAgICAgICB6b25lVHlwZXMubGVuZ3RoICYmIChlbnRpdHlEZXBlbmRlbmNpZXMuem9uZVR5cGVzID0gem9uZVR5cGVzKTtcbiAgICAgICAgICAgICAgICBlbnRpdHlEZXBlbmRlbmNpZXMuZ3JvdXBzID0gdGhpcy5nZXRFbnR5dGllc0lkcyhlbnRpdHlbXCJncm91cHNcIl0pO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcIndvcmtUaW1lc1wiOlxuICAgICAgICAgICAgICAgIGVudGl0eVtcImhvbGlkYXlHcm91cFwiXS5ncm91cElkICYmIChlbnRpdHlEZXBlbmRlbmNpZXMud29ya0hvbGlkYXlzID0gW2VudGl0eVtcImhvbGlkYXlHcm91cFwiXS5ncm91cElkXSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBlbnRpdHlEZXBlbmRlbmNpZXM7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhcHBseVRvRW50aXRpZXMgPFQ+KGVudGl0aWVzTGlzdDogSURlcGVuZGVuY2llcywgaW5pdGlhbFZhbHVlLCBmdW5jOiAocmVzdWx0LCBlbnRpdHksIGVudGl0eVR5cGU6IFRFbnRpdHlUeXBlLCBlbnRpdHlJbmRleDogbnVtYmVyLCBlbnRpdHlUeXBlSW5kZXg6IG51bWJlciwgb3ZlcmFsbEluZGV4OiBudW1iZXIpID0+IFQpIHtcbiAgICAgICAgbGV0IG92ZXJhbGxJbmRleCA9IDA7XG4gICAgICAgIHJldHVybiBPYmplY3Qua2V5cyhlbnRpdGllc0xpc3QpLnJlZHVjZSgocmVzdWx0OiBULCBlbnRpdHlUeXBlOiBzdHJpbmcsIHR5cGVJbmRleDogbnVtYmVyKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gZW50aXRpZXNMaXN0W2VudGl0eVR5cGVdLnJlZHVjZSgocmVzOiBULCBlbnRpdHksIGluZGV4KSA9PiB7XG4gICAgICAgICAgICAgICAgb3ZlcmFsbEluZGV4Kys7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZ1bmMocmVzLCBlbnRpdHksIGVudGl0eVR5cGUgYXMgVEVudGl0eVR5cGUsIGluZGV4LCB0eXBlSW5kZXgsIG92ZXJhbGxJbmRleCAtIDEpO1xuICAgICAgICAgICAgfSwgcmVzdWx0KTtcbiAgICAgICAgfSwgaW5pdGlhbFZhbHVlKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIHJlc29sdmVEZXBlbmRlbmNpZXMgKGRlcGVuZGVuY2llczogSURlcGVuZGVuY2llcywgZGF0YTogSUltcG9ydERhdGEpIHtcbiAgICAgICAgbGV0IGdldERhdGEgPSAoZW50aXRpZXNMaXN0OiBJRGVwZW5kZW5jaWVzKTogUHJvbWlzZTxJSW1wb3J0RGF0YT4gPT4ge1xuICAgICAgICAgICAgICAgIGxldCBlbnRpdHlSZXF1ZXN0VHlwZXMgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZXZpY2VzOiBcIkRldmljZVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgdXNlcnM6IFwiVXNlclwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgem9uZVR5cGVzOiBcIlpvbmVUeXBlXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICB6b25lczogXCJab25lXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICB3b3JrVGltZXM6IFwiV29ya1RpbWVcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIHdvcmtIb2xpZGF5czogXCJXb3JrSG9saWRheVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgc2VjdXJpdHlHcm91cHM6IFwiR3JvdXBcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpYWdub3N0aWNzOiBcIkRpYWdub3N0aWNcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIGNlcnRpZmljYXRlczogXCJDZXJ0aWZpY2F0ZVwiXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHJlcXVlc3RzOiBhbnkgPSB0aGlzLmFwcGx5VG9FbnRpdGllcyhlbnRpdGllc0xpc3QsIHt9LCAocmVzdWx0LCBlbnRpdHlJZCwgZW50aXR5VHlwZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHJlcXVlc3QgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZU5hbWU6IGVudGl0eVJlcXVlc3RUeXBlc1tlbnRpdHlUeXBlXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWFyY2g6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IGVudGl0eUlkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlbnRpdHlSZXF1ZXN0VHlwZXNbZW50aXR5VHlwZV0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZW50aXR5VHlwZSA9PT0gXCJ3b3JrSG9saWRheXNcIiB8fCBlbnRpdHlUeXBlID09PSBcInNlY3VyaXR5R3JvdXBzXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIXJlc3VsdFtlbnRpdHlUeXBlXSAmJiAocmVzdWx0W2VudGl0eVR5cGVdID0gW10pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdFtlbnRpdHlUeXBlXS5wdXNoKFtcIkdldFwiLCByZXF1ZXN0XSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIGlmIChlbnRpdGllc0xpc3Quc2VjdXJpdHlHcm91cHMgJiYgZW50aXRpZXNMaXN0LnNlY3VyaXR5R3JvdXBzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICByZXF1ZXN0cy5zZWN1cml0eUdyb3VwcyA9IFtbXCJHZXRcIiwge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZU5hbWU6IGVudGl0eVJlcXVlc3RUeXBlcy5zZWN1cml0eUdyb3VwcyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlYXJjaDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkOiBcIkdyb3VwU2VjdXJpdHlJZFwiXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1dXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGVudGl0aWVzTGlzdC53b3JrSG9saWRheXMgJiYgZW50aXRpZXNMaXN0LndvcmtIb2xpZGF5cy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVxdWVzdHMud29ya0hvbGlkYXlzID0gW1tcIkdldFwiLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlTmFtZTogZW50aXR5UmVxdWVzdFR5cGVzLndvcmtIb2xpZGF5c1xuICAgICAgICAgICAgICAgICAgICB9XV07XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuYWRkTmV3R3JvdXBzKGVudGl0aWVzTGlzdC5ncm91cHMgfHwgW10sIGRhdGEpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZE5ld0N1c3RvbU1hcHMoZW50aXRpZXNMaXN0LmN1c3RvbU1hcHMgfHwgW10sIGRhdGEpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZE5ld05vdGlmaWNhdGlvblRlbXBsYXRlcyhlbnRpdGllc0xpc3Qubm90aWZpY2F0aW9uVGVtcGxhdGVzIHx8IFtdLCBkYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIGVudGl0aWVzTGlzdC5ncm91cHM7XG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBlbnRpdGllc0xpc3QuY3VzdG9tTWFwcztcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPElJbXBvcnREYXRhPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgcmVxdWVzdEVudGl0aWVzID0gT2JqZWN0LmtleXMocmVxdWVzdHMpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcXVlc3RzQXJyYXkgPSByZXF1ZXN0RW50aXRpZXMucmVkdWNlKChsaXN0LCB0eXBlKSA9PiBsaXN0LmNvbmNhdChyZXF1ZXN0c1t0eXBlXSksIFtdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghcmVxdWVzdEVudGl0aWVzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlKGRhdGEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5hcGkubXVsdGlDYWxsKHJlcXVlc3RzQXJyYXksIChyZXNwb25zZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgbmV3R3JvdXBzOiBzdHJpbmdbXSA9IFtdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3Q3VzdG9tTWFwczogc3RyaW5nW10gPSBbXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld0RlcGVuZGVuY2llczogSURlcGVuZGVuY2llcyA9IHt9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXhwb3J0ZWREYXRhOiBhbnkgPSB0aGlzLmFwcGx5VG9FbnRpdGllcyhyZXF1ZXN0cywge30sIChyZXN1bHQsIHJlcXVlc3QsIGVudGl0eVR5cGUsIGVudGl0eUluZGV4LCBlbnRpdHlUeXBlSW5kZXgsIG92ZXJhbGxJbmRleCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBpdGVtcyA9IHJlcXVlc3RzQXJyYXkubGVuZ3RoID4gMSA/IHJlc3BvbnNlW292ZXJhbGxJbmRleF0gOiByZXNwb25zZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtcy5mb3JFYWNoKChpdGVtKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0gPSBpdGVtWzBdIHx8IGl0ZW07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICFyZXN1bHRbZW50aXR5VHlwZV0gJiYgKHJlc3VsdFtlbnRpdHlUeXBlXSA9IFtdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVudGl0eVR5cGUgPT09IFwid29ya0hvbGlkYXlzXCIgJiYgKCFpdGVtLmhvbGlkYXlHcm91cCB8fCAoZW50aXRpZXNMaXN0LndvcmtIb2xpZGF5cyB8fCBbXSkuaW5kZXhPZihpdGVtLmhvbGlkYXlHcm91cC5ncm91cElkKSA9PT0gLTEpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVudGl0eVR5cGUgPT09IFwid29ya1RpbWVzXCIgJiYgIWl0ZW0uZGV0YWlscykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlbnRpdHlUeXBlID09PSBcInNlY3VyaXR5R3JvdXBzXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICgoZW50aXRpZXNMaXN0LnNlY3VyaXR5R3JvdXBzIHx8IFtdKS5pbmRleE9mKGl0ZW0uaWQpID4gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHRbZW50aXR5VHlwZV0gPSByZXN1bHRbZW50aXR5VHlwZV0uY29uY2F0KHRoaXMuZ3JvdXBzQnVpbGRlci5nZXRDdXN0b21Hcm91cHNEYXRhKGVudGl0aWVzTGlzdC5zZWN1cml0eUdyb3VwcyB8fCBbXSwgaXRlbXMpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBlbnRpdHlEZXBlbmRlbmNpZXMgPSB0aGlzLmdldEVudGl0eURlcGVuZGVuY2llcyhpdGVtLCBlbnRpdHlUeXBlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3RGVwZW5kZW5jaWVzID0gdGhpcy5hcHBseVRvRW50aXRpZXMoZW50aXR5RGVwZW5kZW5jaWVzLCBuZXdEZXBlbmRlbmNpZXMsIChyZXN1bHQsIGVudGl0eUlkLCBlbnRpdHlUeXBlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAhcmVzdWx0W2VudGl0eVR5cGVdICYmIChyZXN1bHRbZW50aXR5VHlwZV0gPSBbXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHRbZW50aXR5VHlwZV0gPSBtZXJnZVVuaXF1ZShyZXN1bHRbZW50aXR5VHlwZV0sIFtlbnRpdHlJZF0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld0dyb3VwcyA9IG5ld0dyb3Vwcy5jb25jYXQobmV3RGVwZW5kZW5jaWVzLmdyb3VwcyB8fCBbXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld0N1c3RvbU1hcHMgPSBuZXdDdXN0b21NYXBzLmNvbmNhdChuZXdEZXBlbmRlbmNpZXMuY3VzdG9tTWFwcyB8fCBbXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBuZXdEZXBlbmRlbmNpZXMuZ3JvdXBzO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgbmV3RGVwZW5kZW5jaWVzLmN1c3RvbU1hcHM7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdFtlbnRpdHlUeXBlXS5wdXNoKGl0ZW0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3RGVwZW5kZW5jaWVzID0gT2JqZWN0LmtleXMobmV3RGVwZW5kZW5jaWVzKS5yZWR1Y2UoKHJlc3VsdCwgZGVwZW5kZW5jeU5hbWUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBlbnRpdGllcyA9IG5ld0RlcGVuZGVuY2llc1tkZXBlbmRlbmN5TmFtZV0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXhwb3J0ZWQgPSAoZXhwb3J0ZWREYXRhW2RlcGVuZGVuY3lOYW1lXSB8fCBbXSkubWFwKGVudGl0eSA9PiBlbnRpdHkuaWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZW50aXRpZXMuZm9yRWFjaChlbnRpdHlJZCA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGV4cG9ydGVkLmluZGV4T2YoZW50aXR5SWQpID09PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAhcmVzdWx0W2RlcGVuZGVuY3lOYW1lXSAmJiAocmVzdWx0W2RlcGVuZGVuY3lOYW1lXSA9IFtdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0W2RlcGVuZGVuY3lOYW1lXS5wdXNoKGVudGl0eUlkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sIHt9IGFzIElJbXBvcnREYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gUmVtb3ZlIGJ1aWx0LWluIHNlY3VyaXR5IGdyb3Vwc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBleHBvcnRlZERhdGEuc2VjdXJpdHlHcm91cHMgJiYgKGV4cG9ydGVkRGF0YS5zZWN1cml0eUdyb3VwcyA9IGV4cG9ydGVkRGF0YS5zZWN1cml0eUdyb3Vwcy5yZWR1Y2UoKHJlc3VsdCwgZ3JvdXApID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdyb3VwLmlkLmluZGV4T2YoXCJHcm91cFwiKSA9PT0gLTEgJiYgcmVzdWx0LnB1c2goZ3JvdXApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwgW10pKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGROZXdHcm91cHMobmV3R3JvdXBzLCBkYXRhKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkTmV3Q3VzdG9tTWFwcyhuZXdDdXN0b21NYXBzLCBkYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIE9iamVjdC5rZXlzKGV4cG9ydGVkRGF0YSkuZm9yRWFjaCgoZW50aXR5VHlwZTogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YVtlbnRpdHlUeXBlXSA9IG1lcmdlVW5pcXVlRW50aXRpZXMoZGF0YVtlbnRpdHlUeXBlXSwgZXhwb3J0ZWREYXRhW2VudGl0eVR5cGVdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKE9iamVjdC5rZXlzKG5ld0RlcGVuZGVuY2llcykubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh0aGlzLnJlc29sdmVEZXBlbmRlbmNpZXMobmV3RGVwZW5kZW5jaWVzLCBkYXRhKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoZGF0YSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sIHJlamVjdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwgcmVqZWN0KTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2U8SUltcG9ydERhdGE+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBnZXREYXRhKGRlcGVuZGVuY2llcykudGhlbihyZXNvbHZlKS5jYXRjaChyZWplY3QpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFib3J0Q3VycmVudFRhc2sgKCkge1xuICAgICAgICB0aGlzLnRvZ2dsZVdhaXRpbmcoKTtcbiAgICAgICAgdGhpcy5jdXJyZW50VGFzayAmJiB0aGlzLmN1cnJlbnRUYXNrLmFib3J0ICYmIHRoaXMuY3VycmVudFRhc2suYWJvcnQoKTtcbiAgICAgICAgdGhpcy5jdXJyZW50VGFzayA9IG51bGw7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSB0b2dnbGVFeHBvcnRCdXR0b24gKGlzRGlzYWJsZWQ6IGJvb2xlYW4pIHtcbiAgICAgICAgdGhpcy5leHBvcnRCdG4uZGlzYWJsZWQgPSBpc0Rpc2FibGVkO1xuICAgIH1cblxuICAgIHByaXZhdGUgcmVhZG9ubHkgdG9nZ2xlV2FpdGluZyA9IChpc1N0YXJ0ID0gZmFsc2UpID0+IHtcbiAgICAgICAgaWYgKGlzU3RhcnQpIHtcbiAgICAgICAgICAgIHRoaXMudG9nZ2xlRXhwb3J0QnV0dG9uKHRydWUpO1xuICAgICAgICAgICAgdGhpcy53YWl0aW5nLnN0YXJ0KChkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImFkZGluQ29udGFpbmVyXCIpIGFzIEhUTUxFbGVtZW50KS5wYXJlbnRFbGVtZW50IGFzIEhUTUxFbGVtZW50LCA5OTk5KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMudG9nZ2xlRXhwb3J0QnV0dG9uKGZhbHNlKTtcbiAgICAgICAgICAgIHRoaXMud2FpdGluZy5zdG9wKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvL0JyZXR0IC0gZGlzcGxheXMgdGhlIG91dHB1dCBvbiB0aGUgcGFnZVxuICAgIHByaXZhdGUgc2hvd0VudGl0eU1lc3NhZ2UgKGJsb2NrOiBIVE1MRWxlbWVudCwgcXR5OiBudW1iZXIsIGVudGl0eU5hbWU6IHN0cmluZykge1xuICAgICAgICBsZXQgYmxvY2tFbCA9IGJsb2NrLnF1ZXJ5U2VsZWN0b3IoXCIuZGVzY3JpcHRpb25cIikgYXMgSFRNTEVsZW1lbnQ7XG4gICAgICAgIGlmIChxdHkpIHtcbiAgICAgICAgICAgIHF0eSA+IDEgJiYgKGVudGl0eU5hbWUgKz0gXCJzXCIpO1xuICAgICAgICAgICAgbGV0IGhhc0l0ZW1zTWVzc2FnZVRlbXBsYXRlID0gKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiaGFzSXRlbXNNZXNzYWdlVGVtcGxhdGVcIikgYXMgSFRNTEVsZW1lbnQpLmlubmVySFRNTDtcbiAgICAgICAgICAgIGJsb2NrRWwuaW5uZXJIVE1MID0gaGFzSXRlbXNNZXNzYWdlVGVtcGxhdGUucmVwbGFjZShcIntxdWFudGl0eX1cIiwgcXR5LnRvU3RyaW5nKCkpLnJlcGxhY2UoXCJ7ZW50aXR5fVwiLCBlbnRpdHlOYW1lKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGJsb2NrRWwuaW5uZXJIVE1MID0gYFlvdSBoYXZlIDxzcGFuIGNsYXNzPVwiYm9sZFwiPm5vdCBjb25maWd1cmVkIGFueSAkeyBlbnRpdHlOYW1lIH1zPC9zcGFuPi5gO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBzaG93U3lzdGVtU2V0dGluZ3NNZXNzYWdlIChibG9jazogSFRNTEVsZW1lbnQsIGlzSW5jbHVkZWQ6IGJvb2xlYW4pIHtcbiAgICAgICAgbGV0IGJsb2NrRWwgPSBibG9jay5xdWVyeVNlbGVjdG9yKFwiLmRlc2NyaXB0aW9uXCIpIGFzIEhUTUxFbGVtZW50O1xuICAgICAgICBpZiAoaXNJbmNsdWRlZCkge1xuICAgICAgICAgICAgYmxvY2tFbC5pbm5lckhUTUwgPSBcIllvdSBoYXZlIGNob3NlbiA8c3BhbiBjbGFzcz0nYm9sZCc+dG8gaW5jbHVkZTwvc3Bhbj4gc3lzdGVtIHNldHRpbmdzLlwiO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYmxvY2tFbC5pbm5lckhUTUwgPSBcIllvdSBoYXZlIGNob3NlbiA8c3BhbiBjbGFzcz0nYm9sZCc+bm90IHRvIGluY2x1ZGU8L3NwYW4+IHN5c3RlbSBzZXR0aW5ncy5cIjtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgc2V0QWRkaW5zVG9OdWxsKCkge1xuICAgICAgICBpZiAoKHRoaXMuZGF0YS5taXNjICE9IG51bGwpIHx8ICh0aGlzLmRhdGEubWlzYyAhPSB1bmRlZmluZWQpKSB7XG4gICAgICAgICAgICB0aGlzLmRhdGEubWlzYy5hZGRpbnMgPSBbXTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vaW5pdGlhbGl6ZSBhZGRpblxuICAgIGNvbnN0cnVjdG9yIChhcGkpIHtcbiAgICAgICAgdGhpcy5hcGkgPSBhcGk7XG4gICAgICAgIHRoaXMuZ3JvdXBzQnVpbGRlciA9IG5ldyBHcm91cHNCdWlsZGVyKGFwaSk7XG4gICAgICAgIHRoaXMuc2VjdXJpdHlDbGVhcmFuY2VzQnVpbGRlciA9IG5ldyBTZWN1cml0eUNsZWFyYW5jZXNCdWlsZGVyKGFwaSk7XG4gICAgICAgIHRoaXMucmVwb3J0c0J1aWxkZXIgPSBuZXcgUmVwb3J0c0J1aWxkZXIoYXBpKTtcbiAgICAgICAgdGhpcy5ydWxlc0J1aWxkZXIgPSBuZXcgUnVsZXNCdWlsZGVyKGFwaSk7XG4gICAgICAgIHRoaXMuZGlzdHJpYnV0aW9uTGlzdHNCdWlsZGVyID0gbmV3IERpc3RyaWJ1dGlvbkxpc3RzQnVpbGRlcihhcGkpO1xuICAgICAgICB0aGlzLm1pc2NCdWlsZGVyID0gbmV3IE1pc2NCdWlsZGVyKGFwaSk7XG4gICAgICAgIC8vVE9ETzogQnJldHQgLSBsZWZ0IGhlcmUgYXMgSSB3aWxsIGJlIGludHJvZHVjaW5nIHRoZSB1c2VyIGZldGNoIHNvb25cbiAgICAgICAgLy8gdGhpcy51c2VyQnVpbGRlciA9IG5ldyBVc2VyQnVpbGRlcihhcGkpO1xuICAgICAgICB0aGlzLnpvbmVCdWlsZGVyID0gbmV3IFpvbmVCdWlsZGVyKGFwaSk7XG4gICAgICAgIHRoaXMud2FpdGluZyA9IG5ldyBXYWl0aW5nKCk7XG4gICAgfVxuXG4gICAgLy9CcmV0dDogZXhwb3J0cyB0aGUgZGF0YVxuICAgIGV4cG9ydERhdGEgPSAoKSA9PiB7XG4gICAgICAgIHRoaXMudG9nZ2xlV2FpdGluZyh0cnVlKTtcbiAgICAgICAgcmV0dXJuIHRoaXMucmVwb3J0c0J1aWxkZXIuZ2V0RGF0YSgpLnRoZW4oKHJlcG9ydHNEYXRhKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmRhdGEucmVwb3J0cyA9IHJlcG9ydHNEYXRhO1xuICAgICAgICAgICAgY29uc29sZS5sb2codGhpcy5kYXRhKTtcbiAgICAgICAgICAgIGRvd25sb2FkRGF0YUFzRmlsZShKU09OLnN0cmluZ2lmeSh0aGlzLmRhdGEpLCBcImV4cG9ydC5qc29uXCIpO1xuICAgICAgICB9KS5jYXRjaCgoZSkgPT4ge1xuICAgICAgICAgICAgYWxlcnQoXCJDYW4ndCBleHBvcnQgZGF0YS5cXG5QbGVhc2UgdHJ5IGFnYWluIGxhdGVyLlwiKTtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XG4gICAgICAgIH0pLmZpbmFsbHkoKCkgPT4gdGhpcy50b2dnbGVXYWl0aW5nKCkpO1xuICAgIH1cblxuICAgIHNhdmVDaGFuZ2VzID0gKCkgPT4ge1xuICAgICAgICB0aGlzLnJlbmRlcigpO1xuICAgIH1cblxuICAgIGNoZWNrQm94VmFsdWVDaGFuZ2VkID0gKCkgPT4ge1xuICAgICAgICB0aGlzLnRvZ2dsZUV4cG9ydEJ1dHRvbih0cnVlKTtcbiAgICB9XG5cbiAgICBhZGRFdmVudEhhbmRsZXJzKCkge1xuICAgICAgICB0aGlzLmV4cG9ydEJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5leHBvcnREYXRhLCBmYWxzZSk7XG4gICAgICAgIHRoaXMuc2F2ZUJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5zYXZlQ2hhbmdlcywgZmFsc2UpO1xuICAgICAgICB0aGlzLmV4cG9ydEFsbEFkZGluc0NoZWNrYm94LmFkZEV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgdGhpcy5jaGVja0JveFZhbHVlQ2hhbmdlZCwgZmFsc2UpO1xuICAgICAgICB0aGlzLmV4cG9ydEFsbFpvbmVzQ2hlY2tib3guYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCB0aGlzLmNoZWNrQm94VmFsdWVDaGFuZ2VkLCBmYWxzZSk7XG4gICAgICAgIHRoaXMuZXhwb3J0U3lzdGVtU2V0dGluZ3NDaGVja2JveC5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsIHRoaXMuY2hlY2tCb3hWYWx1ZUNoYW5nZWQsIGZhbHNlKTtcbiAgICB9XG5cbiAgICByZW5kZXIgKCkge1xuICAgICAgICAvL1RPRE86IEJyZXR0IC0gbGVmdCBoZXJlIGFzIEkgd2lsbCBiZSBpbnRyb2R1Y2luZyB0aGUgdXNlciBmZXRjaCBzb29uXG4gICAgICAgIC8vIHRoaXMuZGF0YS51c2VycyA9IFtdO1xuICAgICAgICB0aGlzLmRhdGEuem9uZXMgPSBbXTtcbiAgICAgICAgLy93aXJlIHVwIHRoZSBkb21cbiAgICAgICAgbGV0IG1hcE1lc3NhZ2VUZW1wbGF0ZTogc3RyaW5nID0gKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibWFwTWVzc2FnZVRlbXBsYXRlXCIpIGFzIEhUTUxFbGVtZW50KS5pbm5lckhUTUwsXG4gICAgICAgICAgICBncm91cHNCbG9jazogSFRNTEVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImV4cG9ydGVkR3JvdXBzXCIpIGFzIEhUTUxFbGVtZW50LFxuICAgICAgICAgICAgc2VjdXJpdHlDbGVhcmFuY2VzQmxvY2s6IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJleHBvcnRlZFNlY3VyaXR5Q2xlYXJhbmNlc1wiKSBhcyBIVE1MRWxlbWVudCxcbiAgICAgICAgICAgIHJ1bGVzQmxvY2s6IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJleHBvcnRlZFJ1bGVzXCIpIGFzIEhUTUxFbGVtZW50LFxuICAgICAgICAgICAgcmVwb3J0c0Jsb2NrOiBIVE1MRWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZXhwb3J0ZWRSZXBvcnRzXCIpIGFzIEhUTUxFbGVtZW50LFxuICAgICAgICAgICAgZGFzaGJvYXJkc0Jsb2NrOiBIVE1MRWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZXhwb3J0ZWREYXNoYm9hcmRzXCIpIGFzIEhUTUxFbGVtZW50LFxuICAgICAgICAgICAgYWRkaW5zQmxvY2s6IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJleHBvcnRlZEFkZGluc1wiKSBhcyBIVE1MRWxlbWVudCxcbiAgICAgICAgICAgIG1hcEJsb2NrRGVzY3JpcHRpb246IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNleHBvcnRlZE1hcCAuZGVzY3JpcHRpb25cIikgYXMgSFRNTEVsZW1lbnQsXG4gICAgICAgICAgICAvLyB1c2Vyc0Jsb2NrOiBIVE1MRWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZXhwb3J0ZWRVc2Vyc1wiKSxcbiAgICAgICAgICAgIHpvbmVzQmxvY2s6IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJleHBvcnRlZFpvbmVzXCIpIGFzIEhUTUxFbGVtZW50LFxuICAgICAgICAgICAgc3lzdGVtU2V0dGluZ3NCbG9jazogSFRNTEVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImV4cG9ydFN5c3RlbVNldHRpbmdzXCIpIGFzIEhUTUxFbGVtZW50O1xuICAgICAgICB0aGlzLnRvZ2dsZVdhaXRpbmcodHJ1ZSk7XG4gICAgICAgIHJldHVybiB0b2dldGhlcihbXG4gICAgICAgICAgICAvL2xvYWRzIHRoZSBncm91cHMuIFRoaXMgaXMgd2hlcmUgdXNlcnMgYXJlIGFkZGVkIGlmIHRoZXkgYXJlIGxpbmtlZCB0byBhIGdyb3VwXG4gICAgICAgICAgICB0aGlzLmdyb3Vwc0J1aWxkZXIuZmV0Y2goKSxcbiAgICAgICAgICAgIC8vbG9hZHMgdGhlIHNlY3VyaXR5IGdyb3VwcyAoc2VjdXJpdHkgY2xlYXJhbmNlIGluIHVzZXIgYWRtaW4gaW4gTXlHKVxuICAgICAgICAgICAgdGhpcy5zZWN1cml0eUNsZWFyYW5jZXNCdWlsZGVyLmZldGNoKCksXG4gICAgICAgICAgICAvL3JlcG9ydCBsb2FkZXIuLi5zZWVtcyBvYnNvbGV0ZSB0byBtZVxuICAgICAgICAgICAgdGhpcy5yZXBvcnRzQnVpbGRlci5mZXRjaCgpLFxuICAgICAgICAgICAgdGhpcy5ydWxlc0J1aWxkZXIuZmV0Y2goKSxcbiAgICAgICAgICAgIHRoaXMuZGlzdHJpYnV0aW9uTGlzdHNCdWlsZGVyLmZldGNoKCksXG4gICAgICAgICAgICAvL21pc2MgPSBzeXN0ZW0gc2V0dGluZ3NcbiAgICAgICAgICAgIHRoaXMubWlzY0J1aWxkZXIuZmV0Y2godGhpcy5leHBvcnRTeXN0ZW1TZXR0aW5nc0NoZWNrYm94LmNoZWNrZWQpLFxuICAgICAgICAgICAgLy9UT0RPOiBCcmV0dCAtIGxlZnQgaGVyZSBhcyBJIHdpbGwgYmUgaW50cm9kdWNpbmcgdGhlIHVzZXIgZmV0Y2ggc29vblxuICAgICAgICAgICAgLy8gdGhpcy51c2VyQnVpbGRlci5mZXRjaCgpLFxuICAgICAgICAgICAgdGhpcy56b25lQnVpbGRlci5mZXRjaCgpXG4gICAgICAgIF0pLnRoZW4oKHJlc3VsdHMpID0+IHtcbiAgICAgICAgICAgIGxldCByZXBvcnRzRGVwZW5kZW5jaWVzOiBJRGVwZW5kZW5jaWVzLFxuICAgICAgICAgICAgICAgIHJ1bGVzRGVwZW5kZW5jaWVzOiBJRGVwZW5kZW5jaWVzLFxuICAgICAgICAgICAgICAgIGRpc3RyaWJ1dGlvbkxpc3RzRGVwZW5kZW5jaWVzOiBJRGVwZW5kZW5jaWVzLFxuICAgICAgICAgICAgICAgIGRlcGVuZGVuY2llczogSURlcGVuZGVuY2llcyxcbiAgICAgICAgICAgICAgICBjdXN0b21NYXA7XG4gICAgICAgICAgICB0aGlzLmRhdGEuZ3JvdXBzID0gcmVzdWx0c1swXTtcbiAgICAgICAgICAgIHRoaXMuZGF0YS5zZWN1cml0eUdyb3VwcyA9IHJlc3VsdHNbMV07XG4gICAgICAgICAgICB0aGlzLmRhdGEucmVwb3J0cyA9IHJlc3VsdHNbMl07XG4gICAgICAgICAgICB0aGlzLmRhdGEucnVsZXMgPSByZXN1bHRzWzNdO1xuICAgICAgICAgICAgdGhpcy5kYXRhLmRpc3RyaWJ1dGlvbkxpc3RzID0gdGhpcy5kaXN0cmlidXRpb25MaXN0c0J1aWxkZXIuZ2V0UnVsZXNEaXN0cmlidXRpb25MaXN0cyh0aGlzLmRhdGEucnVsZXMubWFwKHJ1bGUgPT4gcnVsZS5pZCkpO1xuICAgICAgICAgICAgdGhpcy5kYXRhLm1pc2MgPSByZXN1bHRzWzVdO1xuICAgICAgICAgICAgbGV0IGdldERlcGVuZGVuY2llcyA9IChlbnRpdGllczogYW55W10sIGVudGl0eVR5cGU6IFRFbnRpdHlUeXBlKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGVudGl0aWVzLnJlZHVjZSgocmVzLCBlbnRpdHkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGVudGl0eURlcCA9IHRoaXMuZ2V0RW50aXR5RGVwZW5kZW5jaWVzKGVudGl0eSwgZW50aXR5VHlwZSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmNvbWJpbmVEZXBlbmRlbmNpZXMocmVzLCBlbnRpdHlEZXApO1xuICAgICAgICAgICAgICAgIH0sIHt9KTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBsZXQgem9uZURlcGVuZGVuY2llcyA9IHt9O1xuICAgICAgICAgICAgaWYodGhpcy5leHBvcnRBbGxab25lc0NoZWNrYm94LmNoZWNrZWQ9PXRydWUpe1xuICAgICAgICAgICAgICAgIGlmKHJlc3VsdHNbNl0pe1xuICAgICAgICAgICAgICAgICAgICAvL3NldHMgZXhwb3J0ZWQgem9uZXMgdG8gYWxsIGRhdGFiYXNlIHpvbmVzXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZGF0YS56b25lcyA9IHJlc3VsdHNbNl07XG4gICAgICAgICAgICAgICAgICAgIHpvbmVEZXBlbmRlbmNpZXMgPSBnZXREZXBlbmRlbmNpZXMocmVzdWx0c1s2XSwgXCJ6b25lc1wiKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZih0aGlzLmV4cG9ydEFsbEFkZGluc0NoZWNrYm94LmNoZWNrZWQ9PWZhbHNlKXtcbiAgICAgICAgICAgICAgICAvL3NldHMgZXhwb3J0ZWQgYWRkaW5zIGVxdWFsIHRvIG5vbmUvZW1wdHkgYXJyYXlcbiAgICAgICAgICAgICAgICB0aGlzLnNldEFkZGluc1RvTnVsbCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY3VzdG9tTWFwID0gdGhpcy5kYXRhLm1pc2MgJiYgdGhpcy5taXNjQnVpbGRlci5nZXRNYXBQcm92aWRlckRhdGEodGhpcy5kYXRhLm1pc2MubWFwUHJvdmlkZXIudmFsdWUpO1xuICAgICAgICAgICAgY3VzdG9tTWFwICYmIHRoaXMuZGF0YS5jdXN0b21NYXBzLnB1c2goY3VzdG9tTWFwKTtcbiAgICAgICAgICAgIHJlcG9ydHNEZXBlbmRlbmNpZXMgPSB0aGlzLnJlcG9ydHNCdWlsZGVyLmdldERlcGVuZGVuY2llcyh0aGlzLmRhdGEucmVwb3J0cyk7XG4gICAgICAgICAgICBydWxlc0RlcGVuZGVuY2llcyA9IHRoaXMucnVsZXNCdWlsZGVyLmdldERlcGVuZGVuY2llcyh0aGlzLmRhdGEucnVsZXMpO1xuICAgICAgICAgICAgZGlzdHJpYnV0aW9uTGlzdHNEZXBlbmRlbmNpZXMgPSB0aGlzLmRpc3RyaWJ1dGlvbkxpc3RzQnVpbGRlci5nZXREZXBlbmRlbmNpZXModGhpcy5kYXRhLmRpc3RyaWJ1dGlvbkxpc3RzKTtcbiAgICAgICAgICAgIGRlcGVuZGVuY2llcyA9IHRoaXMuY29tYmluZURlcGVuZGVuY2llcyh6b25lRGVwZW5kZW5jaWVzLCByZXBvcnRzRGVwZW5kZW5jaWVzLCBydWxlc0RlcGVuZGVuY2llcywgZGlzdHJpYnV0aW9uTGlzdHNEZXBlbmRlbmNpZXMpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMucmVzb2x2ZURlcGVuZGVuY2llcyhkZXBlbmRlbmNpZXMsIHRoaXMuZGF0YSk7XG4gICAgICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgbGV0IG1hcFByb3ZpZGVyID0gdGhpcy5kYXRhLm1pc2MgJiYgdGhpcy5taXNjQnVpbGRlci5nZXRNYXBQcm92aWRlck5hbWUodGhpcy5kYXRhLm1pc2MubWFwUHJvdmlkZXIudmFsdWUpO1xuICAgICAgICAgICAgdGhpcy5zaG93RW50aXR5TWVzc2FnZShncm91cHNCbG9jaywgdGhpcy5kYXRhLmdyb3Vwcy5sZW5ndGggLSAxLCBcImdyb3VwXCIpO1xuICAgICAgICAgICAgdGhpcy5zaG93RW50aXR5TWVzc2FnZShzZWN1cml0eUNsZWFyYW5jZXNCbG9jaywgdGhpcy5kYXRhLnNlY3VyaXR5R3JvdXBzLmxlbmd0aCwgXCJzZWN1cml0eSBjbGVhcmFuY2VcIik7XG4gICAgICAgICAgICB0aGlzLnNob3dFbnRpdHlNZXNzYWdlKHJ1bGVzQmxvY2ssIHRoaXMuZGF0YS5ydWxlcy5sZW5ndGgsIFwicnVsZVwiKTtcbiAgICAgICAgICAgIHRoaXMuc2hvd0VudGl0eU1lc3NhZ2UocmVwb3J0c0Jsb2NrLCB0aGlzLnJlcG9ydHNCdWlsZGVyLmdldEN1c3RvbWl6ZWRSZXBvcnRzUXR5KCksIFwicmVwb3J0XCIpO1xuICAgICAgICAgICAgdGhpcy5zaG93RW50aXR5TWVzc2FnZShkYXNoYm9hcmRzQmxvY2ssIHRoaXMucmVwb3J0c0J1aWxkZXIuZ2V0RGFzaGJvYXJkc1F0eSgpLCBcImRhc2hib2FyZFwiKTtcbiAgICAgICAgICAgIGlmIChtYXBQcm92aWRlcikge1xuICAgICAgICAgICAgICAgIG1hcEJsb2NrRGVzY3JpcHRpb24uaW5uZXJIVE1MID0gbWFwTWVzc2FnZVRlbXBsYXRlLnJlcGxhY2UoXCJ7bWFwUHJvdmlkZXJ9XCIsIG1hcFByb3ZpZGVyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuc2hvd0VudGl0eU1lc3NhZ2UoYWRkaW5zQmxvY2ssIHRoaXMuZGF0YS5taXNjPy5hZGRpbnM/Lmxlbmd0aCB8fCAwLCBcImFkZGluXCIpO1xuICAgICAgICAgICAgLy8gdGhpcy5zaG93RW50aXR5TWVzc2FnZSh1c2Vyc0Jsb2NrLCB0aGlzLmRhdGEudXNlcnMubGVuZ3RoLCBcInVzZXJcIik7XG4gICAgICAgICAgICB0aGlzLnNob3dFbnRpdHlNZXNzYWdlKHpvbmVzQmxvY2ssIHRoaXMuZGF0YS56b25lcy5sZW5ndGgsIFwiem9uZVwiKTtcbiAgICAgICAgICAgIHRoaXMuc2hvd1N5c3RlbVNldHRpbmdzTWVzc2FnZShzeXN0ZW1TZXR0aW5nc0Jsb2NrLCB0aGlzLmV4cG9ydFN5c3RlbVNldHRpbmdzQ2hlY2tib3guY2hlY2tlZCk7XG4gICAgICAgICAgICAvL3RoaXMgZGlzcGxheXMgYWxsIHRoZSBkYXRhL29iamVjdHMgaW4gdGhlIGNvbnNvbGVcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHRoaXMuZGF0YSk7XG4gICAgICAgIH0pLmNhdGNoKChlKSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGUpO1xuICAgICAgICAgICAgYWxlcnQoXCJDYW4ndCBnZXQgY29uZmlnIHRvIGV4cG9ydFwiKTtcbiAgICAgICAgfSkuZmluYWxseSgoKSA9PiB0aGlzLnRvZ2dsZVdhaXRpbmcoKSk7XG4gICAgfVxuXG4gICAgdW5sb2FkICgpIHtcbiAgICAgICAgdGhpcy5hYm9ydEN1cnJlbnRUYXNrKCk7XG4gICAgICAgIHRoaXMuZ3JvdXBzQnVpbGRlci51bmxvYWQoKTtcbiAgICAgICAgdGhpcy5zZWN1cml0eUNsZWFyYW5jZXNCdWlsZGVyLnVubG9hZCgpO1xuICAgICAgICB0aGlzLnJlcG9ydHNCdWlsZGVyLnVubG9hZCgpO1xuICAgICAgICB0aGlzLnJ1bGVzQnVpbGRlci51bmxvYWQoKTtcbiAgICAgICAgdGhpcy5kaXN0cmlidXRpb25MaXN0c0J1aWxkZXIudW5sb2FkKCk7XG4gICAgICAgIHRoaXMubWlzY0J1aWxkZXIudW5sb2FkKCk7XG4gICAgICAgIHRoaXMuZXhwb3J0QnRuLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLmV4cG9ydERhdGEsIGZhbHNlKTtcbiAgICAgICAgdGhpcy5zYXZlQnRuLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLnNhdmVDaGFuZ2VzLCBmYWxzZSk7XG4gICAgICAgIHRoaXMuZXhwb3J0QWxsQWRkaW5zQ2hlY2tib3gucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCB0aGlzLmNoZWNrQm94VmFsdWVDaGFuZ2VkLCBmYWxzZSk7XG4gICAgICAgIHRoaXMuZXhwb3J0QWxsWm9uZXNDaGVja2JveC5yZW1vdmVFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsIHRoaXMuY2hlY2tCb3hWYWx1ZUNoYW5nZWQsIGZhbHNlKTtcbiAgICAgICAgdGhpcy5leHBvcnRTeXN0ZW1TZXR0aW5nc0NoZWNrYm94LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgdGhpcy5jaGVja0JveFZhbHVlQ2hhbmdlZCwgZmFsc2UpO1xuICAgIH1cbn1cblxuZ2VvdGFiLmFkZGluLnJlZ2lzdHJhdGlvbkNvbmZpZyA9IGZ1bmN0aW9uICgpIHtcbiAgICBsZXQgYWRkaW46IEFkZGluO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgaW5pdGlhbGl6ZTogKGFwaSwgc3RhdGUsIGNhbGxiYWNrKSA9PiB7XG4gICAgICAgICAgICBhZGRpbiA9IG5ldyBBZGRpbihhcGkpO1xuICAgICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgfSxcbiAgICAgICAgZm9jdXM6ICgpID0+IHtcbiAgICAgICAgICAgIGFkZGluLnJlbmRlcigpO1xuICAgICAgICAgICAgYWRkaW4uYWRkRXZlbnRIYW5kbGVycygpO1xuICAgICAgICB9LFxuICAgICAgICBibHVyOiAoKSA9PiB7XG4gICAgICAgICAgICBhZGRpbi51bmxvYWQoKTtcbiAgICAgICAgfVxuICAgIH07XG59OyIsImltcG9ydCB7ZW50aXR5VG9EaWN0aW9uYXJ5LCBtZXJnZVVuaXF1ZX0gZnJvbSBcIi4vdXRpbHNcIjtcblxuLy9BIGRpc3RyaWJ1dGlvbiBsaXN0IGxpbmtzIGEgc2V0IG9mIFJ1bGUocykgdG8gYSBzZXQgb2YgUmVjaXBpZW50KHMpLiBXaGVuIGEgUnVsZSBpcyB2aW9sYXRlZCBlYWNoIHJlbGF0ZWQgUmVjaXBpZW50IHdpbGwgcmVjZWl2ZSBhIG5vdGlmaWNhdGlvbiBvZiB0aGUga2luZCBkZWZpbmVkIGJ5IGl0cyBSZWNpcGllbnRUeXBlLlxuaW50ZXJmYWNlIElEaXN0cmlidXRpb25MaXN0IGV4dGVuZHMgSU5hbWVkRW50aXR5IHtcbiAgICByZWNpcGllbnRzOiBhbnlbXTtcbiAgICBydWxlczogYW55W107XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSURpc3RyaWJ1dGlvbkxpc3REZXBlbmRlbmNpZXMge1xuICAgIHJ1bGVzOiBhbnlbXTtcbiAgICB1c2VyczogYW55W107XG4gICAgbm90aWZpY2F0aW9uVGVtcGxhdGVzOiBhbnlbXTtcbiAgICBncm91cHM6IGFueVtdO1xufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBEaXN0cmlidXRpb25MaXN0c0J1aWxkZXIge1xuICAgIHByaXZhdGUgYXBpO1xuICAgIHByaXZhdGUgY3VycmVudFRhc2s7XG4gICAgcHJpdmF0ZSBkaXN0cmlidXRpb25MaXN0czogUmVjb3JkPHN0cmluZywgSURpc3RyaWJ1dGlvbkxpc3Q+O1xuICAgIHByaXZhdGUgbm90aWZpY2F0aW9uVGVtcGxhdGVzO1xuXG4gICAgY29uc3RydWN0b3IoYXBpKSB7XG4gICAgICAgIHRoaXMuYXBpID0gYXBpO1xuICAgIH1cblxuICAgIC8vQSBkaXN0cmlidXRpb24gbGlzdCBsaW5rcyBhIHNldCBvZiBSdWxlKHMpIHRvIGEgc2V0IG9mIFJlY2lwaWVudChzKS4gV2hlbiBhIFJ1bGUgaXMgdmlvbGF0ZWQgZWFjaCByZWxhdGVkIFJlY2lwaWVudCB3aWxsIHJlY2VpdmUgYSBub3RpZmljYXRpb24gb2YgdGhlIGtpbmQgZGVmaW5lZCBieSBpdHMgUmVjaXBpZW50VHlwZS5cbiAgICBwcml2YXRlIGdldERpc3RyaWJ1dGlvbkxpc3RzRGF0YSAoKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIHRoaXMuYXBpLm11bHRpQ2FsbChbXG4gICAgICAgICAgICAgICAgW1wiR2V0XCIsIHtcbiAgICAgICAgICAgICAgICAgICAgXCJ0eXBlTmFtZVwiOiBcIkRpc3RyaWJ1dGlvbkxpc3RcIixcbiAgICAgICAgICAgICAgICB9XSxcbiAgICAgICAgICAgICAgICBbXCJHZXROb3RpZmljYXRpb25XZWJSZXF1ZXN0VGVtcGxhdGVzXCIsIHt9XSxcbiAgICAgICAgICAgICAgICBbXCJHZXROb3RpZmljYXRpb25FbWFpbFRlbXBsYXRlc1wiLCB7fV0sXG4gICAgICAgICAgICAgICAgW1wiR2V0Tm90aWZpY2F0aW9uVGV4dFRlbXBsYXRlc1wiLCB7fV1cbiAgICAgICAgICAgIF0sIHJlc29sdmUsIHJlamVjdCk7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBwcml2YXRlIGFib3J0Q3VycmVudFRhc2sgKCk6IHZvaWQge1xuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrICYmIHRoaXMuY3VycmVudFRhc2suYWJvcnQgJiYgdGhpcy5jdXJyZW50VGFzay5hYm9ydCgpO1xuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrID0gbnVsbDtcbiAgICB9O1xuXG4gICAgcHVibGljIGdldERlcGVuZGVuY2llcyAoZGlzdHJpYnV0aW9uTGlzdHMpOiBJRGlzdHJpYnV0aW9uTGlzdERlcGVuZGVuY2llcyB7XG4gICAgICAgIGxldCBkZXBlbmRlbmNpZXM6IElEaXN0cmlidXRpb25MaXN0RGVwZW5kZW5jaWVzID0ge1xuICAgICAgICAgICAgICAgIHJ1bGVzOiBbXSxcbiAgICAgICAgICAgICAgICB1c2VyczogW10sXG4gICAgICAgICAgICAgICAgZ3JvdXBzOiBbXSxcbiAgICAgICAgICAgICAgICBub3RpZmljYXRpb25UZW1wbGF0ZXM6IFtdXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcHJvY2Vzc0RlcGVuZGVuY2llcyA9IChyZWNpcGllbnQpID0+IHtcbiAgICAgICAgICAgICAgICBsZXQgaWQ6IHN0cmluZyB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICBsZXQgdHlwZTogc3RyaW5nIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgIGxldCB1c2VySWQgPSByZWNpcGllbnQudXNlci5pZDtcbiAgICAgICAgICAgICAgICB1c2VySWQgJiYgZGVwZW5kZW5jaWVzLnVzZXJzLmluZGV4T2YodXNlcklkKSA9PT0gLTEgJiYgZGVwZW5kZW5jaWVzLnVzZXJzLnB1c2godXNlcklkKTtcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKHJlY2lwaWVudC5yZWNpcGllbnRUeXBlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJFbWFpbFwiOlxuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiTG9nUG9wdXBcIjpcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIkxvZ1VyZ2VudFBvcHVwXCI6XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJMb2dPbmx5XCI6XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJUZXh0TWVzc2FnZVwiOlxuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiVGV4dFRvU3BlZWNoQWxsb3dEZWxheVwiOlxuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiV2ViUmVxdWVzdFwiOlxuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiVGV4dFRvU3BlZWNoXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBpZCA9IHJlY2lwaWVudC5ub3RpZmljYXRpb25CaW5hcnlGaWxlICYmIHJlY2lwaWVudC5ub3RpZmljYXRpb25CaW5hcnlGaWxlLmlkO1xuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZSA9IFwibm90aWZpY2F0aW9uVGVtcGxhdGVzXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIkFzc2lnblRvR3JvdXBcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkID0gcmVjaXBpZW50Lmdyb3VwICYmIHJlY2lwaWVudC5ncm91cC5pZDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGUgPSBcImdyb3Vwc1wiO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlkICYmIHR5cGUgJiYgZGVwZW5kZW5jaWVzW3R5cGVdLmluZGV4T2YoaWQpID09PSAtMSAmJiBkZXBlbmRlbmNpZXNbdHlwZV0ucHVzaChpZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY2hlY2tSZWNpcGllbnRzID0gKHJlY2lwaWVudHMsIGRlcGVuZGVuY2llczogSURpc3RyaWJ1dGlvbkxpc3REZXBlbmRlbmNpZXMpOiBJRGlzdHJpYnV0aW9uTGlzdERlcGVuZGVuY2llcyA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlY2lwaWVudHMucmVkdWNlKChkZXBlbmRlbmNpZXMsIHJlY2lwaWVudCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBwcm9jZXNzRGVwZW5kZW5jaWVzKHJlY2lwaWVudCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBkZXBlbmRlbmNpZXM7XG4gICAgICAgICAgICAgICAgfSwgZGVwZW5kZW5jaWVzKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIHJldHVybiBkaXN0cmlidXRpb25MaXN0cy5yZWR1Y2UoKGRlcGVuZGVuY2llczogSURpc3RyaWJ1dGlvbkxpc3REZXBlbmRlbmNpZXMsIGRpc3RyaWJ1dGlvbkxpc3Q6IElEaXN0cmlidXRpb25MaXN0KSA9PiB7XG4gICAgICAgICAgICBkZXBlbmRlbmNpZXMucnVsZXMgPSBtZXJnZVVuaXF1ZShkZXBlbmRlbmNpZXMucnVsZXMsIGRpc3RyaWJ1dGlvbkxpc3QucnVsZXMubWFwKHJ1bGUgPT4gcnVsZS5pZCkpO1xuICAgICAgICAgICAgZGVwZW5kZW5jaWVzID0gY2hlY2tSZWNpcGllbnRzKGRpc3RyaWJ1dGlvbkxpc3QucmVjaXBpZW50cywgZGVwZW5kZW5jaWVzKTtcbiAgICAgICAgICAgIHJldHVybiBkZXBlbmRlbmNpZXM7XG4gICAgICAgIH0sIGRlcGVuZGVuY2llcyk7XG4gICAgfTtcblxuICAgIHB1YmxpYyBmZXRjaCgpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICB0aGlzLmFib3J0Q3VycmVudFRhc2soKTtcbiAgICAgICAgdGhpcy5jdXJyZW50VGFzayA9IHRoaXMuZ2V0RGlzdHJpYnV0aW9uTGlzdHNEYXRhKClcbiAgICAgICAgICAgIC50aGVuKChbZGlzdHJpYnV0aW9uTGlzdHMsIHdlYlRlbXBsYXRlcywgZW1haWxUZW1wbGF0ZXMsIHRleHRUZW1wbGF0ZXNdKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5kaXN0cmlidXRpb25MaXN0cyA9IGVudGl0eVRvRGljdGlvbmFyeShkaXN0cmlidXRpb25MaXN0cyk7XG4gICAgICAgICAgICAgICAgdGhpcy5ub3RpZmljYXRpb25UZW1wbGF0ZXMgPSBlbnRpdHlUb0RpY3Rpb25hcnkod2ViVGVtcGxhdGVzLmNvbmNhdChlbWFpbFRlbXBsYXRlcykuY29uY2F0KHRleHRUZW1wbGF0ZXMpKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5kaXN0cmlidXRpb25MaXN0cztcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuY2F0Y2goY29uc29sZS5lcnJvcilcbiAgICAgICAgICAgIC5maW5hbGx5KCgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRUYXNrID0gbnVsbDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gdGhpcy5jdXJyZW50VGFzaztcbiAgICB9O1xuXG4gICAgcHVibGljIGdldE5vdGlmaWNhdGlvblRlbXBsYXRlRGF0YSAodGVtcGxhdGVJZDogc3RyaW5nKTogYW55IHtcbiAgICAgICAgcmV0dXJuIHRoaXMubm90aWZpY2F0aW9uVGVtcGxhdGVzW3RlbXBsYXRlSWRdO1xuICAgIH07XG5cbiAgICBwdWJsaWMgZ2V0UnVsZXNEaXN0cmlidXRpb25MaXN0cyAocnVsZXNJZHM6IHN0cmluZ1tdKTogSURpc3RyaWJ1dGlvbkxpc3RbXSB7XG4gICAgICAgIHJldHVybiBPYmplY3Qua2V5cyh0aGlzLmRpc3RyaWJ1dGlvbkxpc3RzKS5yZWR1Y2UoKHJlczogSURpc3RyaWJ1dGlvbkxpc3RbXSwgaWQpID0+IHtcbiAgICAgICAgICAgIGxldCBsaXN0ID0gdGhpcy5kaXN0cmlidXRpb25MaXN0c1tpZF07XG4gICAgICAgICAgICBsaXN0LnJ1bGVzLnNvbWUobGlzdFJ1bGUgPT4gcnVsZXNJZHMuaW5kZXhPZihsaXN0UnVsZS5pZCkgPiAtMSkgJiYgcmVzLnB1c2gobGlzdCk7XG4gICAgICAgICAgICByZXR1cm4gcmVzO1xuICAgICAgICB9LCBbXSk7XG4gICAgfTtcblxuICAgIHB1YmxpYyB1bmxvYWQgKCk6IHZvaWQge1xuICAgICAgICB0aGlzLmFib3J0Q3VycmVudFRhc2soKTtcbiAgICB9O1xufSIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi9ibHVlYmlyZC5kLnRzXCIvPlxuaW1wb3J0IHsgZW50aXR5VG9EaWN0aW9uYXJ5LCBleHRlbmQsIElFbnRpdHkgfSBmcm9tIFwiLi91dGlsc1wiO1xuXG5pbnRlcmZhY2UgQ29sb3Ige1xuICAgIHI6IG51bWJlcjtcbiAgICBnOiBudW1iZXI7XG4gICAgYjogbnVtYmVyO1xuICAgIGE6IG51bWJlcjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJR3JvdXAgZXh0ZW5kcyBJSWRFbnRpdHkge1xuICAgIG5hbWU/OiBzdHJpbmc7XG4gICAgY29sb3I/OiBDb2xvcjtcbiAgICBwYXJlbnQ/OiBJR3JvdXA7XG4gICAgY2hpbGRyZW4/OiBJR3JvdXBbXTtcbiAgICB1c2VyPzogYW55O1xufVxuXG5pbnRlcmZhY2UgSU5ld0dyb3VwIGV4dGVuZHMgT21pdDxJR3JvdXAsIFwiaWRcIj4ge1xuICAgIGlkOiBudWxsO1xufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBHcm91cHNCdWlsZGVyIHtcbiAgICBwcm90ZWN0ZWQgYXBpO1xuICAgIHByb3RlY3RlZCBjdXJyZW50VGFzaztcbiAgICBwcm90ZWN0ZWQgZ3JvdXBzOiBJR3JvdXBbXTtcbiAgICBwcm90ZWN0ZWQgdHJlZTogSUdyb3VwW107XG4gICAgcHJvdGVjdGVkIGN1cnJlbnRUcmVlO1xuXG4gICAgcHJpdmF0ZSB1c2VyczogYW55O1xuICAgIHByaXZhdGUgY3VycmVudFVzZXJOYW1lOiBzdHJpbmc7XG5cbiAgICBjb25zdHJ1Y3RvcihhcGk6IGFueSkge1xuICAgICAgICB0aGlzLmFwaSA9IGFwaTtcbiAgICB9XG5cbiAgICAvL2dldHMgdGhlIGdyb3VwcyBhc3NvY2lhdGVkIHdpdGggdGhlIGN1cnJlbnQgdXNlclxuICAgIHByaXZhdGUgZ2V0R3JvdXBzICgpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5hcGkuZ2V0U2Vzc2lvbigoc2Vzc2lvbkRhdGEpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRVc2VyTmFtZSA9IHNlc3Npb25EYXRhLnVzZXJOYW1lO1xuICAgICAgICAgICAgICAgIHRoaXMuYXBpLm11bHRpQ2FsbChbXG4gICAgICAgICAgICAgICAgICAgIFtcIkdldFwiLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlTmFtZTogXCJHcm91cFwiXG4gICAgICAgICAgICAgICAgICAgIH1dLFxuICAgICAgICAgICAgICAgICAgICBbXCJHZXRcIiwge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZU5hbWU6IFwiVXNlclwiXG4gICAgICAgICAgICAgICAgICAgIH1dXG4gICAgICAgICAgICAgICAgXSwgcmVzb2x2ZSwgcmVqZWN0KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgcHJpdmF0ZSBmaW5kQ2hpbGQgKGNoaWxkSWQ6IHN0cmluZywgY3VycmVudEl0ZW06IElOZXdHcm91cCB8IElHcm91cCwgb25BbGxMZXZlbHM6IGJvb2xlYW4gPSBmYWxzZSk6IElHcm91cCB8IG51bGwge1xuICAgICAgICBsZXQgZm91bmRDaGlsZDogSUdyb3VwIHwgbnVsbCA9IG51bGwsXG4gICAgICAgICAgICBjaGlsZHJlbiA9IGN1cnJlbnRJdGVtLmNoaWxkcmVuO1xuICAgICAgICBpZiAoIWNoaWxkSWQgfHwgIWNoaWxkcmVuIHx8ICFjaGlsZHJlbi5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgY2hpbGRyZW4uc29tZShjaGlsZCA9PiB7XG4gICAgICAgICAgICBpZiAoY2hpbGQuaWQgPT09IGNoaWxkSWQpIHtcbiAgICAgICAgICAgICAgICBmb3VuZENoaWxkID0gY2hpbGQ7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZvdW5kQ2hpbGQ7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmIChvbkFsbExldmVscykge1xuICAgICAgICAgICAgICAgICAgICBmb3VuZENoaWxkID0gdGhpcy5maW5kQ2hpbGQoY2hpbGRJZCwgY2hpbGQsIG9uQWxsTGV2ZWxzKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZvdW5kQ2hpbGQ7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIGZvdW5kQ2hpbGQ7XG4gICAgfTtcblxuICAgIHByaXZhdGUgZ2V0VXNlckJ5UHJpdmF0ZUdyb3VwSWQgKGdyb3VwSWQ6IHN0cmluZyk6IGFueSB7XG4gICAgICAgIGxldCBvdXRwdXRVc2VyID0gbnVsbCxcbiAgICAgICAgICAgIHVzZXJIYXNQcml2YXRlR3JvdXAgPSAodXNlciwgZ3JvdXBJZCk6IGJvb2xlYW4gPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiB1c2VyLnByaXZhdGVVc2VyR3JvdXBzLnNvbWUoZ3JvdXAgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZ3JvdXAuaWQgPT09IGdyb3VwSWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICB0aGlzLnVzZXJzLnNvbWUodXNlciA9PiB7XG4gICAgICAgICAgICBpZiAodXNlckhhc1ByaXZhdGVHcm91cCh1c2VyLCBncm91cElkKSkge1xuICAgICAgICAgICAgICAgIG91dHB1dFVzZXIgPSB1c2VyO1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIG91dHB1dFVzZXI7XG4gICAgfTtcblxuICAgIHByaXZhdGUgZ2V0UHJpdmF0ZUdyb3VwRGF0YSAoZ3JvdXBJZDogc3RyaW5nKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBpZDogZ3JvdXBJZCxcbiAgICAgICAgICAgIHVzZXI6IHRoaXMuZ2V0VXNlckJ5UHJpdmF0ZUdyb3VwSWQoZ3JvdXBJZCksXG4gICAgICAgICAgICBjaGlsZHJlbjogW10sXG4gICAgICAgICAgICBuYW1lOiBcIlByaXZhdGVVc2VyR3JvdXBOYW1lXCIsXG4gICAgICAgICAgICBwYXJlbnQ6IHtcbiAgICAgICAgICAgICAgICBpZDogXCJHcm91cFByaXZhdGVVc2VySWRcIixcbiAgICAgICAgICAgICAgICBjaGlsZHJlbjogW3sgaWQ6IGdyb3VwSWQgfV1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9O1xuXG4gICAgcHJvdGVjdGVkIGNyZWF0ZUdyb3Vwc1RyZWUgKGdyb3VwczogSUdyb3VwW10pOiBhbnlbXSB7XG4gICAgICAgIGxldCBub2RlTG9va3VwLFxuICAgICAgICAgICAgdHJhdmVyc2VDaGlsZHJlbiA9IGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICAgICAgICAgICAgbGV0IGNoaWxkcmVuOiBJR3JvdXBbXSxcbiAgICAgICAgICAgICAgICAgICAgaWQ6IHN0cmluZztcblxuICAgICAgICAgICAgICAgIGNoaWxkcmVuID0gbm9kZS5jaGlsZHJlbjtcblxuICAgICAgICAgICAgICAgIGlmIChjaGlsZHJlbikge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMCwgaWkgPSBjaGlsZHJlbi5sZW5ndGg7IGkgPCBpaTsgaSArPSAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZCA9IGNoaWxkcmVuW2ldLmlkO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobm9kZUxvb2t1cFtpZF0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlLmNoaWxkcmVuW2ldID0gbm9kZUxvb2t1cFtpZF07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZS5jaGlsZHJlbltpXS5wYXJlbnQgPSBub2RlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBub2RlTG9va3VwW2lkXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHRyYXZlcnNlQ2hpbGRyZW4obm9kZS5jaGlsZHJlbltpXSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgIG5vZGVMb29rdXAgPSBlbnRpdHlUb0RpY3Rpb25hcnkoZ3JvdXBzLCBlbnRpdHkgPT4ge1xuICAgICAgICAgICAgbGV0IG5ld0VudGl0eSA9IGV4dGVuZCh7fSwgZW50aXR5KTtcbiAgICAgICAgICAgIGlmIChuZXdFbnRpdHkuY2hpbGRyZW4pIHtcbiAgICAgICAgICAgICAgICBuZXdFbnRpdHkuY2hpbGRyZW4gPSBuZXdFbnRpdHkuY2hpbGRyZW4uc2xpY2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBuZXdFbnRpdHk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIE9iamVjdC5rZXlzKG5vZGVMb29rdXApLmZvckVhY2goa2V5ID0+IHtcbiAgICAgICAgICAgIG5vZGVMb29rdXBba2V5XSAmJiB0cmF2ZXJzZUNoaWxkcmVuKG5vZGVMb29rdXBba2V5XSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBPYmplY3Qua2V5cyhub2RlTG9va3VwKS5tYXAoa2V5ID0+IHtcbiAgICAgICAgICAgIHJldHVybiBub2RlTG9va3VwW2tleV07XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBwcm90ZWN0ZWQgYWJvcnRDdXJyZW50VGFzayAoKTogdm9pZCB7XG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgJiYgdGhpcy5jdXJyZW50VGFzay5hYm9ydCAmJiB0aGlzLmN1cnJlbnRUYXNrLmFib3J0KCk7XG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgPSBudWxsO1xuICAgIH07XG5cbiAgICAvL2ZpbGxzIHRoZSBncm91cCBidWlsZGVyIHdpdGggdGhlIHJlbGV2YW50IGluZm9ybWF0aW9uXG4gICAgcHVibGljIGZldGNoICgpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICB0aGlzLmFib3J0Q3VycmVudFRhc2soKTtcbiAgICAgICAgdGhpcy5jdXJyZW50VGFzayA9IHRoaXMuZ2V0R3JvdXBzKClcbiAgICAgICAgICAgIC50aGVuKChbZ3JvdXBzLCB1c2Vyc10pID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmdyb3VwcyA9IGdyb3VwcztcbiAgICAgICAgICAgICAgICB0aGlzLnVzZXJzID0gdXNlcnM7XG4gICAgICAgICAgICAgICAgdGhpcy50cmVlID0gdGhpcy5jcmVhdGVHcm91cHNUcmVlKGdyb3Vwcyk7XG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50VHJlZSA9IGV4dGVuZCh7fSwgdGhpcy50cmVlKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVGbGF0R3JvdXBzTGlzdCh0aGlzLnRyZWUpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5jYXRjaChjb25zb2xlLmVycm9yKVxuICAgICAgICAgICAgLmZpbmFsbHkoKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudFRhc2sgPSBudWxsO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB0aGlzLmN1cnJlbnRUYXNrO1xuICAgIH07XG5cbiAgICBwdWJsaWMgY3JlYXRlRmxhdEdyb3Vwc0xpc3QgKGdyb3VwczogSUdyb3VwW10sIG5vdEluY2x1ZGVDaGlsZHJlbjogYm9vbGVhbiA9IGZhbHNlKTogSUdyb3VwW10ge1xuICAgICAgICBsZXQgZm91bmRJZHM6IHN0cmluZ1tdID0gW10sXG4gICAgICAgICAgICBncm91cHNUb0FkZDogSUdyb3VwW10gPSBbXSxcbiAgICAgICAgICAgIG1ha2VGbGF0UGFyZW50cyA9IChpdGVtOiBJR3JvdXApID0+IHtcbiAgICAgICAgICAgICAgICBsZXQgaXRlbUNvcHkgPSBleHRlbmQoe30sIGl0ZW0pO1xuICAgICAgICAgICAgICAgIGlmIChpdGVtICYmIGl0ZW0ucGFyZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIG1ha2VGbGF0UGFyZW50cyhpdGVtLnBhcmVudCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGl0ZW1Db3B5LmNoaWxkcmVuID0gaXRlbUNvcHkuY2hpbGRyZW4ubWFwKGNoaWxkID0+IGNoaWxkLmlkKTtcbiAgICAgICAgICAgICAgICBpdGVtQ29weS5wYXJlbnQgPSBpdGVtLnBhcmVudCA/IHtpZDogaXRlbS5wYXJlbnQuaWQsIG5hbWU6IGl0ZW0ucGFyZW50Lm5hbWV9IDogbnVsbDtcbiAgICAgICAgICAgICAgICBpZiAoZm91bmRJZHMuaW5kZXhPZihpdGVtLmlkKSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgZ3JvdXBzVG9BZGQucHVzaChpdGVtQ29weSk7XG4gICAgICAgICAgICAgICAgICAgIGZvdW5kSWRzLnB1c2goaXRlbS5pZCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1ha2VGbGF0Q2hpbGRyZW4gPSAoaXRlbSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChpdGVtICYmIGl0ZW0uY2hpbGRyZW4gJiYgaXRlbS5jaGlsZHJlbi5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgaXRlbS5jaGlsZHJlbi5mb3JFYWNoKChjaGlsZCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGNoaWxkQ29weTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmb3VuZElkcy5pbmRleE9mKGNoaWxkLmlkKSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYWtlRmxhdENoaWxkcmVuKGNoaWxkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkQ29weSA9IGV4dGVuZCh7fSwgY2hpbGQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGRDb3B5LmNoaWxkcmVuID0gY2hpbGRDb3B5LmNoaWxkcmVuLm1hcChjaGlsZElubmVyID0+IGNoaWxkSW5uZXIuaWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGRDb3B5LnBhcmVudCA9IGNoaWxkQ29weS5wYXJlbnQgPyB7aWQ6IGNoaWxkQ29weS5wYXJlbnQuaWQsIG5hbWU6IGNoaWxkQ29weS5wYXJlbnQubmFtZX0gOiBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGZvdW5kSWRzLmluZGV4T2YoY2hpbGQuaWQpID09PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdyb3Vwc1RvQWRkLnB1c2goY2hpbGRDb3B5KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3VuZElkcy5wdXNoKGNoaWxkLmlkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcblxuICAgICAgICBncm91cHMuZm9yRWFjaChtYWtlRmxhdFBhcmVudHMpO1xuICAgICAgICAhbm90SW5jbHVkZUNoaWxkcmVuICYmIGdyb3Vwcy5mb3JFYWNoKG1ha2VGbGF0Q2hpbGRyZW4pO1xuICAgICAgICByZXR1cm4gZ3JvdXBzVG9BZGQ7XG4gICAgfTtcblxuICAgIHB1YmxpYyBnZXRHcm91cHNEYXRhIChncm91cElkczogc3RyaW5nW10sIG5vdEluY2x1ZGVDaGlsZHJlbjogYm9vbGVhbiA9IGZhbHNlKTogSUdyb3VwW10ge1xuICAgICAgICBsZXQgdHJlZUdyb3VwcyA9IGdyb3VwSWRzLm1hcChncm91cElkID0+XG4gICAgICAgICAgICB0aGlzLmZpbmRDaGlsZChncm91cElkLCB7aWQ6IG51bGwsIGNoaWxkcmVuOiB0aGlzLnRyZWV9LCB0cnVlKSB8fCB0aGlzLmdldFByaXZhdGVHcm91cERhdGEoZ3JvdXBJZClcbiAgICAgICAgKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlRmxhdEdyb3Vwc0xpc3QodHJlZUdyb3Vwcywgbm90SW5jbHVkZUNoaWxkcmVuKTtcbiAgICB9O1xuXG4gICAgcHVibGljIGdldEN1c3RvbUdyb3Vwc0RhdGEgKGdyb3VwSWRzOiBzdHJpbmdbXSwgYWxsR3JvdXBzOiBJR3JvdXBbXSk6IElHcm91cFtdIHtcbiAgICAgICAgbGV0IGdyb3Vwc1RyZWUgPSB0aGlzLmNyZWF0ZUdyb3Vwc1RyZWUoYWxsR3JvdXBzKSxcbiAgICAgICAgICAgIHRyZWVHcm91cHMgPSBncm91cElkcy5tYXAoZ3JvdXBJZCA9PlxuICAgICAgICAgICAgICAgIHRoaXMuZmluZENoaWxkKGdyb3VwSWQsIHtpZDogbnVsbCwgY2hpbGRyZW46IGdyb3Vwc1RyZWV9LCB0cnVlKSB8fCB0aGlzLmdldFByaXZhdGVHcm91cERhdGEoZ3JvdXBJZClcbiAgICAgICAgICAgICk7XG4gICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZUZsYXRHcm91cHNMaXN0KHRyZWVHcm91cHMsIHRydWUpO1xuICAgIH07XG5cbiAgICBwdWJsaWMgZ2V0UHJpdmF0ZUdyb3Vwc1VzZXJzKGdyb3VwczogSUdyb3VwW10pIHtcbiAgICAgICAgcmV0dXJuIGdyb3Vwcy5yZWR1Y2UoKHVzZXJzOiBJRW50aXR5W10sIGdyb3VwKSA9PiB7XG4gICAgICAgICAgICBncm91cC51c2VyICYmIGdyb3VwLnVzZXIubmFtZSAhPT0gdGhpcy5jdXJyZW50VXNlck5hbWUgJiYgdXNlcnMucHVzaChncm91cC51c2VyKTtcbiAgICAgICAgICAgIHJldHVybiB1c2VycztcbiAgICAgICAgfSwgW10pO1xuICAgIH07XG5cbiAgICBwdWJsaWMgdW5sb2FkICgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5hYm9ydEN1cnJlbnRUYXNrKCk7XG4gICAgfTtcbn0iLCJpbXBvcnQgeyBlbnRpdHlUb0RpY3Rpb25hcnkgfSBmcm9tIFwiLi91dGlsc1wiO1xuXG50eXBlIFRNYXBQcm92aWRlclR5cGUgPSBcImRlZmF1bHRcIiB8IFwiYWRkaXRpb25hbFwiIHwgXCJjdXN0b21cIjtcblxuZXhwb3J0IGludGVyZmFjZSBJTWlzY0RhdGEge1xuICAgIG1hcFByb3ZpZGVyOiB7XG4gICAgICAgIHZhbHVlOiBzdHJpbmc7XG4gICAgICAgIHR5cGU6IFRNYXBQcm92aWRlclR5cGU7XG4gICAgfTtcbiAgICBjdXJyZW50VXNlcjogYW55O1xuICAgIGlzVW5zaWduZWRBZGRpbnNBbGxvd2VkOiBib29sZWFuO1xuICAgIGFkZGluczogc3RyaW5nW107XG4gICAgcHVyZ2VTZXR0aW5ncz86IGFueTtcbiAgICBlbWFpbFNlbmRlckZyb20/OiBzdHJpbmc7XG4gICAgY3VzdG9tZXJDbGFzc2lmaWNhdGlvbj86IHN0cmluZztcbiAgICBpc01hcmtldHBsYWNlUHVyY2hhc2VzQWxsb3dlZD86IGJvb2xlYW47XG4gICAgaXNSZXNlbGxlckF1dG9Mb2dpbkFsbG93ZWQ/OiBib29sZWFuO1xuICAgIGlzVGhpcmRQYXJ0eU1hcmtldHBsYWNlQXBwc0FsbG93ZWQ/OiBib29sZWFuO1xufVxuXG5leHBvcnQgY2xhc3MgTWlzY0J1aWxkZXIge1xuICAgIHByaXZhdGUgcmVhZG9ubHkgYXBpO1xuICAgIHByaXZhdGUgY3VzdG9tTWFwUHJvdmlkZXJzO1xuICAgIHByaXZhdGUgY3VycmVudFRhc2s7XG4gICAgcHJpdmF0ZSBjdXJyZW50VXNlcjtcbiAgICBwcml2YXRlIGlzVW5zaWduZWRBZGRpbnNBbGxvd2VkO1xuICAgIHByaXZhdGUgYWRkaW5zOiBzdHJpbmdbXTtcbiAgICBwcml2YXRlIHJlYWRvbmx5IGRlZmF1bHRNYXBQcm92aWRlcnMgPSB7XG4gICAgICAgIEdvb2dsZU1hcHM6IFwiR29vZ2xlIE1hcHNcIixcbiAgICAgICAgSGVyZTogXCJIRVJFIE1hcHNcIixcbiAgICAgICAgTWFwQm94OiBcIk1hcEJveFwiXG4gICAgfTtcblxuICAgIHByaXZhdGUgYWJvcnRDdXJyZW50VGFzayAoKSB7XG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgJiYgdGhpcy5jdXJyZW50VGFzay5hYm9ydCAmJiB0aGlzLmN1cnJlbnRUYXNrLmFib3J0KCk7XG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgPSBudWxsO1xuICAgIH1cblxuICAgIHByaXZhdGUgZ2V0QWxsb3dlZEFkZGlucyAoYWxsQWRkaW5zOiBzdHJpbmdbXSkge1xuICAgICAgICByZXR1cm4gYWxsQWRkaW5zLmZpbHRlcihhZGRpbiA9PiB7XG4gICAgICAgICAgICAvL3JlbW92ZXMgdGhlIGN1cnJlbnQgYWRkaW4gLSByZWdpc3RyYXRpb24gY29uZmlnXG4gICAgICAgICAgICBpZih0aGlzLmlzQ3VycmVudEFkZGluKGFkZGluKSlcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsZXQgYWRkaW5Db25maWcgPSBKU09OLnBhcnNlKGFkZGluKTtcbiAgICAgICAgICAgIGlmKGFkZGluQ29uZmlnLml0ZW1zKSB7XG4gICAgICAgICAgICAgICAgLy9NdWx0aSBsaW5lIGFkZGluIHN0cnVjdHVyZSBjaGVja1xuICAgICAgICAgICAgICAgIHJldHVybiBhZGRpbkNvbmZpZyAmJiBBcnJheS5pc0FycmF5KGFkZGluQ29uZmlnLml0ZW1zKSAmJiBhZGRpbkNvbmZpZy5pdGVtcy5ldmVyeShpdGVtID0+IHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHVybCA9IGl0ZW0udXJsO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5pc1ZhbGlkVXJsKHVybCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAvL1NpbmdsZSBsaW5lIGFkZGluIHN0cnVjdHVyZSBjaGVja1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmlzVmFsaWRVcmwoYWRkaW5Db25maWcudXJsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy9UZXN0cyBhIFVSTCBmb3IgZG91YmxlIHNsYXNoLiBBY2NlcHRzIGEgdXJsIGFzIGEgc3RyaW5nIGFzIGEgYXJndW1lbnQuXG4gICAgLy9SZXR1cm5zIHRydWUgaWYgdGhlIHVybCBjb250YWlucyBhIGRvdWJsZSBzbGFzaCAvL1xuICAgIC8vUmV0dXJucyBmYWxzZSBpZiB0aGUgdXJsIGRvZXMgbm90IGNvbnRhaW4gYSBkb3VibGUgc2xhc2guXG4gICAgcHJpdmF0ZSBpc1ZhbGlkVXJsKHVybDogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgICAgIGlmICh1cmwgJiYgdXJsLmluZGV4T2YoXCJcXC9cXC9cIikgPiAtMSlcbiAgICAgICAge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHByaXZhdGUgaXNDdXJyZW50QWRkaW4gKGFkZGluOiBzdHJpbmcpIHtcbiAgICAgICAgcmV0dXJuICgoYWRkaW4uaW5kZXhPZihcIlJlZ2lzdHJhdGlvbiBjb25maWdcIikgPiAtMSl8fFxuICAgICAgICAoYWRkaW4udG9Mb3dlckNhc2UoKS5pbmRleE9mKFwicmVnaXN0cmF0aW9uQ29uZmlnXCIudG9Mb3dlckNhc2UoKSkgPiAtMSkpO1xuICAgIH1cblxuICAgIGNvbnN0cnVjdG9yKGFwaSkge1xuICAgICAgICB0aGlzLmFwaSA9IGFwaTtcbiAgICB9XG5cbiAgICAvL2ZpbGxzIHRoZSBNaXNjIGJ1aWxkZXIgKHN5c3RlbSBzZXR0aW5ncykgd2l0aCB0aGUgcmVsZXZhbnQgaW5mb3JtYXRpb25cbiAgICBmZXRjaCAoaW5jbHVkZVN5c1NldHRpbmdzOiBib29sZWFuKTogUHJvbWlzZTxJTWlzY0RhdGE+IHtcbiAgICAgICAgdGhpcy5hYm9ydEN1cnJlbnRUYXNrKCk7XG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICB0aGlzLmFwaS5nZXRTZXNzaW9uKChzZXNzaW9uRGF0YSkgPT4ge1xuICAgICAgICAgICAgICAgIGxldCB1c2VyTmFtZSA9IHNlc3Npb25EYXRhLnVzZXJOYW1lO1xuICAgICAgICAgICAgICAgIHRoaXMuYXBpLm11bHRpQ2FsbChbXG4gICAgICAgICAgICAgICAgICAgICAgICBbXCJHZXRcIiwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGVOYW1lOiBcIlVzZXJcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWFyY2g6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogdXNlck5hbWVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XSxcbiAgICAgICAgICAgICAgICAgICAgICAgIFtcIkdldFwiLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZU5hbWU6IFwiU3lzdGVtU2V0dGluZ3NcIlxuICAgICAgICAgICAgICAgICAgICAgICAgfV1cbiAgICAgICAgICAgICAgICAgICAgXSwgcmVzb2x2ZSwgcmVqZWN0KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KS50aGVuKChyZXN1bHQ6IGFueSkgPT4ge1xuICAgICAgICAgICAgbGV0IGN1cnJlbnRVc2VyID0gcmVzdWx0WzBdWzBdIHx8IHJlc3VsdFswXSxcbiAgICAgICAgICAgICAgICBzeXN0ZW1TZXR0aW5ncyA9IHJlc3VsdFsxXVswXSB8fCByZXN1bHRbMV0sXG4gICAgICAgICAgICAgICAgdXNlck1hcFByb3ZpZGVySWQgPSBjdXJyZW50VXNlci5kZWZhdWx0TWFwRW5naW5lLFxuICAgICAgICAgICAgICAgIGRlZmF1bHRNYXBQcm92aWRlcklkID0gc3lzdGVtU2V0dGluZ3MubWFwUHJvdmlkZXIsXG4gICAgICAgICAgICAgICAgbWFwUHJvdmlkZXJJZCA9IHRoaXMuZ2V0TWFwUHJvdmlkZXJUeXBlKHVzZXJNYXBQcm92aWRlcklkKSA9PT0gXCJjdXN0b21cIiA/IHVzZXJNYXBQcm92aWRlcklkIDogZGVmYXVsdE1hcFByb3ZpZGVySWQ7XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRVc2VyID0gY3VycmVudFVzZXI7XG4gICAgICAgICAgICB0aGlzLmN1c3RvbU1hcFByb3ZpZGVycyA9IGVudGl0eVRvRGljdGlvbmFyeShzeXN0ZW1TZXR0aW5ncy5jdXN0b21XZWJNYXBQcm92aWRlckxpc3QpO1xuICAgICAgICAgICAgdGhpcy5pc1Vuc2lnbmVkQWRkaW5zQWxsb3dlZCA9IHN5c3RlbVNldHRpbmdzLmFsbG93VW5zaWduZWRBZGRJbjtcbiAgICAgICAgICAgIHRoaXMuYWRkaW5zID0gdGhpcy5nZXRBbGxvd2VkQWRkaW5zKHN5c3RlbVNldHRpbmdzLmN1c3RvbWVyUGFnZXMpO1xuICAgICAgICAgICAgbGV0IG91dHB1dDogSU1pc2NEYXRhID0ge1xuICAgICAgICAgICAgICAgIG1hcFByb3ZpZGVyOiB7XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBtYXBQcm92aWRlcklkLFxuICAgICAgICAgICAgICAgICAgICB0eXBlOiB0aGlzLmdldE1hcFByb3ZpZGVyVHlwZShtYXBQcm92aWRlcklkKVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgY3VycmVudFVzZXI6IHRoaXMuY3VycmVudFVzZXIsXG4gICAgICAgICAgICAgICAgaXNVbnNpZ25lZEFkZGluc0FsbG93ZWQ6IHRoaXMuaXNVbnNpZ25lZEFkZGluc0FsbG93ZWQsXG4gICAgICAgICAgICAgICAgYWRkaW5zOiB0aGlzLmFkZGluc1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGlmIChpbmNsdWRlU3lzU2V0dGluZ3MpIHtcbiAgICAgICAgICAgICAgICBvdXRwdXQucHVyZ2VTZXR0aW5ncyA9IHN5c3RlbVNldHRpbmdzLnB1cmdlU2V0dGluZ3M7XG4gICAgICAgICAgICAgICAgb3V0cHV0LmVtYWlsU2VuZGVyRnJvbSA9IHN5c3RlbVNldHRpbmdzLmVtYWlsU2VuZGVyRnJvbTtcbiAgICAgICAgICAgICAgICBvdXRwdXQuY3VzdG9tZXJDbGFzc2lmaWNhdGlvbiA9IHN5c3RlbVNldHRpbmdzLmN1c3RvbWVyQ2xhc3NpZmljYXRpb247XG4gICAgICAgICAgICAgICAgb3V0cHV0LmlzTWFya2V0cGxhY2VQdXJjaGFzZXNBbGxvd2VkID0gc3lzdGVtU2V0dGluZ3MuYWxsb3dNYXJrZXRwbGFjZVB1cmNoYXNlcztcbiAgICAgICAgICAgICAgICBvdXRwdXQuaXNSZXNlbGxlckF1dG9Mb2dpbkFsbG93ZWQgPSBzeXN0ZW1TZXR0aW5ncy5hbGxvd1Jlc2VsbGVyQXV0b0xvZ2luO1xuICAgICAgICAgICAgICAgIG91dHB1dC5pc1RoaXJkUGFydHlNYXJrZXRwbGFjZUFwcHNBbGxvd2VkID0gc3lzdGVtU2V0dGluZ3MuYWxsb3dUaGlyZFBhcnR5TWFya2V0cGxhY2VBcHBzO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG91dHB1dDtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB0aGlzLmN1cnJlbnRUYXNrO1xuICAgIH1cblxuICAgIGdldE1hcFByb3ZpZGVyVHlwZSAobWFwUHJvdmlkZXJJZDogc3RyaW5nKTogVE1hcFByb3ZpZGVyVHlwZSB7XG4gICAgICAgIHJldHVybiAhbWFwUHJvdmlkZXJJZCB8fCB0aGlzLmRlZmF1bHRNYXBQcm92aWRlcnNbbWFwUHJvdmlkZXJJZF0gPyBcImRlZmF1bHRcIiA6IFwiY3VzdG9tXCI7XG4gICAgfVxuXG4gICAgZ2V0TWFwUHJvdmlkZXJOYW1lIChtYXBQcm92aWRlcklkOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gbWFwUHJvdmlkZXJJZCAmJiAodGhpcy5kZWZhdWx0TWFwUHJvdmlkZXJzW21hcFByb3ZpZGVySWRdIHx8ICh0aGlzLmN1c3RvbU1hcFByb3ZpZGVyc1ttYXBQcm92aWRlcklkXSAmJiB0aGlzLmN1c3RvbU1hcFByb3ZpZGVyc1ttYXBQcm92aWRlcklkXS5uYW1lKSB8fCBtYXBQcm92aWRlcklkKTtcbiAgICB9XG5cbiAgICBnZXRNYXBQcm92aWRlckRhdGEgKG1hcFByb3ZpZGVySWQ6IHN0cmluZykge1xuICAgICAgICByZXR1cm4gbWFwUHJvdmlkZXJJZCAmJiB0aGlzLmN1c3RvbU1hcFByb3ZpZGVyc1ttYXBQcm92aWRlcklkXTtcbiAgICB9XG5cbiAgICBnZXRBZGRpbnNEYXRhIChpbmNsdWRlVGhpc0FkZGluID0gZmFsc2UpIHtcbiAgICAgICAgcmV0dXJuICFpbmNsdWRlVGhpc0FkZGluID8gdGhpcy5hZGRpbnMuZmlsdGVyKGFkZGluID0+ICF0aGlzLmlzQ3VycmVudEFkZGluKGFkZGluKSkgOiB0aGlzLmFkZGlucztcbiAgICB9XG5cbiAgICB1bmxvYWQgKCk6IHZvaWQge1xuICAgICAgICB0aGlzLmFib3J0Q3VycmVudFRhc2soKTtcbiAgICB9XG59IiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uL2JsdWViaXJkLmQudHNcIi8+XG5pbXBvcnQgeyBJR3JvdXAgfSBmcm9tIFwiLi9ncm91cHNCdWlsZGVyXCI7XG5pbXBvcnQgeyBnZXRGaWx0ZXJTdGF0ZVVuaXF1ZUdyb3VwcywgSVNjb3BlR3JvdXBGaWx0ZXIgfSBmcm9tIFwiLi9zY29wZUdyb3VwRmlsdGVyXCI7XG5pbXBvcnQgKiBhcyBVdGlscyBmcm9tIFwiLi91dGlsc1wiO1xuXG5jb25zdCBSRVBPUlRfVFlQRV9EQVNIQk9BRCA9IFwiRGFzaGJvYXJkXCI7XG5cbmludGVyZmFjZSBJU2VydmVyUmVwb3J0IGV4dGVuZHMgSUlkRW50aXR5IHtcbiAgICBncm91cHM6IElHcm91cFtdO1xuICAgIGluY2x1ZGVBbGxDaGlsZHJlbkdyb3VwczogSUdyb3VwW107XG4gICAgaW5jbHVkZURpcmVjdENoaWxkcmVuT25seUdyb3VwczogSUdyb3VwW107XG4gICAgaW5kaXZpZHVhbFJlY2lwaWVudHM6IElJZEVudGl0eVtdO1xuICAgIHNjb3BlR3JvdXBzOiBJR3JvdXBbXTtcbiAgICBzY29wZUdyb3VwRmlsdGVyPzogSUlkRW50aXR5O1xuICAgIGRlc3RpbmF0aW9uPzogc3RyaW5nO1xuICAgIHRlbXBsYXRlOiBJUmVwb3J0VGVtcGxhdGU7XG4gICAgbGFzdE1vZGlmaWVkVXNlcjtcbiAgICBhcmd1bWVudHM6IHtcbiAgICAgICAgcnVsZXM/OiBhbnlbXTtcbiAgICAgICAgZGV2aWNlcz86IGFueVtdO1xuICAgICAgICB6b25lVHlwZUxpc3Q/OiBhbnlbXTtcbiAgICAgICAgW3Byb3BOYW1lOiBzdHJpbmddOiBhbnk7XG4gICAgfTtcbiAgICBbcHJvcE5hbWU6IHN0cmluZ106IGFueTtcbn1cblxuaW50ZXJmYWNlIElSZXBvcnQgZXh0ZW5kcyBJU2VydmVyUmVwb3J0IHtcbiAgICBzY29wZUdyb3VwRmlsdGVyPzogSVNjb3BlR3JvdXBGaWx0ZXI7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSVJlcG9ydERlcGVuZGVuY2llcyB7XG4gICAgZGV2aWNlczogc3RyaW5nW107XG4gICAgcnVsZXM6IHN0cmluZ1tdO1xuICAgIHpvbmVUeXBlczogc3RyaW5nW107XG4gICAgZ3JvdXBzOiBzdHJpbmdbXTtcbiAgICB1c2Vyczogc3RyaW5nW107XG59XG5cbmludGVyZmFjZSBJUmVwb3J0VGVtcGxhdGUgZXh0ZW5kcyBJSWRFbnRpdHkge1xuICAgIG5hbWU6IHN0cmluZztcbiAgICBpc1N5c3RlbTogYm9vbGVhbjtcbiAgICByZXBvcnREYXRhU291cmNlOiBzdHJpbmc7XG4gICAgcmVwb3J0VGVtcGxhdGVUeXBlOiBzdHJpbmc7XG4gICAgcmVwb3J0czogSVJlcG9ydFtdO1xuICAgIGJpbmFyeURhdGE/OiBzdHJpbmc7XG4gICAgW3Byb3BOYW1lOiBzdHJpbmddOiBhbnk7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFJlcG9ydHNCdWlsZGVyIHtcbiAgICBwcml2YXRlIHJlYWRvbmx5IGFwaTtcbiAgICBwcml2YXRlIGN1cnJlbnRUYXNrO1xuICAgIHByaXZhdGUgYWxsUmVwb3J0czogSVJlcG9ydFtdO1xuICAgIHByaXZhdGUgc3RydWN0dXJlZFJlcG9ydHM7XG4gICAgcHJpdmF0ZSBkYXNoYm9hcmRzTGVuZ3RoOiBudW1iZXI7XG4gICAgcHJpdmF0ZSBhbGxUZW1wbGF0ZXM6IElSZXBvcnRUZW1wbGF0ZVtdO1xuXG4gICAgcHJpdmF0ZSBnZXRSZXBvcnRzICgpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5hcGkubXVsdGlDYWxsKFtcbiAgICAgICAgICAgICAgICBbXCJHZXRSZXBvcnRTY2hlZHVsZXNcIiwge1xuICAgICAgICAgICAgICAgICAgICBcImluY2x1ZGVUZW1wbGF0ZURldGFpbHNcIjogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgXCJhcHBseVVzZXJGaWx0ZXJcIjogZmFsc2VcbiAgICAgICAgICAgICAgICB9XSxcbiAgICAgICAgICAgICAgICBbXCJHZXRcIiwge1xuICAgICAgICAgICAgICAgICAgICBcInR5cGVOYW1lXCI6IFwiUmVwb3J0VGVtcGxhdGVcIixcbiAgICAgICAgICAgICAgICAgICAgXCJzZWFyY2hcIjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5jbHVkZUJpbmFyeURhdGE6IGZhbHNlXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XSxcbiAgICAgICAgICAgICAgICBbXCJHZXREYXNoYm9hcmRJdGVtc1wiLCB7fV1cbiAgICAgICAgICAgIF0sIHJlc29sdmUsIHJlamVjdCk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgcG9wdWxhdGVTY29wZUdyb3VwRmlsdGVycyAocmVwb3J0czogSVNlcnZlclJlcG9ydFtdKTogUHJvbWlzZTxJUmVwb3J0W10+IHtcbiAgICAgICAgY29uc3QgcmVxdWVzdHMgPSByZXBvcnRzLnJlZHVjZSgocmVzLCByZXBvcnQpID0+IHtcbiAgICAgICAgICAgIGlmIChyZXBvcnQuc2NvcGVHcm91cEZpbHRlciAmJiByZXBvcnQuc2NvcGVHcm91cEZpbHRlci5pZCkge1xuICAgICAgICAgICAgICAgIHJlcy5wdXNoKFtcIkdldFwiLCB7XG4gICAgICAgICAgICAgICAgICAgIFwidHlwZU5hbWVcIjogXCJHcm91cEZpbHRlclwiLFxuICAgICAgICAgICAgICAgICAgICBcInNlYXJjaFwiOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZDogcmVwb3J0LnNjb3BlR3JvdXBGaWx0ZXIuaWRcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1dKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJlcztcbiAgICAgICAgfSwgW10gYXMgYW55W10pO1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5hcGkubXVsdGlDYWxsKHJlcXVlc3RzLCAoZ3JvdXBGaWx0ZXJzOiBJU2NvcGVHcm91cEZpbHRlcltdW10pID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBlbnBhY2tlZEZpbHRlciA9IGdyb3VwRmlsdGVycy5tYXAoaXRlbSA9PiBBcnJheS5pc0FycmF5KGl0ZW0pID8gaXRlbVswXSA6IGl0ZW0pXG4gICAgICAgICAgICAgICAgY29uc3Qgc2NvcGVHcm91cEZpbHRlckhhc2ggPSBVdGlscy5lbnRpdHlUb0RpY3Rpb25hcnkoZW5wYWNrZWRGaWx0ZXIpO1xuICAgICAgICAgICAgICAgIHJlc29sdmUocmVwb3J0cy5tYXAocmVwb3J0ID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC4uLnJlcG9ydCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjb3BlR3JvdXBGaWx0ZXI6IHJlcG9ydC5zY29wZUdyb3VwRmlsdGVyICYmIHNjb3BlR3JvdXBGaWx0ZXJIYXNoW3JlcG9ydC5zY29wZUdyb3VwRmlsdGVyLmlkXVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgIH0sIHJlamVjdCk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgc3RydWN0dXJlUmVwb3J0cyAocmVwb3J0cywgdGVtcGxhdGVzKSB7XG4gICAgICAgIGxldCBmaW5kVGVtcGxhdGVSZXBvcnRzID0gKHRlbXBsYXRlSWQpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVwb3J0cy5maWx0ZXIocmVwb3J0ID0+IHJlcG9ydC50ZW1wbGF0ZS5pZCA9PT0gdGVtcGxhdGVJZCk7XG4gICAgICAgICAgICB9O1xuICAgICAgICByZXR1cm4gdGVtcGxhdGVzLnJlZHVjZSgocmVzLCB0ZW1wbGF0ZSkgPT4ge1xuICAgICAgICAgICAgbGV0IHRlbXBsYXRlSWQgPSB0ZW1wbGF0ZS5pZCxcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVJlcG9ydHMgPSBmaW5kVGVtcGxhdGVSZXBvcnRzKHRlbXBsYXRlSWQpO1xuICAgICAgICAgICAgaWYgKHRlbXBsYXRlUmVwb3J0cy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZS5yZXBvcnRzID0gdGVtcGxhdGVSZXBvcnRzO1xuICAgICAgICAgICAgICAgIHJlcy5wdXNoKHRlbXBsYXRlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiByZXM7XG4gICAgICAgIH0sIFtdKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFib3J0Q3VycmVudFRhc2sgKCk6IHZvaWQge1xuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrICYmIHRoaXMuY3VycmVudFRhc2suYWJvcnQgJiYgdGhpcy5jdXJyZW50VGFzay5hYm9ydCgpO1xuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrID0gbnVsbDtcbiAgICB9XG5cbiAgICBwcml2YXRlIHVwZGF0ZVRlbXBsYXRlIChuZXdUZW1wbGF0ZURhdGE6IElSZXBvcnRUZW1wbGF0ZSkge1xuICAgICAgICB0aGlzLmFsbFRlbXBsYXRlcy5zb21lKCh0ZW1wbGF0ZURhdGE6IElSZXBvcnRUZW1wbGF0ZSwgaW5kZXg6IG51bWJlcikgPT4ge1xuICAgICAgICAgICAgaWYgKHRlbXBsYXRlRGF0YS5pZCA9PT0gbmV3VGVtcGxhdGVEYXRhLmlkKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5hbGxUZW1wbGF0ZXNbaW5kZXhdID0gbmV3VGVtcGxhdGVEYXRhO1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBjb25zdHJ1Y3RvcihhcGkpIHtcbiAgICAgICAgdGhpcy5hcGkgPSBhcGk7XG4gICAgfVxuXG4gICAgcHVibGljIGZldGNoICgpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICB0aGlzLmFib3J0Q3VycmVudFRhc2soKTtcbiAgICAgICAgdGhpcy5jdXJyZW50VGFzayA9IHRoaXMuZ2V0UmVwb3J0cygpXG4gICAgICAgICAgICAudGhlbigoW3JlcG9ydHMsIC4uLnJlc3RdKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKFt0aGlzLnBvcHVsYXRlU2NvcGVHcm91cEZpbHRlcnMocmVwb3J0cyksIC4uLnJlc3RdKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC50aGVuKChbcmVwb3J0cywgdGVtcGxhdGVzLCBkYXNoYm9hcmRJdGVtc10pID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmFsbFJlcG9ydHMgPSByZXBvcnRzO1xuICAgICAgICAgICAgICAgIHRoaXMuYWxsVGVtcGxhdGVzID0gdGVtcGxhdGVzO1xuICAgICAgICAgICAgICAgIHRoaXMuZGFzaGJvYXJkc0xlbmd0aCA9IGRhc2hib2FyZEl0ZW1zICYmIGRhc2hib2FyZEl0ZW1zLmxlbmd0aCA/IGRhc2hib2FyZEl0ZW1zLmxlbmd0aCA6IDA7XG4gICAgICAgICAgICAgICAgdGhpcy5zdHJ1Y3R1cmVkUmVwb3J0cyA9IHRoaXMuc3RydWN0dXJlUmVwb3J0cyhyZXBvcnRzLCB0ZW1wbGF0ZXMpO1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnN0cnVjdHVyZWRSZXBvcnRzO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5jYXRjaChjb25zb2xlLmVycm9yKVxuICAgICAgICAgICAgLmZpbmFsbHkoKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudFRhc2sgPSBudWxsO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB0aGlzLmN1cnJlbnRUYXNrO1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXREZXBlbmRlbmNpZXMgKHJlcG9ydHM6IElSZXBvcnRUZW1wbGF0ZVtdKTogSVJlcG9ydERlcGVuZGVuY2llcyB7XG4gICAgICAgIGxldCBhbGxEZXBlbmRlbmNpZXM6IElSZXBvcnREZXBlbmRlbmNpZXMgPSB7XG4gICAgICAgICAgICAgICAgZGV2aWNlczogW10sXG4gICAgICAgICAgICAgICAgcnVsZXM6IFtdLFxuICAgICAgICAgICAgICAgIHpvbmVUeXBlczogW10sXG4gICAgICAgICAgICAgICAgZ3JvdXBzOiBbXSxcbiAgICAgICAgICAgICAgICB1c2VyczogW11cbiAgICAgICAgICAgIH07XG4gICAgICAgIHJldHVybiByZXBvcnRzLnJlZHVjZSgocmVwb3J0c0RlcGVuZGVuY2llczogSVJlcG9ydERlcGVuZGVuY2llcywgdGVtcGxhdGU6IElSZXBvcnRUZW1wbGF0ZSkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHRlbXBsYXRlLnJlcG9ydHMucmVkdWNlKCh0ZW1wbGF0ZURlcGVuZGVjaWVzLCByZXBvcnQpID0+IHtcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZURlcGVuZGVjaWVzLmdyb3VwcyA9XG4gICAgICAgICAgICAgICAgICAgIFV0aWxzLm1lcmdlVW5pcXVlKHRlbXBsYXRlRGVwZW5kZWNpZXMuZ3JvdXBzLFxuICAgICAgICAgICAgICAgICAgICBVdGlscy5nZXRFbnRpdGllc0lkcyhyZXBvcnQuZ3JvdXBzKSxcbiAgICAgICAgICAgICAgICAgICAgVXRpbHMuZ2V0RW50aXRpZXNJZHMocmVwb3J0LmluY2x1ZGVBbGxDaGlsZHJlbkdyb3VwcyksXG4gICAgICAgICAgICAgICAgICAgIFV0aWxzLmdldEVudGl0aWVzSWRzKHJlcG9ydC5pbmNsdWRlRGlyZWN0Q2hpbGRyZW5Pbmx5R3JvdXBzKSxcbiAgICAgICAgICAgICAgICAgICAgVXRpbHMuZ2V0RW50aXRpZXNJZHMocmVwb3J0LnNjb3BlR3JvdXBzKSxcbiAgICAgICAgICAgICAgICAgICAgVXRpbHMuZ2V0RW50aXRpZXNJZHMocmVwb3J0LnNjb3BlR3JvdXBGaWx0ZXIgJiYgZ2V0RmlsdGVyU3RhdGVVbmlxdWVHcm91cHMocmVwb3J0LnNjb3BlR3JvdXBGaWx0ZXIuZ3JvdXBGaWx0ZXJDb25kaXRpb24pIHx8IFtdKSk7XG4gICAgICAgICAgICAgICAgdGVtcGxhdGVEZXBlbmRlY2llcy51c2VycyA9IFV0aWxzLm1lcmdlVW5pcXVlKFxuICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZURlcGVuZGVjaWVzLnVzZXJzLCByZXBvcnQuaW5kaXZpZHVhbFJlY2lwaWVudHMgJiYgVXRpbHMuZ2V0RW50aXRpZXNJZHMocmVwb3J0LmluZGl2aWR1YWxSZWNpcGllbnRzKSB8fCBbXSk7XG4gICAgICAgICAgICAgICAgdGVtcGxhdGVEZXBlbmRlY2llcy5kZXZpY2VzID0gVXRpbHMubWVyZ2VVbmlxdWUodGVtcGxhdGVEZXBlbmRlY2llcy5kZXZpY2VzLCByZXBvcnQuYXJndW1lbnRzICYmIHJlcG9ydC5hcmd1bWVudHMuZGV2aWNlcyAmJiBVdGlscy5nZXRFbnRpdGllc0lkcyhyZXBvcnQuYXJndW1lbnRzLmRldmljZXMpIHx8IFtdKTtcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZURlcGVuZGVjaWVzLnJ1bGVzID0gVXRpbHMubWVyZ2VVbmlxdWUodGVtcGxhdGVEZXBlbmRlY2llcy5ydWxlcywgcmVwb3J0LmFyZ3VtZW50cyAmJiByZXBvcnQuYXJndW1lbnRzLnJ1bGVzICYmIFV0aWxzLmdldEVudGl0aWVzSWRzKHJlcG9ydC5hcmd1bWVudHMucnVsZXMpIHx8IFtdKTtcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZURlcGVuZGVjaWVzLnpvbmVUeXBlcyA9IFV0aWxzLm1lcmdlVW5pcXVlKFxuICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZURlcGVuZGVjaWVzLnpvbmVUeXBlcywgcmVwb3J0LmFyZ3VtZW50cyAmJiByZXBvcnQuYXJndW1lbnRzLnpvbmVUeXBlTGlzdCAmJiBVdGlscy5nZXRFbnRpdGllc0lkcyhyZXBvcnQuYXJndW1lbnRzLnpvbmVUeXBlTGlzdCkgfHwgW10pO1xuICAgICAgICAgICAgICAgIHJldHVybiB0ZW1wbGF0ZURlcGVuZGVjaWVzO1xuICAgICAgICAgICAgfSwgcmVwb3J0c0RlcGVuZGVuY2llcyk7XG4gICAgICAgIH0sIGFsbERlcGVuZGVuY2llcyk7XG4gICAgfVxuXG4gICAgcHVibGljIGdldERhdGEgKCk6IFByb21pc2U8SVJlcG9ydFRlbXBsYXRlW10+IHtcbiAgICAgICAgbGV0IHBvcnRpb25TaXplID0gMTUsXG4gICAgICAgICAgICBwb3J0aW9ucyA9IHRoaXMuYWxsVGVtcGxhdGVzLnJlZHVjZSgocmVxdWVzdHM6IGFueVtdLCB0ZW1wbGF0ZTogSVJlcG9ydFRlbXBsYXRlKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKCF0ZW1wbGF0ZS5pc1N5c3RlbSAmJiAhdGVtcGxhdGUuYmluYXJ5RGF0YSkge1xuICAgICAgICAgICAgICAgICAgICBsZXQgcG9ydGlvbkluZGV4OiBudW1iZXIgPSByZXF1ZXN0cy5sZW5ndGggLSAxO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXJlcXVlc3RzW3BvcnRpb25JbmRleF0gfHwgcmVxdWVzdHNbcG9ydGlvbkluZGV4XS5sZW5ndGggPj0gcG9ydGlvblNpemUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgcmVxdWVzdHMucHVzaChbXSk7XG4gICAgICAgICAgICAgICAgICAgICAgIHBvcnRpb25JbmRleCArKztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXF1ZXN0c1twb3J0aW9uSW5kZXhdLnB1c2goW1wiR2V0XCIsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwidHlwZU5hbWVcIjogXCJSZXBvcnRUZW1wbGF0ZVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJzZWFyY2hcIjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkOiB0ZW1wbGF0ZS5pZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmNsdWRlQmluYXJ5RGF0YTogdHJ1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiByZXF1ZXN0cztcbiAgICAgICAgICAgIH0sIFtdKSxcbiAgICAgICAgICAgIHRvdGFsUmVzdWx0czogYW55W11bXSA9IFtdLFxuICAgICAgICAgICAgZ2V0UG9ydGlvbkRhdGEgPSBwb3J0aW9uID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFByb21pc2U8YW55PigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYXBpLm11bHRpQ2FsbChwb3J0aW9uLCByZXNvbHZlLCByZWplY3QpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGVycm9yUG9ydGlvbnMgPSBbXTtcblxuICAgICAgICB0aGlzLmFib3J0Q3VycmVudFRhc2soKTtcbiAgICAgICAgdGhpcy5jdXJyZW50VGFzayA9IHBvcnRpb25zLnJlZHVjZSgocHJvbWlzZXMsIHBvcnRpb24pID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcHJvbWlzZXNcbiAgICAgICAgICAgICAgICAgICAgLnRoZW4oKCkgPT4gZ2V0UG9ydGlvbkRhdGEocG9ydGlvbikpXG4gICAgICAgICAgICAgICAgICAgIC50aGVuKHJlc3VsdCA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdG90YWxSZXN1bHRzID0gdG90YWxSZXN1bHRzLmNvbmNhdChyZXN1bHQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSwgZSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3JQb3J0aW9ucyA9IGVycm9yUG9ydGlvbnMuY29uY2F0KHBvcnRpb24pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9LCBVdGlscy5yZXNvbHZlZFByb21pc2UoW10pKVxuICAgICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgIGVycm9yUG9ydGlvbnMubGVuZ3RoICYmIGNvbnNvbGUud2FybihlcnJvclBvcnRpb25zKTtcbiAgICAgICAgICAgICAgICB0b3RhbFJlc3VsdHMuZm9yRWFjaCh0ZW1wbGF0ZURhdGEgPT4ge1xuICAgICAgICAgICAgICAgICAgICBsZXQgdGVtcGxhdGU6IElSZXBvcnRUZW1wbGF0ZSA9IHRlbXBsYXRlRGF0YS5sZW5ndGggPyB0ZW1wbGF0ZURhdGFbMF0gOiB0ZW1wbGF0ZURhdGE7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlVGVtcGxhdGUodGVtcGxhdGUpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHRoaXMuc3RydWN0dXJlZFJlcG9ydHMgPSB0aGlzLnN0cnVjdHVyZVJlcG9ydHModGhpcy5hbGxSZXBvcnRzLCB0aGlzLmFsbFRlbXBsYXRlcyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuc3RydWN0dXJlZFJlcG9ydHM7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmNhdGNoKGNvbnNvbGUuZXJyb3IpXG4gICAgICAgICAgICAuZmluYWxseSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50VGFzayA9IG51bGw7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHRoaXMuY3VycmVudFRhc2s7XG4gICAgfVxuXG4gICAgcHVibGljIGdldERhc2hib2FyZHNRdHkgKCk6IG51bWJlciB7XG4gICAgICAgIHJldHVybiB0aGlzLmRhc2hib2FyZHNMZW5ndGg7XG4gICAgfVxuXG4gICAgcHVibGljIGdldEN1c3RvbWl6ZWRSZXBvcnRzUXR5ICgpOiBudW1iZXIge1xuICAgICAgICBsZXQgdGVtcGxhdGVzOiBzdHJpbmdbXSA9IFtdO1xuICAgICAgICByZXR1cm4gKHRoaXMuYWxsUmVwb3J0cy5maWx0ZXIoKHJlcG9ydDogSVJlcG9ydCkgPT4ge1xuICAgICAgICAgICAgbGV0IHRlbXBsYXRlSWQgPSByZXBvcnQudGVtcGxhdGUuaWQsXG4gICAgICAgICAgICAgICAgdGVtcGxhdGVFeGlzdHM6IGJvb2xlYW4gPSB0ZW1wbGF0ZXMuaW5kZXhPZih0ZW1wbGF0ZUlkKSA+IC0xLFxuICAgICAgICAgICAgICAgIGlzQ291bnQ6IGJvb2xlYW4gPSAhdGVtcGxhdGVFeGlzdHMgJiYgcmVwb3J0Lmxhc3RNb2RpZmllZFVzZXIgIT09IFwiTm9Vc2VySWRcIjtcbiAgICAgICAgICAgIGlzQ291bnQgJiYgdGVtcGxhdGVzLnB1c2godGVtcGxhdGVJZCk7XG4gICAgICAgICAgICByZXR1cm4gaXNDb3VudDtcbiAgICAgICAgfSkpLmxlbmd0aDtcbiAgICB9XG5cbiAgICBwdWJsaWMgdW5sb2FkICgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5hYm9ydEN1cnJlbnRUYXNrKCk7XG4gICAgfVxufSIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi9ibHVlYmlyZC5kLnRzXCIvPlxuaW1wb3J0IHsgc29ydEFycmF5T2ZFbnRpdGllcywgZW50aXR5VG9EaWN0aW9uYXJ5LCBtZXJnZVVuaXF1ZSB9IGZyb20gXCIuL3V0aWxzXCI7XG5cbmludGVyZmFjZSBJUnVsZSBleHRlbmRzIElJZEVudGl0eSB7XG4gICAgZ3JvdXBzOiBhbnlbXTtcbiAgICBjb25kaXRpb246IGFueTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJUnVsZURlcGVuZGVuY2llcyB7XG4gICAgZGV2aWNlczogYW55W107XG4gICAgdXNlcnM6IGFueVtdO1xuICAgIHpvbmVzOiBhbnlbXTtcbiAgICB6b25lVHlwZXM6IGFueVtdO1xuICAgIHdvcmtUaW1lczogYW55W107XG4gICAgd29ya0hvbGlkYXlzOiBhbnlbXTtcbiAgICBncm91cHM6IGFueVtdO1xuICAgIHNlY3VyaXR5R3JvdXBzOiBhbnlbXTtcbiAgICBkaWFnbm9zdGljczogYW55W107XG59XG5cbmNvbnN0IEFQUExJQ0FUSU9OX1JVTEVfSUQgPSBcIlJ1bGVBcHBsaWNhdGlvbkV4Y2VwdGlvbklkXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFJ1bGVzQnVpbGRlciB7XG4gICAgcHJpdmF0ZSByZWFkb25seSBhcGk7XG4gICAgcHJpdmF0ZSBjdXJyZW50VGFzaztcbiAgICBwcml2YXRlIGNvbWJpbmVkUnVsZXM7XG4gICAgcHJpdmF0ZSBzdHJ1Y3R1cmVkUnVsZXM7XG5cbiAgICBwcml2YXRlIGdldFJ1bGVzICgpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5hcGkuY2FsbChcIkdldFwiLCB7XG4gICAgICAgICAgICAgICAgXCJ0eXBlTmFtZVwiOiBcIlJ1bGVcIlxuICAgICAgICAgICAgfSwgcmVzb2x2ZSwgcmVqZWN0KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBzdHJ1Y3R1cmVSdWxlcyAocnVsZXMpIHtcbiAgICAgICAgcmV0dXJuIHNvcnRBcnJheU9mRW50aXRpZXMocnVsZXMsIFtbXCJiYXNlVHlwZVwiLCBcImRlc2NcIl0sIFwibmFtZVwiXSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhYm9ydEN1cnJlbnRUYXNrICgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5jdXJyZW50VGFzayAmJiB0aGlzLmN1cnJlbnRUYXNrLmFib3J0ICYmIHRoaXMuY3VycmVudFRhc2suYWJvcnQoKTtcbiAgICAgICAgdGhpcy5jdXJyZW50VGFzayA9IG51bGw7XG4gICAgfVxuXG4gICAgY29uc3RydWN0b3IoYXBpKSB7XG4gICAgICAgIHRoaXMuYXBpID0gYXBpO1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXREZXBlbmRlbmNpZXMgKHJ1bGVzKTogSVJ1bGVEZXBlbmRlbmNpZXMge1xuICAgICAgICBsZXQgZGVwZW5kZW5jaWVzOiBJUnVsZURlcGVuZGVuY2llcyA9IHtcbiAgICAgICAgICAgICAgICBkZXZpY2VzOiBbXSxcbiAgICAgICAgICAgICAgICB1c2VyczogW10sXG4gICAgICAgICAgICAgICAgem9uZXM6IFtdLFxuICAgICAgICAgICAgICAgIHpvbmVUeXBlczogW10sXG4gICAgICAgICAgICAgICAgd29ya1RpbWVzOiBbXSxcbiAgICAgICAgICAgICAgICB3b3JrSG9saWRheXM6IFtdLFxuICAgICAgICAgICAgICAgIGdyb3VwczogW10sXG4gICAgICAgICAgICAgICAgZGlhZ25vc3RpY3M6IFtdLFxuICAgICAgICAgICAgICAgIHNlY3VyaXR5R3JvdXBzOiBbXVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHByb2Nlc3NEZXBlbmRlbmNpZXMgPSAoY29uZGl0aW9uKSA9PiB7XG4gICAgICAgICAgICAgICAgbGV0IGlkOiBzdHJpbmcgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgbGV0IHR5cGU6IHN0cmluZyB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKGNvbmRpdGlvbi5jb25kaXRpb25UeXBlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJSdWxlV29ya0hvdXJzXCI6XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJBZnRlclJ1bGVXb3JrSG91cnNcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkID0gKGNvbmRpdGlvbi53b3JrVGltZSAmJiBjb25kaXRpb24ud29ya1RpbWUuaWQpIHx8IGNvbmRpdGlvbi53b3JrVGltZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGUgPSBcIndvcmtUaW1lc1wiO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJEcml2ZXJcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkID0gY29uZGl0aW9uLmRyaXZlciAmJiBjb25kaXRpb24uZHJpdmVyLmlkO1xuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZSA9IFwidXNlcnNcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiRGV2aWNlXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBpZCA9IGNvbmRpdGlvbi5kZXZpY2UgJiYgY29uZGl0aW9uLmRldmljZS5pZDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGUgPSBcImRldmljZXNcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiRW50ZXJpbmdBcmVhXCI6XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJFeGl0aW5nQXJlYVwiOlxuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiT3V0c2lkZUFyZWFcIjpcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIkluc2lkZUFyZWFcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjb25kaXRpb24uem9uZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkID0gY29uZGl0aW9uLnpvbmUuaWQgfHwgY29uZGl0aW9uLnpvbmU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZSA9IFwiem9uZXNcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWQgPSBjb25kaXRpb24uem9uZVR5cGUuaWQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZSA9IFwiem9uZVR5cGVzXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIkZpbHRlclN0YXR1c0RhdGFCeURpYWdub3N0aWNcIjpcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIkFjdGl2ZU9ySW5hY3RpdmVGYXVsdFwiOlxuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiRmF1bHRcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjb25kaXRpb24uZGlhZ25vc3RpYykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkID0gY29uZGl0aW9uLmRpYWdub3N0aWMuaWQgfHwgY29uZGl0aW9uLmRpYWdub3N0aWM7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZSA9IFwiZGlhZ25vc3RpY3NcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlkICYmIHR5cGUgJiYgZGVwZW5kZW5jaWVzW3R5cGVdLmluZGV4T2YoaWQpID09PSAtMSAmJiBkZXBlbmRlbmNpZXNbdHlwZV0ucHVzaChpZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY2hlY2tDb25kaXRpb25zID0gKHBhcmVudENvbmRpdGlvbiwgZGVwZW5kZW5jaWVzOiBJUnVsZURlcGVuZGVuY2llcyk6IElSdWxlRGVwZW5kZW5jaWVzID0+IHtcbiAgICAgICAgICAgICAgICBsZXQgY29uZGl0aW9ucyA9IHBhcmVudENvbmRpdGlvbi5jaGlsZHJlbiB8fCBbXTtcbiAgICAgICAgICAgICAgICBwcm9jZXNzRGVwZW5kZW5jaWVzKHBhcmVudENvbmRpdGlvbik7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbmRpdGlvbnMucmVkdWNlKChkZXBlbmRlbmNpZXMsIGNvbmRpdGlvbikgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoY29uZGl0aW9uLmNoaWxkcmVuKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZXBlbmRlbmNpZXMgPSBjaGVja0NvbmRpdGlvbnMoY29uZGl0aW9uLCBkZXBlbmRlbmNpZXMpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHByb2Nlc3NEZXBlbmRlbmNpZXMoY29uZGl0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGRlcGVuZGVuY2llcztcbiAgICAgICAgICAgICAgICB9LCBkZXBlbmRlbmNpZXMpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHJ1bGVzLnJlZHVjZSgoZGVwZW5kZW5jaWVzOiBJUnVsZURlcGVuZGVuY2llcywgcnVsZTogSVJ1bGUpID0+IHtcbiAgICAgICAgICAgIGRlcGVuZGVuY2llcy5ncm91cHMgPSBtZXJnZVVuaXF1ZShkZXBlbmRlbmNpZXMuZ3JvdXBzLCBydWxlLmdyb3Vwcy5tYXAoZ3JvdXAgPT4gZ3JvdXAuaWQpKTtcbiAgICAgICAgICAgIGlmIChydWxlLmNvbmRpdGlvbikge1xuICAgICAgICAgICAgICAgIGRlcGVuZGVuY2llcyA9IGNoZWNrQ29uZGl0aW9ucyhydWxlLmNvbmRpdGlvbiwgZGVwZW5kZW5jaWVzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBkZXBlbmRlbmNpZXM7XG4gICAgICAgIH0sIGRlcGVuZGVuY2llcyk7XG4gICAgfVxuXG4gICAgcHVibGljIGZldGNoKCk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIHRoaXMuYWJvcnRDdXJyZW50VGFzaygpO1xuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrID0gdGhpcy5nZXRSdWxlcygpXG4gICAgICAgICAgICAudGhlbigoc3dpdGNoZWRPblJ1bGVzKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5jb21iaW5lZFJ1bGVzID0gZW50aXR5VG9EaWN0aW9uYXJ5KHN3aXRjaGVkT25SdWxlcyk7XG4gICAgICAgICAgICAgICAgZGVsZXRlKHRoaXMuY29tYmluZWRSdWxlc1tBUFBMSUNBVElPTl9SVUxFX0lEXSk7XG4gICAgICAgICAgICAgICAgdGhpcy5zdHJ1Y3R1cmVkUnVsZXMgPSB0aGlzLnN0cnVjdHVyZVJ1bGVzKE9iamVjdC5rZXlzKHRoaXMuY29tYmluZWRSdWxlcykubWFwKGtleSA9PiB0aGlzLmNvbWJpbmVkUnVsZXNba2V5XSkpO1xuICAgICAgICAgICAgICAgIHJldHVybiBPYmplY3Qua2V5cyh0aGlzLmNvbWJpbmVkUnVsZXMpLm1hcChydWxlSWQgPT4gdGhpcy5jb21iaW5lZFJ1bGVzW3J1bGVJZF0pO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5jYXRjaChjb25zb2xlLmVycm9yKVxuICAgICAgICAgICAgLmZpbmFsbHkoKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudFRhc2sgPSBudWxsO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB0aGlzLmN1cnJlbnRUYXNrO1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXRSdWxlc0RhdGEgKHJ1bGVzSWRzOiBzdHJpbmdbXSk6IElSdWxlW10ge1xuICAgICAgICByZXR1cm4gcnVsZXNJZHMubWFwKHJ1bGVJZCA9PiB0aGlzLmNvbWJpbmVkUnVsZXNbcnVsZUlkXSk7XG4gICAgfVxuXG4gICAgcHVibGljIHVubG9hZCAoKTogdm9pZCB7XG4gICAgICAgIHRoaXMuYWJvcnRDdXJyZW50VGFzaygpO1xuICAgIH1cbn0iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vYmx1ZWJpcmQuZC50c1wiLz5cblxuY29uc3QgZW51bSBSZWxhdGlvbk9wZXJhdG9yIHtcbiAgICBcIkFORFwiID0gXCJBbmRcIixcbiAgICBcIk9SXCIgPSBcIk9yXCJcbn1cblxuaW50ZXJmYWNlIElPdXRwdXRJZEVudGl0eSB7XG4gICAgZ3JvdXBJZDogc3RyaW5nO1xufVxuXG5pbnRlcmZhY2UgSUdyb3VwTGlzdFN0YXRlT3V0cHV0PFQgZXh0ZW5kcyBJT3V0cHV0SWRFbnRpdHkgPSBJT3V0cHV0SWRFbnRpdHk+IHtcbiAgICByZWxhdGlvbjogUmVsYXRpb25PcGVyYXRvcjtcbiAgICBncm91cEZpbHRlckNvbmRpdGlvbnM6IChUIHwgSUdyb3VwTGlzdFN0YXRlT3V0cHV0PFQ+KVtdO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIElTY29wZUdyb3VwRmlsdGVyIGV4dGVuZHMgSUlkRW50aXR5IHtcbiAgICBncm91cEZpbHRlckNvbmRpdGlvbjogSUdyb3VwTGlzdFN0YXRlT3V0cHV0IHwgSU91dHB1dElkRW50aXR5O1xuICAgIG5hbWU/OiBzdHJpbmc7XG4gICAgY29tbWVudD86IHN0cmluZztcbn1cblxuZXhwb3J0IGNvbnN0IGdldFNjb3BlR3JvdXBGaWx0ZXJCeUlkID0gKGlkOiBzdHJpbmcsIGFwaSk6IFByb21pc2U8SVNjb3BlR3JvdXBGaWx0ZXI+ID0+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBhcGkuY2FsbChcIkdldFwiLCB7XG4gICAgICAgICAgICB0eXBlTmFtZTogXCJHcm91cEZpbHRlclwiLFxuICAgICAgICAgICAgc2VhcmNoOiB7IGlkIH1cbiAgICAgICAgfSwgcmVzb2x2ZSwgcmVqZWN0KTtcbiAgICB9KTtcbn1cblxuZXhwb3J0IGNvbnN0IGlzRmlsdGVyU3RhdGUgPSA8VCwgVT4oaXRlbTogSUdyb3VwTGlzdFN0YXRlT3V0cHV0IHwgSU91dHB1dElkRW50aXR5KTogaXRlbSBpcyBJR3JvdXBMaXN0U3RhdGVPdXRwdXQgPT4gaXRlbSAmJiAoaXRlbSBhcyBJR3JvdXBMaXN0U3RhdGVPdXRwdXQpLnJlbGF0aW9uICE9PSB1bmRlZmluZWQ7XG5cbmV4cG9ydCBjb25zdCBnZXRGaWx0ZXJTdGF0ZVVuaXF1ZUdyb3VwcyA9IChzdGF0ZTogSUdyb3VwTGlzdFN0YXRlT3V0cHV0IHwgSU91dHB1dElkRW50aXR5KSA9PiB7XG4gICAgbGV0IGdyb3VwSWRzOiBzdHJpbmdbXSA9IFtdO1xuICAgIGNvbnN0IHByb2Nlc3NJdGVtID0gKGl0ZW06SUdyb3VwTGlzdFN0YXRlT3V0cHV0LCBwcmV2UmVzID0gW10gYXMgSUlkRW50aXR5W10pOiBJSWRFbnRpdHlbXSA9PiB7XG4gICAgICAgIHJldHVybiBpdGVtLmdyb3VwRmlsdGVyQ29uZGl0aW9ucy5yZWR1Y2UoKHJlcywgY2hpbGRJdGVtKSA9PiB7XG4gICAgICAgICAgICBpZiAoaXNGaWx0ZXJTdGF0ZShjaGlsZEl0ZW0pKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHByb2Nlc3NJdGVtKGNoaWxkSXRlbSwgcmVzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxldCBpZCA9IGNoaWxkSXRlbS5ncm91cElkO1xuICAgICAgICAgICAgZ3JvdXBJZHMuaW5kZXhPZihpZCkgPT09IC0xICYmIHJlcy5wdXNoKHsgaWQgfSk7XG4gICAgICAgICAgICBncm91cElkcy5wdXNoKGlkKTtcbiAgICAgICAgICAgIHJldHVybiByZXM7XG4gICAgICAgIH0sIHByZXZSZXMpO1xuICAgIH07XG4gICAgcmV0dXJuIGlzRmlsdGVyU3RhdGUoc3RhdGUpID8gcHJvY2Vzc0l0ZW0oc3RhdGUpIDogW3sgaWQ6IHN0YXRlLmdyb3VwSWQgfV07XG59OyIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi9ibHVlYmlyZC5kLnRzXCIvPlxuaW1wb3J0IEdyb3Vwc0J1aWxkZXIgZnJvbSBcIi4vZ3JvdXBzQnVpbGRlclwiO1xuaW1wb3J0ICogYXMgVXRpbHMgZnJvbSBcIi4vdXRpbHNcIjtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgU2VjdXJpdHlDbGVhcmFuY2VzQnVpbGRlciBleHRlbmRzIEdyb3Vwc0J1aWxkZXIge1xuXG4gICAgY29uc3RydWN0b3IoYXBpOiBhbnkpIHtcbiAgICAgICAgc3VwZXIoYXBpKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGdldFNlY3VyaXR5R3JvdXBzICgpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5hcGkuZ2V0U2Vzc2lvbigoc2Vzc2lvbkRhdGEpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmFwaS5jYWxsKFwiR2V0XCIsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGVOYW1lOiBcIkdyb3VwXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWFyY2g6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZDogXCJHcm91cFNlY3VyaXR5SWRcIlxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LCByZXNvbHZlLCByZWplY3QpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBwdWJsaWMgZmV0Y2ggKCk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIHRoaXMuYWJvcnRDdXJyZW50VGFzaygpO1xuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrID0gdGhpcy5nZXRTZWN1cml0eUdyb3VwcygpXG4gICAgICAgICAgICAudGhlbihncm91cHMgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuZ3JvdXBzID0gZ3JvdXBzO1xuICAgICAgICAgICAgICAgIHRoaXMudHJlZSA9IHRoaXMuY3JlYXRlR3JvdXBzVHJlZShncm91cHMpO1xuICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudFRyZWUgPSBVdGlscy5leHRlbmQoe30sIHRoaXMudHJlZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlRmxhdEdyb3Vwc0xpc3QodGhpcy50cmVlKS5maWx0ZXIoZ3JvdXAgPT4gISFncm91cC5uYW1lKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuY2F0Y2goY29uc29sZS5lcnJvcilcbiAgICAgICAgICAgIC5maW5hbGx5KCgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRUYXNrID0gbnVsbDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gdGhpcy5jdXJyZW50VGFzaztcbiAgICB9O1xufSIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi9ibHVlYmlyZC5kLnRzXCIvPlxuaW50ZXJmYWNlIElDbGFzc0NvbnRyb2wge1xuICAgIGdldDogKCkgPT4gc3RyaW5nO1xuICAgIHNldDogKG5hbWU6IHN0cmluZykgPT4gdm9pZDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJRW50aXR5IHtcbiAgICBpZDogc3RyaW5nO1xuICAgIFtwcm9wTmFtZTogc3RyaW5nXTogYW55O1xufVxuXG50eXBlIElTb3J0UHJvcGVydHkgPSBzdHJpbmcgfCBbc3RyaW5nLCBcImFzY1wiIHwgXCJkZXNjXCJdO1xuXG5sZXQgY2xhc3NOYW1lQ3RybCA9IGZ1bmN0aW9uIChlbDogRWxlbWVudCk6IElDbGFzc0NvbnRyb2wge1xuICAgICAgICB2YXIgcGFyYW0gPSB0eXBlb2YgZWwuY2xhc3NOYW1lID09PSBcInN0cmluZ1wiID8gXCJjbGFzc05hbWVcIiA6IFwiYmFzZVZhbFwiO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGVsW3BhcmFtXSB8fCBcIlwiO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNldDogZnVuY3Rpb24gKHRleHQpIHtcbiAgICAgICAgICAgICAgICBlbFtwYXJhbV0gPSB0ZXh0O1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH0sXG4gICAgaXNVc3VhbE9iamVjdCA9IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmopLmluZGV4T2YoXCJPYmplY3RcIikgIT09IC0xO1xuICAgIH07XG5cbmV4cG9ydCBpbnRlcmZhY2UgSUhhc2gge1xuICAgIFtpZDogc3RyaW5nXTogYW55O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVtb3ZlQ2xhc3MoZWw6IEVsZW1lbnQsIG5hbWU6IHN0cmluZyk6IHZvaWQge1xuICAgIGlmICghZWwpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBsZXQgY2xhc3Nlc1N0ciA9IGNsYXNzTmFtZUN0cmwoZWwpLmdldCgpLFxuICAgICAgICBjbGFzc2VzID0gY2xhc3Nlc1N0ci5zcGxpdChcIiBcIiksXG4gICAgICAgIG5ld0NsYXNzZXMgPSBjbGFzc2VzLmZpbHRlcihjbGFzc0l0ZW0gPT4gY2xhc3NJdGVtICE9PSBuYW1lKTtcbiAgICBjbGFzc05hbWVDdHJsKGVsKS5zZXQobmV3Q2xhc3Nlcy5qb2luKFwiIFwiKSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhZGRDbGFzcyhlbCwgbmFtZSk6IHZvaWQge1xuICAgIGlmICghZWwpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBsZXQgY2xhc3Nlc1N0ciA9IGNsYXNzTmFtZUN0cmwoZWwpLmdldCgpLFxuICAgICAgICBjbGFzc2VzID0gY2xhc3Nlc1N0ci5zcGxpdChcIiBcIik7XG4gICAgaWYgKGNsYXNzZXMuaW5kZXhPZihuYW1lKSA9PT0gLTEpIHtcbiAgICAgICAgY2xhc3NOYW1lQ3RybChlbCkuc2V0KGNsYXNzZXNTdHIgKyBcIiBcIiArIG5hbWUpO1xuICAgIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGhhc0NsYXNzKGVsOiBFbGVtZW50LCBjbGFzc05hbWU6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIHJldHVybiBlbCAmJiBjbGFzc05hbWVDdHJsKGVsKS5nZXQoKS5pbmRleE9mKGNsYXNzTmFtZSkgIT09IC0xO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZXh0ZW5kKC4uLmFyZ3M6IGFueVtdKSB7XG4gICAgdmFyIGxlbmd0aCA9IGFyZ3MubGVuZ3RoLFxuICAgICAgICBzcmMsIHNyY0tleXMsIHNyY0F0dHIsXG4gICAgICAgIGZ1bGxDb3B5ID0gZmFsc2UsXG4gICAgICAgIHJlc0F0dHIsXG4gICAgICAgIHJlcyA9IGFyZ3NbMF0sIGkgPSAxLCBqO1xuXG4gICAgaWYgKHR5cGVvZiByZXMgPT09IFwiYm9vbGVhblwiKSB7XG4gICAgICAgIGZ1bGxDb3B5ID0gcmVzO1xuICAgICAgICByZXMgPSBhcmdzWzFdO1xuICAgICAgICBpKys7XG4gICAgfVxuICAgIHdoaWxlIChpICE9PSBsZW5ndGgpIHtcbiAgICAgICAgc3JjID0gYXJnc1tpXTtcbiAgICAgICAgc3JjS2V5cyA9IE9iamVjdC5rZXlzKHNyYyk7XG4gICAgICAgIGZvciAoaiA9IDA7IGogPCBzcmNLZXlzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICBzcmNBdHRyID0gc3JjW3NyY0tleXNbal1dO1xuICAgICAgICAgICAgaWYgKGZ1bGxDb3B5ICYmIChpc1VzdWFsT2JqZWN0KHNyY0F0dHIpIHx8IEFycmF5LmlzQXJyYXkoc3JjQXR0cikpKSB7XG4gICAgICAgICAgICAgICAgcmVzQXR0ciA9IHJlc1tzcmNLZXlzW2pdXTtcbiAgICAgICAgICAgICAgICByZXNBdHRyID0gcmVzW3NyY0tleXNbal1dID0gKGlzVXN1YWxPYmplY3QocmVzQXR0cikgfHwgQXJyYXkuaXNBcnJheShyZXNBdHRyKSkgPyByZXNBdHRyIDogKEFycmF5LmlzQXJyYXkoc3JjQXR0cikgPyBbXSA6IHt9KTtcbiAgICAgICAgICAgICAgICBleHRlbmQoZnVsbENvcHksIHJlc0F0dHIsIHNyY0F0dHIpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXNbc3JjS2V5c1tqXV0gPSBzcmNbc3JjS2V5c1tqXV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaSsrO1xuICAgIH1cbiAgICByZXR1cm4gcmVzO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZW50aXR5VG9EaWN0aW9uYXJ5KGVudGl0aWVzOiBhbnlbXSwgZW50aXR5Q2FsbGJhY2s/OiAoZW50aXR5OiBhbnkpID0+IGFueSk6IElIYXNoIHtcbiAgICB2YXIgZW50aXR5LCBvID0ge30sIGksXG4gICAgICAgIGwgPSBlbnRpdGllcy5sZW5ndGg7XG5cbiAgICBmb3IgKGkgPSAwOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgIGlmIChlbnRpdGllc1tpXSkge1xuICAgICAgICAgICAgZW50aXR5ID0gZW50aXRpZXNbaV0uaWQgPyBlbnRpdGllc1tpXSA6IHtpZDogZW50aXRpZXNbaV19O1xuICAgICAgICAgICAgb1tlbnRpdHkuaWRdID0gZW50aXR5Q2FsbGJhY2sgPyBlbnRpdHlDYWxsYmFjayhlbnRpdHkpIDogZW50aXR5O1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBvO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc29ydEFycmF5T2ZFbnRpdGllcyhlbnRpdGllczogYW55W10sIHNvcnRpbmdGaWVsZHM6IElTb3J0UHJvcGVydHlbXSk6IGFueVtdIHtcbiAgICBsZXQgY29tcGFyYXRvciA9IChwcmV2SXRlbSwgbmV4dEl0ZW0sIHByb3BlcnRpZXM6IGFueVtdLCBpbmRleCA9IDApID0+IHtcbiAgICAgICAgaWYgKHByb3BlcnRpZXMubGVuZ3RoIDw9IGluZGV4KSB7XG4gICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgfVxuICAgICAgICBsZXQgb3B0aW9ucyA9IHByb3BlcnRpZXNbaW5kZXhdLFxuICAgICAgICAgICAgW3Byb3BlcnR5LCBkaXIgPSBcImFzY1wiXSA9IEFycmF5LmlzQXJyYXkob3B0aW9ucykgPyBvcHRpb25zIDogW29wdGlvbnNdLFxuICAgICAgICAgICAgZGlyTXVsdGlwbGllcjogbnVtYmVyO1xuICAgICAgICBkaXJNdWx0aXBsaWVyID0gZGlyID09PSBcImFzY1wiID8gMSA6IC0xO1xuICAgICAgICBpZiAocHJldkl0ZW1bcHJvcGVydHldID4gbmV4dEl0ZW1bcHJvcGVydHldKSB7XG4gICAgICAgICAgICByZXR1cm4gMSAqIGRpck11bHRpcGxpZXI7XG4gICAgICAgIH0gZWxzZSBpZiAocHJldkl0ZW1bcHJvcGVydHldIDwgbmV4dEl0ZW1bcHJvcGVydHldKSB7XG4gICAgICAgICAgICByZXR1cm4gLTEgKiBkaXJNdWx0aXBsaWVyO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGNvbXBhcmF0b3IocHJldkl0ZW0sIG5leHRJdGVtLCBwcm9wZXJ0aWVzLCBpbmRleCArIDEpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICByZXR1cm4gZW50aXRpZXMuc29ydCgocHJldlRlbXBsYXRlLCBuZXh0VGVtcGxhdGUpID0+IHtcbiAgICAgICAgcmV0dXJuIGNvbXBhcmF0b3IocHJldlRlbXBsYXRlLCBuZXh0VGVtcGxhdGUsIHNvcnRpbmdGaWVsZHMpO1xuICAgIH0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZG93bmxvYWREYXRhQXNGaWxlKGRhdGE6IHN0cmluZywgZmlsZW5hbWU6IHN0cmluZywgbWltZVR5cGUgPSBcInRleHQvanNvblwiKSB7XG4gICAgbGV0IGJsb2IgPSBuZXcgQmxvYihbZGF0YV0sIHt0eXBlOiBtaW1lVHlwZX0pLFxuICAgICAgICBlbGVtO1xuICAgIGVsZW0gPSB3aW5kb3cuZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImFcIik7XG4gICAgZWxlbS5ocmVmID0gd2luZG93LlVSTC5jcmVhdGVPYmplY3RVUkwoYmxvYik7XG4gICAgZWxlbS5kb3dubG9hZCA9IGZpbGVuYW1lO1xuICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoZWxlbSk7XG4gICAgZWxlbS5jbGljaygpO1xuICAgIGRvY3VtZW50LmJvZHkucmVtb3ZlQ2hpbGQoZWxlbSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBtZXJnZVVuaXF1ZUVudGl0aWVzICguLi5zb3VyY2VzOiBJRW50aXR5W11bXSk6IElFbnRpdHlbXSB7XG4gICAgbGV0IGFkZGVkSWRzOiBzdHJpbmdbXSA9IFtdLFxuICAgICAgICBtZXJnZWRJdGVtczogSUVudGl0eVtdID0gW107XG4gICAgc291cmNlcy5mb3JFYWNoKHNvdXJjZSA9PiBzb3VyY2UuZm9yRWFjaChpdGVtID0+IHtcbiAgICAgICAgaWYgKGl0ZW0gJiYgaXRlbS5pZCAmJiBhZGRlZElkcy5pbmRleE9mKGl0ZW0uaWQpID09PSAtMSkge1xuICAgICAgICAgICAgYWRkZWRJZHMucHVzaChpdGVtLmlkKTtcbiAgICAgICAgICAgIG1lcmdlZEl0ZW1zLnB1c2goaXRlbSk7XG4gICAgICAgIH1cbiAgICB9KSk7XG4gICAgcmV0dXJuIG1lcmdlZEl0ZW1zO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0RW50aXRpZXNJZHMgKGVudGl0aWVzTGlzdDogSUVudGl0eVtdKTogc3RyaW5nW10ge1xuICAgIHJldHVybiBBcnJheS5pc0FycmF5KGVudGl0aWVzTGlzdCkgJiYgZW50aXRpZXNMaXN0LnJlZHVjZSgocmVzdWx0OiBzdHJpbmdbXSwgZW50aXR5KSA9PiB7XG4gICAgICAgIGVudGl0eSAmJiBlbnRpdHkuaWQgJiYgcmVzdWx0LnB1c2goZW50aXR5LmlkKTtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9LCBbXSkgfHwgW107XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBtZXJnZVVuaXF1ZSAoLi4uc291cmNlczogc3RyaW5nW11bXSk6IHN0cmluZ1tdIHtcbiAgICBsZXQgbWVyZ2VkSXRlbXM6IHN0cmluZ1tdID0gW107XG4gICAgc291cmNlcy5mb3JFYWNoKHNvdXJjZSA9PiB7XG4gICAgICAgIEFycmF5LmlzQXJyYXkoc291cmNlKSAmJiBzb3VyY2UuZm9yRWFjaChpdGVtID0+IHtcbiAgICAgICAgICAgIGl0ZW0gJiYgbWVyZ2VkSXRlbXMuaW5kZXhPZihpdGVtKSA9PT0gLTEgJiYgbWVyZ2VkSXRlbXMucHVzaChpdGVtKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIG1lcmdlZEl0ZW1zO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0VW5pcXVlRW50aXRpZXMgKG5ld0VudGl0aWVzOiBJRW50aXR5W10sIGV4aXN0ZWRFbnRpdGllczogSUVudGl0eVtdKTogSUVudGl0eVtdIHtcbiAgICBsZXQgc2VsZWN0ZWRFbnRpdGllc0hhc2ggPSBlbnRpdHlUb0RpY3Rpb25hcnkoZXhpc3RlZEVudGl0aWVzKTtcbiAgICByZXR1cm4gbmV3RW50aXRpZXMucmVkdWNlKChyZXM6IElFbnRpdHlbXSwgZW50aXR5KSA9PiB7XG4gICAgICAgICFzZWxlY3RlZEVudGl0aWVzSGFzaFtlbnRpdHkuaWRdICYmIHJlcy5wdXNoKGVudGl0eSk7XG4gICAgICAgIHJldHVybiByZXM7XG4gICAgfSwgW10pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdG9nZXRoZXIocHJvbWlzZXM6IFByb21pc2U8YW55PltdKTogUHJvbWlzZTxhbnk+IHtcbiAgICBsZXQgcmVzdWx0czogYW55W10gPSBbXSxcbiAgICAgICAgcmVzdWx0c0NvdW50ID0gMDtcbiAgICByZXN1bHRzLmxlbmd0aCA9IHByb21pc2VzLmxlbmd0aDtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBsZXQgcmVzb2x2ZUFsbCA9ICgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiByZXNvbHZlKHJlc3VsdHMpO1xuICAgICAgICB9O1xuICAgICAgICBwcm9taXNlcy5sZW5ndGggPyBwcm9taXNlcy5mb3JFYWNoKChwcm9taXNlLCBpbmRleCkgPT4ge1xuICAgICAgICAgICAgcHJvbWlzZS50aGVuKChyZXN1bHQpID0+IHtcbiAgICAgICAgICAgICAgICByZXN1bHRzQ291bnQrKztcbiAgICAgICAgICAgICAgICByZXN1bHRzW2luZGV4XSA9IHJlc3VsdDtcbiAgICAgICAgICAgICAgICByZXN1bHRzQ291bnQgPT09IHByb21pc2VzLmxlbmd0aCAmJiByZXNvbHZlQWxsKCk7XG4gICAgICAgICAgICB9KS5jYXRjaCgoZXJyb3IpID0+IHtcbiAgICAgICAgICAgICAgICByZWplY3Qoe1xuICAgICAgICAgICAgICAgICAgICBlcnJvcjogZXJyb3IsXG4gICAgICAgICAgICAgICAgICAgIHByb21pc2VJbmRleDogaW5kZXhcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KSA6IHJlc29sdmVBbGwoKTtcbiAgICB9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlc29sdmVkUHJvbWlzZTxUPiAodmFsPzogVCk6IFByb21pc2U8VD4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZTxUPihyZXNvbHZlID0+IHJlc29sdmUodmFsKSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0b0FycmF5IChkYXRhKSB7XG4gICAgcmV0dXJuIEFycmF5LmlzQXJyYXkoZGF0YSkgPyBkYXRhIDogW2RhdGFdO1xufSIsImV4cG9ydCBkZWZhdWx0IGNsYXNzIFdhaXRpbmcge1xuXG4gICAgcHJpdmF0ZSB3YWl0aW5nQ29udGFpbmVyOiBIVE1MRWxlbWVudDtcbiAgICBwcml2YXRlIGJvZHlFbDogSFRNTEVsZW1lbnQgPSBkb2N1bWVudC5ib2R5O1xuXG4gICAgcHVibGljIHN0YXJ0KGVsOiBIVE1MRWxlbWVudCA9IHRoaXMuYm9keUVsLCB6SW5kZXg/OiBudW1iZXIpIHtcbiAgICAgICAgaWYgKGVsLm9mZnNldFBhcmVudCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMud2FpdGluZ0NvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICAgIHRoaXMud2FpdGluZ0NvbnRhaW5lci5jbGFzc05hbWUgPSBcIndhaXRpbmdcIjtcbiAgICAgICAgdGhpcy53YWl0aW5nQ29udGFpbmVyLmlubmVySFRNTCA9IFwiPGRpdiBjbGFzcz0nZmFkZXInPjwvZGl2PjxkaXYgY2xhc3M9J3NwaW5uZXInPjwvZGl2PlwiO1xuICAgICAgICBlbC5wYXJlbnROb2RlPy5hcHBlbmRDaGlsZCh0aGlzLndhaXRpbmdDb250YWluZXIpO1xuXG4gICAgICAgIHRoaXMud2FpdGluZ0NvbnRhaW5lci5zdHlsZS5wb3NpdGlvbiA9IFwiYWJzb2x1dGVcIjtcbiAgICAgICAgdGhpcy53YWl0aW5nQ29udGFpbmVyLnN0eWxlLndpZHRoID0gZWwub2Zmc2V0V2lkdGggKyBcInB4XCI7XG4gICAgICAgIHRoaXMud2FpdGluZ0NvbnRhaW5lci5zdHlsZS5oZWlnaHQgPSBlbC5vZmZzZXRIZWlnaHQgKyBcInB4XCI7XG4gICAgICAgIHRoaXMud2FpdGluZ0NvbnRhaW5lci5zdHlsZS50b3AgPSBlbC5vZmZzZXRUb3AgKyBcInB4XCI7XG4gICAgICAgIHRoaXMud2FpdGluZ0NvbnRhaW5lci5zdHlsZS5sZWZ0ID0gZWwub2Zmc2V0TGVmdCArIFwicHhcIjtcbiAgICAgICAgdGhpcy53YWl0aW5nQ29udGFpbmVyLnN0eWxlLmRpc3BsYXkgPSBcImJsb2NrXCI7XG4gICAgICAgIHR5cGVvZiB6SW5kZXggPT09IFwibnVtYmVyXCIgJiYgKHRoaXMud2FpdGluZ0NvbnRhaW5lci5zdHlsZS56SW5kZXggPSB6SW5kZXgudG9TdHJpbmcoKSk7XG4gICAgfTtcblxuICAgIHB1YmxpYyBzdG9wICgpIHtcbiAgICAgICAgaWYgKHRoaXMud2FpdGluZ0NvbnRhaW5lciAmJiB0aGlzLndhaXRpbmdDb250YWluZXIucGFyZW50Tm9kZSkge1xuICAgICAgICAgICAgdGhpcy53YWl0aW5nQ29udGFpbmVyLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQodGhpcy53YWl0aW5nQ29udGFpbmVyKTtcbiAgICAgICAgfVxuICAgIH07XG59IiwiLy9hZGRlZCBieSBCcmV0dCB0byBtYW5hZ2UgYWRkaW5nIGFsbCB6b25lcyB0byB0aGUgZXhwb3J0IGFzIGFuIG9wdGlvblxuXG5leHBvcnQgY2xhc3MgWm9uZUJ1aWxkZXIge1xuICAgIHByaXZhdGUgcmVhZG9ubHkgYXBpO1xuICAgIHByaXZhdGUgY3VycmVudFRhc2s7XG5cbiAgICBjb25zdHJ1Y3RvcihhcGkpIHtcbiAgICAgICAgdGhpcy5hcGkgPSBhcGk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhYm9ydEN1cnJlbnRUYXNrICgpIHtcbiAgICAgICAgdGhpcy5jdXJyZW50VGFzayAmJiB0aGlzLmN1cnJlbnRUYXNrLmFib3J0ICYmIHRoaXMuY3VycmVudFRhc2suYWJvcnQoKTtcbiAgICAgICAgdGhpcy5jdXJyZW50VGFzayA9IG51bGw7XG4gICAgfVxuXG4gICAgLy9maWxscyB0aGUgdXNlciBidWlsZGVyIHdpdGggYWxsIHVzZXJzXG4gICAgZmV0Y2ggKCk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIHRoaXMuYWJvcnRDdXJyZW50VGFzaygpO1xuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrID0gdGhpcy5nZXRab25lcygpXG4gICAgICAgIHJldHVybiB0aGlzLmN1cnJlbnRUYXNrO1xuICAgIH1cblxuICAgIHByaXZhdGUgZ2V0Wm9uZXMgKCk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICB0aGlzLmFwaS5jYWxsKFwiR2V0XCIsIHtcbiAgICAgICAgICAgICAgICBcInR5cGVOYW1lXCI6IFwiWm9uZVwiXG4gICAgICAgICAgICB9LCByZXNvbHZlLCByZWplY3QpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICB1bmxvYWQgKCk6IHZvaWQge1xuICAgICAgICB0aGlzLmFib3J0Q3VycmVudFRhc2soKTtcbiAgICB9XG59Il19
