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
var userBuilder_1 = require("./userBuilder");
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
        //if the includeThisAddin checkbox is changed we enter here
        this.toggleThisAddinIncluded = function (e) {
            var isChecked = !!e.target && !!e.target.checked;
            var addinsBlock = document.getElementById("exportedAddins");
            var addinsData = _this.miscBuilder.getAddinsData(!isChecked);
            _this.showEntityMessage(addinsBlock, addinsData.length, "addin");
            _this.data.misc.addins = addinsData;
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
        this.userBuilder = new userBuilder_1.UserBuilder(api);
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
    Addin.prototype.addEventHandlers = function () {
        this.exportBtn.addEventListener("click", this.exportData, false);
        this.saveBtn.addEventListener("click", this.saveChanges, false);
        this.exportAllAddinsCheckbox.addEventListener("change", this.checkBoxValueChanged, false);
        this.exportAllZonesCheckbox.addEventListener("change", this.checkBoxValueChanged, false);
        this.exportSystemSettingsCheckbox.addEventListener("change", this.checkBoxValueChanged, false);
    };
    Addin.prototype.render = function () {
        var _this = this;
        this.data.users = [];
        this.data.zones = [];
        this.setAddinsToNull();
        //wire up the dom
        var mapMessageTemplate = document.getElementById("mapMessageTemplate").innerHTML, groupsBlock = document.getElementById("exportedGroups"), securityClearancesBlock = document.getElementById("exportedSecurityClearances"), rulesBlock = document.getElementById("exportedRules"), reportsBlock = document.getElementById("exportedReports"), dashboardsBlock = document.getElementById("exportedDashboards"), addinsBlock = document.getElementById("exportedAddins"), mapBlockDescription = document.querySelector("#exportedMap > .description"), usersBlock = document.getElementById("exportedUsers"), zonesBlock = document.getElementById("exportedZones"), systemSettingsBlock = document.getElementById("exportSystemSettings");
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
            this.userBuilder.fetch(),
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
                //sets exported zones to all database zones
                _this.data.zones = results[7];
                zoneDependencies = getDependencies(results[7], "Zone");
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
            // this.miscBuilder.isThisAddinIncluded() && thisAddinBlock.classList.remove("hidden");
            _this.showEntityMessage(usersBlock, _this.data.users.length, "user");
            _this.showEntityMessage(zonesBlock, _this.data.zones.length, "zone");
            _this.showSystemSettingsMessage(systemSettingsBlock, _this.exportSystemSettingsCheckbox.checked);
            //this displays all the data/objects in the console
            console.log(_this.data);
        })["catch"](function (e) {
            console.error(e);
            alert("Can't get config to export");
        })["finally"](function () { return _this.toggleWaiting(); });
    };
    Addin.prototype.setAddinsToNull = function () {
        if ((this.data.misc != null) || (this.data.misc != undefined)) {
            this.data.misc.addins = [];
        }
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
            addin.addEventHandlers();
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
},{"./distributionListsBuilder":2,"./groupsBuilder":3,"./miscBuilder":4,"./reportsBuilder":5,"./rulesBuilder":6,"./securityClearancesBuilder":7,"./userBuilder":8,"./utils":9,"./waiting":10,"./zoneBuilder":11}],2:[function(require,module,exports){
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
},{"./utils":9}],3:[function(require,module,exports){
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
},{"./utils":9}],4:[function(require,module,exports){
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
    MiscBuilder.prototype.removeExportAddin = function (allAddins) {
        return allAddins.filter(function (addin) {
            return (addin.toLowerCase().indexOf("registrationConfig".toLowerCase()) <= 0);
        });
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
    MiscBuilder.prototype.isThisAddinIncluded = function () {
        return this.addins.some(this.isCurrentAddin);
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
},{"./utils":9}],6:[function(require,module,exports){
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
},{"./utils":9}],7:[function(require,module,exports){
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
},{"./groupsBuilder":3,"./utils":9}],8:[function(require,module,exports){
"use strict";
//added by Brett to manage adding all users to the export as an option
exports.__esModule = true;
var UserBuilder = /** @class */ (function () {
    function UserBuilder(api) {
        this.api = api;
    }
    UserBuilder.prototype.abortCurrentTask = function () {
        this.currentTask && this.currentTask.abort && this.currentTask.abort();
        this.currentTask = null;
    };
    //fills the user builder with all users
    UserBuilder.prototype.fetch = function () {
        this.abortCurrentTask();
        this.currentTask = this.getUsers();
        return this.currentTask;
    };
    UserBuilder.prototype.getUsers = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.api.call("Get", {
                "typeName": "User"
            }, resolve, reject);
        });
    };
    UserBuilder.prototype.unload = function () {
        this.abortCurrentTask();
    };
    return UserBuilder;
}());
exports.UserBuilder = UserBuilder;
},{}],9:[function(require,module,exports){
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
},{}],10:[function(require,module,exports){
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
},{}],11:[function(require,module,exports){
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzb3VyY2VzL2FkZGluLnRzIiwic291cmNlcy9kaXN0cmlidXRpb25MaXN0c0J1aWxkZXIudHMiLCJzb3VyY2VzL2dyb3Vwc0J1aWxkZXIudHMiLCJzb3VyY2VzL21pc2NCdWlsZGVyLnRzIiwic291cmNlcy9yZXBvcnRzQnVpbGRlci50cyIsInNvdXJjZXMvcnVsZXNCdWlsZGVyLnRzIiwic291cmNlcy9zZWN1cml0eUNsZWFyYW5jZXNCdWlsZGVyLnRzIiwic291cmNlcy91c2VyQnVpbGRlci50cyIsInNvdXJjZXMvdXRpbHMudHMiLCJzb3VyY2VzL3dhaXRpbmcudHMiLCJzb3VyY2VzL3pvbmVCdWlsZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNBQSxpREFBNEM7QUFDNUMseUVBQW9FO0FBQ3BFLG1EQUE4QztBQUM5QywrQ0FBMEM7QUFDMUMsdUVBQWtFO0FBQ2xFLDZDQUFxRDtBQUNyRCxpQ0FBb0o7QUFDcEoscUNBQWdDO0FBQ2hDLDZDQUEwQztBQUMxQyw2Q0FBMEM7QUE0QzFDO0lBd1RJLG1CQUFtQjtJQUNuQixlQUFhLEdBQUc7UUFBaEIsaUJBV0M7UUExVGdCLGNBQVMsR0FBZ0IsUUFBUSxDQUFDLGNBQWMsQ0FBQyxjQUFjLENBQUMsQ0FBQztRQUNqRSxZQUFPLEdBQWdCLFFBQVEsQ0FBQyxjQUFjLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDN0QsNEJBQXVCLEdBQXFCLFFBQVEsQ0FBQyxjQUFjLENBQUMsNEJBQTRCLENBQXFCLENBQUM7UUFDdEgsMkJBQXNCLEdBQXFCLFFBQVEsQ0FBQyxjQUFjLENBQUMsMkJBQTJCLENBQXFCLENBQUM7UUFDcEgsaUNBQTRCLEdBQXFCLFFBQVEsQ0FBQyxjQUFjLENBQUMsaUNBQWlDLENBQXFCLENBQUM7UUFNaEksU0FBSSxHQUFnQjtZQUNqQyxNQUFNLEVBQUUsRUFBRTtZQUNWLE9BQU8sRUFBRSxFQUFFO1lB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VyxJQUFJLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxJQUFJLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDdkUsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUM7SUFDNUIsQ0FBQztJQUVELHVDQUF1QztJQUN2QywyQkFBSyxHQUFMO1FBQ0ksSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7UUFDeEIsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUE7UUFDbEMsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDO0lBQzVCLENBQUM7SUFFTyw4QkFBUSxHQUFoQjtRQUFBLGlCQU1DO1FBTEcsT0FBTyxJQUFJLE9BQU8sQ0FBQyxVQUFDLE9BQU8sRUFBRSxNQUFNO1lBQy9CLEtBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRTtnQkFDakIsVUFBVSxFQUFFLE1BQU07YUFDckIsRUFBRSxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDeEIsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDO0lBRUQsNEJBQU0sR0FBTjtRQUNJLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO0lBQzVCLENBQUM7SUFDTCxrQkFBQztBQUFELENBL0JBLEFBK0JDLElBQUE7QUEvQlksa0NBQVciLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCJpbXBvcnQgR3JvdXBzQnVpbGRlciBmcm9tIFwiLi9ncm91cHNCdWlsZGVyXCI7XHJcbmltcG9ydCBTZWN1cml0eUNsZWFyYW5jZXNCdWlsZGVyIGZyb20gXCIuL3NlY3VyaXR5Q2xlYXJhbmNlc0J1aWxkZXJcIjtcclxuaW1wb3J0IFJlcG9ydHNCdWlsZGVyIGZyb20gXCIuL3JlcG9ydHNCdWlsZGVyXCI7XHJcbmltcG9ydCBSdWxlc0J1aWxkZXIgZnJvbSBcIi4vcnVsZXNCdWlsZGVyXCI7XHJcbmltcG9ydCBEaXN0cmlidXRpb25MaXN0c0J1aWxkZXIgZnJvbSBcIi4vZGlzdHJpYnV0aW9uTGlzdHNCdWlsZGVyXCI7XHJcbmltcG9ydCB7SU1pc2NEYXRhLCBNaXNjQnVpbGRlcn0gZnJvbSBcIi4vbWlzY0J1aWxkZXJcIjtcclxuaW1wb3J0IHtkb3dubG9hZERhdGFBc0ZpbGUsIG1lcmdlVW5pcXVlLCBJRW50aXR5LCBtZXJnZVVuaXF1ZUVudGl0aWVzLCBnZXRVbmlxdWVFbnRpdGllcywgZ2V0RW50aXRpZXNJZHMsIHRvZ2V0aGVyLCByZXNvbHZlZFByb21pc2V9IGZyb20gXCIuL3V0aWxzXCI7XHJcbmltcG9ydCBXYWl0aW5nIGZyb20gXCIuL3dhaXRpbmdcIjtcclxuaW1wb3J0IHtVc2VyQnVpbGRlcn0gZnJvbSBcIi4vdXNlckJ1aWxkZXJcIjtcclxuaW1wb3J0IHtab25lQnVpbGRlcn0gZnJvbSBcIi4vem9uZUJ1aWxkZXJcIjtcclxuXHJcbmludGVyZmFjZSBHZW90YWIge1xyXG4gICAgYWRkaW46IHtcclxuICAgICAgICByZWdpc3RyYXRpb25Db25maWc6IEZ1bmN0aW9uXHJcbiAgICB9O1xyXG59XHJcblxyXG5pbnRlcmZhY2UgSUltcG9ydERhdGEge1xyXG4gICAgZ3JvdXBzOiBhbnlbXTtcclxuICAgIHJlcG9ydHM6IGFueVtdO1xyXG4gICAgcnVsZXM6IGFueVtdO1xyXG4gICAgZGlzdHJpYnV0aW9uTGlzdHM6IGFueVtdO1xyXG4gICAgZGV2aWNlczogYW55W107XHJcbiAgICB1c2VyczogYW55W107XHJcbiAgICB6b25lVHlwZXM6IGFueVtdO1xyXG4gICAgem9uZXM6IGFueVtdO1xyXG4gICAgd29ya1RpbWVzOiBhbnlbXTtcclxuICAgIHdvcmtIb2xpZGF5czogYW55W107XHJcbiAgICBzZWN1cml0eUdyb3VwczogYW55W107XHJcbiAgICBkaWFnbm9zdGljczogYW55W107XHJcbiAgICBjdXN0b21NYXBzOiBhbnlbXTtcclxuICAgIG1pc2M6IElNaXNjRGF0YTtcclxuICAgIG5vdGlmaWNhdGlvblRlbXBsYXRlczogYW55W107XHJcbn1cclxuaW50ZXJmYWNlIElEZXBlbmRlbmNpZXMge1xyXG4gICAgZ3JvdXBzPzogc3RyaW5nW107XHJcbiAgICByZXBvcnRzPzogc3RyaW5nW107XHJcbiAgICBydWxlcz86IHN0cmluZ1tdO1xyXG4gICAgZGlzdHJpYnV0aW9uTGlzdHM/OiBzdHJpbmdbXTtcclxuICAgIGRldmljZXM/OiBzdHJpbmdbXTtcclxuICAgIHVzZXJzPzogc3RyaW5nW107XHJcbiAgICB6b25lVHlwZXM/OiBzdHJpbmdbXTtcclxuICAgIHpvbmVzPzogc3RyaW5nW107XHJcbiAgICB3b3JrVGltZXM/OiBzdHJpbmdbXTtcclxuICAgIHdvcmtIb2xpZGF5cz86IHN0cmluZ1tdO1xyXG4gICAgc2VjdXJpdHlHcm91cHM/OiBzdHJpbmdbXTtcclxuICAgIGRpYWdub3N0aWNzPzogc3RyaW5nW107XHJcbiAgICBjdXN0b21NYXBzPzogc3RyaW5nW107XHJcbiAgICBub3RpZmljYXRpb25UZW1wbGF0ZXM/OiBzdHJpbmdbXTtcclxufVxyXG5cclxuZGVjbGFyZSBjb25zdCBnZW90YWI6IEdlb3RhYjtcclxuXHJcbmNsYXNzIEFkZGluIHtcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgYXBpO1xyXG4gICAgcHJpdmF0ZSByZWFkb25seSBncm91cHNCdWlsZGVyOiBHcm91cHNCdWlsZGVyO1xyXG4gICAgcHJpdmF0ZSByZWFkb25seSBzZWN1cml0eUNsZWFyYW5jZXNCdWlsZGVyOiBTZWN1cml0eUNsZWFyYW5jZXNCdWlsZGVyO1xyXG4gICAgcHJpdmF0ZSByZWFkb25seSByZXBvcnRzQnVpbGRlcjogUmVwb3J0c0J1aWxkZXI7XHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IHJ1bGVzQnVpbGRlcjogUnVsZXNCdWlsZGVyO1xyXG4gICAgcHJpdmF0ZSByZWFkb25seSBkaXN0cmlidXRpb25MaXN0c0J1aWxkZXI6IERpc3RyaWJ1dGlvbkxpc3RzQnVpbGRlcjtcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgbWlzY0J1aWxkZXI6IE1pc2NCdWlsZGVyO1xyXG4gICAgcHJpdmF0ZSByZWFkb25seSB1c2VyQnVpbGRlcjogVXNlckJ1aWxkZXI7XHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IHpvbmVCdWlsZGVyOiBab25lQnVpbGRlcjtcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgZXhwb3J0QnRuOiBIVE1MRWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZXhwb3J0QnV0dG9uXCIpO1xyXG4gICAgcHJpdmF0ZSByZWFkb25seSBzYXZlQnRuOiBIVE1MRWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2F2ZUJ1dHRvblwiKTtcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgZXhwb3J0QWxsQWRkaW5zQ2hlY2tib3g6IEhUTUxJbnB1dEVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImV4cG9ydF9hbGxfYWRkaW5zX2NoZWNrYm94XCIpIGFzIEhUTUxJbnB1dEVsZW1lbnQ7XHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IGV4cG9ydEFsbFpvbmVzQ2hlY2tib3g6IEhUTUxJbnB1dEVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImV4cG9ydF9hbGxfem9uZXNfY2hlY2tib3hcIikgYXMgSFRNTElucHV0RWxlbWVudDtcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgZXhwb3J0U3lzdGVtU2V0dGluZ3NDaGVja2JveDogSFRNTElucHV0RWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZXhwb3J0X3N5c3RlbV9zZXR0aW5nc19jaGVja2JveFwiKSBhcyBIVE1MSW5wdXRFbGVtZW50O1xyXG4gICAgcHJpdmF0ZSByZWFkb25seSB3YWl0aW5nOiBXYWl0aW5nO1xyXG4gICAgcHJpdmF0ZSBjdXJyZW50VGFzaztcclxuICAgIC8vdGVtcG9yYXJ5IHBsYWNlaG9sZGVycyBmb3IgdGhlIG9iamVjdHMgaW5kaWNhdGVkXHJcbiAgICBwcml2YXRlIHRlbXBVc2VyczogW107XHJcbiAgICBwcml2YXRlIHRlbXBab25lc1xyXG4gICAgcHJpdmF0ZSByZWFkb25seSBkYXRhOiBJSW1wb3J0RGF0YSA9IHtcclxuICAgICAgICBncm91cHM6IFtdLFxyXG4gICAgICAgIHJlcG9ydHM6IFtdLFxyXG4gICAgICAgIHJ1bGVzOiBbXSxcclxuICAgICAgICBkaXN0cmlidXRpb25MaXN0czogW10sXHJcbiAgICAgICAgZGV2aWNlczogW10sXHJcbiAgICAgICAgdXNlcnM6IFtdLFxyXG4gICAgICAgIHpvbmVUeXBlczogW10sXHJcbiAgICAgICAgem9uZXM6IFtdLFxyXG4gICAgICAgIHdvcmtUaW1lczogW10sXHJcbiAgICAgICAgd29ya0hvbGlkYXlzOiBbXSxcclxuICAgICAgICBzZWN1cml0eUdyb3VwczogW10sXHJcbiAgICAgICAgY3VzdG9tTWFwczogW10sXHJcbiAgICAgICAgZGlhZ25vc3RpY3M6IFtdLFxyXG4gICAgICAgIG1pc2M6IG51bGwsXHJcbiAgICAgICAgbm90aWZpY2F0aW9uVGVtcGxhdGVzOiBbXVxyXG4gICAgfTtcclxuXHJcbiAgICBwcml2YXRlIGNvbWJpbmVEZXBlbmRlbmNpZXMgKC4uLmFsbERlcGVuZGVuY2llczogSURlcGVuZGVuY2llc1tdKTogSURlcGVuZGVuY2llcyB7XHJcbiAgICAgICAgbGV0IHRvdGFsID0ge1xyXG4gICAgICAgICAgICBncm91cHM6IFtdLFxyXG4gICAgICAgICAgICByZXBvcnRzOiBbXSxcclxuICAgICAgICAgICAgcnVsZXM6IFtdLFxyXG4gICAgICAgICAgICBkZXZpY2VzOiBbXSxcclxuICAgICAgICAgICAgdXNlcnM6IFtdLFxyXG4gICAgICAgICAgICB6b25lVHlwZXM6IFtdLFxyXG4gICAgICAgICAgICB6b25lczogW10sXHJcbiAgICAgICAgICAgIHdvcmtUaW1lczogW10sXHJcbiAgICAgICAgICAgIHdvcmtIb2xpZGF5czogW10sXHJcbiAgICAgICAgICAgIHNlY3VyaXR5R3JvdXBzOiBbXSxcclxuICAgICAgICAgICAgZGlhZ25vc3RpY3M6IFtdLFxyXG4gICAgICAgICAgICBjdXN0b21NYXBzOiBbXSxcclxuICAgICAgICAgICAgbm90aWZpY2F0aW9uVGVtcGxhdGVzOiBbXVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgcmV0dXJuIE9iamVjdC5rZXlzKHRvdGFsKS5yZWR1Y2UoKGRlcGVuZGVuY2llcywgZGVwZW5kZW5jeU5hbWU6IHN0cmluZykgPT4ge1xyXG4gICAgICAgICAgICBkZXBlbmRlbmNpZXNbZGVwZW5kZW5jeU5hbWVdID0gbWVyZ2VVbmlxdWUoZGVwZW5kZW5jaWVzW2RlcGVuZGVuY3lOYW1lXSwgLi4uYWxsRGVwZW5kZW5jaWVzLm1hcCgoZW50aXR5RGVwZW5kZW5jaWVzKSA9PiBlbnRpdHlEZXBlbmRlbmNpZXNbZGVwZW5kZW5jeU5hbWVdKSk7XHJcbiAgICAgICAgICAgIHJldHVybiBkZXBlbmRlbmNpZXM7XHJcbiAgICAgICAgfSwgdG90YWwpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYWRkTmV3R3JvdXBzIChncm91cHM6IHN0cmluZ1tdLCBkYXRhOiBJSW1wb3J0RGF0YSk6IFByb21pc2U8YW55PiB7XHJcbiAgICAgICAgaWYgKCFncm91cHMgfHwgIWdyb3Vwcy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVkUHJvbWlzZSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBsZXQgZ3JvdXBzRGF0YSA9IHRoaXMuZ3JvdXBzQnVpbGRlci5nZXRHcm91cHNEYXRhKGdyb3VwcywgdHJ1ZSksXHJcbiAgICAgICAgICAgIG5ld0dyb3Vwc1VzZXJzID0gZ2V0VW5pcXVlRW50aXRpZXModGhpcy5ncm91cHNCdWlsZGVyLmdldFByaXZhdGVHcm91cHNVc2Vycyhncm91cHNEYXRhKSwgZGF0YS51c2Vycyk7XHJcbiAgICAgICAgZGF0YS5ncm91cHMgPSBtZXJnZVVuaXF1ZUVudGl0aWVzKGRhdGEuZ3JvdXBzLCBncm91cHNEYXRhKTtcclxuICAgICAgICBkYXRhLnVzZXJzID0gbWVyZ2VVbmlxdWVFbnRpdGllcyhkYXRhLnVzZXJzLCBuZXdHcm91cHNVc2Vycyk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMucmVzb2x2ZURlcGVuZGVuY2llcyh7dXNlcnM6IGdldEVudGl0aWVzSWRzKG5ld0dyb3Vwc1VzZXJzKX0sIGRhdGEpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYWRkTmV3Q3VzdG9tTWFwcyAoY3VzdG9tTWFwc0lkczogc3RyaW5nW10sIGRhdGE6IElJbXBvcnREYXRhKSB7XHJcbiAgICAgICAgaWYgKCFjdXN0b21NYXBzSWRzIHx8ICFjdXN0b21NYXBzSWRzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGxldCBjdXN0b21NYXBzRGF0YSA9IGN1c3RvbU1hcHNJZHMucmVkdWNlKChkYXRhLCBjdXN0b21NYXBJZDogc3RyaW5nKSA9PiB7XHJcbiAgICAgICAgICAgIGxldCBjdXN0b21NYXBEYXRhID0gdGhpcy5taXNjQnVpbGRlci5nZXRNYXBQcm92aWRlckRhdGEoY3VzdG9tTWFwSWQpO1xyXG4gICAgICAgICAgICBjdXN0b21NYXBEYXRhICYmIGRhdGEucHVzaChjdXN0b21NYXBEYXRhKTtcclxuICAgICAgICAgICAgcmV0dXJuIGRhdGE7XHJcbiAgICAgICAgfSwgW10pO1xyXG4gICAgICAgIGRhdGEuY3VzdG9tTWFwcyA9IG1lcmdlVW5pcXVlRW50aXRpZXMoZGF0YS5jdXN0b21NYXBzLCBjdXN0b21NYXBzRGF0YSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhZGROZXdOb3RpZmljYXRpb25UZW1wbGF0ZXMgKG5vdGlmaWNhdGlvblRlbXBsYXRlc0lkczogc3RyaW5nW10sIGRhdGE6IElJbXBvcnREYXRhKSB7XHJcbiAgICAgICAgaWYgKCFub3RpZmljYXRpb25UZW1wbGF0ZXNJZHMgfHwgIW5vdGlmaWNhdGlvblRlbXBsYXRlc0lkcy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBsZXQgbm90aWZpY2F0aW9uVGVtcGxhdGVzRGF0YSA9IG5vdGlmaWNhdGlvblRlbXBsYXRlc0lkcy5yZWR1Y2UoKGRhdGEsIHRlbXBsYXRlSWQ6IHN0cmluZykgPT4ge1xyXG4gICAgICAgICAgICBsZXQgdGVtcGxhdGVEYXRhID0gdGhpcy5kaXN0cmlidXRpb25MaXN0c0J1aWxkZXIuZ2V0Tm90aWZpY2F0aW9uVGVtcGxhdGVEYXRhKHRlbXBsYXRlSWQpO1xyXG4gICAgICAgICAgICB0ZW1wbGF0ZURhdGEgJiYgZGF0YS5wdXNoKHRlbXBsYXRlRGF0YSk7XHJcbiAgICAgICAgICAgIHJldHVybiBkYXRhO1xyXG4gICAgICAgIH0sIFtdKTtcclxuICAgICAgICBkYXRhLm5vdGlmaWNhdGlvblRlbXBsYXRlcyA9IG1lcmdlVW5pcXVlRW50aXRpZXMoZGF0YS5ub3RpZmljYXRpb25UZW1wbGF0ZXMsIG5vdGlmaWNhdGlvblRlbXBsYXRlc0RhdGEpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgZ2V0RW50eXRpZXNJZHMgKGVudGl0aWVzOiBJRW50aXR5W10pOiBzdHJpbmdbXSB7XHJcbiAgICAgICAgcmV0dXJuIGVudGl0aWVzLnJlZHVjZSgocmVzLCBlbnRpdHkpID0+IHtcclxuICAgICAgICAgICAgZW50aXR5ICYmIGVudGl0eS5pZCAmJiByZXMucHVzaChlbnRpdHkuaWQpO1xyXG4gICAgICAgICAgICByZXR1cm4gcmVzO1xyXG4gICAgICAgIH0sIFtdKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGdldEVudGl0eURlcGVuZGVuY2llcyAoZW50aXR5OiBJRW50aXR5LCBlbnRpdHlUeXBlKSB7XHJcbiAgICAgICAgbGV0IGVudGl0eURlcGVuZGVuY2llczogSURlcGVuZGVuY2llcyA9IHt9O1xyXG4gICAgICAgIHN3aXRjaCAoZW50aXR5VHlwZSkge1xyXG4gICAgICAgICAgICBjYXNlIFwiZGV2aWNlc1wiOlxyXG4gICAgICAgICAgICAgICAgZW50aXR5RGVwZW5kZW5jaWVzLmdyb3VwcyA9IHRoaXMuZ2V0RW50eXRpZXNJZHMoZW50aXR5W1wiZ3JvdXBzXCJdLmNvbmNhdChlbnRpdHlbXCJhdXRvR3JvdXBzXCJdKSk7XHJcbiAgICAgICAgICAgICAgICBlbnRpdHlbXCJ3b3JrVGltZVwiXS5pZCAmJiAoZW50aXR5RGVwZW5kZW5jaWVzLndvcmtUaW1lcyA9IFtlbnRpdHlbXCJ3b3JrVGltZVwiXS5pZF0pO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgXCJ1c2Vyc1wiOlxyXG4gICAgICAgICAgICAgICAgZW50aXR5RGVwZW5kZW5jaWVzLmdyb3VwcyA9IHRoaXMuZ2V0RW50eXRpZXNJZHMoZW50aXR5W1wiY29tcGFueUdyb3Vwc1wiXS5jb25jYXQoZW50aXR5W1wiZHJpdmVyR3JvdXBzXCJdKS5jb25jYXQoZW50aXR5W1wicHJpdmF0ZVVzZXJHcm91cHNcIl0pLmNvbmNhdChlbnRpdHlbXCJyZXBvcnRHcm91cHNcIl0pKTtcclxuICAgICAgICAgICAgICAgIGVudGl0eURlcGVuZGVuY2llcy5zZWN1cml0eUdyb3VwcyA9IHRoaXMuZ2V0RW50eXRpZXNJZHMoZW50aXR5W1wic2VjdXJpdHlHcm91cHNcIl0pO1xyXG4gICAgICAgICAgICAgICAgZW50aXR5RGVwZW5kZW5jaWVzLmN1c3RvbU1hcHMgPSBbZW50aXR5W1wiZGVmYXVsdE1hcEVuZ2luZVwiXV07XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBcInpvbmVzXCI6XHJcbiAgICAgICAgICAgICAgICBsZXQgem9uZVR5cGVzID0gdGhpcy5nZXRFbnR5dGllc0lkcyhlbnRpdHlbXCJ6b25lVHlwZXNcIl0pO1xyXG4gICAgICAgICAgICAgICAgem9uZVR5cGVzLmxlbmd0aCAmJiAoZW50aXR5RGVwZW5kZW5jaWVzLnpvbmVUeXBlcyA9IHpvbmVUeXBlcyk7XHJcbiAgICAgICAgICAgICAgICBlbnRpdHlEZXBlbmRlbmNpZXMuZ3JvdXBzID0gdGhpcy5nZXRFbnR5dGllc0lkcyhlbnRpdHlbXCJncm91cHNcIl0pO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgXCJ3b3JrVGltZXNcIjpcclxuICAgICAgICAgICAgICAgIGVudGl0eVtcImhvbGlkYXlHcm91cFwiXS5ncm91cElkICYmIChlbnRpdHlEZXBlbmRlbmNpZXMud29ya0hvbGlkYXlzID0gW2VudGl0eVtcImhvbGlkYXlHcm91cFwiXS5ncm91cElkXSk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZW50aXR5RGVwZW5kZW5jaWVzO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXBwbHlUb0VudGl0aWVzIChlbnRpdGllc0xpc3Q6IElEZXBlbmRlbmNpZXMsIGluaXRpYWxWYWx1ZSwgZnVuYzogKHJlc3VsdCwgZW50aXR5LCBlbnRpdHlUeXBlOiBzdHJpbmcsIGVudGl0eUluZGV4OiBudW1iZXIsIGVudGl0eVR5cGVJbmRleDogbnVtYmVyLCBvdmVyYWxsSW5kZXg6IG51bWJlcikgPT4gYW55KSB7XHJcbiAgICAgICAgbGV0IG92ZXJhbGxJbmRleCA9IDA7XHJcbiAgICAgICAgcmV0dXJuIE9iamVjdC5rZXlzKGVudGl0aWVzTGlzdCkucmVkdWNlKChyZXN1bHQsIGVudGl0eVR5cGUsIHR5cGVJbmRleCkgPT4ge1xyXG4gICAgICAgICAgICByZXR1cm4gZW50aXRpZXNMaXN0W2VudGl0eVR5cGVdLnJlZHVjZSgocmVzLCBlbnRpdHksIGluZGV4KSA9PiB7XHJcbiAgICAgICAgICAgICAgICBvdmVyYWxsSW5kZXgrKztcclxuICAgICAgICAgICAgICAgIHJldHVybiBmdW5jKHJlcywgZW50aXR5LCBlbnRpdHlUeXBlLCBpbmRleCwgdHlwZUluZGV4LCBvdmVyYWxsSW5kZXggLSAxKTtcclxuICAgICAgICAgICAgfSwgcmVzdWx0KTtcclxuICAgICAgICB9LCBpbml0aWFsVmFsdWUpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgcmVzb2x2ZURlcGVuZGVuY2llcyAoZGVwZW5kZW5jaWVzOiBJRGVwZW5kZW5jaWVzLCBkYXRhOiBJSW1wb3J0RGF0YSkge1xyXG4gICAgICAgIGxldCBnZXREYXRhID0gKGVudGl0aWVzTGlzdDogSURlcGVuZGVuY2llcyk6IFByb21pc2U8SUltcG9ydERhdGE+ID0+IHtcclxuICAgICAgICAgICAgICAgIGxldCBlbnRpdHlSZXF1ZXN0VHlwZXMgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRldmljZXM6IFwiRGV2aWNlXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHVzZXJzOiBcIlVzZXJcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgem9uZVR5cGVzOiBcIlpvbmVUeXBlXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHpvbmVzOiBcIlpvbmVcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgd29ya1RpbWVzOiBcIldvcmtUaW1lXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHdvcmtIb2xpZGF5czogXCJXb3JrSG9saWRheVwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWN1cml0eUdyb3VwczogXCJHcm91cFwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBkaWFnbm9zdGljczogXCJEaWFnbm9zdGljXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICByZXF1ZXN0czogYW55ID0gdGhpcy5hcHBseVRvRW50aXRpZXMoZW50aXRpZXNMaXN0LCB7fSwgKHJlc3VsdCwgZW50aXR5SWQsIGVudGl0eVR5cGUpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHJlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlTmFtZTogZW50aXR5UmVxdWVzdFR5cGVzW2VudGl0eVR5cGVdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VhcmNoOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IGVudGl0eUlkXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlbnRpdHlSZXF1ZXN0VHlwZXNbZW50aXR5VHlwZV0pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlbnRpdHlUeXBlID09PSBcIndvcmtIb2xpZGF5c1wiIHx8IGVudGl0eVR5cGUgPT09IFwic2VjdXJpdHlHcm91cHNcIikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAhcmVzdWx0W2VudGl0eVR5cGVdICYmIChyZXN1bHRbZW50aXR5VHlwZV0gPSBbXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHRbZW50aXR5VHlwZV0ucHVzaChbXCJHZXRcIiwgcmVxdWVzdF0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGVudGl0aWVzTGlzdC5zZWN1cml0eUdyb3VwcyAmJiBlbnRpdGllc0xpc3Quc2VjdXJpdHlHcm91cHMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWVzdHMuc2VjdXJpdHlHcm91cHMgPSBbW1wiR2V0XCIsIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZU5hbWU6IGVudGl0eVJlcXVlc3RUeXBlcy5zZWN1cml0eUdyb3VwcyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VhcmNoOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZDogXCJHcm91cFNlY3VyaXR5SWRcIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfV1dO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKGVudGl0aWVzTGlzdC53b3JrSG9saWRheXMgJiYgZW50aXRpZXNMaXN0LndvcmtIb2xpZGF5cy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXF1ZXN0cy53b3JrSG9saWRheXMgPSBbW1wiR2V0XCIsIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZU5hbWU6IGVudGl0eVJlcXVlc3RUeXBlcy53b3JrSG9saWRheXNcclxuICAgICAgICAgICAgICAgICAgICB9XV07XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuYWRkTmV3R3JvdXBzKGVudGl0aWVzTGlzdC5ncm91cHMsIGRhdGEpLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkTmV3Q3VzdG9tTWFwcyhlbnRpdGllc0xpc3QuY3VzdG9tTWFwcywgZGF0YSk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGROZXdOb3RpZmljYXRpb25UZW1wbGF0ZXMoZW50aXRpZXNMaXN0Lm5vdGlmaWNhdGlvblRlbXBsYXRlcywgZGF0YSk7XHJcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIGVudGl0aWVzTGlzdC5ncm91cHM7XHJcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIGVudGl0aWVzTGlzdC5jdXN0b21NYXBzO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZTxJSW1wb3J0RGF0YT4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgcmVxdWVzdEVudGl0aWVzID0gT2JqZWN0LmtleXMocmVxdWVzdHMpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVxdWVzdHNBcnJheSA9IHJlcXVlc3RFbnRpdGllcy5yZWR1Y2UoKGxpc3QsIHR5cGUpID0+IGxpc3QuY29uY2F0KHJlcXVlc3RzW3R5cGVdKSwgW10pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXJlcXVlc3RFbnRpdGllcy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlKGRhdGEpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYXBpLm11bHRpQ2FsbChyZXF1ZXN0c0FycmF5LCAocmVzcG9uc2UpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgbmV3R3JvdXBzID0gW10sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld0N1c3RvbU1hcHMgPSBbXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3RGVwZW5kZW5jaWVzOiBJRGVwZW5kZW5jaWVzID0ge30sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4cG9ydGVkRGF0YTogYW55ID0gdGhpcy5hcHBseVRvRW50aXRpZXMocmVxdWVzdHMsIHt9LCAocmVzdWx0LCByZXF1ZXN0LCBlbnRpdHlUeXBlLCBlbnRpdHlJbmRleCwgZW50aXR5VHlwZUluZGV4LCBvdmVyYWxsSW5kZXgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBpdGVtcyA9IHJlcXVlc3RzQXJyYXkubGVuZ3RoID4gMSA/IHJlc3BvbnNlW292ZXJhbGxJbmRleF0gOiByZXNwb25zZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW1zLmZvckVhY2goKGl0ZW0pID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtID0gaXRlbVswXSB8fCBpdGVtO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICFyZXN1bHRbZW50aXR5VHlwZV0gJiYgKHJlc3VsdFtlbnRpdHlUeXBlXSA9IFtdKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZW50aXR5VHlwZSA9PT0gXCJ3b3JrSG9saWRheXNcIiAmJiAoIWl0ZW0uaG9saWRheUdyb3VwIHx8IGVudGl0aWVzTGlzdC53b3JrSG9saWRheXMuaW5kZXhPZihpdGVtLmhvbGlkYXlHcm91cC5ncm91cElkKSA9PT0gLTEpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGVudGl0eVR5cGUgPT09IFwic2VjdXJpdHlHcm91cHNcIikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZW50aXRpZXNMaXN0LnNlY3VyaXR5R3JvdXBzLmluZGV4T2YoaXRlbS5pZCkgPiAtMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0W2VudGl0eVR5cGVdID0gcmVzdWx0W2VudGl0eVR5cGVdLmNvbmNhdCh0aGlzLmdyb3Vwc0J1aWxkZXIuZ2V0Q3VzdG9tR3JvdXBzRGF0YShlbnRpdGllc0xpc3Quc2VjdXJpdHlHcm91cHMsIGl0ZW1zKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGVudGl0eVR5cGUgPT09IFwidXNlcnNcIikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtLnVzZXJBdXRoZW50aWNhdGlvblR5cGUgPSBcIkJhc2ljQXV0aGVudGljYXRpb25cIjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGVudGl0eURlcGVuZGVuY2llcyA9IHRoaXMuZ2V0RW50aXR5RGVwZW5kZW5jaWVzKGl0ZW0sIGVudGl0eVR5cGUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld0RlcGVuZGVuY2llcyA9IHRoaXMuYXBwbHlUb0VudGl0aWVzKGVudGl0eURlcGVuZGVuY2llcywgbmV3RGVwZW5kZW5jaWVzLCAocmVzdWx0LCBlbnRpdHlJZCwgZW50aXR5VHlwZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAhcmVzdWx0W2VudGl0eVR5cGVdICYmIChyZXN1bHRbZW50aXR5VHlwZV0gPSBbXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdFtlbnRpdHlUeXBlXSA9IG1lcmdlVW5pcXVlKHJlc3VsdFtlbnRpdHlUeXBlXSwgW2VudGl0eUlkXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3R3JvdXBzID0gbmV3R3JvdXBzLmNvbmNhdChuZXdEZXBlbmRlbmNpZXMuZ3JvdXBzIHx8IFtdKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdDdXN0b21NYXBzID0gbmV3Q3VzdG9tTWFwcy5jb25jYXQobmV3RGVwZW5kZW5jaWVzLmN1c3RvbU1hcHMgfHwgW10pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBuZXdEZXBlbmRlbmNpZXMuZ3JvdXBzO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBuZXdEZXBlbmRlbmNpZXMuY3VzdG9tTWFwcztcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHRbZW50aXR5VHlwZV0ucHVzaChpdGVtKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3RGVwZW5kZW5jaWVzID0gT2JqZWN0LmtleXMobmV3RGVwZW5kZW5jaWVzKS5yZWR1Y2UoKHJlc3VsdCwgZGVwZW5kZW5jeU5hbWUpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGVudGl0aWVzID0gbmV3RGVwZW5kZW5jaWVzW2RlcGVuZGVuY3lOYW1lXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4cG9ydGVkID0gKGV4cG9ydGVkRGF0YVtkZXBlbmRlbmN5TmFtZV0gfHwgW10pLm1hcChlbnRpdHkgPT4gZW50aXR5LmlkKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZW50aXRpZXMuZm9yRWFjaChlbnRpdHlJZCA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXhwb3J0ZWQuaW5kZXhPZihlbnRpdHlJZCkgPT09IC0xKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIXJlc3VsdFtkZXBlbmRlbmN5TmFtZV0gJiYgKHJlc3VsdFtkZXBlbmRlbmN5TmFtZV0gPSBbXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0W2RlcGVuZGVuY3lOYW1lXS5wdXNoKGVudGl0eUlkKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwge30gYXMgSUltcG9ydERhdGEpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFJlbW92ZSBidWlsdC1pbiBzZWN1cml0eSBncm91cHNcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBleHBvcnRlZERhdGEuc2VjdXJpdHlHcm91cHMgJiYgKGV4cG9ydGVkRGF0YS5zZWN1cml0eUdyb3VwcyA9IGV4cG9ydGVkRGF0YS5zZWN1cml0eUdyb3Vwcy5yZWR1Y2UoKHJlc3VsdCwgZ3JvdXApID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ3JvdXAuaWQuaW5kZXhPZihcIkdyb3VwXCIpID09PSAtMSAmJiByZXN1bHQucHVzaChncm91cCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwgW10pKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZE5ld0dyb3VwcyhuZXdHcm91cHMsIGRhdGEpLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZE5ld0N1c3RvbU1hcHMobmV3Q3VzdG9tTWFwcywgZGF0YSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIE9iamVjdC5rZXlzKGV4cG9ydGVkRGF0YSkuZm9yRWFjaCgoZW50aXR5VHlwZTogc3RyaW5nKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhW2VudGl0eVR5cGVdID0gbWVyZ2VVbmlxdWVFbnRpdGllcyhkYXRhW2VudGl0eVR5cGVdLCBleHBvcnRlZERhdGFbZW50aXR5VHlwZV0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKE9iamVjdC5rZXlzKG5ld0RlcGVuZGVuY2llcykubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHRoaXMucmVzb2x2ZURlcGVuZGVuY2llcyhuZXdEZXBlbmRlbmNpZXMsIGRhdGEpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoZGF0YSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LCByZWplY3QpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwgcmVqZWN0KTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZTxJSW1wb3J0RGF0YT4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgICAgICByZXR1cm4gZ2V0RGF0YShkZXBlbmRlbmNpZXMpLnRoZW4ocmVzb2x2ZSkuY2F0Y2gocmVqZWN0KTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFib3J0Q3VycmVudFRhc2sgKCkge1xyXG4gICAgICAgIHRoaXMudG9nZ2xlV2FpdGluZygpO1xyXG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgJiYgdGhpcy5jdXJyZW50VGFzay5hYm9ydCAmJiB0aGlzLmN1cnJlbnRUYXNrLmFib3J0KCk7XHJcbiAgICAgICAgdGhpcy5jdXJyZW50VGFzayA9IG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSB0b2dnbGVFeHBvcnRCdXR0b24gKGlzRGlzYWJsZWQ6IGJvb2xlYW4pIHtcclxuICAgICAgICAoPEhUTUxJbnB1dEVsZW1lbnQ+dGhpcy5leHBvcnRCdG4pLmRpc2FibGVkID0gaXNEaXNhYmxlZDtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IHRvZ2dsZVdhaXRpbmcgPSAoaXNTdGFydCA9IGZhbHNlKSA9PiB7XHJcbiAgICAgICAgaWYgKGlzU3RhcnQpIHtcclxuICAgICAgICAgICAgdGhpcy50b2dnbGVFeHBvcnRCdXR0b24odHJ1ZSk7XHJcbiAgICAgICAgICAgIHRoaXMud2FpdGluZy5zdGFydChkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImFkZGluQ29udGFpbmVyXCIpLnBhcmVudEVsZW1lbnQsIDk5OTkpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMudG9nZ2xlRXhwb3J0QnV0dG9uKGZhbHNlKTtcclxuICAgICAgICAgICAgdGhpcy53YWl0aW5nLnN0b3AoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy9CcmV0dCAtIGRpc3BsYXlzIHRoZSBvdXRwdXQgb24gdGhlIHBhZ2VcclxuICAgIHByaXZhdGUgc2hvd0VudGl0eU1lc3NhZ2UgKGJsb2NrOiBIVE1MRWxlbWVudCwgcXR5OiBudW1iZXIsIGVudGl0eU5hbWU6IHN0cmluZykge1xyXG4gICAgICAgIGxldCBibG9ja0VsID0gYmxvY2sucXVlcnlTZWxlY3RvcihcIi5kZXNjcmlwdGlvblwiKTtcclxuICAgICAgICBpZiAocXR5KSB7XHJcbiAgICAgICAgICAgIHF0eSA+IDEgJiYgKGVudGl0eU5hbWUgKz0gXCJzXCIpO1xyXG4gICAgICAgICAgICBsZXQgaGFzSXRlbXNNZXNzYWdlVGVtcGxhdGUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImhhc0l0ZW1zTWVzc2FnZVRlbXBsYXRlXCIpLmlubmVySFRNTDtcclxuICAgICAgICAgICAgYmxvY2tFbC5pbm5lckhUTUwgPSBoYXNJdGVtc01lc3NhZ2VUZW1wbGF0ZS5yZXBsYWNlKFwie3F1YW50aXR5fVwiLCBxdHkudG9TdHJpbmcoKSkucmVwbGFjZShcIntlbnRpdHl9XCIsIGVudGl0eU5hbWUpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGJsb2NrRWwuaW5uZXJIVE1MID0gYFlvdSBoYXZlIDxzcGFuIGNsYXNzPVwiYm9sZFwiPm5vdCBjb25maWd1cmVkIGFueSAkeyBlbnRpdHlOYW1lIH1zPC9zcGFuPi5gO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHNob3dTeXN0ZW1TZXR0aW5nc01lc3NhZ2UgKGJsb2NrOiBIVE1MRWxlbWVudCwgaXNJbmNsdWRlZDogYm9vbGVhbikge1xyXG4gICAgICAgIGxldCBibG9ja0VsID0gYmxvY2sucXVlcnlTZWxlY3RvcihcIi5kZXNjcmlwdGlvblwiKTtcclxuICAgICAgICBpZiAoaXNJbmNsdWRlZCkge1xyXG4gICAgICAgICAgICBibG9ja0VsLmlubmVySFRNTCA9IFwiWW91IGhhdmUgY2hvc2VuIDxzcGFuIGNsYXNzPSdib2xkJz50byBpbmNsdWRlPC9zcGFuPiBzeXN0ZW0gc2V0dGluZ3MuXCI7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgYmxvY2tFbC5pbm5lckhUTUwgPSBcIllvdSBoYXZlIGNob3NlbiA8c3BhbiBjbGFzcz0nYm9sZCc+bm90IHRvIGluY2x1ZGU8L3NwYW4+IHN5c3RlbSBzZXR0aW5ncy5cIjtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy9pZiB0aGUgaW5jbHVkZVRoaXNBZGRpbiBjaGVja2JveCBpcyBjaGFuZ2VkIHdlIGVudGVyIGhlcmVcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgdG9nZ2xlVGhpc0FkZGluSW5jbHVkZWQgPSAoZTogRXZlbnQpID0+IHtcclxuICAgICAgICBsZXQgaXNDaGVja2VkID0gISFlLnRhcmdldCAmJiAhISg8SFRNTElucHV0RWxlbWVudD5lLnRhcmdldCkuY2hlY2tlZDtcclxuICAgICAgICBsZXQgYWRkaW5zQmxvY2s6IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJleHBvcnRlZEFkZGluc1wiKTtcclxuICAgICAgICBsZXQgYWRkaW5zRGF0YSA9IHRoaXMubWlzY0J1aWxkZXIuZ2V0QWRkaW5zRGF0YSghaXNDaGVja2VkKTtcclxuICAgICAgICB0aGlzLnNob3dFbnRpdHlNZXNzYWdlKGFkZGluc0Jsb2NrLCBhZGRpbnNEYXRhLmxlbmd0aCwgXCJhZGRpblwiKTtcclxuICAgICAgICB0aGlzLmRhdGEubWlzYy5hZGRpbnMgPSBhZGRpbnNEYXRhO1xyXG4gICAgfVxyXG5cclxuICAgIC8vaW5pdGlhbGl6ZSBhZGRpbiBcclxuICAgIGNvbnN0cnVjdG9yIChhcGkpIHtcclxuICAgICAgICB0aGlzLmFwaSA9IGFwaTtcclxuICAgICAgICB0aGlzLmdyb3Vwc0J1aWxkZXIgPSBuZXcgR3JvdXBzQnVpbGRlcihhcGkpO1xyXG4gICAgICAgIHRoaXMuc2VjdXJpdHlDbGVhcmFuY2VzQnVpbGRlciA9IG5ldyBTZWN1cml0eUNsZWFyYW5jZXNCdWlsZGVyKGFwaSk7XHJcbiAgICAgICAgdGhpcy5yZXBvcnRzQnVpbGRlciA9IG5ldyBSZXBvcnRzQnVpbGRlcihhcGkpO1xyXG4gICAgICAgIHRoaXMucnVsZXNCdWlsZGVyID0gbmV3IFJ1bGVzQnVpbGRlcihhcGkpO1xyXG4gICAgICAgIHRoaXMuZGlzdHJpYnV0aW9uTGlzdHNCdWlsZGVyID0gbmV3IERpc3RyaWJ1dGlvbkxpc3RzQnVpbGRlcihhcGkpO1xyXG4gICAgICAgIHRoaXMubWlzY0J1aWxkZXIgPSBuZXcgTWlzY0J1aWxkZXIoYXBpKTtcclxuICAgICAgICB0aGlzLnVzZXJCdWlsZGVyID0gbmV3IFVzZXJCdWlsZGVyKGFwaSk7XHJcbiAgICAgICAgdGhpcy56b25lQnVpbGRlciA9IG5ldyBab25lQnVpbGRlcihhcGkpO1xyXG4gICAgICAgIHRoaXMud2FpdGluZyA9IG5ldyBXYWl0aW5nKCk7XHJcbiAgICB9XHJcblxyXG4gICAgLy9CcmV0dDogZXhwb3J0cyB0aGUgZGF0YVxyXG4gICAgZXhwb3J0RGF0YSA9ICgpID0+IHtcclxuICAgICAgICB0aGlzLnRvZ2dsZVdhaXRpbmcodHJ1ZSk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMucmVwb3J0c0J1aWxkZXIuZ2V0RGF0YSgpLnRoZW4oKHJlcG9ydHNEYXRhKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuZGF0YS5yZXBvcnRzID0gcmVwb3J0c0RhdGE7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHRoaXMuZGF0YSk7XHJcbiAgICAgICAgICAgIGRvd25sb2FkRGF0YUFzRmlsZShKU09OLnN0cmluZ2lmeSh0aGlzLmRhdGEpLCBcImV4cG9ydC5qc29uXCIpO1xyXG4gICAgICAgIH0pLmNhdGNoKChlKSA9PiB7XHJcbiAgICAgICAgICAgIGFsZXJ0KFwiQ2FuJ3QgZXhwb3J0IGRhdGEuXFxuUGxlYXNlIHRyeSBhZ2FpbiBsYXRlci5cIik7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XHJcbiAgICAgICAgfSkuZmluYWxseSgoKSA9PiB0aGlzLnRvZ2dsZVdhaXRpbmcoKSk7XHJcbiAgICB9XHJcblxyXG4gICAgc2F2ZUNoYW5nZXMgPSAoKSA9PiB7XHJcbiAgICAgICAgdGhpcy5yZW5kZXIoKTtcclxuICAgICAgICAoPEhUTUxJbnB1dEVsZW1lbnQ+dGhpcy5leHBvcnRCdG4pLmRpc2FibGVkID0gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgY2hlY2tCb3hWYWx1ZUNoYW5nZWQgPSAoKSA9PiB7XHJcbiAgICAgICAgKDxIVE1MSW5wdXRFbGVtZW50PnRoaXMuZXhwb3J0QnRuKS5kaXNhYmxlZCA9IHRydWU7XHJcbiAgICB9XHJcblxyXG4gICAgYWRkRXZlbnRIYW5kbGVycygpIHtcclxuICAgICAgICB0aGlzLmV4cG9ydEJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5leHBvcnREYXRhLCBmYWxzZSk7XHJcbiAgICAgICAgdGhpcy5zYXZlQnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLnNhdmVDaGFuZ2VzLCBmYWxzZSk7XHJcbiAgICAgICAgdGhpcy5leHBvcnRBbGxBZGRpbnNDaGVja2JveC5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsIHRoaXMuY2hlY2tCb3hWYWx1ZUNoYW5nZWQsIGZhbHNlKTtcclxuICAgICAgICB0aGlzLmV4cG9ydEFsbFpvbmVzQ2hlY2tib3guYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCB0aGlzLmNoZWNrQm94VmFsdWVDaGFuZ2VkLCBmYWxzZSk7XHJcbiAgICAgICAgdGhpcy5leHBvcnRTeXN0ZW1TZXR0aW5nc0NoZWNrYm94LmFkZEV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgdGhpcy5jaGVja0JveFZhbHVlQ2hhbmdlZCwgZmFsc2UpO1xyXG4gICAgfVxyXG5cclxuICAgIHJlbmRlciAoKSB7XHJcbiAgICAgICAgdGhpcy5kYXRhLnVzZXJzID0gW107XHJcbiAgICAgICAgdGhpcy5kYXRhLnpvbmVzID0gW107XHJcbiAgICAgICAgdGhpcy5zZXRBZGRpbnNUb051bGwoKTtcclxuICAgICAgICAvL3dpcmUgdXAgdGhlIGRvbVxyXG4gICAgICAgIGxldCBtYXBNZXNzYWdlVGVtcGxhdGU6IHN0cmluZyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibWFwTWVzc2FnZVRlbXBsYXRlXCIpLmlubmVySFRNTCxcclxuICAgICAgICAgICAgZ3JvdXBzQmxvY2s6IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJleHBvcnRlZEdyb3Vwc1wiKSxcclxuICAgICAgICAgICAgc2VjdXJpdHlDbGVhcmFuY2VzQmxvY2s6IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJleHBvcnRlZFNlY3VyaXR5Q2xlYXJhbmNlc1wiKSxcclxuICAgICAgICAgICAgcnVsZXNCbG9jazogSFRNTEVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImV4cG9ydGVkUnVsZXNcIiksXHJcbiAgICAgICAgICAgIHJlcG9ydHNCbG9jazogSFRNTEVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImV4cG9ydGVkUmVwb3J0c1wiKSxcclxuICAgICAgICAgICAgZGFzaGJvYXJkc0Jsb2NrOiBIVE1MRWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZXhwb3J0ZWREYXNoYm9hcmRzXCIpLFxyXG4gICAgICAgICAgICBhZGRpbnNCbG9jazogSFRNTEVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImV4cG9ydGVkQWRkaW5zXCIpLFxyXG4gICAgICAgICAgICBtYXBCbG9ja0Rlc2NyaXB0aW9uOiBIVE1MRWxlbWVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjZXhwb3J0ZWRNYXAgPiAuZGVzY3JpcHRpb25cIiksXHJcbiAgICAgICAgICAgIHVzZXJzQmxvY2s6IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJleHBvcnRlZFVzZXJzXCIpLFxyXG4gICAgICAgICAgICB6b25lc0Jsb2NrOiBIVE1MRWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZXhwb3J0ZWRab25lc1wiKSxcclxuICAgICAgICAgICAgc3lzdGVtU2V0dGluZ3NCbG9jazogSFRNTEVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImV4cG9ydFN5c3RlbVNldHRpbmdzXCIpO1xyXG4gICAgICAgIHRoaXMudG9nZ2xlV2FpdGluZyh0cnVlKTtcclxuICAgICAgICByZXR1cm4gdG9nZXRoZXIoW1xyXG4gICAgICAgICAgICAvL2xvYWRzIHRoZSBncm91cHMuIFRoaXMgaXMgd2hlcmUgdXNlcnMgYXJlIGFkZGVkIGlmIHRoZXkgYXJlIGxpbmtlZCB0byBhIGdyb3VwXHJcbiAgICAgICAgICAgIHRoaXMuZ3JvdXBzQnVpbGRlci5mZXRjaCgpLFxyXG4gICAgICAgICAgICAvL2xvYWRzIHRoZSBzZWN1cml0eSBncm91cHMgKHNlY3VyaXR5IGNsZWFyYW5jZSBpbiB1c2VyIGFkbWluIGluIE15RylcclxuICAgICAgICAgICAgdGhpcy5zZWN1cml0eUNsZWFyYW5jZXNCdWlsZGVyLmZldGNoKCksXHJcbiAgICAgICAgICAgIC8vcmVwb3J0IGxvYWRlci4uLnNlZW1zIG9ic29sZXRlIHRvIG1lXHJcbiAgICAgICAgICAgIHRoaXMucmVwb3J0c0J1aWxkZXIuZmV0Y2goKSxcclxuICAgICAgICAgICAgdGhpcy5ydWxlc0J1aWxkZXIuZmV0Y2goKSxcclxuICAgICAgICAgICAgdGhpcy5kaXN0cmlidXRpb25MaXN0c0J1aWxkZXIuZmV0Y2goKSxcclxuICAgICAgICAgICAgLy9taXNjID0gc3lzdGVtIHNldHRpbmdzXHJcbiAgICAgICAgICAgIHRoaXMubWlzY0J1aWxkZXIuZmV0Y2godGhpcy5leHBvcnRTeXN0ZW1TZXR0aW5nc0NoZWNrYm94LmNoZWNrZWQpLFxyXG4gICAgICAgICAgICB0aGlzLnVzZXJCdWlsZGVyLmZldGNoKCksXHJcbiAgICAgICAgICAgIHRoaXMuem9uZUJ1aWxkZXIuZmV0Y2goKVxyXG4gICAgICAgIF0pLnRoZW4oKHJlc3VsdHMpID0+IHtcclxuICAgICAgICAgICAgbGV0IHJlcG9ydHNEZXBlbmRlbmNpZXM6IElEZXBlbmRlbmNpZXMsXHJcbiAgICAgICAgICAgICAgICBydWxlc0RlcGVuZGVuY2llczogSURlcGVuZGVuY2llcyxcclxuICAgICAgICAgICAgICAgIGRpc3RyaWJ1dGlvbkxpc3RzRGVwZW5kZW5jaWVzOiBJRGVwZW5kZW5jaWVzLFxyXG4gICAgICAgICAgICAgICAgZGVwZW5kZW5jaWVzOiBJRGVwZW5kZW5jaWVzLFxyXG4gICAgICAgICAgICAgICAgY3VzdG9tTWFwO1xyXG4gICAgICAgICAgICB0aGlzLmRhdGEuZ3JvdXBzID0gcmVzdWx0c1swXTtcclxuICAgICAgICAgICAgdGhpcy5kYXRhLnNlY3VyaXR5R3JvdXBzID0gcmVzdWx0c1sxXTtcclxuICAgICAgICAgICAgdGhpcy5kYXRhLnJlcG9ydHMgPSByZXN1bHRzWzJdO1xyXG4gICAgICAgICAgICB0aGlzLmRhdGEucnVsZXMgPSByZXN1bHRzWzNdO1xyXG4gICAgICAgICAgICB0aGlzLmRhdGEuZGlzdHJpYnV0aW9uTGlzdHMgPSB0aGlzLmRpc3RyaWJ1dGlvbkxpc3RzQnVpbGRlci5nZXRSdWxlc0Rpc3RyaWJ1dGlvbkxpc3RzKHRoaXMuZGF0YS5ydWxlcy5tYXAocnVsZSA9PiBydWxlLmlkKSk7XHJcbiAgICAgICAgICAgIHRoaXMuZGF0YS5taXNjID0gcmVzdWx0c1s1XTtcclxuICAgICAgICAgICAgbGV0IGdldERlcGVuZGVuY2llcyA9IChlbnRpdGllczogYW55W10sIGVudGl0eVR5cGU6IHN0cmluZykgPT4ge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGVudGl0aWVzLnJlZHVjZSgocmVzLCBlbnRpdHkpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgZW50aXR5RGVwID0gdGhpcy5nZXRFbnRpdHlEZXBlbmRlbmNpZXMoZW50aXR5LCBlbnRpdHlUeXBlKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5jb21iaW5lRGVwZW5kZW5jaWVzKHJlcywgZW50aXR5RGVwKTtcclxuICAgICAgICAgICAgICAgIH0sIHt9KTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgbGV0IHpvbmVEZXBlbmRlbmNpZXMgPSB7fTtcclxuICAgICAgICAgICAgaWYodGhpcy5leHBvcnRBbGxab25lc0NoZWNrYm94LmNoZWNrZWQ9PXRydWUpe1xyXG4gICAgICAgICAgICAgICAgLy9zZXRzIGV4cG9ydGVkIHpvbmVzIHRvIGFsbCBkYXRhYmFzZSB6b25lc1xyXG4gICAgICAgICAgICAgICAgdGhpcy5kYXRhLnpvbmVzID0gcmVzdWx0c1s3XTtcclxuICAgICAgICAgICAgICAgIHpvbmVEZXBlbmRlbmNpZXMgPSBnZXREZXBlbmRlbmNpZXMocmVzdWx0c1s3XSwgXCJab25lXCIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmKHRoaXMuZXhwb3J0QWxsQWRkaW5zQ2hlY2tib3guY2hlY2tlZD09ZmFsc2Upe1xyXG4gICAgICAgICAgICAgICAgLy9zZXRzIGV4cG9ydGVkIGFkZGlucyBlcXVhbCB0byBub25lL2VtcHR5IGFycmF5XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNldEFkZGluc1RvTnVsbCgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGN1c3RvbU1hcCA9IHRoaXMubWlzY0J1aWxkZXIuZ2V0TWFwUHJvdmlkZXJEYXRhKHRoaXMuZGF0YS5taXNjLm1hcFByb3ZpZGVyLnZhbHVlKTtcclxuICAgICAgICAgICAgY3VzdG9tTWFwICYmIHRoaXMuZGF0YS5jdXN0b21NYXBzLnB1c2goY3VzdG9tTWFwKTtcclxuICAgICAgICAgICAgcmVwb3J0c0RlcGVuZGVuY2llcyA9IHRoaXMucmVwb3J0c0J1aWxkZXIuZ2V0RGVwZW5kZW5jaWVzKHRoaXMuZGF0YS5yZXBvcnRzKTtcclxuICAgICAgICAgICAgcnVsZXNEZXBlbmRlbmNpZXMgPSB0aGlzLnJ1bGVzQnVpbGRlci5nZXREZXBlbmRlbmNpZXModGhpcy5kYXRhLnJ1bGVzKTtcclxuICAgICAgICAgICAgZGlzdHJpYnV0aW9uTGlzdHNEZXBlbmRlbmNpZXMgPSB0aGlzLmRpc3RyaWJ1dGlvbkxpc3RzQnVpbGRlci5nZXREZXBlbmRlbmNpZXModGhpcy5kYXRhLmRpc3RyaWJ1dGlvbkxpc3RzKTtcclxuICAgICAgICAgICAgZGVwZW5kZW5jaWVzID0gdGhpcy5jb21iaW5lRGVwZW5kZW5jaWVzKHpvbmVEZXBlbmRlbmNpZXMsIHJlcG9ydHNEZXBlbmRlbmNpZXMsIHJ1bGVzRGVwZW5kZW5jaWVzLCBkaXN0cmlidXRpb25MaXN0c0RlcGVuZGVuY2llcyk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnJlc29sdmVEZXBlbmRlbmNpZXMoZGVwZW5kZW5jaWVzLCB0aGlzLmRhdGEpO1xyXG4gICAgICAgIH0pLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgICAgICBsZXQgbWFwUHJvdmlkZXIgPSB0aGlzLm1pc2NCdWlsZGVyLmdldE1hcFByb3ZpZGVyTmFtZSh0aGlzLmRhdGEubWlzYy5tYXBQcm92aWRlci52YWx1ZSk7XHJcbiAgICAgICAgICAgIHRoaXMuc2hvd0VudGl0eU1lc3NhZ2UoZ3JvdXBzQmxvY2ssIHRoaXMuZGF0YS5ncm91cHMubGVuZ3RoIC0gMSwgXCJncm91cFwiKTtcclxuICAgICAgICAgICAgdGhpcy5zaG93RW50aXR5TWVzc2FnZShzZWN1cml0eUNsZWFyYW5jZXNCbG9jaywgdGhpcy5kYXRhLnNlY3VyaXR5R3JvdXBzLmxlbmd0aCwgXCJzZWN1cml0eSBjbGVhcmFuY2VcIik7XHJcbiAgICAgICAgICAgIHRoaXMuc2hvd0VudGl0eU1lc3NhZ2UocnVsZXNCbG9jaywgdGhpcy5kYXRhLnJ1bGVzLmxlbmd0aCwgXCJydWxlXCIpO1xyXG4gICAgICAgICAgICB0aGlzLnNob3dFbnRpdHlNZXNzYWdlKHJlcG9ydHNCbG9jaywgdGhpcy5yZXBvcnRzQnVpbGRlci5nZXRDdXN0b21pemVkUmVwb3J0c1F0eSgpLCBcInJlcG9ydFwiKTtcclxuICAgICAgICAgICAgdGhpcy5zaG93RW50aXR5TWVzc2FnZShkYXNoYm9hcmRzQmxvY2ssIHRoaXMucmVwb3J0c0J1aWxkZXIuZ2V0RGFzaGJvYXJkc1F0eSgpLCBcImRhc2hib2FyZFwiKTtcclxuICAgICAgICAgICAgbWFwUHJvdmlkZXIgJiYgKG1hcEJsb2NrRGVzY3JpcHRpb24uaW5uZXJIVE1MID0gbWFwTWVzc2FnZVRlbXBsYXRlLnJlcGxhY2UoXCJ7bWFwUHJvdmlkZXJ9XCIsIG1hcFByb3ZpZGVyKSk7XHJcbiAgICAgICAgICAgIHRoaXMuc2hvd0VudGl0eU1lc3NhZ2UoYWRkaW5zQmxvY2ssIHRoaXMuZGF0YS5taXNjLmFkZGlucy5sZW5ndGgsIFwiYWRkaW5cIik7XHJcbiAgICAgICAgICAgIC8vIHRoaXMubWlzY0J1aWxkZXIuaXNUaGlzQWRkaW5JbmNsdWRlZCgpICYmIHRoaXNBZGRpbkJsb2NrLmNsYXNzTGlzdC5yZW1vdmUoXCJoaWRkZW5cIik7XHJcbiAgICAgICAgICAgIHRoaXMuc2hvd0VudGl0eU1lc3NhZ2UodXNlcnNCbG9jaywgdGhpcy5kYXRhLnVzZXJzLmxlbmd0aCwgXCJ1c2VyXCIpO1xyXG4gICAgICAgICAgICB0aGlzLnNob3dFbnRpdHlNZXNzYWdlKHpvbmVzQmxvY2ssIHRoaXMuZGF0YS56b25lcy5sZW5ndGgsIFwiem9uZVwiKTtcclxuICAgICAgICAgICAgdGhpcy5zaG93U3lzdGVtU2V0dGluZ3NNZXNzYWdlKHN5c3RlbVNldHRpbmdzQmxvY2ssIHRoaXMuZXhwb3J0U3lzdGVtU2V0dGluZ3NDaGVja2JveC5jaGVja2VkKTtcclxuICAgICAgICAgICAgLy90aGlzIGRpc3BsYXlzIGFsbCB0aGUgZGF0YS9vYmplY3RzIGluIHRoZSBjb25zb2xlXHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHRoaXMuZGF0YSk7XHJcbiAgICAgICAgfSkuY2F0Y2goKGUpID0+IHtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlKTtcclxuICAgICAgICAgICAgYWxlcnQoXCJDYW4ndCBnZXQgY29uZmlnIHRvIGV4cG9ydFwiKTtcclxuICAgICAgICB9KS5maW5hbGx5KCgpID0+IHRoaXMudG9nZ2xlV2FpdGluZygpKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHNldEFkZGluc1RvTnVsbCgpIHtcclxuICAgICAgICBpZiAoKHRoaXMuZGF0YS5taXNjICE9IG51bGwpIHx8ICh0aGlzLmRhdGEubWlzYyAhPSB1bmRlZmluZWQpKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZGF0YS5taXNjLmFkZGlucyA9IFtdO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICB1bmxvYWQgKCkge1xyXG4gICAgICAgIHRoaXMuYWJvcnRDdXJyZW50VGFzaygpO1xyXG4gICAgICAgIHRoaXMuZ3JvdXBzQnVpbGRlci51bmxvYWQoKTtcclxuICAgICAgICB0aGlzLnNlY3VyaXR5Q2xlYXJhbmNlc0J1aWxkZXIudW5sb2FkKCk7XHJcbiAgICAgICAgdGhpcy5yZXBvcnRzQnVpbGRlci51bmxvYWQoKTtcclxuICAgICAgICB0aGlzLnJ1bGVzQnVpbGRlci51bmxvYWQoKTtcclxuICAgICAgICB0aGlzLmRpc3RyaWJ1dGlvbkxpc3RzQnVpbGRlci51bmxvYWQoKTtcclxuICAgICAgICB0aGlzLm1pc2NCdWlsZGVyLnVubG9hZCgpO1xyXG4gICAgICAgIHRoaXMuZXhwb3J0QnRuLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLmV4cG9ydERhdGEsIGZhbHNlKTtcclxuICAgICAgICB0aGlzLnNhdmVCdG4ucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMuc2F2ZUNoYW5nZXMsIGZhbHNlKTtcclxuICAgICAgICB0aGlzLmV4cG9ydEFsbEFkZGluc0NoZWNrYm94LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgdGhpcy5jaGVja0JveFZhbHVlQ2hhbmdlZCwgZmFsc2UpO1xyXG4gICAgICAgIHRoaXMuZXhwb3J0QWxsWm9uZXNDaGVja2JveC5yZW1vdmVFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsIHRoaXMuY2hlY2tCb3hWYWx1ZUNoYW5nZWQsIGZhbHNlKTtcclxuICAgICAgICB0aGlzLmV4cG9ydFN5c3RlbVNldHRpbmdzQ2hlY2tib3gucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCB0aGlzLmNoZWNrQm94VmFsdWVDaGFuZ2VkLCBmYWxzZSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmdlb3RhYi5hZGRpbi5yZWdpc3RyYXRpb25Db25maWcgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICBsZXQgYWRkaW46IEFkZGluO1xyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgaW5pdGlhbGl6ZTogKGFwaSwgc3RhdGUsIGNhbGxiYWNrKSA9PiB7XHJcbiAgICAgICAgICAgIGFkZGluID0gbmV3IEFkZGluKGFwaSk7XHJcbiAgICAgICAgICAgIGFkZGluLmFkZEV2ZW50SGFuZGxlcnMoKTtcclxuICAgICAgICAgICAgY2FsbGJhY2soKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIGZvY3VzOiAoKSA9PiB7XHJcbiAgICAgICAgICAgIGFkZGluLnJlbmRlcigpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgYmx1cjogKCkgPT4ge1xyXG4gICAgICAgICAgICBhZGRpbi51bmxvYWQoKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG59OyIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi9ibHVlYmlyZC5kLnRzXCIvPlxyXG5pbXBvcnQge2VudGl0eVRvRGljdGlvbmFyeSwgbWVyZ2VVbmlxdWV9IGZyb20gXCIuL3V0aWxzXCI7XHJcblxyXG4vL0EgZGlzdHJpYnV0aW9uIGxpc3QgbGlua3MgYSBzZXQgb2YgUnVsZShzKSB0byBhIHNldCBvZiBSZWNpcGllbnQocykuIFdoZW4gYSBSdWxlIGlzIHZpb2xhdGVkIGVhY2ggcmVsYXRlZCBSZWNpcGllbnQgd2lsbCByZWNlaXZlIGEgbm90aWZpY2F0aW9uIG9mIHRoZSBraW5kIGRlZmluZWQgYnkgaXRzIFJlY2lwaWVudFR5cGUuXHJcbmludGVyZmFjZSBJRGlzdHJpYnV0aW9uTGlzdCB7XHJcbiAgICBpZDogc3RyaW5nO1xyXG4gICAgbmFtZTogc3RyaW5nO1xyXG4gICAgcmVjaXBpZW50czogYW55W107XHJcbiAgICBydWxlczogYW55W107XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgSURpc3RyaWJ1dGlvbkxpc3REZXBlbmRlbmNpZXMge1xyXG4gICAgcnVsZXM/OiBhbnlbXTtcclxuICAgIHVzZXJzPzogYW55W107XHJcbiAgICBub3RpZmljYXRpb25UZW1wbGF0ZXM/OiBhbnlbXTtcclxuICAgIGdyb3Vwcz86IGFueVtdO1xyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBEaXN0cmlidXRpb25MaXN0c0J1aWxkZXIge1xyXG4gICAgcHJpdmF0ZSBhcGk7XHJcbiAgICBwcml2YXRlIGN1cnJlbnRUYXNrO1xyXG4gICAgcHJpdmF0ZSBkaXN0cmlidXRpb25MaXN0cztcclxuICAgIHByaXZhdGUgbm90aWZpY2F0aW9uVGVtcGxhdGVzO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKGFwaSkge1xyXG4gICAgICAgIHRoaXMuYXBpID0gYXBpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vQSBkaXN0cmlidXRpb24gbGlzdCBsaW5rcyBhIHNldCBvZiBSdWxlKHMpIHRvIGEgc2V0IG9mIFJlY2lwaWVudChzKS4gV2hlbiBhIFJ1bGUgaXMgdmlvbGF0ZWQgZWFjaCByZWxhdGVkIFJlY2lwaWVudCB3aWxsIHJlY2VpdmUgYSBub3RpZmljYXRpb24gb2YgdGhlIGtpbmQgZGVmaW5lZCBieSBpdHMgUmVjaXBpZW50VHlwZS5cclxuICAgIHByaXZhdGUgZ2V0RGlzdHJpYnV0aW9uTGlzdHNEYXRhICgpOiBQcm9taXNlPGFueT4ge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuYXBpLm11bHRpQ2FsbChbXHJcbiAgICAgICAgICAgICAgICBbXCJHZXRcIiwge1xyXG4gICAgICAgICAgICAgICAgICAgIFwidHlwZU5hbWVcIjogXCJEaXN0cmlidXRpb25MaXN0XCIsXHJcbiAgICAgICAgICAgICAgICB9XSxcclxuICAgICAgICAgICAgICAgIFtcIkdldE5vdGlmaWNhdGlvbldlYlJlcXVlc3RUZW1wbGF0ZXNcIiwge31dLFxyXG4gICAgICAgICAgICAgICAgW1wiR2V0Tm90aWZpY2F0aW9uRW1haWxUZW1wbGF0ZXNcIiwge31dLFxyXG4gICAgICAgICAgICAgICAgW1wiR2V0Tm90aWZpY2F0aW9uVGV4dFRlbXBsYXRlc1wiLCB7fV1cclxuICAgICAgICAgICAgXSwgcmVzb2x2ZSwgcmVqZWN0KTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgcHJpdmF0ZSBhYm9ydEN1cnJlbnRUYXNrICgpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrICYmIHRoaXMuY3VycmVudFRhc2suYWJvcnQgJiYgdGhpcy5jdXJyZW50VGFzay5hYm9ydCgpO1xyXG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgPSBudWxsO1xyXG4gICAgfTtcclxuXHJcbiAgICBwdWJsaWMgZ2V0RGVwZW5kZW5jaWVzIChkaXN0cmlidXRpb25MaXN0cyk6IElEaXN0cmlidXRpb25MaXN0RGVwZW5kZW5jaWVzIHtcclxuICAgICAgICBsZXQgZGVwZW5kZW5jaWVzOiBJRGlzdHJpYnV0aW9uTGlzdERlcGVuZGVuY2llcyA9IHtcclxuICAgICAgICAgICAgICAgIHJ1bGVzOiBbXSxcclxuICAgICAgICAgICAgICAgIHVzZXJzOiBbXSxcclxuICAgICAgICAgICAgICAgIGdyb3VwczogW10sXHJcbiAgICAgICAgICAgICAgICBub3RpZmljYXRpb25UZW1wbGF0ZXM6IFtdXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHByb2Nlc3NEZXBlbmRlbmNpZXMgPSAocmVjaXBpZW50KSA9PiB7XHJcbiAgICAgICAgICAgICAgICBsZXQgaWQsIHR5cGU6IHN0cmluZyxcclxuICAgICAgICAgICAgICAgICAgICB1c2VySWQgPSByZWNpcGllbnQudXNlci5pZDtcclxuICAgICAgICAgICAgICAgIHVzZXJJZCAmJiBkZXBlbmRlbmNpZXMudXNlcnMuaW5kZXhPZih1c2VySWQpID09PSAtMSAmJiBkZXBlbmRlbmNpZXMudXNlcnMucHVzaCh1c2VySWQpO1xyXG4gICAgICAgICAgICAgICAgc3dpdGNoIChyZWNpcGllbnQucmVjaXBpZW50VHlwZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJFbWFpbFwiOlxyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJMb2dQb3B1cFwiOlxyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJMb2dVcmdlbnRQb3B1cFwiOlxyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJMb2dPbmx5XCI6XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIlRleHRNZXNzYWdlXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIlRleHRUb1NwZWVjaEFsbG93RGVsYXlcIjpcclxuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiV2ViUmVxdWVzdFwiOlxyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJUZXh0VG9TcGVlY2hcIjpcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWQgPSByZWNpcGllbnQubm90aWZpY2F0aW9uQmluYXJ5RmlsZSAmJiByZWNpcGllbnQubm90aWZpY2F0aW9uQmluYXJ5RmlsZS5pZDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZSA9IFwibm90aWZpY2F0aW9uVGVtcGxhdGVzXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJBc3NpZ25Ub0dyb3VwXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkID0gcmVjaXBpZW50Lmdyb3VwICYmIHJlY2lwaWVudC5ncm91cC5pZDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZSA9IFwiZ3JvdXBzXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWQgJiYgdHlwZSAmJiBkZXBlbmRlbmNpZXNbdHlwZV0uaW5kZXhPZihpZCkgPT09IC0xICYmIGRlcGVuZGVuY2llc1t0eXBlXS5wdXNoKGlkKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgY2hlY2tSZWNpcGllbnRzID0gKHJlY2lwaWVudHMsIGRlcGVuZGVuY2llczogSURpc3RyaWJ1dGlvbkxpc3REZXBlbmRlbmNpZXMpOiBJRGlzdHJpYnV0aW9uTGlzdERlcGVuZGVuY2llcyA9PiB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVjaXBpZW50cy5yZWR1Y2UoKGRlcGVuZGVuY2llcywgcmVjaXBpZW50KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgcHJvY2Vzc0RlcGVuZGVuY2llcyhyZWNpcGllbnQpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBkZXBlbmRlbmNpZXM7XHJcbiAgICAgICAgICAgICAgICB9LCBkZXBlbmRlbmNpZXMpO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIHJldHVybiBkaXN0cmlidXRpb25MaXN0cy5yZWR1Y2UoKGRlcGVuZGVuY2llczogSURpc3RyaWJ1dGlvbkxpc3REZXBlbmRlbmNpZXMsIGRpc3RyaWJ1dGlvbkxpc3Q6IElEaXN0cmlidXRpb25MaXN0KSA9PiB7XHJcbiAgICAgICAgICAgIGRlcGVuZGVuY2llcy5ydWxlcyA9IG1lcmdlVW5pcXVlKGRlcGVuZGVuY2llcy5ydWxlcywgZGlzdHJpYnV0aW9uTGlzdC5ydWxlcy5tYXAocnVsZSA9PiBydWxlLmlkKSk7XHJcbiAgICAgICAgICAgIGRlcGVuZGVuY2llcyA9IGNoZWNrUmVjaXBpZW50cyhkaXN0cmlidXRpb25MaXN0LnJlY2lwaWVudHMsIGRlcGVuZGVuY2llcyk7XHJcbiAgICAgICAgICAgIHJldHVybiBkZXBlbmRlbmNpZXM7XHJcbiAgICAgICAgfSwgZGVwZW5kZW5jaWVzKTtcclxuICAgIH07XHJcblxyXG4gICAgcHVibGljIGZldGNoKCk6IFByb21pc2U8YW55PiB7XHJcbiAgICAgICAgdGhpcy5hYm9ydEN1cnJlbnRUYXNrKCk7XHJcbiAgICAgICAgdGhpcy5jdXJyZW50VGFzayA9IHRoaXMuZ2V0RGlzdHJpYnV0aW9uTGlzdHNEYXRhKClcclxuICAgICAgICAgICAgLnRoZW4oKFtkaXN0cmlidXRpb25MaXN0cywgd2ViVGVtcGxhdGVzLCBlbWFpbFRlbXBsYXRlcywgdGV4dFRlbXBsYXRlc10pID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZGlzdHJpYnV0aW9uTGlzdHMgPSBlbnRpdHlUb0RpY3Rpb25hcnkoZGlzdHJpYnV0aW9uTGlzdHMpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5ub3RpZmljYXRpb25UZW1wbGF0ZXMgPSBlbnRpdHlUb0RpY3Rpb25hcnkod2ViVGVtcGxhdGVzLmNvbmNhdChlbWFpbFRlbXBsYXRlcykuY29uY2F0KHRleHRUZW1wbGF0ZXMpKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmRpc3RyaWJ1dGlvbkxpc3RzO1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAuY2F0Y2goY29uc29sZS5lcnJvcilcclxuICAgICAgICAgICAgLmZpbmFsbHkoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50VGFzayA9IG51bGw7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiB0aGlzLmN1cnJlbnRUYXNrO1xyXG4gICAgfTtcclxuXHJcbiAgICBwdWJsaWMgZ2V0Tm90aWZpY2F0aW9uVGVtcGxhdGVEYXRhICh0ZW1wbGF0ZUlkOiBzdHJpbmcpOiBhbnkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLm5vdGlmaWNhdGlvblRlbXBsYXRlc1t0ZW1wbGF0ZUlkXTtcclxuICAgIH07XHJcblxyXG4gICAgcHVibGljIGdldFJ1bGVzRGlzdHJpYnV0aW9uTGlzdHMgKHJ1bGVzSWRzOiBzdHJpbmdbXSk6IElEaXN0cmlidXRpb25MaXN0W10ge1xyXG4gICAgICAgIHJldHVybiBPYmplY3Qua2V5cyh0aGlzLmRpc3RyaWJ1dGlvbkxpc3RzKS5yZWR1Y2UoKHJlcywgaWQpID0+IHtcclxuICAgICAgICAgICAgbGV0IGxpc3QgPSB0aGlzLmRpc3RyaWJ1dGlvbkxpc3RzW2lkXTtcclxuICAgICAgICAgICAgbGlzdC5ydWxlcy5zb21lKGxpc3RSdWxlID0+IHJ1bGVzSWRzLmluZGV4T2YobGlzdFJ1bGUuaWQpID4gLTEpICYmIHJlcy5wdXNoKGxpc3QpO1xyXG4gICAgICAgICAgICByZXR1cm4gcmVzO1xyXG4gICAgICAgIH0sIFtdKTtcclxuICAgIH07XHJcblxyXG4gICAgcHVibGljIHVubG9hZCAoKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5hYm9ydEN1cnJlbnRUYXNrKCk7XHJcbiAgICB9O1xyXG59IiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uL2JsdWViaXJkLmQudHNcIi8+XHJcbmltcG9ydCAqIGFzIFV0aWxzIGZyb20gXCIuL3V0aWxzXCI7XHJcblxyXG5pbnRlcmZhY2UgQ29sb3Ige1xyXG4gICAgcjogbnVtYmVyO1xyXG4gICAgZzogbnVtYmVyO1xyXG4gICAgYjogbnVtYmVyO1xyXG4gICAgYTogbnVtYmVyO1xyXG59XHJcblxyXG5pbnRlcmZhY2UgSUdyb3VwIHtcclxuICAgIGlkOiBzdHJpbmc7XHJcbiAgICBuYW1lPzogc3RyaW5nO1xyXG4gICAgY29sb3I/OiBDb2xvcjtcclxuICAgIHBhcmVudD86IElHcm91cDtcclxuICAgIGNoaWxkcmVuPzogSUdyb3VwW107XHJcbiAgICB1c2VyPzogYW55O1xyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBHcm91cHNCdWlsZGVyIHtcclxuICAgIHByb3RlY3RlZCBhcGk7XHJcbiAgICBwcm90ZWN0ZWQgY3VycmVudFRhc2s7XHJcbiAgICBwcm90ZWN0ZWQgZ3JvdXBzOiBJR3JvdXBbXTtcclxuICAgIHByb3RlY3RlZCB0cmVlOiBJR3JvdXBbXTtcclxuICAgIHByb3RlY3RlZCBjdXJyZW50VHJlZTtcclxuXHJcbiAgICBwcml2YXRlIHVzZXJzOiBhbnk7XHJcbiAgICBwcml2YXRlIGN1cnJlbnRVc2VyTmFtZTogc3RyaW5nO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKGFwaTogYW55KSB7XHJcbiAgICAgICAgdGhpcy5hcGkgPSBhcGk7XHJcbiAgICB9XHJcblxyXG4gICAgLy9nZXRzIHRoZSBncm91cHMgYXNzb2NpYXRlZCB3aXRoIHRoZSBjdXJyZW50IHVzZXJcclxuICAgIHByaXZhdGUgZ2V0R3JvdXBzICgpOiBQcm9taXNlPGFueT4ge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuYXBpLmdldFNlc3Npb24oKHNlc3Npb25EYXRhKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRVc2VyTmFtZSA9IHNlc3Npb25EYXRhLnVzZXJOYW1lO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hcGkubXVsdGlDYWxsKFtcclxuICAgICAgICAgICAgICAgICAgICBbXCJHZXRcIiwge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlTmFtZTogXCJHcm91cFwiXHJcbiAgICAgICAgICAgICAgICAgICAgfV0sXHJcbiAgICAgICAgICAgICAgICAgICAgW1wiR2V0XCIsIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZU5hbWU6IFwiVXNlclwiXHJcbiAgICAgICAgICAgICAgICAgICAgfV1cclxuICAgICAgICAgICAgICAgIF0sIHJlc29sdmUsIHJlamVjdCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICBwcml2YXRlIGZpbmRDaGlsZCAoY2hpbGRJZDogc3RyaW5nLCBjdXJyZW50SXRlbTogSUdyb3VwLCBvbkFsbExldmVsczogYm9vbGVhbiA9IGZhbHNlKTogSUdyb3VwIHtcclxuICAgICAgICBsZXQgZm91bmRDaGlsZCA9IG51bGwsXHJcbiAgICAgICAgICAgIGNoaWxkcmVuID0gY3VycmVudEl0ZW0uY2hpbGRyZW47XHJcbiAgICAgICAgaWYgKCFjaGlsZElkIHx8ICFjaGlsZHJlbiB8fCAhY2hpbGRyZW4ubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY2hpbGRyZW4uc29tZShjaGlsZCA9PiB7XHJcbiAgICAgICAgICAgIGlmIChjaGlsZC5pZCA9PT0gY2hpbGRJZCkge1xyXG4gICAgICAgICAgICAgICAgZm91bmRDaGlsZCA9IGNoaWxkO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZvdW5kQ2hpbGQ7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBpZiAob25BbGxMZXZlbHMpIHtcclxuICAgICAgICAgICAgICAgICAgICBmb3VuZENoaWxkID0gdGhpcy5maW5kQ2hpbGQoY2hpbGRJZCwgY2hpbGQsIG9uQWxsTGV2ZWxzKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZm91bmRDaGlsZDtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHJldHVybiBmb3VuZENoaWxkO1xyXG4gICAgfTtcclxuXHJcbiAgICBwcml2YXRlIGdldFVzZXJCeVByaXZhdGVHcm91cElkIChncm91cElkOiBzdHJpbmcpOiBhbnkge1xyXG4gICAgICAgIGxldCBvdXRwdXRVc2VyID0gbnVsbCxcclxuICAgICAgICAgICAgdXNlckhhc1ByaXZhdGVHcm91cCA9ICh1c2VyLCBncm91cElkKTogYm9vbGVhbiA9PiB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdXNlci5wcml2YXRlVXNlckdyb3Vwcy5zb21lKGdyb3VwID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZ3JvdXAuaWQgPT09IGdyb3VwSWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgdGhpcy51c2Vycy5zb21lKHVzZXIgPT4ge1xyXG4gICAgICAgICAgICBpZiAodXNlckhhc1ByaXZhdGVHcm91cCh1c2VyLCBncm91cElkKSkge1xyXG4gICAgICAgICAgICAgICAgb3V0cHV0VXNlciA9IHVzZXI7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiBvdXRwdXRVc2VyO1xyXG4gICAgfTtcclxuXHJcbiAgICBwcml2YXRlIGdldFByaXZhdGVHcm91cERhdGEgKGdyb3VwSWQ6IHN0cmluZykge1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIGlkOiBncm91cElkLFxyXG4gICAgICAgICAgICB1c2VyOiB0aGlzLmdldFVzZXJCeVByaXZhdGVHcm91cElkKGdyb3VwSWQpLFxyXG4gICAgICAgICAgICBjaGlsZHJlbjogW10sXHJcbiAgICAgICAgICAgIG5hbWU6IFwiUHJpdmF0ZVVzZXJHcm91cE5hbWVcIixcclxuICAgICAgICAgICAgcGFyZW50OiB7XHJcbiAgICAgICAgICAgICAgICBpZDogXCJHcm91cFByaXZhdGVVc2VySWRcIixcclxuICAgICAgICAgICAgICAgIGNoaWxkcmVuOiBbeyBpZDogZ3JvdXBJZCB9XVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgIH07XHJcblxyXG4gICAgcHJvdGVjdGVkIGNyZWF0ZUdyb3Vwc1RyZWUgKGdyb3VwczogSUdyb3VwW10pOiBhbnlbXSB7XHJcbiAgICAgICAgbGV0IG5vZGVMb29rdXAsXHJcbiAgICAgICAgICAgIHRyYXZlcnNlQ2hpbGRyZW4gPSBmdW5jdGlvbiAobm9kZSkge1xyXG4gICAgICAgICAgICAgICAgbGV0IGNoaWxkcmVuOiBJR3JvdXBbXSxcclxuICAgICAgICAgICAgICAgICAgICBpZDogc3RyaW5nO1xyXG5cclxuICAgICAgICAgICAgICAgIGNoaWxkcmVuID0gbm9kZS5jaGlsZHJlbjtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoY2hpbGRyZW4pIHtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMCwgaWkgPSBjaGlsZHJlbi5sZW5ndGg7IGkgPCBpaTsgaSArPSAxKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkID0gY2hpbGRyZW5baV0uaWQ7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobm9kZUxvb2t1cFtpZF0pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGUuY2hpbGRyZW5baV0gPSBub2RlTG9va3VwW2lkXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGUuY2hpbGRyZW5baV0ucGFyZW50ID0gbm9kZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBub2RlTG9va3VwW2lkXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0cmF2ZXJzZUNoaWxkcmVuKG5vZGUuY2hpbGRyZW5baV0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgbm9kZUxvb2t1cCA9IFV0aWxzLmVudGl0eVRvRGljdGlvbmFyeShncm91cHMsIGVudGl0eSA9PiB7XHJcbiAgICAgICAgICAgIGxldCBuZXdFbnRpdHkgPSBVdGlscy5leHRlbmQoe30sIGVudGl0eSk7XHJcbiAgICAgICAgICAgIGlmIChuZXdFbnRpdHkuY2hpbGRyZW4pIHtcclxuICAgICAgICAgICAgICAgIG5ld0VudGl0eS5jaGlsZHJlbiA9IG5ld0VudGl0eS5jaGlsZHJlbi5zbGljZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBuZXdFbnRpdHk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIE9iamVjdC5rZXlzKG5vZGVMb29rdXApLmZvckVhY2goa2V5ID0+IHtcclxuICAgICAgICAgICAgbm9kZUxvb2t1cFtrZXldICYmIHRyYXZlcnNlQ2hpbGRyZW4obm9kZUxvb2t1cFtrZXldKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIE9iamVjdC5rZXlzKG5vZGVMb29rdXApLm1hcChrZXkgPT4ge1xyXG4gICAgICAgICAgICByZXR1cm4gbm9kZUxvb2t1cFtrZXldO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICBwcm90ZWN0ZWQgYWJvcnRDdXJyZW50VGFzayAoKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5jdXJyZW50VGFzayAmJiB0aGlzLmN1cnJlbnRUYXNrLmFib3J0ICYmIHRoaXMuY3VycmVudFRhc2suYWJvcnQoKTtcclxuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrID0gbnVsbDtcclxuICAgIH07XHJcblxyXG4gICAgLy9maWxscyB0aGUgZ3JvdXAgYnVpbGRlciB3aXRoIHRoZSByZWxldmFudCBpbmZvcm1hdGlvblxyXG4gICAgcHVibGljIGZldGNoICgpOiBQcm9taXNlPGFueT4ge1xyXG4gICAgICAgIHRoaXMuYWJvcnRDdXJyZW50VGFzaygpO1xyXG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgPSB0aGlzLmdldEdyb3VwcygpXHJcbiAgICAgICAgICAgIC50aGVuKChbZ3JvdXBzLCB1c2Vyc10pID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZ3JvdXBzID0gZ3JvdXBzO1xyXG4gICAgICAgICAgICAgICAgdGhpcy51c2VycyA9IHVzZXJzO1xyXG4gICAgICAgICAgICAgICAgdGhpcy50cmVlID0gdGhpcy5jcmVhdGVHcm91cHNUcmVlKGdyb3Vwcyk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRUcmVlID0gVXRpbHMuZXh0ZW5kKHt9LCB0aGlzLnRyZWUpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlRmxhdEdyb3Vwc0xpc3QodGhpcy50cmVlKTtcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgLmNhdGNoKGNvbnNvbGUuZXJyb3IpXHJcbiAgICAgICAgICAgIC5maW5hbGx5KCgpID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudFRhc2sgPSBudWxsO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4gdGhpcy5jdXJyZW50VGFzaztcclxuICAgIH07XHJcblxyXG4gICAgcHVibGljIGNyZWF0ZUZsYXRHcm91cHNMaXN0IChncm91cHM6IElHcm91cFtdLCBub3RJbmNsdWRlQ2hpbGRyZW46IGJvb2xlYW4gPSBmYWxzZSk6IElHcm91cFtdIHtcclxuICAgICAgICBsZXQgZm91bmRJZHMgPSBbXSxcclxuICAgICAgICAgICAgZ3JvdXBzVG9BZGQgPSBbXSxcclxuICAgICAgICAgICAgbWFrZUZsYXRQYXJlbnRzID0gKGl0ZW0pID0+IHtcclxuICAgICAgICAgICAgICAgIGxldCBpdGVtQ29weSA9IFV0aWxzLmV4dGVuZCh7fSwgaXRlbSk7XHJcbiAgICAgICAgICAgICAgICBpZiAoaXRlbSAmJiBpdGVtLnBhcmVudCkge1xyXG4gICAgICAgICAgICAgICAgICAgIG1ha2VGbGF0UGFyZW50cyhpdGVtLnBhcmVudCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpdGVtQ29weS5jaGlsZHJlbiA9IGl0ZW1Db3B5LmNoaWxkcmVuLm1hcChjaGlsZCA9PiBjaGlsZC5pZCk7XHJcbiAgICAgICAgICAgICAgICBpdGVtQ29weS5wYXJlbnQgPSBpdGVtLnBhcmVudCA/IHtpZDogaXRlbS5wYXJlbnQuaWQsIG5hbWU6IGl0ZW0ucGFyZW50Lm5hbWV9IDogbnVsbDtcclxuICAgICAgICAgICAgICAgIGlmIChmb3VuZElkcy5pbmRleE9mKGl0ZW0uaWQpID09PSAtMSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGdyb3Vwc1RvQWRkLnB1c2goaXRlbUNvcHkpO1xyXG4gICAgICAgICAgICAgICAgICAgIGZvdW5kSWRzLnB1c2goaXRlbS5pZCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIG1ha2VGbGF0Q2hpbGRyZW4gPSAoaXRlbSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKGl0ZW0gJiYgaXRlbS5jaGlsZHJlbiAmJiBpdGVtLmNoaWxkcmVuLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGl0ZW0uY2hpbGRyZW4uZm9yRWFjaCgoY2hpbGQpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGNoaWxkQ29weTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGZvdW5kSWRzLmluZGV4T2YoY2hpbGQuaWQpID09PSAtMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWFrZUZsYXRDaGlsZHJlbihjaGlsZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGRDb3B5ID0gVXRpbHMuZXh0ZW5kKHt9LCBjaGlsZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkQ29weS5jaGlsZHJlbiA9IGNoaWxkQ29weS5jaGlsZHJlbi5tYXAoY2hpbGRJbm5lciA9PiBjaGlsZElubmVyLmlkKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGRDb3B5LnBhcmVudCA9IGNoaWxkQ29weS5wYXJlbnQgPyB7aWQ6IGNoaWxkQ29weS5wYXJlbnQuaWQsIG5hbWU6IGNoaWxkQ29weS5wYXJlbnQubmFtZX0gOiBudWxsO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZm91bmRJZHMuaW5kZXhPZihjaGlsZC5pZCkgPT09IC0xKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBncm91cHNUb0FkZC5wdXNoKGNoaWxkQ29weSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3VuZElkcy5wdXNoKGNoaWxkLmlkKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICBncm91cHMuZm9yRWFjaChtYWtlRmxhdFBhcmVudHMpO1xyXG4gICAgICAgICFub3RJbmNsdWRlQ2hpbGRyZW4gJiYgZ3JvdXBzLmZvckVhY2gobWFrZUZsYXRDaGlsZHJlbik7XHJcbiAgICAgICAgcmV0dXJuIGdyb3Vwc1RvQWRkO1xyXG4gICAgfTtcclxuXHJcbiAgICBwdWJsaWMgZ2V0R3JvdXBzRGF0YSAoZ3JvdXBJZHM6IHN0cmluZ1tdLCBub3RJbmNsdWRlQ2hpbGRyZW46IGJvb2xlYW4gPSBmYWxzZSk6IElHcm91cFtdIHtcclxuICAgICAgICBsZXQgdHJlZUdyb3VwcyA9IGdyb3VwSWRzLm1hcChncm91cElkID0+XHJcbiAgICAgICAgICAgIHRoaXMuZmluZENoaWxkKGdyb3VwSWQsIHtpZDogbnVsbCwgY2hpbGRyZW46IHRoaXMudHJlZX0sIHRydWUpIHx8IHRoaXMuZ2V0UHJpdmF0ZUdyb3VwRGF0YShncm91cElkKVxyXG4gICAgICAgICk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlRmxhdEdyb3Vwc0xpc3QodHJlZUdyb3Vwcywgbm90SW5jbHVkZUNoaWxkcmVuKTtcclxuICAgIH07XHJcblxyXG4gICAgcHVibGljIGdldEN1c3RvbUdyb3Vwc0RhdGEgKGdyb3VwSWRzOiBzdHJpbmdbXSwgYWxsR3JvdXBzOiBJR3JvdXBbXSk6IElHcm91cFtdIHtcclxuICAgICAgICBsZXQgZ3JvdXBzVHJlZSA9IHRoaXMuY3JlYXRlR3JvdXBzVHJlZShhbGxHcm91cHMpLFxyXG4gICAgICAgICAgICB0cmVlR3JvdXBzID0gZ3JvdXBJZHMubWFwKGdyb3VwSWQgPT4gXHJcbiAgICAgICAgICAgICAgICB0aGlzLmZpbmRDaGlsZChncm91cElkLCB7aWQ6IG51bGwsIGNoaWxkcmVuOiBncm91cHNUcmVlfSwgdHJ1ZSkgfHwgdGhpcy5nZXRQcml2YXRlR3JvdXBEYXRhKGdyb3VwSWQpXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlRmxhdEdyb3Vwc0xpc3QodHJlZUdyb3VwcywgdHJ1ZSk7XHJcbiAgICB9O1xyXG5cclxuICAgIHB1YmxpYyBnZXRQcml2YXRlR3JvdXBzVXNlcnMoZ3JvdXBzOiBJR3JvdXBbXSkge1xyXG4gICAgICAgIHJldHVybiBncm91cHMucmVkdWNlKCh1c2VycywgZ3JvdXApID0+IHtcclxuICAgICAgICAgICAgZ3JvdXAudXNlciAmJiBncm91cC51c2VyLm5hbWUgIT09IHRoaXMuY3VycmVudFVzZXJOYW1lICYmIHVzZXJzLnB1c2goZ3JvdXAudXNlcik7XHJcbiAgICAgICAgICAgIHJldHVybiB1c2VycztcclxuICAgICAgICB9LCBbXSk7XHJcbiAgICB9O1xyXG5cclxuICAgIHB1YmxpYyB1bmxvYWQgKCk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMuYWJvcnRDdXJyZW50VGFzaygpO1xyXG4gICAgfTtcclxufSIsImltcG9ydCB7IGVudGl0eVRvRGljdGlvbmFyeSB9IGZyb20gXCIuL3V0aWxzXCI7XHJcblxyXG50eXBlIFRNYXBQcm92aWRlclR5cGUgPSBcImRlZmF1bHRcIiB8IFwiYWRkaXRpb25hbFwiIHwgXCJjdXN0b21cIjtcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgSU1pc2NEYXRhIHtcclxuICAgIG1hcFByb3ZpZGVyOiB7XHJcbiAgICAgICAgdmFsdWU6IHN0cmluZztcclxuICAgICAgICB0eXBlOiBUTWFwUHJvdmlkZXJUeXBlO1xyXG4gICAgfTtcclxuICAgIGN1cnJlbnRVc2VyOiBhbnk7XHJcbiAgICBpc1Vuc2lnbmVkQWRkaW5zQWxsb3dlZDogYm9vbGVhbjtcclxuICAgIGFkZGluczogc3RyaW5nW107XHJcbiAgICBwdXJnZVNldHRpbmdzPzogYW55O1xyXG4gICAgZW1haWxTZW5kZXJGcm9tPzogc3RyaW5nO1xyXG4gICAgY3VzdG9tZXJDbGFzc2lmaWNhdGlvbj86IHN0cmluZztcclxuICAgIGlzTWFya2V0cGxhY2VQdXJjaGFzZXNBbGxvd2VkPzogYm9vbGVhbjtcclxuICAgIGlzUmVzZWxsZXJBdXRvTG9naW5BbGxvd2VkPzogYm9vbGVhbjtcclxuICAgIGlzVGhpcmRQYXJ0eU1hcmtldHBsYWNlQXBwc0FsbG93ZWQ/OiBib29sZWFuO1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgTWlzY0J1aWxkZXIge1xyXG4gICAgcHJpdmF0ZSByZWFkb25seSBhcGk7XHJcbiAgICBwcml2YXRlIGN1c3RvbU1hcFByb3ZpZGVycztcclxuICAgIHByaXZhdGUgY3VycmVudFRhc2s7XHJcbiAgICBwcml2YXRlIGN1cnJlbnRVc2VyO1xyXG4gICAgcHJpdmF0ZSBpc1Vuc2lnbmVkQWRkaW5zQWxsb3dlZDtcclxuICAgIHByaXZhdGUgYWRkaW5zOiBzdHJpbmdbXTtcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgZGVmYXVsdE1hcFByb3ZpZGVycyA9IHtcclxuICAgICAgICBHb29nbGVNYXBzOiBcIkdvb2dsZSBNYXBzXCIsXHJcbiAgICAgICAgSGVyZTogXCJIRVJFIE1hcHNcIixcclxuICAgICAgICBNYXBCb3g6IFwiTWFwQm94XCJcclxuICAgIH07XHJcblxyXG4gICAgcHJpdmF0ZSBhYm9ydEN1cnJlbnRUYXNrICgpIHtcclxuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrICYmIHRoaXMuY3VycmVudFRhc2suYWJvcnQgJiYgdGhpcy5jdXJyZW50VGFzay5hYm9ydCgpO1xyXG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgPSBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgZ2V0QWxsb3dlZEFkZGlucyAoYWxsQWRkaW5zOiBzdHJpbmdbXSkge1xyXG4gICAgICAgIHJldHVybiBhbGxBZGRpbnMuZmlsdGVyKGFkZGluID0+IHtcclxuICAgICAgICAgICAgLy9yZW1vdmVzIHRoZSBjdXJyZW50IGFkZGluIC0gcmVnaXN0cmF0aW9uIGNvbmZpZ1xyXG4gICAgICAgICAgICBpZih0aGlzLmlzQ3VycmVudEFkZGluKGFkZGluKSlcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGxldCBhZGRpbkNvbmZpZyA9IEpTT04ucGFyc2UoYWRkaW4pO1xyXG4gICAgICAgICAgICBpZihhZGRpbkNvbmZpZy5pdGVtcykge1xyXG4gICAgICAgICAgICAgICAgLy9NdWx0aSBsaW5lIGFkZGluIHN0cnVjdHVyZSBjaGVja1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGFkZGluQ29uZmlnICYmIEFycmF5LmlzQXJyYXkoYWRkaW5Db25maWcuaXRlbXMpICYmIGFkZGluQ29uZmlnLml0ZW1zLmV2ZXJ5KGl0ZW0gPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCB1cmwgPSBpdGVtLnVybDtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5pc1ZhbGlkVXJsKHVybCk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIC8vU2luZ2xlIGxpbmUgYWRkaW4gc3RydWN0dXJlIGNoZWNrXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5pc1ZhbGlkVXJsKGFkZGluQ29uZmlnLnVybCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICAvL1Rlc3RzIGEgVVJMIGZvciBkb3VibGUgc2xhc2guIEFjY2VwdHMgYSB1cmwgYXMgYSBzdHJpbmcgYXMgYSBhcmd1bWVudC5cclxuICAgIC8vUmV0dXJucyB0cnVlIGlmIHRoZSB1cmwgY29udGFpbnMgYSBkb3VibGUgc2xhc2ggLy9cclxuICAgIC8vUmV0dXJucyBmYWxzZSBpZiB0aGUgdXJsIGRvZXMgbm90IGNvbnRhaW4gYSBkb3VibGUgc2xhc2guXHJcbiAgICBwcml2YXRlIGlzVmFsaWRVcmwodXJsOiBzdHJpbmcpOiBib29sZWFuIHtcclxuICAgICAgICBpZiAodXJsICYmIHVybC5pbmRleE9mKFwiXFwvXFwvXCIpID4gLTEpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgcmVtb3ZlRXhwb3J0QWRkaW4gKGFsbEFkZGluczogc3RyaW5nW10pIHtcclxuICAgICAgICByZXR1cm4gYWxsQWRkaW5zLmZpbHRlcihhZGRpbiA9PiB7XHJcbiAgICAgICAgICAgIHJldHVybiAoYWRkaW4udG9Mb3dlckNhc2UoKS5pbmRleE9mKFwicmVnaXN0cmF0aW9uQ29uZmlnXCIudG9Mb3dlckNhc2UoKSkgPD0gMCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBpc0N1cnJlbnRBZGRpbiAoYWRkaW46IHN0cmluZykge1xyXG4gICAgICAgIHJldHVybiAoKGFkZGluLmluZGV4T2YoXCJSZWdpc3RyYXRpb24gY29uZmlnXCIpID4gLTEpfHxcclxuICAgICAgICAoYWRkaW4udG9Mb3dlckNhc2UoKS5pbmRleE9mKFwicmVnaXN0cmF0aW9uQ29uZmlnXCIudG9Mb3dlckNhc2UoKSkgPiAtMSkpO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0cnVjdG9yKGFwaSkge1xyXG4gICAgICAgIHRoaXMuYXBpID0gYXBpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vZmlsbHMgdGhlIE1pc2MgYnVpbGRlciAoc3lzdGVtIHNldHRpbmdzKSB3aXRoIHRoZSByZWxldmFudCBpbmZvcm1hdGlvblxyXG4gICAgZmV0Y2ggKGluY2x1ZGVTeXNTZXR0aW5nczogYm9vbGVhbik6IFByb21pc2U8SU1pc2NEYXRhPiB7XHJcbiAgICAgICAgdGhpcy5hYm9ydEN1cnJlbnRUYXNrKCk7XHJcbiAgICAgICAgdGhpcy5jdXJyZW50VGFzayA9IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5hcGkuZ2V0U2Vzc2lvbigoc2Vzc2lvbkRhdGEpID0+IHtcclxuICAgICAgICAgICAgICAgIGxldCB1c2VyTmFtZSA9IHNlc3Npb25EYXRhLnVzZXJOYW1lO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hcGkubXVsdGlDYWxsKFtcclxuICAgICAgICAgICAgICAgICAgICAgICAgW1wiR2V0XCIsIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGVOYW1lOiBcIlVzZXJcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlYXJjaDoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IHVzZXJOYW1lXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1dLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBbXCJHZXRcIiwge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZU5hbWU6IFwiU3lzdGVtU2V0dGluZ3NcIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XVxyXG4gICAgICAgICAgICAgICAgICAgIF0sIHJlc29sdmUsIHJlamVjdCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pLnRoZW4oKHJlc3VsdCkgPT4ge1xyXG4gICAgICAgICAgICBsZXQgY3VycmVudFVzZXIgPSByZXN1bHRbMF1bMF0gfHwgcmVzdWx0WzBdLFxyXG4gICAgICAgICAgICAgICAgc3lzdGVtU2V0dGluZ3MgPSByZXN1bHRbMV1bMF0gfHwgcmVzdWx0WzFdLFxyXG4gICAgICAgICAgICAgICAgdXNlck1hcFByb3ZpZGVySWQgPSBjdXJyZW50VXNlci5kZWZhdWx0TWFwRW5naW5lLFxyXG4gICAgICAgICAgICAgICAgZGVmYXVsdE1hcFByb3ZpZGVySWQgPSBzeXN0ZW1TZXR0aW5ncy5tYXBQcm92aWRlcixcclxuICAgICAgICAgICAgICAgIG1hcFByb3ZpZGVySWQgPSB0aGlzLmdldE1hcFByb3ZpZGVyVHlwZSh1c2VyTWFwUHJvdmlkZXJJZCkgPT09IFwiY3VzdG9tXCIgPyB1c2VyTWFwUHJvdmlkZXJJZCA6IGRlZmF1bHRNYXBQcm92aWRlcklkO1xyXG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRVc2VyID0gY3VycmVudFVzZXI7XHJcbiAgICAgICAgICAgIHRoaXMuY3VzdG9tTWFwUHJvdmlkZXJzID0gZW50aXR5VG9EaWN0aW9uYXJ5KHN5c3RlbVNldHRpbmdzLmN1c3RvbVdlYk1hcFByb3ZpZGVyTGlzdCk7XHJcbiAgICAgICAgICAgIHRoaXMuaXNVbnNpZ25lZEFkZGluc0FsbG93ZWQgPSBzeXN0ZW1TZXR0aW5ncy5hbGxvd1Vuc2lnbmVkQWRkSW47XHJcbiAgICAgICAgICAgIHRoaXMuYWRkaW5zID0gdGhpcy5nZXRBbGxvd2VkQWRkaW5zKHN5c3RlbVNldHRpbmdzLmN1c3RvbWVyUGFnZXMpO1xyXG4gICAgICAgICAgICBsZXQgb3V0cHV0OiBJTWlzY0RhdGEgPSB7XHJcbiAgICAgICAgICAgICAgICBtYXBQcm92aWRlcjoge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBtYXBQcm92aWRlcklkLFxyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IHRoaXMuZ2V0TWFwUHJvdmlkZXJUeXBlKG1hcFByb3ZpZGVySWQpXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgY3VycmVudFVzZXI6IHRoaXMuY3VycmVudFVzZXIsXHJcbiAgICAgICAgICAgICAgICBpc1Vuc2lnbmVkQWRkaW5zQWxsb3dlZDogdGhpcy5pc1Vuc2lnbmVkQWRkaW5zQWxsb3dlZCxcclxuICAgICAgICAgICAgICAgIGFkZGluczogdGhpcy5hZGRpbnMsXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIGlmIChpbmNsdWRlU3lzU2V0dGluZ3MpIHtcclxuICAgICAgICAgICAgICAgIG91dHB1dC5wdXJnZVNldHRpbmdzID0gc3lzdGVtU2V0dGluZ3MucHVyZ2VTZXR0aW5ncztcclxuICAgICAgICAgICAgICAgIG91dHB1dC5lbWFpbFNlbmRlckZyb20gPSBzeXN0ZW1TZXR0aW5ncy5lbWFpbFNlbmRlckZyb207XHJcbiAgICAgICAgICAgICAgICBvdXRwdXQuY3VzdG9tZXJDbGFzc2lmaWNhdGlvbiA9IHN5c3RlbVNldHRpbmdzLmN1c3RvbWVyQ2xhc3NpZmljYXRpb247XHJcbiAgICAgICAgICAgICAgICBvdXRwdXQuaXNNYXJrZXRwbGFjZVB1cmNoYXNlc0FsbG93ZWQgPSBzeXN0ZW1TZXR0aW5ncy5hbGxvd01hcmtldHBsYWNlUHVyY2hhc2VzO1xyXG4gICAgICAgICAgICAgICAgb3V0cHV0LmlzUmVzZWxsZXJBdXRvTG9naW5BbGxvd2VkID0gc3lzdGVtU2V0dGluZ3MuYWxsb3dSZXNlbGxlckF1dG9Mb2dpbjtcclxuICAgICAgICAgICAgICAgIG91dHB1dC5pc1RoaXJkUGFydHlNYXJrZXRwbGFjZUFwcHNBbGxvd2VkID0gc3lzdGVtU2V0dGluZ3MuYWxsb3dUaGlyZFBhcnR5TWFya2V0cGxhY2VBcHBzO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBvdXRwdXQ7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY3VycmVudFRhc2s7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0TWFwUHJvdmlkZXJUeXBlIChtYXBQcm92aWRlcklkOiBzdHJpbmcpOiBUTWFwUHJvdmlkZXJUeXBlIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5kZWZhdWx0TWFwUHJvdmlkZXJzW21hcFByb3ZpZGVySWRdID8gXCJkZWZhdWx0XCIgOiBcImN1c3RvbVwiO1xyXG4gICAgfVxyXG5cclxuICAgIGdldE1hcFByb3ZpZGVyTmFtZSAobWFwUHJvdmlkZXJJZDogc3RyaW5nKTogc3RyaW5nIHtcclxuICAgICAgICByZXR1cm4gbWFwUHJvdmlkZXJJZCAmJiAodGhpcy5kZWZhdWx0TWFwUHJvdmlkZXJzW21hcFByb3ZpZGVySWRdIHx8ICh0aGlzLmN1c3RvbU1hcFByb3ZpZGVyc1ttYXBQcm92aWRlcklkXSAmJiB0aGlzLmN1c3RvbU1hcFByb3ZpZGVyc1ttYXBQcm92aWRlcklkXS5uYW1lKSB8fCBtYXBQcm92aWRlcklkKTtcclxuICAgIH1cclxuXHJcbiAgICBnZXRNYXBQcm92aWRlckRhdGEgKG1hcFByb3ZpZGVySWQ6IHN0cmluZykge1xyXG4gICAgICAgIHJldHVybiBtYXBQcm92aWRlcklkICYmIHRoaXMuY3VzdG9tTWFwUHJvdmlkZXJzW21hcFByb3ZpZGVySWRdO1xyXG4gICAgfVxyXG5cclxuICAgIGlzVGhpc0FkZGluSW5jbHVkZWQgKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmFkZGlucy5zb21lKHRoaXMuaXNDdXJyZW50QWRkaW4pO1xyXG4gICAgfVxyXG5cclxuICAgIGdldEFkZGluc0RhdGEgKGluY2x1ZGVUaGlzQWRkaW4gPSBmYWxzZSkge1xyXG4gICAgICAgIHJldHVybiAhaW5jbHVkZVRoaXNBZGRpbiA/IHRoaXMuYWRkaW5zLmZpbHRlcihhZGRpbiA9PiAhdGhpcy5pc0N1cnJlbnRBZGRpbihhZGRpbikpIDogdGhpcy5hZGRpbnM7XHJcbiAgICB9XHJcblxyXG4gICAgdW5sb2FkICgpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLmFib3J0Q3VycmVudFRhc2soKTtcclxuICAgIH1cclxufSIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi9ibHVlYmlyZC5kLnRzXCIvPlxyXG5pbXBvcnQgKiBhcyBVdGlscyBmcm9tIFwiLi91dGlsc1wiO1xyXG5cclxuY29uc3QgUkVQT1JUX1RZUEVfREFTSEJPQUQgPSBcIkRhc2hib2FyZFwiO1xyXG5cclxuaW50ZXJmYWNlIElSZXBvcnQge1xyXG4gICAgaWQ6IHN0cmluZztcclxuICAgIGdyb3VwczogSUdyb3VwW107XHJcbiAgICBpbmNsdWRlQWxsQ2hpbGRyZW5Hcm91cHM6IElHcm91cFtdO1xyXG4gICAgaW5jbHVkZURpcmVjdENoaWxkcmVuT25seUdyb3VwczogSUdyb3VwW107XHJcbiAgICBzY29wZUdyb3VwczogSUdyb3VwW107XHJcbiAgICBkZXN0aW5hdGlvbj86IHN0cmluZztcclxuICAgIHRlbXBsYXRlOiBJUmVwb3J0VGVtcGxhdGU7XHJcbiAgICBsYXN0TW9kaWZpZWRVc2VyO1xyXG4gICAgYXJndW1lbnRzOiB7XHJcbiAgICAgICAgcnVsZXM/OiBhbnlbXTtcclxuICAgICAgICBkZXZpY2VzPzogYW55W107XHJcbiAgICAgICAgem9uZVR5cGVMaXN0PzogYW55W107XHJcbiAgICAgICAgW3Byb3BOYW1lOiBzdHJpbmddOiBhbnk7XHJcbiAgICB9O1xyXG4gICAgW3Byb3BOYW1lOiBzdHJpbmddOiBhbnk7XHJcbn1cclxuXHJcbmludGVyZmFjZSBJR3JvdXAge1xyXG4gICAgaWQ6IHN0cmluZztcclxuICAgIGNoaWxkcmVuOiBJR3JvdXBbXTtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBJUmVwb3J0RGVwZW5kZW5jaWVzIHtcclxuICAgIGRldmljZXM/OiBzdHJpbmdbXTtcclxuICAgIHJ1bGVzPzogc3RyaW5nW107XHJcbiAgICB6b25lVHlwZXM/OiBzdHJpbmdbXTtcclxuICAgIGdyb3Vwcz86IHN0cmluZ1tdO1xyXG59XHJcblxyXG5pbnRlcmZhY2UgSVJlcG9ydFRlbXBsYXRlIHtcclxuICAgIGlkOiBzdHJpbmc7XHJcbiAgICBuYW1lOiBzdHJpbmc7XHJcbiAgICBpc1N5c3RlbTogYm9vbGVhbjtcclxuICAgIHJlcG9ydERhdGFTb3VyY2U6IHN0cmluZztcclxuICAgIHJlcG9ydFRlbXBsYXRlVHlwZTogc3RyaW5nO1xyXG4gICAgcmVwb3J0czogSVJlcG9ydFtdO1xyXG4gICAgYmluYXJ5RGF0YT86IHN0cmluZztcclxuICAgIFtwcm9wTmFtZTogc3RyaW5nXTogYW55O1xyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBSZXBvcnRzQnVpbGRlciB7XHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IGFwaTtcclxuICAgIHByaXZhdGUgY3VycmVudFRhc2s7XHJcbiAgICBwcml2YXRlIGFsbFJlcG9ydHM6IElSZXBvcnRbXTtcclxuICAgIHByaXZhdGUgc3RydWN0dXJlZFJlcG9ydHM7XHJcbiAgICBwcml2YXRlIGRhc2hib2FyZHNMZW5ndGg6IG51bWJlcjtcclxuICAgIHByaXZhdGUgYWxsVGVtcGxhdGVzOiBJUmVwb3J0VGVtcGxhdGVbXTtcclxuXHJcbiAgICAvL0dldFJlcG9ydFNjaGVkdWxlcyBpcyBvYnNvbGV0ZVxyXG4gICAgcHJpdmF0ZSBnZXRSZXBvcnRzICgpOiBQcm9taXNlPGFueT4ge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuYXBpLm11bHRpQ2FsbChbXHJcbiAgICAgICAgICAgICAgICBbXCJHZXRSZXBvcnRTY2hlZHVsZXNcIiwge1xyXG4gICAgICAgICAgICAgICAgICAgIFwiaW5jbHVkZVRlbXBsYXRlRGV0YWlsc1wiOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgIFwiYXBwbHlVc2VyRmlsdGVyXCI6IGZhbHNlXHJcbiAgICAgICAgICAgICAgICB9XSxcclxuICAgICAgICAgICAgICAgIFtcIkdldFwiLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgXCJ0eXBlTmFtZVwiOiBcIlJlcG9ydFRlbXBsYXRlXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJzZWFyY2hcIjoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpbmNsdWRlQmluYXJ5RGF0YTogZmFsc2VcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XSxcclxuICAgICAgICAgICAgICAgIFtcIkdldERhc2hib2FyZEl0ZW1zXCIsIHt9XVxyXG4gICAgICAgICAgICBdLCByZXNvbHZlLCByZWplY3QpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgc3RydWN0dXJlUmVwb3J0cyAocmVwb3J0cywgdGVtcGxhdGVzKSB7XHJcbiAgICAgICAgbGV0IGZpbmRUZW1wbGF0ZVJlcG9ydHMgPSAodGVtcGxhdGVJZCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlcG9ydHMuZmlsdGVyKHJlcG9ydCA9PiByZXBvcnQudGVtcGxhdGUuaWQgPT09IHRlbXBsYXRlSWQpO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIHJldHVybiB0ZW1wbGF0ZXMucmVkdWNlKChyZXMsIHRlbXBsYXRlKSA9PiB7XHJcbiAgICAgICAgICAgIGxldCB0ZW1wbGF0ZUlkID0gdGVtcGxhdGUuaWQsXHJcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVJlcG9ydHMgPSBmaW5kVGVtcGxhdGVSZXBvcnRzKHRlbXBsYXRlSWQpO1xyXG4gICAgICAgICAgICBpZiAodGVtcGxhdGVSZXBvcnRzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgdGVtcGxhdGUucmVwb3J0cyA9IHRlbXBsYXRlUmVwb3J0cztcclxuICAgICAgICAgICAgICAgIHJlcy5wdXNoKHRlbXBsYXRlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gcmVzO1xyXG4gICAgICAgIH0sIFtdKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFib3J0Q3VycmVudFRhc2sgKCk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgJiYgdGhpcy5jdXJyZW50VGFzay5hYm9ydCAmJiB0aGlzLmN1cnJlbnRUYXNrLmFib3J0KCk7XHJcbiAgICAgICAgdGhpcy5jdXJyZW50VGFzayA9IG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSB1cGRhdGVUZW1wbGF0ZSAobmV3VGVtcGxhdGVEYXRhOiBJUmVwb3J0VGVtcGxhdGUpIHtcclxuICAgICAgICB0aGlzLmFsbFRlbXBsYXRlcy5zb21lKCh0ZW1wbGF0ZURhdGE6IElSZXBvcnRUZW1wbGF0ZSwgaW5kZXg6IG51bWJlcikgPT4ge1xyXG4gICAgICAgICAgICBpZiAodGVtcGxhdGVEYXRhLmlkID09PSBuZXdUZW1wbGF0ZURhdGEuaWQpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuYWxsVGVtcGxhdGVzW2luZGV4XSA9IG5ld1RlbXBsYXRlRGF0YTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdHJ1Y3RvcihhcGkpIHtcclxuICAgICAgICB0aGlzLmFwaSA9IGFwaTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZmV0Y2ggKCk6IFByb21pc2U8YW55PiB7XHJcbiAgICAgICAgdGhpcy5hYm9ydEN1cnJlbnRUYXNrKCk7XHJcbiAgICAgICAgdGhpcy5jdXJyZW50VGFzayA9IHRoaXMuZ2V0UmVwb3J0cygpXHJcbiAgICAgICAgICAgIC50aGVuKChbcmVwb3J0cywgdGVtcGxhdGVzLCBkYXNoYm9hcmRJdGVtc10pID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMuYWxsUmVwb3J0cyA9IHJlcG9ydHM7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmFsbFRlbXBsYXRlcyA9IHRlbXBsYXRlcztcclxuICAgICAgICAgICAgICAgIHRoaXMuZGFzaGJvYXJkc0xlbmd0aCA9IGRhc2hib2FyZEl0ZW1zICYmIGRhc2hib2FyZEl0ZW1zLmxlbmd0aCA/IGRhc2hib2FyZEl0ZW1zLmxlbmd0aCA6IDA7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnN0cnVjdHVyZWRSZXBvcnRzID0gdGhpcy5zdHJ1Y3R1cmVSZXBvcnRzKHJlcG9ydHMsIHRlbXBsYXRlcyk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zdHJ1Y3R1cmVkUmVwb3J0cztcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgLmNhdGNoKGNvbnNvbGUuZXJyb3IpXHJcbiAgICAgICAgICAgIC5maW5hbGx5KCgpID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudFRhc2sgPSBudWxsO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4gdGhpcy5jdXJyZW50VGFzaztcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0RGVwZW5kZW5jaWVzIChyZXBvcnRzOiBJUmVwb3J0VGVtcGxhdGVbXSk6IElSZXBvcnREZXBlbmRlbmNpZXMge1xyXG4gICAgICAgIGxldCBhbGxEZXBlbmRlbmNpZXM6IElSZXBvcnREZXBlbmRlbmNpZXMgPSB7XHJcbiAgICAgICAgICAgICAgICBkZXZpY2VzOiBbXSxcclxuICAgICAgICAgICAgICAgIHJ1bGVzOiBbXSxcclxuICAgICAgICAgICAgICAgIHpvbmVUeXBlczogW10sXHJcbiAgICAgICAgICAgICAgICBncm91cHM6IFtdXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgcmV0dXJuIHJlcG9ydHMucmVkdWNlKChyZXBvcnRzRGVwZW5kZW5jaWVzOiBJUmVwb3J0RGVwZW5kZW5jaWVzLCB0ZW1wbGF0ZTogSVJlcG9ydFRlbXBsYXRlKSA9PiB7XHJcbiAgICAgICAgICAgIHJldHVybiB0ZW1wbGF0ZS5yZXBvcnRzLnJlZHVjZSgodGVtcGxhdGVEZXBlbmRlY2llcywgcmVwb3J0KSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZURlcGVuZGVjaWVzLmdyb3VwcyA9IFV0aWxzLm1lcmdlVW5pcXVlKHRlbXBsYXRlRGVwZW5kZWNpZXMuZ3JvdXBzLCBVdGlscy5nZXRFbnRpdGllc0lkcyhyZXBvcnQuZ3JvdXBzKSxcclxuICAgICAgICAgICAgICAgICAgICBVdGlscy5nZXRFbnRpdGllc0lkcyhyZXBvcnQuaW5jbHVkZUFsbENoaWxkcmVuR3JvdXBzKSwgVXRpbHMuZ2V0RW50aXRpZXNJZHMocmVwb3J0LmluY2x1ZGVEaXJlY3RDaGlsZHJlbk9ubHlHcm91cHMpLFxyXG4gICAgICAgICAgICAgICAgICAgIFV0aWxzLmdldEVudGl0aWVzSWRzKHJlcG9ydC5zY29wZUdyb3VwcykpO1xyXG4gICAgICAgICAgICAgICAgdGVtcGxhdGVEZXBlbmRlY2llcy5kZXZpY2VzID0gVXRpbHMubWVyZ2VVbmlxdWUodGVtcGxhdGVEZXBlbmRlY2llcy5kZXZpY2VzLCByZXBvcnQuYXJndW1lbnRzICYmIHJlcG9ydC5hcmd1bWVudHMuZGV2aWNlcyAmJiBVdGlscy5nZXRFbnRpdGllc0lkcyhyZXBvcnQuYXJndW1lbnRzLmRldmljZXMpIHx8IFtdKTtcclxuICAgICAgICAgICAgICAgIHRlbXBsYXRlRGVwZW5kZWNpZXMucnVsZXMgPSBVdGlscy5tZXJnZVVuaXF1ZSh0ZW1wbGF0ZURlcGVuZGVjaWVzLnJ1bGVzLCByZXBvcnQuYXJndW1lbnRzICYmIHJlcG9ydC5hcmd1bWVudHMucnVsZXMgJiYgVXRpbHMuZ2V0RW50aXRpZXNJZHMocmVwb3J0LmFyZ3VtZW50cy5ydWxlcykgfHwgW10pO1xyXG4gICAgICAgICAgICAgICAgdGVtcGxhdGVEZXBlbmRlY2llcy56b25lVHlwZXMgPSBVdGlscy5tZXJnZVVuaXF1ZShcclxuICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZURlcGVuZGVjaWVzLnpvbmVUeXBlcywgcmVwb3J0LmFyZ3VtZW50cyAmJiByZXBvcnQuYXJndW1lbnRzLnpvbmVUeXBlTGlzdCAmJiBVdGlscy5nZXRFbnRpdGllc0lkcyhyZXBvcnQuYXJndW1lbnRzLnpvbmVUeXBlTGlzdCkgfHwgW10pO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRlbXBsYXRlRGVwZW5kZWNpZXM7XHJcbiAgICAgICAgICAgIH0sIHJlcG9ydHNEZXBlbmRlbmNpZXMpO1xyXG4gICAgICAgIH0sIGFsbERlcGVuZGVuY2llcyk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldERhdGEgKCk6IFByb21pc2U8SVJlcG9ydFRlbXBsYXRlW10+IHtcclxuICAgICAgICBsZXQgcG9ydGlvblNpemUgPSAxNSxcclxuICAgICAgICAgICAgcG9ydGlvbnMgPSB0aGlzLmFsbFRlbXBsYXRlcy5yZWR1Y2UoKHJlcXVlc3RzLCB0ZW1wbGF0ZTogSVJlcG9ydFRlbXBsYXRlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIXRlbXBsYXRlLmlzU3lzdGVtICYmICF0ZW1wbGF0ZS5iaW5hcnlEYXRhKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHBvcnRpb25JbmRleDogbnVtYmVyID0gcmVxdWVzdHMubGVuZ3RoIC0gMTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIXJlcXVlc3RzW3BvcnRpb25JbmRleF0gfHwgcmVxdWVzdHNbcG9ydGlvbkluZGV4XS5sZW5ndGggPj0gcG9ydGlvblNpemUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICByZXF1ZXN0cy5wdXNoKFtdKTtcclxuICAgICAgICAgICAgICAgICAgICAgICBwb3J0aW9uSW5kZXggKys7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVlc3RzW3BvcnRpb25JbmRleF0ucHVzaChbXCJHZXRcIiwge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBcInR5cGVOYW1lXCI6IFwiUmVwb3J0VGVtcGxhdGVcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCJzZWFyY2hcIjoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IHRlbXBsYXRlLmlkLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5jbHVkZUJpbmFyeURhdGE6IHRydWVcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1dKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiByZXF1ZXN0cztcclxuICAgICAgICAgICAgfSwgW10pLFxyXG4gICAgICAgICAgICB0b3RhbFJlc3VsdHM6IGFueVtdW10gPSBbXSxcclxuICAgICAgICAgICAgZ2V0UG9ydGlvbkRhdGEgPSBwb3J0aW9uID0+IHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZTxhbnk+KChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmFwaS5tdWx0aUNhbGwocG9ydGlvbiwgcmVzb2x2ZSwgcmVqZWN0KTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBlcnJvclBvcnRpb25zID0gW107XHJcblxyXG4gICAgICAgIHRoaXMuYWJvcnRDdXJyZW50VGFzaygpO1xyXG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgPSBwb3J0aW9ucy5yZWR1Y2UoKHByb21pc2VzLCBwb3J0aW9uKSA9PiB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcHJvbWlzZXNcclxuICAgICAgICAgICAgICAgICAgICAudGhlbigoKSA9PiBnZXRQb3J0aW9uRGF0YShwb3J0aW9uKSlcclxuICAgICAgICAgICAgICAgICAgICAudGhlbihyZXN1bHQgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdG90YWxSZXN1bHRzID0gdG90YWxSZXN1bHRzLmNvbmNhdChyZXN1bHQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LCBlID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yUG9ydGlvbnMgPSBlcnJvclBvcnRpb25zLmNvbmNhdChwb3J0aW9uKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICB9LCBVdGlscy5yZXNvbHZlZFByb21pc2UoW10pKVxyXG4gICAgICAgICAgICAudGhlbigoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBlcnJvclBvcnRpb25zLmxlbmd0aCAmJiBjb25zb2xlLndhcm4oZXJyb3JQb3J0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICB0b3RhbFJlc3VsdHMuZm9yRWFjaCh0ZW1wbGF0ZURhdGEgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCB0ZW1wbGF0ZTogSVJlcG9ydFRlbXBsYXRlID0gdGVtcGxhdGVEYXRhLmxlbmd0aCA/IHRlbXBsYXRlRGF0YVswXSA6IHRlbXBsYXRlRGF0YTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZVRlbXBsYXRlKHRlbXBsYXRlKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zdHJ1Y3R1cmVkUmVwb3J0cyA9IHRoaXMuc3RydWN0dXJlUmVwb3J0cyh0aGlzLmFsbFJlcG9ydHMsIHRoaXMuYWxsVGVtcGxhdGVzKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnN0cnVjdHVyZWRSZXBvcnRzO1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAuY2F0Y2goY29uc29sZS5lcnJvcilcclxuICAgICAgICAgICAgLmZpbmFsbHkoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50VGFzayA9IG51bGw7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiB0aGlzLmN1cnJlbnRUYXNrO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXREYXNoYm9hcmRzUXR5ICgpOiBudW1iZXIge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmRhc2hib2FyZHNMZW5ndGg7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldEN1c3RvbWl6ZWRSZXBvcnRzUXR5ICgpOiBudW1iZXIge1xyXG4gICAgICAgIGxldCB0ZW1wbGF0ZXMgPSBbXTtcclxuICAgICAgICByZXR1cm4gKHRoaXMuYWxsUmVwb3J0cy5maWx0ZXIoKHJlcG9ydDogSVJlcG9ydCkgPT4ge1xyXG4gICAgICAgICAgICBsZXQgdGVtcGxhdGVJZCA9IHJlcG9ydC50ZW1wbGF0ZS5pZCxcclxuICAgICAgICAgICAgICAgIHRlbXBsYXRlRXhpc3RzOiBib29sZWFuID0gdGVtcGxhdGVzLmluZGV4T2YodGVtcGxhdGVJZCkgPiAtMSxcclxuICAgICAgICAgICAgICAgIGlzQ291bnQ6IGJvb2xlYW4gPSAhdGVtcGxhdGVFeGlzdHMgJiYgcmVwb3J0Lmxhc3RNb2RpZmllZFVzZXIgIT09IFwiTm9Vc2VySWRcIjtcclxuICAgICAgICAgICAgaXNDb3VudCAmJiB0ZW1wbGF0ZXMucHVzaCh0ZW1wbGF0ZUlkKTtcclxuICAgICAgICAgICAgcmV0dXJuIGlzQ291bnQ7XHJcbiAgICAgICAgfSkpLmxlbmd0aDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgdW5sb2FkICgpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLmFib3J0Q3VycmVudFRhc2soKTtcclxuICAgIH1cclxufSIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi9ibHVlYmlyZC5kLnRzXCIvPlxyXG5pbXBvcnQgeyBzb3J0QXJyYXlPZkVudGl0aWVzLCBlbnRpdHlUb0RpY3Rpb25hcnksIG1lcmdlVW5pcXVlIH0gZnJvbSBcIi4vdXRpbHNcIjtcclxuXHJcbmludGVyZmFjZSBJUnVsZSB7XHJcbiAgICBpZDogc3RyaW5nO1xyXG4gICAgZ3JvdXBzOiBhbnlbXTtcclxuICAgIGNvbmRpdGlvbjogYW55O1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIElSdWxlRGVwZW5kZW5jaWVzIHtcclxuICAgIGRldmljZXM/OiBhbnlbXTtcclxuICAgIHVzZXJzPzogYW55W107XHJcbiAgICB6b25lcz86IGFueVtdO1xyXG4gICAgem9uZVR5cGVzPzogYW55W107XHJcbiAgICB3b3JrVGltZXM/OiBhbnlbXTtcclxuICAgIHdvcmtIb2xpZGF5cz86IGFueVtdO1xyXG4gICAgZ3JvdXBzPzogYW55W107XHJcbiAgICBzZWN1cml0eUdyb3Vwcz86IGFueVtdO1xyXG4gICAgZGlhZ25vc3RpY3M/OiBhbnlbXTtcclxufVxyXG5cclxuY29uc3QgQVBQTElDQVRJT05fUlVMRV9JRCA9IFwiUnVsZUFwcGxpY2F0aW9uRXhjZXB0aW9uSWRcIjtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFJ1bGVzQnVpbGRlciB7XHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IGFwaTtcclxuICAgIHByaXZhdGUgY3VycmVudFRhc2s7XHJcbiAgICBwcml2YXRlIGNvbWJpbmVkUnVsZXM7XHJcbiAgICBwcml2YXRlIHN0cnVjdHVyZWRSdWxlcztcclxuXHJcbiAgICBwcml2YXRlIGdldFJ1bGVzICgpOiBQcm9taXNlPGFueT4ge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuYXBpLmNhbGwoXCJHZXRcIiwge1xyXG4gICAgICAgICAgICAgICAgXCJ0eXBlTmFtZVwiOiBcIlJ1bGVcIlxyXG4gICAgICAgICAgICB9LCByZXNvbHZlLCByZWplY3QpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgc3RydWN0dXJlUnVsZXMgKHJ1bGVzKSB7XHJcbiAgICAgICAgcmV0dXJuIHNvcnRBcnJheU9mRW50aXRpZXMocnVsZXMsIFtbXCJiYXNlVHlwZVwiLCBcImRlc2NcIl0sIFwibmFtZVwiXSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhYm9ydEN1cnJlbnRUYXNrICgpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrICYmIHRoaXMuY3VycmVudFRhc2suYWJvcnQgJiYgdGhpcy5jdXJyZW50VGFzay5hYm9ydCgpO1xyXG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgPSBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0cnVjdG9yKGFwaSkge1xyXG4gICAgICAgIHRoaXMuYXBpID0gYXBpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXREZXBlbmRlbmNpZXMgKHJ1bGVzKTogSVJ1bGVEZXBlbmRlbmNpZXMge1xyXG4gICAgICAgIGxldCBkZXBlbmRlbmNpZXMgPSB7XHJcbiAgICAgICAgICAgICAgICBkZXZpY2VzOiBbXSxcclxuICAgICAgICAgICAgICAgIHVzZXJzOiBbXSxcclxuICAgICAgICAgICAgICAgIHpvbmVzOiBbXSxcclxuICAgICAgICAgICAgICAgIHpvbmVUeXBlczogW10sXHJcbiAgICAgICAgICAgICAgICB3b3JrVGltZXM6IFtdLFxyXG4gICAgICAgICAgICAgICAgZ3JvdXBzOiBbXSxcclxuICAgICAgICAgICAgICAgIGRpYWdub3N0aWNzOiBbXVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBwcm9jZXNzRGVwZW5kZW5jaWVzID0gKGNvbmRpdGlvbikgPT4ge1xyXG4gICAgICAgICAgICAgICAgbGV0IGlkLCB0eXBlOiBzdHJpbmc7XHJcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKGNvbmRpdGlvbi5jb25kaXRpb25UeXBlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIlJ1bGVXb3JrSG91cnNcIjpcclxuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiQWZ0ZXJSdWxlV29ya0hvdXJzXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkID0gKGNvbmRpdGlvbi53b3JrVGltZSAmJiBjb25kaXRpb24ud29ya1RpbWUuaWQpIHx8IGNvbmRpdGlvbi53b3JrVGltZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZSA9IFwid29ya1RpbWVzXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJEcml2ZXJcIjpcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWQgPSBjb25kaXRpb24uZHJpdmVyICYmIGNvbmRpdGlvbi5kcml2ZXIuaWQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGUgPSBcInVzZXJzXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJEZXZpY2VcIjpcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWQgPSBjb25kaXRpb24uZGV2aWNlICYmIGNvbmRpdGlvbi5kZXZpY2UuaWQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGUgPSBcImRldmljZXNcIjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIkVudGVyaW5nQXJlYVwiOlxyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJFeGl0aW5nQXJlYVwiOlxyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJPdXRzaWRlQXJlYVwiOlxyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJJbnNpZGVBcmVhXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjb25kaXRpb24uem9uZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWQgPSBjb25kaXRpb24uem9uZS5pZCB8fCBjb25kaXRpb24uem9uZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGUgPSBcInpvbmVzXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZCA9IGNvbmRpdGlvbi56b25lVHlwZS5pZDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGUgPSBcInpvbmVUeXBlc1wiO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJGaWx0ZXJTdGF0dXNEYXRhQnlEaWFnbm9zdGljXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIkFjdGl2ZU9ySW5hY3RpdmVGYXVsdFwiOlxyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJGYXVsdFwiOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29uZGl0aW9uLmRpYWdub3N0aWMpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkID0gY29uZGl0aW9uLmRpYWdub3N0aWMuaWQgfHwgY29uZGl0aW9uLmRpYWdub3N0aWM7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlID0gXCJkaWFnbm9zdGljc1wiO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWQgJiYgdHlwZSAmJiBkZXBlbmRlbmNpZXNbdHlwZV0uaW5kZXhPZihpZCkgPT09IC0xICYmIGRlcGVuZGVuY2llc1t0eXBlXS5wdXNoKGlkKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgY2hlY2tDb25kaXRpb25zID0gKHBhcmVudENvbmRpdGlvbiwgZGVwZW5kZW5jaWVzOiBJUnVsZURlcGVuZGVuY2llcyk6IElSdWxlRGVwZW5kZW5jaWVzID0+IHtcclxuICAgICAgICAgICAgICAgIGxldCBjb25kaXRpb25zID0gcGFyZW50Q29uZGl0aW9uLmNoaWxkcmVuIHx8IFtdO1xyXG4gICAgICAgICAgICAgICAgcHJvY2Vzc0RlcGVuZGVuY2llcyhwYXJlbnRDb25kaXRpb24pO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbmRpdGlvbnMucmVkdWNlKChkZXBlbmRlbmNpZXMsIGNvbmRpdGlvbikgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChjb25kaXRpb24uY2hpbGRyZW4pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGVwZW5kZW5jaWVzID0gY2hlY2tDb25kaXRpb25zKGNvbmRpdGlvbiwgZGVwZW5kZW5jaWVzKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgcHJvY2Vzc0RlcGVuZGVuY2llcyhjb25kaXRpb24pO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBkZXBlbmRlbmNpZXM7XHJcbiAgICAgICAgICAgICAgICB9LCBkZXBlbmRlbmNpZXMpO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIHJldHVybiBydWxlcy5yZWR1Y2UoKGRlcGVuZGVuY2llczogSVJ1bGVEZXBlbmRlbmNpZXMsIHJ1bGU6IElSdWxlKSA9PiB7XHJcbiAgICAgICAgICAgIGRlcGVuZGVuY2llcy5ncm91cHMgPSBtZXJnZVVuaXF1ZShkZXBlbmRlbmNpZXMuZ3JvdXBzLCBydWxlLmdyb3Vwcy5tYXAoZ3JvdXAgPT4gZ3JvdXAuaWQpKTtcclxuICAgICAgICAgICAgaWYgKHJ1bGUuY29uZGl0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICBkZXBlbmRlbmNpZXMgPSBjaGVja0NvbmRpdGlvbnMocnVsZS5jb25kaXRpb24sIGRlcGVuZGVuY2llcyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIGRlcGVuZGVuY2llcztcclxuICAgICAgICB9LCBkZXBlbmRlbmNpZXMpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBmZXRjaCgpOiBQcm9taXNlPGFueT4ge1xyXG4gICAgICAgIHRoaXMuYWJvcnRDdXJyZW50VGFzaygpO1xyXG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgPSB0aGlzLmdldFJ1bGVzKClcclxuICAgICAgICAgICAgLnRoZW4oKHN3aXRjaGVkT25SdWxlcykgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jb21iaW5lZFJ1bGVzID0gZW50aXR5VG9EaWN0aW9uYXJ5KHN3aXRjaGVkT25SdWxlcyk7XHJcbiAgICAgICAgICAgICAgICBkZWxldGUodGhpcy5jb21iaW5lZFJ1bGVzW0FQUExJQ0FUSU9OX1JVTEVfSURdKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuc3RydWN0dXJlZFJ1bGVzID0gdGhpcy5zdHJ1Y3R1cmVSdWxlcyhPYmplY3Qua2V5cyh0aGlzLmNvbWJpbmVkUnVsZXMpLm1hcChrZXkgPT4gdGhpcy5jb21iaW5lZFJ1bGVzW2tleV0pKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBPYmplY3Qua2V5cyh0aGlzLmNvbWJpbmVkUnVsZXMpLm1hcChydWxlSWQgPT4gdGhpcy5jb21iaW5lZFJ1bGVzW3J1bGVJZF0pO1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAuY2F0Y2goY29uc29sZS5lcnJvcilcclxuICAgICAgICAgICAgLmZpbmFsbHkoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50VGFzayA9IG51bGw7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiB0aGlzLmN1cnJlbnRUYXNrO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXRSdWxlc0RhdGEgKHJ1bGVzSWRzOiBzdHJpbmdbXSk6IElSdWxlW10ge1xyXG4gICAgICAgIHJldHVybiBydWxlc0lkcy5tYXAocnVsZUlkID0+IHRoaXMuY29tYmluZWRSdWxlc1tydWxlSWRdKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgdW5sb2FkICgpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLmFib3J0Q3VycmVudFRhc2soKTtcclxuICAgIH1cclxufSIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi9ibHVlYmlyZC5kLnRzXCIvPlxyXG5pbXBvcnQgR3JvdXBzQnVpbGRlciBmcm9tIFwiLi9ncm91cHNCdWlsZGVyXCI7XHJcbmltcG9ydCAqIGFzIFV0aWxzIGZyb20gXCIuL3V0aWxzXCI7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBTZWN1cml0eUNsZWFyYW5jZXNCdWlsZGVyIGV4dGVuZHMgR3JvdXBzQnVpbGRlciB7XHJcblxyXG4gICAgY29uc3RydWN0b3IoYXBpOiBhbnkpIHtcclxuICAgICAgICBzdXBlcihhcGkpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgZ2V0U2VjdXJpdHlHcm91cHMgKCk6IFByb21pc2U8YW55PiB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5hcGkuZ2V0U2Vzc2lvbigoc2Vzc2lvbkRhdGEpID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMuYXBpLmNhbGwoXCJHZXRcIiwge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlTmFtZTogXCJHcm91cFwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWFyY2g6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkOiBcIkdyb3VwU2VjdXJpdHlJZFwiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9LCByZXNvbHZlLCByZWplY3QpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgcHVibGljIGZldGNoICgpOiBQcm9taXNlPGFueT4ge1xyXG4gICAgICAgIHRoaXMuYWJvcnRDdXJyZW50VGFzaygpO1xyXG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgPSB0aGlzLmdldFNlY3VyaXR5R3JvdXBzKClcclxuICAgICAgICAgICAgLnRoZW4oZ3JvdXBzID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZ3JvdXBzID0gZ3JvdXBzO1xyXG4gICAgICAgICAgICAgICAgdGhpcy50cmVlID0gdGhpcy5jcmVhdGVHcm91cHNUcmVlKGdyb3Vwcyk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRUcmVlID0gVXRpbHMuZXh0ZW5kKHt9LCB0aGlzLnRyZWUpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlRmxhdEdyb3Vwc0xpc3QodGhpcy50cmVlKS5maWx0ZXIoZ3JvdXAgPT4gISFncm91cC5uYW1lKTtcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgLmNhdGNoKGNvbnNvbGUuZXJyb3IpXHJcbiAgICAgICAgICAgIC5maW5hbGx5KCgpID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudFRhc2sgPSBudWxsO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4gdGhpcy5jdXJyZW50VGFzaztcclxuICAgIH07XHJcbn0iLCIvL2FkZGVkIGJ5IEJyZXR0IHRvIG1hbmFnZSBhZGRpbmcgYWxsIHVzZXJzIHRvIHRoZSBleHBvcnQgYXMgYW4gb3B0aW9uXHJcblxyXG5leHBvcnQgY2xhc3MgVXNlckJ1aWxkZXIge1xyXG4gICAgcHJpdmF0ZSByZWFkb25seSBhcGk7XHJcbiAgICBwcml2YXRlIGN1cnJlbnRUYXNrO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKGFwaSkge1xyXG4gICAgICAgIHRoaXMuYXBpID0gYXBpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYWJvcnRDdXJyZW50VGFzayAoKSB7XHJcbiAgICAgICAgdGhpcy5jdXJyZW50VGFzayAmJiB0aGlzLmN1cnJlbnRUYXNrLmFib3J0ICYmIHRoaXMuY3VycmVudFRhc2suYWJvcnQoKTtcclxuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrID0gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICAvL2ZpbGxzIHRoZSB1c2VyIGJ1aWxkZXIgd2l0aCBhbGwgdXNlcnNcclxuICAgIGZldGNoICgpOiBQcm9taXNlPGFueT4ge1xyXG4gICAgICAgIHRoaXMuYWJvcnRDdXJyZW50VGFzaygpO1xyXG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgPSB0aGlzLmdldFVzZXJzKClcclxuICAgICAgICByZXR1cm4gdGhpcy5jdXJyZW50VGFzaztcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGdldFVzZXJzICgpOiBQcm9taXNlPGFueT4ge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuYXBpLmNhbGwoXCJHZXRcIiwge1xyXG4gICAgICAgICAgICAgICAgXCJ0eXBlTmFtZVwiOiBcIlVzZXJcIlxyXG4gICAgICAgICAgICB9LCByZXNvbHZlLCByZWplY3QpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHVubG9hZCAoKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5hYm9ydEN1cnJlbnRUYXNrKCk7XHJcbiAgICB9XHJcbn0iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vYmx1ZWJpcmQuZC50c1wiLz5cclxuaW50ZXJmYWNlIElDbGFzc0NvbnRyb2wge1xyXG4gICAgZ2V0OiAoKSA9PiBzdHJpbmc7XHJcbiAgICBzZXQ6IChuYW1lOiBzdHJpbmcpID0+IHZvaWQ7XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgSUVudGl0eSB7XHJcbiAgICBpZDogc3RyaW5nO1xyXG4gICAgW3Byb3BOYW1lOiBzdHJpbmddOiBhbnk7XHJcbn1cclxuXHJcbnR5cGUgSVNvcnRQcm9wZXJ0eSA9IHN0cmluZyB8IFtzdHJpbmcsIFwiYXNjXCIgfCBcImRlc2NcIl07XHJcblxyXG5sZXQgY2xhc3NOYW1lQ3RybCA9IGZ1bmN0aW9uIChlbDogRWxlbWVudCk6IElDbGFzc0NvbnRyb2wge1xyXG4gICAgICAgIHZhciBwYXJhbSA9IHR5cGVvZiBlbC5jbGFzc05hbWUgPT09IFwic3RyaW5nXCIgPyBcImNsYXNzTmFtZVwiIDogXCJiYXNlVmFsXCI7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZWxbcGFyYW1dIHx8IFwiXCI7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHNldDogZnVuY3Rpb24gKHRleHQpIHtcclxuICAgICAgICAgICAgICAgIGVsW3BhcmFtXSA9IHRleHQ7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgfSxcclxuICAgIGlzVXN1YWxPYmplY3QgPSBmdW5jdGlvbiAob2JqKSB7XHJcbiAgICAgICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmopLmluZGV4T2YoXCJPYmplY3RcIikgIT09IC0xO1xyXG4gICAgfTtcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgSUhhc2gge1xyXG4gICAgW2lkOiBzdHJpbmddOiBhbnk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiByZW1vdmVDbGFzcyhlbDogRWxlbWVudCwgbmFtZTogc3RyaW5nKTogdm9pZCB7XHJcbiAgICBpZiAoIWVsKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgbGV0IGNsYXNzZXNTdHIgPSBjbGFzc05hbWVDdHJsKGVsKS5nZXQoKSxcclxuICAgICAgICBjbGFzc2VzID0gY2xhc3Nlc1N0ci5zcGxpdChcIiBcIiksXHJcbiAgICAgICAgbmV3Q2xhc3NlcyA9IGNsYXNzZXMuZmlsdGVyKGNsYXNzSXRlbSA9PiBjbGFzc0l0ZW0gIT09IG5hbWUpO1xyXG4gICAgY2xhc3NOYW1lQ3RybChlbCkuc2V0KG5ld0NsYXNzZXMuam9pbihcIiBcIikpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gYWRkQ2xhc3MoZWwsIG5hbWUpOiB2b2lkIHtcclxuICAgIGlmICghZWwpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICBsZXQgY2xhc3Nlc1N0ciA9IGNsYXNzTmFtZUN0cmwoZWwpLmdldCgpLFxyXG4gICAgICAgIGNsYXNzZXMgPSBjbGFzc2VzU3RyLnNwbGl0KFwiIFwiKTtcclxuICAgIGlmIChjbGFzc2VzLmluZGV4T2YobmFtZSkgPT09IC0xKSB7XHJcbiAgICAgICAgY2xhc3NOYW1lQ3RybChlbCkuc2V0KGNsYXNzZXNTdHIgKyBcIiBcIiArIG5hbWUpO1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gaGFzQ2xhc3MoZWw6IEVsZW1lbnQsIGNsYXNzTmFtZTogc3RyaW5nKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gZWwgJiYgY2xhc3NOYW1lQ3RybChlbCkuZ2V0KCkuaW5kZXhPZihjbGFzc05hbWUpICE9PSAtMTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGV4dGVuZCguLi5hcmdzOiBhbnlbXSkge1xyXG4gICAgdmFyIGxlbmd0aCA9IGFyZ3MubGVuZ3RoLFxyXG4gICAgICAgIHNyYywgc3JjS2V5cywgc3JjQXR0cixcclxuICAgICAgICBmdWxsQ29weSA9IGZhbHNlLFxyXG4gICAgICAgIHJlc0F0dHIsXHJcbiAgICAgICAgcmVzID0gYXJnc1swXSwgaSA9IDEsIGo7XHJcblxyXG4gICAgaWYgKHR5cGVvZiByZXMgPT09IFwiYm9vbGVhblwiKSB7XHJcbiAgICAgICAgZnVsbENvcHkgPSByZXM7XHJcbiAgICAgICAgcmVzID0gYXJnc1sxXTtcclxuICAgICAgICBpKys7XHJcbiAgICB9XHJcbiAgICB3aGlsZSAoaSAhPT0gbGVuZ3RoKSB7XHJcbiAgICAgICAgc3JjID0gYXJnc1tpXTtcclxuICAgICAgICBzcmNLZXlzID0gT2JqZWN0LmtleXMoc3JjKTtcclxuICAgICAgICBmb3IgKGogPSAwOyBqIDwgc3JjS2V5cy5sZW5ndGg7IGorKykge1xyXG4gICAgICAgICAgICBzcmNBdHRyID0gc3JjW3NyY0tleXNbal1dO1xyXG4gICAgICAgICAgICBpZiAoZnVsbENvcHkgJiYgKGlzVXN1YWxPYmplY3Qoc3JjQXR0cikgfHwgQXJyYXkuaXNBcnJheShzcmNBdHRyKSkpIHtcclxuICAgICAgICAgICAgICAgIHJlc0F0dHIgPSByZXNbc3JjS2V5c1tqXV07XHJcbiAgICAgICAgICAgICAgICByZXNBdHRyID0gcmVzW3NyY0tleXNbal1dID0gKGlzVXN1YWxPYmplY3QocmVzQXR0cikgfHwgQXJyYXkuaXNBcnJheShyZXNBdHRyKSkgPyByZXNBdHRyIDogKEFycmF5LmlzQXJyYXkoc3JjQXR0cikgPyBbXSA6IHt9KTtcclxuICAgICAgICAgICAgICAgIGV4dGVuZChmdWxsQ29weSwgcmVzQXR0ciwgc3JjQXR0cik7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZXNbc3JjS2V5c1tqXV0gPSBzcmNbc3JjS2V5c1tqXV07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgaSsrO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHJlcztcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGVudGl0eVRvRGljdGlvbmFyeShlbnRpdGllczogYW55W10sIGVudGl0eUNhbGxiYWNrPzogKGVudGl0eTogYW55KSA9PiBhbnkpOiBJSGFzaCB7XHJcbiAgICB2YXIgZW50aXR5LCBvID0ge30sIGksXHJcbiAgICAgICAgbCA9IGVudGl0aWVzLmxlbmd0aDtcclxuXHJcbiAgICBmb3IgKGkgPSAwOyBpIDwgbDsgaSsrKSB7XHJcbiAgICAgICAgaWYgKGVudGl0aWVzW2ldKSB7XHJcbiAgICAgICAgICAgIGVudGl0eSA9IGVudGl0aWVzW2ldLmlkID8gZW50aXRpZXNbaV0gOiB7aWQ6IGVudGl0aWVzW2ldfTtcclxuICAgICAgICAgICAgb1tlbnRpdHkuaWRdID0gZW50aXR5Q2FsbGJhY2sgPyBlbnRpdHlDYWxsYmFjayhlbnRpdHkpIDogZW50aXR5O1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBvO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gc29ydEFycmF5T2ZFbnRpdGllcyhlbnRpdGllczogYW55W10sIHNvcnRpbmdGaWVsZHM6IElTb3J0UHJvcGVydHlbXSk6IGFueVtdIHtcclxuICAgIGxldCBjb21wYXJhdG9yID0gKHByZXZJdGVtLCBuZXh0SXRlbSwgcHJvcGVydGllczogYW55W10sIGluZGV4ID0gMCkgPT4ge1xyXG4gICAgICAgIGlmIChwcm9wZXJ0aWVzLmxlbmd0aCA8PSBpbmRleCkge1xyXG4gICAgICAgICAgICByZXR1cm4gMDtcclxuICAgICAgICB9XHJcbiAgICAgICAgbGV0IG9wdGlvbnMgPSBwcm9wZXJ0aWVzW2luZGV4XSxcclxuICAgICAgICAgICAgW3Byb3BlcnR5LCBkaXIgPSBcImFzY1wiXSA9IEFycmF5LmlzQXJyYXkob3B0aW9ucykgPyBvcHRpb25zIDogW29wdGlvbnNdLFxyXG4gICAgICAgICAgICBkaXJNdWx0aXBsaWVyOiBudW1iZXI7XHJcbiAgICAgICAgZGlyTXVsdGlwbGllciA9IGRpciA9PT0gXCJhc2NcIiA/IDEgOiAtMTtcclxuICAgICAgICBpZiAocHJldkl0ZW1bcHJvcGVydHldID4gbmV4dEl0ZW1bcHJvcGVydHldKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAxICogZGlyTXVsdGlwbGllcjtcclxuICAgICAgICB9IGVsc2UgaWYgKHByZXZJdGVtW3Byb3BlcnR5XSA8IG5leHRJdGVtW3Byb3BlcnR5XSkge1xyXG4gICAgICAgICAgICByZXR1cm4gLTEgKiBkaXJNdWx0aXBsaWVyO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHJldHVybiBjb21wYXJhdG9yKHByZXZJdGVtLCBuZXh0SXRlbSwgcHJvcGVydGllcywgaW5kZXggKyAxKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG4gICAgcmV0dXJuIGVudGl0aWVzLnNvcnQoKHByZXZUZW1wbGF0ZSwgbmV4dFRlbXBsYXRlKSA9PiB7XHJcbiAgICAgICAgcmV0dXJuIGNvbXBhcmF0b3IocHJldlRlbXBsYXRlLCBuZXh0VGVtcGxhdGUsIHNvcnRpbmdGaWVsZHMpO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBkb3dubG9hZERhdGFBc0ZpbGUoZGF0YTogc3RyaW5nLCBmaWxlbmFtZTogc3RyaW5nLCBtaW1lVHlwZSA9IFwidGV4dC9qc29uXCIpIHtcclxuICAgIGxldCBibG9iID0gbmV3IEJsb2IoW2RhdGFdLCB7dHlwZTogbWltZVR5cGV9KSxcclxuICAgICAgICBlbGVtO1xyXG4gICAgaWYgKHdpbmRvdy5uYXZpZ2F0b3IubXNTYXZlT3JPcGVuQmxvYikge1xyXG4gICAgICAgIHdpbmRvdy5uYXZpZ2F0b3IubXNTYXZlQmxvYihibG9iLCBmaWxlbmFtZSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIGVsZW0gPSB3aW5kb3cuZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImFcIik7XHJcbiAgICAgICAgZWxlbS5ocmVmID0gd2luZG93LlVSTC5jcmVhdGVPYmplY3RVUkwoYmxvYik7XHJcbiAgICAgICAgZWxlbS5kb3dubG9hZCA9IGZpbGVuYW1lO1xyXG4gICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoZWxlbSk7XHJcbiAgICAgICAgZWxlbS5jbGljaygpO1xyXG4gICAgICAgIGRvY3VtZW50LmJvZHkucmVtb3ZlQ2hpbGQoZWxlbSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBtZXJnZVVuaXF1ZUVudGl0aWVzICguLi5zb3VyY2VzOiBJRW50aXR5W11bXSk6IElFbnRpdHlbXSB7XHJcbiAgICBsZXQgYWRkZWRJZHM6IHN0cmluZ1tdID0gW10sXHJcbiAgICAgICAgbWVyZ2VkSXRlbXM6IElFbnRpdHlbXSA9IFtdO1xyXG4gICAgc291cmNlcy5mb3JFYWNoKHNvdXJjZSA9PiBzb3VyY2UuZm9yRWFjaChpdGVtID0+IHtcclxuICAgICAgICBpZiAoaXRlbSAmJiBpdGVtLmlkICYmIGFkZGVkSWRzLmluZGV4T2YoaXRlbS5pZCkgPT09IC0xKSB7XHJcbiAgICAgICAgICAgIGFkZGVkSWRzLnB1c2goaXRlbS5pZCk7XHJcbiAgICAgICAgICAgIG1lcmdlZEl0ZW1zLnB1c2goaXRlbSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSkpO1xyXG4gICAgcmV0dXJuIG1lcmdlZEl0ZW1zO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0RW50aXRpZXNJZHMgKGVudGl0aWVzTGlzdDogSUVudGl0eVtdKTogc3RyaW5nW10ge1xyXG4gICAgcmV0dXJuIEFycmF5LmlzQXJyYXkoZW50aXRpZXNMaXN0KSAmJiBlbnRpdGllc0xpc3QucmVkdWNlKChyZXN1bHQsIGVudGl0eSkgPT4ge1xyXG4gICAgICAgIGVudGl0eSAmJiBlbnRpdHkuaWQgJiYgcmVzdWx0LnB1c2goZW50aXR5LmlkKTtcclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfSwgW10pIHx8IFtdO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbWVyZ2VVbmlxdWUgKC4uLnNvdXJjZXM6IHN0cmluZ1tdW10pOiBzdHJpbmdbXSB7XHJcbiAgICBsZXQgbWVyZ2VkSXRlbXM6IHN0cmluZ1tdID0gW107XHJcbiAgICBzb3VyY2VzLmZvckVhY2goc291cmNlID0+IHtcclxuICAgICAgICBBcnJheS5pc0FycmF5KHNvdXJjZSkgJiYgc291cmNlLmZvckVhY2goaXRlbSA9PiB7XHJcbiAgICAgICAgICAgIGl0ZW0gJiYgbWVyZ2VkSXRlbXMuaW5kZXhPZihpdGVtKSA9PT0gLTEgJiYgbWVyZ2VkSXRlbXMucHVzaChpdGVtKTtcclxuICAgICAgICB9KTtcclxuICAgIH0pO1xyXG4gICAgcmV0dXJuIG1lcmdlZEl0ZW1zO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0VW5pcXVlRW50aXRpZXMgKG5ld0VudGl0aWVzOiBJRW50aXR5W10sIGV4aXN0ZWRFbnRpdGllczogSUVudGl0eVtdKTogSUVudGl0eVtdIHtcclxuICAgIGxldCBzZWxlY3RlZEVudGl0aWVzSGFzaCA9IGVudGl0eVRvRGljdGlvbmFyeShleGlzdGVkRW50aXRpZXMpO1xyXG4gICAgcmV0dXJuIG5ld0VudGl0aWVzLnJlZHVjZSgocmVzLCBlbnRpdHkpID0+IHtcclxuICAgICAgICAhc2VsZWN0ZWRFbnRpdGllc0hhc2hbZW50aXR5LmlkXSAmJiByZXMucHVzaChlbnRpdHkpO1xyXG4gICAgICAgIHJldHVybiByZXM7XHJcbiAgICB9LCBbXSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB0b2dldGhlcihwcm9taXNlczogUHJvbWlzZTxhbnk+W10pOiBQcm9taXNlPGFueT4ge1xyXG4gICAgbGV0IHJlc3VsdHMgPSBbXSxcclxuICAgICAgICByZXN1bHRzQ291bnQgPSAwO1xyXG4gICAgcmVzdWx0cy5sZW5ndGggPSBwcm9taXNlcy5sZW5ndGg7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgIGxldCByZXNvbHZlQWxsID0gKCkgPT4ge1xyXG4gICAgICAgICAgICByZXR1cm4gcmVzb2x2ZShyZXN1bHRzKTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIHByb21pc2VzLmxlbmd0aCA/IHByb21pc2VzLmZvckVhY2goKHByb21pc2UsIGluZGV4KSA9PiB7XHJcbiAgICAgICAgICAgIHByb21pc2UudGhlbigocmVzdWx0KSA9PiB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHRzQ291bnQrKztcclxuICAgICAgICAgICAgICAgIHJlc3VsdHNbaW5kZXhdID0gcmVzdWx0O1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0c0NvdW50ID09PSBwcm9taXNlcy5sZW5ndGggJiYgcmVzb2x2ZUFsbCgpO1xyXG4gICAgICAgICAgICB9KS5jYXRjaCgoZXJyb3IpID0+IHtcclxuICAgICAgICAgICAgICAgIHJlamVjdCh7XHJcbiAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGVycm9yLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb21pc2VJbmRleDogaW5kZXhcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KSA6IHJlc29sdmVBbGwoKTtcclxuICAgIH0pO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcmVzb2x2ZWRQcm9taXNlPFQ+ICh2YWw/OiBUKTogUHJvbWlzZTxUPiB7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2U8VD4ocmVzb2x2ZSA9PiByZXNvbHZlKHZhbCkpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gdG9BcnJheSAoZGF0YSkge1xyXG4gICAgcmV0dXJuIEFycmF5LmlzQXJyYXkoZGF0YSkgPyBkYXRhIDogW2RhdGFdO1xyXG59IiwiZXhwb3J0IGRlZmF1bHQgY2xhc3MgV2FpdGluZyB7XHJcblxyXG4gICAgcHJpdmF0ZSB3YWl0aW5nQ29udGFpbmVyOiBIVE1MRWxlbWVudDtcclxuICAgIHByaXZhdGUgYm9keUVsOiBIVE1MRWxlbWVudCA9IGRvY3VtZW50LmJvZHk7XHJcblxyXG4gICAgcHVibGljIHN0YXJ0KGVsOiBIVE1MRWxlbWVudCA9IHRoaXMuYm9keUVsLCB6SW5kZXg/OiBudW1iZXIpIHtcclxuICAgICAgICBpZiAoZWwub2Zmc2V0UGFyZW50ID09PSBudWxsKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy53YWl0aW5nQ29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcclxuICAgICAgICB0aGlzLndhaXRpbmdDb250YWluZXIuY2xhc3NOYW1lID0gXCJ3YWl0aW5nXCI7XHJcbiAgICAgICAgdGhpcy53YWl0aW5nQ29udGFpbmVyLmlubmVySFRNTCA9IFwiPGRpdiBjbGFzcz0nZmFkZXInPjwvZGl2PjxkaXYgY2xhc3M9J3NwaW5uZXInPjwvZGl2PlwiO1xyXG4gICAgICAgIGVsLnBhcmVudE5vZGUuYXBwZW5kQ2hpbGQodGhpcy53YWl0aW5nQ29udGFpbmVyKTtcclxuXHJcbiAgICAgICAgdGhpcy53YWl0aW5nQ29udGFpbmVyLnN0eWxlLnBvc2l0aW9uID0gXCJhYnNvbHV0ZVwiO1xyXG4gICAgICAgIHRoaXMud2FpdGluZ0NvbnRhaW5lci5zdHlsZS53aWR0aCA9IGVsLm9mZnNldFdpZHRoICsgXCJweFwiO1xyXG4gICAgICAgIHRoaXMud2FpdGluZ0NvbnRhaW5lci5zdHlsZS5oZWlnaHQgPSBlbC5vZmZzZXRIZWlnaHQgKyBcInB4XCI7XHJcbiAgICAgICAgdGhpcy53YWl0aW5nQ29udGFpbmVyLnN0eWxlLnRvcCA9IGVsLm9mZnNldFRvcCArIFwicHhcIjtcclxuICAgICAgICB0aGlzLndhaXRpbmdDb250YWluZXIuc3R5bGUubGVmdCA9IGVsLm9mZnNldExlZnQgKyBcInB4XCI7XHJcbiAgICAgICAgdGhpcy53YWl0aW5nQ29udGFpbmVyLnN0eWxlLmRpc3BsYXkgPSBcImJsb2NrXCI7XHJcbiAgICAgICAgdHlwZW9mIHpJbmRleCA9PT0gXCJudW1iZXJcIiAmJiAodGhpcy53YWl0aW5nQ29udGFpbmVyLnN0eWxlLnpJbmRleCA9IHpJbmRleC50b1N0cmluZygpKTtcclxuICAgIH07XHJcblxyXG4gICAgcHVibGljIHN0b3AgKCkge1xyXG4gICAgICAgIGlmICh0aGlzLndhaXRpbmdDb250YWluZXIgJiYgdGhpcy53YWl0aW5nQ29udGFpbmVyLnBhcmVudE5vZGUpIHtcclxuICAgICAgICAgICAgdGhpcy53YWl0aW5nQ29udGFpbmVyLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQodGhpcy53YWl0aW5nQ29udGFpbmVyKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG59IiwiLy9hZGRlZCBieSBCcmV0dCB0byBtYW5hZ2UgYWRkaW5nIGFsbCB6b25lcyB0byB0aGUgZXhwb3J0IGFzIGFuIG9wdGlvblxyXG5cclxuZXhwb3J0IGNsYXNzIFpvbmVCdWlsZGVyIHtcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgYXBpO1xyXG4gICAgcHJpdmF0ZSBjdXJyZW50VGFzaztcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihhcGkpIHtcclxuICAgICAgICB0aGlzLmFwaSA9IGFwaTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFib3J0Q3VycmVudFRhc2sgKCkge1xyXG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgJiYgdGhpcy5jdXJyZW50VGFzay5hYm9ydCAmJiB0aGlzLmN1cnJlbnRUYXNrLmFib3J0KCk7XHJcbiAgICAgICAgdGhpcy5jdXJyZW50VGFzayA9IG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgLy9maWxscyB0aGUgdXNlciBidWlsZGVyIHdpdGggYWxsIHVzZXJzXHJcbiAgICBmZXRjaCAoKTogUHJvbWlzZTxhbnk+IHtcclxuICAgICAgICB0aGlzLmFib3J0Q3VycmVudFRhc2soKTtcclxuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrID0gdGhpcy5nZXRab25lcygpXHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY3VycmVudFRhc2s7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBnZXRab25lcyAoKTogUHJvbWlzZTxhbnk+IHtcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLmFwaS5jYWxsKFwiR2V0XCIsIHtcclxuICAgICAgICAgICAgICAgIFwidHlwZU5hbWVcIjogXCJab25lXCJcclxuICAgICAgICAgICAgfSwgcmVzb2x2ZSwgcmVqZWN0KTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICB1bmxvYWQgKCk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMuYWJvcnRDdXJyZW50VGFzaygpO1xyXG4gICAgfVxyXG59Il19
