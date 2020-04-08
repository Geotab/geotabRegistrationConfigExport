/// <reference path="../bluebird.d.ts"/>
import * as Utils from "./utils";

interface Color {
    r: number;
    g: number;
    b: number;
    a: number;
}

interface IGroup {
    id: string;
    name?: string;
    color?: Color;
    parent?: IGroup;
    children?: IGroup[];
    user?: any;
}

export default class GroupsBuilder {
    protected api;
    protected currentTask;
    protected groups: IGroup[];
    protected tree: IGroup[];
    protected currentTree;

    private users: any;
    private currentUserName: string;

    constructor(api: any) {
        this.api = api;
    }

    //gets the groups associated with the current user
    private getGroups (): Promise<any> {
        return new Promise((resolve, reject) => {
            this.api.getSession((sessionData) => {
                this.currentUserName = sessionData.userName;
                this.api.multiCall([
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

    private findChild (childId: string, currentItem: IGroup, onAllLevels: boolean = false): IGroup {
        let foundChild = null,
            children = currentItem.children;
        if (!childId || !children || !children.length) {
            return null;
        }

        children.some(child => {
            if (child.id === childId) {
                foundChild = child;
                return foundChild;
            } else {
                if (onAllLevels) {
                    foundChild = this.findChild(childId, child, onAllLevels);
                    return foundChild;
                } else {
                    return false;
                }
            }
        });

        return foundChild;
    };

    private getUserByPrivateGroupId (groupId: string): any {
        let outputUser = null,
            userHasPrivateGroup = (user, groupId): boolean => {
                return user.privateUserGroups.some(group => {
                    if (group.id === groupId) {
                        return true;
                    }
                });
            };
        this.users.some(user => {
            if (userHasPrivateGroup(user, groupId)) {
                outputUser = user;
                return true;
            }
        });
        return outputUser;
    };

    private getPrivateGroupData (groupId: string) {
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

    protected createGroupsTree (groups: IGroup[]): any[] {
        let nodeLookup,
            traverseChildren = function (node) {
                let children: IGroup[],
                    id: string;

                children = node.children;

                if (children) {
                    for (let i = 0, ii = children.length; i < ii; i += 1) {
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

        nodeLookup = Utils.entityToDictionary(groups, entity => {
            let newEntity = Utils.extend({}, entity);
            if (newEntity.children) {
                newEntity.children = newEntity.children.slice();
            }
            return newEntity;
        });

        Object.keys(nodeLookup).forEach(key => {
            nodeLookup[key] && traverseChildren(nodeLookup[key]);
        });

        return Object.keys(nodeLookup).map(key => {
            return nodeLookup[key];
        });
    };

    protected abortCurrentTask (): void {
        this.currentTask && this.currentTask.abort && this.currentTask.abort();
        this.currentTask = null;
    };

    //fills the group builder with the relevant information
    public fetch (): Promise<any> {
        this.abortCurrentTask();
        this.currentTask = this.getGroups()
            .then(([groups, users]) => {
                this.groups = groups;
                this.users = users;
                this.tree = this.createGroupsTree(groups);
                this.currentTree = Utils.extend({}, this.tree);
                return this.createFlatGroupsList(this.tree);
            })
            .catch(console.error)
            .finally(() => {
                this.currentTask = null;
            });
        return this.currentTask;
    };

    public createFlatGroupsList (groups: IGroup[], notIncludeChildren: boolean = false): IGroup[] {
        let foundIds = [],
            groupsToAdd = [],
            makeFlatParents = (item) => {
                let itemCopy = Utils.extend({}, item);
                if (item && item.parent) {
                    makeFlatParents(item.parent);
                }
                itemCopy.children = itemCopy.children.map(child => child.id);
                itemCopy.parent = item.parent ? {id: item.parent.id, name: item.parent.name} : null;
                if (foundIds.indexOf(item.id) === -1) {
                    groupsToAdd.push(itemCopy);
                    foundIds.push(item.id);
                }
            },
            makeFlatChildren = (item) => {
                if (item && item.children && item.children.length) {
                    item.children.forEach((child) => {
                        let childCopy;
                        if (foundIds.indexOf(child.id) === -1) {
                            makeFlatChildren(child);
                        }
                        childCopy = Utils.extend({}, child);
                        childCopy.children = childCopy.children.map(childInner => childInner.id);
                        childCopy.parent = childCopy.parent ? {id: childCopy.parent.id, name: childCopy.parent.name} : null;
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

    public getGroupsData (groupIds: string[], notIncludeChildren: boolean = false): IGroup[] {
        let treeGroups = groupIds.map(groupId =>
            this.findChild(groupId, {id: null, children: this.tree}, true) || this.getPrivateGroupData(groupId)
        );
        return this.createFlatGroupsList(treeGroups, notIncludeChildren);
    };

    public getCustomGroupsData (groupIds: string[], allGroups: IGroup[]): IGroup[] {
        let groupsTree = this.createGroupsTree(allGroups),
            treeGroups = groupIds.map(groupId => 
                this.findChild(groupId, {id: null, children: groupsTree}, true) || this.getPrivateGroupData(groupId)
            );
        return this.createFlatGroupsList(treeGroups, true);
    };

    public getPrivateGroupsUsers(groups: IGroup[]) {
        return groups.reduce((users, group) => {
            group.user && group.user.name !== this.currentUserName && users.push(group.user);
            return users;
        }, []);
    };

    public unload (): void {
        this.abortCurrentTask();
    };
}