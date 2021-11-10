/// <reference path="../bluebird.d.ts"/>
interface IClassControl {
    get: () => string;
    set: (name: string) => void;
}

export interface IEntity {
    id: string;
    [propName: string]: any;
}

type ISortProperty = string | [string, "asc" | "desc"];

let classNameCtrl = function (el: Element): IClassControl {
        var param = typeof el.className === "string" ? "className" : "baseVal";
        return {
            get: function () {
                return el[param] || "";
            },
            set: function (text) {
                el[param] = text;
            }
        };
    },
    isUsualObject = function (obj) {
        return Object.prototype.toString.call(obj).indexOf("Object") !== -1;
    };

export interface IHash {
    [id: string]: any;
}

export function removeClass(el: Element, name: string): void {
    if (!el) {
        return;
    }
    let classesStr = classNameCtrl(el).get(),
        classes = classesStr.split(" "),
        newClasses = classes.filter(classItem => classItem !== name);
    classNameCtrl(el).set(newClasses.join(" "));
}

export function addClass(el, name): void {
    if (!el) {
        return;
    }
    let classesStr = classNameCtrl(el).get(),
        classes = classesStr.split(" ");
    if (classes.indexOf(name) === -1) {
        classNameCtrl(el).set(classesStr + " " + name);
    }
}

export function hasClass(el: Element, className: string): boolean {
    return el && classNameCtrl(el).get().indexOf(className) !== -1;
}

export function extend(...args: any[]) {
    var length = args.length,
        src, srcKeys, srcAttr,
        fullCopy = false,
        resAttr,
        res = args[0], i = 1, j;

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
            } else {
                res[srcKeys[j]] = src[srcKeys[j]];
            }
        }
        i++;
    }
    return res;
}

export function entityToDictionary(entities: any[], entityCallback?: (entity: any) => any): IHash {
    var entity, o = {}, i,
        l = entities.length;

    for (i = 0; i < l; i++) {
        if (entities[i]) {
            entity = entities[i].id ? entities[i] : {id: entities[i]};
            o[entity.id] = entityCallback ? entityCallback(entity) : entity;
        }
    }
    return o;
}

export function sortArrayOfEntities(entities: any[], sortingFields: ISortProperty[]): any[] {
    let comparator = (prevItem, nextItem, properties: any[], index = 0) => {
        if (properties.length <= index) {
            return 0;
        }
        let options = properties[index],
            [property, dir = "asc"] = Array.isArray(options) ? options : [options],
            dirMultiplier: number;
        dirMultiplier = dir === "asc" ? 1 : -1;
        if (prevItem[property] > nextItem[property]) {
            return 1 * dirMultiplier;
        } else if (prevItem[property] < nextItem[property]) {
            return -1 * dirMultiplier;
        } else {
            return comparator(prevItem, nextItem, properties, index + 1);
        }
    };
    return entities.sort((prevTemplate, nextTemplate) => {
        return comparator(prevTemplate, nextTemplate, sortingFields);
    });
}

export function downloadDataAsFile(data: string, filename: string, mimeType = "text/json") {
    let blob = new Blob([data], {type: mimeType}),
        elem;
    elem = window.document.createElement("a");
    elem.href = window.URL.createObjectURL(blob);
    elem.download = filename;
    document.body.appendChild(elem);
    elem.click();
    document.body.removeChild(elem);
}

export function mergeUniqueEntities (...sources: IEntity[][]): IEntity[] {
    let addedIds: string[] = [],
        mergedItems: IEntity[] = [];
    sources.forEach(source => source.forEach(item => {
        if (item && item.id && addedIds.indexOf(item.id) === -1) {
            addedIds.push(item.id);
            mergedItems.push(item);
        }
    }));
    return mergedItems;
}

export function getEntitiesIds (entitiesList: IEntity[]): string[] {
    return Array.isArray(entitiesList) && entitiesList.reduce((result: string[], entity) => {
        entity && entity.id && result.push(entity.id);
        return result;
    }, []) || [];
}

export function mergeUnique (...sources: string[][]): string[] {
    let mergedItems: string[] = [];
    sources.forEach(source => {
        Array.isArray(source) && source.forEach(item => {
            item && mergedItems.indexOf(item) === -1 && mergedItems.push(item);
        });
    });
    return mergedItems;
}

export function getUniqueEntities (newEntities: IEntity[], existedEntities: IEntity[]): IEntity[] {
    let selectedEntitiesHash = entityToDictionary(existedEntities);
    return newEntities.reduce((res: IEntity[], entity) => {
        !selectedEntitiesHash[entity.id] && res.push(entity);
        return res;
    }, []);
}

export function together(promises: Promise<any>[]): Promise<any> {
    let results: any[] = [],
        resultsCount = 0;
    results.length = promises.length;
    return new Promise((resolve, reject) => {
        let resolveAll = () => {
            return resolve(results);
        };
        promises.length ? promises.forEach((promise, index) => {
            promise.then((result) => {
                resultsCount++;
                results[index] = result;
                resultsCount === promises.length && resolveAll();
            }).catch((error) => {
                reject({
                    error: error,
                    promiseIndex: index
                });
            });
        }) : resolveAll();
    });
}

export function resolvedPromise<T> (val?: T): Promise<T> {
    return new Promise<T>(resolve => resolve(val));
}

export function toArray (data) {
    return Array.isArray(data) ? data : [data];
}