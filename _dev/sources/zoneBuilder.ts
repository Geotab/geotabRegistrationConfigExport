//added by Brett to manage adding all zones to the export as an option

export class ZoneBuilder {
    private readonly api;
    private currentTask;

    constructor(api) {
        this.api = api;
    }

    private abortCurrentTask () {
        this.currentTask && this.currentTask.abort && this.currentTask.abort();
        this.currentTask = null;
    }


    private getZones (): Promise<any> {
        return new Promise((resolve, reject) => {
            this.api.call("Get", {
                "typeName": "Zone"
            }, resolve, reject);
        });
    }

    private getZonesQty (): Promise<number> {
        return new Promise((resolve, reject) => {
            this.api.call("GetCountOf", {
                "typeName": "Zone"
            }).then(resolve, reject);
        });
    }

    //fills the user builder with all users
    fetch (): Promise<any> {
        this.abortCurrentTask();
        this.currentTask = this.getZones()
        return this.currentTask;
    }

    getQty (): Promise<any> {
        this.abortCurrentTask();
        this.currentTask = this.getZonesQty()
            .catch(console.error)
            .finally(() => {
                this.currentTask = null;
            });
        return this.currentTask;
    }

    unload (): void {
        this.abortCurrentTask();
    }
}