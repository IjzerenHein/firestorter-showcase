import { observable } from "mobx";
import { getFirebase, getFirebaseApp } from "firestorter";
import AuthUser from "./AuthUser";
import Operation from "../util/Operation";

/**
 * Interface for signing-up, logging-in and accessing the currently
 * logged in user.
 *
 * @example
 * await store.auth.signInWithEmailAndPassword('thatsme@gmail.com', '123456');
 */
class Auth {
  constructor() {
    const firebaseAuth = getFirebaseApp().auth();
    this._firebaseAuth = firebaseAuth;
    this._user = observable.box(
      firebaseAuth.user ? new AuthUser(firebaseAuth.user) : undefined
    );
    this._operation = new Operation();
    firebaseAuth.onAuthStateChanged(this._onAuthStateChanged);
  }

  /**
   * Operation that is currently in progress.
   * @type {Operation}
   *
   * For instance, when signing-up, this object will have the
   * `inProgress` property set to `true` and the `name` property
   * set to 'signUp'.
   */
  get operation() {
    return this._operation;
  }

  /**
   * @private
   * Called whenever the logged-in user changes in Firebase.
   * This function gets called when:
   * - A user signs-up
   * - A user logs-in
   * - A user logs-out
   * - The app starts-up and the log-in is restored
   */
  _onAuthStateChanged = user => {
    if (user) {
      if (!this._user.get()) {
        this._user.set(new AuthUser(user));
      } else {
        this._user.get().setFirebaseUser(user);
      }
    } else if (this._user.get()) {
      this._user.set(undefined);
    }
  };

  /**
   * Underlying firebase-auth reference.
   */
  get firebaseAuth() {
    return this._firebaseAuth;
  }

  /**
   * Id of the currently logged in user, or `undefined`.
   */
  get userId() {
    const { user } = this;
    return user ? user.uid : undefined;
  }

  /**
   * User that is currently logged in, or `undefined` when no-one
   * is logged in.
   *
   * On startup, this property will be briefly `undefined` until the
   * last login is restored.
   */
  get user() {
    return this._user.get();
  }

  /**
   * @deprecated, use `signUp` instead.
   */
  createUserWithEmailAndPassword(email, password, dontRemember) {
    return this.operation.start("createUserWithEmailAndPassword", async () => {
      if (this._firebaseAuth.setPersistence && getFirebase().auth.Auth) {
        await this._firebaseAuth.setPersistence(
          dontRemember
            ? getFirebase().auth.Auth.Persistence.NONE
            : getFirebase().auth.Auth.Persistence.LOCAL
        );
      }
      await this._firebaseAuth.createUserWithEmailAndPassword(email, password);
    });
  }

  /**
   * Signs-in using an email and a password.
   *
   * @param {String} email - Email-address to sign-in with
   * @param {String} password - Password to sign-in with
   * @return {Promise} Promise that is resolved upon completion
   */
  signInWithEmailAndPassword(email, password) {
    return this.operation.start("signInWithEmailAndPassword", () =>
      this.firebaseAuth.signInWithEmailAndPassword(email, password)
    );
  }

  /**
   * Signs the current user out.
   *
   * @return {Promise} Promise that is resolved upon completion
   */
  signOut() {
    return this.operation.start("signOut", () => this.firebaseAuth.signOut());
  }

  /**
   * Verifies a password reset code.
   *
   * @param {String} code - Code to verify
   * @return {Promise} Promise that is resolved upon completion
   */
  verifyPasswordResetCode(code) {
    return this.operation.start("verifyPasswordResetCode", () =>
      this.firebaseAuth.verifyPasswordResetCode(code)
    );
  }

  /**
   * Sends a password reset email.
   *
   * @param {String} email - E-mail to reset the password for
   * @param {String} [actionCodeSettings] - Action-code-settings
   * @return {Promise} Promise that is resolved upon completion
   */
  sendPasswordResetEmail(email, actionCodeSettings) {
    return this.operation.start("sendPasswordResetEmail", () =>
      this.firebaseAuth.sendPasswordResetEmail(email, actionCodeSettings)
    );
  }

  /**
   * Confirms a password reset.
   *
   * @param {String} code - The password reset code
   * @param {String} newPassword - The new password
   * @return {Promise} Promise that is resolved upon completion
   */
  confirmPasswordReset(code, newPassword) {
    return this.operation.start("confirmPasswordReset", () =>
      this.firebaseAuth.confirmPasswordReset(code, newPassword)
    );
  }

  /**
   * Confirms a verify email action code
   *
   * @param {String} code - Code to apply
   * @return {Promise} Promise that is resolved upon completion
   */
  confirmVerifyEmail(code) {
    return this.operation.start("confirmVerifyEmail", async () => {
      await this.firebaseAuth.applyActionCode(code);
      const { user } = this;
      if (user) {
        await user.reload(true);
      }
    });
  }
}

export default Auth;
