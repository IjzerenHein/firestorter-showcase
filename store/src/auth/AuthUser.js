import { observable, transaction } from "mobx";
import Operation from "../util/Operation";

/**
 * User that is currently signed-in.
 */
class AuthUser {
  constructor(firebaseUser) {
    this._email = observable.box("");
    this._isEmailVerified = observable.box(false);
    this._phoneNumber = observable.box("");
    this._providerId = observable.box("");
    this._uid = observable.box("");
    this._operation = new Operation();
    this._isAdmin = observable.box(false);
    this.setFirebaseUser(firebaseUser);
  }

  setFirebaseUser(user, forceEmailVerifiedToTrueFix) {
    transaction(async () => {
      this._firebaseUser = user;
      this._email.set(user.email);
      this._isEmailVerified.set(
        user.emailVerified || forceEmailVerifiedToTrueFix
      );
      this._phoneNumber.set(user.phoneNumber);
      this._providerId.set(user.providerId);
      this._uid.set(user.uid);
      this.path = `users/${user.uid}`;
      if (this._firebaseUser.getIdTokenResult) {
        const isAdmin =
          (await this._firebaseUser.getIdTokenResult()).claims.admin || false;
        this._isAdmin.set(isAdmin);
      }
    });
  }

  get firebaseUser() {
    return this._firebaseUser;
  }

  /**
   * Reloads the firebase user data
   *
   * @param {Bool} [forceEmailVerifiedToTrueFix] - Hack to fix `emailVerified` never set to true after verifying email
   */
  async reload(forceEmailVerifiedToTrueFix) {
    await this._firebaseUser.reload();
    this.setFirebaseUser(this._firebaseUser, forceEmailVerifiedToTrueFix);
  }

  /**
   * Email-address.
   */
  get email() {
    return this._email.get();
  }

  /**
   * Status whether the e-mail address has been verified.
   * @type {Boolean}
   */
  get isEmailVerified() {
    return this._isEmailVerified.get();
  }

  /**
   * Optional phone number of the user.
   * @type {String}
   */
  get phoneNumber() {
    return this._phoneNumber.get();
  }

  /**
   * Id of the provider through which the user is logged in.
   */
  get providerId() {
    return this._providerId.get();
  }

  /**
   * Unique id of the user.
   */
  get id() {
    return this._uid.get();
  }

  get operation() {
    return this._operation;
  }

  /**
   * Updates the profile information of the user.
   *
   * @param {Object} profile - Profile information
   * @return {Promise} Promise that is resolved upon completion
   */
  updateProfile(profile) {
    return this.operation.start(
      "updateProfile",
      () => this._firebaseUser.updateProfile(profile),
      () => this.setFirebaseUser(this._firebaseUser)
    );
  }

  /**
   * Updates the password.
   *
   * @param {String} newPassword - New password
   * @return {Promise} Promise that is resolved upon completion
   */
  updatePassword(newPassword) {
    return this.operation.start("updatePassword", () =>
      this._firebaseUser.updatePassword(newPassword)
    );
  }

  /**
   * Updates the e-mail address.
   *
   * @param {String} newEmail - New e-mail address
   * @return {Promise} Promise that is resolved upon completion
   */
  updateEmail(newEmail) {
    return this.operation.start(
      "updateEmail",
      () => this._firebaseUser.updateEmail(newEmail),
      () => this.setFirebaseUser(this._firebaseUser)
    );
  }

  /* updatePhoneNumber(phoneCredential) {
    return this.operation.start(
      'updatePhoneNumber',
      () => this._firebaseUser.updatePhoneNumber(phoneCredential),
      () => this.setFirebaseUser(this._firebaseUser),
    );
  } */

  sendEmailVerification(actionCodeSettings) {
    return this.operation.start("sendEmailVerification", () =>
      this._firebaseUser.sendEmailVerification(actionCodeSettings)
    );
  }

  /**
   * Deletes the user
   *
   * @return {Promise} Promise that is resolved upon completion.
   */
  delete() {
    return this.operation.start("delete", () => this._firebaseUser.delete());
  }

  /**
   * Admin status of the user.
   * @type {Boolean}
   */
  get isAdmin() {
    return this._isAdmin.get();
  }
}

export default AuthUser;
