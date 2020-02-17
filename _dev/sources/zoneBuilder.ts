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

    //fills the user builder with all users
    fetch (): Promise<any> {
        this.abortCurrentTask();
        this.currentTask = this.getZones()
        return this.currentTask;
    }

    private getZones (): Promise<any> {
        return new Promise((resolve, reject) => {
            this.api.call("Get", {
                "typeName": "Zone"
            }, resolve, reject);
        });
    }

    unload (): void {
        this.abortCurrentTask();
    }
}