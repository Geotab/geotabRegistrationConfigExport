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

},{"./distributionListsBuilder":2,"./groupsBuilder":3,"./miscBuilder":4,"./reportsBuilder":5,"./rulesBuilder":6,"./securityClearancesBuilder":7,"./utils":8,"./waiting":9,"./zoneBuilder":10}],2:[function(require,module,exports){
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

},{"./utils":8}],3:[function(require,module,exports){
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

},{"./utils":8}],4:[function(require,module,exports){
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

},{"./utils":8}],5:[function(require,module,exports){
"use strict";
exports.__esModule = true;
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
            groups: [],
            users: []
        };
        return reports.reduce(function (reportsDependencies, template) {
            return template.reports.reduce(function (templateDependecies, report) {
                templateDependecies.groups = Utils.mergeUnique(templateDependecies.groups, Utils.getEntitiesIds(report.groups), Utils.getEntitiesIds(report.includeAllChildrenGroups), Utils.getEntitiesIds(report.includeDirectChildrenOnlyGroups), Utils.getEntitiesIds(report.scopeGroups));
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

},{"./utils":8}],7:[function(require,module,exports){
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

},{"./groupsBuilder":3,"./utils":8}],8:[function(require,module,exports){
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

},{}],9:[function(require,module,exports){
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

},{}],10:[function(require,module,exports){
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzb3VyY2VzL2FkZGluLnRzIiwic291cmNlcy9kaXN0cmlidXRpb25MaXN0c0J1aWxkZXIudHMiLCJzb3VyY2VzL2dyb3Vwc0J1aWxkZXIudHMiLCJzb3VyY2VzL21pc2NCdWlsZGVyLnRzIiwic291cmNlcy9yZXBvcnRzQnVpbGRlci50cyIsInNvdXJjZXMvcnVsZXNCdWlsZGVyLnRzIiwic291cmNlcy9zZWN1cml0eUNsZWFyYW5jZXNCdWlsZGVyLnRzIiwic291cmNlcy91dGlscy50cyIsInNvdXJjZXMvd2FpdGluZy50cyIsInNvdXJjZXMvem9uZUJ1aWxkZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7O0FDQUEscUNBQXFDO0FBQ3JDLHdDQUF3Qzs7Ozs7Ozs7Ozs7QUFFeEMsaURBQTRDO0FBQzVDLHlFQUFvRTtBQUNwRSxtREFBOEM7QUFDOUMsK0NBQTBDO0FBQzFDLHVFQUFrRTtBQUNsRSw2Q0FBcUQ7QUFDckQsaUNBQW9KO0FBQ3BKLHFDQUFnQztBQUNoQyw2Q0FBNkM7QUFDN0MsNkNBQTBDO0FBZ0QxQztJQXlUSSxrQkFBa0I7SUFDbEIsZUFBYSxHQUFHO1FBQWhCLGlCQVlDO1FBNVRnQixjQUFTLEdBQUcsUUFBUSxDQUFDLGNBQWMsQ0FBQyxjQUFjLENBQXNCLENBQUM7UUFDekUsWUFBTyxHQUFHLFFBQVEsQ0FBQyxjQUFjLENBQUMsWUFBWSxDQUFzQixDQUFDO1FBQ3JFLDRCQUF1QixHQUFxQixRQUFRLENBQUMsY0FBYyxDQUFDLDRCQUE0QixDQUFxQixDQUFDO1FBQ3RILDJCQUFzQixHQUFxQixRQUFRLENBQUMsY0FBYyxDQUFDLDJCQUEyQixDQUFxQixDQUFDO1FBQ3BILGlDQUE0QixHQUFxQixRQUFRLENBQUMsY0FBYyxDQUFDLGlDQUFpQyxDQUFxQixDQUFDO1FBR2hJLFNBQUksR0FBZ0I7WUFDakMsTUFBTSxFQUFFLEVBQUU7WUFDVixPQUFPLEVB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QUFJLENBQUMsV0FBVyxJQUFJLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxJQUFJLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDdkUsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUM7SUFDNUIsQ0FBQztJQUVELHVDQUF1QztJQUN2QywyQkFBSyxHQUFMO1FBQ0ksSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7UUFDeEIsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUE7UUFDbEMsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDO0lBQzVCLENBQUM7SUFFTyw4QkFBUSxHQUFoQjtRQUFBLGlCQU1DO1FBTEcsT0FBTyxJQUFJLE9BQU8sQ0FBQyxVQUFDLE9BQU8sRUFBRSxNQUFNO1lBQy9CLEtBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRTtnQkFDakIsVUFBVSxFQUFFLE1BQU07YUFDckIsRUFBRSxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDeEIsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDO0lBRUQsNEJBQU0sR0FBTjtRQUNJLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO0lBQzVCLENBQUM7SUFDTCxrQkFBQztBQUFELENBL0JBLEFBK0JDLElBQUE7QUEvQlksa0NBQVciLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi9hZGRpbi5kLnRzXCIgLz5cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi9ibHVlYmlyZC5kLnRzXCIvPlxuXG5pbXBvcnQgR3JvdXBzQnVpbGRlciBmcm9tIFwiLi9ncm91cHNCdWlsZGVyXCI7XG5pbXBvcnQgU2VjdXJpdHlDbGVhcmFuY2VzQnVpbGRlciBmcm9tIFwiLi9zZWN1cml0eUNsZWFyYW5jZXNCdWlsZGVyXCI7XG5pbXBvcnQgUmVwb3J0c0J1aWxkZXIgZnJvbSBcIi4vcmVwb3J0c0J1aWxkZXJcIjtcbmltcG9ydCBSdWxlc0J1aWxkZXIgZnJvbSBcIi4vcnVsZXNCdWlsZGVyXCI7XG5pbXBvcnQgRGlzdHJpYnV0aW9uTGlzdHNCdWlsZGVyIGZyb20gXCIuL2Rpc3RyaWJ1dGlvbkxpc3RzQnVpbGRlclwiO1xuaW1wb3J0IHtJTWlzY0RhdGEsIE1pc2NCdWlsZGVyfSBmcm9tIFwiLi9taXNjQnVpbGRlclwiO1xuaW1wb3J0IHtkb3dubG9hZERhdGFBc0ZpbGUsIG1lcmdlVW5pcXVlLCBJRW50aXR5LCBtZXJnZVVuaXF1ZUVudGl0aWVzLCBnZXRVbmlxdWVFbnRpdGllcywgZ2V0RW50aXRpZXNJZHMsIHRvZ2V0aGVyLCByZXNvbHZlZFByb21pc2V9IGZyb20gXCIuL3V0aWxzXCI7XG5pbXBvcnQgV2FpdGluZyBmcm9tIFwiLi93YWl0aW5nXCI7XG4vLyBpbXBvcnQge1VzZXJCdWlsZGVyfSBmcm9tIFwiLi91c2VyQnVpbGRlclwiO1xuaW1wb3J0IHtab25lQnVpbGRlcn0gZnJvbSBcIi4vem9uZUJ1aWxkZXJcIjtcblxuaW50ZXJmYWNlIEdlb3RhYiB7XG4gICAgYWRkaW46IHtcbiAgICAgICAgcmVnaXN0cmF0aW9uQ29uZmlnOiBGdW5jdGlvblxuICAgIH07XG59XG5cbmludGVyZmFjZSBJSW1wb3J0RGF0YSB7XG4gICAgZ3JvdXBzOiBhbnlbXTtcbiAgICByZXBvcnRzOiBhbnlbXTtcbiAgICBydWxlczogYW55W107XG4gICAgZGlzdHJpYnV0aW9uTGlzdHM6IGFueVtdO1xuICAgIGRldmljZXM6IGFueVtdO1xuICAgIHVzZXJzOiBhbnlbXTtcbiAgICB6b25lVHlwZXM6IGFueVtdO1xuICAgIHpvbmVzOiBhbnlbXTtcbiAgICB3b3JrVGltZXM6IGFueVtdO1xuICAgIHdvcmtIb2xpZGF5czogYW55W107XG4gICAgc2VjdXJpdHlHcm91cHM6IGFueVtdO1xuICAgIGRpYWdub3N0aWNzOiBhbnlbXTtcbiAgICBjdXN0b21NYXBzOiBhbnlbXTtcbiAgICBtaXNjOiBJTWlzY0RhdGEgfCBudWxsO1xuICAgIG5vdGlmaWNhdGlvblRlbXBsYXRlczogYW55W107XG4gICAgY2VydGlmaWNhdGVzOiBhbnlbXTtcbn1cbmludGVyZmFjZSBJRGVwZW5kZW5jaWVzIHtcbiAgICBncm91cHM/OiBzdHJpbmdbXTtcbiAgICByZXBvcnRzPzogc3RyaW5nW107XG4gICAgcnVsZXM/OiBzdHJpbmdbXTtcbiAgICBkaXN0cmlidXRpb25MaXN0cz86IHN0cmluZ1tdO1xuICAgIGRldmljZXM/OiBzdHJpbmdbXTtcbiAgICB1c2Vycz86IHN0cmluZ1tdO1xuICAgIHpvbmVUeXBlcz86IHN0cmluZ1tdO1xuICAgIHpvbmVzPzogc3RyaW5nW107XG4gICAgd29ya1RpbWVzPzogc3RyaW5nW107XG4gICAgd29ya0hvbGlkYXlzPzogc3RyaW5nW107XG4gICAgc2VjdXJpdHlHcm91cHM/OiBzdHJpbmdbXTtcbiAgICBkaWFnbm9zdGljcz86IHN0cmluZ1tdO1xuICAgIGN1c3RvbU1hcHM/OiBzdHJpbmdbXTtcbiAgICBub3RpZmljYXRpb25UZW1wbGF0ZXM/OiBzdHJpbmdbXTtcbiAgICBjZXJ0aWZpY2F0ZXM/OiBzdHJpbmdbXTtcbn1cblxudHlwZSBURW50aXR5VHlwZSA9IGtleW9mIElJbXBvcnREYXRhO1xuXG5kZWNsYXJlIGNvbnN0IGdlb3RhYjogR2VvdGFiO1xuXG5jbGFzcyBBZGRpbiB7XG4gICAgcHJpdmF0ZSByZWFkb25seSBhcGk7XG4gICAgcHJpdmF0ZSByZWFkb25seSBncm91cHNCdWlsZGVyOiBHcm91cHNCdWlsZGVyO1xuICAgIHByaXZhdGUgcmVhZG9ubHkgc2VjdXJpdHlDbGVhcmFuY2VzQnVpbGRlcjogU2VjdXJpdHlDbGVhcmFuY2VzQnVpbGRlcjtcbiAgICBwcml2YXRlIHJlYWRvbmx5IHJlcG9ydHNCdWlsZGVyOiBSZXBvcnRzQnVpbGRlcjtcbiAgICBwcml2YXRlIHJlYWRvbmx5IHJ1bGVzQnVpbGRlcjogUnVsZXNCdWlsZGVyO1xuICAgIHByaXZhdGUgcmVhZG9ubHkgZGlzdHJpYnV0aW9uTGlzdHNCdWlsZGVyOiBEaXN0cmlidXRpb25MaXN0c0J1aWxkZXI7XG4gICAgcHJpdmF0ZSByZWFkb25seSBtaXNjQnVpbGRlcjogTWlzY0J1aWxkZXI7XG4gICAgLy8gcHJpdmF0ZSByZWFkb25seSB1c2VyQnVpbGRlcjogVXNlckJ1aWxkZXI7XG4gICAgcHJpdmF0ZSByZWFkb25seSB6b25lQnVpbGRlcjogWm9uZUJ1aWxkZXI7XG4gICAgcHJpdmF0ZSByZWFkb25seSBleHBvcnRCdG4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImV4cG9ydEJ1dHRvblwiKSBhcyBIVE1MQnV0dG9uRWxlbWVudDtcbiAgICBwcml2YXRlIHJlYWRvbmx5IHNhdmVCdG4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNhdmVCdXR0b25cIikgYXMgSFRNTEJ1dHRvbkVsZW1lbnQ7XG4gICAgcHJpdmF0ZSByZWFkb25seSBleHBvcnRBbGxBZGRpbnNDaGVja2JveDogSFRNTElucHV0RWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZXhwb3J0X2FsbF9hZGRpbnNfY2hlY2tib3hcIikgYXMgSFRNTElucHV0RWxlbWVudDtcbiAgICBwcml2YXRlIHJlYWRvbmx5IGV4cG9ydEFsbFpvbmVzQ2hlY2tib3g6IEhUTUxJbnB1dEVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImV4cG9ydF9hbGxfem9uZXNfY2hlY2tib3hcIikgYXMgSFRNTElucHV0RWxlbWVudDtcbiAgICBwcml2YXRlIHJlYWRvbmx5IGV4cG9ydFN5c3RlbVNldHRpbmdzQ2hlY2tib3g6IEhUTUxJbnB1dEVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImV4cG9ydF9zeXN0ZW1fc2V0dGluZ3NfY2hlY2tib3hcIikgYXMgSFRNTElucHV0RWxlbWVudDtcbiAgICBwcml2YXRlIHJlYWRvbmx5IHdhaXRpbmc6IFdhaXRpbmc7XG4gICAgcHJpdmF0ZSBjdXJyZW50VGFzaztcbiAgICBwcml2YXRlIHJlYWRvbmx5IGRhdGE6IElJbXBvcnREYXRhID0ge1xuICAgICAgICBncm91cHM6IFtdLFxuICAgICAgICByZXBvcnRzOiBbXSxcbiAgICAgICAgcnVsZXM6IFtdLFxuICAgICAgICBkaXN0cmlidXRpb25MaXN0czogW10sXG4gICAgICAgIGRldmljZXM6IFtdLFxuICAgICAgICB1c2VyczogW10sXG4gICAgICAgIHpvbmVUeXBlczogW10sXG4gICAgICAgIHpvbmVzOiBbXSxcbiAgICAgICAgd29ya1RpbWVzOiBbXSxcbiAgICAgICAgd29ya0hvbGlkYXlzOiBbXSxcbiAgICAgICAgc2VjdXJpdHlHcm91cHM6IFtdLFxuICAgICAgICBjdXN0b21NYXBzOiBbXSxcbiAgICAgICAgZGlhZ25vc3RpY3M6IFtdLFxuICAgICAgICBtaXNjOiBudWxsLFxuICAgICAgICBub3RpZmljYXRpb25UZW1wbGF0ZXM6IFtdLFxuICAgICAgICBjZXJ0aWZpY2F0ZXM6IFtdXG4gICAgfTtcblxuICAgIHByaXZhdGUgY29tYmluZURlcGVuZGVuY2llcyAoLi4uYWxsRGVwZW5kZW5jaWVzOiBJRGVwZW5kZW5jaWVzW10pOiBJRGVwZW5kZW5jaWVzIHtcbiAgICAgICAgbGV0IHRvdGFsID0ge1xuICAgICAgICAgICAgZ3JvdXBzOiBbXSxcbiAgICAgICAgICAgIHJlcG9ydHM6IFtdLFxuICAgICAgICAgICAgcnVsZXM6IFtdLFxuICAgICAgICAgICAgZGV2aWNlczogW10sXG4gICAgICAgICAgICB1c2VyczogW10sXG4gICAgICAgICAgICB6b25lVHlwZXM6IFtdLFxuICAgICAgICAgICAgem9uZXM6IFtdLFxuICAgICAgICAgICAgd29ya1RpbWVzOiBbXSxcbiAgICAgICAgICAgIHdvcmtIb2xpZGF5czogW10sXG4gICAgICAgICAgICBzZWN1cml0eUdyb3VwczogW10sXG4gICAgICAgICAgICBkaWFnbm9zdGljczogW10sXG4gICAgICAgICAgICBjdXN0b21NYXBzOiBbXSxcbiAgICAgICAgICAgIG5vdGlmaWNhdGlvblRlbXBsYXRlczogW11cbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIE9iamVjdC5rZXlzKHRvdGFsKS5yZWR1Y2UoKGRlcGVuZGVuY2llcywgZGVwZW5kZW5jeU5hbWU6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgZGVwZW5kZW5jaWVzW2RlcGVuZGVuY3lOYW1lXSA9IG1lcmdlVW5pcXVlKGRlcGVuZGVuY2llc1tkZXBlbmRlbmN5TmFtZV0sIC4uLmFsbERlcGVuZGVuY2llcy5tYXAoKGVudGl0eURlcGVuZGVuY2llcykgPT4gZW50aXR5RGVwZW5kZW5jaWVzW2RlcGVuZGVuY3lOYW1lXSkpO1xuICAgICAgICAgICAgcmV0dXJuIGRlcGVuZGVuY2llcztcbiAgICAgICAgfSwgdG90YWwpO1xuICAgIH1cblxuICAgIHByaXZhdGUgYWRkTmV3R3JvdXBzIChncm91cHM6IHN0cmluZ1tdLCBkYXRhOiBJSW1wb3J0RGF0YSk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIGlmICghZ3JvdXBzLmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVkUHJvbWlzZSgpO1xuICAgICAgICB9XG4gICAgICAgIGxldCBncm91cHNEYXRhID0gdGhpcy5ncm91cHNCdWlsZGVyLmdldEdyb3Vwc0RhdGEoZ3JvdXBzLCB0cnVlKSxcbiAgICAgICAgICAgIG5ld0dyb3Vwc1VzZXJzID0gZ2V0VW5pcXVlRW50aXRpZXModGhpcy5ncm91cHNCdWlsZGVyLmdldFByaXZhdGVHcm91cHNVc2Vycyhncm91cHNEYXRhKSwgZGF0YS51c2Vycyk7XG4gICAgICAgIGRhdGEuZ3JvdXBzID0gbWVyZ2VVbmlxdWVFbnRpdGllcyhkYXRhLmdyb3VwcywgZ3JvdXBzRGF0YSk7XG4gICAgICAgIGRhdGEudXNlcnMgPSBtZXJnZVVuaXF1ZUVudGl0aWVzKGRhdGEudXNlcnMsIG5ld0dyb3Vwc1VzZXJzKTtcbiAgICAgICAgcmV0dXJuIHRoaXMucmVzb2x2ZURlcGVuZGVuY2llcyh7dXNlcnM6IGdldEVudGl0aWVzSWRzKG5ld0dyb3Vwc1VzZXJzKX0sIGRhdGEpO1xuICAgIH1cblxuICAgIHByaXZhdGUgYWRkTmV3Q3VzdG9tTWFwcyAoY3VzdG9tTWFwc0lkczogc3RyaW5nW10sIGRhdGE6IElJbXBvcnREYXRhKSB7XG4gICAgICAgIGlmICghY3VzdG9tTWFwc0lkcyB8fCAhY3VzdG9tTWFwc0lkcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgY3VzdG9tTWFwc0RhdGEgPSBjdXN0b21NYXBzSWRzLnJlZHVjZSgoZGF0YTogYW55W10sIGN1c3RvbU1hcElkOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgIGxldCBjdXN0b21NYXBEYXRhID0gdGhpcy5taXNjQnVpbGRlci5nZXRNYXBQcm92aWRlckRhdGEoY3VzdG9tTWFwSWQpO1xuICAgICAgICAgICAgY3VzdG9tTWFwRGF0YSAmJiBkYXRhLnB1c2goY3VzdG9tTWFwRGF0YSk7XG4gICAgICAgICAgICByZXR1cm4gZGF0YTtcbiAgICAgICAgfSwgW10pO1xuICAgICAgICBkYXRhLmN1c3RvbU1hcHMgPSBtZXJnZVVuaXF1ZUVudGl0aWVzKGRhdGEuY3VzdG9tTWFwcywgY3VzdG9tTWFwc0RhdGEpO1xuICAgIH1cblxuICAgIHByaXZhdGUgYWRkTmV3Tm90aWZpY2F0aW9uVGVtcGxhdGVzIChub3RpZmljYXRpb25UZW1wbGF0ZXNJZHM6IHN0cmluZ1tdLCBkYXRhOiBJSW1wb3J0RGF0YSkge1xuICAgICAgICBpZiAoIW5vdGlmaWNhdGlvblRlbXBsYXRlc0lkcyB8fCAhbm90aWZpY2F0aW9uVGVtcGxhdGVzSWRzLmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGxldCBub3RpZmljYXRpb25UZW1wbGF0ZXNEYXRhID0gbm90aWZpY2F0aW9uVGVtcGxhdGVzSWRzLnJlZHVjZSgoZGF0YTogYW55W10sIHRlbXBsYXRlSWQ6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgbGV0IHRlbXBsYXRlRGF0YSA9IHRoaXMuZGlzdHJpYnV0aW9uTGlzdHNCdWlsZGVyLmdldE5vdGlmaWNhdGlvblRlbXBsYXRlRGF0YSh0ZW1wbGF0ZUlkKTtcbiAgICAgICAgICAgIHRlbXBsYXRlRGF0YSAmJiBkYXRhLnB1c2godGVtcGxhdGVEYXRhKTtcbiAgICAgICAgICAgIHJldHVybiBkYXRhO1xuICAgICAgICB9LCBbXSk7XG4gICAgICAgIGRhdGEubm90aWZpY2F0aW9uVGVtcGxhdGVzID0gbWVyZ2VVbmlxdWVFbnRpdGllcyhkYXRhLm5vdGlmaWNhdGlvblRlbXBsYXRlcywgbm90aWZpY2F0aW9uVGVtcGxhdGVzRGF0YSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBnZXRFbnR5dGllc0lkcyAoZW50aXRpZXM6IElFbnRpdHlbXSk6IHN0cmluZ1tdIHtcbiAgICAgICAgcmV0dXJuIGVudGl0aWVzLnJlZHVjZSgocmVzOiBzdHJpbmdbXSwgZW50aXR5KSA9PiB7XG4gICAgICAgICAgICBlbnRpdHkgJiYgZW50aXR5LmlkICYmIHJlcy5wdXNoKGVudGl0eS5pZCk7XG4gICAgICAgICAgICByZXR1cm4gcmVzO1xuICAgICAgICB9LCBbXSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBnZXRFbnRpdHlEZXBlbmRlbmNpZXMgKGVudGl0eTogSUVudGl0eSwgZW50aXR5VHlwZTogVEVudGl0eVR5cGUpIHtcbiAgICAgICAgbGV0IGVudGl0eURlcGVuZGVuY2llczogSURlcGVuZGVuY2llcyA9IHt9O1xuICAgICAgICBzd2l0Y2ggKGVudGl0eVR5cGUpIHtcbiAgICAgICAgICAgIGNhc2UgXCJkZXZpY2VzXCI6XG4gICAgICAgICAgICAgICAgZW50aXR5RGVwZW5kZW5jaWVzLmdyb3VwcyA9IHRoaXMuZ2V0RW50eXRpZXNJZHMoZW50aXR5W1wiZ3JvdXBzXCJdLmNvbmNhdChlbnRpdHlbXCJhdXRvR3JvdXBzXCJdKSk7XG4gICAgICAgICAgICAgICAgZW50aXR5W1wid29ya1RpbWVcIl0uaWQgJiYgKGVudGl0eURlcGVuZGVuY2llcy53b3JrVGltZXMgPSBbZW50aXR5W1wid29ya1RpbWVcIl0uaWRdKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJ1c2Vyc1wiOlxuICAgICAgICAgICAgICAgIGVudGl0eURlcGVuZGVuY2llcy5ncm91cHMgPSB0aGlzLmdldEVudHl0aWVzSWRzKGVudGl0eVtcImNvbXBhbnlHcm91cHNcIl0uY29uY2F0KGVudGl0eVtcImRyaXZlckdyb3Vwc1wiXSkuY29uY2F0KGVudGl0eVtcInByaXZhdGVVc2VyR3JvdXBzXCJdKS5jb25jYXQoZW50aXR5W1wicmVwb3J0R3JvdXBzXCJdKSk7XG4gICAgICAgICAgICAgICAgZW50aXR5RGVwZW5kZW5jaWVzLnNlY3VyaXR5R3JvdXBzID0gdGhpcy5nZXRFbnR5dGllc0lkcyhlbnRpdHlbXCJzZWN1cml0eUdyb3Vwc1wiXSk7XG4gICAgICAgICAgICAgICAgZW50aXR5RGVwZW5kZW5jaWVzLmN1c3RvbU1hcHMgPSBbZW50aXR5W1wiZGVmYXVsdE1hcEVuZ2luZVwiXV07XG4gICAgICAgICAgICAgICAgaWYgKGVudGl0eS5pc3N1ZXJDZXJ0aWZpY2F0ZSkge1xuICAgICAgICAgICAgICAgICAgICBlbnRpdHlEZXBlbmRlbmNpZXMuY2VydGlmaWNhdGVzID0gWyBlbnRpdHkuaXNzdWVyQ2VydGlmaWNhdGUuaWQgXVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJ6b25lc1wiOlxuICAgICAgICAgICAgICAgIGxldCB6b25lVHlwZXMgPSB0aGlzLmdldEVudHl0aWVzSWRzKGVudGl0eVtcInpvbmVUeXBlc1wiXSk7XG4gICAgICAgICAgICAgICAgem9uZVR5cGVzLmxlbmd0aCAmJiAoZW50aXR5RGVwZW5kZW5jaWVzLnpvbmVUeXBlcyA9IHpvbmVUeXBlcyk7XG4gICAgICAgICAgICAgICAgZW50aXR5RGVwZW5kZW5jaWVzLmdyb3VwcyA9IHRoaXMuZ2V0RW50eXRpZXNJZHMoZW50aXR5W1wiZ3JvdXBzXCJdKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJ3b3JrVGltZXNcIjpcbiAgICAgICAgICAgICAgICBlbnRpdHlbXCJob2xpZGF5R3JvdXBcIl0uZ3JvdXBJZCAmJiAoZW50aXR5RGVwZW5kZW5jaWVzLndvcmtIb2xpZGF5cyA9IFtlbnRpdHlbXCJob2xpZGF5R3JvdXBcIl0uZ3JvdXBJZF0pO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZW50aXR5RGVwZW5kZW5jaWVzO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXBwbHlUb0VudGl0aWVzIDxUPihlbnRpdGllc0xpc3Q6IElEZXBlbmRlbmNpZXMsIGluaXRpYWxWYWx1ZSwgZnVuYzogKHJlc3VsdCwgZW50aXR5LCBlbnRpdHlUeXBlOiBURW50aXR5VHlwZSwgZW50aXR5SW5kZXg6IG51bWJlciwgZW50aXR5VHlwZUluZGV4OiBudW1iZXIsIG92ZXJhbGxJbmRleDogbnVtYmVyKSA9PiBUKSB7XG4gICAgICAgIGxldCBvdmVyYWxsSW5kZXggPSAwO1xuICAgICAgICByZXR1cm4gT2JqZWN0LmtleXMoZW50aXRpZXNMaXN0KS5yZWR1Y2UoKHJlc3VsdDogVCwgZW50aXR5VHlwZTogc3RyaW5nLCB0eXBlSW5kZXg6IG51bWJlcikgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIGVudGl0aWVzTGlzdFtlbnRpdHlUeXBlXS5yZWR1Y2UoKHJlczogVCwgZW50aXR5LCBpbmRleCkgPT4ge1xuICAgICAgICAgICAgICAgIG92ZXJhbGxJbmRleCsrO1xuICAgICAgICAgICAgICAgIHJldHVybiBmdW5jKHJlcywgZW50aXR5LCBlbnRpdHlUeXBlIGFzIFRFbnRpdHlUeXBlLCBpbmRleCwgdHlwZUluZGV4LCBvdmVyYWxsSW5kZXggLSAxKTtcbiAgICAgICAgICAgIH0sIHJlc3VsdCk7XG4gICAgICAgIH0sIGluaXRpYWxWYWx1ZSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSByZXNvbHZlRGVwZW5kZW5jaWVzIChkZXBlbmRlbmNpZXM6IElEZXBlbmRlbmNpZXMsIGRhdGE6IElJbXBvcnREYXRhKSB7XG4gICAgICAgIGxldCBnZXREYXRhID0gKGVudGl0aWVzTGlzdDogSURlcGVuZGVuY2llcyk6IFByb21pc2U8SUltcG9ydERhdGE+ID0+IHtcbiAgICAgICAgICAgICAgICBsZXQgZW50aXR5UmVxdWVzdFR5cGVzID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGV2aWNlczogXCJEZXZpY2VcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIHVzZXJzOiBcIlVzZXJcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIHpvbmVUeXBlczogXCJab25lVHlwZVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgem9uZXM6IFwiWm9uZVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgd29ya1RpbWVzOiBcIldvcmtUaW1lXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICB3b3JrSG9saWRheXM6IFwiV29ya0hvbGlkYXlcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlY3VyaXR5R3JvdXBzOiBcIkdyb3VwXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBkaWFnbm9zdGljczogXCJEaWFnbm9zdGljXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBjZXJ0aWZpY2F0ZXM6IFwiQ2VydGlmaWNhdGVcIlxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICByZXF1ZXN0czogYW55ID0gdGhpcy5hcHBseVRvRW50aXRpZXMoZW50aXRpZXNMaXN0LCB7fSwgKHJlc3VsdCwgZW50aXR5SWQsIGVudGl0eVR5cGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCByZXF1ZXN0ID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGVOYW1lOiBlbnRpdHlSZXF1ZXN0VHlwZXNbZW50aXR5VHlwZV0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VhcmNoOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkOiBlbnRpdHlJZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZW50aXR5UmVxdWVzdFR5cGVzW2VudGl0eVR5cGVdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVudGl0eVR5cGUgPT09IFwid29ya0hvbGlkYXlzXCIgfHwgZW50aXR5VHlwZSA9PT0gXCJzZWN1cml0eUdyb3Vwc1wiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICFyZXN1bHRbZW50aXR5VHlwZV0gJiYgKHJlc3VsdFtlbnRpdHlUeXBlXSA9IFtdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHRbZW50aXR5VHlwZV0ucHVzaChbXCJHZXRcIiwgcmVxdWVzdF0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICBpZiAoZW50aXRpZXNMaXN0LnNlY3VyaXR5R3JvdXBzICYmIGVudGl0aWVzTGlzdC5zZWN1cml0eUdyb3Vwcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVxdWVzdHMuc2VjdXJpdHlHcm91cHMgPSBbW1wiR2V0XCIsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGVOYW1lOiBlbnRpdHlSZXF1ZXN0VHlwZXMuc2VjdXJpdHlHcm91cHMsXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWFyY2g6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZDogXCJHcm91cFNlY3VyaXR5SWRcIlxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChlbnRpdGllc0xpc3Qud29ya0hvbGlkYXlzICYmIGVudGl0aWVzTGlzdC53b3JrSG9saWRheXMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlcXVlc3RzLndvcmtIb2xpZGF5cyA9IFtbXCJHZXRcIiwge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZU5hbWU6IGVudGl0eVJlcXVlc3RUeXBlcy53b3JrSG9saWRheXNcbiAgICAgICAgICAgICAgICAgICAgfV1dO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmFkZE5ld0dyb3VwcyhlbnRpdGllc0xpc3QuZ3JvdXBzIHx8IFtdLCBkYXRhKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGROZXdDdXN0b21NYXBzKGVudGl0aWVzTGlzdC5jdXN0b21NYXBzIHx8IFtdLCBkYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGROZXdOb3RpZmljYXRpb25UZW1wbGF0ZXMoZW50aXRpZXNMaXN0Lm5vdGlmaWNhdGlvblRlbXBsYXRlcyB8fCBbXSwgZGF0YSk7XG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBlbnRpdGllc0xpc3QuZ3JvdXBzO1xuICAgICAgICAgICAgICAgICAgICBkZWxldGUgZW50aXRpZXNMaXN0LmN1c3RvbU1hcHM7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZTxJSW1wb3J0RGF0YT4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHJlcXVlc3RFbnRpdGllcyA9IE9iamVjdC5rZXlzKHJlcXVlc3RzKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXF1ZXN0c0FycmF5ID0gcmVxdWVzdEVudGl0aWVzLnJlZHVjZSgobGlzdCwgdHlwZSkgPT4gbGlzdC5jb25jYXQocmVxdWVzdHNbdHlwZV0pLCBbXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXJlcXVlc3RFbnRpdGllcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZShkYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYXBpLm11bHRpQ2FsbChyZXF1ZXN0c0FycmF5LCAocmVzcG9uc2UpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IG5ld0dyb3Vwczogc3RyaW5nW10gPSBbXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld0N1c3RvbU1hcHM6IHN0cmluZ1tdID0gW10sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdEZXBlbmRlbmNpZXM6IElEZXBlbmRlbmNpZXMgPSB7fSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4cG9ydGVkRGF0YTogYW55ID0gdGhpcy5hcHBseVRvRW50aXRpZXMocmVxdWVzdHMsIHt9LCAocmVzdWx0LCByZXF1ZXN0LCBlbnRpdHlUeXBlLCBlbnRpdHlJbmRleCwgZW50aXR5VHlwZUluZGV4LCBvdmVyYWxsSW5kZXgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgaXRlbXMgPSByZXF1ZXN0c0FycmF5Lmxlbmd0aCA+IDEgPyByZXNwb25zZVtvdmVyYWxsSW5kZXhdIDogcmVzcG9uc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbXMuZm9yRWFjaCgoaXRlbSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtID0gaXRlbVswXSB8fCBpdGVtO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAhcmVzdWx0W2VudGl0eVR5cGVdICYmIChyZXN1bHRbZW50aXR5VHlwZV0gPSBbXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlbnRpdHlUeXBlID09PSBcIndvcmtIb2xpZGF5c1wiICYmICghaXRlbS5ob2xpZGF5R3JvdXAgfHwgKGVudGl0aWVzTGlzdC53b3JrSG9saWRheXMgfHwgW10pLmluZGV4T2YoaXRlbS5ob2xpZGF5R3JvdXAuZ3JvdXBJZCkgPT09IC0xKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlbnRpdHlUeXBlID09PSBcIndvcmtUaW1lc1wiICYmICFpdGVtLmRldGFpbHMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZW50aXR5VHlwZSA9PT0gXCJzZWN1cml0eUdyb3Vwc1wiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoKGVudGl0aWVzTGlzdC5zZWN1cml0eUdyb3VwcyB8fCBbXSkuaW5kZXhPZihpdGVtLmlkKSA+IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0W2VudGl0eVR5cGVdID0gcmVzdWx0W2VudGl0eVR5cGVdLmNvbmNhdCh0aGlzLmdyb3Vwc0J1aWxkZXIuZ2V0Q3VzdG9tR3JvdXBzRGF0YShlbnRpdGllc0xpc3Quc2VjdXJpdHlHcm91cHMgfHwgW10sIGl0ZW1zKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgZW50aXR5RGVwZW5kZW5jaWVzID0gdGhpcy5nZXRFbnRpdHlEZXBlbmRlbmNpZXMoaXRlbSwgZW50aXR5VHlwZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld0RlcGVuZGVuY2llcyA9IHRoaXMuYXBwbHlUb0VudGl0aWVzKGVudGl0eURlcGVuZGVuY2llcywgbmV3RGVwZW5kZW5jaWVzLCAocmVzdWx0LCBlbnRpdHlJZCwgZW50aXR5VHlwZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIXJlc3VsdFtlbnRpdHlUeXBlXSAmJiAocmVzdWx0W2VudGl0eVR5cGVdID0gW10pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0W2VudGl0eVR5cGVdID0gbWVyZ2VVbmlxdWUocmVzdWx0W2VudGl0eVR5cGVdLCBbZW50aXR5SWRdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdHcm91cHMgPSBuZXdHcm91cHMuY29uY2F0KG5ld0RlcGVuZGVuY2llcy5ncm91cHMgfHwgW10pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdDdXN0b21NYXBzID0gbmV3Q3VzdG9tTWFwcy5jb25jYXQobmV3RGVwZW5kZW5jaWVzLmN1c3RvbU1hcHMgfHwgW10pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgbmV3RGVwZW5kZW5jaWVzLmdyb3VwcztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIG5ld0RlcGVuZGVuY2llcy5jdXN0b21NYXBzO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHRbZW50aXR5VHlwZV0ucHVzaChpdGVtKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld0RlcGVuZGVuY2llcyA9IE9iamVjdC5rZXlzKG5ld0RlcGVuZGVuY2llcykucmVkdWNlKChyZXN1bHQsIGRlcGVuZGVuY3lOYW1lKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgZW50aXRpZXMgPSBuZXdEZXBlbmRlbmNpZXNbZGVwZW5kZW5jeU5hbWVdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4cG9ydGVkID0gKGV4cG9ydGVkRGF0YVtkZXBlbmRlbmN5TmFtZV0gfHwgW10pLm1hcChlbnRpdHkgPT4gZW50aXR5LmlkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVudGl0aWVzLmZvckVhY2goZW50aXR5SWQgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChleHBvcnRlZC5pbmRleE9mKGVudGl0eUlkKSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIXJlc3VsdFtkZXBlbmRlbmN5TmFtZV0gJiYgKHJlc3VsdFtkZXBlbmRlbmN5TmFtZV0gPSBbXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdFtkZXBlbmRlbmN5TmFtZV0ucHVzaChlbnRpdHlJZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LCB7fSBhcyBJSW1wb3J0RGF0YSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFJlbW92ZSBidWlsdC1pbiBzZWN1cml0eSBncm91cHNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXhwb3J0ZWREYXRhLnNlY3VyaXR5R3JvdXBzICYmIChleHBvcnRlZERhdGEuc2VjdXJpdHlHcm91cHMgPSBleHBvcnRlZERhdGEuc2VjdXJpdHlHcm91cHMucmVkdWNlKChyZXN1bHQsIGdyb3VwKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBncm91cC5pZC5pbmRleE9mKFwiR3JvdXBcIikgPT09IC0xICYmIHJlc3VsdC5wdXNoKGdyb3VwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sIFtdKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkTmV3R3JvdXBzKG5ld0dyb3VwcywgZGF0YSkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZE5ld0N1c3RvbU1hcHMobmV3Q3VzdG9tTWFwcywgZGF0YSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBPYmplY3Qua2V5cyhleHBvcnRlZERhdGEpLmZvckVhY2goKGVudGl0eVR5cGU6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGFbZW50aXR5VHlwZV0gPSBtZXJnZVVuaXF1ZUVudGl0aWVzKGRhdGFbZW50aXR5VHlwZV0sIGV4cG9ydGVkRGF0YVtlbnRpdHlUeXBlXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChPYmplY3Qua2V5cyhuZXdEZXBlbmRlbmNpZXMpLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUodGhpcy5yZXNvbHZlRGVwZW5kZW5jaWVzKG5ld0RlcGVuZGVuY2llcywgZGF0YSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGRhdGEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LCByZWplY3QpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sIHJlamVjdCk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPElJbXBvcnREYXRhPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gZ2V0RGF0YShkZXBlbmRlbmNpZXMpLnRoZW4ocmVzb2x2ZSkuY2F0Y2gocmVqZWN0KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhYm9ydEN1cnJlbnRUYXNrICgpIHtcbiAgICAgICAgdGhpcy50b2dnbGVXYWl0aW5nKCk7XG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgJiYgdGhpcy5jdXJyZW50VGFzay5hYm9ydCAmJiB0aGlzLmN1cnJlbnRUYXNrLmFib3J0KCk7XG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgPSBudWxsO1xuICAgIH1cblxuICAgIHByaXZhdGUgdG9nZ2xlRXhwb3J0QnV0dG9uIChpc0Rpc2FibGVkOiBib29sZWFuKSB7XG4gICAgICAgIHRoaXMuZXhwb3J0QnRuLmRpc2FibGVkID0gaXNEaXNhYmxlZDtcbiAgICB9XG5cbiAgICBwcml2YXRlIHJlYWRvbmx5IHRvZ2dsZVdhaXRpbmcgPSAoaXNTdGFydCA9IGZhbHNlKSA9PiB7XG4gICAgICAgIGlmIChpc1N0YXJ0KSB7XG4gICAgICAgICAgICB0aGlzLnRvZ2dsZUV4cG9ydEJ1dHRvbih0cnVlKTtcbiAgICAgICAgICAgIHRoaXMud2FpdGluZy5zdGFydCgoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJhZGRpbkNvbnRhaW5lclwiKSBhcyBIVE1MRWxlbWVudCkucGFyZW50RWxlbWVudCBhcyBIVE1MRWxlbWVudCwgOTk5OSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnRvZ2dsZUV4cG9ydEJ1dHRvbihmYWxzZSk7XG4gICAgICAgICAgICB0aGlzLndhaXRpbmcuc3RvcCgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy9CcmV0dCAtIGRpc3BsYXlzIHRoZSBvdXRwdXQgb24gdGhlIHBhZ2VcbiAgICBwcml2YXRlIHNob3dFbnRpdHlNZXNzYWdlIChibG9jazogSFRNTEVsZW1lbnQsIHF0eTogbnVtYmVyLCBlbnRpdHlOYW1lOiBzdHJpbmcpIHtcbiAgICAgICAgbGV0IGJsb2NrRWwgPSBibG9jay5xdWVyeVNlbGVjdG9yKFwiLmRlc2NyaXB0aW9uXCIpIGFzIEhUTUxFbGVtZW50O1xuICAgICAgICBpZiAocXR5KSB7XG4gICAgICAgICAgICBxdHkgPiAxICYmIChlbnRpdHlOYW1lICs9IFwic1wiKTtcbiAgICAgICAgICAgIGxldCBoYXNJdGVtc01lc3NhZ2VUZW1wbGF0ZSA9IChkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImhhc0l0ZW1zTWVzc2FnZVRlbXBsYXRlXCIpIGFzIEhUTUxFbGVtZW50KS5pbm5lckhUTUw7XG4gICAgICAgICAgICBibG9ja0VsLmlubmVySFRNTCA9IGhhc0l0ZW1zTWVzc2FnZVRlbXBsYXRlLnJlcGxhY2UoXCJ7cXVhbnRpdHl9XCIsIHF0eS50b1N0cmluZygpKS5yZXBsYWNlKFwie2VudGl0eX1cIiwgZW50aXR5TmFtZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBibG9ja0VsLmlubmVySFRNTCA9IGBZb3UgaGF2ZSA8c3BhbiBjbGFzcz1cImJvbGRcIj5ub3QgY29uZmlndXJlZCBhbnkgJHsgZW50aXR5TmFtZSB9czwvc3Bhbj4uYDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgc2hvd1N5c3RlbVNldHRpbmdzTWVzc2FnZSAoYmxvY2s6IEhUTUxFbGVtZW50LCBpc0luY2x1ZGVkOiBib29sZWFuKSB7XG4gICAgICAgIGxldCBibG9ja0VsID0gYmxvY2sucXVlcnlTZWxlY3RvcihcIi5kZXNjcmlwdGlvblwiKSBhcyBIVE1MRWxlbWVudDtcbiAgICAgICAgaWYgKGlzSW5jbHVkZWQpIHtcbiAgICAgICAgICAgIGJsb2NrRWwuaW5uZXJIVE1MID0gXCJZb3UgaGF2ZSBjaG9zZW4gPHNwYW4gY2xhc3M9J2JvbGQnPnRvIGluY2x1ZGU8L3NwYW4+IHN5c3RlbSBzZXR0aW5ncy5cIjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGJsb2NrRWwuaW5uZXJIVE1MID0gXCJZb3UgaGF2ZSBjaG9zZW4gPHNwYW4gY2xhc3M9J2JvbGQnPm5vdCB0byBpbmNsdWRlPC9zcGFuPiBzeXN0ZW0gc2V0dGluZ3MuXCI7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIHNldEFkZGluc1RvTnVsbCgpIHtcbiAgICAgICAgaWYgKCh0aGlzLmRhdGEubWlzYyAhPSBudWxsKSB8fCAodGhpcy5kYXRhLm1pc2MgIT0gdW5kZWZpbmVkKSkge1xuICAgICAgICAgICAgdGhpcy5kYXRhLm1pc2MuYWRkaW5zID0gW107XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvL2luaXRpYWxpemUgYWRkaW5cbiAgICBjb25zdHJ1Y3RvciAoYXBpKSB7XG4gICAgICAgIHRoaXMuYXBpID0gYXBpO1xuICAgICAgICB0aGlzLmdyb3Vwc0J1aWxkZXIgPSBuZXcgR3JvdXBzQnVpbGRlcihhcGkpO1xuICAgICAgICB0aGlzLnNlY3VyaXR5Q2xlYXJhbmNlc0J1aWxkZXIgPSBuZXcgU2VjdXJpdHlDbGVhcmFuY2VzQnVpbGRlcihhcGkpO1xuICAgICAgICB0aGlzLnJlcG9ydHNCdWlsZGVyID0gbmV3IFJlcG9ydHNCdWlsZGVyKGFwaSk7XG4gICAgICAgIHRoaXMucnVsZXNCdWlsZGVyID0gbmV3IFJ1bGVzQnVpbGRlcihhcGkpO1xuICAgICAgICB0aGlzLmRpc3RyaWJ1dGlvbkxpc3RzQnVpbGRlciA9IG5ldyBEaXN0cmlidXRpb25MaXN0c0J1aWxkZXIoYXBpKTtcbiAgICAgICAgdGhpcy5taXNjQnVpbGRlciA9IG5ldyBNaXNjQnVpbGRlcihhcGkpO1xuICAgICAgICAvL1RPRE86IEJyZXR0IC0gbGVmdCBoZXJlIGFzIEkgd2lsbCBiZSBpbnRyb2R1Y2luZyB0aGUgdXNlciBmZXRjaCBzb29uXG4gICAgICAgIC8vIHRoaXMudXNlckJ1aWxkZXIgPSBuZXcgVXNlckJ1aWxkZXIoYXBpKTtcbiAgICAgICAgdGhpcy56b25lQnVpbGRlciA9IG5ldyBab25lQnVpbGRlcihhcGkpO1xuICAgICAgICB0aGlzLndhaXRpbmcgPSBuZXcgV2FpdGluZygpO1xuICAgIH1cblxuICAgIC8vQnJldHQ6IGV4cG9ydHMgdGhlIGRhdGFcbiAgICBleHBvcnREYXRhID0gKCkgPT4ge1xuICAgICAgICB0aGlzLnRvZ2dsZVdhaXRpbmcodHJ1ZSk7XG4gICAgICAgIHJldHVybiB0aGlzLnJlcG9ydHNCdWlsZGVyLmdldERhdGEoKS50aGVuKChyZXBvcnRzRGF0YSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5kYXRhLnJlcG9ydHMgPSByZXBvcnRzRGF0YTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHRoaXMuZGF0YSk7XG4gICAgICAgICAgICBkb3dubG9hZERhdGFBc0ZpbGUoSlNPTi5zdHJpbmdpZnkodGhpcy5kYXRhKSwgXCJleHBvcnQuanNvblwiKTtcbiAgICAgICAgfSkuY2F0Y2goKGUpID0+IHtcbiAgICAgICAgICAgIGFsZXJ0KFwiQ2FuJ3QgZXhwb3J0IGRhdGEuXFxuUGxlYXNlIHRyeSBhZ2FpbiBsYXRlci5cIik7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGUpO1xuICAgICAgICB9KS5maW5hbGx5KCgpID0+IHRoaXMudG9nZ2xlV2FpdGluZygpKTtcbiAgICB9XG5cbiAgICBzYXZlQ2hhbmdlcyA9ICgpID0+IHtcbiAgICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICB9XG5cbiAgICBjaGVja0JveFZhbHVlQ2hhbmdlZCA9ICgpID0+IHtcbiAgICAgICAgdGhpcy50b2dnbGVFeHBvcnRCdXR0b24odHJ1ZSk7XG4gICAgfVxuXG4gICAgYWRkRXZlbnRIYW5kbGVycygpIHtcbiAgICAgICAgdGhpcy5leHBvcnRCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMuZXhwb3J0RGF0YSwgZmFsc2UpO1xuICAgICAgICB0aGlzLnNhdmVCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMuc2F2ZUNoYW5nZXMsIGZhbHNlKTtcbiAgICAgICAgdGhpcy5leHBvcnRBbGxBZGRpbnNDaGVja2JveC5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsIHRoaXMuY2hlY2tCb3hWYWx1ZUNoYW5nZWQsIGZhbHNlKTtcbiAgICAgICAgdGhpcy5leHBvcnRBbGxab25lc0NoZWNrYm94LmFkZEV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgdGhpcy5jaGVja0JveFZhbHVlQ2hhbmdlZCwgZmFsc2UpO1xuICAgICAgICB0aGlzLmV4cG9ydFN5c3RlbVNldHRpbmdzQ2hlY2tib3guYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCB0aGlzLmNoZWNrQm94VmFsdWVDaGFuZ2VkLCBmYWxzZSk7XG4gICAgfVxuXG4gICAgcmVuZGVyICgpIHtcbiAgICAgICAgLy9UT0RPOiBCcmV0dCAtIGxlZnQgaGVyZSBhcyBJIHdpbGwgYmUgaW50cm9kdWNpbmcgdGhlIHVzZXIgZmV0Y2ggc29vblxuICAgICAgICAvLyB0aGlzLmRhdGEudXNlcnMgPSBbXTtcbiAgICAgICAgdGhpcy5kYXRhLnpvbmVzID0gW107XG4gICAgICAgIC8vd2lyZSB1cCB0aGUgZG9tXG4gICAgICAgIGxldCBtYXBNZXNzYWdlVGVtcGxhdGU6IHN0cmluZyA9IChkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm1hcE1lc3NhZ2VUZW1wbGF0ZVwiKSBhcyBIVE1MRWxlbWVudCkuaW5uZXJIVE1MLFxuICAgICAgICAgICAgZ3JvdXBzQmxvY2s6IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJleHBvcnRlZEdyb3Vwc1wiKSBhcyBIVE1MRWxlbWVudCxcbiAgICAgICAgICAgIHNlY3VyaXR5Q2xlYXJhbmNlc0Jsb2NrOiBIVE1MRWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZXhwb3J0ZWRTZWN1cml0eUNsZWFyYW5jZXNcIikgYXMgSFRNTEVsZW1lbnQsXG4gICAgICAgICAgICBydWxlc0Jsb2NrOiBIVE1MRWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZXhwb3J0ZWRSdWxlc1wiKSBhcyBIVE1MRWxlbWVudCxcbiAgICAgICAgICAgIHJlcG9ydHNCbG9jazogSFRNTEVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImV4cG9ydGVkUmVwb3J0c1wiKSBhcyBIVE1MRWxlbWVudCxcbiAgICAgICAgICAgIGRhc2hib2FyZHNCbG9jazogSFRNTEVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImV4cG9ydGVkRGFzaGJvYXJkc1wiKSBhcyBIVE1MRWxlbWVudCxcbiAgICAgICAgICAgIGFkZGluc0Jsb2NrOiBIVE1MRWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZXhwb3J0ZWRBZGRpbnNcIikgYXMgSFRNTEVsZW1lbnQsXG4gICAgICAgICAgICBtYXBCbG9ja0Rlc2NyaXB0aW9uOiBIVE1MRWxlbWVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjZXhwb3J0ZWRNYXAgLmRlc2NyaXB0aW9uXCIpIGFzIEhUTUxFbGVtZW50LFxuICAgICAgICAgICAgLy8gdXNlcnNCbG9jazogSFRNTEVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImV4cG9ydGVkVXNlcnNcIiksXG4gICAgICAgICAgICB6b25lc0Jsb2NrOiBIVE1MRWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZXhwb3J0ZWRab25lc1wiKSBhcyBIVE1MRWxlbWVudCxcbiAgICAgICAgICAgIHN5c3RlbVNldHRpbmdzQmxvY2s6IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJleHBvcnRTeXN0ZW1TZXR0aW5nc1wiKSBhcyBIVE1MRWxlbWVudDtcbiAgICAgICAgdGhpcy50b2dnbGVXYWl0aW5nKHRydWUpO1xuICAgICAgICByZXR1cm4gdG9nZXRoZXIoW1xuICAgICAgICAgICAgLy9sb2FkcyB0aGUgZ3JvdXBzLiBUaGlzIGlzIHdoZXJlIHVzZXJzIGFyZSBhZGRlZCBpZiB0aGV5IGFyZSBsaW5rZWQgdG8gYSBncm91cFxuICAgICAgICAgICAgdGhpcy5ncm91cHNCdWlsZGVyLmZldGNoKCksXG4gICAgICAgICAgICAvL2xvYWRzIHRoZSBzZWN1cml0eSBncm91cHMgKHNlY3VyaXR5IGNsZWFyYW5jZSBpbiB1c2VyIGFkbWluIGluIE15RylcbiAgICAgICAgICAgIHRoaXMuc2VjdXJpdHlDbGVhcmFuY2VzQnVpbGRlci5mZXRjaCgpLFxuICAgICAgICAgICAgLy9yZXBvcnQgbG9hZGVyLi4uc2VlbXMgb2Jzb2xldGUgdG8gbWVcbiAgICAgICAgICAgIHRoaXMucmVwb3J0c0J1aWxkZXIuZmV0Y2goKSxcbiAgICAgICAgICAgIHRoaXMucnVsZXNCdWlsZGVyLmZldGNoKCksXG4gICAgICAgICAgICB0aGlzLmRpc3RyaWJ1dGlvbkxpc3RzQnVpbGRlci5mZXRjaCgpLFxuICAgICAgICAgICAgLy9taXNjID0gc3lzdGVtIHNldHRpbmdzXG4gICAgICAgICAgICB0aGlzLm1pc2NCdWlsZGVyLmZldGNoKHRoaXMuZXhwb3J0U3lzdGVtU2V0dGluZ3NDaGVja2JveC5jaGVja2VkKSxcbiAgICAgICAgICAgIC8vVE9ETzogQnJldHQgLSBsZWZ0IGhlcmUgYXMgSSB3aWxsIGJlIGludHJvZHVjaW5nIHRoZSB1c2VyIGZldGNoIHNvb25cbiAgICAgICAgICAgIC8vIHRoaXMudXNlckJ1aWxkZXIuZmV0Y2goKSxcbiAgICAgICAgICAgIHRoaXMuem9uZUJ1aWxkZXIuZmV0Y2goKVxuICAgICAgICBdKS50aGVuKChyZXN1bHRzKSA9PiB7XG4gICAgICAgICAgICBsZXQgcmVwb3J0c0RlcGVuZGVuY2llczogSURlcGVuZGVuY2llcyxcbiAgICAgICAgICAgICAgICBydWxlc0RlcGVuZGVuY2llczogSURlcGVuZGVuY2llcyxcbiAgICAgICAgICAgICAgICBkaXN0cmlidXRpb25MaXN0c0RlcGVuZGVuY2llczogSURlcGVuZGVuY2llcyxcbiAgICAgICAgICAgICAgICBkZXBlbmRlbmNpZXM6IElEZXBlbmRlbmNpZXMsXG4gICAgICAgICAgICAgICAgY3VzdG9tTWFwO1xuICAgICAgICAgICAgdGhpcy5kYXRhLmdyb3VwcyA9IHJlc3VsdHNbMF07XG4gICAgICAgICAgICB0aGlzLmRhdGEuc2VjdXJpdHlHcm91cHMgPSByZXN1bHRzWzFdO1xuICAgICAgICAgICAgdGhpcy5kYXRhLnJlcG9ydHMgPSByZXN1bHRzWzJdO1xuICAgICAgICAgICAgdGhpcy5kYXRhLnJ1bGVzID0gcmVzdWx0c1szXTtcbiAgICAgICAgICAgIHRoaXMuZGF0YS5kaXN0cmlidXRpb25MaXN0cyA9IHRoaXMuZGlzdHJpYnV0aW9uTGlzdHNCdWlsZGVyLmdldFJ1bGVzRGlzdHJpYnV0aW9uTGlzdHModGhpcy5kYXRhLnJ1bGVzLm1hcChydWxlID0+IHJ1bGUuaWQpKTtcbiAgICAgICAgICAgIHRoaXMuZGF0YS5taXNjID0gcmVzdWx0c1s1XTtcbiAgICAgICAgICAgIGxldCBnZXREZXBlbmRlbmNpZXMgPSAoZW50aXRpZXM6IGFueVtdLCBlbnRpdHlUeXBlOiBURW50aXR5VHlwZSkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBlbnRpdGllcy5yZWR1Y2UoKHJlcywgZW50aXR5KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGxldCBlbnRpdHlEZXAgPSB0aGlzLmdldEVudGl0eURlcGVuZGVuY2llcyhlbnRpdHksIGVudGl0eVR5cGUpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5jb21iaW5lRGVwZW5kZW5jaWVzKHJlcywgZW50aXR5RGVwKTtcbiAgICAgICAgICAgICAgICB9LCB7fSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgbGV0IHpvbmVEZXBlbmRlbmNpZXMgPSB7fTtcbiAgICAgICAgICAgIGlmKHRoaXMuZXhwb3J0QWxsWm9uZXNDaGVja2JveC5jaGVja2VkPT10cnVlKXtcbiAgICAgICAgICAgICAgICBpZihyZXN1bHRzWzZdKXtcbiAgICAgICAgICAgICAgICAgICAgLy9zZXRzIGV4cG9ydGVkIHpvbmVzIHRvIGFsbCBkYXRhYmFzZSB6b25lc1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmRhdGEuem9uZXMgPSByZXN1bHRzWzZdO1xuICAgICAgICAgICAgICAgICAgICB6b25lRGVwZW5kZW5jaWVzID0gZ2V0RGVwZW5kZW5jaWVzKHJlc3VsdHNbNl0sIFwiem9uZXNcIik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYodGhpcy5leHBvcnRBbGxBZGRpbnNDaGVja2JveC5jaGVja2VkPT1mYWxzZSl7XG4gICAgICAgICAgICAgICAgLy9zZXRzIGV4cG9ydGVkIGFkZGlucyBlcXVhbCB0byBub25lL2VtcHR5IGFycmF5XG4gICAgICAgICAgICAgICAgdGhpcy5zZXRBZGRpbnNUb051bGwoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGN1c3RvbU1hcCA9IHRoaXMuZGF0YS5taXNjICYmIHRoaXMubWlzY0J1aWxkZXIuZ2V0TWFwUHJvdmlkZXJEYXRhKHRoaXMuZGF0YS5taXNjLm1hcFByb3ZpZGVyLnZhbHVlKTtcbiAgICAgICAgICAgIGN1c3RvbU1hcCAmJiB0aGlzLmRhdGEuY3VzdG9tTWFwcy5wdXNoKGN1c3RvbU1hcCk7XG4gICAgICAgICAgICByZXBvcnRzRGVwZW5kZW5jaWVzID0gdGhpcy5yZXBvcnRzQnVpbGRlci5nZXREZXBlbmRlbmNpZXModGhpcy5kYXRhLnJlcG9ydHMpO1xuICAgICAgICAgICAgcnVsZXNEZXBlbmRlbmNpZXMgPSB0aGlzLnJ1bGVzQnVpbGRlci5nZXREZXBlbmRlbmNpZXModGhpcy5kYXRhLnJ1bGVzKTtcbiAgICAgICAgICAgIGRpc3RyaWJ1dGlvbkxpc3RzRGVwZW5kZW5jaWVzID0gdGhpcy5kaXN0cmlidXRpb25MaXN0c0J1aWxkZXIuZ2V0RGVwZW5kZW5jaWVzKHRoaXMuZGF0YS5kaXN0cmlidXRpb25MaXN0cyk7XG4gICAgICAgICAgICBkZXBlbmRlbmNpZXMgPSB0aGlzLmNvbWJpbmVEZXBlbmRlbmNpZXMoem9uZURlcGVuZGVuY2llcywgcmVwb3J0c0RlcGVuZGVuY2llcywgcnVsZXNEZXBlbmRlbmNpZXMsIGRpc3RyaWJ1dGlvbkxpc3RzRGVwZW5kZW5jaWVzKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnJlc29sdmVEZXBlbmRlbmNpZXMoZGVwZW5kZW5jaWVzLCB0aGlzLmRhdGEpO1xuICAgICAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIGxldCBtYXBQcm92aWRlciA9IHRoaXMuZGF0YS5taXNjICYmIHRoaXMubWlzY0J1aWxkZXIuZ2V0TWFwUHJvdmlkZXJOYW1lKHRoaXMuZGF0YS5taXNjLm1hcFByb3ZpZGVyLnZhbHVlKTtcbiAgICAgICAgICAgIHRoaXMuc2hvd0VudGl0eU1lc3NhZ2UoZ3JvdXBzQmxvY2ssIHRoaXMuZGF0YS5ncm91cHMubGVuZ3RoIC0gMSwgXCJncm91cFwiKTtcbiAgICAgICAgICAgIHRoaXMuc2hvd0VudGl0eU1lc3NhZ2Uoc2VjdXJpdHlDbGVhcmFuY2VzQmxvY2ssIHRoaXMuZGF0YS5zZWN1cml0eUdyb3Vwcy5sZW5ndGgsIFwic2VjdXJpdHkgY2xlYXJhbmNlXCIpO1xuICAgICAgICAgICAgdGhpcy5zaG93RW50aXR5TWVzc2FnZShydWxlc0Jsb2NrLCB0aGlzLmRhdGEucnVsZXMubGVuZ3RoLCBcInJ1bGVcIik7XG4gICAgICAgICAgICB0aGlzLnNob3dFbnRpdHlNZXNzYWdlKHJlcG9ydHNCbG9jaywgdGhpcy5yZXBvcnRzQnVpbGRlci5nZXRDdXN0b21pemVkUmVwb3J0c1F0eSgpLCBcInJlcG9ydFwiKTtcbiAgICAgICAgICAgIHRoaXMuc2hvd0VudGl0eU1lc3NhZ2UoZGFzaGJvYXJkc0Jsb2NrLCB0aGlzLnJlcG9ydHNCdWlsZGVyLmdldERhc2hib2FyZHNRdHkoKSwgXCJkYXNoYm9hcmRcIik7XG4gICAgICAgICAgICBpZiAobWFwUHJvdmlkZXIpIHtcbiAgICAgICAgICAgICAgICBtYXBCbG9ja0Rlc2NyaXB0aW9uLmlubmVySFRNTCA9IG1hcE1lc3NhZ2VUZW1wbGF0ZS5yZXBsYWNlKFwie21hcFByb3ZpZGVyfVwiLCBtYXBQcm92aWRlcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnNob3dFbnRpdHlNZXNzYWdlKGFkZGluc0Jsb2NrLCB0aGlzLmRhdGEubWlzYz8uYWRkaW5zPy5sZW5ndGggfHwgMCwgXCJhZGRpblwiKTtcbiAgICAgICAgICAgIC8vIHRoaXMuc2hvd0VudGl0eU1lc3NhZ2UodXNlcnNCbG9jaywgdGhpcy5kYXRhLnVzZXJzLmxlbmd0aCwgXCJ1c2VyXCIpO1xuICAgICAgICAgICAgdGhpcy5zaG93RW50aXR5TWVzc2FnZSh6b25lc0Jsb2NrLCB0aGlzLmRhdGEuem9uZXMubGVuZ3RoLCBcInpvbmVcIik7XG4gICAgICAgICAgICB0aGlzLnNob3dTeXN0ZW1TZXR0aW5nc01lc3NhZ2Uoc3lzdGVtU2V0dGluZ3NCbG9jaywgdGhpcy5leHBvcnRTeXN0ZW1TZXR0aW5nc0NoZWNrYm94LmNoZWNrZWQpO1xuICAgICAgICAgICAgLy90aGlzIGRpc3BsYXlzIGFsbCB0aGUgZGF0YS9vYmplY3RzIGluIHRoZSBjb25zb2xlXG4gICAgICAgICAgICBjb25zb2xlLmxvZyh0aGlzLmRhdGEpO1xuICAgICAgICB9KS5jYXRjaCgoZSkgPT4ge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlKTtcbiAgICAgICAgICAgIGFsZXJ0KFwiQ2FuJ3QgZ2V0IGNvbmZpZyB0byBleHBvcnRcIik7XG4gICAgICAgIH0pLmZpbmFsbHkoKCkgPT4gdGhpcy50b2dnbGVXYWl0aW5nKCkpO1xuICAgIH1cblxuICAgIHVubG9hZCAoKSB7XG4gICAgICAgIHRoaXMuYWJvcnRDdXJyZW50VGFzaygpO1xuICAgICAgICB0aGlzLmdyb3Vwc0J1aWxkZXIudW5sb2FkKCk7XG4gICAgICAgIHRoaXMuc2VjdXJpdHlDbGVhcmFuY2VzQnVpbGRlci51bmxvYWQoKTtcbiAgICAgICAgdGhpcy5yZXBvcnRzQnVpbGRlci51bmxvYWQoKTtcbiAgICAgICAgdGhpcy5ydWxlc0J1aWxkZXIudW5sb2FkKCk7XG4gICAgICAgIHRoaXMuZGlzdHJpYnV0aW9uTGlzdHNCdWlsZGVyLnVubG9hZCgpO1xuICAgICAgICB0aGlzLm1pc2NCdWlsZGVyLnVubG9hZCgpO1xuICAgICAgICB0aGlzLmV4cG9ydEJ0bi5yZW1vdmVFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5leHBvcnREYXRhLCBmYWxzZSk7XG4gICAgICAgIHRoaXMuc2F2ZUJ0bi5yZW1vdmVFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5zYXZlQ2hhbmdlcywgZmFsc2UpO1xuICAgICAgICB0aGlzLmV4cG9ydEFsbEFkZGluc0NoZWNrYm94LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgdGhpcy5jaGVja0JveFZhbHVlQ2hhbmdlZCwgZmFsc2UpO1xuICAgICAgICB0aGlzLmV4cG9ydEFsbFpvbmVzQ2hlY2tib3gucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCB0aGlzLmNoZWNrQm94VmFsdWVDaGFuZ2VkLCBmYWxzZSk7XG4gICAgICAgIHRoaXMuZXhwb3J0U3lzdGVtU2V0dGluZ3NDaGVja2JveC5yZW1vdmVFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsIHRoaXMuY2hlY2tCb3hWYWx1ZUNoYW5nZWQsIGZhbHNlKTtcbiAgICB9XG59XG5cbmdlb3RhYi5hZGRpbi5yZWdpc3RyYXRpb25Db25maWcgPSBmdW5jdGlvbiAoKSB7XG4gICAgbGV0IGFkZGluOiBBZGRpbjtcblxuICAgIHJldHVybiB7XG4gICAgICAgIGluaXRpYWxpemU6IChhcGksIHN0YXRlLCBjYWxsYmFjaykgPT4ge1xuICAgICAgICAgICAgYWRkaW4gPSBuZXcgQWRkaW4oYXBpKTtcbiAgICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgIH0sXG4gICAgICAgIGZvY3VzOiAoKSA9PiB7XG4gICAgICAgICAgICBhZGRpbi5yZW5kZXIoKTtcbiAgICAgICAgICAgIGFkZGluLmFkZEV2ZW50SGFuZGxlcnMoKTtcbiAgICAgICAgfSxcbiAgICAgICAgYmx1cjogKCkgPT4ge1xuICAgICAgICAgICAgYWRkaW4udW5sb2FkKCk7XG4gICAgICAgIH1cbiAgICB9O1xufTsiLCJpbXBvcnQge2VudGl0eVRvRGljdGlvbmFyeSwgbWVyZ2VVbmlxdWV9IGZyb20gXCIuL3V0aWxzXCI7XG5cbi8vQSBkaXN0cmlidXRpb24gbGlzdCBsaW5rcyBhIHNldCBvZiBSdWxlKHMpIHRvIGEgc2V0IG9mIFJlY2lwaWVudChzKS4gV2hlbiBhIFJ1bGUgaXMgdmlvbGF0ZWQgZWFjaCByZWxhdGVkIFJlY2lwaWVudCB3aWxsIHJlY2VpdmUgYSBub3RpZmljYXRpb24gb2YgdGhlIGtpbmQgZGVmaW5lZCBieSBpdHMgUmVjaXBpZW50VHlwZS5cbmludGVyZmFjZSBJRGlzdHJpYnV0aW9uTGlzdCBleHRlbmRzIElOYW1lZEVudGl0eSB7XG4gICAgcmVjaXBpZW50czogYW55W107XG4gICAgcnVsZXM6IGFueVtdO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIElEaXN0cmlidXRpb25MaXN0RGVwZW5kZW5jaWVzIHtcbiAgICBydWxlczogYW55W107XG4gICAgdXNlcnM6IGFueVtdO1xuICAgIG5vdGlmaWNhdGlvblRlbXBsYXRlczogYW55W107XG4gICAgZ3JvdXBzOiBhbnlbXTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgRGlzdHJpYnV0aW9uTGlzdHNCdWlsZGVyIHtcbiAgICBwcml2YXRlIGFwaTtcbiAgICBwcml2YXRlIGN1cnJlbnRUYXNrO1xuICAgIHByaXZhdGUgZGlzdHJpYnV0aW9uTGlzdHM6IFJlY29yZDxzdHJpbmcsIElEaXN0cmlidXRpb25MaXN0PjtcbiAgICBwcml2YXRlIG5vdGlmaWNhdGlvblRlbXBsYXRlcztcblxuICAgIGNvbnN0cnVjdG9yKGFwaSkge1xuICAgICAgICB0aGlzLmFwaSA9IGFwaTtcbiAgICB9XG5cbiAgICAvL0EgZGlzdHJpYnV0aW9uIGxpc3QgbGlua3MgYSBzZXQgb2YgUnVsZShzKSB0byBhIHNldCBvZiBSZWNpcGllbnQocykuIFdoZW4gYSBSdWxlIGlzIHZpb2xhdGVkIGVhY2ggcmVsYXRlZCBSZWNpcGllbnQgd2lsbCByZWNlaXZlIGEgbm90aWZpY2F0aW9uIG9mIHRoZSBraW5kIGRlZmluZWQgYnkgaXRzIFJlY2lwaWVudFR5cGUuXG4gICAgcHJpdmF0ZSBnZXREaXN0cmlidXRpb25MaXN0c0RhdGEgKCk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICB0aGlzLmFwaS5tdWx0aUNhbGwoW1xuICAgICAgICAgICAgICAgIFtcIkdldFwiLCB7XG4gICAgICAgICAgICAgICAgICAgIFwidHlwZU5hbWVcIjogXCJEaXN0cmlidXRpb25MaXN0XCIsXG4gICAgICAgICAgICAgICAgfV0sXG4gICAgICAgICAgICAgICAgW1wiR2V0Tm90aWZpY2F0aW9uV2ViUmVxdWVzdFRlbXBsYXRlc1wiLCB7fV0sXG4gICAgICAgICAgICAgICAgW1wiR2V0Tm90aWZpY2F0aW9uRW1haWxUZW1wbGF0ZXNcIiwge31dLFxuICAgICAgICAgICAgICAgIFtcIkdldE5vdGlmaWNhdGlvblRleHRUZW1wbGF0ZXNcIiwge31dXG4gICAgICAgICAgICBdLCByZXNvbHZlLCByZWplY3QpO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgcHJpdmF0ZSBhYm9ydEN1cnJlbnRUYXNrICgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5jdXJyZW50VGFzayAmJiB0aGlzLmN1cnJlbnRUYXNrLmFib3J0ICYmIHRoaXMuY3VycmVudFRhc2suYWJvcnQoKTtcbiAgICAgICAgdGhpcy5jdXJyZW50VGFzayA9IG51bGw7XG4gICAgfTtcblxuICAgIHB1YmxpYyBnZXREZXBlbmRlbmNpZXMgKGRpc3RyaWJ1dGlvbkxpc3RzKTogSURpc3RyaWJ1dGlvbkxpc3REZXBlbmRlbmNpZXMge1xuICAgICAgICBsZXQgZGVwZW5kZW5jaWVzOiBJRGlzdHJpYnV0aW9uTGlzdERlcGVuZGVuY2llcyA9IHtcbiAgICAgICAgICAgICAgICBydWxlczogW10sXG4gICAgICAgICAgICAgICAgdXNlcnM6IFtdLFxuICAgICAgICAgICAgICAgIGdyb3VwczogW10sXG4gICAgICAgICAgICAgICAgbm90aWZpY2F0aW9uVGVtcGxhdGVzOiBbXVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHByb2Nlc3NEZXBlbmRlbmNpZXMgPSAocmVjaXBpZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgbGV0IGlkOiBzdHJpbmcgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgbGV0IHR5cGU6IHN0cmluZyB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICBsZXQgdXNlcklkID0gcmVjaXBpZW50LnVzZXIuaWQ7XG4gICAgICAgICAgICAgICAgdXNlcklkICYmIGRlcGVuZGVuY2llcy51c2Vycy5pbmRleE9mKHVzZXJJZCkgPT09IC0xICYmIGRlcGVuZGVuY2llcy51c2Vycy5wdXNoKHVzZXJJZCk7XG4gICAgICAgICAgICAgICAgc3dpdGNoIChyZWNpcGllbnQucmVjaXBpZW50VHlwZSkge1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiRW1haWxcIjpcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIkxvZ1BvcHVwXCI6XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJMb2dVcmdlbnRQb3B1cFwiOlxuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiTG9nT25seVwiOlxuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiVGV4dE1lc3NhZ2VcIjpcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIlRleHRUb1NwZWVjaEFsbG93RGVsYXlcIjpcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIldlYlJlcXVlc3RcIjpcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIlRleHRUb1NwZWVjaFwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgaWQgPSByZWNpcGllbnQubm90aWZpY2F0aW9uQmluYXJ5RmlsZSAmJiByZWNpcGllbnQubm90aWZpY2F0aW9uQmluYXJ5RmlsZS5pZDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGUgPSBcIm5vdGlmaWNhdGlvblRlbXBsYXRlc1wiO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJBc3NpZ25Ub0dyb3VwXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBpZCA9IHJlY2lwaWVudC5ncm91cCAmJiByZWNpcGllbnQuZ3JvdXAuaWQ7XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlID0gXCJncm91cHNcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZCAmJiB0eXBlICYmIGRlcGVuZGVuY2llc1t0eXBlXS5pbmRleE9mKGlkKSA9PT0gLTEgJiYgZGVwZW5kZW5jaWVzW3R5cGVdLnB1c2goaWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNoZWNrUmVjaXBpZW50cyA9IChyZWNpcGllbnRzLCBkZXBlbmRlbmNpZXM6IElEaXN0cmlidXRpb25MaXN0RGVwZW5kZW5jaWVzKTogSURpc3RyaWJ1dGlvbkxpc3REZXBlbmRlbmNpZXMgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiByZWNpcGllbnRzLnJlZHVjZSgoZGVwZW5kZW5jaWVzLCByZWNpcGllbnQpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcHJvY2Vzc0RlcGVuZGVuY2llcyhyZWNpcGllbnQpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZGVwZW5kZW5jaWVzO1xuICAgICAgICAgICAgICAgIH0sIGRlcGVuZGVuY2llcyk7XG4gICAgICAgICAgICB9O1xuICAgICAgICByZXR1cm4gZGlzdHJpYnV0aW9uTGlzdHMucmVkdWNlKChkZXBlbmRlbmNpZXM6IElEaXN0cmlidXRpb25MaXN0RGVwZW5kZW5jaWVzLCBkaXN0cmlidXRpb25MaXN0OiBJRGlzdHJpYnV0aW9uTGlzdCkgPT4ge1xuICAgICAgICAgICAgZGVwZW5kZW5jaWVzLnJ1bGVzID0gbWVyZ2VVbmlxdWUoZGVwZW5kZW5jaWVzLnJ1bGVzLCBkaXN0cmlidXRpb25MaXN0LnJ1bGVzLm1hcChydWxlID0+IHJ1bGUuaWQpKTtcbiAgICAgICAgICAgIGRlcGVuZGVuY2llcyA9IGNoZWNrUmVjaXBpZW50cyhkaXN0cmlidXRpb25MaXN0LnJlY2lwaWVudHMsIGRlcGVuZGVuY2llcyk7XG4gICAgICAgICAgICByZXR1cm4gZGVwZW5kZW5jaWVzO1xuICAgICAgICB9LCBkZXBlbmRlbmNpZXMpO1xuICAgIH07XG5cbiAgICBwdWJsaWMgZmV0Y2goKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgdGhpcy5hYm9ydEN1cnJlbnRUYXNrKCk7XG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgPSB0aGlzLmdldERpc3RyaWJ1dGlvbkxpc3RzRGF0YSgpXG4gICAgICAgICAgICAudGhlbigoW2Rpc3RyaWJ1dGlvbkxpc3RzLCB3ZWJUZW1wbGF0ZXMsIGVtYWlsVGVtcGxhdGVzLCB0ZXh0VGVtcGxhdGVzXSkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuZGlzdHJpYnV0aW9uTGlzdHMgPSBlbnRpdHlUb0RpY3Rpb25hcnkoZGlzdHJpYnV0aW9uTGlzdHMpO1xuICAgICAgICAgICAgICAgIHRoaXMubm90aWZpY2F0aW9uVGVtcGxhdGVzID0gZW50aXR5VG9EaWN0aW9uYXJ5KHdlYlRlbXBsYXRlcy5jb25jYXQoZW1haWxUZW1wbGF0ZXMpLmNvbmNhdCh0ZXh0VGVtcGxhdGVzKSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZGlzdHJpYnV0aW9uTGlzdHM7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmNhdGNoKGNvbnNvbGUuZXJyb3IpXG4gICAgICAgICAgICAuZmluYWxseSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50VGFzayA9IG51bGw7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHRoaXMuY3VycmVudFRhc2s7XG4gICAgfTtcblxuICAgIHB1YmxpYyBnZXROb3RpZmljYXRpb25UZW1wbGF0ZURhdGEgKHRlbXBsYXRlSWQ6IHN0cmluZyk6IGFueSB7XG4gICAgICAgIHJldHVybiB0aGlzLm5vdGlmaWNhdGlvblRlbXBsYXRlc1t0ZW1wbGF0ZUlkXTtcbiAgICB9O1xuXG4gICAgcHVibGljIGdldFJ1bGVzRGlzdHJpYnV0aW9uTGlzdHMgKHJ1bGVzSWRzOiBzdHJpbmdbXSk6IElEaXN0cmlidXRpb25MaXN0W10ge1xuICAgICAgICByZXR1cm4gT2JqZWN0LmtleXModGhpcy5kaXN0cmlidXRpb25MaXN0cykucmVkdWNlKChyZXM6IElEaXN0cmlidXRpb25MaXN0W10sIGlkKSA9PiB7XG4gICAgICAgICAgICBsZXQgbGlzdCA9IHRoaXMuZGlzdHJpYnV0aW9uTGlzdHNbaWRdO1xuICAgICAgICAgICAgbGlzdC5ydWxlcy5zb21lKGxpc3RSdWxlID0+IHJ1bGVzSWRzLmluZGV4T2YobGlzdFJ1bGUuaWQpID4gLTEpICYmIHJlcy5wdXNoKGxpc3QpO1xuICAgICAgICAgICAgcmV0dXJuIHJlcztcbiAgICAgICAgfSwgW10pO1xuICAgIH07XG5cbiAgICBwdWJsaWMgdW5sb2FkICgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5hYm9ydEN1cnJlbnRUYXNrKCk7XG4gICAgfTtcbn0iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vYmx1ZWJpcmQuZC50c1wiLz5cbmltcG9ydCB7IGVudGl0eVRvRGljdGlvbmFyeSwgZXh0ZW5kLCBJRW50aXR5IH0gZnJvbSBcIi4vdXRpbHNcIjtcblxuaW50ZXJmYWNlIENvbG9yIHtcbiAgICByOiBudW1iZXI7XG4gICAgZzogbnVtYmVyO1xuICAgIGI6IG51bWJlcjtcbiAgICBhOiBudW1iZXI7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSUdyb3VwIGV4dGVuZHMgSUlkRW50aXR5IHtcbiAgICBuYW1lPzogc3RyaW5nO1xuICAgIGNvbG9yPzogQ29sb3I7XG4gICAgcGFyZW50PzogSUdyb3VwO1xuICAgIGNoaWxkcmVuPzogSUdyb3VwW107XG4gICAgdXNlcj86IGFueTtcbn1cblxuaW50ZXJmYWNlIElOZXdHcm91cCBleHRlbmRzIE9taXQ8SUdyb3VwLCBcImlkXCI+IHtcbiAgICBpZDogbnVsbDtcbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgR3JvdXBzQnVpbGRlciB7XG4gICAgcHJvdGVjdGVkIGFwaTtcbiAgICBwcm90ZWN0ZWQgY3VycmVudFRhc2s7XG4gICAgcHJvdGVjdGVkIGdyb3VwczogSUdyb3VwW107XG4gICAgcHJvdGVjdGVkIHRyZWU6IElHcm91cFtdO1xuICAgIHByb3RlY3RlZCBjdXJyZW50VHJlZTtcblxuICAgIHByaXZhdGUgdXNlcnM6IGFueTtcbiAgICBwcml2YXRlIGN1cnJlbnRVc2VyTmFtZTogc3RyaW5nO1xuXG4gICAgY29uc3RydWN0b3IoYXBpOiBhbnkpIHtcbiAgICAgICAgdGhpcy5hcGkgPSBhcGk7XG4gICAgfVxuXG4gICAgLy9nZXRzIHRoZSBncm91cHMgYXNzb2NpYXRlZCB3aXRoIHRoZSBjdXJyZW50IHVzZXJcbiAgICBwcml2YXRlIGdldEdyb3VwcyAoKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIHRoaXMuYXBpLmdldFNlc3Npb24oKHNlc3Npb25EYXRhKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50VXNlck5hbWUgPSBzZXNzaW9uRGF0YS51c2VyTmFtZTtcbiAgICAgICAgICAgICAgICB0aGlzLmFwaS5tdWx0aUNhbGwoW1xuICAgICAgICAgICAgICAgICAgICBbXCJHZXRcIiwge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZU5hbWU6IFwiR3JvdXBcIlxuICAgICAgICAgICAgICAgICAgICB9XSxcbiAgICAgICAgICAgICAgICAgICAgW1wiR2V0XCIsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGVOYW1lOiBcIlVzZXJcIlxuICAgICAgICAgICAgICAgICAgICB9XVxuICAgICAgICAgICAgICAgIF0sIHJlc29sdmUsIHJlamVjdCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIHByaXZhdGUgZmluZENoaWxkIChjaGlsZElkOiBzdHJpbmcsIGN1cnJlbnRJdGVtOiBJTmV3R3JvdXAgfCBJR3JvdXAsIG9uQWxsTGV2ZWxzOiBib29sZWFuID0gZmFsc2UpOiBJR3JvdXAgfCBudWxsIHtcbiAgICAgICAgbGV0IGZvdW5kQ2hpbGQ6IElHcm91cCB8IG51bGwgPSBudWxsLFxuICAgICAgICAgICAgY2hpbGRyZW4gPSBjdXJyZW50SXRlbS5jaGlsZHJlbjtcbiAgICAgICAgaWYgKCFjaGlsZElkIHx8ICFjaGlsZHJlbiB8fCAhY2hpbGRyZW4ubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGNoaWxkcmVuLnNvbWUoY2hpbGQgPT4ge1xuICAgICAgICAgICAgaWYgKGNoaWxkLmlkID09PSBjaGlsZElkKSB7XG4gICAgICAgICAgICAgICAgZm91bmRDaGlsZCA9IGNoaWxkO1xuICAgICAgICAgICAgICAgIHJldHVybiBmb3VuZENoaWxkO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAob25BbGxMZXZlbHMpIHtcbiAgICAgICAgICAgICAgICAgICAgZm91bmRDaGlsZCA9IHRoaXMuZmluZENoaWxkKGNoaWxkSWQsIGNoaWxkLCBvbkFsbExldmVscyk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmb3VuZENoaWxkO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBmb3VuZENoaWxkO1xuICAgIH07XG5cbiAgICBwcml2YXRlIGdldFVzZXJCeVByaXZhdGVHcm91cElkIChncm91cElkOiBzdHJpbmcpOiBhbnkge1xuICAgICAgICBsZXQgb3V0cHV0VXNlciA9IG51bGwsXG4gICAgICAgICAgICB1c2VySGFzUHJpdmF0ZUdyb3VwID0gKHVzZXIsIGdyb3VwSWQpOiBib29sZWFuID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdXNlci5wcml2YXRlVXNlckdyb3Vwcy5zb21lKGdyb3VwID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGdyb3VwLmlkID09PSBncm91cElkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgdGhpcy51c2Vycy5zb21lKHVzZXIgPT4ge1xuICAgICAgICAgICAgaWYgKHVzZXJIYXNQcml2YXRlR3JvdXAodXNlciwgZ3JvdXBJZCkpIHtcbiAgICAgICAgICAgICAgICBvdXRwdXRVc2VyID0gdXNlcjtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBvdXRwdXRVc2VyO1xuICAgIH07XG5cbiAgICBwcml2YXRlIGdldFByaXZhdGVHcm91cERhdGEgKGdyb3VwSWQ6IHN0cmluZykge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgaWQ6IGdyb3VwSWQsXG4gICAgICAgICAgICB1c2VyOiB0aGlzLmdldFVzZXJCeVByaXZhdGVHcm91cElkKGdyb3VwSWQpLFxuICAgICAgICAgICAgY2hpbGRyZW46IFtdLFxuICAgICAgICAgICAgbmFtZTogXCJQcml2YXRlVXNlckdyb3VwTmFtZVwiLFxuICAgICAgICAgICAgcGFyZW50OiB7XG4gICAgICAgICAgICAgICAgaWQ6IFwiR3JvdXBQcml2YXRlVXNlcklkXCIsXG4gICAgICAgICAgICAgICAgY2hpbGRyZW46IFt7IGlkOiBncm91cElkIH1dXG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfTtcblxuICAgIHByb3RlY3RlZCBjcmVhdGVHcm91cHNUcmVlIChncm91cHM6IElHcm91cFtdKTogYW55W10ge1xuICAgICAgICBsZXQgbm9kZUxvb2t1cCxcbiAgICAgICAgICAgIHRyYXZlcnNlQ2hpbGRyZW4gPSBmdW5jdGlvbiAobm9kZSkge1xuICAgICAgICAgICAgICAgIGxldCBjaGlsZHJlbjogSUdyb3VwW10sXG4gICAgICAgICAgICAgICAgICAgIGlkOiBzdHJpbmc7XG5cbiAgICAgICAgICAgICAgICBjaGlsZHJlbiA9IG5vZGUuY2hpbGRyZW47XG5cbiAgICAgICAgICAgICAgICBpZiAoY2hpbGRyZW4pIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDAsIGlpID0gY2hpbGRyZW4ubGVuZ3RoOyBpIDwgaWk7IGkgKz0gMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWQgPSBjaGlsZHJlbltpXS5pZDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG5vZGVMb29rdXBbaWRdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZS5jaGlsZHJlbltpXSA9IG5vZGVMb29rdXBbaWRdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGUuY2hpbGRyZW5baV0ucGFyZW50ID0gbm9kZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgbm9kZUxvb2t1cFtpZF07XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB0cmF2ZXJzZUNoaWxkcmVuKG5vZGUuY2hpbGRyZW5baV0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcblxuICAgICAgICBub2RlTG9va3VwID0gZW50aXR5VG9EaWN0aW9uYXJ5KGdyb3VwcywgZW50aXR5ID0+IHtcbiAgICAgICAgICAgIGxldCBuZXdFbnRpdHkgPSBleHRlbmQoe30sIGVudGl0eSk7XG4gICAgICAgICAgICBpZiAobmV3RW50aXR5LmNoaWxkcmVuKSB7XG4gICAgICAgICAgICAgICAgbmV3RW50aXR5LmNoaWxkcmVuID0gbmV3RW50aXR5LmNoaWxkcmVuLnNsaWNlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbmV3RW50aXR5O1xuICAgICAgICB9KTtcblxuICAgICAgICBPYmplY3Qua2V5cyhub2RlTG9va3VwKS5mb3JFYWNoKGtleSA9PiB7XG4gICAgICAgICAgICBub2RlTG9va3VwW2tleV0gJiYgdHJhdmVyc2VDaGlsZHJlbihub2RlTG9va3VwW2tleV0pO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gT2JqZWN0LmtleXMobm9kZUxvb2t1cCkubWFwKGtleSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gbm9kZUxvb2t1cFtrZXldO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgcHJvdGVjdGVkIGFib3J0Q3VycmVudFRhc2sgKCk6IHZvaWQge1xuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrICYmIHRoaXMuY3VycmVudFRhc2suYWJvcnQgJiYgdGhpcy5jdXJyZW50VGFzay5hYm9ydCgpO1xuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrID0gbnVsbDtcbiAgICB9O1xuXG4gICAgLy9maWxscyB0aGUgZ3JvdXAgYnVpbGRlciB3aXRoIHRoZSByZWxldmFudCBpbmZvcm1hdGlvblxuICAgIHB1YmxpYyBmZXRjaCAoKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgdGhpcy5hYm9ydEN1cnJlbnRUYXNrKCk7XG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgPSB0aGlzLmdldEdyb3VwcygpXG4gICAgICAgICAgICAudGhlbigoW2dyb3VwcywgdXNlcnNdKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5ncm91cHMgPSBncm91cHM7XG4gICAgICAgICAgICAgICAgdGhpcy51c2VycyA9IHVzZXJzO1xuICAgICAgICAgICAgICAgIHRoaXMudHJlZSA9IHRoaXMuY3JlYXRlR3JvdXBzVHJlZShncm91cHMpO1xuICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudFRyZWUgPSBleHRlbmQoe30sIHRoaXMudHJlZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlRmxhdEdyb3Vwc0xpc3QodGhpcy50cmVlKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuY2F0Y2goY29uc29sZS5lcnJvcilcbiAgICAgICAgICAgIC5maW5hbGx5KCgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRUYXNrID0gbnVsbDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gdGhpcy5jdXJyZW50VGFzaztcbiAgICB9O1xuXG4gICAgcHVibGljIGNyZWF0ZUZsYXRHcm91cHNMaXN0IChncm91cHM6IElHcm91cFtdLCBub3RJbmNsdWRlQ2hpbGRyZW46IGJvb2xlYW4gPSBmYWxzZSk6IElHcm91cFtdIHtcbiAgICAgICAgbGV0IGZvdW5kSWRzOiBzdHJpbmdbXSA9IFtdLFxuICAgICAgICAgICAgZ3JvdXBzVG9BZGQ6IElHcm91cFtdID0gW10sXG4gICAgICAgICAgICBtYWtlRmxhdFBhcmVudHMgPSAoaXRlbTogSUdyb3VwKSA9PiB7XG4gICAgICAgICAgICAgICAgbGV0IGl0ZW1Db3B5ID0gZXh0ZW5kKHt9LCBpdGVtKTtcbiAgICAgICAgICAgICAgICBpZiAoaXRlbSAmJiBpdGVtLnBhcmVudCkge1xuICAgICAgICAgICAgICAgICAgICBtYWtlRmxhdFBhcmVudHMoaXRlbS5wYXJlbnQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpdGVtQ29weS5jaGlsZHJlbiA9IGl0ZW1Db3B5LmNoaWxkcmVuLm1hcChjaGlsZCA9PiBjaGlsZC5pZCk7XG4gICAgICAgICAgICAgICAgaXRlbUNvcHkucGFyZW50ID0gaXRlbS5wYXJlbnQgPyB7aWQ6IGl0ZW0ucGFyZW50LmlkLCBuYW1lOiBpdGVtLnBhcmVudC5uYW1lfSA6IG51bGw7XG4gICAgICAgICAgICAgICAgaWYgKGZvdW5kSWRzLmluZGV4T2YoaXRlbS5pZCkgPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIGdyb3Vwc1RvQWRkLnB1c2goaXRlbUNvcHkpO1xuICAgICAgICAgICAgICAgICAgICBmb3VuZElkcy5wdXNoKGl0ZW0uaWQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBtYWtlRmxhdENoaWxkcmVuID0gKGl0ZW0pID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoaXRlbSAmJiBpdGVtLmNoaWxkcmVuICYmIGl0ZW0uY2hpbGRyZW4ubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIGl0ZW0uY2hpbGRyZW4uZm9yRWFjaCgoY2hpbGQpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBjaGlsZENvcHk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZm91bmRJZHMuaW5kZXhPZihjaGlsZC5pZCkgPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWFrZUZsYXRDaGlsZHJlbihjaGlsZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBjaGlsZENvcHkgPSBleHRlbmQoe30sIGNoaWxkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkQ29weS5jaGlsZHJlbiA9IGNoaWxkQ29weS5jaGlsZHJlbi5tYXAoY2hpbGRJbm5lciA9PiBjaGlsZElubmVyLmlkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkQ29weS5wYXJlbnQgPSBjaGlsZENvcHkucGFyZW50ID8ge2lkOiBjaGlsZENvcHkucGFyZW50LmlkLCBuYW1lOiBjaGlsZENvcHkucGFyZW50Lm5hbWV9IDogbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmb3VuZElkcy5pbmRleE9mKGNoaWxkLmlkKSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBncm91cHNUb0FkZC5wdXNoKGNoaWxkQ29weSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm91bmRJZHMucHVzaChjaGlsZC5pZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgZ3JvdXBzLmZvckVhY2gobWFrZUZsYXRQYXJlbnRzKTtcbiAgICAgICAgIW5vdEluY2x1ZGVDaGlsZHJlbiAmJiBncm91cHMuZm9yRWFjaChtYWtlRmxhdENoaWxkcmVuKTtcbiAgICAgICAgcmV0dXJuIGdyb3Vwc1RvQWRkO1xuICAgIH07XG5cbiAgICBwdWJsaWMgZ2V0R3JvdXBzRGF0YSAoZ3JvdXBJZHM6IHN0cmluZ1tdLCBub3RJbmNsdWRlQ2hpbGRyZW46IGJvb2xlYW4gPSBmYWxzZSk6IElHcm91cFtdIHtcbiAgICAgICAgbGV0IHRyZWVHcm91cHMgPSBncm91cElkcy5tYXAoZ3JvdXBJZCA9PlxuICAgICAgICAgICAgdGhpcy5maW5kQ2hpbGQoZ3JvdXBJZCwge2lkOiBudWxsLCBjaGlsZHJlbjogdGhpcy50cmVlfSwgdHJ1ZSkgfHwgdGhpcy5nZXRQcml2YXRlR3JvdXBEYXRhKGdyb3VwSWQpXG4gICAgICAgICk7XG4gICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZUZsYXRHcm91cHNMaXN0KHRyZWVHcm91cHMsIG5vdEluY2x1ZGVDaGlsZHJlbik7XG4gICAgfTtcblxuICAgIHB1YmxpYyBnZXRDdXN0b21Hcm91cHNEYXRhIChncm91cElkczogc3RyaW5nW10sIGFsbEdyb3VwczogSUdyb3VwW10pOiBJR3JvdXBbXSB7XG4gICAgICAgIGxldCBncm91cHNUcmVlID0gdGhpcy5jcmVhdGVHcm91cHNUcmVlKGFsbEdyb3VwcyksXG4gICAgICAgICAgICB0cmVlR3JvdXBzID0gZ3JvdXBJZHMubWFwKGdyb3VwSWQgPT5cbiAgICAgICAgICAgICAgICB0aGlzLmZpbmRDaGlsZChncm91cElkLCB7aWQ6IG51bGwsIGNoaWxkcmVuOiBncm91cHNUcmVlfSwgdHJ1ZSkgfHwgdGhpcy5nZXRQcml2YXRlR3JvdXBEYXRhKGdyb3VwSWQpXG4gICAgICAgICAgICApO1xuICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVGbGF0R3JvdXBzTGlzdCh0cmVlR3JvdXBzLCB0cnVlKTtcbiAgICB9O1xuXG4gICAgcHVibGljIGdldFByaXZhdGVHcm91cHNVc2Vycyhncm91cHM6IElHcm91cFtdKSB7XG4gICAgICAgIHJldHVybiBncm91cHMucmVkdWNlKCh1c2VyczogSUVudGl0eVtdLCBncm91cCkgPT4ge1xuICAgICAgICAgICAgZ3JvdXAudXNlciAmJiBncm91cC51c2VyLm5hbWUgIT09IHRoaXMuY3VycmVudFVzZXJOYW1lICYmIHVzZXJzLnB1c2goZ3JvdXAudXNlcik7XG4gICAgICAgICAgICByZXR1cm4gdXNlcnM7XG4gICAgICAgIH0sIFtdKTtcbiAgICB9O1xuXG4gICAgcHVibGljIHVubG9hZCAoKTogdm9pZCB7XG4gICAgICAgIHRoaXMuYWJvcnRDdXJyZW50VGFzaygpO1xuICAgIH07XG59IiwiaW1wb3J0IHsgZW50aXR5VG9EaWN0aW9uYXJ5IH0gZnJvbSBcIi4vdXRpbHNcIjtcblxudHlwZSBUTWFwUHJvdmlkZXJUeXBlID0gXCJkZWZhdWx0XCIgfCBcImFkZGl0aW9uYWxcIiB8IFwiY3VzdG9tXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgSU1pc2NEYXRhIHtcbiAgICBtYXBQcm92aWRlcjoge1xuICAgICAgICB2YWx1ZTogc3RyaW5nO1xuICAgICAgICB0eXBlOiBUTWFwUHJvdmlkZXJUeXBlO1xuICAgIH07XG4gICAgY3VycmVudFVzZXI6IGFueTtcbiAgICBpc1Vuc2lnbmVkQWRkaW5zQWxsb3dlZDogYm9vbGVhbjtcbiAgICBhZGRpbnM6IHN0cmluZ1tdO1xuICAgIHB1cmdlU2V0dGluZ3M/OiBhbnk7XG4gICAgZW1haWxTZW5kZXJGcm9tPzogc3RyaW5nO1xuICAgIGN1c3RvbWVyQ2xhc3NpZmljYXRpb24/OiBzdHJpbmc7XG4gICAgaXNNYXJrZXRwbGFjZVB1cmNoYXNlc0FsbG93ZWQ/OiBib29sZWFuO1xuICAgIGlzUmVzZWxsZXJBdXRvTG9naW5BbGxvd2VkPzogYm9vbGVhbjtcbiAgICBpc1RoaXJkUGFydHlNYXJrZXRwbGFjZUFwcHNBbGxvd2VkPzogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGNsYXNzIE1pc2NCdWlsZGVyIHtcbiAgICBwcml2YXRlIHJlYWRvbmx5IGFwaTtcbiAgICBwcml2YXRlIGN1c3RvbU1hcFByb3ZpZGVycztcbiAgICBwcml2YXRlIGN1cnJlbnRUYXNrO1xuICAgIHByaXZhdGUgY3VycmVudFVzZXI7XG4gICAgcHJpdmF0ZSBpc1Vuc2lnbmVkQWRkaW5zQWxsb3dlZDtcbiAgICBwcml2YXRlIGFkZGluczogc3RyaW5nW107XG4gICAgcHJpdmF0ZSByZWFkb25seSBkZWZhdWx0TWFwUHJvdmlkZXJzID0ge1xuICAgICAgICBHb29nbGVNYXBzOiBcIkdvb2dsZSBNYXBzXCIsXG4gICAgICAgIEhlcmU6IFwiSEVSRSBNYXBzXCIsXG4gICAgICAgIE1hcEJveDogXCJNYXBCb3hcIlxuICAgIH07XG5cbiAgICBwcml2YXRlIGFib3J0Q3VycmVudFRhc2sgKCkge1xuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrICYmIHRoaXMuY3VycmVudFRhc2suYWJvcnQgJiYgdGhpcy5jdXJyZW50VGFzay5hYm9ydCgpO1xuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrID0gbnVsbDtcbiAgICB9XG5cbiAgICBwcml2YXRlIGdldEFsbG93ZWRBZGRpbnMgKGFsbEFkZGluczogc3RyaW5nW10pIHtcbiAgICAgICAgcmV0dXJuIGFsbEFkZGlucy5maWx0ZXIoYWRkaW4gPT4ge1xuICAgICAgICAgICAgLy9yZW1vdmVzIHRoZSBjdXJyZW50IGFkZGluIC0gcmVnaXN0cmF0aW9uIGNvbmZpZ1xuICAgICAgICAgICAgaWYodGhpcy5pc0N1cnJlbnRBZGRpbihhZGRpbikpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGV0IGFkZGluQ29uZmlnID0gSlNPTi5wYXJzZShhZGRpbik7XG4gICAgICAgICAgICBpZihhZGRpbkNvbmZpZy5pdGVtcykge1xuICAgICAgICAgICAgICAgIC8vTXVsdGkgbGluZSBhZGRpbiBzdHJ1Y3R1cmUgY2hlY2tcbiAgICAgICAgICAgICAgICByZXR1cm4gYWRkaW5Db25maWcgJiYgQXJyYXkuaXNBcnJheShhZGRpbkNvbmZpZy5pdGVtcykgJiYgYWRkaW5Db25maWcuaXRlbXMuZXZlcnkoaXRlbSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGxldCB1cmwgPSBpdGVtLnVybDtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuaXNWYWxpZFVybCh1cmwpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgLy9TaW5nbGUgbGluZSBhZGRpbiBzdHJ1Y3R1cmUgY2hlY2tcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5pc1ZhbGlkVXJsKGFkZGluQ29uZmlnLnVybCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vVGVzdHMgYSBVUkwgZm9yIGRvdWJsZSBzbGFzaC4gQWNjZXB0cyBhIHVybCBhcyBhIHN0cmluZyBhcyBhIGFyZ3VtZW50LlxuICAgIC8vUmV0dXJucyB0cnVlIGlmIHRoZSB1cmwgY29udGFpbnMgYSBkb3VibGUgc2xhc2ggLy9cbiAgICAvL1JldHVybnMgZmFsc2UgaWYgdGhlIHVybCBkb2VzIG5vdCBjb250YWluIGEgZG91YmxlIHNsYXNoLlxuICAgIHByaXZhdGUgaXNWYWxpZFVybCh1cmw6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgICAgICBpZiAodXJsICYmIHVybC5pbmRleE9mKFwiXFwvXFwvXCIpID4gLTEpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGlzQ3VycmVudEFkZGluIChhZGRpbjogc3RyaW5nKSB7XG4gICAgICAgIHJldHVybiAoKGFkZGluLmluZGV4T2YoXCJSZWdpc3RyYXRpb24gY29uZmlnXCIpID4gLTEpfHxcbiAgICAgICAgKGFkZGluLnRvTG93ZXJDYXNlKCkuaW5kZXhPZihcInJlZ2lzdHJhdGlvbkNvbmZpZ1wiLnRvTG93ZXJDYXNlKCkpID4gLTEpKTtcbiAgICB9XG5cbiAgICBjb25zdHJ1Y3RvcihhcGkpIHtcbiAgICAgICAgdGhpcy5hcGkgPSBhcGk7XG4gICAgfVxuXG4gICAgLy9maWxscyB0aGUgTWlzYyBidWlsZGVyIChzeXN0ZW0gc2V0dGluZ3MpIHdpdGggdGhlIHJlbGV2YW50IGluZm9ybWF0aW9uXG4gICAgZmV0Y2ggKGluY2x1ZGVTeXNTZXR0aW5nczogYm9vbGVhbik6IFByb21pc2U8SU1pc2NEYXRhPiB7XG4gICAgICAgIHRoaXMuYWJvcnRDdXJyZW50VGFzaygpO1xuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrID0gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5hcGkuZ2V0U2Vzc2lvbigoc2Vzc2lvbkRhdGEpID0+IHtcbiAgICAgICAgICAgICAgICBsZXQgdXNlck5hbWUgPSBzZXNzaW9uRGF0YS51c2VyTmFtZTtcbiAgICAgICAgICAgICAgICB0aGlzLmFwaS5tdWx0aUNhbGwoW1xuICAgICAgICAgICAgICAgICAgICAgICAgW1wiR2V0XCIsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlTmFtZTogXCJVc2VyXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VhcmNoOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IHVzZXJOYW1lXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfV0sXG4gICAgICAgICAgICAgICAgICAgICAgICBbXCJHZXRcIiwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGVOYW1lOiBcIlN5c3RlbVNldHRpbmdzXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1dXG4gICAgICAgICAgICAgICAgICAgIF0sIHJlc29sdmUsIHJlamVjdCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSkudGhlbigocmVzdWx0OiBhbnkpID0+IHtcbiAgICAgICAgICAgIGxldCBjdXJyZW50VXNlciA9IHJlc3VsdFswXVswXSB8fCByZXN1bHRbMF0sXG4gICAgICAgICAgICAgICAgc3lzdGVtU2V0dGluZ3MgPSByZXN1bHRbMV1bMF0gfHwgcmVzdWx0WzFdLFxuICAgICAgICAgICAgICAgIHVzZXJNYXBQcm92aWRlcklkID0gY3VycmVudFVzZXIuZGVmYXVsdE1hcEVuZ2luZSxcbiAgICAgICAgICAgICAgICBkZWZhdWx0TWFwUHJvdmlkZXJJZCA9IHN5c3RlbVNldHRpbmdzLm1hcFByb3ZpZGVyLFxuICAgICAgICAgICAgICAgIG1hcFByb3ZpZGVySWQgPSB0aGlzLmdldE1hcFByb3ZpZGVyVHlwZSh1c2VyTWFwUHJvdmlkZXJJZCkgPT09IFwiY3VzdG9tXCIgPyB1c2VyTWFwUHJvdmlkZXJJZCA6IGRlZmF1bHRNYXBQcm92aWRlcklkO1xuICAgICAgICAgICAgdGhpcy5jdXJyZW50VXNlciA9IGN1cnJlbnRVc2VyO1xuICAgICAgICAgICAgdGhpcy5jdXN0b21NYXBQcm92aWRlcnMgPSBlbnRpdHlUb0RpY3Rpb25hcnkoc3lzdGVtU2V0dGluZ3MuY3VzdG9tV2ViTWFwUHJvdmlkZXJMaXN0KTtcbiAgICAgICAgICAgIHRoaXMuaXNVbnNpZ25lZEFkZGluc0FsbG93ZWQgPSBzeXN0ZW1TZXR0aW5ncy5hbGxvd1Vuc2lnbmVkQWRkSW47XG4gICAgICAgICAgICB0aGlzLmFkZGlucyA9IHRoaXMuZ2V0QWxsb3dlZEFkZGlucyhzeXN0ZW1TZXR0aW5ncy5jdXN0b21lclBhZ2VzKTtcbiAgICAgICAgICAgIGxldCBvdXRwdXQ6IElNaXNjRGF0YSA9IHtcbiAgICAgICAgICAgICAgICBtYXBQcm92aWRlcjoge1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogbWFwUHJvdmlkZXJJZCxcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogdGhpcy5nZXRNYXBQcm92aWRlclR5cGUobWFwUHJvdmlkZXJJZClcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGN1cnJlbnRVc2VyOiB0aGlzLmN1cnJlbnRVc2VyLFxuICAgICAgICAgICAgICAgIGlzVW5zaWduZWRBZGRpbnNBbGxvd2VkOiB0aGlzLmlzVW5zaWduZWRBZGRpbnNBbGxvd2VkLFxuICAgICAgICAgICAgICAgIGFkZGluczogdGhpcy5hZGRpbnNcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBpZiAoaW5jbHVkZVN5c1NldHRpbmdzKSB7XG4gICAgICAgICAgICAgICAgb3V0cHV0LnB1cmdlU2V0dGluZ3MgPSBzeXN0ZW1TZXR0aW5ncy5wdXJnZVNldHRpbmdzO1xuICAgICAgICAgICAgICAgIG91dHB1dC5lbWFpbFNlbmRlckZyb20gPSBzeXN0ZW1TZXR0aW5ncy5lbWFpbFNlbmRlckZyb207XG4gICAgICAgICAgICAgICAgb3V0cHV0LmN1c3RvbWVyQ2xhc3NpZmljYXRpb24gPSBzeXN0ZW1TZXR0aW5ncy5jdXN0b21lckNsYXNzaWZpY2F0aW9uO1xuICAgICAgICAgICAgICAgIG91dHB1dC5pc01hcmtldHBsYWNlUHVyY2hhc2VzQWxsb3dlZCA9IHN5c3RlbVNldHRpbmdzLmFsbG93TWFya2V0cGxhY2VQdXJjaGFzZXM7XG4gICAgICAgICAgICAgICAgb3V0cHV0LmlzUmVzZWxsZXJBdXRvTG9naW5BbGxvd2VkID0gc3lzdGVtU2V0dGluZ3MuYWxsb3dSZXNlbGxlckF1dG9Mb2dpbjtcbiAgICAgICAgICAgICAgICBvdXRwdXQuaXNUaGlyZFBhcnR5TWFya2V0cGxhY2VBcHBzQWxsb3dlZCA9IHN5c3RlbVNldHRpbmdzLmFsbG93VGhpcmRQYXJ0eU1hcmtldHBsYWNlQXBwcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBvdXRwdXQ7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gdGhpcy5jdXJyZW50VGFzaztcbiAgICB9XG5cbiAgICBnZXRNYXBQcm92aWRlclR5cGUgKG1hcFByb3ZpZGVySWQ6IHN0cmluZyk6IFRNYXBQcm92aWRlclR5cGUge1xuICAgICAgICByZXR1cm4gIW1hcFByb3ZpZGVySWQgfHwgdGhpcy5kZWZhdWx0TWFwUHJvdmlkZXJzW21hcFByb3ZpZGVySWRdID8gXCJkZWZhdWx0XCIgOiBcImN1c3RvbVwiO1xuICAgIH1cblxuICAgIGdldE1hcFByb3ZpZGVyTmFtZSAobWFwUHJvdmlkZXJJZDogc3RyaW5nKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIG1hcFByb3ZpZGVySWQgJiYgKHRoaXMuZGVmYXVsdE1hcFByb3ZpZGVyc1ttYXBQcm92aWRlcklkXSB8fCAodGhpcy5jdXN0b21NYXBQcm92aWRlcnNbbWFwUHJvdmlkZXJJZF0gJiYgdGhpcy5jdXN0b21NYXBQcm92aWRlcnNbbWFwUHJvdmlkZXJJZF0ubmFtZSkgfHwgbWFwUHJvdmlkZXJJZCk7XG4gICAgfVxuXG4gICAgZ2V0TWFwUHJvdmlkZXJEYXRhIChtYXBQcm92aWRlcklkOiBzdHJpbmcpIHtcbiAgICAgICAgcmV0dXJuIG1hcFByb3ZpZGVySWQgJiYgdGhpcy5jdXN0b21NYXBQcm92aWRlcnNbbWFwUHJvdmlkZXJJZF07XG4gICAgfVxuXG4gICAgZ2V0QWRkaW5zRGF0YSAoaW5jbHVkZVRoaXNBZGRpbiA9IGZhbHNlKSB7XG4gICAgICAgIHJldHVybiAhaW5jbHVkZVRoaXNBZGRpbiA/IHRoaXMuYWRkaW5zLmZpbHRlcihhZGRpbiA9PiAhdGhpcy5pc0N1cnJlbnRBZGRpbihhZGRpbikpIDogdGhpcy5hZGRpbnM7XG4gICAgfVxuXG4gICAgdW5sb2FkICgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5hYm9ydEN1cnJlbnRUYXNrKCk7XG4gICAgfVxufSIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi9ibHVlYmlyZC5kLnRzXCIvPlxuaW1wb3J0IHsgSUdyb3VwIH0gZnJvbSBcIi4vZ3JvdXBzQnVpbGRlclwiO1xuaW1wb3J0ICogYXMgVXRpbHMgZnJvbSBcIi4vdXRpbHNcIjtcblxuY29uc3QgUkVQT1JUX1RZUEVfREFTSEJPQUQgPSBcIkRhc2hib2FyZFwiO1xuXG5pbnRlcmZhY2UgSVJlcG9ydCBleHRlbmRzIElJZEVudGl0eSB7XG4gICAgZ3JvdXBzOiBJR3JvdXBbXTtcbiAgICBpbmNsdWRlQWxsQ2hpbGRyZW5Hcm91cHM6IElHcm91cFtdO1xuICAgIGluY2x1ZGVEaXJlY3RDaGlsZHJlbk9ubHlHcm91cHM6IElHcm91cFtdO1xuICAgIGluZGl2aWR1YWxSZWNpcGllbnRzOiBJSWRFbnRpdHlbXTtcbiAgICBzY29wZUdyb3VwczogSUdyb3VwW107XG4gICAgZGVzdGluYXRpb24/OiBzdHJpbmc7XG4gICAgdGVtcGxhdGU6IElSZXBvcnRUZW1wbGF0ZTtcbiAgICBsYXN0TW9kaWZpZWRVc2VyO1xuICAgIGFyZ3VtZW50czoge1xuICAgICAgICBydWxlcz86IGFueVtdO1xuICAgICAgICBkZXZpY2VzPzogYW55W107XG4gICAgICAgIHpvbmVUeXBlTGlzdD86IGFueVtdO1xuICAgICAgICBbcHJvcE5hbWU6IHN0cmluZ106IGFueTtcbiAgICB9O1xuICAgIFtwcm9wTmFtZTogc3RyaW5nXTogYW55O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIElSZXBvcnREZXBlbmRlbmNpZXMge1xuICAgIGRldmljZXM6IHN0cmluZ1tdO1xuICAgIHJ1bGVzOiBzdHJpbmdbXTtcbiAgICB6b25lVHlwZXM6IHN0cmluZ1tdO1xuICAgIGdyb3Vwczogc3RyaW5nW107XG4gICAgdXNlcnM6IHN0cmluZ1tdO1xufVxuXG5pbnRlcmZhY2UgSVJlcG9ydFRlbXBsYXRlIGV4dGVuZHMgSUlkRW50aXR5IHtcbiAgICBuYW1lOiBzdHJpbmc7XG4gICAgaXNTeXN0ZW06IGJvb2xlYW47XG4gICAgcmVwb3J0RGF0YVNvdXJjZTogc3RyaW5nO1xuICAgIHJlcG9ydFRlbXBsYXRlVHlwZTogc3RyaW5nO1xuICAgIHJlcG9ydHM6IElSZXBvcnRbXTtcbiAgICBiaW5hcnlEYXRhPzogc3RyaW5nO1xuICAgIFtwcm9wTmFtZTogc3RyaW5nXTogYW55O1xufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBSZXBvcnRzQnVpbGRlciB7XG4gICAgcHJpdmF0ZSByZWFkb25seSBhcGk7XG4gICAgcHJpdmF0ZSBjdXJyZW50VGFzaztcbiAgICBwcml2YXRlIGFsbFJlcG9ydHM6IElSZXBvcnRbXTtcbiAgICBwcml2YXRlIHN0cnVjdHVyZWRSZXBvcnRzO1xuICAgIHByaXZhdGUgZGFzaGJvYXJkc0xlbmd0aDogbnVtYmVyO1xuICAgIHByaXZhdGUgYWxsVGVtcGxhdGVzOiBJUmVwb3J0VGVtcGxhdGVbXTtcblxuICAgIC8vR2V0UmVwb3J0U2NoZWR1bGVzIGlzIG9ic29sZXRlXG4gICAgcHJpdmF0ZSBnZXRSZXBvcnRzICgpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5hcGkubXVsdGlDYWxsKFtcbiAgICAgICAgICAgICAgICBbXCJHZXRSZXBvcnRTY2hlZHVsZXNcIiwge1xuICAgICAgICAgICAgICAgICAgICBcImluY2x1ZGVUZW1wbGF0ZURldGFpbHNcIjogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgXCJhcHBseVVzZXJGaWx0ZXJcIjogZmFsc2VcbiAgICAgICAgICAgICAgICB9XSxcbiAgICAgICAgICAgICAgICBbXCJHZXRcIiwge1xuICAgICAgICAgICAgICAgICAgICBcInR5cGVOYW1lXCI6IFwiUmVwb3J0VGVtcGxhdGVcIixcbiAgICAgICAgICAgICAgICAgICAgXCJzZWFyY2hcIjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5jbHVkZUJpbmFyeURhdGE6IGZhbHNlXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XSxcbiAgICAgICAgICAgICAgICBbXCJHZXREYXNoYm9hcmRJdGVtc1wiLCB7fV1cbiAgICAgICAgICAgIF0sIHJlc29sdmUsIHJlamVjdCk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgc3RydWN0dXJlUmVwb3J0cyAocmVwb3J0cywgdGVtcGxhdGVzKSB7XG4gICAgICAgIGxldCBmaW5kVGVtcGxhdGVSZXBvcnRzID0gKHRlbXBsYXRlSWQpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVwb3J0cy5maWx0ZXIocmVwb3J0ID0+IHJlcG9ydC50ZW1wbGF0ZS5pZCA9PT0gdGVtcGxhdGVJZCk7XG4gICAgICAgICAgICB9O1xuICAgICAgICByZXR1cm4gdGVtcGxhdGVzLnJlZHVjZSgocmVzLCB0ZW1wbGF0ZSkgPT4ge1xuICAgICAgICAgICAgbGV0IHRlbXBsYXRlSWQgPSB0ZW1wbGF0ZS5pZCxcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVJlcG9ydHMgPSBmaW5kVGVtcGxhdGVSZXBvcnRzKHRlbXBsYXRlSWQpO1xuICAgICAgICAgICAgaWYgKHRlbXBsYXRlUmVwb3J0cy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZS5yZXBvcnRzID0gdGVtcGxhdGVSZXBvcnRzO1xuICAgICAgICAgICAgICAgIHJlcy5wdXNoKHRlbXBsYXRlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiByZXM7XG4gICAgICAgIH0sIFtdKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFib3J0Q3VycmVudFRhc2sgKCk6IHZvaWQge1xuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrICYmIHRoaXMuY3VycmVudFRhc2suYWJvcnQgJiYgdGhpcy5jdXJyZW50VGFzay5hYm9ydCgpO1xuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrID0gbnVsbDtcbiAgICB9XG5cbiAgICBwcml2YXRlIHVwZGF0ZVRlbXBsYXRlIChuZXdUZW1wbGF0ZURhdGE6IElSZXBvcnRUZW1wbGF0ZSkge1xuICAgICAgICB0aGlzLmFsbFRlbXBsYXRlcy5zb21lKCh0ZW1wbGF0ZURhdGE6IElSZXBvcnRUZW1wbGF0ZSwgaW5kZXg6IG51bWJlcikgPT4ge1xuICAgICAgICAgICAgaWYgKHRlbXBsYXRlRGF0YS5pZCA9PT0gbmV3VGVtcGxhdGVEYXRhLmlkKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5hbGxUZW1wbGF0ZXNbaW5kZXhdID0gbmV3VGVtcGxhdGVEYXRhO1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBjb25zdHJ1Y3RvcihhcGkpIHtcbiAgICAgICAgdGhpcy5hcGkgPSBhcGk7XG4gICAgfVxuXG4gICAgcHVibGljIGZldGNoICgpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICB0aGlzLmFib3J0Q3VycmVudFRhc2soKTtcbiAgICAgICAgdGhpcy5jdXJyZW50VGFzayA9IHRoaXMuZ2V0UmVwb3J0cygpXG4gICAgICAgICAgICAudGhlbigoW3JlcG9ydHMsIHRlbXBsYXRlcywgZGFzaGJvYXJkSXRlbXNdKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5hbGxSZXBvcnRzID0gcmVwb3J0cztcbiAgICAgICAgICAgICAgICB0aGlzLmFsbFRlbXBsYXRlcyA9IHRlbXBsYXRlcztcbiAgICAgICAgICAgICAgICB0aGlzLmRhc2hib2FyZHNMZW5ndGggPSBkYXNoYm9hcmRJdGVtcyAmJiBkYXNoYm9hcmRJdGVtcy5sZW5ndGggPyBkYXNoYm9hcmRJdGVtcy5sZW5ndGggOiAwO1xuICAgICAgICAgICAgICAgIHRoaXMuc3RydWN0dXJlZFJlcG9ydHMgPSB0aGlzLnN0cnVjdHVyZVJlcG9ydHMocmVwb3J0cywgdGVtcGxhdGVzKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zdHJ1Y3R1cmVkUmVwb3J0cztcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuY2F0Y2goY29uc29sZS5lcnJvcilcbiAgICAgICAgICAgIC5maW5hbGx5KCgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRUYXNrID0gbnVsbDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gdGhpcy5jdXJyZW50VGFzaztcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0RGVwZW5kZW5jaWVzIChyZXBvcnRzOiBJUmVwb3J0VGVtcGxhdGVbXSk6IElSZXBvcnREZXBlbmRlbmNpZXMge1xuICAgICAgICBsZXQgYWxsRGVwZW5kZW5jaWVzOiBJUmVwb3J0RGVwZW5kZW5jaWVzID0ge1xuICAgICAgICAgICAgICAgIGRldmljZXM6IFtdLFxuICAgICAgICAgICAgICAgIHJ1bGVzOiBbXSxcbiAgICAgICAgICAgICAgICB6b25lVHlwZXM6IFtdLFxuICAgICAgICAgICAgICAgIGdyb3VwczogW10sXG4gICAgICAgICAgICAgICAgdXNlcnM6IFtdXG4gICAgICAgICAgICB9O1xuICAgICAgICByZXR1cm4gcmVwb3J0cy5yZWR1Y2UoKHJlcG9ydHNEZXBlbmRlbmNpZXM6IElSZXBvcnREZXBlbmRlbmNpZXMsIHRlbXBsYXRlOiBJUmVwb3J0VGVtcGxhdGUpID0+IHtcbiAgICAgICAgICAgIHJldHVybiB0ZW1wbGF0ZS5yZXBvcnRzLnJlZHVjZSgodGVtcGxhdGVEZXBlbmRlY2llcywgcmVwb3J0KSA9PiB7XG4gICAgICAgICAgICAgICAgdGVtcGxhdGVEZXBlbmRlY2llcy5ncm91cHMgPSBVdGlscy5tZXJnZVVuaXF1ZSh0ZW1wbGF0ZURlcGVuZGVjaWVzLmdyb3VwcywgVXRpbHMuZ2V0RW50aXRpZXNJZHMocmVwb3J0Lmdyb3VwcyksXG4gICAgICAgICAgICAgICAgICAgIFV0aWxzLmdldEVudGl0aWVzSWRzKHJlcG9ydC5pbmNsdWRlQWxsQ2hpbGRyZW5Hcm91cHMpLCBVdGlscy5nZXRFbnRpdGllc0lkcyhyZXBvcnQuaW5jbHVkZURpcmVjdENoaWxkcmVuT25seUdyb3VwcyksXG4gICAgICAgICAgICAgICAgICAgIFV0aWxzLmdldEVudGl0aWVzSWRzKHJlcG9ydC5zY29wZUdyb3VwcykpO1xuICAgICAgICAgICAgICAgIHRlbXBsYXRlRGVwZW5kZWNpZXMudXNlcnMgPSBVdGlscy5tZXJnZVVuaXF1ZShcbiAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVEZXBlbmRlY2llcy51c2VycywgcmVwb3J0LmluZGl2aWR1YWxSZWNpcGllbnRzICYmIFV0aWxzLmdldEVudGl0aWVzSWRzKHJlcG9ydC5pbmRpdmlkdWFsUmVjaXBpZW50cykgfHwgW10pO1xuICAgICAgICAgICAgICAgIHRlbXBsYXRlRGVwZW5kZWNpZXMuZGV2aWNlcyA9IFV0aWxzLm1lcmdlVW5pcXVlKHRlbXBsYXRlRGVwZW5kZWNpZXMuZGV2aWNlcywgcmVwb3J0LmFyZ3VtZW50cyAmJiByZXBvcnQuYXJndW1lbnRzLmRldmljZXMgJiYgVXRpbHMuZ2V0RW50aXRpZXNJZHMocmVwb3J0LmFyZ3VtZW50cy5kZXZpY2VzKSB8fCBbXSk7XG4gICAgICAgICAgICAgICAgdGVtcGxhdGVEZXBlbmRlY2llcy5ydWxlcyA9IFV0aWxzLm1lcmdlVW5pcXVlKHRlbXBsYXRlRGVwZW5kZWNpZXMucnVsZXMsIHJlcG9ydC5hcmd1bWVudHMgJiYgcmVwb3J0LmFyZ3VtZW50cy5ydWxlcyAmJiBVdGlscy5nZXRFbnRpdGllc0lkcyhyZXBvcnQuYXJndW1lbnRzLnJ1bGVzKSB8fCBbXSk7XG4gICAgICAgICAgICAgICAgdGVtcGxhdGVEZXBlbmRlY2llcy56b25lVHlwZXMgPSBVdGlscy5tZXJnZVVuaXF1ZShcbiAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVEZXBlbmRlY2llcy56b25lVHlwZXMsIHJlcG9ydC5hcmd1bWVudHMgJiYgcmVwb3J0LmFyZ3VtZW50cy56b25lVHlwZUxpc3QgJiYgVXRpbHMuZ2V0RW50aXRpZXNJZHMocmVwb3J0LmFyZ3VtZW50cy56b25lVHlwZUxpc3QpIHx8IFtdKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGVtcGxhdGVEZXBlbmRlY2llcztcbiAgICAgICAgICAgIH0sIHJlcG9ydHNEZXBlbmRlbmNpZXMpO1xuICAgICAgICB9LCBhbGxEZXBlbmRlbmNpZXMpO1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXREYXRhICgpOiBQcm9taXNlPElSZXBvcnRUZW1wbGF0ZVtdPiB7XG4gICAgICAgIGxldCBwb3J0aW9uU2l6ZSA9IDE1LFxuICAgICAgICAgICAgcG9ydGlvbnMgPSB0aGlzLmFsbFRlbXBsYXRlcy5yZWR1Y2UoKHJlcXVlc3RzOiBhbnlbXSwgdGVtcGxhdGU6IElSZXBvcnRUZW1wbGF0ZSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmICghdGVtcGxhdGUuaXNTeXN0ZW0gJiYgIXRlbXBsYXRlLmJpbmFyeURhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHBvcnRpb25JbmRleDogbnVtYmVyID0gcmVxdWVzdHMubGVuZ3RoIC0gMTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFyZXF1ZXN0c1twb3J0aW9uSW5kZXhdIHx8IHJlcXVlc3RzW3BvcnRpb25JbmRleF0ubGVuZ3RoID49IHBvcnRpb25TaXplKSB7XG4gICAgICAgICAgICAgICAgICAgICAgIHJlcXVlc3RzLnB1c2goW10pO1xuICAgICAgICAgICAgICAgICAgICAgICBwb3J0aW9uSW5kZXggKys7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmVxdWVzdHNbcG9ydGlvbkluZGV4XS5wdXNoKFtcIkdldFwiLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBcInR5cGVOYW1lXCI6IFwiUmVwb3J0VGVtcGxhdGVcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwic2VhcmNoXCI6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZDogdGVtcGxhdGUuaWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5jbHVkZUJpbmFyeURhdGE6IHRydWVcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfV0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gcmVxdWVzdHM7XG4gICAgICAgICAgICB9LCBbXSksXG4gICAgICAgICAgICB0b3RhbFJlc3VsdHM6IGFueVtdW10gPSBbXSxcbiAgICAgICAgICAgIGdldFBvcnRpb25EYXRhID0gcG9ydGlvbiA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPGFueT4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFwaS5tdWx0aUNhbGwocG9ydGlvbiwgcmVzb2x2ZSwgcmVqZWN0KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBlcnJvclBvcnRpb25zID0gW107XG5cbiAgICAgICAgdGhpcy5hYm9ydEN1cnJlbnRUYXNrKCk7XG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgPSBwb3J0aW9ucy5yZWR1Y2UoKHByb21pc2VzLCBwb3J0aW9uKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHByb21pc2VzXG4gICAgICAgICAgICAgICAgICAgIC50aGVuKCgpID0+IGdldFBvcnRpb25EYXRhKHBvcnRpb24pKVxuICAgICAgICAgICAgICAgICAgICAudGhlbihyZXN1bHQgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRvdGFsUmVzdWx0cyA9IHRvdGFsUmVzdWx0cy5jb25jYXQocmVzdWx0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sIGUgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yUG9ydGlvbnMgPSBlcnJvclBvcnRpb25zLmNvbmNhdChwb3J0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfSwgVXRpbHMucmVzb2x2ZWRQcm9taXNlKFtdKSlcbiAgICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICBlcnJvclBvcnRpb25zLmxlbmd0aCAmJiBjb25zb2xlLndhcm4oZXJyb3JQb3J0aW9ucyk7XG4gICAgICAgICAgICAgICAgdG90YWxSZXN1bHRzLmZvckVhY2godGVtcGxhdGVEYXRhID0+IHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHRlbXBsYXRlOiBJUmVwb3J0VGVtcGxhdGUgPSB0ZW1wbGF0ZURhdGEubGVuZ3RoID8gdGVtcGxhdGVEYXRhWzBdIDogdGVtcGxhdGVEYXRhO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZVRlbXBsYXRlKHRlbXBsYXRlKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB0aGlzLnN0cnVjdHVyZWRSZXBvcnRzID0gdGhpcy5zdHJ1Y3R1cmVSZXBvcnRzKHRoaXMuYWxsUmVwb3J0cywgdGhpcy5hbGxUZW1wbGF0ZXMpO1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnN0cnVjdHVyZWRSZXBvcnRzO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5jYXRjaChjb25zb2xlLmVycm9yKVxuICAgICAgICAgICAgLmZpbmFsbHkoKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudFRhc2sgPSBudWxsO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB0aGlzLmN1cnJlbnRUYXNrO1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXREYXNoYm9hcmRzUXR5ICgpOiBudW1iZXIge1xuICAgICAgICByZXR1cm4gdGhpcy5kYXNoYm9hcmRzTGVuZ3RoO1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXRDdXN0b21pemVkUmVwb3J0c1F0eSAoKTogbnVtYmVyIHtcbiAgICAgICAgbGV0IHRlbXBsYXRlczogc3RyaW5nW10gPSBbXTtcbiAgICAgICAgcmV0dXJuICh0aGlzLmFsbFJlcG9ydHMuZmlsdGVyKChyZXBvcnQ6IElSZXBvcnQpID0+IHtcbiAgICAgICAgICAgIGxldCB0ZW1wbGF0ZUlkID0gcmVwb3J0LnRlbXBsYXRlLmlkLFxuICAgICAgICAgICAgICAgIHRlbXBsYXRlRXhpc3RzOiBib29sZWFuID0gdGVtcGxhdGVzLmluZGV4T2YodGVtcGxhdGVJZCkgPiAtMSxcbiAgICAgICAgICAgICAgICBpc0NvdW50OiBib29sZWFuID0gIXRlbXBsYXRlRXhpc3RzICYmIHJlcG9ydC5sYXN0TW9kaWZpZWRVc2VyICE9PSBcIk5vVXNlcklkXCI7XG4gICAgICAgICAgICBpc0NvdW50ICYmIHRlbXBsYXRlcy5wdXNoKHRlbXBsYXRlSWQpO1xuICAgICAgICAgICAgcmV0dXJuIGlzQ291bnQ7XG4gICAgICAgIH0pKS5sZW5ndGg7XG4gICAgfVxuXG4gICAgcHVibGljIHVubG9hZCAoKTogdm9pZCB7XG4gICAgICAgIHRoaXMuYWJvcnRDdXJyZW50VGFzaygpO1xuICAgIH1cbn0iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vYmx1ZWJpcmQuZC50c1wiLz5cbmltcG9ydCB7IHNvcnRBcnJheU9mRW50aXRpZXMsIGVudGl0eVRvRGljdGlvbmFyeSwgbWVyZ2VVbmlxdWUgfSBmcm9tIFwiLi91dGlsc1wiO1xuXG5pbnRlcmZhY2UgSVJ1bGUgZXh0ZW5kcyBJSWRFbnRpdHkge1xuICAgIGdyb3VwczogYW55W107XG4gICAgY29uZGl0aW9uOiBhbnk7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSVJ1bGVEZXBlbmRlbmNpZXMge1xuICAgIGRldmljZXM6IGFueVtdO1xuICAgIHVzZXJzOiBhbnlbXTtcbiAgICB6b25lczogYW55W107XG4gICAgem9uZVR5cGVzOiBhbnlbXTtcbiAgICB3b3JrVGltZXM6IGFueVtdO1xuICAgIHdvcmtIb2xpZGF5czogYW55W107XG4gICAgZ3JvdXBzOiBhbnlbXTtcbiAgICBzZWN1cml0eUdyb3VwczogYW55W107XG4gICAgZGlhZ25vc3RpY3M6IGFueVtdO1xufVxuXG5jb25zdCBBUFBMSUNBVElPTl9SVUxFX0lEID0gXCJSdWxlQXBwbGljYXRpb25FeGNlcHRpb25JZFwiO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBSdWxlc0J1aWxkZXIge1xuICAgIHByaXZhdGUgcmVhZG9ubHkgYXBpO1xuICAgIHByaXZhdGUgY3VycmVudFRhc2s7XG4gICAgcHJpdmF0ZSBjb21iaW5lZFJ1bGVzO1xuICAgIHByaXZhdGUgc3RydWN0dXJlZFJ1bGVzO1xuXG4gICAgcHJpdmF0ZSBnZXRSdWxlcyAoKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIHRoaXMuYXBpLmNhbGwoXCJHZXRcIiwge1xuICAgICAgICAgICAgICAgIFwidHlwZU5hbWVcIjogXCJSdWxlXCJcbiAgICAgICAgICAgIH0sIHJlc29sdmUsIHJlamVjdCk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgc3RydWN0dXJlUnVsZXMgKHJ1bGVzKSB7XG4gICAgICAgIHJldHVybiBzb3J0QXJyYXlPZkVudGl0aWVzKHJ1bGVzLCBbW1wiYmFzZVR5cGVcIiwgXCJkZXNjXCJdLCBcIm5hbWVcIl0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgYWJvcnRDdXJyZW50VGFzayAoKTogdm9pZCB7XG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgJiYgdGhpcy5jdXJyZW50VGFzay5hYm9ydCAmJiB0aGlzLmN1cnJlbnRUYXNrLmFib3J0KCk7XG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgPSBudWxsO1xuICAgIH1cblxuICAgIGNvbnN0cnVjdG9yKGFwaSkge1xuICAgICAgICB0aGlzLmFwaSA9IGFwaTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0RGVwZW5kZW5jaWVzIChydWxlcyk6IElSdWxlRGVwZW5kZW5jaWVzIHtcbiAgICAgICAgbGV0IGRlcGVuZGVuY2llczogSVJ1bGVEZXBlbmRlbmNpZXMgPSB7XG4gICAgICAgICAgICAgICAgZGV2aWNlczogW10sXG4gICAgICAgICAgICAgICAgdXNlcnM6IFtdLFxuICAgICAgICAgICAgICAgIHpvbmVzOiBbXSxcbiAgICAgICAgICAgICAgICB6b25lVHlwZXM6IFtdLFxuICAgICAgICAgICAgICAgIHdvcmtUaW1lczogW10sXG4gICAgICAgICAgICAgICAgd29ya0hvbGlkYXlzOiBbXSxcbiAgICAgICAgICAgICAgICBncm91cHM6IFtdLFxuICAgICAgICAgICAgICAgIGRpYWdub3N0aWNzOiBbXSxcbiAgICAgICAgICAgICAgICBzZWN1cml0eUdyb3VwczogW11cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwcm9jZXNzRGVwZW5kZW5jaWVzID0gKGNvbmRpdGlvbikgPT4ge1xuICAgICAgICAgICAgICAgIGxldCBpZDogc3RyaW5nIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgIGxldCB0eXBlOiBzdHJpbmcgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgc3dpdGNoIChjb25kaXRpb24uY29uZGl0aW9uVHlwZSkge1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiUnVsZVdvcmtIb3Vyc1wiOlxuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiQWZ0ZXJSdWxlV29ya0hvdXJzXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBpZCA9IChjb25kaXRpb24ud29ya1RpbWUgJiYgY29uZGl0aW9uLndvcmtUaW1lLmlkKSB8fCBjb25kaXRpb24ud29ya1RpbWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlID0gXCJ3b3JrVGltZXNcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiRHJpdmVyXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBpZCA9IGNvbmRpdGlvbi5kcml2ZXIgJiYgY29uZGl0aW9uLmRyaXZlci5pZDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGUgPSBcInVzZXJzXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIkRldmljZVwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgaWQgPSBjb25kaXRpb24uZGV2aWNlICYmIGNvbmRpdGlvbi5kZXZpY2UuaWQ7XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlID0gXCJkZXZpY2VzXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIkVudGVyaW5nQXJlYVwiOlxuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiRXhpdGluZ0FyZWFcIjpcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIk91dHNpZGVBcmVhXCI6XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJJbnNpZGVBcmVhXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29uZGl0aW9uLnpvbmUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZCA9IGNvbmRpdGlvbi56b25lLmlkIHx8IGNvbmRpdGlvbi56b25lO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGUgPSBcInpvbmVzXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkID0gY29uZGl0aW9uLnpvbmVUeXBlLmlkO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGUgPSBcInpvbmVUeXBlc1wiO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJGaWx0ZXJTdGF0dXNEYXRhQnlEaWFnbm9zdGljXCI6XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJBY3RpdmVPckluYWN0aXZlRmF1bHRcIjpcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIkZhdWx0XCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29uZGl0aW9uLmRpYWdub3N0aWMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZCA9IGNvbmRpdGlvbi5kaWFnbm9zdGljLmlkIHx8IGNvbmRpdGlvbi5kaWFnbm9zdGljO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGUgPSBcImRpYWdub3N0aWNzXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZCAmJiB0eXBlICYmIGRlcGVuZGVuY2llc1t0eXBlXS5pbmRleE9mKGlkKSA9PT0gLTEgJiYgZGVwZW5kZW5jaWVzW3R5cGVdLnB1c2goaWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNoZWNrQ29uZGl0aW9ucyA9IChwYXJlbnRDb25kaXRpb24sIGRlcGVuZGVuY2llczogSVJ1bGVEZXBlbmRlbmNpZXMpOiBJUnVsZURlcGVuZGVuY2llcyA9PiB7XG4gICAgICAgICAgICAgICAgbGV0IGNvbmRpdGlvbnMgPSBwYXJlbnRDb25kaXRpb24uY2hpbGRyZW4gfHwgW107XG4gICAgICAgICAgICAgICAgcHJvY2Vzc0RlcGVuZGVuY2llcyhwYXJlbnRDb25kaXRpb24pO1xuICAgICAgICAgICAgICAgIHJldHVybiBjb25kaXRpb25zLnJlZHVjZSgoZGVwZW5kZW5jaWVzLCBjb25kaXRpb24pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNvbmRpdGlvbi5jaGlsZHJlbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVwZW5kZW5jaWVzID0gY2hlY2tDb25kaXRpb25zKGNvbmRpdGlvbiwgZGVwZW5kZW5jaWVzKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBwcm9jZXNzRGVwZW5kZW5jaWVzKGNvbmRpdGlvbik7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBkZXBlbmRlbmNpZXM7XG4gICAgICAgICAgICAgICAgfSwgZGVwZW5kZW5jaWVzKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIHJldHVybiBydWxlcy5yZWR1Y2UoKGRlcGVuZGVuY2llczogSVJ1bGVEZXBlbmRlbmNpZXMsIHJ1bGU6IElSdWxlKSA9PiB7XG4gICAgICAgICAgICBkZXBlbmRlbmNpZXMuZ3JvdXBzID0gbWVyZ2VVbmlxdWUoZGVwZW5kZW5jaWVzLmdyb3VwcywgcnVsZS5ncm91cHMubWFwKGdyb3VwID0+IGdyb3VwLmlkKSk7XG4gICAgICAgICAgICBpZiAocnVsZS5jb25kaXRpb24pIHtcbiAgICAgICAgICAgICAgICBkZXBlbmRlbmNpZXMgPSBjaGVja0NvbmRpdGlvbnMocnVsZS5jb25kaXRpb24sIGRlcGVuZGVuY2llcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZGVwZW5kZW5jaWVzO1xuICAgICAgICB9LCBkZXBlbmRlbmNpZXMpO1xuICAgIH1cblxuICAgIHB1YmxpYyBmZXRjaCgpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICB0aGlzLmFib3J0Q3VycmVudFRhc2soKTtcbiAgICAgICAgdGhpcy5jdXJyZW50VGFzayA9IHRoaXMuZ2V0UnVsZXMoKVxuICAgICAgICAgICAgLnRoZW4oKHN3aXRjaGVkT25SdWxlcykgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuY29tYmluZWRSdWxlcyA9IGVudGl0eVRvRGljdGlvbmFyeShzd2l0Y2hlZE9uUnVsZXMpO1xuICAgICAgICAgICAgICAgIGRlbGV0ZSh0aGlzLmNvbWJpbmVkUnVsZXNbQVBQTElDQVRJT05fUlVMRV9JRF0pO1xuICAgICAgICAgICAgICAgIHRoaXMuc3RydWN0dXJlZFJ1bGVzID0gdGhpcy5zdHJ1Y3R1cmVSdWxlcyhPYmplY3Qua2V5cyh0aGlzLmNvbWJpbmVkUnVsZXMpLm1hcChrZXkgPT4gdGhpcy5jb21iaW5lZFJ1bGVzW2tleV0pKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gT2JqZWN0LmtleXModGhpcy5jb21iaW5lZFJ1bGVzKS5tYXAocnVsZUlkID0+IHRoaXMuY29tYmluZWRSdWxlc1tydWxlSWRdKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuY2F0Y2goY29uc29sZS5lcnJvcilcbiAgICAgICAgICAgIC5maW5hbGx5KCgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRUYXNrID0gbnVsbDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gdGhpcy5jdXJyZW50VGFzaztcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0UnVsZXNEYXRhIChydWxlc0lkczogc3RyaW5nW10pOiBJUnVsZVtdIHtcbiAgICAgICAgcmV0dXJuIHJ1bGVzSWRzLm1hcChydWxlSWQgPT4gdGhpcy5jb21iaW5lZFJ1bGVzW3J1bGVJZF0pO1xuICAgIH1cblxuICAgIHB1YmxpYyB1bmxvYWQgKCk6IHZvaWQge1xuICAgICAgICB0aGlzLmFib3J0Q3VycmVudFRhc2soKTtcbiAgICB9XG59IiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uL2JsdWViaXJkLmQudHNcIi8+XG5pbXBvcnQgR3JvdXBzQnVpbGRlciBmcm9tIFwiLi9ncm91cHNCdWlsZGVyXCI7XG5pbXBvcnQgKiBhcyBVdGlscyBmcm9tIFwiLi91dGlsc1wiO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBTZWN1cml0eUNsZWFyYW5jZXNCdWlsZGVyIGV4dGVuZHMgR3JvdXBzQnVpbGRlciB7XG5cbiAgICBjb25zdHJ1Y3RvcihhcGk6IGFueSkge1xuICAgICAgICBzdXBlcihhcGkpO1xuICAgIH1cblxuICAgIHByaXZhdGUgZ2V0U2VjdXJpdHlHcm91cHMgKCk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICB0aGlzLmFwaS5nZXRTZXNzaW9uKChzZXNzaW9uRGF0YSkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuYXBpLmNhbGwoXCJHZXRcIiwge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZU5hbWU6IFwiR3JvdXBcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlYXJjaDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkOiBcIkdyb3VwU2VjdXJpdHlJZFwiXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sIHJlc29sdmUsIHJlamVjdCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIHB1YmxpYyBmZXRjaCAoKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgdGhpcy5hYm9ydEN1cnJlbnRUYXNrKCk7XG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgPSB0aGlzLmdldFNlY3VyaXR5R3JvdXBzKClcbiAgICAgICAgICAgIC50aGVuKGdyb3VwcyA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5ncm91cHMgPSBncm91cHM7XG4gICAgICAgICAgICAgICAgdGhpcy50cmVlID0gdGhpcy5jcmVhdGVHcm91cHNUcmVlKGdyb3Vwcyk7XG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50VHJlZSA9IFV0aWxzLmV4dGVuZCh7fSwgdGhpcy50cmVlKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVGbGF0R3JvdXBzTGlzdCh0aGlzLnRyZWUpLmZpbHRlcihncm91cCA9PiAhIWdyb3VwLm5hbWUpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5jYXRjaChjb25zb2xlLmVycm9yKVxuICAgICAgICAgICAgLmZpbmFsbHkoKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudFRhc2sgPSBudWxsO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB0aGlzLmN1cnJlbnRUYXNrO1xuICAgIH07XG59IiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uL2JsdWViaXJkLmQudHNcIi8+XG5pbnRlcmZhY2UgSUNsYXNzQ29udHJvbCB7XG4gICAgZ2V0OiAoKSA9PiBzdHJpbmc7XG4gICAgc2V0OiAobmFtZTogc3RyaW5nKSA9PiB2b2lkO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIElFbnRpdHkge1xuICAgIGlkOiBzdHJpbmc7XG4gICAgW3Byb3BOYW1lOiBzdHJpbmddOiBhbnk7XG59XG5cbnR5cGUgSVNvcnRQcm9wZXJ0eSA9IHN0cmluZyB8IFtzdHJpbmcsIFwiYXNjXCIgfCBcImRlc2NcIl07XG5cbmxldCBjbGFzc05hbWVDdHJsID0gZnVuY3Rpb24gKGVsOiBFbGVtZW50KTogSUNsYXNzQ29udHJvbCB7XG4gICAgICAgIHZhciBwYXJhbSA9IHR5cGVvZiBlbC5jbGFzc05hbWUgPT09IFwic3RyaW5nXCIgPyBcImNsYXNzTmFtZVwiIDogXCJiYXNlVmFsXCI7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZWxbcGFyYW1dIHx8IFwiXCI7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2V0OiBmdW5jdGlvbiAodGV4dCkge1xuICAgICAgICAgICAgICAgIGVsW3BhcmFtXSA9IHRleHQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfSxcbiAgICBpc1VzdWFsT2JqZWN0ID0gZnVuY3Rpb24gKG9iaikge1xuICAgICAgICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9iaikuaW5kZXhPZihcIk9iamVjdFwiKSAhPT0gLTE7XG4gICAgfTtcblxuZXhwb3J0IGludGVyZmFjZSBJSGFzaCB7XG4gICAgW2lkOiBzdHJpbmddOiBhbnk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZW1vdmVDbGFzcyhlbDogRWxlbWVudCwgbmFtZTogc3RyaW5nKTogdm9pZCB7XG4gICAgaWYgKCFlbCkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGxldCBjbGFzc2VzU3RyID0gY2xhc3NOYW1lQ3RybChlbCkuZ2V0KCksXG4gICAgICAgIGNsYXNzZXMgPSBjbGFzc2VzU3RyLnNwbGl0KFwiIFwiKSxcbiAgICAgICAgbmV3Q2xhc3NlcyA9IGNsYXNzZXMuZmlsdGVyKGNsYXNzSXRlbSA9PiBjbGFzc0l0ZW0gIT09IG5hbWUpO1xuICAgIGNsYXNzTmFtZUN0cmwoZWwpLnNldChuZXdDbGFzc2VzLmpvaW4oXCIgXCIpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFkZENsYXNzKGVsLCBuYW1lKTogdm9pZCB7XG4gICAgaWYgKCFlbCkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGxldCBjbGFzc2VzU3RyID0gY2xhc3NOYW1lQ3RybChlbCkuZ2V0KCksXG4gICAgICAgIGNsYXNzZXMgPSBjbGFzc2VzU3RyLnNwbGl0KFwiIFwiKTtcbiAgICBpZiAoY2xhc3Nlcy5pbmRleE9mKG5hbWUpID09PSAtMSkge1xuICAgICAgICBjbGFzc05hbWVDdHJsKGVsKS5zZXQoY2xhc3Nlc1N0ciArIFwiIFwiICsgbmFtZSk7XG4gICAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gaGFzQ2xhc3MoZWw6IEVsZW1lbnQsIGNsYXNzTmFtZTogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIGVsICYmIGNsYXNzTmFtZUN0cmwoZWwpLmdldCgpLmluZGV4T2YoY2xhc3NOYW1lKSAhPT0gLTE7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBleHRlbmQoLi4uYXJnczogYW55W10pIHtcbiAgICB2YXIgbGVuZ3RoID0gYXJncy5sZW5ndGgsXG4gICAgICAgIHNyYywgc3JjS2V5cywgc3JjQXR0cixcbiAgICAgICAgZnVsbENvcHkgPSBmYWxzZSxcbiAgICAgICAgcmVzQXR0cixcbiAgICAgICAgcmVzID0gYXJnc1swXSwgaSA9IDEsIGo7XG5cbiAgICBpZiAodHlwZW9mIHJlcyA9PT0gXCJib29sZWFuXCIpIHtcbiAgICAgICAgZnVsbENvcHkgPSByZXM7XG4gICAgICAgIHJlcyA9IGFyZ3NbMV07XG4gICAgICAgIGkrKztcbiAgICB9XG4gICAgd2hpbGUgKGkgIT09IGxlbmd0aCkge1xuICAgICAgICBzcmMgPSBhcmdzW2ldO1xuICAgICAgICBzcmNLZXlzID0gT2JqZWN0LmtleXMoc3JjKTtcbiAgICAgICAgZm9yIChqID0gMDsgaiA8IHNyY0tleXMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgIHNyY0F0dHIgPSBzcmNbc3JjS2V5c1tqXV07XG4gICAgICAgICAgICBpZiAoZnVsbENvcHkgJiYgKGlzVXN1YWxPYmplY3Qoc3JjQXR0cikgfHwgQXJyYXkuaXNBcnJheShzcmNBdHRyKSkpIHtcbiAgICAgICAgICAgICAgICByZXNBdHRyID0gcmVzW3NyY0tleXNbal1dO1xuICAgICAgICAgICAgICAgIHJlc0F0dHIgPSByZXNbc3JjS2V5c1tqXV0gPSAoaXNVc3VhbE9iamVjdChyZXNBdHRyKSB8fCBBcnJheS5pc0FycmF5KHJlc0F0dHIpKSA/IHJlc0F0dHIgOiAoQXJyYXkuaXNBcnJheShzcmNBdHRyKSA/IFtdIDoge30pO1xuICAgICAgICAgICAgICAgIGV4dGVuZChmdWxsQ29weSwgcmVzQXR0ciwgc3JjQXR0cik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlc1tzcmNLZXlzW2pdXSA9IHNyY1tzcmNLZXlzW2pdXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpKys7XG4gICAgfVxuICAgIHJldHVybiByZXM7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBlbnRpdHlUb0RpY3Rpb25hcnkoZW50aXRpZXM6IGFueVtdLCBlbnRpdHlDYWxsYmFjaz86IChlbnRpdHk6IGFueSkgPT4gYW55KTogSUhhc2gge1xuICAgIHZhciBlbnRpdHksIG8gPSB7fSwgaSxcbiAgICAgICAgbCA9IGVudGl0aWVzLmxlbmd0aDtcblxuICAgIGZvciAoaSA9IDA7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgaWYgKGVudGl0aWVzW2ldKSB7XG4gICAgICAgICAgICBlbnRpdHkgPSBlbnRpdGllc1tpXS5pZCA/IGVudGl0aWVzW2ldIDoge2lkOiBlbnRpdGllc1tpXX07XG4gICAgICAgICAgICBvW2VudGl0eS5pZF0gPSBlbnRpdHlDYWxsYmFjayA/IGVudGl0eUNhbGxiYWNrKGVudGl0eSkgOiBlbnRpdHk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG87XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzb3J0QXJyYXlPZkVudGl0aWVzKGVudGl0aWVzOiBhbnlbXSwgc29ydGluZ0ZpZWxkczogSVNvcnRQcm9wZXJ0eVtdKTogYW55W10ge1xuICAgIGxldCBjb21wYXJhdG9yID0gKHByZXZJdGVtLCBuZXh0SXRlbSwgcHJvcGVydGllczogYW55W10sIGluZGV4ID0gMCkgPT4ge1xuICAgICAgICBpZiAocHJvcGVydGllcy5sZW5ndGggPD0gaW5kZXgpIHtcbiAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICB9XG4gICAgICAgIGxldCBvcHRpb25zID0gcHJvcGVydGllc1tpbmRleF0sXG4gICAgICAgICAgICBbcHJvcGVydHksIGRpciA9IFwiYXNjXCJdID0gQXJyYXkuaXNBcnJheShvcHRpb25zKSA/IG9wdGlvbnMgOiBbb3B0aW9uc10sXG4gICAgICAgICAgICBkaXJNdWx0aXBsaWVyOiBudW1iZXI7XG4gICAgICAgIGRpck11bHRpcGxpZXIgPSBkaXIgPT09IFwiYXNjXCIgPyAxIDogLTE7XG4gICAgICAgIGlmIChwcmV2SXRlbVtwcm9wZXJ0eV0gPiBuZXh0SXRlbVtwcm9wZXJ0eV0pIHtcbiAgICAgICAgICAgIHJldHVybiAxICogZGlyTXVsdGlwbGllcjtcbiAgICAgICAgfSBlbHNlIGlmIChwcmV2SXRlbVtwcm9wZXJ0eV0gPCBuZXh0SXRlbVtwcm9wZXJ0eV0pIHtcbiAgICAgICAgICAgIHJldHVybiAtMSAqIGRpck11bHRpcGxpZXI7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gY29tcGFyYXRvcihwcmV2SXRlbSwgbmV4dEl0ZW0sIHByb3BlcnRpZXMsIGluZGV4ICsgMSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIHJldHVybiBlbnRpdGllcy5zb3J0KChwcmV2VGVtcGxhdGUsIG5leHRUZW1wbGF0ZSkgPT4ge1xuICAgICAgICByZXR1cm4gY29tcGFyYXRvcihwcmV2VGVtcGxhdGUsIG5leHRUZW1wbGF0ZSwgc29ydGluZ0ZpZWxkcyk7XG4gICAgfSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBkb3dubG9hZERhdGFBc0ZpbGUoZGF0YTogc3RyaW5nLCBmaWxlbmFtZTogc3RyaW5nLCBtaW1lVHlwZSA9IFwidGV4dC9qc29uXCIpIHtcbiAgICBsZXQgYmxvYiA9IG5ldyBCbG9iKFtkYXRhXSwge3R5cGU6IG1pbWVUeXBlfSksXG4gICAgICAgIGVsZW07XG4gICAgZWxlbSA9IHdpbmRvdy5kb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYVwiKTtcbiAgICBlbGVtLmhyZWYgPSB3aW5kb3cuVVJMLmNyZWF0ZU9iamVjdFVSTChibG9iKTtcbiAgICBlbGVtLmRvd25sb2FkID0gZmlsZW5hbWU7XG4gICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChlbGVtKTtcbiAgICBlbGVtLmNsaWNrKCk7XG4gICAgZG9jdW1lbnQuYm9keS5yZW1vdmVDaGlsZChlbGVtKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG1lcmdlVW5pcXVlRW50aXRpZXMgKC4uLnNvdXJjZXM6IElFbnRpdHlbXVtdKTogSUVudGl0eVtdIHtcbiAgICBsZXQgYWRkZWRJZHM6IHN0cmluZ1tdID0gW10sXG4gICAgICAgIG1lcmdlZEl0ZW1zOiBJRW50aXR5W10gPSBbXTtcbiAgICBzb3VyY2VzLmZvckVhY2goc291cmNlID0+IHNvdXJjZS5mb3JFYWNoKGl0ZW0gPT4ge1xuICAgICAgICBpZiAoaXRlbSAmJiBpdGVtLmlkICYmIGFkZGVkSWRzLmluZGV4T2YoaXRlbS5pZCkgPT09IC0xKSB7XG4gICAgICAgICAgICBhZGRlZElkcy5wdXNoKGl0ZW0uaWQpO1xuICAgICAgICAgICAgbWVyZ2VkSXRlbXMucHVzaChpdGVtKTtcbiAgICAgICAgfVxuICAgIH0pKTtcbiAgICByZXR1cm4gbWVyZ2VkSXRlbXM7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRFbnRpdGllc0lkcyAoZW50aXRpZXNMaXN0OiBJRW50aXR5W10pOiBzdHJpbmdbXSB7XG4gICAgcmV0dXJuIEFycmF5LmlzQXJyYXkoZW50aXRpZXNMaXN0KSAmJiBlbnRpdGllc0xpc3QucmVkdWNlKChyZXN1bHQ6IHN0cmluZ1tdLCBlbnRpdHkpID0+IHtcbiAgICAgICAgZW50aXR5ICYmIGVudGl0eS5pZCAmJiByZXN1bHQucHVzaChlbnRpdHkuaWQpO1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH0sIFtdKSB8fCBbXTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG1lcmdlVW5pcXVlICguLi5zb3VyY2VzOiBzdHJpbmdbXVtdKTogc3RyaW5nW10ge1xuICAgIGxldCBtZXJnZWRJdGVtczogc3RyaW5nW10gPSBbXTtcbiAgICBzb3VyY2VzLmZvckVhY2goc291cmNlID0+IHtcbiAgICAgICAgQXJyYXkuaXNBcnJheShzb3VyY2UpICYmIHNvdXJjZS5mb3JFYWNoKGl0ZW0gPT4ge1xuICAgICAgICAgICAgaXRlbSAmJiBtZXJnZWRJdGVtcy5pbmRleE9mKGl0ZW0pID09PSAtMSAmJiBtZXJnZWRJdGVtcy5wdXNoKGl0ZW0pO1xuICAgICAgICB9KTtcbiAgICB9KTtcbiAgICByZXR1cm4gbWVyZ2VkSXRlbXM7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRVbmlxdWVFbnRpdGllcyAobmV3RW50aXRpZXM6IElFbnRpdHlbXSwgZXhpc3RlZEVudGl0aWVzOiBJRW50aXR5W10pOiBJRW50aXR5W10ge1xuICAgIGxldCBzZWxlY3RlZEVudGl0aWVzSGFzaCA9IGVudGl0eVRvRGljdGlvbmFyeShleGlzdGVkRW50aXRpZXMpO1xuICAgIHJldHVybiBuZXdFbnRpdGllcy5yZWR1Y2UoKHJlczogSUVudGl0eVtdLCBlbnRpdHkpID0+IHtcbiAgICAgICAgIXNlbGVjdGVkRW50aXRpZXNIYXNoW2VudGl0eS5pZF0gJiYgcmVzLnB1c2goZW50aXR5KTtcbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICB9LCBbXSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0b2dldGhlcihwcm9taXNlczogUHJvbWlzZTxhbnk+W10pOiBQcm9taXNlPGFueT4ge1xuICAgIGxldCByZXN1bHRzOiBhbnlbXSA9IFtdLFxuICAgICAgICByZXN1bHRzQ291bnQgPSAwO1xuICAgIHJlc3VsdHMubGVuZ3RoID0gcHJvbWlzZXMubGVuZ3RoO1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIGxldCByZXNvbHZlQWxsID0gKCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHJlc29sdmUocmVzdWx0cyk7XG4gICAgICAgIH07XG4gICAgICAgIHByb21pc2VzLmxlbmd0aCA/IHByb21pc2VzLmZvckVhY2goKHByb21pc2UsIGluZGV4KSA9PiB7XG4gICAgICAgICAgICBwcm9taXNlLnRoZW4oKHJlc3VsdCkgPT4ge1xuICAgICAgICAgICAgICAgIHJlc3VsdHNDb3VudCsrO1xuICAgICAgICAgICAgICAgIHJlc3VsdHNbaW5kZXhdID0gcmVzdWx0O1xuICAgICAgICAgICAgICAgIHJlc3VsdHNDb3VudCA9PT0gcHJvbWlzZXMubGVuZ3RoICYmIHJlc29sdmVBbGwoKTtcbiAgICAgICAgICAgIH0pLmNhdGNoKChlcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgIHJlamVjdCh7XG4gICAgICAgICAgICAgICAgICAgIGVycm9yOiBlcnJvcixcbiAgICAgICAgICAgICAgICAgICAgcHJvbWlzZUluZGV4OiBpbmRleFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pIDogcmVzb2x2ZUFsbCgpO1xuICAgIH0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVzb2x2ZWRQcm9taXNlPFQ+ICh2YWw/OiBUKTogUHJvbWlzZTxUPiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlPFQ+KHJlc29sdmUgPT4gcmVzb2x2ZSh2YWwpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRvQXJyYXkgKGRhdGEpIHtcbiAgICByZXR1cm4gQXJyYXkuaXNBcnJheShkYXRhKSA/IGRhdGEgOiBbZGF0YV07XG59IiwiZXhwb3J0IGRlZmF1bHQgY2xhc3MgV2FpdGluZyB7XG5cbiAgICBwcml2YXRlIHdhaXRpbmdDb250YWluZXI6IEhUTUxFbGVtZW50O1xuICAgIHByaXZhdGUgYm9keUVsOiBIVE1MRWxlbWVudCA9IGRvY3VtZW50LmJvZHk7XG5cbiAgICBwdWJsaWMgc3RhcnQoZWw6IEhUTUxFbGVtZW50ID0gdGhpcy5ib2R5RWwsIHpJbmRleD86IG51bWJlcikge1xuICAgICAgICBpZiAoZWwub2Zmc2V0UGFyZW50ID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy53YWl0aW5nQ29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgICAgdGhpcy53YWl0aW5nQ29udGFpbmVyLmNsYXNzTmFtZSA9IFwid2FpdGluZ1wiO1xuICAgICAgICB0aGlzLndhaXRpbmdDb250YWluZXIuaW5uZXJIVE1MID0gXCI8ZGl2IGNsYXNzPSdmYWRlcic+PC9kaXY+PGRpdiBjbGFzcz0nc3Bpbm5lcic+PC9kaXY+XCI7XG4gICAgICAgIGVsLnBhcmVudE5vZGU/LmFwcGVuZENoaWxkKHRoaXMud2FpdGluZ0NvbnRhaW5lcik7XG5cbiAgICAgICAgdGhpcy53YWl0aW5nQ29udGFpbmVyLnN0eWxlLnBvc2l0aW9uID0gXCJhYnNvbHV0ZVwiO1xuICAgICAgICB0aGlzLndhaXRpbmdDb250YWluZXIuc3R5bGUud2lkdGggPSBlbC5vZmZzZXRXaWR0aCArIFwicHhcIjtcbiAgICAgICAgdGhpcy53YWl0aW5nQ29udGFpbmVyLnN0eWxlLmhlaWdodCA9IGVsLm9mZnNldEhlaWdodCArIFwicHhcIjtcbiAgICAgICAgdGhpcy53YWl0aW5nQ29udGFpbmVyLnN0eWxlLnRvcCA9IGVsLm9mZnNldFRvcCArIFwicHhcIjtcbiAgICAgICAgdGhpcy53YWl0aW5nQ29udGFpbmVyLnN0eWxlLmxlZnQgPSBlbC5vZmZzZXRMZWZ0ICsgXCJweFwiO1xuICAgICAgICB0aGlzLndhaXRpbmdDb250YWluZXIuc3R5bGUuZGlzcGxheSA9IFwiYmxvY2tcIjtcbiAgICAgICAgdHlwZW9mIHpJbmRleCA9PT0gXCJudW1iZXJcIiAmJiAodGhpcy53YWl0aW5nQ29udGFpbmVyLnN0eWxlLnpJbmRleCA9IHpJbmRleC50b1N0cmluZygpKTtcbiAgICB9O1xuXG4gICAgcHVibGljIHN0b3AgKCkge1xuICAgICAgICBpZiAodGhpcy53YWl0aW5nQ29udGFpbmVyICYmIHRoaXMud2FpdGluZ0NvbnRhaW5lci5wYXJlbnROb2RlKSB7XG4gICAgICAgICAgICB0aGlzLndhaXRpbmdDb250YWluZXIucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0aGlzLndhaXRpbmdDb250YWluZXIpO1xuICAgICAgICB9XG4gICAgfTtcbn0iLCIvL2FkZGVkIGJ5IEJyZXR0IHRvIG1hbmFnZSBhZGRpbmcgYWxsIHpvbmVzIHRvIHRoZSBleHBvcnQgYXMgYW4gb3B0aW9uXG5cbmV4cG9ydCBjbGFzcyBab25lQnVpbGRlciB7XG4gICAgcHJpdmF0ZSByZWFkb25seSBhcGk7XG4gICAgcHJpdmF0ZSBjdXJyZW50VGFzaztcblxuICAgIGNvbnN0cnVjdG9yKGFwaSkge1xuICAgICAgICB0aGlzLmFwaSA9IGFwaTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFib3J0Q3VycmVudFRhc2sgKCkge1xuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrICYmIHRoaXMuY3VycmVudFRhc2suYWJvcnQgJiYgdGhpcy5jdXJyZW50VGFzay5hYm9ydCgpO1xuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrID0gbnVsbDtcbiAgICB9XG5cbiAgICAvL2ZpbGxzIHRoZSB1c2VyIGJ1aWxkZXIgd2l0aCBhbGwgdXNlcnNcbiAgICBmZXRjaCAoKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgdGhpcy5hYm9ydEN1cnJlbnRUYXNrKCk7XG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgPSB0aGlzLmdldFpvbmVzKClcbiAgICAgICAgcmV0dXJuIHRoaXMuY3VycmVudFRhc2s7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBnZXRab25lcyAoKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIHRoaXMuYXBpLmNhbGwoXCJHZXRcIiwge1xuICAgICAgICAgICAgICAgIFwidHlwZU5hbWVcIjogXCJab25lXCJcbiAgICAgICAgICAgIH0sIHJlc29sdmUsIHJlamVjdCk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHVubG9hZCAoKTogdm9pZCB7XG4gICAgICAgIHRoaXMuYWJvcnRDdXJyZW50VGFzaygpO1xuICAgIH1cbn0iXX0=
