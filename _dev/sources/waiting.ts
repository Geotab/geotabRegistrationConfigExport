export default class Waiting {

    private waitingContainer: HTMLElement;
    private bodyEl: HTMLElement = document.body;

    public start(el: HTMLElement = this.bodyEl, zIndex?: number) {
        if (el.offsetParent === null) {
            return false;
        }
        this.waitingContainer = document.createElement("div");
        this.waitingContainer.className = "waiting";
        this.waitingContainer.innerHTML = "<><div class='fader'></div><div class='spinner'></div>";
        el.parentNode.appendChild(this.waitingContainer);

        this.waitingContainer.style.position = "absolute";
        this.waitingContainer.style.width = el.offsetWidth + "px";
        this.waitingContainer.style.height = el.offsetHeight + "px";
        this.waitingContainer.style.top = el.offsetTop + "px";
        this.waitingContainer.style.left = el.offsetLeft + "px";
        this.waitingContainer.style.display = "block";
        typeof zIndex === "number" && (this.waitingContainer.style.zIndex = zIndex.toString());
    };

    public stop () {
        if (this.waitingContainer && this.waitingContainer.parentNode) {
            this.waitingContainer.parentNode.removeChild(this.waitingContainer);
        }
    };
}