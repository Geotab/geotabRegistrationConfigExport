export default class Waiting {

    private waitingContainer: HTMLElement;
    private bodyEl: HTMLElement = document.body;

    public start(el: HTMLElement = this.bodyEl, zIndex?: number) {
        if (el.offsetParent === null) {
            return false;
        }
        this.waitingContainer = document.createElement("div");
        this.waitingContainer.className = "erc-waiting";
        this.waitingContainer.innerHTML = `
            <div class="erc-waiting__overlay"></div>
            <div class="erc-waiting__spinner-container">
                <div class="erc-waiting__spinner">
                    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <linearGradient id="spinnerGradient" x1="0" y1="0" x2="1" y2="0" gradientUnits="objectBoundingBox">
                                <stop offset="0%" stop-color="var(--erc-color-primary)" stop-opacity="1"></stop>
                                <stop offset="33.33%" stop-color="var(--erc-color-primary)" stop-opacity="0.8"></stop>
                                <stop offset="50%" stop-color="var(--erc-color-primary)" stop-opacity="0.5"></stop>
                                <stop offset="66.67%" stop-color="var(--erc-color-primary)" stop-opacity="0.2"></stop>
                                <stop offset="100%" stop-color="var(--erc-color-primary)" stop-opacity="0"></stop>
                            </linearGradient>
                        </defs>
                        <path class="erc-waiting__spinner-animation" stroke="url(#spinnerGradient)" stroke-width="6" stroke-linecap="round" d="M 32 4 A 28 28 0 1 1 32 60 A 28 28 0 1 1 32 4 Z"></path>
                    </svg>
                </div>
            </div>
        `;
        el.parentNode?.appendChild(this.waitingContainer);

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