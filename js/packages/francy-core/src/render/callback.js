import BaseRenderer from './base';
import ConfirmModal from './modal/confirm';
import { Decorators } from '../decorator/factory';
import RequiredArgsModal from './modal/required';

/**
 * CallbackHandler is responsible for handling Callbacks and display Modal windows accodingly.
 * Callbacks can have arguments, for which a Modal window will appear to request such input.
 * Callbacks can also show a confirmation message before arguments input / execution.
 * If a Callback does not require an argument and no confirmation message, 
 * then the Callback is executed immediately.
 */
export default class CallbackHandler extends BaseRenderer {

  /**
   * Base constructor
   * 
   * @typedef {Object} options
   * @property {Boolean} options.appendTo - where the generated html/svg components will be attached to, default body
   * @property {Function} options.callbackHandler - this handler will be used to invoke actions from the menu, default console.log
   * @param {Object} context - the context of the application, usually a configuration and a rendering manager instance
   */
  constructor({ appendTo, callbackHandler }, context) {
    super({ appendTo: appendTo, callbackHandler: callbackHandler }, context);
    /**
     * Stores the callback to execute
     * @type {function}
     */
    this.callback = callbackHandler;
  }

  /**
   * Runs callback function. If this callback is configured to get input from the user,
   * this will be prompt before execution.
   * 
   * @returns {object} the output from the callback function
   * @public 
   */
  @Decorators.Data.requires('callback')
  async execute() {
    let options = this.options;
    if (this.data.callback.confirm) {
      if (Object.keys(this.data.callback.requiredArgs).length) {
        options.callbackHandler = () => this._showRequiredModal.call(this);
      }
      return await this.handlePromise(this._showConfirmModal());
    } else if (Object.keys(this.data.callback.requiredArgs).length) {
      return await this.handlePromise(this._showRequiredModal.call(this));
    }
    // Trigger is the expected command on GAP for this event!
    return await this._execute(this.data.callback);
  }

  /**
   * Builds and shows a {ConfirmModal}
   * 
   * @private
   */
  async _showConfirmModal() {
    let options = this.options;
    if (Object.keys(this.data.callback.requiredArgs).length) {
      options.callbackHandler = () => this._showRequiredModal.call(this);
    }
    let modal = new ConfirmModal(options, this.context);
    return await this.handlePromise(modal.load(this.data, true).render());
  }

  /**
   * Builds and shows a {RequiredArgsModal}
   * 
   * @private
   */
  async _showRequiredModal() {
    let options = this.options;
    options.callbackHandler = o => this._execute.call(this, o);
    let modal = new RequiredArgsModal(options, this.context);
    return await this.handlePromise(modal.load(this.data, true).render());
  }

  /**
   * This method executes the callback with the result from the {RequiredArgsModal} 
   * modal windows if required
   * 
   * @param {object} object - the object to stringify and pass to the callback
   * @private
   */
  _execute(object) {
    // oh well, Trigger(<json>); is the entrypoint back to GAP 
      // while we don't support comms on the kernel:
    if (object.language == 'python') {
        var args = '';
        if (object.knownArgs && Array.isArray(object.knownArgs)) {
            if (object.funcscope == 'object' || object.funcscope == 'class') {
                args = "'" + object.knownArgs.slice(1).join("', '") + "'";
            }
            else {
                args = "'" + object.knownArgs.join("', '") + "'";
            }
        }
        var cmdline = '';
        if (object.funcscope == 'object' || object.funcscope == 'class') {
            cmdline = object.knownArgs[0] + '.' + object.funcname + '(' + args + ')';
        }
        else {
            cmdline = object.funcname + '(' + args + ')';
        }
    }
    else {
        cmdline = "Trigger(".concat(JSON.stringify(JSON.stringify(object)), ");");
    }
    console.log(cmdline);
    return this.callback(cmdline);

    //return this.callback(`Trigger(${JSON.stringify(JSON.stringify(object))});`);
  }
}
