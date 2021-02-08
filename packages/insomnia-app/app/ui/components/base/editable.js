import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { autoBindMethodsForReact } from 'class-autobind-decorator';
import { AUTOBIND_CFG } from '../../../common/constants';
import KeydownBinder from '../keydown-binder';

export const shouldSave = (oldValue, newValue, preventBlank) => {
  // Should not save if length = 0 and we want to prevent blank
  if (preventBlank && !newValue.length) {
    return false;
  }

  // Should not save if old value and new value is the same
  if (oldValue === newValue) {
    return false;
  }

  // Should save
  return true;
};

@autoBindMethodsForReact(AUTOBIND_CFG)
class Editable extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      editing: false,
    };
  }

  _handleSetInputRef(n) {
    this._input = n;
  }

  _handleSingleClickEditStart() {
    if (this.props.singleClick) {
      this._handleEditStart();
    }
  }

  _handleEditStart() {
    this.setState({ editing: true });

    setTimeout(() => {
      this._input && this._input.focus();
      this._input && this._input.select();
    });

    if (this.props.onEditStart) {
      this.props.onEditStart();
    }
  }

  _handleEditEnd() {
    const originalValue = this.props.value;
    const newValue = this._input.value.trim();

    if (shouldSave(originalValue, newValue, this.props.preventBlank)) {
      // Don't run onSubmit for values that haven't been changed
      this.props.onSubmit(newValue);
    }

    // This timeout prevents the UI from showing the old value after submit.
    // It should give the UI enough time to redraw the new value.
    setTimeout(async () => this.setState({ editing: false }), 100);
  }

  _handleEditKeyDown(e) {
    if (e.keyCode === 13) {
      // Pressed Enter
      this._handleEditEnd();
    } else if (e.keyCode === 27) {
      // Pressed Escape

      // Prevent bubbling to modals and other escape listeners.
      e.stopPropagation();

      if (this._input) {
        // Set the input to the original value
        this._input.value = this.props.value;
        this._handleEditEnd();
      }
    }
  }

  render() {
    const {
      value,
      fallbackValue,
      blankValue,
      singleClick,
      onEditStart, // eslint-disable-line no-unused-vars
      preventBlank, // eslint-disable-line no-unused-vars
      className,
      renderReadView,
      ...extra
    } = this.props;
    const { editing } = this.state;
    const initialValue = value || fallbackValue;

    if (editing) {
      return (
        // KeydownBinder must be used here to properly stop propagation
        // from reaching other scoped KeydownBinders
        <KeydownBinder onKeydown={this._handleEditKeyDown} scoped>
          <input
            {...extra}
            className={`editable ${className || ''}`}
            type="text"
            ref={this._handleSetInputRef}
            defaultValue={initialValue}
            onBlur={this._handleEditEnd}
          />
        </KeydownBinder>
      );
    } else {
      const readViewProps = {
        className: `editable ${className} ${!initialValue && 'empty'}`,
        title: singleClick ? 'Click to edit' : 'Double click to edit',
        onClick: this._handleSingleClickEditStart,
        onDoubleClick: this._handleEditStart,
        ...extra,
      };

      if (renderReadView) {
        return renderReadView(initialValue, readViewProps);
      } else {
        return <span {...readViewProps}>{initialValue || blankValue}</span>;
      }
    }
  }
}

Editable.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  value: PropTypes.string.isRequired,

  // Optional
  fallbackValue: PropTypes.string,
  blankValue: PropTypes.string,
  renderReadView: PropTypes.func,
  singleClick: PropTypes.bool,
  onEditStart: PropTypes.func,
  className: PropTypes.string,
  preventBlank: PropTypes.bool,
};

export default Editable;
