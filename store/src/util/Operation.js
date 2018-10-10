import { observable, transaction } from "mobx";

/**
 * Operation.
 */
class Operation {
  constructor() {
    this._inProgress = observable.box(false);
    this._error = observable.box(undefined);
    this._name = observable.box("");
    this._progress = observable.box(0);
    this._startTime = observable.box(0);
    this._endTime = observable.box(0);
  }

  async start(name, fn, completionCallback) {
    if (this.inProgress)
      throw new Error(`Operation ${this._name.get()} is still in progress`);
    transaction(() => {
      this._name.set(name);
      this._progress.set(0);
      this._error.set(undefined);
      this._inProgress.set(true);
      this._startTime.set(Date.now());
    });
    try {
      const res = await fn(this._updateProgress);
      transaction(() => {
        this._progress.set(1);
        this._inProgress.set(false);
        this._error.set(undefined);
        this._endTime.set(Date.now());
        if (completionCallback) completionCallback();
      });
      return res;
    } catch (err) {
      transaction(() => {
        this._inProgress.set(false);
        this._endTime.set(Date.now());
        this._error.set(err);
      });
      throw err;
    }
  }

  get error() {
    return this._error.get();
  }

  clearError() {
    if (this.inProgress)
      throw new Error(
        `Cannot clear error while operation is in progress (${this._name.get()})`
      );
    this._error.set(undefined);
  }

  get inProgress() {
    return this._inProgress.get();
  }

  get name() {
    return this._name.get();
  }

  get progress() {
    return this._progress.get();
  }

  get startTime() {
    return this._startTime.get();
  }

  get endTime() {
    return this._endTime.get();
  }

  get expiredTime() {
    return Date.now() - Math.max(this.startTime, this.endTime);
  }

  _updateProgress = progress => {
    if (!this.inProgress)
      throw new Error(
        `Cannot update progress when no operation is in progress (${this._name.get()}, progress: ${progress})`
      );
    if (typeof progress !== "number")
      throw new Error(`Invalid progress specified (not a number): ${progress}`);
    if (progress < 0 || progress > 1)
      throw new Error(
        `Invalid progress specified (should be between 0 and 1): ${progress}`
      );
    this._progress.set(progress);
  };
}

export default Operation;
