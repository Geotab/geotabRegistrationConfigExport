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
        this.submitChangesBtn = document.getElementById("submitChangesButton");
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
        this.submitChanges = function () {
            _this.render();
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
    Addin.prototype.render = function () {
        var _this = this;
        this.data.users = [];
        this.data.zones = [];
        this.setAddinsToNull();
        //wire up the dom
        var mapMessageTemplate = document.getElementById("mapMessageTemplate").innerHTML, groupsBlock = document.getElementById("exportedGroups"), securityClearancesBlock = document.getElementById("exportedSecurityClearances"), rulesBlock = document.getElementById("exportedRules"), reportsBlock = document.getElementById("exportedReports"), dashboardsBlock = document.getElementById("exportedDashboards"), addinsBlock = document.getElementById("exportedAddins"), exportAllAddinsCheckbox = document.getElementById("export_all_addins_checkbox"), 
        // thisAddinBlock: HTMLElement = document.getElementById("includeThisAddin"),
        // thisAddinIncludedCheckbox: HTMLElement = document.querySelector("#includeThisAddin > input"),
        mapBlockDescription = document.querySelector("#exportedMap > .description"), usersBlock = document.getElementById("exportedUsers"), exportAllUsersCheckbox = document.getElementById("export_all_users_checkbox"), zonesBlock = document.getElementById("exportedZones"), exportAllZonesCheckbox = document.getElementById("export_all_zones_checkbox");
        //wire up the export button event
        this.exportBtn.addEventListener("click", this.exportData, false);
        this.submitChangesBtn.addEventListener("click", this.submitChanges, false);
        //wire up the includeThisAddin checkbox event
        // thisAddinIncludedCheckbox.addEventListener("change", this.toggleThisAddinIncluded, false);
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
            this.miscBuilder.fetch(),
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
            customMap = _this.miscBuilder.getMapProviderData(_this.data.misc.mapProvider.value);
            customMap && _this.data.customMaps.push(customMap);
            reportsDependencies = _this.reportsBuilder.getDependencies(_this.data.reports);
            rulesDependencies = _this.rulesBuilder.getDependencies(_this.data.rules);
            distributionListsDependencies = _this.distributionListsBuilder.getDependencies(_this.data.distributionLists);
            dependencies = _this.combineDependencies(reportsDependencies, rulesDependencies, distributionListsDependencies);
            _this.tempUsers = results[6];
            _this.tempZones = results[7];
            //this is where the users & zones are added
            return _this.resolveDependencies(dependencies, _this.data);
        }).then(function () {
            // debugger;
            if (exportAllUsersCheckbox.checked == true) {
                //sets exported users equal to all database users
                _this.data.users = _this.tempUsers;
            }
            if (exportAllZonesCheckbox.checked == true) {
                //sets exported users equal to all database users
                _this.data.zones = _this.tempZones;
            }
            if (exportAllAddinsCheckbox.checked == false) {
                //sets exported addins equal to none/empty array
                _this.setAddinsToNull();
            }
            var mapProvider = _this.miscBuilder.getMapProviderName(_this.data.misc.mapProvider.value);
            // this.data.zones.length
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
        this.submitChangesBtn.removeEventListener("click", this.submitChanges, false);
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
    //todo problem code...is this necessary?
    MiscBuilder.prototype.getAllowedAddins = function (allAddins) {
        return allAddins.filter(function (addin) {
            var addinConfig = JSON.parse(addin);
            return addinConfig && Array.isArray(addinConfig.items) && addinConfig.items.every(function (item) {
                var url = item.url;
                console.log('here...');
                return url && url.indexOf("\/\/") > -1;
            });
        });
    };
    MiscBuilder.prototype.isCurrentAddin = function (addin) {
        return addin.indexOf("Registration config") > -1;
    };
    //fills the Misc builder (system settings) with the relevant information
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
            _this.purgeSettings = systemSettings.purgeSettings;
            _this.emailSenderFrom = systemSettings.emailSenderFrom;
            _this.currentUser = currentUser;
            _this.customMapProviders = utils_1.entityToDictionary(systemSettings.customWebMapProviderList);
            _this.isUnsignedAddinsAllowed = systemSettings.allowUnsignedAddIn;
            // removed by Brett to include single line addin structures
            // this.addins = this.getAllowedAddins(systemSettings.customerPages);
            _this.addins = systemSettings.customerPages;
            return {
                mapProvider: {
                    value: mapProviderId,
                    type: _this.getMapProviderType(mapProviderId)
                },
                currentUser: _this.currentUser,
                isUnsignedAddinsAllowed: _this.isUnsignedAddinsAllowed,
                addins: _this.addins,
                purgeSettings: _this.purgeSettings,
                emailSenderFrom: _this.emailSenderFrom
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzb3VyY2VzL2FkZGluLnRzIiwic291cmNlcy9kaXN0cmlidXRpb25MaXN0c0J1aWxkZXIudHMiLCJzb3VyY2VzL2dyb3Vwc0J1aWxkZXIudHMiLCJzb3VyY2VzL21pc2NCdWlsZGVyLnRzIiwic291cmNlcy9yZXBvcnRzQnVpbGRlci50cyIsInNvdXJjZXMvcnVsZXNCdWlsZGVyLnRzIiwic291cmNlcy9zZWN1cml0eUNsZWFyYW5jZXNCdWlsZGVyLnRzIiwic291cmNlcy91c2VyQnVpbGRlci50cyIsInNvdXJjZXMvdXRpbHMudHMiLCJzb3VyY2VzL3dhaXRpbmcudHMiLCJzb3VyY2VzL3pvbmVCdWlsZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNBQSxpREFBNEM7QUFDNUMseUVBQW9FO0FBQ3BFLG1EQUE4QztBQUM5QywrQ0FBMEM7QUFDMUMsdUVBQWtFO0FBQ2xFLDZDQUFxRDtBQUNyRCxpQ0FBb0o7QUFDcEoscUNBQWdDO0FBQ2hDLDZDQUEwQztBQUMxQyw2Q0FBMEM7QUE0QzFDO0lBNFNJLG1CQUFtQjtJQUNuQixlQUFhLEdBQUc7UUFBaEIsaUJBV0M7UUE5U2dCLGNBQVMsR0FBZ0IsUUFBUSxDQUFDLGNBQWMsQ0FBQyxjQUFjLENBQUMsQ0FBQztRQUNqRSxxQkFBZ0IsR0FBZ0IsUUFBUSxDQUFDLGNBQWMsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO1FBTS9FLFNBQUksR0FBZ0I7WUFDakMsTUFBTSxFQUFFLEVBQUU7WUFDVixPQUFPLEVBQUUsRUFBRTtZQUNYLEtBQUssRUFBRSxFQUFFO1lBQ1QsaUJBQWlCLEVBQUUsRUFBRTtZQUNyQixPQUFPLEVBQUUsRUFBRTtZQUNYLEtBQUssRUFBRSxFQUFFO1lBQ1QsU0FBUyxFQUFFLEVBQUU7WUFDYixLQUFLLEVBQUUsRUFBRTtZQUNULFNBQVMsRUFBRSxFQUFFO1lBQ2IsWUFBWSxFQUFFLEVBQUU7WUFDaEIs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VyxDQUFDO0lBQzVCLENBQUM7SUFFTyw4QkFBUSxHQUFoQjtRQUFBLGlCQU1DO1FBTEcsT0FBTyxJQUFJLE9BQU8sQ0FBQyxVQUFDLE9BQU8sRUFBRSxNQUFNO1lBQy9CLEtBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRTtnQkFDakIsVUFBVSxFQUFFLE1BQU07YUFDckIsRUFBRSxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDeEIsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDO0lBRUQsNEJBQU0sR0FBTjtRQUNJLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO0lBQzVCLENBQUM7SUFDTCxrQkFBQztBQUFELENBL0JBLEFBK0JDLElBQUE7QUEvQlksa0NBQVciLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCJpbXBvcnQgR3JvdXBzQnVpbGRlciBmcm9tIFwiLi9ncm91cHNCdWlsZGVyXCI7XHJcbmltcG9ydCBTZWN1cml0eUNsZWFyYW5jZXNCdWlsZGVyIGZyb20gXCIuL3NlY3VyaXR5Q2xlYXJhbmNlc0J1aWxkZXJcIjtcclxuaW1wb3J0IFJlcG9ydHNCdWlsZGVyIGZyb20gXCIuL3JlcG9ydHNCdWlsZGVyXCI7XHJcbmltcG9ydCBSdWxlc0J1aWxkZXIgZnJvbSBcIi4vcnVsZXNCdWlsZGVyXCI7XHJcbmltcG9ydCBEaXN0cmlidXRpb25MaXN0c0J1aWxkZXIgZnJvbSBcIi4vZGlzdHJpYnV0aW9uTGlzdHNCdWlsZGVyXCI7XHJcbmltcG9ydCB7SU1pc2NEYXRhLCBNaXNjQnVpbGRlcn0gZnJvbSBcIi4vbWlzY0J1aWxkZXJcIjtcclxuaW1wb3J0IHtkb3dubG9hZERhdGFBc0ZpbGUsIG1lcmdlVW5pcXVlLCBJRW50aXR5LCBtZXJnZVVuaXF1ZUVudGl0aWVzLCBnZXRVbmlxdWVFbnRpdGllcywgZ2V0RW50aXRpZXNJZHMsIHRvZ2V0aGVyLCByZXNvbHZlZFByb21pc2V9IGZyb20gXCIuL3V0aWxzXCI7XHJcbmltcG9ydCBXYWl0aW5nIGZyb20gXCIuL3dhaXRpbmdcIjtcclxuaW1wb3J0IHtVc2VyQnVpbGRlcn0gZnJvbSBcIi4vdXNlckJ1aWxkZXJcIjtcclxuaW1wb3J0IHtab25lQnVpbGRlcn0gZnJvbSBcIi4vem9uZUJ1aWxkZXJcIjtcclxuXHJcbmludGVyZmFjZSBHZW90YWIge1xyXG4gICAgYWRkaW46IHtcclxuICAgICAgICByZWdpc3RyYXRpb25Db25maWc6IEZ1bmN0aW9uXHJcbiAgICB9O1xyXG59XHJcblxyXG5pbnRlcmZhY2UgSUltcG9ydERhdGEge1xyXG4gICAgZ3JvdXBzOiBhbnlbXTtcclxuICAgIHJlcG9ydHM6IGFueVtdO1xyXG4gICAgcnVsZXM6IGFueVtdO1xyXG4gICAgZGlzdHJpYnV0aW9uTGlzdHM6IGFueVtdO1xyXG4gICAgZGV2aWNlczogYW55W107XHJcbiAgICB1c2VyczogYW55W107XHJcbiAgICB6b25lVHlwZXM6IGFueVtdO1xyXG4gICAgem9uZXM6IGFueVtdO1xyXG4gICAgd29ya1RpbWVzOiBhbnlbXTtcclxuICAgIHdvcmtIb2xpZGF5czogYW55W107XHJcbiAgICBzZWN1cml0eUdyb3VwczogYW55W107XHJcbiAgICBkaWFnbm9zdGljczogYW55W107XHJcbiAgICBjdXN0b21NYXBzOiBhbnlbXTtcclxuICAgIG1pc2M6IElNaXNjRGF0YTtcclxuICAgIG5vdGlmaWNhdGlvblRlbXBsYXRlczogYW55W107XHJcbn1cclxuaW50ZXJmYWNlIElEZXBlbmRlbmNpZXMge1xyXG4gICAgZ3JvdXBzPzogc3RyaW5nW107XHJcbiAgICByZXBvcnRzPzogc3RyaW5nW107XHJcbiAgICBydWxlcz86IHN0cmluZ1tdO1xyXG4gICAgZGlzdHJpYnV0aW9uTGlzdHM/OiBzdHJpbmdbXTtcclxuICAgIGRldmljZXM/OiBzdHJpbmdbXTtcclxuICAgIHVzZXJzPzogc3RyaW5nW107XHJcbiAgICB6b25lVHlwZXM/OiBzdHJpbmdbXTtcclxuICAgIHpvbmVzPzogc3RyaW5nW107XHJcbiAgICB3b3JrVGltZXM/OiBzdHJpbmdbXTtcclxuICAgIHdvcmtIb2xpZGF5cz86IHN0cmluZ1tdO1xyXG4gICAgc2VjdXJpdHlHcm91cHM/OiBzdHJpbmdbXTtcclxuICAgIGRpYWdub3N0aWNzPzogc3RyaW5nW107XHJcbiAgICBjdXN0b21NYXBzPzogc3RyaW5nW107XHJcbiAgICBub3RpZmljYXRpb25UZW1wbGF0ZXM/OiBzdHJpbmdbXTtcclxufVxyXG5cclxuZGVjbGFyZSBjb25zdCBnZW90YWI6IEdlb3RhYjtcclxuXHJcbmNsYXNzIEFkZGluIHtcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgYXBpO1xyXG4gICAgcHJpdmF0ZSByZWFkb25seSBncm91cHNCdWlsZGVyOiBHcm91cHNCdWlsZGVyO1xyXG4gICAgcHJpdmF0ZSByZWFkb25seSBzZWN1cml0eUNsZWFyYW5jZXNCdWlsZGVyOiBTZWN1cml0eUNsZWFyYW5jZXNCdWlsZGVyO1xyXG4gICAgcHJpdmF0ZSByZWFkb25seSByZXBvcnRzQnVpbGRlcjogUmVwb3J0c0J1aWxkZXI7XHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IHJ1bGVzQnVpbGRlcjogUnVsZXNCdWlsZGVyO1xyXG4gICAgcHJpdmF0ZSByZWFkb25seSBkaXN0cmlidXRpb25MaXN0c0J1aWxkZXI6IERpc3RyaWJ1dGlvbkxpc3RzQnVpbGRlcjtcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgbWlzY0J1aWxkZXI6IE1pc2NCdWlsZGVyO1xyXG4gICAgcHJpdmF0ZSByZWFkb25seSB1c2VyQnVpbGRlcjogVXNlckJ1aWxkZXI7XHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IHpvbmVCdWlsZGVyOiBab25lQnVpbGRlcjtcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgZXhwb3J0QnRuOiBIVE1MRWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZXhwb3J0QnV0dG9uXCIpO1xyXG4gICAgcHJpdmF0ZSByZWFkb25seSBzdWJtaXRDaGFuZ2VzQnRuOiBIVE1MRWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic3VibWl0Q2hhbmdlc0J1dHRvblwiKTtcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgd2FpdGluZzogV2FpdGluZztcclxuICAgIHByaXZhdGUgY3VycmVudFRhc2s7XHJcbiAgICAvL3RlbXBvcmFyeSBwbGFjZWhvbGRlcnMgZm9yIHRoZSBvYmplY3RzIGluZGljYXRlZFxyXG4gICAgcHJpdmF0ZSB0ZW1wVXNlcnM6IFtdO1xyXG4gICAgcHJpdmF0ZSB0ZW1wWm9uZXNcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgZGF0YTogSUltcG9ydERhdGEgPSB7XHJcbiAgICAgICAgZ3JvdXBzOiBbXSxcclxuICAgICAgICByZXBvcnRzOiBbXSxcclxuICAgICAgICBydWxlczogW10sXHJcbiAgICAgICAgZGlzdHJpYnV0aW9uTGlzdHM6IFtdLFxyXG4gICAgICAgIGRldmljZXM6IFtdLFxyXG4gICAgICAgIHVzZXJzOiBbXSxcclxuICAgICAgICB6b25lVHlwZXM6IFtdLFxyXG4gICAgICAgIHpvbmVzOiBbXSxcclxuICAgICAgICB3b3JrVGltZXM6IFtdLFxyXG4gICAgICAgIHdvcmtIb2xpZGF5czogW10sXHJcbiAgICAgICAgc2VjdXJpdHlHcm91cHM6IFtdLFxyXG4gICAgICAgIGN1c3RvbU1hcHM6IFtdLFxyXG4gICAgICAgIGRpYWdub3N0aWNzOiBbXSxcclxuICAgICAgICBtaXNjOiBudWxsLFxyXG4gICAgICAgIG5vdGlmaWNhdGlvblRlbXBsYXRlczogW11cclxuICAgIH07XHJcblxyXG4gICAgcHJpdmF0ZSBjb21iaW5lRGVwZW5kZW5jaWVzICguLi5hbGxEZXBlbmRlbmNpZXM6IElEZXBlbmRlbmNpZXNbXSk6IElEZXBlbmRlbmNpZXMge1xyXG4gICAgICAgIGxldCB0b3RhbCA9IHtcclxuICAgICAgICAgICAgZ3JvdXBzOiBbXSxcclxuICAgICAgICAgICAgcmVwb3J0czogW10sXHJcbiAgICAgICAgICAgIHJ1bGVzOiBbXSxcclxuICAgICAgICAgICAgZGV2aWNlczogW10sXHJcbiAgICAgICAgICAgIHVzZXJzOiBbXSxcclxuICAgICAgICAgICAgem9uZVR5cGVzOiBbXSxcclxuICAgICAgICAgICAgem9uZXM6IFtdLFxyXG4gICAgICAgICAgICB3b3JrVGltZXM6IFtdLFxyXG4gICAgICAgICAgICB3b3JrSG9saWRheXM6IFtdLFxyXG4gICAgICAgICAgICBzZWN1cml0eUdyb3VwczogW10sXHJcbiAgICAgICAgICAgIGRpYWdub3N0aWNzOiBbXSxcclxuICAgICAgICAgICAgY3VzdG9tTWFwczogW10sXHJcbiAgICAgICAgICAgIG5vdGlmaWNhdGlvblRlbXBsYXRlczogW11cclxuICAgICAgICB9O1xyXG4gICAgICAgIHJldHVybiBPYmplY3Qua2V5cyh0b3RhbCkucmVkdWNlKChkZXBlbmRlbmNpZXMsIGRlcGVuZGVuY3lOYW1lOiBzdHJpbmcpID0+IHtcclxuICAgICAgICAgICAgZGVwZW5kZW5jaWVzW2RlcGVuZGVuY3lOYW1lXSA9IG1lcmdlVW5pcXVlKGRlcGVuZGVuY2llc1tkZXBlbmRlbmN5TmFtZV0sIC4uLmFsbERlcGVuZGVuY2llcy5tYXAoKGVudGl0eURlcGVuZGVuY2llcykgPT4gZW50aXR5RGVwZW5kZW5jaWVzW2RlcGVuZGVuY3lOYW1lXSkpO1xyXG4gICAgICAgICAgICByZXR1cm4gZGVwZW5kZW5jaWVzO1xyXG4gICAgICAgIH0sIHRvdGFsKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFkZE5ld0dyb3VwcyAoZ3JvdXBzOiBzdHJpbmdbXSwgZGF0YTogSUltcG9ydERhdGEpOiBQcm9taXNlPGFueT4ge1xyXG4gICAgICAgIGlmICghZ3JvdXBzIHx8ICFncm91cHMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiByZXNvbHZlZFByb21pc2UoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgbGV0IGdyb3Vwc0RhdGEgPSB0aGlzLmdyb3Vwc0J1aWxkZXIuZ2V0R3JvdXBzRGF0YShncm91cHMsIHRydWUpLFxyXG4gICAgICAgICAgICBuZXdHcm91cHNVc2VycyA9IGdldFVuaXF1ZUVudGl0aWVzKHRoaXMuZ3JvdXBzQnVpbGRlci5nZXRQcml2YXRlR3JvdXBzVXNlcnMoZ3JvdXBzRGF0YSksIGRhdGEudXNlcnMpO1xyXG4gICAgICAgIGRhdGEuZ3JvdXBzID0gbWVyZ2VVbmlxdWVFbnRpdGllcyhkYXRhLmdyb3VwcywgZ3JvdXBzRGF0YSk7XHJcbiAgICAgICAgZGF0YS51c2VycyA9IG1lcmdlVW5pcXVlRW50aXRpZXMoZGF0YS51c2VycywgbmV3R3JvdXBzVXNlcnMpO1xyXG4gICAgICAgIHJldHVybiB0aGlzLnJlc29sdmVEZXBlbmRlbmNpZXMoe3VzZXJzOiBnZXRFbnRpdGllc0lkcyhuZXdHcm91cHNVc2Vycyl9LCBkYXRhKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFkZE5ld0N1c3RvbU1hcHMgKGN1c3RvbU1hcHNJZHM6IHN0cmluZ1tdLCBkYXRhOiBJSW1wb3J0RGF0YSkge1xyXG4gICAgICAgIGlmICghY3VzdG9tTWFwc0lkcyB8fCAhY3VzdG9tTWFwc0lkcy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBsZXQgY3VzdG9tTWFwc0RhdGEgPSBjdXN0b21NYXBzSWRzLnJlZHVjZSgoZGF0YSwgY3VzdG9tTWFwSWQ6IHN0cmluZykgPT4ge1xyXG4gICAgICAgICAgICBsZXQgY3VzdG9tTWFwRGF0YSA9IHRoaXMubWlzY0J1aWxkZXIuZ2V0TWFwUHJvdmlkZXJEYXRhKGN1c3RvbU1hcElkKTtcclxuICAgICAgICAgICAgY3VzdG9tTWFwRGF0YSAmJiBkYXRhLnB1c2goY3VzdG9tTWFwRGF0YSk7XHJcbiAgICAgICAgICAgIHJldHVybiBkYXRhO1xyXG4gICAgICAgIH0sIFtdKTtcclxuICAgICAgICBkYXRhLmN1c3RvbU1hcHMgPSBtZXJnZVVuaXF1ZUVudGl0aWVzKGRhdGEuY3VzdG9tTWFwcywgY3VzdG9tTWFwc0RhdGEpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYWRkTmV3Tm90aWZpY2F0aW9uVGVtcGxhdGVzIChub3RpZmljYXRpb25UZW1wbGF0ZXNJZHM6IHN0cmluZ1tdLCBkYXRhOiBJSW1wb3J0RGF0YSkge1xyXG4gICAgICAgIGlmICghbm90aWZpY2F0aW9uVGVtcGxhdGVzSWRzIHx8ICFub3RpZmljYXRpb25UZW1wbGF0ZXNJZHMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgbGV0IG5vdGlmaWNhdGlvblRlbXBsYXRlc0RhdGEgPSBub3RpZmljYXRpb25UZW1wbGF0ZXNJZHMucmVkdWNlKChkYXRhLCB0ZW1wbGF0ZUlkOiBzdHJpbmcpID0+IHtcclxuICAgICAgICAgICAgbGV0IHRlbXBsYXRlRGF0YSA9IHRoaXMuZGlzdHJpYnV0aW9uTGlzdHNCdWlsZGVyLmdldE5vdGlmaWNhdGlvblRlbXBsYXRlRGF0YSh0ZW1wbGF0ZUlkKTtcclxuICAgICAgICAgICAgdGVtcGxhdGVEYXRhICYmIGRhdGEucHVzaCh0ZW1wbGF0ZURhdGEpO1xyXG4gICAgICAgICAgICByZXR1cm4gZGF0YTtcclxuICAgICAgICB9LCBbXSk7XHJcbiAgICAgICAgZGF0YS5ub3RpZmljYXRpb25UZW1wbGF0ZXMgPSBtZXJnZVVuaXF1ZUVudGl0aWVzKGRhdGEubm90aWZpY2F0aW9uVGVtcGxhdGVzLCBub3RpZmljYXRpb25UZW1wbGF0ZXNEYXRhKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGdldEVudHl0aWVzSWRzIChlbnRpdGllczogSUVudGl0eVtdKTogc3RyaW5nW10ge1xyXG4gICAgICAgIHJldHVybiBlbnRpdGllcy5yZWR1Y2UoKHJlcywgZW50aXR5KSA9PiB7XHJcbiAgICAgICAgICAgIGVudGl0eSAmJiBlbnRpdHkuaWQgJiYgcmVzLnB1c2goZW50aXR5LmlkKTtcclxuICAgICAgICAgICAgcmV0dXJuIHJlcztcclxuICAgICAgICB9LCBbXSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBnZXRFbnRpdHlEZXBlbmRlbmNpZXMgKGVudGl0eTogSUVudGl0eSwgZW50aXR5VHlwZSkge1xyXG4gICAgICAgIGxldCBlbnRpdHlEZXBlbmRlbmNpZXM6IElEZXBlbmRlbmNpZXMgPSB7fTtcclxuICAgICAgICBzd2l0Y2ggKGVudGl0eVR5cGUpIHtcclxuICAgICAgICAgICAgY2FzZSBcImRldmljZXNcIjpcclxuICAgICAgICAgICAgICAgIGVudGl0eURlcGVuZGVuY2llcy5ncm91cHMgPSB0aGlzLmdldEVudHl0aWVzSWRzKGVudGl0eVtcImdyb3Vwc1wiXS5jb25jYXQoZW50aXR5W1wiYXV0b0dyb3Vwc1wiXSkpO1xyXG4gICAgICAgICAgICAgICAgZW50aXR5W1wid29ya1RpbWVcIl0uaWQgJiYgKGVudGl0eURlcGVuZGVuY2llcy53b3JrVGltZXMgPSBbZW50aXR5W1wid29ya1RpbWVcIl0uaWRdKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFwidXNlcnNcIjpcclxuICAgICAgICAgICAgICAgIGVudGl0eURlcGVuZGVuY2llcy5ncm91cHMgPSB0aGlzLmdldEVudHl0aWVzSWRzKGVudGl0eVtcImNvbXBhbnlHcm91cHNcIl0uY29uY2F0KGVudGl0eVtcImRyaXZlckdyb3Vwc1wiXSkuY29uY2F0KGVudGl0eVtcInByaXZhdGVVc2VyR3JvdXBzXCJdKS5jb25jYXQoZW50aXR5W1wicmVwb3J0R3JvdXBzXCJdKSk7XHJcbiAgICAgICAgICAgICAgICBlbnRpdHlEZXBlbmRlbmNpZXMuc2VjdXJpdHlHcm91cHMgPSB0aGlzLmdldEVudHl0aWVzSWRzKGVudGl0eVtcInNlY3VyaXR5R3JvdXBzXCJdKTtcclxuICAgICAgICAgICAgICAgIGVudGl0eURlcGVuZGVuY2llcy5jdXN0b21NYXBzID0gW2VudGl0eVtcImRlZmF1bHRNYXBFbmdpbmVcIl1dO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgXCJ6b25lc1wiOlxyXG4gICAgICAgICAgICAgICAgbGV0IHpvbmVUeXBlcyA9IHRoaXMuZ2V0RW50eXRpZXNJZHMoZW50aXR5W1wiem9uZVR5cGVzXCJdKTtcclxuICAgICAgICAgICAgICAgIHpvbmVUeXBlcy5sZW5ndGggJiYgKGVudGl0eURlcGVuZGVuY2llcy56b25lVHlwZXMgPSB6b25lVHlwZXMpO1xyXG4gICAgICAgICAgICAgICAgZW50aXR5RGVwZW5kZW5jaWVzLmdyb3VwcyA9IHRoaXMuZ2V0RW50eXRpZXNJZHMoZW50aXR5W1wiZ3JvdXBzXCJdKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFwid29ya1RpbWVzXCI6XHJcbiAgICAgICAgICAgICAgICBlbnRpdHlbXCJob2xpZGF5R3JvdXBcIl0uZ3JvdXBJZCAmJiAoZW50aXR5RGVwZW5kZW5jaWVzLndvcmtIb2xpZGF5cyA9IFtlbnRpdHlbXCJob2xpZGF5R3JvdXBcIl0uZ3JvdXBJZF0pO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGVudGl0eURlcGVuZGVuY2llcztcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFwcGx5VG9FbnRpdGllcyAoZW50aXRpZXNMaXN0OiBJRGVwZW5kZW5jaWVzLCBpbml0aWFsVmFsdWUsIGZ1bmM6IChyZXN1bHQsIGVudGl0eSwgZW50aXR5VHlwZTogc3RyaW5nLCBlbnRpdHlJbmRleDogbnVtYmVyLCBlbnRpdHlUeXBlSW5kZXg6IG51bWJlciwgb3ZlcmFsbEluZGV4OiBudW1iZXIpID0+IGFueSkge1xyXG4gICAgICAgIGxldCBvdmVyYWxsSW5kZXggPSAwO1xyXG4gICAgICAgIHJldHVybiBPYmplY3Qua2V5cyhlbnRpdGllc0xpc3QpLnJlZHVjZSgocmVzdWx0LCBlbnRpdHlUeXBlLCB0eXBlSW5kZXgpID0+IHtcclxuICAgICAgICAgICAgcmV0dXJuIGVudGl0aWVzTGlzdFtlbnRpdHlUeXBlXS5yZWR1Y2UoKHJlcywgZW50aXR5LCBpbmRleCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgb3ZlcmFsbEluZGV4Kys7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZnVuYyhyZXMsIGVudGl0eSwgZW50aXR5VHlwZSwgaW5kZXgsIHR5cGVJbmRleCwgb3ZlcmFsbEluZGV4IC0gMSk7XHJcbiAgICAgICAgICAgIH0sIHJlc3VsdCk7XHJcbiAgICAgICAgfSwgaW5pdGlhbFZhbHVlKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHJlc29sdmVEZXBlbmRlbmNpZXMgKGRlcGVuZGVuY2llczogSURlcGVuZGVuY2llcywgZGF0YTogSUltcG9ydERhdGEpIHtcclxuICAgICAgICBsZXQgZ2V0RGF0YSA9IChlbnRpdGllc0xpc3Q6IElEZXBlbmRlbmNpZXMpOiBQcm9taXNlPElJbXBvcnREYXRhPiA9PiB7XHJcbiAgICAgICAgICAgICAgICBsZXQgZW50aXR5UmVxdWVzdFR5cGVzID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkZXZpY2VzOiBcIkRldmljZVwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB1c2VyczogXCJVc2VyXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHpvbmVUeXBlczogXCJab25lVHlwZVwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB6b25lczogXCJab25lXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHdvcmtUaW1lczogXCJXb3JrVGltZVwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB3b3JrSG9saWRheXM6IFwiV29ya0hvbGlkYXlcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VjdXJpdHlHcm91cHM6IFwiR3JvdXBcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGlhZ25vc3RpY3M6IFwiRGlhZ25vc3RpY1wiLFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICByZXF1ZXN0czogYW55ID0gdGhpcy5hcHBseVRvRW50aXRpZXMoZW50aXRpZXNMaXN0LCB7fSwgKHJlc3VsdCwgZW50aXR5SWQsIGVudGl0eVR5cGUpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHJlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlTmFtZTogZW50aXR5UmVxdWVzdFR5cGVzW2VudGl0eVR5cGVdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VhcmNoOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IGVudGl0eUlkXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVudGl0eVJlcXVlc3RUeXBlc1tlbnRpdHlUeXBlXSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVudGl0eVR5cGUgPT09IFwid29ya0hvbGlkYXlzXCIgfHwgZW50aXR5VHlwZSA9PT0gXCJzZWN1cml0eUdyb3Vwc1wiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICFyZXN1bHRbZW50aXR5VHlwZV0gJiYgKHJlc3VsdFtlbnRpdHlUeXBlXSA9IFtdKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdFtlbnRpdHlUeXBlXS5wdXNoKFtcIkdldFwiLCByZXF1ZXN0XSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChlbnRpdGllc0xpc3Quc2VjdXJpdHlHcm91cHMgJiYgZW50aXRpZXNMaXN0LnNlY3VyaXR5R3JvdXBzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVlc3RzLnNlY3VyaXR5R3JvdXBzID0gW1tcIkdldFwiLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGVOYW1lOiBlbnRpdHlSZXF1ZXN0VHlwZXMuc2VjdXJpdHlHcm91cHMsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlYXJjaDoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IFwiR3JvdXBTZWN1cml0eUlkXCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1dXTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChlbnRpdGllc0xpc3Qud29ya0hvbGlkYXlzICYmIGVudGl0aWVzTGlzdC53b3JrSG9saWRheXMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWVzdHMud29ya0hvbGlkYXlzID0gW1tcIkdldFwiLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGVOYW1lOiBlbnRpdHlSZXF1ZXN0VHlwZXMud29ya0hvbGlkYXlzXHJcbiAgICAgICAgICAgICAgICAgICAgfV1dO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmFkZE5ld0dyb3VwcyhlbnRpdGllc0xpc3QuZ3JvdXBzLCBkYXRhKS50aGVuKCgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZE5ld0N1c3RvbU1hcHMoZW50aXRpZXNMaXN0LmN1c3RvbU1hcHMsIGRhdGEpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkTmV3Tm90aWZpY2F0aW9uVGVtcGxhdGVzKGVudGl0aWVzTGlzdC5ub3RpZmljYXRpb25UZW1wbGF0ZXMsIGRhdGEpO1xyXG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBlbnRpdGllc0xpc3QuZ3JvdXBzO1xyXG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBlbnRpdGllc0xpc3QuY3VzdG9tTWFwcztcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFByb21pc2U8SUltcG9ydERhdGE+KChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHJlcXVlc3RFbnRpdGllcyA9IE9iamVjdC5rZXlzKHJlcXVlc3RzKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcXVlc3RzQXJyYXkgPSByZXF1ZXN0RW50aXRpZXMucmVkdWNlKChsaXN0LCB0eXBlKSA9PiBsaXN0LmNvbmNhdChyZXF1ZXN0c1t0eXBlXSksIFtdKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFyZXF1ZXN0RW50aXRpZXMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZShkYXRhKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFwaS5tdWx0aUNhbGwocmVxdWVzdHNBcnJheSwgKHJlc3BvbnNlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IG5ld0dyb3VwcyA9IFtdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdDdXN0b21NYXBzID0gW10sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld0RlcGVuZGVuY2llczogSURlcGVuZGVuY2llcyA9IHt9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBleHBvcnRlZERhdGE6IGFueSA9IHRoaXMuYXBwbHlUb0VudGl0aWVzKHJlcXVlc3RzLCB7fSwgKHJlc3VsdCwgcmVxdWVzdCwgZW50aXR5VHlwZSwgZW50aXR5SW5kZXgsIGVudGl0eVR5cGVJbmRleCwgb3ZlcmFsbEluZGV4KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgaXRlbXMgPSByZXF1ZXN0c0FycmF5Lmxlbmd0aCA+IDEgPyByZXNwb25zZVtvdmVyYWxsSW5kZXhdIDogcmVzcG9uc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtcy5mb3JFYWNoKChpdGVtKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbSA9IGl0ZW1bMF0gfHwgaXRlbTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAhcmVzdWx0W2VudGl0eVR5cGVdICYmIChyZXN1bHRbZW50aXR5VHlwZV0gPSBbXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVudGl0eVR5cGUgPT09IFwid29ya0hvbGlkYXlzXCIgJiYgKCFpdGVtLmhvbGlkYXlHcm91cCB8fCBlbnRpdGllc0xpc3Qud29ya0hvbGlkYXlzLmluZGV4T2YoaXRlbS5ob2xpZGF5R3JvdXAuZ3JvdXBJZCkgPT09IC0xKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChlbnRpdHlUeXBlID09PSBcInNlY3VyaXR5R3JvdXBzXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVudGl0aWVzTGlzdC5zZWN1cml0eUdyb3Vwcy5pbmRleE9mKGl0ZW0uaWQpID4gLTEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdFtlbnRpdHlUeXBlXSA9IHJlc3VsdFtlbnRpdHlUeXBlXS5jb25jYXQodGhpcy5ncm91cHNCdWlsZGVyLmdldEN1c3RvbUdyb3Vwc0RhdGEoZW50aXRpZXNMaXN0LnNlY3VyaXR5R3JvdXBzLCBpdGVtcykpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChlbnRpdHlUeXBlID09PSBcInVzZXJzXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS51c2VyQXV0aGVudGljYXRpb25UeXBlID0gXCJCYXNpY0F1dGhlbnRpY2F0aW9uXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBlbnRpdHlEZXBlbmRlbmNpZXMgPSB0aGlzLmdldEVudGl0eURlcGVuZGVuY2llcyhpdGVtLCBlbnRpdHlUeXBlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdEZXBlbmRlbmNpZXMgPSB0aGlzLmFwcGx5VG9FbnRpdGllcyhlbnRpdHlEZXBlbmRlbmNpZXMsIG5ld0RlcGVuZGVuY2llcywgKHJlc3VsdCwgZW50aXR5SWQsIGVudGl0eVR5cGUpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIXJlc3VsdFtlbnRpdHlUeXBlXSAmJiAocmVzdWx0W2VudGl0eVR5cGVdID0gW10pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHRbZW50aXR5VHlwZV0gPSBtZXJnZVVuaXF1ZShyZXN1bHRbZW50aXR5VHlwZV0sIFtlbnRpdHlJZF0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld0dyb3VwcyA9IG5ld0dyb3Vwcy5jb25jYXQobmV3RGVwZW5kZW5jaWVzLmdyb3VwcyB8fCBbXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3Q3VzdG9tTWFwcyA9IG5ld0N1c3RvbU1hcHMuY29uY2F0KG5ld0RlcGVuZGVuY2llcy5jdXN0b21NYXBzIHx8IFtdKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgbmV3RGVwZW5kZW5jaWVzLmdyb3VwcztcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgbmV3RGVwZW5kZW5jaWVzLmN1c3RvbU1hcHM7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0W2VudGl0eVR5cGVdLnB1c2goaXRlbSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld0RlcGVuZGVuY2llcyA9IE9iamVjdC5rZXlzKG5ld0RlcGVuZGVuY2llcykucmVkdWNlKChyZXN1bHQsIGRlcGVuZGVuY3lOYW1lKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBlbnRpdGllcyA9IG5ld0RlcGVuZGVuY2llc1tkZXBlbmRlbmN5TmFtZV0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBleHBvcnRlZCA9IChleHBvcnRlZERhdGFbZGVwZW5kZW5jeU5hbWVdIHx8IFtdKS5tYXAoZW50aXR5ID0+IGVudGl0eS5pZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVudGl0aWVzLmZvckVhY2goZW50aXR5SWQgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGV4cG9ydGVkLmluZGV4T2YoZW50aXR5SWQpID09PSAtMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICFyZXN1bHRbZGVwZW5kZW5jeU5hbWVdICYmIChyZXN1bHRbZGVwZW5kZW5jeU5hbWVdID0gW10pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdFtkZXBlbmRlbmN5TmFtZV0ucHVzaChlbnRpdHlJZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sIHt9IGFzIElJbXBvcnREYXRhKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBSZW1vdmUgYnVpbHQtaW4gc2VjdXJpdHkgZ3JvdXBzXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXhwb3J0ZWREYXRhLnNlY3VyaXR5R3JvdXBzICYmIChleHBvcnRlZERhdGEuc2VjdXJpdHlHcm91cHMgPSBleHBvcnRlZERhdGEuc2VjdXJpdHlHcm91cHMucmVkdWNlKChyZXN1bHQsIGdyb3VwKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdyb3VwLmlkLmluZGV4T2YoXCJHcm91cFwiKSA9PT0gLTEgJiYgcmVzdWx0LnB1c2goZ3JvdXApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sIFtdKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGROZXdHcm91cHMobmV3R3JvdXBzLCBkYXRhKS50aGVuKCgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGROZXdDdXN0b21NYXBzKG5ld0N1c3RvbU1hcHMsIGRhdGEpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBPYmplY3Qua2V5cyhleHBvcnRlZERhdGEpLmZvckVhY2goKGVudGl0eVR5cGU6IHN0cmluZykgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YVtlbnRpdHlUeXBlXSA9IG1lcmdlVW5pcXVlRW50aXRpZXMoZGF0YVtlbnRpdHlUeXBlXSwgZXhwb3J0ZWREYXRhW2VudGl0eVR5cGVdKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChPYmplY3Qua2V5cyhuZXdEZXBlbmRlbmNpZXMpLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh0aGlzLnJlc29sdmVEZXBlbmRlbmNpZXMobmV3RGVwZW5kZW5jaWVzLCBkYXRhKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGRhdGEpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwgcmVqZWN0KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sIHJlamVjdCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2U8SUltcG9ydERhdGE+KChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICAgICAgcmV0dXJuIGdldERhdGEoZGVwZW5kZW5jaWVzKS50aGVuKHJlc29sdmUpLmNhdGNoKHJlamVjdCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhYm9ydEN1cnJlbnRUYXNrICgpIHtcclxuICAgICAgICB0aGlzLnRvZ2dsZVdhaXRpbmcoKTtcclxuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrICYmIHRoaXMuY3VycmVudFRhc2suYWJvcnQgJiYgdGhpcy5jdXJyZW50VGFzay5hYm9ydCgpO1xyXG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgPSBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgdG9nZ2xlRXhwb3J0QnV0dG9uIChpc0Rpc2FibGVkOiBib29sZWFuKSB7XHJcbiAgICAgICAgKDxIVE1MSW5wdXRFbGVtZW50PnRoaXMuZXhwb3J0QnRuKS5kaXNhYmxlZCA9IGlzRGlzYWJsZWQ7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSByZWFkb25seSB0b2dnbGVXYWl0aW5nID0gKGlzU3RhcnQgPSBmYWxzZSkgPT4ge1xyXG4gICAgICAgIGlmIChpc1N0YXJ0KSB7XHJcbiAgICAgICAgICAgIHRoaXMudG9nZ2xlRXhwb3J0QnV0dG9uKHRydWUpO1xyXG4gICAgICAgICAgICB0aGlzLndhaXRpbmcuc3RhcnQoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJhZGRpbkNvbnRhaW5lclwiKS5wYXJlbnRFbGVtZW50LCA5OTk5KTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLnRvZ2dsZUV4cG9ydEJ1dHRvbihmYWxzZSk7XHJcbiAgICAgICAgICAgIHRoaXMud2FpdGluZy5zdG9wKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vQnJldHQgLSBkaXNwbGF5cyB0aGUgb3V0cHV0IG9uIHRoZSBwYWdlXHJcbiAgICBwcml2YXRlIHNob3dFbnRpdHlNZXNzYWdlIChibG9jazogSFRNTEVsZW1lbnQsIHF0eTogbnVtYmVyLCBlbnRpdHlOYW1lOiBzdHJpbmcpIHtcclxuICAgICAgICBsZXQgYmxvY2tFbCA9IGJsb2NrLnF1ZXJ5U2VsZWN0b3IoXCIuZGVzY3JpcHRpb25cIik7XHJcbiAgICAgICAgaWYgKHF0eSkge1xyXG4gICAgICAgICAgICBxdHkgPiAxICYmIChlbnRpdHlOYW1lICs9IFwic1wiKTtcclxuICAgICAgICAgICAgbGV0IGhhc0l0ZW1zTWVzc2FnZVRlbXBsYXRlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJoYXNJdGVtc01lc3NhZ2VUZW1wbGF0ZVwiKS5pbm5lckhUTUw7XHJcbiAgICAgICAgICAgIGJsb2NrRWwuaW5uZXJIVE1MID0gaGFzSXRlbXNNZXNzYWdlVGVtcGxhdGUucmVwbGFjZShcIntxdWFudGl0eX1cIiwgcXR5LnRvU3RyaW5nKCkpLnJlcGxhY2UoXCJ7ZW50aXR5fVwiLCBlbnRpdHlOYW1lKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBibG9ja0VsLmlubmVySFRNTCA9IGBZb3UgaGF2ZSA8c3BhbiBjbGFzcz1cImJvbGRcIj5ub3QgY29uZmlndXJlZCBhbnkgJHsgZW50aXR5TmFtZSB9czwvc3Bhbj4uYDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy9pZiB0aGUgaW5jbHVkZVRoaXNBZGRpbiBjaGVja2JveCBpcyBjaGFuZ2VkIHdlIGVudGVyIGhlcmVcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgdG9nZ2xlVGhpc0FkZGluSW5jbHVkZWQgPSAoZTogRXZlbnQpID0+IHtcclxuICAgICAgICBsZXQgaXNDaGVja2VkID0gISFlLnRhcmdldCAmJiAhISg8SFRNTElucHV0RWxlbWVudD5lLnRhcmdldCkuY2hlY2tlZDtcclxuICAgICAgICBsZXQgYWRkaW5zQmxvY2s6IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJleHBvcnRlZEFkZGluc1wiKTtcclxuICAgICAgICBsZXQgYWRkaW5zRGF0YSA9IHRoaXMubWlzY0J1aWxkZXIuZ2V0QWRkaW5zRGF0YSghaXNDaGVja2VkKTtcclxuICAgICAgICB0aGlzLnNob3dFbnRpdHlNZXNzYWdlKGFkZGluc0Jsb2NrLCBhZGRpbnNEYXRhLmxlbmd0aCwgXCJhZGRpblwiKTtcclxuICAgICAgICB0aGlzLmRhdGEubWlzYy5hZGRpbnMgPSBhZGRpbnNEYXRhO1xyXG4gICAgfVxyXG5cclxuICAgIC8vaW5pdGlhbGl6ZSBhZGRpbiBcclxuICAgIGNvbnN0cnVjdG9yIChhcGkpIHtcclxuICAgICAgICB0aGlzLmFwaSA9IGFwaTtcclxuICAgICAgICB0aGlzLmdyb3Vwc0J1aWxkZXIgPSBuZXcgR3JvdXBzQnVpbGRlcihhcGkpO1xyXG4gICAgICAgIHRoaXMuc2VjdXJpdHlDbGVhcmFuY2VzQnVpbGRlciA9IG5ldyBTZWN1cml0eUNsZWFyYW5jZXNCdWlsZGVyKGFwaSk7XHJcbiAgICAgICAgdGhpcy5yZXBvcnRzQnVpbGRlciA9IG5ldyBSZXBvcnRzQnVpbGRlcihhcGkpO1xyXG4gICAgICAgIHRoaXMucnVsZXNCdWlsZGVyID0gbmV3IFJ1bGVzQnVpbGRlcihhcGkpO1xyXG4gICAgICAgIHRoaXMuZGlzdHJpYnV0aW9uTGlzdHNCdWlsZGVyID0gbmV3IERpc3RyaWJ1dGlvbkxpc3RzQnVpbGRlcihhcGkpO1xyXG4gICAgICAgIHRoaXMubWlzY0J1aWxkZXIgPSBuZXcgTWlzY0J1aWxkZXIoYXBpKTtcclxuICAgICAgICB0aGlzLnVzZXJCdWlsZGVyID0gbmV3IFVzZXJCdWlsZGVyKGFwaSk7XHJcbiAgICAgICAgdGhpcy56b25lQnVpbGRlciA9IG5ldyBab25lQnVpbGRlcihhcGkpO1xyXG4gICAgICAgIHRoaXMud2FpdGluZyA9IG5ldyBXYWl0aW5nKCk7XHJcbiAgICB9XHJcblxyXG4gICAgLy9CcmV0dDogZXhwb3J0cyB0aGUgZGF0YVxyXG4gICAgZXhwb3J0RGF0YSA9ICgpID0+IHtcclxuICAgICAgICB0aGlzLnRvZ2dsZVdhaXRpbmcodHJ1ZSk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMucmVwb3J0c0J1aWxkZXIuZ2V0RGF0YSgpLnRoZW4oKHJlcG9ydHNEYXRhKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuZGF0YS5yZXBvcnRzID0gcmVwb3J0c0RhdGE7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHRoaXMuZGF0YSk7XHJcbiAgICAgICAgICAgIGRvd25sb2FkRGF0YUFzRmlsZShKU09OLnN0cmluZ2lmeSh0aGlzLmRhdGEpLCBcImV4cG9ydC5qc29uXCIpO1xyXG4gICAgICAgIH0pLmNhdGNoKChlKSA9PiB7XHJcbiAgICAgICAgICAgIGFsZXJ0KFwiQ2FuJ3QgZXhwb3J0IGRhdGEuXFxuUGxlYXNlIHRyeSBhZ2FpbiBsYXRlci5cIik7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XHJcbiAgICAgICAgfSkuZmluYWxseSgoKSA9PiB0aGlzLnRvZ2dsZVdhaXRpbmcoKSk7XHJcbiAgICB9XHJcblxyXG4gICAgc3VibWl0Q2hhbmdlcyA9ICgpID0+IHtcclxuICAgICAgICB0aGlzLnJlbmRlcigpO1xyXG4gICAgfVxyXG5cclxuICAgIHJlbmRlciAoKSB7XHJcbiAgICAgICAgdGhpcy5kYXRhLnVzZXJzID0gW107XHJcbiAgICAgICAgdGhpcy5kYXRhLnpvbmVzID0gW107XHJcbiAgICAgICAgdGhpcy5zZXRBZGRpbnNUb051bGwoKTtcclxuICAgICAgICAvL3dpcmUgdXAgdGhlIGRvbVxyXG4gICAgICAgIGxldCBtYXBNZXNzYWdlVGVtcGxhdGU6IHN0cmluZyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibWFwTWVzc2FnZVRlbXBsYXRlXCIpLmlubmVySFRNTCxcclxuICAgICAgICAgICAgZ3JvdXBzQmxvY2s6IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJleHBvcnRlZEdyb3Vwc1wiKSxcclxuICAgICAgICAgICAgc2VjdXJpdHlDbGVhcmFuY2VzQmxvY2s6IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJleHBvcnRlZFNlY3VyaXR5Q2xlYXJhbmNlc1wiKSxcclxuICAgICAgICAgICAgcnVsZXNCbG9jazogSFRNTEVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImV4cG9ydGVkUnVsZXNcIiksXHJcbiAgICAgICAgICAgIHJlcG9ydHNCbG9jazogSFRNTEVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImV4cG9ydGVkUmVwb3J0c1wiKSxcclxuICAgICAgICAgICAgZGFzaGJvYXJkc0Jsb2NrOiBIVE1MRWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZXhwb3J0ZWREYXNoYm9hcmRzXCIpLFxyXG4gICAgICAgICAgICBhZGRpbnNCbG9jazogSFRNTEVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImV4cG9ydGVkQWRkaW5zXCIpLFxyXG4gICAgICAgICAgICBleHBvcnRBbGxBZGRpbnNDaGVja2JveDogSFRNTElucHV0RWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZXhwb3J0X2FsbF9hZGRpbnNfY2hlY2tib3hcIikgYXMgSFRNTElucHV0RWxlbWVudCxcclxuICAgICAgICAgICAgLy8gdGhpc0FkZGluQmxvY2s6IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJpbmNsdWRlVGhpc0FkZGluXCIpLFxyXG4gICAgICAgICAgICAvLyB0aGlzQWRkaW5JbmNsdWRlZENoZWNrYm94OiBIVE1MRWxlbWVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjaW5jbHVkZVRoaXNBZGRpbiA+IGlucHV0XCIpLFxyXG4gICAgICAgICAgICBtYXBCbG9ja0Rlc2NyaXB0aW9uOiBIVE1MRWxlbWVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjZXhwb3J0ZWRNYXAgPiAuZGVzY3JpcHRpb25cIiksXHJcbiAgICAgICAgICAgIHVzZXJzQmxvY2s6IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJleHBvcnRlZFVzZXJzXCIpLFxyXG4gICAgICAgICAgICBleHBvcnRBbGxVc2Vyc0NoZWNrYm94OiBIVE1MSW5wdXRFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJleHBvcnRfYWxsX3VzZXJzX2NoZWNrYm94XCIpIGFzIEhUTUxJbnB1dEVsZW1lbnQsXHJcbiAgICAgICAgICAgIHpvbmVzQmxvY2s6IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJleHBvcnRlZFpvbmVzXCIpLFxyXG4gICAgICAgICAgICBleHBvcnRBbGxab25lc0NoZWNrYm94OiBIVE1MSW5wdXRFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJleHBvcnRfYWxsX3pvbmVzX2NoZWNrYm94XCIpIGFzIEhUTUxJbnB1dEVsZW1lbnQ7XHJcbiAgICAgICAgLy93aXJlIHVwIHRoZSBleHBvcnQgYnV0dG9uIGV2ZW50XHJcbiAgICAgICAgdGhpcy5leHBvcnRCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMuZXhwb3J0RGF0YSwgZmFsc2UpO1xyXG4gICAgICAgIHRoaXMuc3VibWl0Q2hhbmdlc0J0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5zdWJtaXRDaGFuZ2VzLCBmYWxzZSk7XHJcbiAgICAgICAgLy93aXJlIHVwIHRoZSBpbmNsdWRlVGhpc0FkZGluIGNoZWNrYm94IGV2ZW50XHJcbiAgICAgICAgLy8gdGhpc0FkZGluSW5jbHVkZWRDaGVja2JveC5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsIHRoaXMudG9nZ2xlVGhpc0FkZGluSW5jbHVkZWQsIGZhbHNlKTtcclxuICAgICAgICB0aGlzLnRvZ2dsZVdhaXRpbmcodHJ1ZSk7XHJcbiAgICAgICAgcmV0dXJuIHRvZ2V0aGVyKFtcclxuICAgICAgICAgICAgLy9sb2FkcyB0aGUgZ3JvdXBzLiBUaGlzIGlzIHdoZXJlIHVzZXJzIGFyZSBhZGRlZCBpZiB0aGV5IGFyZSBsaW5rZWQgdG8gYSBncm91cFxyXG4gICAgICAgICAgICB0aGlzLmdyb3Vwc0J1aWxkZXIuZmV0Y2goKSxcclxuICAgICAgICAgICAgLy9sb2FkcyB0aGUgc2VjdXJpdHkgZ3JvdXBzIChzZWN1cml0eSBjbGVhcmFuY2UgaW4gdXNlciBhZG1pbiBpbiBNeUcpXHJcbiAgICAgICAgICAgIHRoaXMuc2VjdXJpdHlDbGVhcmFuY2VzQnVpbGRlci5mZXRjaCgpLFxyXG4gICAgICAgICAgICAvL3JlcG9ydCBsb2FkZXIuLi5zZWVtcyBvYnNvbGV0ZSB0byBtZVxyXG4gICAgICAgICAgICB0aGlzLnJlcG9ydHNCdWlsZGVyLmZldGNoKCksXHJcbiAgICAgICAgICAgIHRoaXMucnVsZXNCdWlsZGVyLmZldGNoKCksXHJcbiAgICAgICAgICAgIHRoaXMuZGlzdHJpYnV0aW9uTGlzdHNCdWlsZGVyLmZldGNoKCksXHJcbiAgICAgICAgICAgIC8vbWlzYyA9IHN5c3RlbSBzZXR0aW5nc1xyXG4gICAgICAgICAgICB0aGlzLm1pc2NCdWlsZGVyLmZldGNoKCksXHJcbiAgICAgICAgICAgIHRoaXMudXNlckJ1aWxkZXIuZmV0Y2goKSxcclxuICAgICAgICAgICAgdGhpcy56b25lQnVpbGRlci5mZXRjaCgpXHJcbiAgICAgICAgXSkudGhlbigocmVzdWx0cykgPT4ge1xyXG4gICAgICAgICAgICBsZXQgcmVwb3J0c0RlcGVuZGVuY2llczogSURlcGVuZGVuY2llcyxcclxuICAgICAgICAgICAgICAgIHJ1bGVzRGVwZW5kZW5jaWVzOiBJRGVwZW5kZW5jaWVzLFxyXG4gICAgICAgICAgICAgICAgZGlzdHJpYnV0aW9uTGlzdHNEZXBlbmRlbmNpZXM6IElEZXBlbmRlbmNpZXMsXHJcbiAgICAgICAgICAgICAgICBkZXBlbmRlbmNpZXM6IElEZXBlbmRlbmNpZXMsXHJcbiAgICAgICAgICAgICAgICBjdXN0b21NYXA7XHJcbiAgICAgICAgICAgIHRoaXMuZGF0YS5ncm91cHMgPSByZXN1bHRzWzBdO1xyXG4gICAgICAgICAgICB0aGlzLmRhdGEuc2VjdXJpdHlHcm91cHMgPSByZXN1bHRzWzFdO1xyXG4gICAgICAgICAgICB0aGlzLmRhdGEucmVwb3J0cyA9IHJlc3VsdHNbMl07XHJcbiAgICAgICAgICAgIHRoaXMuZGF0YS5ydWxlcyA9IHJlc3VsdHNbM107XHJcbiAgICAgICAgICAgIHRoaXMuZGF0YS5kaXN0cmlidXRpb25MaXN0cyA9IHRoaXMuZGlzdHJpYnV0aW9uTGlzdHNCdWlsZGVyLmdldFJ1bGVzRGlzdHJpYnV0aW9uTGlzdHModGhpcy5kYXRhLnJ1bGVzLm1hcChydWxlID0+IHJ1bGUuaWQpKTtcclxuICAgICAgICAgICAgdGhpcy5kYXRhLm1pc2MgPSByZXN1bHRzWzVdO1xyXG4gICAgICAgICAgICBjdXN0b21NYXAgPSB0aGlzLm1pc2NCdWlsZGVyLmdldE1hcFByb3ZpZGVyRGF0YSh0aGlzLmRhdGEubWlzYy5tYXBQcm92aWRlci52YWx1ZSk7XHJcbiAgICAgICAgICAgIGN1c3RvbU1hcCAmJiB0aGlzLmRhdGEuY3VzdG9tTWFwcy5wdXNoKGN1c3RvbU1hcCk7XHJcbiAgICAgICAgICAgIHJlcG9ydHNEZXBlbmRlbmNpZXMgPSB0aGlzLnJlcG9ydHNCdWlsZGVyLmdldERlcGVuZGVuY2llcyh0aGlzLmRhdGEucmVwb3J0cyk7XHJcbiAgICAgICAgICAgIHJ1bGVzRGVwZW5kZW5jaWVzID0gdGhpcy5ydWxlc0J1aWxkZXIuZ2V0RGVwZW5kZW5jaWVzKHRoaXMuZGF0YS5ydWxlcyk7XHJcbiAgICAgICAgICAgIGRpc3RyaWJ1dGlvbkxpc3RzRGVwZW5kZW5jaWVzID0gdGhpcy5kaXN0cmlidXRpb25MaXN0c0J1aWxkZXIuZ2V0RGVwZW5kZW5jaWVzKHRoaXMuZGF0YS5kaXN0cmlidXRpb25MaXN0cyk7XHJcbiAgICAgICAgICAgIGRlcGVuZGVuY2llcyA9IHRoaXMuY29tYmluZURlcGVuZGVuY2llcyhyZXBvcnRzRGVwZW5kZW5jaWVzLCBydWxlc0RlcGVuZGVuY2llcywgZGlzdHJpYnV0aW9uTGlzdHNEZXBlbmRlbmNpZXMpO1xyXG4gICAgICAgICAgICB0aGlzLnRlbXBVc2VycyA9IHJlc3VsdHNbNl07XHJcbiAgICAgICAgICAgIHRoaXMudGVtcFpvbmVzID0gcmVzdWx0c1s3XTtcclxuICAgICAgICAgICAgLy90aGlzIGlzIHdoZXJlIHRoZSB1c2VycyAmIHpvbmVzIGFyZSBhZGRlZFxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5yZXNvbHZlRGVwZW5kZW5jaWVzKGRlcGVuZGVuY2llcywgdGhpcy5kYXRhKTtcclxuICAgICAgICB9KS50aGVuKCgpID0+IHtcclxuICAgICAgICAgICAgLy8gZGVidWdnZXI7XHJcbiAgICAgICAgICAgIGlmKGV4cG9ydEFsbFVzZXJzQ2hlY2tib3guY2hlY2tlZD09dHJ1ZSl7XHJcbiAgICAgICAgICAgICAgICAvL3NldHMgZXhwb3J0ZWQgdXNlcnMgZXF1YWwgdG8gYWxsIGRhdGFiYXNlIHVzZXJzXHJcbiAgICAgICAgICAgICAgICB0aGlzLmRhdGEudXNlcnMgPSB0aGlzLnRlbXBVc2VycztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZihleHBvcnRBbGxab25lc0NoZWNrYm94LmNoZWNrZWQ9PXRydWUpe1xyXG4gICAgICAgICAgICAgICAgLy9zZXRzIGV4cG9ydGVkIHVzZXJzIGVxdWFsIHRvIGFsbCBkYXRhYmFzZSB1c2Vyc1xyXG4gICAgICAgICAgICAgICAgdGhpcy5kYXRhLnpvbmVzID0gdGhpcy50ZW1wWm9uZXM7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYoZXhwb3J0QWxsQWRkaW5zQ2hlY2tib3guY2hlY2tlZD09ZmFsc2Upe1xyXG4gICAgICAgICAgICAgICAgLy9zZXRzIGV4cG9ydGVkIGFkZGlucyBlcXVhbCB0byBub25lL2VtcHR5IGFycmF5XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNldEFkZGluc1RvTnVsbCgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGxldCBtYXBQcm92aWRlciA9IHRoaXMubWlzY0J1aWxkZXIuZ2V0TWFwUHJvdmlkZXJOYW1lKHRoaXMuZGF0YS5taXNjLm1hcFByb3ZpZGVyLnZhbHVlKTtcclxuICAgICAgICAgICAgLy8gdGhpcy5kYXRhLnpvbmVzLmxlbmd0aFxyXG4gICAgICAgICAgICB0aGlzLnNob3dFbnRpdHlNZXNzYWdlKGdyb3Vwc0Jsb2NrLCB0aGlzLmRhdGEuZ3JvdXBzLmxlbmd0aCAtIDEsIFwiZ3JvdXBcIik7XHJcbiAgICAgICAgICAgIHRoaXMuc2hvd0VudGl0eU1lc3NhZ2Uoc2VjdXJpdHlDbGVhcmFuY2VzQmxvY2ssIHRoaXMuZGF0YS5zZWN1cml0eUdyb3Vwcy5sZW5ndGgsIFwic2VjdXJpdHkgY2xlYXJhbmNlXCIpO1xyXG4gICAgICAgICAgICB0aGlzLnNob3dFbnRpdHlNZXNzYWdlKHJ1bGVzQmxvY2ssIHRoaXMuZGF0YS5ydWxlcy5sZW5ndGgsIFwicnVsZVwiKTtcclxuICAgICAgICAgICAgdGhpcy5zaG93RW50aXR5TWVzc2FnZShyZXBvcnRzQmxvY2ssIHRoaXMucmVwb3J0c0J1aWxkZXIuZ2V0Q3VzdG9taXplZFJlcG9ydHNRdHkoKSwgXCJyZXBvcnRcIik7XHJcbiAgICAgICAgICAgIHRoaXMuc2hvd0VudGl0eU1lc3NhZ2UoZGFzaGJvYXJkc0Jsb2NrLCB0aGlzLnJlcG9ydHNCdWlsZGVyLmdldERhc2hib2FyZHNRdHkoKSwgXCJkYXNoYm9hcmRcIik7XHJcbiAgICAgICAgICAgIG1hcFByb3ZpZGVyICYmIChtYXBCbG9ja0Rlc2NyaXB0aW9uLmlubmVySFRNTCA9IG1hcE1lc3NhZ2VUZW1wbGF0ZS5yZXBsYWNlKFwie21hcFByb3ZpZGVyfVwiLCBtYXBQcm92aWRlcikpO1xyXG4gICAgICAgICAgICB0aGlzLnNob3dFbnRpdHlNZXNzYWdlKGFkZGluc0Jsb2NrLCB0aGlzLmRhdGEubWlzYy5hZGRpbnMubGVuZ3RoLCBcImFkZGluXCIpO1xyXG4gICAgICAgICAgICAvLyB0aGlzLm1pc2NCdWlsZGVyLmlzVGhpc0FkZGluSW5jbHVkZWQoKSAmJiB0aGlzQWRkaW5CbG9jay5jbGFzc0xpc3QucmVtb3ZlKFwiaGlkZGVuXCIpO1xyXG4gICAgICAgICAgICB0aGlzLnNob3dFbnRpdHlNZXNzYWdlKHVzZXJzQmxvY2ssIHRoaXMuZGF0YS51c2Vycy5sZW5ndGgsIFwidXNlclwiKTtcclxuICAgICAgICAgICAgdGhpcy5zaG93RW50aXR5TWVzc2FnZSh6b25lc0Jsb2NrLCB0aGlzLmRhdGEuem9uZXMubGVuZ3RoLCBcInpvbmVcIik7XHJcbiAgICAgICAgICAgIC8vdGhpcyBkaXNwbGF5cyBhbGwgdGhlIGRhdGEvb2JqZWN0cyBpbiB0aGUgY29uc29sZVxyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyh0aGlzLmRhdGEpO1xyXG4gICAgICAgIH0pLmNhdGNoKChlKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XHJcbiAgICAgICAgICAgIGFsZXJ0KFwiQ2FuJ3QgZ2V0IGNvbmZpZyB0byBleHBvcnRcIik7XHJcbiAgICAgICAgfSkuZmluYWxseSgoKSA9PiB0aGlzLnRvZ2dsZVdhaXRpbmcoKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBzZXRBZGRpbnNUb051bGwoKSB7XHJcbiAgICAgICAgaWYgKCh0aGlzLmRhdGEubWlzYyAhPSBudWxsKSB8fCAodGhpcy5kYXRhLm1pc2MgIT0gdW5kZWZpbmVkKSkge1xyXG4gICAgICAgICAgICB0aGlzLmRhdGEubWlzYy5hZGRpbnMgPSBbXTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgdW5sb2FkICgpIHtcclxuICAgICAgICB0aGlzLmFib3J0Q3VycmVudFRhc2soKTtcclxuICAgICAgICB0aGlzLmdyb3Vwc0J1aWxkZXIudW5sb2FkKCk7XHJcbiAgICAgICAgdGhpcy5zZWN1cml0eUNsZWFyYW5jZXNCdWlsZGVyLnVubG9hZCgpO1xyXG4gICAgICAgIHRoaXMucmVwb3J0c0J1aWxkZXIudW5sb2FkKCk7XHJcbiAgICAgICAgdGhpcy5ydWxlc0J1aWxkZXIudW5sb2FkKCk7XHJcbiAgICAgICAgdGhpcy5kaXN0cmlidXRpb25MaXN0c0J1aWxkZXIudW5sb2FkKCk7XHJcbiAgICAgICAgdGhpcy5taXNjQnVpbGRlci51bmxvYWQoKTtcclxuICAgICAgICB0aGlzLmV4cG9ydEJ0bi5yZW1vdmVFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5leHBvcnREYXRhLCBmYWxzZSk7XHJcbiAgICAgICAgdGhpcy5zdWJtaXRDaGFuZ2VzQnRuLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLnN1Ym1pdENoYW5nZXMsIGZhbHNlKTtcclxuICAgIH1cclxufVxyXG5cclxuZ2VvdGFiLmFkZGluLnJlZ2lzdHJhdGlvbkNvbmZpZyA9IGZ1bmN0aW9uICgpIHtcclxuICAgIGxldCBhZGRpbjogQWRkaW47XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBpbml0aWFsaXplOiAoYXBpLCBzdGF0ZSwgY2FsbGJhY2spID0+IHtcclxuICAgICAgICAgICAgYWRkaW4gPSBuZXcgQWRkaW4oYXBpKTtcclxuICAgICAgICAgICAgY2FsbGJhY2soKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIGZvY3VzOiAoKSA9PiB7XHJcbiAgICAgICAgICAgIGFkZGluLnJlbmRlcigpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgYmx1cjogKCkgPT4ge1xyXG4gICAgICAgICAgICBhZGRpbi51bmxvYWQoKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG59OyIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi9ibHVlYmlyZC5kLnRzXCIvPlxyXG5pbXBvcnQge2VudGl0eVRvRGljdGlvbmFyeSwgbWVyZ2VVbmlxdWV9IGZyb20gXCIuL3V0aWxzXCI7XHJcblxyXG4vL0EgZGlzdHJpYnV0aW9uIGxpc3QgbGlua3MgYSBzZXQgb2YgUnVsZShzKSB0byBhIHNldCBvZiBSZWNpcGllbnQocykuIFdoZW4gYSBSdWxlIGlzIHZpb2xhdGVkIGVhY2ggcmVsYXRlZCBSZWNpcGllbnQgd2lsbCByZWNlaXZlIGEgbm90aWZpY2F0aW9uIG9mIHRoZSBraW5kIGRlZmluZWQgYnkgaXRzIFJlY2lwaWVudFR5cGUuXHJcbmludGVyZmFjZSBJRGlzdHJpYnV0aW9uTGlzdCB7XHJcbiAgICBpZDogc3RyaW5nO1xyXG4gICAgbmFtZTogc3RyaW5nO1xyXG4gICAgcmVjaXBpZW50czogYW55W107XHJcbiAgICBydWxlczogYW55W107XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgSURpc3RyaWJ1dGlvbkxpc3REZXBlbmRlbmNpZXMge1xyXG4gICAgcnVsZXM/OiBhbnlbXTtcclxuICAgIHVzZXJzPzogYW55W107XHJcbiAgICBub3RpZmljYXRpb25UZW1wbGF0ZXM/OiBhbnlbXTtcclxuICAgIGdyb3Vwcz86IGFueVtdO1xyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBEaXN0cmlidXRpb25MaXN0c0J1aWxkZXIge1xyXG4gICAgcHJpdmF0ZSBhcGk7XHJcbiAgICBwcml2YXRlIGN1cnJlbnRUYXNrO1xyXG4gICAgcHJpdmF0ZSBkaXN0cmlidXRpb25MaXN0cztcclxuICAgIHByaXZhdGUgbm90aWZpY2F0aW9uVGVtcGxhdGVzO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKGFwaSkge1xyXG4gICAgICAgIHRoaXMuYXBpID0gYXBpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vQSBkaXN0cmlidXRpb24gbGlzdCBsaW5rcyBhIHNldCBvZiBSdWxlKHMpIHRvIGEgc2V0IG9mIFJlY2lwaWVudChzKS4gV2hlbiBhIFJ1bGUgaXMgdmlvbGF0ZWQgZWFjaCByZWxhdGVkIFJlY2lwaWVudCB3aWxsIHJlY2VpdmUgYSBub3RpZmljYXRpb24gb2YgdGhlIGtpbmQgZGVmaW5lZCBieSBpdHMgUmVjaXBpZW50VHlwZS5cclxuICAgIHByaXZhdGUgZ2V0RGlzdHJpYnV0aW9uTGlzdHNEYXRhICgpOiBQcm9taXNlPGFueT4ge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuYXBpLm11bHRpQ2FsbChbXHJcbiAgICAgICAgICAgICAgICBbXCJHZXRcIiwge1xyXG4gICAgICAgICAgICAgICAgICAgIFwidHlwZU5hbWVcIjogXCJEaXN0cmlidXRpb25MaXN0XCIsXHJcbiAgICAgICAgICAgICAgICB9XSxcclxuICAgICAgICAgICAgICAgIFtcIkdldE5vdGlmaWNhdGlvbldlYlJlcXVlc3RUZW1wbGF0ZXNcIiwge31dLFxyXG4gICAgICAgICAgICAgICAgW1wiR2V0Tm90aWZpY2F0aW9uRW1haWxUZW1wbGF0ZXNcIiwge31dLFxyXG4gICAgICAgICAgICAgICAgW1wiR2V0Tm90aWZpY2F0aW9uVGV4dFRlbXBsYXRlc1wiLCB7fV1cclxuICAgICAgICAgICAgXSwgcmVzb2x2ZSwgcmVqZWN0KTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgcHJpdmF0ZSBhYm9ydEN1cnJlbnRUYXNrICgpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrICYmIHRoaXMuY3VycmVudFRhc2suYWJvcnQgJiYgdGhpcy5jdXJyZW50VGFzay5hYm9ydCgpO1xyXG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgPSBudWxsO1xyXG4gICAgfTtcclxuXHJcbiAgICBwdWJsaWMgZ2V0RGVwZW5kZW5jaWVzIChkaXN0cmlidXRpb25MaXN0cyk6IElEaXN0cmlidXRpb25MaXN0RGVwZW5kZW5jaWVzIHtcclxuICAgICAgICBsZXQgZGVwZW5kZW5jaWVzOiBJRGlzdHJpYnV0aW9uTGlzdERlcGVuZGVuY2llcyA9IHtcclxuICAgICAgICAgICAgICAgIHJ1bGVzOiBbXSxcclxuICAgICAgICAgICAgICAgIHVzZXJzOiBbXSxcclxuICAgICAgICAgICAgICAgIGdyb3VwczogW10sXHJcbiAgICAgICAgICAgICAgICBub3RpZmljYXRpb25UZW1wbGF0ZXM6IFtdXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHByb2Nlc3NEZXBlbmRlbmNpZXMgPSAocmVjaXBpZW50KSA9PiB7XHJcbiAgICAgICAgICAgICAgICBsZXQgaWQsIHR5cGU6IHN0cmluZyxcclxuICAgICAgICAgICAgICAgICAgICB1c2VySWQgPSByZWNpcGllbnQudXNlci5pZDtcclxuICAgICAgICAgICAgICAgIHVzZXJJZCAmJiBkZXBlbmRlbmNpZXMudXNlcnMuaW5kZXhPZih1c2VySWQpID09PSAtMSAmJiBkZXBlbmRlbmNpZXMudXNlcnMucHVzaCh1c2VySWQpO1xyXG4gICAgICAgICAgICAgICAgc3dpdGNoIChyZWNpcGllbnQucmVjaXBpZW50VHlwZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJFbWFpbFwiOlxyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJMb2dQb3B1cFwiOlxyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJMb2dVcmdlbnRQb3B1cFwiOlxyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJMb2dPbmx5XCI6XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIlRleHRNZXNzYWdlXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIlRleHRUb1NwZWVjaEFsbG93RGVsYXlcIjpcclxuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiV2ViUmVxdWVzdFwiOlxyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJUZXh0VG9TcGVlY2hcIjpcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWQgPSByZWNpcGllbnQubm90aWZpY2F0aW9uQmluYXJ5RmlsZSAmJiByZWNpcGllbnQubm90aWZpY2F0aW9uQmluYXJ5RmlsZS5pZDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZSA9IFwibm90aWZpY2F0aW9uVGVtcGxhdGVzXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJBc3NpZ25Ub0dyb3VwXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkID0gcmVjaXBpZW50Lmdyb3VwICYmIHJlY2lwaWVudC5ncm91cC5pZDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZSA9IFwiZ3JvdXBzXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWQgJiYgdHlwZSAmJiBkZXBlbmRlbmNpZXNbdHlwZV0uaW5kZXhPZihpZCkgPT09IC0xICYmIGRlcGVuZGVuY2llc1t0eXBlXS5wdXNoKGlkKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgY2hlY2tSZWNpcGllbnRzID0gKHJlY2lwaWVudHMsIGRlcGVuZGVuY2llczogSURpc3RyaWJ1dGlvbkxpc3REZXBlbmRlbmNpZXMpOiBJRGlzdHJpYnV0aW9uTGlzdERlcGVuZGVuY2llcyA9PiB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVjaXBpZW50cy5yZWR1Y2UoKGRlcGVuZGVuY2llcywgcmVjaXBpZW50KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgcHJvY2Vzc0RlcGVuZGVuY2llcyhyZWNpcGllbnQpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBkZXBlbmRlbmNpZXM7XHJcbiAgICAgICAgICAgICAgICB9LCBkZXBlbmRlbmNpZXMpO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIHJldHVybiBkaXN0cmlidXRpb25MaXN0cy5yZWR1Y2UoKGRlcGVuZGVuY2llczogSURpc3RyaWJ1dGlvbkxpc3REZXBlbmRlbmNpZXMsIGRpc3RyaWJ1dGlvbkxpc3Q6IElEaXN0cmlidXRpb25MaXN0KSA9PiB7XHJcbiAgICAgICAgICAgIGRlcGVuZGVuY2llcy5ydWxlcyA9IG1lcmdlVW5pcXVlKGRlcGVuZGVuY2llcy5ydWxlcywgZGlzdHJpYnV0aW9uTGlzdC5ydWxlcy5tYXAocnVsZSA9PiBydWxlLmlkKSk7XHJcbiAgICAgICAgICAgIGRlcGVuZGVuY2llcyA9IGNoZWNrUmVjaXBpZW50cyhkaXN0cmlidXRpb25MaXN0LnJlY2lwaWVudHMsIGRlcGVuZGVuY2llcyk7XHJcbiAgICAgICAgICAgIHJldHVybiBkZXBlbmRlbmNpZXM7XHJcbiAgICAgICAgfSwgZGVwZW5kZW5jaWVzKTtcclxuICAgIH07XHJcblxyXG4gICAgcHVibGljIGZldGNoKCk6IFByb21pc2U8YW55PiB7XHJcbiAgICAgICAgdGhpcy5hYm9ydEN1cnJlbnRUYXNrKCk7XHJcbiAgICAgICAgdGhpcy5jdXJyZW50VGFzayA9IHRoaXMuZ2V0RGlzdHJpYnV0aW9uTGlzdHNEYXRhKClcclxuICAgICAgICAgICAgLnRoZW4oKFtkaXN0cmlidXRpb25MaXN0cywgd2ViVGVtcGxhdGVzLCBlbWFpbFRlbXBsYXRlcywgdGV4dFRlbXBsYXRlc10pID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZGlzdHJpYnV0aW9uTGlzdHMgPSBlbnRpdHlUb0RpY3Rpb25hcnkoZGlzdHJpYnV0aW9uTGlzdHMpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5ub3RpZmljYXRpb25UZW1wbGF0ZXMgPSBlbnRpdHlUb0RpY3Rpb25hcnkod2ViVGVtcGxhdGVzLmNvbmNhdChlbWFpbFRlbXBsYXRlcykuY29uY2F0KHRleHRUZW1wbGF0ZXMpKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmRpc3RyaWJ1dGlvbkxpc3RzO1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAuY2F0Y2goY29uc29sZS5lcnJvcilcclxuICAgICAgICAgICAgLmZpbmFsbHkoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50VGFzayA9IG51bGw7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiB0aGlzLmN1cnJlbnRUYXNrO1xyXG4gICAgfTtcclxuXHJcbiAgICBwdWJsaWMgZ2V0Tm90aWZpY2F0aW9uVGVtcGxhdGVEYXRhICh0ZW1wbGF0ZUlkOiBzdHJpbmcpOiBhbnkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLm5vdGlmaWNhdGlvblRlbXBsYXRlc1t0ZW1wbGF0ZUlkXTtcclxuICAgIH07XHJcblxyXG4gICAgcHVibGljIGdldFJ1bGVzRGlzdHJpYnV0aW9uTGlzdHMgKHJ1bGVzSWRzOiBzdHJpbmdbXSk6IElEaXN0cmlidXRpb25MaXN0W10ge1xyXG4gICAgICAgIHJldHVybiBPYmplY3Qua2V5cyh0aGlzLmRpc3RyaWJ1dGlvbkxpc3RzKS5yZWR1Y2UoKHJlcywgaWQpID0+IHtcclxuICAgICAgICAgICAgbGV0IGxpc3QgPSB0aGlzLmRpc3RyaWJ1dGlvbkxpc3RzW2lkXTtcclxuICAgICAgICAgICAgbGlzdC5ydWxlcy5zb21lKGxpc3RSdWxlID0+IHJ1bGVzSWRzLmluZGV4T2YobGlzdFJ1bGUuaWQpID4gLTEpICYmIHJlcy5wdXNoKGxpc3QpO1xyXG4gICAgICAgICAgICByZXR1cm4gcmVzO1xyXG4gICAgICAgIH0sIFtdKTtcclxuICAgIH07XHJcblxyXG4gICAgcHVibGljIHVubG9hZCAoKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5hYm9ydEN1cnJlbnRUYXNrKCk7XHJcbiAgICB9O1xyXG59IiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uL2JsdWViaXJkLmQudHNcIi8+XHJcbmltcG9ydCAqIGFzIFV0aWxzIGZyb20gXCIuL3V0aWxzXCI7XHJcblxyXG5pbnRlcmZhY2UgQ29sb3Ige1xyXG4gICAgcjogbnVtYmVyO1xyXG4gICAgZzogbnVtYmVyO1xyXG4gICAgYjogbnVtYmVyO1xyXG4gICAgYTogbnVtYmVyO1xyXG59XHJcblxyXG5pbnRlcmZhY2UgSUdyb3VwIHtcclxuICAgIGlkOiBzdHJpbmc7XHJcbiAgICBuYW1lPzogc3RyaW5nO1xyXG4gICAgY29sb3I/OiBDb2xvcjtcclxuICAgIHBhcmVudD86IElHcm91cDtcclxuICAgIGNoaWxkcmVuPzogSUdyb3VwW107XHJcbiAgICB1c2VyPzogYW55O1xyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBHcm91cHNCdWlsZGVyIHtcclxuICAgIHByb3RlY3RlZCBhcGk7XHJcbiAgICBwcm90ZWN0ZWQgY3VycmVudFRhc2s7XHJcbiAgICBwcm90ZWN0ZWQgZ3JvdXBzOiBJR3JvdXBbXTtcclxuICAgIHByb3RlY3RlZCB0cmVlOiBJR3JvdXBbXTtcclxuICAgIHByb3RlY3RlZCBjdXJyZW50VHJlZTtcclxuXHJcbiAgICBwcml2YXRlIHVzZXJzOiBhbnk7XHJcbiAgICBwcml2YXRlIGN1cnJlbnRVc2VyTmFtZTogc3RyaW5nO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKGFwaTogYW55KSB7XHJcbiAgICAgICAgdGhpcy5hcGkgPSBhcGk7XHJcbiAgICB9XHJcblxyXG4gICAgLy9nZXRzIHRoZSBncm91cHMgYXNzb2NpYXRlZCB3aXRoIHRoZSBjdXJyZW50IHVzZXJcclxuICAgIHByaXZhdGUgZ2V0R3JvdXBzICgpOiBQcm9taXNlPGFueT4ge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuYXBpLmdldFNlc3Npb24oKHNlc3Npb25EYXRhKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRVc2VyTmFtZSA9IHNlc3Npb25EYXRhLnVzZXJOYW1lO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hcGkubXVsdGlDYWxsKFtcclxuICAgICAgICAgICAgICAgICAgICBbXCJHZXRcIiwge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlTmFtZTogXCJHcm91cFwiXHJcbiAgICAgICAgICAgICAgICAgICAgfV0sXHJcbiAgICAgICAgICAgICAgICAgICAgW1wiR2V0XCIsIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZU5hbWU6IFwiVXNlclwiXHJcbiAgICAgICAgICAgICAgICAgICAgfV1cclxuICAgICAgICAgICAgICAgIF0sIHJlc29sdmUsIHJlamVjdCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICBwcml2YXRlIGZpbmRDaGlsZCAoY2hpbGRJZDogc3RyaW5nLCBjdXJyZW50SXRlbTogSUdyb3VwLCBvbkFsbExldmVsczogYm9vbGVhbiA9IGZhbHNlKTogSUdyb3VwIHtcclxuICAgICAgICBsZXQgZm91bmRDaGlsZCA9IG51bGwsXHJcbiAgICAgICAgICAgIGNoaWxkcmVuID0gY3VycmVudEl0ZW0uY2hpbGRyZW47XHJcbiAgICAgICAgaWYgKCFjaGlsZElkIHx8ICFjaGlsZHJlbiB8fCAhY2hpbGRyZW4ubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY2hpbGRyZW4uc29tZShjaGlsZCA9PiB7XHJcbiAgICAgICAgICAgIGlmIChjaGlsZC5pZCA9PT0gY2hpbGRJZCkge1xyXG4gICAgICAgICAgICAgICAgZm91bmRDaGlsZCA9IGNoaWxkO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZvdW5kQ2hpbGQ7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBpZiAob25BbGxMZXZlbHMpIHtcclxuICAgICAgICAgICAgICAgICAgICBmb3VuZENoaWxkID0gdGhpcy5maW5kQ2hpbGQoY2hpbGRJZCwgY2hpbGQsIG9uQWxsTGV2ZWxzKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZm91bmRDaGlsZDtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHJldHVybiBmb3VuZENoaWxkO1xyXG4gICAgfTtcclxuXHJcbiAgICBwcml2YXRlIGdldFVzZXJCeVByaXZhdGVHcm91cElkIChncm91cElkOiBzdHJpbmcpOiBhbnkge1xyXG4gICAgICAgIGxldCBvdXRwdXRVc2VyID0gbnVsbCxcclxuICAgICAgICAgICAgdXNlckhhc1ByaXZhdGVHcm91cCA9ICh1c2VyLCBncm91cElkKTogYm9vbGVhbiA9PiB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdXNlci5wcml2YXRlVXNlckdyb3Vwcy5zb21lKGdyb3VwID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZ3JvdXAuaWQgPT09IGdyb3VwSWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgdGhpcy51c2Vycy5zb21lKHVzZXIgPT4ge1xyXG4gICAgICAgICAgICBpZiAodXNlckhhc1ByaXZhdGVHcm91cCh1c2VyLCBncm91cElkKSkge1xyXG4gICAgICAgICAgICAgICAgb3V0cHV0VXNlciA9IHVzZXI7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiBvdXRwdXRVc2VyO1xyXG4gICAgfTtcclxuXHJcbiAgICBwcml2YXRlIGdldFByaXZhdGVHcm91cERhdGEgKGdyb3VwSWQ6IHN0cmluZykge1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIGlkOiBncm91cElkLFxyXG4gICAgICAgICAgICB1c2VyOiB0aGlzLmdldFVzZXJCeVByaXZhdGVHcm91cElkKGdyb3VwSWQpLFxyXG4gICAgICAgICAgICBjaGlsZHJlbjogW10sXHJcbiAgICAgICAgICAgIG5hbWU6IFwiUHJpdmF0ZVVzZXJHcm91cE5hbWVcIixcclxuICAgICAgICAgICAgcGFyZW50OiB7XHJcbiAgICAgICAgICAgICAgICBpZDogXCJHcm91cFByaXZhdGVVc2VySWRcIixcclxuICAgICAgICAgICAgICAgIGNoaWxkcmVuOiBbeyBpZDogZ3JvdXBJZCB9XVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgIH07XHJcblxyXG4gICAgcHJvdGVjdGVkIGNyZWF0ZUdyb3Vwc1RyZWUgKGdyb3VwczogSUdyb3VwW10pOiBhbnlbXSB7XHJcbiAgICAgICAgbGV0IG5vZGVMb29rdXAsXHJcbiAgICAgICAgICAgIHRyYXZlcnNlQ2hpbGRyZW4gPSBmdW5jdGlvbiAobm9kZSkge1xyXG4gICAgICAgICAgICAgICAgbGV0IGNoaWxkcmVuOiBJR3JvdXBbXSxcclxuICAgICAgICAgICAgICAgICAgICBpZDogc3RyaW5nO1xyXG5cclxuICAgICAgICAgICAgICAgIGNoaWxkcmVuID0gbm9kZS5jaGlsZHJlbjtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoY2hpbGRyZW4pIHtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMCwgaWkgPSBjaGlsZHJlbi5sZW5ndGg7IGkgPCBpaTsgaSArPSAxKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkID0gY2hpbGRyZW5baV0uaWQ7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobm9kZUxvb2t1cFtpZF0pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGUuY2hpbGRyZW5baV0gPSBub2RlTG9va3VwW2lkXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGUuY2hpbGRyZW5baV0ucGFyZW50ID0gbm9kZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBub2RlTG9va3VwW2lkXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0cmF2ZXJzZUNoaWxkcmVuKG5vZGUuY2hpbGRyZW5baV0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgbm9kZUxvb2t1cCA9IFV0aWxzLmVudGl0eVRvRGljdGlvbmFyeShncm91cHMsIGVudGl0eSA9PiB7XHJcbiAgICAgICAgICAgIGxldCBuZXdFbnRpdHkgPSBVdGlscy5leHRlbmQoe30sIGVudGl0eSk7XHJcbiAgICAgICAgICAgIGlmIChuZXdFbnRpdHkuY2hpbGRyZW4pIHtcclxuICAgICAgICAgICAgICAgIG5ld0VudGl0eS5jaGlsZHJlbiA9IG5ld0VudGl0eS5jaGlsZHJlbi5zbGljZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBuZXdFbnRpdHk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIE9iamVjdC5rZXlzKG5vZGVMb29rdXApLmZvckVhY2goa2V5ID0+IHtcclxuICAgICAgICAgICAgbm9kZUxvb2t1cFtrZXldICYmIHRyYXZlcnNlQ2hpbGRyZW4obm9kZUxvb2t1cFtrZXldKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIE9iamVjdC5rZXlzKG5vZGVMb29rdXApLm1hcChrZXkgPT4ge1xyXG4gICAgICAgICAgICByZXR1cm4gbm9kZUxvb2t1cFtrZXldO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICBwcm90ZWN0ZWQgYWJvcnRDdXJyZW50VGFzayAoKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5jdXJyZW50VGFzayAmJiB0aGlzLmN1cnJlbnRUYXNrLmFib3J0ICYmIHRoaXMuY3VycmVudFRhc2suYWJvcnQoKTtcclxuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrID0gbnVsbDtcclxuICAgIH07XHJcblxyXG4gICAgLy9maWxscyB0aGUgZ3JvdXAgYnVpbGRlciB3aXRoIHRoZSByZWxldmFudCBpbmZvcm1hdGlvblxyXG4gICAgcHVibGljIGZldGNoICgpOiBQcm9taXNlPGFueT4ge1xyXG4gICAgICAgIHRoaXMuYWJvcnRDdXJyZW50VGFzaygpO1xyXG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgPSB0aGlzLmdldEdyb3VwcygpXHJcbiAgICAgICAgICAgIC50aGVuKChbZ3JvdXBzLCB1c2Vyc10pID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZ3JvdXBzID0gZ3JvdXBzO1xyXG4gICAgICAgICAgICAgICAgdGhpcy51c2VycyA9IHVzZXJzO1xyXG4gICAgICAgICAgICAgICAgdGhpcy50cmVlID0gdGhpcy5jcmVhdGVHcm91cHNUcmVlKGdyb3Vwcyk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRUcmVlID0gVXRpbHMuZXh0ZW5kKHt9LCB0aGlzLnRyZWUpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlRmxhdEdyb3Vwc0xpc3QodGhpcy50cmVlKTtcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgLmNhdGNoKGNvbnNvbGUuZXJyb3IpXHJcbiAgICAgICAgICAgIC5maW5hbGx5KCgpID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudFRhc2sgPSBudWxsO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4gdGhpcy5jdXJyZW50VGFzaztcclxuICAgIH07XHJcblxyXG4gICAgcHVibGljIGNyZWF0ZUZsYXRHcm91cHNMaXN0IChncm91cHM6IElHcm91cFtdLCBub3RJbmNsdWRlQ2hpbGRyZW46IGJvb2xlYW4gPSBmYWxzZSk6IElHcm91cFtdIHtcclxuICAgICAgICBsZXQgZm91bmRJZHMgPSBbXSxcclxuICAgICAgICAgICAgZ3JvdXBzVG9BZGQgPSBbXSxcclxuICAgICAgICAgICAgbWFrZUZsYXRQYXJlbnRzID0gKGl0ZW0pID0+IHtcclxuICAgICAgICAgICAgICAgIGxldCBpdGVtQ29weSA9IFV0aWxzLmV4dGVuZCh7fSwgaXRlbSk7XHJcbiAgICAgICAgICAgICAgICBpZiAoaXRlbSAmJiBpdGVtLnBhcmVudCkge1xyXG4gICAgICAgICAgICAgICAgICAgIG1ha2VGbGF0UGFyZW50cyhpdGVtLnBhcmVudCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpdGVtQ29weS5jaGlsZHJlbiA9IGl0ZW1Db3B5LmNoaWxkcmVuLm1hcChjaGlsZCA9PiBjaGlsZC5pZCk7XHJcbiAgICAgICAgICAgICAgICBpdGVtQ29weS5wYXJlbnQgPSBpdGVtLnBhcmVudCA/IHtpZDogaXRlbS5wYXJlbnQuaWQsIG5hbWU6IGl0ZW0ucGFyZW50Lm5hbWV9IDogbnVsbDtcclxuICAgICAgICAgICAgICAgIGlmIChmb3VuZElkcy5pbmRleE9mKGl0ZW0uaWQpID09PSAtMSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGdyb3Vwc1RvQWRkLnB1c2goaXRlbUNvcHkpO1xyXG4gICAgICAgICAgICAgICAgICAgIGZvdW5kSWRzLnB1c2goaXRlbS5pZCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIG1ha2VGbGF0Q2hpbGRyZW4gPSAoaXRlbSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKGl0ZW0gJiYgaXRlbS5jaGlsZHJlbiAmJiBpdGVtLmNoaWxkcmVuLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGl0ZW0uY2hpbGRyZW4uZm9yRWFjaCgoY2hpbGQpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGNoaWxkQ29weTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGZvdW5kSWRzLmluZGV4T2YoY2hpbGQuaWQpID09PSAtMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWFrZUZsYXRDaGlsZHJlbihjaGlsZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGRDb3B5ID0gVXRpbHMuZXh0ZW5kKHt9LCBjaGlsZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkQ29weS5jaGlsZHJlbiA9IGNoaWxkQ29weS5jaGlsZHJlbi5tYXAoY2hpbGRJbm5lciA9PiBjaGlsZElubmVyLmlkKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGRDb3B5LnBhcmVudCA9IGNoaWxkQ29weS5wYXJlbnQgPyB7aWQ6IGNoaWxkQ29weS5wYXJlbnQuaWQsIG5hbWU6IGNoaWxkQ29weS5wYXJlbnQubmFtZX0gOiBudWxsO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZm91bmRJZHMuaW5kZXhPZihjaGlsZC5pZCkgPT09IC0xKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBncm91cHNUb0FkZC5wdXNoKGNoaWxkQ29weSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3VuZElkcy5wdXNoKGNoaWxkLmlkKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICBncm91cHMuZm9yRWFjaChtYWtlRmxhdFBhcmVudHMpO1xyXG4gICAgICAgICFub3RJbmNsdWRlQ2hpbGRyZW4gJiYgZ3JvdXBzLmZvckVhY2gobWFrZUZsYXRDaGlsZHJlbik7XHJcbiAgICAgICAgcmV0dXJuIGdyb3Vwc1RvQWRkO1xyXG4gICAgfTtcclxuXHJcbiAgICBwdWJsaWMgZ2V0R3JvdXBzRGF0YSAoZ3JvdXBJZHM6IHN0cmluZ1tdLCBub3RJbmNsdWRlQ2hpbGRyZW46IGJvb2xlYW4gPSBmYWxzZSk6IElHcm91cFtdIHtcclxuICAgICAgICBsZXQgdHJlZUdyb3VwcyA9IGdyb3VwSWRzLm1hcChncm91cElkID0+XHJcbiAgICAgICAgICAgIHRoaXMuZmluZENoaWxkKGdyb3VwSWQsIHtpZDogbnVsbCwgY2hpbGRyZW46IHRoaXMudHJlZX0sIHRydWUpIHx8IHRoaXMuZ2V0UHJpdmF0ZUdyb3VwRGF0YShncm91cElkKVxyXG4gICAgICAgICk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlRmxhdEdyb3Vwc0xpc3QodHJlZUdyb3Vwcywgbm90SW5jbHVkZUNoaWxkcmVuKTtcclxuICAgIH07XHJcblxyXG4gICAgcHVibGljIGdldEN1c3RvbUdyb3Vwc0RhdGEgKGdyb3VwSWRzOiBzdHJpbmdbXSwgYWxsR3JvdXBzOiBJR3JvdXBbXSk6IElHcm91cFtdIHtcclxuICAgICAgICBsZXQgZ3JvdXBzVHJlZSA9IHRoaXMuY3JlYXRlR3JvdXBzVHJlZShhbGxHcm91cHMpLFxyXG4gICAgICAgICAgICB0cmVlR3JvdXBzID0gZ3JvdXBJZHMubWFwKGdyb3VwSWQgPT4gXHJcbiAgICAgICAgICAgICAgICB0aGlzLmZpbmRDaGlsZChncm91cElkLCB7aWQ6IG51bGwsIGNoaWxkcmVuOiBncm91cHNUcmVlfSwgdHJ1ZSkgfHwgdGhpcy5nZXRQcml2YXRlR3JvdXBEYXRhKGdyb3VwSWQpXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlRmxhdEdyb3Vwc0xpc3QodHJlZUdyb3VwcywgdHJ1ZSk7XHJcbiAgICB9O1xyXG5cclxuICAgIHB1YmxpYyBnZXRQcml2YXRlR3JvdXBzVXNlcnMoZ3JvdXBzOiBJR3JvdXBbXSkge1xyXG4gICAgICAgIHJldHVybiBncm91cHMucmVkdWNlKCh1c2VycywgZ3JvdXApID0+IHtcclxuICAgICAgICAgICAgZ3JvdXAudXNlciAmJiBncm91cC51c2VyLm5hbWUgIT09IHRoaXMuY3VycmVudFVzZXJOYW1lICYmIHVzZXJzLnB1c2goZ3JvdXAudXNlcik7XHJcbiAgICAgICAgICAgIHJldHVybiB1c2VycztcclxuICAgICAgICB9LCBbXSk7XHJcbiAgICB9O1xyXG5cclxuICAgIHB1YmxpYyB1bmxvYWQgKCk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMuYWJvcnRDdXJyZW50VGFzaygpO1xyXG4gICAgfTtcclxufSIsImltcG9ydCB7IGVudGl0eVRvRGljdGlvbmFyeSB9IGZyb20gXCIuL3V0aWxzXCI7XHJcblxyXG50eXBlIFRNYXBQcm92aWRlclR5cGUgPSBcImRlZmF1bHRcIiB8IFwiYWRkaXRpb25hbFwiIHwgXCJjdXN0b21cIjtcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgSU1pc2NEYXRhIHtcclxuICAgIG1hcFByb3ZpZGVyOiB7XHJcbiAgICAgICAgdmFsdWU6IHN0cmluZztcclxuICAgICAgICB0eXBlOiBUTWFwUHJvdmlkZXJUeXBlO1xyXG4gICAgfTtcclxuICAgIGN1cnJlbnRVc2VyOiBhbnk7XHJcbiAgICBpc1Vuc2lnbmVkQWRkaW5zQWxsb3dlZDogYm9vbGVhbjtcclxuICAgIGFkZGluczogc3RyaW5nW107XHJcbiAgICBwdXJnZVNldHRpbmdzOiBhbnk7XHJcbiAgICBlbWFpbFNlbmRlckZyb206IHN0cmluZztcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIE1pc2NCdWlsZGVyIHtcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgYXBpO1xyXG4gICAgcHJpdmF0ZSBjdXN0b21NYXBQcm92aWRlcnM7XHJcbiAgICBwcml2YXRlIGN1cnJlbnRUYXNrO1xyXG4gICAgcHJpdmF0ZSBjdXJyZW50VXNlcjtcclxuICAgIHByaXZhdGUgaXNVbnNpZ25lZEFkZGluc0FsbG93ZWQ7XHJcbiAgICBwcml2YXRlIGFkZGluczogc3RyaW5nW107XHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IGRlZmF1bHRNYXBQcm92aWRlcnMgPSB7XHJcbiAgICAgICAgR29vZ2xlTWFwczogXCJHb29nbGUgTWFwc1wiLFxyXG4gICAgICAgIEhlcmU6IFwiSEVSRSBNYXBzXCIsXHJcbiAgICAgICAgTWFwQm94OiBcIk1hcEJveFwiXHJcbiAgICB9O1xyXG4gICAgcHJpdmF0ZSBwdXJnZVNldHRpbmdzOiBhbnk7XHJcbiAgICBwcml2YXRlIGVtYWlsU2VuZGVyRnJvbTogc3RyaW5nO1xyXG5cclxuICAgIHByaXZhdGUgYWJvcnRDdXJyZW50VGFzayAoKSB7XHJcbiAgICAgICAgdGhpcy5jdXJyZW50VGFzayAmJiB0aGlzLmN1cnJlbnRUYXNrLmFib3J0ICYmIHRoaXMuY3VycmVudFRhc2suYWJvcnQoKTtcclxuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrID0gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICAvL3RvZG8gcHJvYmxlbSBjb2RlLi4uaXMgdGhpcyBuZWNlc3Nhcnk/XHJcbiAgICBwcml2YXRlIGdldEFsbG93ZWRBZGRpbnMgKGFsbEFkZGluczogc3RyaW5nW10pIHtcclxuICAgICAgICByZXR1cm4gYWxsQWRkaW5zLmZpbHRlcihhZGRpbiA9PiB7XHJcbiAgICAgICAgICAgIGxldCBhZGRpbkNvbmZpZyA9IEpTT04ucGFyc2UoYWRkaW4pO1xyXG4gICAgICAgICAgICByZXR1cm4gYWRkaW5Db25maWcgJiYgQXJyYXkuaXNBcnJheShhZGRpbkNvbmZpZy5pdGVtcykgJiYgYWRkaW5Db25maWcuaXRlbXMuZXZlcnkoaXRlbSA9PiB7XHJcbiAgICAgICAgICAgICAgICBsZXQgdXJsID0gaXRlbS51cmw7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnaGVyZS4uLicpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHVybCAmJiB1cmwuaW5kZXhPZihcIlxcL1xcL1wiKSA+IC0xO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGlzQ3VycmVudEFkZGluIChhZGRpbjogc3RyaW5nKSB7XHJcbiAgICAgICAgcmV0dXJuIGFkZGluLmluZGV4T2YoXCJSZWdpc3RyYXRpb24gY29uZmlnXCIpID4gLTE7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3RydWN0b3IoYXBpKSB7XHJcbiAgICAgICAgdGhpcy5hcGkgPSBhcGk7XHJcbiAgICB9XHJcblxyXG4gICAgLy9maWxscyB0aGUgTWlzYyBidWlsZGVyIChzeXN0ZW0gc2V0dGluZ3MpIHdpdGggdGhlIHJlbGV2YW50IGluZm9ybWF0aW9uXHJcbiAgICBmZXRjaCAoKTogUHJvbWlzZTxJTWlzY0RhdGE+IHtcclxuICAgICAgICB0aGlzLmFib3J0Q3VycmVudFRhc2soKTtcclxuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrID0gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLmFwaS5nZXRTZXNzaW9uKChzZXNzaW9uRGF0YSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgbGV0IHVzZXJOYW1lID0gc2Vzc2lvbkRhdGEudXNlck5hbWU7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmFwaS5tdWx0aUNhbGwoW1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBbXCJHZXRcIiwge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZU5hbWU6IFwiVXNlclwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VhcmNoOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogdXNlck5hbWVcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfV0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFtcIkdldFwiLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlTmFtZTogXCJTeXN0ZW1TZXR0aW5nc1wiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1dXHJcbiAgICAgICAgICAgICAgICAgICAgXSwgcmVzb2x2ZSwgcmVqZWN0KTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSkudGhlbigocmVzdWx0KSA9PiB7XHJcbiAgICAgICAgICAgIGxldCBjdXJyZW50VXNlciA9IHJlc3VsdFswXVswXSB8fCByZXN1bHRbMF0sXHJcbiAgICAgICAgICAgICAgICBzeXN0ZW1TZXR0aW5ncyA9IHJlc3VsdFsxXVswXSB8fCByZXN1bHRbMV0sXHJcbiAgICAgICAgICAgICAgICB1c2VyTWFwUHJvdmlkZXJJZCA9IGN1cnJlbnRVc2VyLmRlZmF1bHRNYXBFbmdpbmUsXHJcbiAgICAgICAgICAgICAgICBkZWZhdWx0TWFwUHJvdmlkZXJJZCA9IHN5c3RlbVNldHRpbmdzLm1hcFByb3ZpZGVyLFxyXG4gICAgICAgICAgICAgICAgbWFwUHJvdmlkZXJJZCA9IHRoaXMuZ2V0TWFwUHJvdmlkZXJUeXBlKHVzZXJNYXBQcm92aWRlcklkKSA9PT0gXCJjdXN0b21cIiA/IHVzZXJNYXBQcm92aWRlcklkIDogZGVmYXVsdE1hcFByb3ZpZGVySWQ7XHJcbiAgICAgICAgICAgIHRoaXMucHVyZ2VTZXR0aW5ncyA9IHN5c3RlbVNldHRpbmdzLnB1cmdlU2V0dGluZ3M7XHJcbiAgICAgICAgICAgIHRoaXMuZW1haWxTZW5kZXJGcm9tID0gc3lzdGVtU2V0dGluZ3MuZW1haWxTZW5kZXJGcm9tO1xyXG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRVc2VyID0gY3VycmVudFVzZXI7XHJcbiAgICAgICAgICAgIHRoaXMuY3VzdG9tTWFwUHJvdmlkZXJzID0gZW50aXR5VG9EaWN0aW9uYXJ5KHN5c3RlbVNldHRpbmdzLmN1c3RvbVdlYk1hcFByb3ZpZGVyTGlzdCk7XHJcbiAgICAgICAgICAgIHRoaXMuaXNVbnNpZ25lZEFkZGluc0FsbG93ZWQgPSBzeXN0ZW1TZXR0aW5ncy5hbGxvd1Vuc2lnbmVkQWRkSW47XHJcbiAgICAgICAgICAgIC8vIHJlbW92ZWQgYnkgQnJldHQgdG8gaW5jbHVkZSBzaW5nbGUgbGluZSBhZGRpbiBzdHJ1Y3R1cmVzXHJcbiAgICAgICAgICAgIC8vIHRoaXMuYWRkaW5zID0gdGhpcy5nZXRBbGxvd2VkQWRkaW5zKHN5c3RlbVNldHRpbmdzLmN1c3RvbWVyUGFnZXMpO1xyXG4gICAgICAgICAgICB0aGlzLmFkZGlucyA9IHN5c3RlbVNldHRpbmdzLmN1c3RvbWVyUGFnZXM7XHJcbiAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICBtYXBQcm92aWRlcjoge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBtYXBQcm92aWRlcklkLFxyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IHRoaXMuZ2V0TWFwUHJvdmlkZXJUeXBlKG1hcFByb3ZpZGVySWQpXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgY3VycmVudFVzZXI6IHRoaXMuY3VycmVudFVzZXIsXHJcbiAgICAgICAgICAgICAgICBpc1Vuc2lnbmVkQWRkaW5zQWxsb3dlZDogdGhpcy5pc1Vuc2lnbmVkQWRkaW5zQWxsb3dlZCxcclxuICAgICAgICAgICAgICAgIGFkZGluczogdGhpcy5hZGRpbnMsXHJcbiAgICAgICAgICAgICAgICBwdXJnZVNldHRpbmdzOiB0aGlzLnB1cmdlU2V0dGluZ3MsXHJcbiAgICAgICAgICAgICAgICBlbWFpbFNlbmRlckZyb206IHRoaXMuZW1haWxTZW5kZXJGcm9tXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY3VycmVudFRhc2s7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0TWFwUHJvdmlkZXJUeXBlIChtYXBQcm92aWRlcklkOiBzdHJpbmcpOiBUTWFwUHJvdmlkZXJUeXBlIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5kZWZhdWx0TWFwUHJvdmlkZXJzW21hcFByb3ZpZGVySWRdID8gXCJkZWZhdWx0XCIgOiBcImN1c3RvbVwiO1xyXG4gICAgfVxyXG5cclxuICAgIGdldE1hcFByb3ZpZGVyTmFtZSAobWFwUHJvdmlkZXJJZDogc3RyaW5nKTogc3RyaW5nIHtcclxuICAgICAgICByZXR1cm4gbWFwUHJvdmlkZXJJZCAmJiAodGhpcy5kZWZhdWx0TWFwUHJvdmlkZXJzW21hcFByb3ZpZGVySWRdIHx8ICh0aGlzLmN1c3RvbU1hcFByb3ZpZGVyc1ttYXBQcm92aWRlcklkXSAmJiB0aGlzLmN1c3RvbU1hcFByb3ZpZGVyc1ttYXBQcm92aWRlcklkXS5uYW1lKSB8fCBtYXBQcm92aWRlcklkKTtcclxuICAgIH1cclxuXHJcbiAgICBnZXRNYXBQcm92aWRlckRhdGEgKG1hcFByb3ZpZGVySWQ6IHN0cmluZykge1xyXG4gICAgICAgIHJldHVybiBtYXBQcm92aWRlcklkICYmIHRoaXMuY3VzdG9tTWFwUHJvdmlkZXJzW21hcFByb3ZpZGVySWRdO1xyXG4gICAgfVxyXG5cclxuICAgIGlzVGhpc0FkZGluSW5jbHVkZWQgKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmFkZGlucy5zb21lKHRoaXMuaXNDdXJyZW50QWRkaW4pO1xyXG4gICAgfVxyXG5cclxuICAgIGdldEFkZGluc0RhdGEgKGluY2x1ZGVUaGlzQWRkaW4gPSB0cnVlKSB7XHJcbiAgICAgICAgcmV0dXJuICFpbmNsdWRlVGhpc0FkZGluID8gdGhpcy5hZGRpbnMuZmlsdGVyKGFkZGluID0+ICF0aGlzLmlzQ3VycmVudEFkZGluKGFkZGluKSkgOiB0aGlzLmFkZGlucztcclxuICAgIH1cclxuXHJcbiAgICB1bmxvYWQgKCk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMuYWJvcnRDdXJyZW50VGFzaygpO1xyXG4gICAgfVxyXG59IiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uL2JsdWViaXJkLmQudHNcIi8+XHJcbmltcG9ydCAqIGFzIFV0aWxzIGZyb20gXCIuL3V0aWxzXCI7XHJcblxyXG5jb25zdCBSRVBPUlRfVFlQRV9EQVNIQk9BRCA9IFwiRGFzaGJvYXJkXCI7XHJcblxyXG5pbnRlcmZhY2UgSVJlcG9ydCB7XHJcbiAgICBpZDogc3RyaW5nO1xyXG4gICAgZ3JvdXBzOiBJR3JvdXBbXTtcclxuICAgIGluY2x1ZGVBbGxDaGlsZHJlbkdyb3VwczogSUdyb3VwW107XHJcbiAgICBpbmNsdWRlRGlyZWN0Q2hpbGRyZW5Pbmx5R3JvdXBzOiBJR3JvdXBbXTtcclxuICAgIHNjb3BlR3JvdXBzOiBJR3JvdXBbXTtcclxuICAgIGRlc3RpbmF0aW9uPzogc3RyaW5nO1xyXG4gICAgdGVtcGxhdGU6IElSZXBvcnRUZW1wbGF0ZTtcclxuICAgIGxhc3RNb2RpZmllZFVzZXI7XHJcbiAgICBhcmd1bWVudHM6IHtcclxuICAgICAgICBydWxlcz86IGFueVtdO1xyXG4gICAgICAgIGRldmljZXM/OiBhbnlbXTtcclxuICAgICAgICB6b25lVHlwZUxpc3Q/OiBhbnlbXTtcclxuICAgICAgICBbcHJvcE5hbWU6IHN0cmluZ106IGFueTtcclxuICAgIH07XHJcbiAgICBbcHJvcE5hbWU6IHN0cmluZ106IGFueTtcclxufVxyXG5cclxuaW50ZXJmYWNlIElHcm91cCB7XHJcbiAgICBpZDogc3RyaW5nO1xyXG4gICAgY2hpbGRyZW46IElHcm91cFtdO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIElSZXBvcnREZXBlbmRlbmNpZXMge1xyXG4gICAgZGV2aWNlcz86IHN0cmluZ1tdO1xyXG4gICAgcnVsZXM/OiBzdHJpbmdbXTtcclxuICAgIHpvbmVUeXBlcz86IHN0cmluZ1tdO1xyXG4gICAgZ3JvdXBzPzogc3RyaW5nW107XHJcbn1cclxuXHJcbmludGVyZmFjZSBJUmVwb3J0VGVtcGxhdGUge1xyXG4gICAgaWQ6IHN0cmluZztcclxuICAgIG5hbWU6IHN0cmluZztcclxuICAgIGlzU3lzdGVtOiBib29sZWFuO1xyXG4gICAgcmVwb3J0RGF0YVNvdXJjZTogc3RyaW5nO1xyXG4gICAgcmVwb3J0VGVtcGxhdGVUeXBlOiBzdHJpbmc7XHJcbiAgICByZXBvcnRzOiBJUmVwb3J0W107XHJcbiAgICBiaW5hcnlEYXRhPzogc3RyaW5nO1xyXG4gICAgW3Byb3BOYW1lOiBzdHJpbmddOiBhbnk7XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFJlcG9ydHNCdWlsZGVyIHtcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgYXBpO1xyXG4gICAgcHJpdmF0ZSBjdXJyZW50VGFzaztcclxuICAgIHByaXZhdGUgYWxsUmVwb3J0czogSVJlcG9ydFtdO1xyXG4gICAgcHJpdmF0ZSBzdHJ1Y3R1cmVkUmVwb3J0cztcclxuICAgIHByaXZhdGUgZGFzaGJvYXJkc0xlbmd0aDogbnVtYmVyO1xyXG4gICAgcHJpdmF0ZSBhbGxUZW1wbGF0ZXM6IElSZXBvcnRUZW1wbGF0ZVtdO1xyXG5cclxuICAgIC8vR2V0UmVwb3J0U2NoZWR1bGVzIGlzIG9ic29sZXRlXHJcbiAgICBwcml2YXRlIGdldFJlcG9ydHMgKCk6IFByb21pc2U8YW55PiB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5hcGkubXVsdGlDYWxsKFtcclxuICAgICAgICAgICAgICAgIFtcIkdldFJlcG9ydFNjaGVkdWxlc1wiLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgXCJpbmNsdWRlVGVtcGxhdGVEZXRhaWxzXCI6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJhcHBseVVzZXJGaWx0ZXJcIjogZmFsc2VcclxuICAgICAgICAgICAgICAgIH1dLFxyXG4gICAgICAgICAgICAgICAgW1wiR2V0XCIsIHtcclxuICAgICAgICAgICAgICAgICAgICBcInR5cGVOYW1lXCI6IFwiUmVwb3J0VGVtcGxhdGVcIixcclxuICAgICAgICAgICAgICAgICAgICBcInNlYXJjaFwiOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGluY2x1ZGVCaW5hcnlEYXRhOiBmYWxzZVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1dLFxyXG4gICAgICAgICAgICAgICAgW1wiR2V0RGFzaGJvYXJkSXRlbXNcIiwge31dXHJcbiAgICAgICAgICAgIF0sIHJlc29sdmUsIHJlamVjdCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBzdHJ1Y3R1cmVSZXBvcnRzIChyZXBvcnRzLCB0ZW1wbGF0ZXMpIHtcclxuICAgICAgICBsZXQgZmluZFRlbXBsYXRlUmVwb3J0cyA9ICh0ZW1wbGF0ZUlkKSA9PiB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVwb3J0cy5maWx0ZXIocmVwb3J0ID0+IHJlcG9ydC50ZW1wbGF0ZS5pZCA9PT0gdGVtcGxhdGVJZCk7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgcmV0dXJuIHRlbXBsYXRlcy5yZWR1Y2UoKHJlcywgdGVtcGxhdGUpID0+IHtcclxuICAgICAgICAgICAgbGV0IHRlbXBsYXRlSWQgPSB0ZW1wbGF0ZS5pZCxcclxuICAgICAgICAgICAgICAgIHRlbXBsYXRlUmVwb3J0cyA9IGZpbmRUZW1wbGF0ZVJlcG9ydHModGVtcGxhdGVJZCk7XHJcbiAgICAgICAgICAgIGlmICh0ZW1wbGF0ZVJlcG9ydHMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZS5yZXBvcnRzID0gdGVtcGxhdGVSZXBvcnRzO1xyXG4gICAgICAgICAgICAgICAgcmVzLnB1c2godGVtcGxhdGUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiByZXM7XHJcbiAgICAgICAgfSwgW10pO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYWJvcnRDdXJyZW50VGFzayAoKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5jdXJyZW50VGFzayAmJiB0aGlzLmN1cnJlbnRUYXNrLmFib3J0ICYmIHRoaXMuY3VycmVudFRhc2suYWJvcnQoKTtcclxuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrID0gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHVwZGF0ZVRlbXBsYXRlIChuZXdUZW1wbGF0ZURhdGE6IElSZXBvcnRUZW1wbGF0ZSkge1xyXG4gICAgICAgIHRoaXMuYWxsVGVtcGxhdGVzLnNvbWUoKHRlbXBsYXRlRGF0YTogSVJlcG9ydFRlbXBsYXRlLCBpbmRleDogbnVtYmVyKSA9PiB7XHJcbiAgICAgICAgICAgIGlmICh0ZW1wbGF0ZURhdGEuaWQgPT09IG5ld1RlbXBsYXRlRGF0YS5pZCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hbGxUZW1wbGF0ZXNbaW5kZXhdID0gbmV3VGVtcGxhdGVEYXRhO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0cnVjdG9yKGFwaSkge1xyXG4gICAgICAgIHRoaXMuYXBpID0gYXBpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBmZXRjaCAoKTogUHJvbWlzZTxhbnk+IHtcclxuICAgICAgICB0aGlzLmFib3J0Q3VycmVudFRhc2soKTtcclxuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrID0gdGhpcy5nZXRSZXBvcnRzKClcclxuICAgICAgICAgICAgLnRoZW4oKFtyZXBvcnRzLCB0ZW1wbGF0ZXMsIGRhc2hib2FyZEl0ZW1zXSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hbGxSZXBvcnRzID0gcmVwb3J0cztcclxuICAgICAgICAgICAgICAgIHRoaXMuYWxsVGVtcGxhdGVzID0gdGVtcGxhdGVzO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5kYXNoYm9hcmRzTGVuZ3RoID0gZGFzaGJvYXJkSXRlbXMgJiYgZGFzaGJvYXJkSXRlbXMubGVuZ3RoID8gZGFzaGJvYXJkSXRlbXMubGVuZ3RoIDogMDtcclxuICAgICAgICAgICAgICAgIHRoaXMuc3RydWN0dXJlZFJlcG9ydHMgPSB0aGlzLnN0cnVjdHVyZVJlcG9ydHMocmVwb3J0cywgdGVtcGxhdGVzKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnN0cnVjdHVyZWRSZXBvcnRzO1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAuY2F0Y2goY29uc29sZS5lcnJvcilcclxuICAgICAgICAgICAgLmZpbmFsbHkoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50VGFzayA9IG51bGw7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiB0aGlzLmN1cnJlbnRUYXNrO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXREZXBlbmRlbmNpZXMgKHJlcG9ydHM6IElSZXBvcnRUZW1wbGF0ZVtdKTogSVJlcG9ydERlcGVuZGVuY2llcyB7XHJcbiAgICAgICAgbGV0IGFsbERlcGVuZGVuY2llczogSVJlcG9ydERlcGVuZGVuY2llcyA9IHtcclxuICAgICAgICAgICAgICAgIGRldmljZXM6IFtdLFxyXG4gICAgICAgICAgICAgICAgcnVsZXM6IFtdLFxyXG4gICAgICAgICAgICAgICAgem9uZVR5cGVzOiBbXSxcclxuICAgICAgICAgICAgICAgIGdyb3VwczogW11cclxuICAgICAgICAgICAgfTtcclxuICAgICAgICByZXR1cm4gcmVwb3J0cy5yZWR1Y2UoKHJlcG9ydHNEZXBlbmRlbmNpZXM6IElSZXBvcnREZXBlbmRlbmNpZXMsIHRlbXBsYXRlOiBJUmVwb3J0VGVtcGxhdGUpID0+IHtcclxuICAgICAgICAgICAgcmV0dXJuIHRlbXBsYXRlLnJlcG9ydHMucmVkdWNlKCh0ZW1wbGF0ZURlcGVuZGVjaWVzLCByZXBvcnQpID0+IHtcclxuICAgICAgICAgICAgICAgIHRlbXBsYXRlRGVwZW5kZWNpZXMuZ3JvdXBzID0gVXRpbHMubWVyZ2VVbmlxdWUodGVtcGxhdGVEZXBlbmRlY2llcy5ncm91cHMsIFV0aWxzLmdldEVudGl0aWVzSWRzKHJlcG9ydC5ncm91cHMpLFxyXG4gICAgICAgICAgICAgICAgICAgIFV0aWxzLmdldEVudGl0aWVzSWRzKHJlcG9ydC5pbmNsdWRlQWxsQ2hpbGRyZW5Hcm91cHMpLCBVdGlscy5nZXRFbnRpdGllc0lkcyhyZXBvcnQuaW5jbHVkZURpcmVjdENoaWxkcmVuT25seUdyb3VwcyksXHJcbiAgICAgICAgICAgICAgICAgICAgVXRpbHMuZ2V0RW50aXRpZXNJZHMocmVwb3J0LnNjb3BlR3JvdXBzKSk7XHJcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZURlcGVuZGVjaWVzLmRldmljZXMgPSBVdGlscy5tZXJnZVVuaXF1ZSh0ZW1wbGF0ZURlcGVuZGVjaWVzLmRldmljZXMsIHJlcG9ydC5hcmd1bWVudHMgJiYgcmVwb3J0LmFyZ3VtZW50cy5kZXZpY2VzICYmIFV0aWxzLmdldEVudGl0aWVzSWRzKHJlcG9ydC5hcmd1bWVudHMuZGV2aWNlcykgfHwgW10pO1xyXG4gICAgICAgICAgICAgICAgdGVtcGxhdGVEZXBlbmRlY2llcy5ydWxlcyA9IFV0aWxzLm1lcmdlVW5pcXVlKHRlbXBsYXRlRGVwZW5kZWNpZXMucnVsZXMsIHJlcG9ydC5hcmd1bWVudHMgJiYgcmVwb3J0LmFyZ3VtZW50cy5ydWxlcyAmJiBVdGlscy5nZXRFbnRpdGllc0lkcyhyZXBvcnQuYXJndW1lbnRzLnJ1bGVzKSB8fCBbXSk7XHJcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZURlcGVuZGVjaWVzLnpvbmVUeXBlcyA9IFV0aWxzLm1lcmdlVW5pcXVlKFxyXG4gICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlRGVwZW5kZWNpZXMuem9uZVR5cGVzLCByZXBvcnQuYXJndW1lbnRzICYmIHJlcG9ydC5hcmd1bWVudHMuem9uZVR5cGVMaXN0ICYmIFV0aWxzLmdldEVudGl0aWVzSWRzKHJlcG9ydC5hcmd1bWVudHMuem9uZVR5cGVMaXN0KSB8fCBbXSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGVtcGxhdGVEZXBlbmRlY2llcztcclxuICAgICAgICAgICAgfSwgcmVwb3J0c0RlcGVuZGVuY2llcyk7XHJcbiAgICAgICAgfSwgYWxsRGVwZW5kZW5jaWVzKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0RGF0YSAoKTogUHJvbWlzZTxJUmVwb3J0VGVtcGxhdGVbXT4ge1xyXG4gICAgICAgIGxldCBwb3J0aW9uU2l6ZSA9IDE1LFxyXG4gICAgICAgICAgICBwb3J0aW9ucyA9IHRoaXMuYWxsVGVtcGxhdGVzLnJlZHVjZSgocmVxdWVzdHMsIHRlbXBsYXRlOiBJUmVwb3J0VGVtcGxhdGUpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmICghdGVtcGxhdGUuaXNTeXN0ZW0gJiYgIXRlbXBsYXRlLmJpbmFyeURhdGEpIHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgcG9ydGlvbkluZGV4OiBudW1iZXIgPSByZXF1ZXN0cy5sZW5ndGggLSAxO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghcmVxdWVzdHNbcG9ydGlvbkluZGV4XSB8fCByZXF1ZXN0c1twb3J0aW9uSW5kZXhdLmxlbmd0aCA+PSBwb3J0aW9uU2l6ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgIHJlcXVlc3RzLnB1c2goW10pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgIHBvcnRpb25JbmRleCArKztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWVzdHNbcG9ydGlvbkluZGV4XS5wdXNoKFtcIkdldFwiLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwidHlwZU5hbWVcIjogXCJSZXBvcnRUZW1wbGF0ZVwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBcInNlYXJjaFwiOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZDogdGVtcGxhdGUuaWQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmNsdWRlQmluYXJ5RGF0YTogdHJ1ZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfV0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlcXVlc3RzO1xyXG4gICAgICAgICAgICB9LCBbXSksXHJcbiAgICAgICAgICAgIHRvdGFsUmVzdWx0czogYW55W11bXSA9IFtdLFxyXG4gICAgICAgICAgICBnZXRQb3J0aW9uRGF0YSA9IHBvcnRpb24gPT4ge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPGFueT4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYXBpLm11bHRpQ2FsbChwb3J0aW9uLCByZXNvbHZlLCByZWplY3QpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGVycm9yUG9ydGlvbnMgPSBbXTtcclxuXHJcbiAgICAgICAgdGhpcy5hYm9ydEN1cnJlbnRUYXNrKCk7XHJcbiAgICAgICAgdGhpcy5jdXJyZW50VGFzayA9IHBvcnRpb25zLnJlZHVjZSgocHJvbWlzZXMsIHBvcnRpb24pID0+IHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBwcm9taXNlc1xyXG4gICAgICAgICAgICAgICAgICAgIC50aGVuKCgpID0+IGdldFBvcnRpb25EYXRhKHBvcnRpb24pKVxyXG4gICAgICAgICAgICAgICAgICAgIC50aGVuKHJlc3VsdCA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b3RhbFJlc3VsdHMgPSB0b3RhbFJlc3VsdHMuY29uY2F0KHJlc3VsdCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sIGUgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3JQb3J0aW9ucyA9IGVycm9yUG9ydGlvbnMuY29uY2F0KHBvcnRpb24pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIH0sIFV0aWxzLnJlc29sdmVkUHJvbWlzZShbXSkpXHJcbiAgICAgICAgICAgIC50aGVuKCgpID0+IHtcclxuICAgICAgICAgICAgICAgIGVycm9yUG9ydGlvbnMubGVuZ3RoICYmIGNvbnNvbGUud2FybihlcnJvclBvcnRpb25zKTtcclxuICAgICAgICAgICAgICAgIHRvdGFsUmVzdWx0cy5mb3JFYWNoKHRlbXBsYXRlRGF0YSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHRlbXBsYXRlOiBJUmVwb3J0VGVtcGxhdGUgPSB0ZW1wbGF0ZURhdGEubGVuZ3RoID8gdGVtcGxhdGVEYXRhWzBdIDogdGVtcGxhdGVEYXRhO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlVGVtcGxhdGUodGVtcGxhdGUpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnN0cnVjdHVyZWRSZXBvcnRzID0gdGhpcy5zdHJ1Y3R1cmVSZXBvcnRzKHRoaXMuYWxsUmVwb3J0cywgdGhpcy5hbGxUZW1wbGF0ZXMpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuc3RydWN0dXJlZFJlcG9ydHM7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIC5jYXRjaChjb25zb2xlLmVycm9yKVxyXG4gICAgICAgICAgICAuZmluYWxseSgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRUYXNrID0gbnVsbDtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY3VycmVudFRhc2s7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldERhc2hib2FyZHNRdHkgKCk6IG51bWJlciB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZGFzaGJvYXJkc0xlbmd0aDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0Q3VzdG9taXplZFJlcG9ydHNRdHkgKCk6IG51bWJlciB7XHJcbiAgICAgICAgbGV0IHRlbXBsYXRlcyA9IFtdO1xyXG4gICAgICAgIHJldHVybiAodGhpcy5hbGxSZXBvcnRzLmZpbHRlcigocmVwb3J0OiBJUmVwb3J0KSA9PiB7XHJcbiAgICAgICAgICAgIGxldCB0ZW1wbGF0ZUlkID0gcmVwb3J0LnRlbXBsYXRlLmlkLFxyXG4gICAgICAgICAgICAgICAgdGVtcGxhdGVFeGlzdHM6IGJvb2xlYW4gPSB0ZW1wbGF0ZXMuaW5kZXhPZih0ZW1wbGF0ZUlkKSA+IC0xLFxyXG4gICAgICAgICAgICAgICAgaXNDb3VudDogYm9vbGVhbiA9ICF0ZW1wbGF0ZUV4aXN0cyAmJiByZXBvcnQubGFzdE1vZGlmaWVkVXNlciAhPT0gXCJOb1VzZXJJZFwiO1xyXG4gICAgICAgICAgICBpc0NvdW50ICYmIHRlbXBsYXRlcy5wdXNoKHRlbXBsYXRlSWQpO1xyXG4gICAgICAgICAgICByZXR1cm4gaXNDb3VudDtcclxuICAgICAgICB9KSkubGVuZ3RoO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyB1bmxvYWQgKCk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMuYWJvcnRDdXJyZW50VGFzaygpO1xyXG4gICAgfVxyXG59IiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uL2JsdWViaXJkLmQudHNcIi8+XHJcbmltcG9ydCB7IHNvcnRBcnJheU9mRW50aXRpZXMsIGVudGl0eVRvRGljdGlvbmFyeSwgbWVyZ2VVbmlxdWUgfSBmcm9tIFwiLi91dGlsc1wiO1xyXG5cclxuaW50ZXJmYWNlIElSdWxlIHtcclxuICAgIGlkOiBzdHJpbmc7XHJcbiAgICBncm91cHM6IGFueVtdO1xyXG4gICAgY29uZGl0aW9uOiBhbnk7XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgSVJ1bGVEZXBlbmRlbmNpZXMge1xyXG4gICAgZGV2aWNlcz86IGFueVtdO1xyXG4gICAgdXNlcnM/OiBhbnlbXTtcclxuICAgIHpvbmVzPzogYW55W107XHJcbiAgICB6b25lVHlwZXM/OiBhbnlbXTtcclxuICAgIHdvcmtUaW1lcz86IGFueVtdO1xyXG4gICAgd29ya0hvbGlkYXlzPzogYW55W107XHJcbiAgICBncm91cHM/OiBhbnlbXTtcclxuICAgIHNlY3VyaXR5R3JvdXBzPzogYW55W107XHJcbiAgICBkaWFnbm9zdGljcz86IGFueVtdO1xyXG59XHJcblxyXG5jb25zdCBBUFBMSUNBVElPTl9SVUxFX0lEID0gXCJSdWxlQXBwbGljYXRpb25FeGNlcHRpb25JZFwiO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgUnVsZXNCdWlsZGVyIHtcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgYXBpO1xyXG4gICAgcHJpdmF0ZSBjdXJyZW50VGFzaztcclxuICAgIHByaXZhdGUgY29tYmluZWRSdWxlcztcclxuICAgIHByaXZhdGUgc3RydWN0dXJlZFJ1bGVzO1xyXG5cclxuICAgIHByaXZhdGUgZ2V0UnVsZXMgKCk6IFByb21pc2U8YW55PiB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5hcGkuY2FsbChcIkdldFwiLCB7XHJcbiAgICAgICAgICAgICAgICBcInR5cGVOYW1lXCI6IFwiUnVsZVwiXHJcbiAgICAgICAgICAgIH0sIHJlc29sdmUsIHJlamVjdCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBzdHJ1Y3R1cmVSdWxlcyAocnVsZXMpIHtcclxuICAgICAgICByZXR1cm4gc29ydEFycmF5T2ZFbnRpdGllcyhydWxlcywgW1tcImJhc2VUeXBlXCIsIFwiZGVzY1wiXSwgXCJuYW1lXCJdKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFib3J0Q3VycmVudFRhc2sgKCk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgJiYgdGhpcy5jdXJyZW50VGFzay5hYm9ydCAmJiB0aGlzLmN1cnJlbnRUYXNrLmFib3J0KCk7XHJcbiAgICAgICAgdGhpcy5jdXJyZW50VGFzayA9IG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3RydWN0b3IoYXBpKSB7XHJcbiAgICAgICAgdGhpcy5hcGkgPSBhcGk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldERlcGVuZGVuY2llcyAocnVsZXMpOiBJUnVsZURlcGVuZGVuY2llcyB7XHJcbiAgICAgICAgbGV0IGRlcGVuZGVuY2llcyA9IHtcclxuICAgICAgICAgICAgICAgIGRldmljZXM6IFtdLFxyXG4gICAgICAgICAgICAgICAgdXNlcnM6IFtdLFxyXG4gICAgICAgICAgICAgICAgem9uZXM6IFtdLFxyXG4gICAgICAgICAgICAgICAgem9uZVR5cGVzOiBbXSxcclxuICAgICAgICAgICAgICAgIHdvcmtUaW1lczogW10sXHJcbiAgICAgICAgICAgICAgICBncm91cHM6IFtdLFxyXG4gICAgICAgICAgICAgICAgZGlhZ25vc3RpY3M6IFtdXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHByb2Nlc3NEZXBlbmRlbmNpZXMgPSAoY29uZGl0aW9uKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBsZXQgaWQsIHR5cGU6IHN0cmluZztcclxuICAgICAgICAgICAgICAgIHN3aXRjaCAoY29uZGl0aW9uLmNvbmRpdGlvblR5cGUpIHtcclxuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiUnVsZVdvcmtIb3Vyc1wiOlxyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJBZnRlclJ1bGVXb3JrSG91cnNcIjpcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWQgPSAoY29uZGl0aW9uLndvcmtUaW1lICYmIGNvbmRpdGlvbi53b3JrVGltZS5pZCkgfHwgY29uZGl0aW9uLndvcmtUaW1lO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlID0gXCJ3b3JrVGltZXNcIjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIkRyaXZlclwiOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZCA9IGNvbmRpdGlvbi5kcml2ZXIgJiYgY29uZGl0aW9uLmRyaXZlci5pZDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZSA9IFwidXNlcnNcIjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIkRldmljZVwiOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZCA9IGNvbmRpdGlvbi5kZXZpY2UgJiYgY29uZGl0aW9uLmRldmljZS5pZDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZSA9IFwiZGV2aWNlc1wiO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiRW50ZXJpbmdBcmVhXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIkV4aXRpbmdBcmVhXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIk91dHNpZGVBcmVhXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIkluc2lkZUFyZWFcIjpcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNvbmRpdGlvbi56b25lKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZCA9IGNvbmRpdGlvbi56b25lLmlkIHx8IGNvbmRpdGlvbi56b25lO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZSA9IFwiem9uZXNcIjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkID0gY29uZGl0aW9uLnpvbmVUeXBlLmlkO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZSA9IFwiem9uZVR5cGVzXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIkZpbHRlclN0YXR1c0RhdGFCeURpYWdub3N0aWNcIjpcclxuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiQWN0aXZlT3JJbmFjdGl2ZUZhdWx0XCI6XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIkZhdWx0XCI6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjb25kaXRpb24uZGlhZ25vc3RpYykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWQgPSBjb25kaXRpb24uZGlhZ25vc3RpYy5pZCB8fCBjb25kaXRpb24uZGlhZ25vc3RpYztcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGUgPSBcImRpYWdub3N0aWNzXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZCAmJiB0eXBlICYmIGRlcGVuZGVuY2llc1t0eXBlXS5pbmRleE9mKGlkKSA9PT0gLTEgJiYgZGVwZW5kZW5jaWVzW3R5cGVdLnB1c2goaWQpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBjaGVja0NvbmRpdGlvbnMgPSAocGFyZW50Q29uZGl0aW9uLCBkZXBlbmRlbmNpZXM6IElSdWxlRGVwZW5kZW5jaWVzKTogSVJ1bGVEZXBlbmRlbmNpZXMgPT4ge1xyXG4gICAgICAgICAgICAgICAgbGV0IGNvbmRpdGlvbnMgPSBwYXJlbnRDb25kaXRpb24uY2hpbGRyZW4gfHwgW107XHJcbiAgICAgICAgICAgICAgICBwcm9jZXNzRGVwZW5kZW5jaWVzKHBhcmVudENvbmRpdGlvbik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY29uZGl0aW9ucy5yZWR1Y2UoKGRlcGVuZGVuY2llcywgY29uZGl0aW9uKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNvbmRpdGlvbi5jaGlsZHJlbikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkZXBlbmRlbmNpZXMgPSBjaGVja0NvbmRpdGlvbnMoY29uZGl0aW9uLCBkZXBlbmRlbmNpZXMpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBwcm9jZXNzRGVwZW5kZW5jaWVzKGNvbmRpdGlvbik7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGRlcGVuZGVuY2llcztcclxuICAgICAgICAgICAgICAgIH0sIGRlcGVuZGVuY2llcyk7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgcmV0dXJuIHJ1bGVzLnJlZHVjZSgoZGVwZW5kZW5jaWVzOiBJUnVsZURlcGVuZGVuY2llcywgcnVsZTogSVJ1bGUpID0+IHtcclxuICAgICAgICAgICAgZGVwZW5kZW5jaWVzLmdyb3VwcyA9IG1lcmdlVW5pcXVlKGRlcGVuZGVuY2llcy5ncm91cHMsIHJ1bGUuZ3JvdXBzLm1hcChncm91cCA9PiBncm91cC5pZCkpO1xyXG4gICAgICAgICAgICBpZiAocnVsZS5jb25kaXRpb24pIHtcclxuICAgICAgICAgICAgICAgIGRlcGVuZGVuY2llcyA9IGNoZWNrQ29uZGl0aW9ucyhydWxlLmNvbmRpdGlvbiwgZGVwZW5kZW5jaWVzKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gZGVwZW5kZW5jaWVzO1xyXG4gICAgICAgIH0sIGRlcGVuZGVuY2llcyk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGZldGNoKCk6IFByb21pc2U8YW55PiB7XHJcbiAgICAgICAgdGhpcy5hYm9ydEN1cnJlbnRUYXNrKCk7XHJcbiAgICAgICAgdGhpcy5jdXJyZW50VGFzayA9IHRoaXMuZ2V0UnVsZXMoKVxyXG4gICAgICAgICAgICAudGhlbigoc3dpdGNoZWRPblJ1bGVzKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNvbWJpbmVkUnVsZXMgPSBlbnRpdHlUb0RpY3Rpb25hcnkoc3dpdGNoZWRPblJ1bGVzKTtcclxuICAgICAgICAgICAgICAgIGRlbGV0ZSh0aGlzLmNvbWJpbmVkUnVsZXNbQVBQTElDQVRJT05fUlVMRV9JRF0pO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zdHJ1Y3R1cmVkUnVsZXMgPSB0aGlzLnN0cnVjdHVyZVJ1bGVzKE9iamVjdC5rZXlzKHRoaXMuY29tYmluZWRSdWxlcykubWFwKGtleSA9PiB0aGlzLmNvbWJpbmVkUnVsZXNba2V5XSkpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIE9iamVjdC5rZXlzKHRoaXMuY29tYmluZWRSdWxlcykubWFwKHJ1bGVJZCA9PiB0aGlzLmNvbWJpbmVkUnVsZXNbcnVsZUlkXSk7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIC5jYXRjaChjb25zb2xlLmVycm9yKVxyXG4gICAgICAgICAgICAuZmluYWxseSgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRUYXNrID0gbnVsbDtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY3VycmVudFRhc2s7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldFJ1bGVzRGF0YSAocnVsZXNJZHM6IHN0cmluZ1tdKTogSVJ1bGVbXSB7XHJcbiAgICAgICAgcmV0dXJuIHJ1bGVzSWRzLm1hcChydWxlSWQgPT4gdGhpcy5jb21iaW5lZFJ1bGVzW3J1bGVJZF0pO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyB1bmxvYWQgKCk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMuYWJvcnRDdXJyZW50VGFzaygpO1xyXG4gICAgfVxyXG59IiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uL2JsdWViaXJkLmQudHNcIi8+XHJcbmltcG9ydCBHcm91cHNCdWlsZGVyIGZyb20gXCIuL2dyb3Vwc0J1aWxkZXJcIjtcclxuaW1wb3J0ICogYXMgVXRpbHMgZnJvbSBcIi4vdXRpbHNcIjtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFNlY3VyaXR5Q2xlYXJhbmNlc0J1aWxkZXIgZXh0ZW5kcyBHcm91cHNCdWlsZGVyIHtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihhcGk6IGFueSkge1xyXG4gICAgICAgIHN1cGVyKGFwaSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBnZXRTZWN1cml0eUdyb3VwcyAoKTogUHJvbWlzZTxhbnk+IHtcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLmFwaS5nZXRTZXNzaW9uKChzZXNzaW9uRGF0YSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hcGkuY2FsbChcIkdldFwiLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGVOYW1lOiBcIkdyb3VwXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlYXJjaDoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IFwiR3JvdXBTZWN1cml0eUlkXCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0sIHJlc29sdmUsIHJlamVjdCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICBwdWJsaWMgZmV0Y2ggKCk6IFByb21pc2U8YW55PiB7XHJcbiAgICAgICAgdGhpcy5hYm9ydEN1cnJlbnRUYXNrKCk7XHJcbiAgICAgICAgdGhpcy5jdXJyZW50VGFzayA9IHRoaXMuZ2V0U2VjdXJpdHlHcm91cHMoKVxyXG4gICAgICAgICAgICAudGhlbihncm91cHMgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5ncm91cHMgPSBncm91cHM7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnRyZWUgPSB0aGlzLmNyZWF0ZUdyb3Vwc1RyZWUoZ3JvdXBzKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudFRyZWUgPSBVdGlscy5leHRlbmQoe30sIHRoaXMudHJlZSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVGbGF0R3JvdXBzTGlzdCh0aGlzLnRyZWUpLmZpbHRlcihncm91cCA9PiAhIWdyb3VwLm5hbWUpO1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAuY2F0Y2goY29uc29sZS5lcnJvcilcclxuICAgICAgICAgICAgLmZpbmFsbHkoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50VGFzayA9IG51bGw7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiB0aGlzLmN1cnJlbnRUYXNrO1xyXG4gICAgfTtcclxufSIsIi8vYWRkZWQgYnkgQnJldHQgdG8gbWFuYWdlIGFkZGluZyBhbGwgdXNlcnMgdG8gdGhlIGV4cG9ydCBhcyBhbiBvcHRpb25cclxuXHJcbmV4cG9ydCBjbGFzcyBVc2VyQnVpbGRlciB7XHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IGFwaTtcclxuICAgIHByaXZhdGUgY3VycmVudFRhc2s7XHJcblxyXG4gICAgY29uc3RydWN0b3IoYXBpKSB7XHJcbiAgICAgICAgdGhpcy5hcGkgPSBhcGk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhYm9ydEN1cnJlbnRUYXNrICgpIHtcclxuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrICYmIHRoaXMuY3VycmVudFRhc2suYWJvcnQgJiYgdGhpcy5jdXJyZW50VGFzay5hYm9ydCgpO1xyXG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgPSBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIC8vZmlsbHMgdGhlIHVzZXIgYnVpbGRlciB3aXRoIGFsbCB1c2Vyc1xyXG4gICAgZmV0Y2ggKCk6IFByb21pc2U8YW55PiB7XHJcbiAgICAgICAgdGhpcy5hYm9ydEN1cnJlbnRUYXNrKCk7XHJcbiAgICAgICAgdGhpcy5jdXJyZW50VGFzayA9IHRoaXMuZ2V0VXNlcnMoKVxyXG4gICAgICAgIHJldHVybiB0aGlzLmN1cnJlbnRUYXNrO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgZ2V0VXNlcnMgKCk6IFByb21pc2U8YW55PiB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5hcGkuY2FsbChcIkdldFwiLCB7XHJcbiAgICAgICAgICAgICAgICBcInR5cGVOYW1lXCI6IFwiVXNlclwiXHJcbiAgICAgICAgICAgIH0sIHJlc29sdmUsIHJlamVjdCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgdW5sb2FkICgpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLmFib3J0Q3VycmVudFRhc2soKTtcclxuICAgIH1cclxufSIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi9ibHVlYmlyZC5kLnRzXCIvPlxyXG5pbnRlcmZhY2UgSUNsYXNzQ29udHJvbCB7XHJcbiAgICBnZXQ6ICgpID0+IHN0cmluZztcclxuICAgIHNldDogKG5hbWU6IHN0cmluZykgPT4gdm9pZDtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBJRW50aXR5IHtcclxuICAgIGlkOiBzdHJpbmc7XHJcbiAgICBbcHJvcE5hbWU6IHN0cmluZ106IGFueTtcclxufVxyXG5cclxudHlwZSBJU29ydFByb3BlcnR5ID0gc3RyaW5nIHwgW3N0cmluZywgXCJhc2NcIiB8IFwiZGVzY1wiXTtcclxuXHJcbmxldCBjbGFzc05hbWVDdHJsID0gZnVuY3Rpb24gKGVsOiBFbGVtZW50KTogSUNsYXNzQ29udHJvbCB7XHJcbiAgICAgICAgdmFyIHBhcmFtID0gdHlwZW9mIGVsLmNsYXNzTmFtZSA9PT0gXCJzdHJpbmdcIiA/IFwiY2xhc3NOYW1lXCIgOiBcImJhc2VWYWxcIjtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBlbFtwYXJhbV0gfHwgXCJcIjtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgc2V0OiBmdW5jdGlvbiAodGV4dCkge1xyXG4gICAgICAgICAgICAgICAgZWxbcGFyYW1dID0gdGV4dDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICB9LFxyXG4gICAgaXNVc3VhbE9iamVjdCA9IGZ1bmN0aW9uIChvYmopIHtcclxuICAgICAgICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9iaikuaW5kZXhPZihcIk9iamVjdFwiKSAhPT0gLTE7XHJcbiAgICB9O1xyXG5cclxuZXhwb3J0IGludGVyZmFjZSBJSGFzaCB7XHJcbiAgICBbaWQ6IHN0cmluZ106IGFueTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHJlbW92ZUNsYXNzKGVsOiBFbGVtZW50LCBuYW1lOiBzdHJpbmcpOiB2b2lkIHtcclxuICAgIGlmICghZWwpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICBsZXQgY2xhc3Nlc1N0ciA9IGNsYXNzTmFtZUN0cmwoZWwpLmdldCgpLFxyXG4gICAgICAgIGNsYXNzZXMgPSBjbGFzc2VzU3RyLnNwbGl0KFwiIFwiKSxcclxuICAgICAgICBuZXdDbGFzc2VzID0gY2xhc3Nlcy5maWx0ZXIoY2xhc3NJdGVtID0+IGNsYXNzSXRlbSAhPT0gbmFtZSk7XHJcbiAgICBjbGFzc05hbWVDdHJsKGVsKS5zZXQobmV3Q2xhc3Nlcy5qb2luKFwiIFwiKSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBhZGRDbGFzcyhlbCwgbmFtZSk6IHZvaWQge1xyXG4gICAgaWYgKCFlbCkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIGxldCBjbGFzc2VzU3RyID0gY2xhc3NOYW1lQ3RybChlbCkuZ2V0KCksXHJcbiAgICAgICAgY2xhc3NlcyA9IGNsYXNzZXNTdHIuc3BsaXQoXCIgXCIpO1xyXG4gICAgaWYgKGNsYXNzZXMuaW5kZXhPZihuYW1lKSA9PT0gLTEpIHtcclxuICAgICAgICBjbGFzc05hbWVDdHJsKGVsKS5zZXQoY2xhc3Nlc1N0ciArIFwiIFwiICsgbmFtZSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBoYXNDbGFzcyhlbDogRWxlbWVudCwgY2xhc3NOYW1lOiBzdHJpbmcpOiBib29sZWFuIHtcclxuICAgIHJldHVybiBlbCAmJiBjbGFzc05hbWVDdHJsKGVsKS5nZXQoKS5pbmRleE9mKGNsYXNzTmFtZSkgIT09IC0xO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZXh0ZW5kKC4uLmFyZ3M6IGFueVtdKSB7XHJcbiAgICB2YXIgbGVuZ3RoID0gYXJncy5sZW5ndGgsXHJcbiAgICAgICAgc3JjLCBzcmNLZXlzLCBzcmNBdHRyLFxyXG4gICAgICAgIGZ1bGxDb3B5ID0gZmFsc2UsXHJcbiAgICAgICAgcmVzQXR0cixcclxuICAgICAgICByZXMgPSBhcmdzWzBdLCBpID0gMSwgajtcclxuXHJcbiAgICBpZiAodHlwZW9mIHJlcyA9PT0gXCJib29sZWFuXCIpIHtcclxuICAgICAgICBmdWxsQ29weSA9IHJlcztcclxuICAgICAgICByZXMgPSBhcmdzWzFdO1xyXG4gICAgICAgIGkrKztcclxuICAgIH1cclxuICAgIHdoaWxlIChpICE9PSBsZW5ndGgpIHtcclxuICAgICAgICBzcmMgPSBhcmdzW2ldO1xyXG4gICAgICAgIHNyY0tleXMgPSBPYmplY3Qua2V5cyhzcmMpO1xyXG4gICAgICAgIGZvciAoaiA9IDA7IGogPCBzcmNLZXlzLmxlbmd0aDsgaisrKSB7XHJcbiAgICAgICAgICAgIHNyY0F0dHIgPSBzcmNbc3JjS2V5c1tqXV07XHJcbiAgICAgICAgICAgIGlmIChmdWxsQ29weSAmJiAoaXNVc3VhbE9iamVjdChzcmNBdHRyKSB8fCBBcnJheS5pc0FycmF5KHNyY0F0dHIpKSkge1xyXG4gICAgICAgICAgICAgICAgcmVzQXR0ciA9IHJlc1tzcmNLZXlzW2pdXTtcclxuICAgICAgICAgICAgICAgIHJlc0F0dHIgPSByZXNbc3JjS2V5c1tqXV0gPSAoaXNVc3VhbE9iamVjdChyZXNBdHRyKSB8fCBBcnJheS5pc0FycmF5KHJlc0F0dHIpKSA/IHJlc0F0dHIgOiAoQXJyYXkuaXNBcnJheShzcmNBdHRyKSA/IFtdIDoge30pO1xyXG4gICAgICAgICAgICAgICAgZXh0ZW5kKGZ1bGxDb3B5LCByZXNBdHRyLCBzcmNBdHRyKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHJlc1tzcmNLZXlzW2pdXSA9IHNyY1tzcmNLZXlzW2pdXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBpKys7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcmVzO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZW50aXR5VG9EaWN0aW9uYXJ5KGVudGl0aWVzOiBhbnlbXSwgZW50aXR5Q2FsbGJhY2s/OiAoZW50aXR5OiBhbnkpID0+IGFueSk6IElIYXNoIHtcclxuICAgIHZhciBlbnRpdHksIG8gPSB7fSwgaSxcclxuICAgICAgICBsID0gZW50aXRpZXMubGVuZ3RoO1xyXG5cclxuICAgIGZvciAoaSA9IDA7IGkgPCBsOyBpKyspIHtcclxuICAgICAgICBpZiAoZW50aXRpZXNbaV0pIHtcclxuICAgICAgICAgICAgZW50aXR5ID0gZW50aXRpZXNbaV0uaWQgPyBlbnRpdGllc1tpXSA6IHtpZDogZW50aXRpZXNbaV19O1xyXG4gICAgICAgICAgICBvW2VudGl0eS5pZF0gPSBlbnRpdHlDYWxsYmFjayA/IGVudGl0eUNhbGxiYWNrKGVudGl0eSkgOiBlbnRpdHk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIG87XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBzb3J0QXJyYXlPZkVudGl0aWVzKGVudGl0aWVzOiBhbnlbXSwgc29ydGluZ0ZpZWxkczogSVNvcnRQcm9wZXJ0eVtdKTogYW55W10ge1xyXG4gICAgbGV0IGNvbXBhcmF0b3IgPSAocHJldkl0ZW0sIG5leHRJdGVtLCBwcm9wZXJ0aWVzOiBhbnlbXSwgaW5kZXggPSAwKSA9PiB7XHJcbiAgICAgICAgaWYgKHByb3BlcnRpZXMubGVuZ3RoIDw9IGluZGV4KSB7XHJcbiAgICAgICAgICAgIHJldHVybiAwO1xyXG4gICAgICAgIH1cclxuICAgICAgICBsZXQgb3B0aW9ucyA9IHByb3BlcnRpZXNbaW5kZXhdLFxyXG4gICAgICAgICAgICBbcHJvcGVydHksIGRpciA9IFwiYXNjXCJdID0gQXJyYXkuaXNBcnJheShvcHRpb25zKSA/IG9wdGlvbnMgOiBbb3B0aW9uc10sXHJcbiAgICAgICAgICAgIGRpck11bHRpcGxpZXI6IG51bWJlcjtcclxuICAgICAgICBkaXJNdWx0aXBsaWVyID0gZGlyID09PSBcImFzY1wiID8gMSA6IC0xO1xyXG4gICAgICAgIGlmIChwcmV2SXRlbVtwcm9wZXJ0eV0gPiBuZXh0SXRlbVtwcm9wZXJ0eV0pIHtcclxuICAgICAgICAgICAgcmV0dXJuIDEgKiBkaXJNdWx0aXBsaWVyO1xyXG4gICAgICAgIH0gZWxzZSBpZiAocHJldkl0ZW1bcHJvcGVydHldIDwgbmV4dEl0ZW1bcHJvcGVydHldKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAtMSAqIGRpck11bHRpcGxpZXI7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcmV0dXJuIGNvbXBhcmF0b3IocHJldkl0ZW0sIG5leHRJdGVtLCBwcm9wZXJ0aWVzLCBpbmRleCArIDEpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbiAgICByZXR1cm4gZW50aXRpZXMuc29ydCgocHJldlRlbXBsYXRlLCBuZXh0VGVtcGxhdGUpID0+IHtcclxuICAgICAgICByZXR1cm4gY29tcGFyYXRvcihwcmV2VGVtcGxhdGUsIG5leHRUZW1wbGF0ZSwgc29ydGluZ0ZpZWxkcyk7XHJcbiAgICB9KTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGRvd25sb2FkRGF0YUFzRmlsZShkYXRhOiBzdHJpbmcsIGZpbGVuYW1lOiBzdHJpbmcsIG1pbWVUeXBlID0gXCJ0ZXh0L2pzb25cIikge1xyXG4gICAgbGV0IGJsb2IgPSBuZXcgQmxvYihbZGF0YV0sIHt0eXBlOiBtaW1lVHlwZX0pLFxyXG4gICAgICAgIGVsZW07XHJcbiAgICBpZiAod2luZG93Lm5hdmlnYXRvci5tc1NhdmVPck9wZW5CbG9iKSB7XHJcbiAgICAgICAgd2luZG93Lm5hdmlnYXRvci5tc1NhdmVCbG9iKGJsb2IsIGZpbGVuYW1lKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgZWxlbSA9IHdpbmRvdy5kb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYVwiKTtcclxuICAgICAgICBlbGVtLmhyZWYgPSB3aW5kb3cuVVJMLmNyZWF0ZU9iamVjdFVSTChibG9iKTtcclxuICAgICAgICBlbGVtLmRvd25sb2FkID0gZmlsZW5hbWU7XHJcbiAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChlbGVtKTtcclxuICAgICAgICBlbGVtLmNsaWNrKCk7XHJcbiAgICAgICAgZG9jdW1lbnQuYm9keS5yZW1vdmVDaGlsZChlbGVtKTtcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIG1lcmdlVW5pcXVlRW50aXRpZXMgKC4uLnNvdXJjZXM6IElFbnRpdHlbXVtdKTogSUVudGl0eVtdIHtcclxuICAgIGxldCBhZGRlZElkczogc3RyaW5nW10gPSBbXSxcclxuICAgICAgICBtZXJnZWRJdGVtczogSUVudGl0eVtdID0gW107XHJcbiAgICBzb3VyY2VzLmZvckVhY2goc291cmNlID0+IHNvdXJjZS5mb3JFYWNoKGl0ZW0gPT4ge1xyXG4gICAgICAgIGlmIChpdGVtICYmIGl0ZW0uaWQgJiYgYWRkZWRJZHMuaW5kZXhPZihpdGVtLmlkKSA9PT0gLTEpIHtcclxuICAgICAgICAgICAgYWRkZWRJZHMucHVzaChpdGVtLmlkKTtcclxuICAgICAgICAgICAgbWVyZ2VkSXRlbXMucHVzaChpdGVtKTtcclxuICAgICAgICB9XHJcbiAgICB9KSk7XHJcbiAgICByZXR1cm4gbWVyZ2VkSXRlbXM7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRFbnRpdGllc0lkcyAoZW50aXRpZXNMaXN0OiBJRW50aXR5W10pOiBzdHJpbmdbXSB7XHJcbiAgICByZXR1cm4gQXJyYXkuaXNBcnJheShlbnRpdGllc0xpc3QpICYmIGVudGl0aWVzTGlzdC5yZWR1Y2UoKHJlc3VsdCwgZW50aXR5KSA9PiB7XHJcbiAgICAgICAgZW50aXR5ICYmIGVudGl0eS5pZCAmJiByZXN1bHQucHVzaChlbnRpdHkuaWQpO1xyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9LCBbXSkgfHwgW107XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBtZXJnZVVuaXF1ZSAoLi4uc291cmNlczogc3RyaW5nW11bXSk6IHN0cmluZ1tdIHtcclxuICAgIGxldCBtZXJnZWRJdGVtczogc3RyaW5nW10gPSBbXTtcclxuICAgIHNvdXJjZXMuZm9yRWFjaChzb3VyY2UgPT4ge1xyXG4gICAgICAgIEFycmF5LmlzQXJyYXkoc291cmNlKSAmJiBzb3VyY2UuZm9yRWFjaChpdGVtID0+IHtcclxuICAgICAgICAgICAgaXRlbSAmJiBtZXJnZWRJdGVtcy5pbmRleE9mKGl0ZW0pID09PSAtMSAmJiBtZXJnZWRJdGVtcy5wdXNoKGl0ZW0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfSk7XHJcbiAgICByZXR1cm4gbWVyZ2VkSXRlbXM7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRVbmlxdWVFbnRpdGllcyAobmV3RW50aXRpZXM6IElFbnRpdHlbXSwgZXhpc3RlZEVudGl0aWVzOiBJRW50aXR5W10pOiBJRW50aXR5W10ge1xyXG4gICAgbGV0IHNlbGVjdGVkRW50aXRpZXNIYXNoID0gZW50aXR5VG9EaWN0aW9uYXJ5KGV4aXN0ZWRFbnRpdGllcyk7XHJcbiAgICByZXR1cm4gbmV3RW50aXRpZXMucmVkdWNlKChyZXMsIGVudGl0eSkgPT4ge1xyXG4gICAgICAgICFzZWxlY3RlZEVudGl0aWVzSGFzaFtlbnRpdHkuaWRdICYmIHJlcy5wdXNoKGVudGl0eSk7XHJcbiAgICAgICAgcmV0dXJuIHJlcztcclxuICAgIH0sIFtdKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHRvZ2V0aGVyKHByb21pc2VzOiBQcm9taXNlPGFueT5bXSk6IFByb21pc2U8YW55PiB7XHJcbiAgICBsZXQgcmVzdWx0cyA9IFtdLFxyXG4gICAgICAgIHJlc3VsdHNDb3VudCA9IDA7XHJcbiAgICByZXN1bHRzLmxlbmd0aCA9IHByb21pc2VzLmxlbmd0aDtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgbGV0IHJlc29sdmVBbGwgPSAoKSA9PiB7XHJcbiAgICAgICAgICAgIHJldHVybiByZXNvbHZlKHJlc3VsdHMpO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgcHJvbWlzZXMubGVuZ3RoID8gcHJvbWlzZXMuZm9yRWFjaCgocHJvbWlzZSwgaW5kZXgpID0+IHtcclxuICAgICAgICAgICAgcHJvbWlzZS50aGVuKChyZXN1bHQpID0+IHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdHNDb3VudCsrO1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0c1tpbmRleF0gPSByZXN1bHQ7XHJcbiAgICAgICAgICAgICAgICByZXN1bHRzQ291bnQgPT09IHByb21pc2VzLmxlbmd0aCAmJiByZXNvbHZlQWxsKCk7XHJcbiAgICAgICAgICAgIH0pLmNhdGNoKChlcnJvcikgPT4ge1xyXG4gICAgICAgICAgICAgICAgcmVqZWN0KHtcclxuICAgICAgICAgICAgICAgICAgICBlcnJvcjogZXJyb3IsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvbWlzZUluZGV4OiBpbmRleFxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pIDogcmVzb2x2ZUFsbCgpO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiByZXNvbHZlZFByb21pc2U8VD4gKHZhbD86IFQpOiBQcm9taXNlPFQ+IHtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZTxUPihyZXNvbHZlID0+IHJlc29sdmUodmFsKSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB0b0FycmF5IChkYXRhKSB7XHJcbiAgICByZXR1cm4gQXJyYXkuaXNBcnJheShkYXRhKSA/IGRhdGEgOiBbZGF0YV07XHJcbn0iLCJleHBvcnQgZGVmYXVsdCBjbGFzcyBXYWl0aW5nIHtcclxuXHJcbiAgICBwcml2YXRlIHdhaXRpbmdDb250YWluZXI6IEhUTUxFbGVtZW50O1xyXG4gICAgcHJpdmF0ZSBib2R5RWw6IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQuYm9keTtcclxuXHJcbiAgICBwdWJsaWMgc3RhcnQoZWw6IEhUTUxFbGVtZW50ID0gdGhpcy5ib2R5RWwsIHpJbmRleD86IG51bWJlcikge1xyXG4gICAgICAgIGlmIChlbC5vZmZzZXRQYXJlbnQgPT09IG51bGwpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLndhaXRpbmdDb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG4gICAgICAgIHRoaXMud2FpdGluZ0NvbnRhaW5lci5jbGFzc05hbWUgPSBcIndhaXRpbmdcIjtcclxuICAgICAgICB0aGlzLndhaXRpbmdDb250YWluZXIuaW5uZXJIVE1MID0gXCI8ZGl2IGNsYXNzPSdmYWRlcic+PC9kaXY+PGRpdiBjbGFzcz0nc3Bpbm5lcic+PC9kaXY+XCI7XHJcbiAgICAgICAgZWwucGFyZW50Tm9kZS5hcHBlbmRDaGlsZCh0aGlzLndhaXRpbmdDb250YWluZXIpO1xyXG5cclxuICAgICAgICB0aGlzLndhaXRpbmdDb250YWluZXIuc3R5bGUucG9zaXRpb24gPSBcImFic29sdXRlXCI7XHJcbiAgICAgICAgdGhpcy53YWl0aW5nQ29udGFpbmVyLnN0eWxlLndpZHRoID0gZWwub2Zmc2V0V2lkdGggKyBcInB4XCI7XHJcbiAgICAgICAgdGhpcy53YWl0aW5nQ29udGFpbmVyLnN0eWxlLmhlaWdodCA9IGVsLm9mZnNldEhlaWdodCArIFwicHhcIjtcclxuICAgICAgICB0aGlzLndhaXRpbmdDb250YWluZXIuc3R5bGUudG9wID0gZWwub2Zmc2V0VG9wICsgXCJweFwiO1xyXG4gICAgICAgIHRoaXMud2FpdGluZ0NvbnRhaW5lci5zdHlsZS5sZWZ0ID0gZWwub2Zmc2V0TGVmdCArIFwicHhcIjtcclxuICAgICAgICB0aGlzLndhaXRpbmdDb250YWluZXIuc3R5bGUuZGlzcGxheSA9IFwiYmxvY2tcIjtcclxuICAgICAgICB0eXBlb2YgekluZGV4ID09PSBcIm51bWJlclwiICYmICh0aGlzLndhaXRpbmdDb250YWluZXIuc3R5bGUuekluZGV4ID0gekluZGV4LnRvU3RyaW5nKCkpO1xyXG4gICAgfTtcclxuXHJcbiAgICBwdWJsaWMgc3RvcCAoKSB7XHJcbiAgICAgICAgaWYgKHRoaXMud2FpdGluZ0NvbnRhaW5lciAmJiB0aGlzLndhaXRpbmdDb250YWluZXIucGFyZW50Tm9kZSkge1xyXG4gICAgICAgICAgICB0aGlzLndhaXRpbmdDb250YWluZXIucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0aGlzLndhaXRpbmdDb250YWluZXIpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbn0iLCIvL2FkZGVkIGJ5IEJyZXR0IHRvIG1hbmFnZSBhZGRpbmcgYWxsIHpvbmVzIHRvIHRoZSBleHBvcnQgYXMgYW4gb3B0aW9uXHJcblxyXG5leHBvcnQgY2xhc3MgWm9uZUJ1aWxkZXIge1xyXG4gICAgcHJpdmF0ZSByZWFkb25seSBhcGk7XHJcbiAgICBwcml2YXRlIGN1cnJlbnRUYXNrO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKGFwaSkge1xyXG4gICAgICAgIHRoaXMuYXBpID0gYXBpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYWJvcnRDdXJyZW50VGFzayAoKSB7XHJcbiAgICAgICAgdGhpcy5jdXJyZW50VGFzayAmJiB0aGlzLmN1cnJlbnRUYXNrLmFib3J0ICYmIHRoaXMuY3VycmVudFRhc2suYWJvcnQoKTtcclxuICAgICAgICB0aGlzLmN1cnJlbnRUYXNrID0gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICAvL2ZpbGxzIHRoZSB1c2VyIGJ1aWxkZXIgd2l0aCBhbGwgdXNlcnNcclxuICAgIGZldGNoICgpOiBQcm9taXNlPGFueT4ge1xyXG4gICAgICAgIHRoaXMuYWJvcnRDdXJyZW50VGFzaygpO1xyXG4gICAgICAgIHRoaXMuY3VycmVudFRhc2sgPSB0aGlzLmdldFpvbmVzKClcclxuICAgICAgICByZXR1cm4gdGhpcy5jdXJyZW50VGFzaztcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGdldFpvbmVzICgpOiBQcm9taXNlPGFueT4ge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuYXBpLmNhbGwoXCJHZXRcIiwge1xyXG4gICAgICAgICAgICAgICAgXCJ0eXBlTmFtZVwiOiBcIlpvbmVcIlxyXG4gICAgICAgICAgICB9LCByZXNvbHZlLCByZWplY3QpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHVubG9hZCAoKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5hYm9ydEN1cnJlbnRUYXNrKCk7XHJcbiAgICB9XHJcbn0iXX0=
