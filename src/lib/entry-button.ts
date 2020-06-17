enum Status {
  Initializing,
  Ready,
  Running,
  NotSupported,
}

const DefaultOptions = {
  onRequestSession: () => console.log("onRequestSession"),
  supportedText: "Tap to Start",
  notSupportedText: "Not Supported",
  textStyle: "font-size: 5em;",
  buttonStyle:
    "width: 50%; height: 10%; position: absolute; left: 25%; bottom: 5%;",
};

class EntryButton extends HTMLElement {
  private shadowDOM: ShadowRoot;
  private onRequestSession: () => void;
  private status: Status;
  private supportedText: string;
  private notSupportedText: string;
  private textElement: HTMLElement;
  private buttonElement: HTMLButtonElement;
  private _navigator: any;
  constructor(opt: any) {
    super();
    this.shadowDOM = this.attachShadow({ mode: "open" });
    this.textElement = document.createElement("text");
    this.buttonElement = document.createElement("button");
    this.buttonElement.appendChild(this.textElement);
    this.shadowDOM.appendChild(this.buttonElement);
    this._navigator = navigator;
    const options = opt || {};
    const textStyle = options.textStyle || DefaultOptions.textStyle;
    const buttonSytle = options.buttonStyle || DefaultOptions.buttonStyle;
    this.supportedText = opt.supportedText || DefaultOptions.supportedText;
    this.notSupportedText =
      opt.notSupportedText || DefaultOptions.notSupportedText;
    this.buttonElement.onclick = () => {
      (opt.onRequestSession || DefaultOptions.onRequestSession)();
      this.status = Status.Running;
      this.updateView();
    };
    if (textStyle.trim() !== "")
      this.textElement.setAttribute("style", textStyle);
    if (buttonSytle.trim() !== "")
      this.buttonElement.setAttribute("style", buttonSytle);

    this.checkStatus();
  }

  private checkStatus(): void {
    if ("xr" in this._navigator) {
      this._navigator.xr
        .isSessionSupported("immersive-ar")
        .then((supported) => {
          if (supported) {
            this.status = Status.Ready;
            console.log("supported");
            this.updateView();
          } else {
            this.status = Status.NotSupported;
            console.log("not supported");
            this.updateView();
          }
        });
    } else {
      this.status = Status.NotSupported;
      console.log("not supported");
      this.updateView();
    }
  }

  private updateView(): void {
    switch (this.status) {
      case Status.Initializing:
        this.buttonElement.disabled = true;
        this.textElement.textContent = "...";
        break;
      case Status.Ready:
        this.buttonElement.disabled = false;
        this.textElement.textContent = this.supportedText;
        break;
      case Status.Running:
        this.buttonElement.style.display = "none";
        break;
      case Status.NotSupported:
        this.buttonElement.disabled = true;
        this.textElement.textContent = this.notSupportedText;
        break;
    }
  }
}

export { EntryButton };
customElements.define("entry-button", EntryButton as any);
