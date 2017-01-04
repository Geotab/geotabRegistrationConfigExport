/// <reference path="../bluebird.d.ts"/>
import * as Utils from "./utils";

const REPORT_TYPE_DASHBOAD = "Dashboard";

interface IReport {
    id: string;
    groups: IGroup[];
    includeAllChildrenGroups: IGroup[];
    includeDirectChildrenOnlyGroups: IGroup[];
    scopeGroups: IGroup[];
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
    private allReports;
    private structuredReports;
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
                }]
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
            .then(([reports, templates]) => {
                ////reports = this.getCustomizedReports(reports);
                this.allReports = reports;
                this.structuredReports = this.structureReports(reports, templates);
                this.allTemplatesHash = Utils.entityToDictionary(templates, entity => Utils.extend({}, entity));
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
        let portionSize: number = 30,
            portions = Object.keys(this.allTemplatesHash).reduce((requests, templateId) => {
                if (!this.allTemplatesHash[templateId].isSystem && !this.allTemplatesHash[templateId].binaryData) {
                    let portionIndex: number = requests.length % portionSize;
                    !requests[portionIndex] && (requests[portionIndex] = []);
                    requests[portionIndex].push(["Get", {
                        "typeName": "ReportTemplate",
                        "search": {
                            id: templateId,
                            includeBinaryData: true
                        }
                    }]);
                }
                return requests;
            }, []),
            promises = portions.reduce((promises, portion) => {
                let promise = new Promise((resolve, reject) => {
                    this.api.multiCall(portion, resolve, reject);
                });
                promises.push(promise);
                return promises;
            }, []);

        this.abortCurrentTask();
        this.currentTask = Utils.together(promises).then((portions: any[][]) => {
            portions.forEach(portion => {
                portion.forEach((templateData) => {
                    let template: IReportTemplate = templateData.length ? templateData[0] : templateData;
                    this.allTemplatesHash[template.id] = template;
                });
            });
            this.structuredReports = this.structureReports(this.allReports, Object.keys(this.allTemplatesHash).map(templateId => this.allTemplatesHash[templateId]));
            return this.structuredReports;
        })
        .catch(console.error)
        .finally(() => {
            this.currentTask = null;
        });
        return this.currentTask;
    };

    public getDashboardsQty (): number {
        return this.allReports.reduce((qty, report) => {
            report && report.destination && report.destination === REPORT_TYPE_DASHBOAD && qty++;
            return qty;
        }, 0);
    };

    public getCustomizedReportsQty (): number {
        let templates = [];
        return (this.allReports.filter(report => {
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