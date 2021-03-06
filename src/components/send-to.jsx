import React from 'react';
import Select from 'react-select';

const MY_FEED_LABEL = 'My feed';

export default class SendTo extends React.Component {
  constructor(props) {
    super(props);
    this.state = this.stateFromProps(props);
  }

  componentWillReceiveProps(newProps) {
    // If defaultFeed gets updated (it happens after sign-in), we have to
    // fully update state. Otherwise, only update options.
    if (this.props.defaultFeed !== newProps.defaultFeed) {
      this.setState(this.stateFromProps(newProps));
    } else {
      this.setState({options: this.optionsFromProps(newProps)});
    }
  }

  get values() {
    return this.state.values.map(item => item.value);
  }

  stateFromProps(props) {
    const options = this.optionsFromProps(props);
    return {
      values: options.filter(opt => opt.value === props.defaultFeed),
      options: options,
      showFeedsOption: !props.defaultFeed,
      isWarningDisplayed: false
    };
  }

  optionsFromProps({feeds, user: {username}, isDirects}) {
    const options = feeds.map(({user: {username, type}}) => ({
      label: username,
      value: username,
      type,
    }));

    options.sort((a, b) => (a.type !== b.type) ? a.type.localeCompare(b.type) : a.value.localeCompare(b.value));

    // use type "group" for "my feed" option to hide the warning about direct message visibility
    options.unshift({ label: MY_FEED_LABEL, value: username, type: 'group' });

    // only mutual friends on Directs page
    return isDirects ? options.filter(opt => opt.type === 'user') : options;
  }

  isGroupsOrDirectsOnly(values) {
    const types = {};
    for (const v of values) {
      types[v.type] = v;
    }
    return Object.keys(types).length <= 1;
  }

  selectChanged = (values) => {
    const isWarningDisplayed = !this.isGroupsOrDirectsOnly(values);
    this.setState({ values, isWarningDisplayed });
    this.props.onChange(values.map(item => item.value));
  }

  toggleSendTo = () => {
    const newShowFeedsOption = !this.state.showFeedsOption;
    this.setState({ showFeedsOption: newShowFeedsOption });
  }

  labelRenderer = (opt) => {
    const icon = (opt.type === 'group') ?
      ((opt.value !== this.props.user.username) ? <i className="fa fa-users" /> : <i className="fa fa-home" />)
      : false;
    return <span>{icon} {opt.label}</span>;
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.showFeedsOption !== this.state.showFeedsOption && this.state.showFeedsOption) {
      this.refs.selector._openAfterFocus = true;
      this.refs.selector.focus();
    }
  }

  render() {
    const defaultOpt = this.state.values[0];

    return (
      <div className="send-to">
        {!this.state.showFeedsOption && defaultOpt ? (
          <div>
            To:&nbsp;
            <span className="Select-value-label-standalone">{this.labelRenderer(defaultOpt)}</span>
            <a className="p-sendto-toggler" onClick={this.toggleSendTo}>Add/Edit</a>
          </div>
        ) : (
          <div>
            <Select
              name="select-feeds"
              placeholder={this.props.isDirects ? "Select friends..." : "Select feeds..."}
              value={this.state.values}
              options={this.state.options}
              onChange={this.selectChanged}
              optionRenderer={this.labelRenderer}
              valueRenderer={this.labelRenderer}
              ref="selector"
              multi={true}
              clearable={false} />
            {this.state.isWarningDisplayed ? (
              <div className="selector-warning">
                You are going to send a direct message and also post this message to a feed. This means that everyone who sees this feed will be able to see your message.
              </div>
            ) : false}
          </div>
        )}
      </div>
    );
  }
}
