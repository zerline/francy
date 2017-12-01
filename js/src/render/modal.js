import IDUtils from '../util/id-utils';
import Renderer from './renderer';

/* global d3, Jupyter */

export default class Modal extends Renderer {

  constructor({ verbose = false, appendTo, callbackHandler }) {
    super({ verbose: verbose, appendTo: appendTo, callbackHandler: callbackHandler });
  }

  render(json) {
    var self = this;

    var modalId = IDUtils.getWindowId(json.callback.id);
    this.logger.debug(`Creating Callback Modal [${modalId}]...`);

    // we want to overlay everything, hence 'body' must be used
    var overlay = d3.select('body').append('div')
      .attr('class', 'francy-overlay');
    var modal = d3.select('body').append('div')
      .attr('id', modalId)
      .attr('class', 'francy-modal');

    var form = modal.append('form');

    var header = form.append('div').attr('class', 'francy-modal-header');

    header.append('span').html('Required arguments for&nbsp;').append('span').attr('style', 'font-weight: bold;').text(json.title);

    var content = form.append('div').attr('class', 'francy-modal-content').append('div').attr('class', 'francy-table').append('div').attr('class', 'francy-table-body');

    for (var arg of Object.values(json.callback.requiredArgs)) {
      var row = content.append('div').attr('class', 'francy-table-row');
      row.append('div').attr('class', 'francy-table-cell').append('label').attr('for', arg.id).text(arg.title);
      row.append('div').attr('class', 'francy-table-cell').append('input').attr('id', arg.id).attr('class', 'francy-arg')
        .attr('required', '')
        .attr('name', arg.id)
        .attr('type', arg.type)
        .attr('value', arg.value)
        .on('change', function() { json.callback.requiredArgs[this.id].value = this.value; })
        .on('input', this.onchange)
        .on('keyup', this.onchange)
        .on('paste', this.onchange);
      row.append('span').attr('class', 'validity');
    }

    content.selectAll('.francy-arg').node().focus();

    var footer = form.append('div').attr('class', 'francy-modal-footer');

    footer.append('button').text('Ok').on('click', function() {
      if (form.node().checkValidity()) {
        self.options.callbackHandler(json.callback);
        overlay.remove();
        modal.remove();
        event.preventDefault();
      }
      return false;
    });
    footer.append('button').text('Cancel').on('click', () => {
      event.preventDefault();
      overlay.remove();
      modal.remove();
      return false;
    });

    // disable keyboard shortcuts when using this modal in Jupyter
    try {
      Jupyter.keyboard_manager.register_events('.francy-arg');
      Jupyter.keyboard_manager.register_events('.francy-overlay');
      Jupyter.keyboard_manager.register_events('.francy-modal');
    }
    catch (e) {
      if (e.name == 'ReferenceError') {
        self.logger.debug('It seems we\'re not running on Jupyter...', e);
      }
    }

    this.logger.debug(`Callback Modal updated [${modalId}]...`);

    return modal;
  }

  unrender() {}
}
