/// <reference path="../bluebird.d.ts"/>
import * as Utils from "./utils";

const REPORT_TYPE_DASHBOAD = "Dashboard";

interface IReport {
    id: string;
    groups: IGroup[];
    includeAllChildrenGroups: IGroup[];
    includeDirectChildrenOnlyGroups: IGroup[];
    scopeGroups: IGroup[];
    destination?: string;
    template: IReportTemplate;
    lastModifiedUser;
    arguments: {
        rules?: any[];
        devices?: any[];
        zoneTypeList?: any[];
        [propName: string]: any;
    };
    [propName: string]: any;
}

interface IGroup {
    id: string;
    children: IGroup[];
}

export interface IReportDependencies {
    devices?: string[];
    rules?: string[];
    zoneTypes?: string[];
    groups?: string[];
}

interface IReportTemplate {
    id: string;
    name: string;
    isSystem: boolean;
    reportDataSource: string;
    reportTemplateType: string;
    reports: IReport[];
    binaryData?: string;
    [propName: string]: any;
}

export default class ReportsBuilder {
    private api;
    private currentTask;
    private allReports: IReport[];
    private structuredReports;
    private dashboardsLength: number;
    private allTemplates: IReportTemplate[];
    private allTemplatesHash: Utils.Hash;

    constructor(api) {
        this.api = api;
    }

    private getReports (): Promise<any> {
        return new Promise((resolve, reject) => {
            this.api.multiCall([
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

    private structureReports (reports, templates) {
        let findTemplateReports = (templateId) => {
                return reports.filter(report => report.template.id === templateId);
            };
        return templates.reduce((res, template) => {
            let templateId = template.id,
                templateReports = findTemplateReports(templateId);
            if (templateReports.length) {
                template.reports = templateReports;
                res.push(template);
            }
            return res;
        }, []);
    };

    private abortCurrentTask (): void {
        this.currentTask && this.currentTask.abort && this.currentTask.abort();
        this.currentTask = null;
    };

    public fetch (): Promise<any> {
        this.abortCurrentTask();
        this.currentTask = this.getReports()
            .then(([reports, templates, dashboardItems]) => {
                this.allReports = reports;
                this.allTemplates = templates;
                this.dashboardsLength = dashboardItems && dashboardItems.length ? dashboardItems.length : 0;
                this.structuredReports = this.structureReports(reports, templates);
                this.allTemplatesHash = Utils.entityToDictionary(templates);
                return this.structuredReports;
            })
            .catch(console.error)
            .finally(() => {
                this.currentTask = null;
            });
        return this.currentTask;
    };

    public getDependencies (reports: IReportTemplate[]): IReportDependencies {
        let dependencies: IReportDependencies = {
                devices: [],
                rules: [],
                zoneTypes: [],
                groups: []
            };
        return reports.reduce((dependencies: IReportDependencies, template: IReportTemplate) => {
            return template.reports.reduce((dependencies, report) => {
                dependencies.groups = Utils.mergeUnique(dependencies.groups, Utils.getEntitiesIds(report.groups),
                    Utils.getEntitiesIds(report.includeAllChildrenGroups), Utils.getEntitiesIds(report.includeDirectChildrenOnlyGroups),
                    Utils.getEntitiesIds(report.scopeGroups));
                dependencies.devices = Utils.mergeUnique(dependencies.devices, report.arguments && report.arguments.devices && Utils.getEntitiesIds(report.arguments.devices) || []);
                dependencies.rules = Utils.mergeUnique(dependencies.rules, report.arguments && report.arguments.rules && Utils.getEntitiesIds(report.arguments.rules) || []);
                dependencies.zoneTypes = Utils.mergeUnique(dependencies.zoneTypes, report.arguments && report.arguments.zoneTypeList && Utils.getEntitiesIds(report.arguments.zoneTypeList) || []);
                return dependencies;
            }, dependencies);
        }, dependencies);
    };

    public getData (): Promise<IReportTemplate[]> {
        let portionSize: number = 15,
            requestsTotal: number = 0,
            portions = this.allTemplates.reduce((requests, template: IReportTemplate) => {
                if (!template.isSystem && !template.binaryData) {
                    let portionIndex: number = requests.length - 1;
                    if (!requests[portionIndex] || requests[portionIndex].length >= portionSize) {
                       requests.push([]);
                       portionIndex ++;
                    }
                    requests[portionIndex].push(["Get", {
                        "typeName": "ReportTemplate",
                        "search": {
                            id: template.id,
                            includeBinaryData: true
                        }
                    }]);
                    requestsTotal++;
                }
                return requests;
            }, []),
            totalResults = [],
            getPortionData = (portion) => {
                return new Promise((resolve, reject) => {
                    this.api.multiCall(portion, resolve, reject);
                });
            },
            errorPortions = [];

        this.abortCurrentTask();
        this.currentTask = portions.reduce((promises, portion, index) => {
            return promises.then((result) => {
                totalResults.push(result);
                return getPortionData(portion);
            }).catch((e) => {
                errorPortions.concat(portions[index - 1]);
                console.error(e);
                return getPortionData(portion);
            });
        }, new Promise(resolve => resolve([]))).then((lastResult) => {
            totalResults = totalResults.concat(lastResult);
            totalResults.forEach(portion => {
                portion.forEach((templateData) => {
                    let template: IReportTemplate = templateData.length ? templateData[0] : templateData;
                    this.allTemplatesHash[template.id] = template;
                });
            });
            this.structuredReports = this.structureReports(this.allReports, this.allTemplates);
            return this.structuredReports;
        })
        .catch(console.error)
        .finally(() => {
            this.currentTask = null;
        });
        return this.currentTask;
    };

    public getDashboardsQty (): number {
        return this.dashboardsLength;
    };

    public getCustomizedReportsQty (): number {
        let templates = [];
        return (this.allReports.filter((report: IReport) => {
            let templateId = report.template.id,
                templateExists: boolean = templates.indexOf(templateId) > -1,
                isCount: boolean = !templateExists && report.lastModifiedUser !== "NoUserId";
            isCount && templates.push(templateId);
            return isCount;
        })).length;
    };

    public unload (): void {
        this.abortCurrentTask();
    };
}