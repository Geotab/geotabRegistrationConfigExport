/// <reference path="../bluebird.d.ts"/>
import GroupsBuilder from "./groupsBuilder";
import * as Utils from "./utils";

export default class SecurityClearancesBuilder extends GroupsBuilder {

    constructor(api: any) {
        super(api);
    }

    private getSecurityGroups (): Promise<any> {
        return new Promise((resolve, reject) => {
            this.api.getSession((sessionData) => {
                this.api.call("Get", {
                        typeName: "Group",
                        search: {
                            id: "GroupSecurityId"
                        }
                    }, resolve, reject);
            });
        });
    };

    public fetch (): Promise<any> {
        this.abortCurrentTask();
        this.currentTask = this.getSecurityGroups()
            .then(groups => {
                this.groups = groups;
                this.tree = this.createGroupsTree(groups);
                this.currentTree = Utils.extend({}, this.tree);
                return this.createFlatGroupsList(this.tree).filter(group => !!group.name);
            })
            .catch(console.error)
            .finally(() => {
                this.currentTask = null;
            });
        return this.currentTask;
    };
}