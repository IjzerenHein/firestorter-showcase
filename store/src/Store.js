import Auth from "./auth/Auth";

class Store {
  constructor() {
    this._auth = new Auth();
  }

  get auth() {
    return this._auth;
  }
}

export default Store;
